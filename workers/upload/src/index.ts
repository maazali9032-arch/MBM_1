/**
 * Cloudflare Worker — R2 image upload/delete pipeline
 *
 * Validates Supabase JWT + admin allowlist, enforces storage key patterns,
 * writes WEBP blobs to R2, and returns public CDN URLs.
 */

export interface Env {
  R2_BUCKET: R2Bucket;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  R2_PUBLIC_URL: string;
  /** Comma-separated list of allowed browser origins for CORS */
  ALLOWED_ORIGINS?: string;
}

const STORAGE_KEY_PATTERN = /^products\/[a-z0-9-]+\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+\.webp$/;

const corsHeaders = (origin: string | null, env: Env): Record<string, string> => {
  const allowed = (env.ALLOWED_ORIGINS || '*').split(',').map((o) => o.trim());
  const allowOrigin =
    allowed.includes('*') || (origin && allowed.includes(origin)) ? origin || '*' : allowed[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  };
};

const json = (body: unknown, status: number, origin: string | null, env: Env) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env) },
  });

async function verifyAdmin(
  request: Request,
  env: Env
): Promise<{ userId: string } | Response> {
  const origin = request.headers.get('Origin');
  const auth = request.headers.get('Authorization');

  if (!auth?.startsWith('Bearer ')) {
    return json({ error: 'Missing or invalid Authorization header' }, 401, origin, env);
  }

  const token = auth.slice(7);

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: env.SUPABASE_ANON_KEY,
    },
  });

  if (!userRes.ok) {
    return json({ error: 'Invalid or expired token' }, 401, origin, env);
  }

  const user = (await userRes.json()) as { id: string };

  const adminRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/admin_users?user_id=eq.${user.id}&select=user_id`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.SUPABASE_ANON_KEY,
      },
    }
  );

  if (!adminRes.ok) {
    return json({ error: 'Failed to verify admin status' }, 500, origin, env);
  }

  const admins = (await adminRes.json()) as { user_id: string }[];
  if (!Array.isArray(admins) || admins.length === 0) {
    return json({ error: 'Access denied: not in admin allowlist' }, 403, origin, env);
  }

  return { userId: user.id };
}

function validateStorageKey(key: string): boolean {
  return STORAGE_KEY_PATTERN.test(key);
}

async function handleUpload(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin');
  const authResult = await verifyAdmin(request, env);
  if (authResult instanceof Response) return authResult;

  const formData = await request.formData();
  const file = formData.get('file');
  const storageKey = formData.get('storageKey');

  if (!(file instanceof File)) {
    return json({ error: 'Missing file in form data' }, 400, origin, env);
  }
  if (typeof storageKey !== 'string' || !validateStorageKey(storageKey)) {
    return json(
      { error: 'Invalid storageKey. Expected: products/{categorySlug}/{productId}/{uuid}.webp' },
      400,
      origin,
      env
    );
  }

  if (!file.type.startsWith('image/')) {
    return json({ error: 'Only image files are allowed' }, 400, origin, env);
  }

  await env.R2_BUCKET.put(storageKey, file.stream(), {
    httpMetadata: { contentType: file.type || 'image/webp' },
  });

  const publicUrl = `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${storageKey}`;
  return json({ publicUrl, storageKey }, 200, origin, env);
}

async function handleDelete(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin');
  const authResult = await verifyAdmin(request, env);
  if (authResult instanceof Response) return authResult;

  let body: { storageKey?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400, origin, env);
  }

  const { storageKey } = body;
  if (!storageKey || !validateStorageKey(storageKey)) {
    return json({ error: 'Invalid storageKey' }, 400, origin, env);
  }

  await env.R2_BUCKET.delete(storageKey);
  return json({ success: true, storageKey }, 200, origin, env);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    if (request.method === 'POST' && url.pathname === '/upload') {
      return handleUpload(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/delete') {
      return handleDelete(request, env);
    }

    return json({ error: 'Not found' }, 404, origin, env);
  },
};

/**
 * One canonical public route for every collection filter.
 * Keeping category links in this form prevents the app from mixing the
 * legacy `/collections/:slug` pages with the filtered collections page.
 */
const categoryIdBySlug: Record<string, string> = {
  sherwanis: 'sherwani',
  suits: 'suit',
  bandgalas: 'bandgala',
  jodhpuris: 'jodhpuri',
  'kurta-pajamas': 'kurta',
  'nehru-jackets': 'nehru',
  formals: 'formal',
  pathanis: 'pathani',
};

export function collectionFilterPath(category: string): string {
  const filter = categoryIdBySlug[category] ?? category;
  return `/collections?category=${encodeURIComponent(filter)}`;
}

export const allCollectionsPath = '/collections';

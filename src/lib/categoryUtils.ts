/** Fixed crop dimensions for all catalogue product images (2:3 portrait) */
export const FIXED_CROP_SETTINGS = {
  aspectRatio: 0.67,
  width: 800,
  height: 1200,
};

/** Generate a 3-letter code prefix from first + middle + last letters of the name */
export function generateCodePrefix(name: string): string {
  const letters = name.replace(/[^a-zA-Z]/g, '');
  if (!letters) return '';
  if (letters.length === 1) return letters.toUpperCase();
  if (letters.length === 2) return letters.toUpperCase();
  const first = letters[0];
  const middle = letters[Math.floor(letters.length / 2)];
  const last = letters[letters.length - 1];
  return (first + middle + last).toUpperCase();
}

/** Next display order = max existing + 1 */
export function nextDisplayOrder(categories: { display_order: number }[]): number {
  if (!categories.length) return 1;
  return Math.max(...categories.map((c) => c.display_order)) + 1;
}

/*
 * Product categories are stored (and filtered by the backend) as the
 * canonical English values below. They are only translated for display,
 * and unknown/custom values fall back to the raw stored value.
 */
export const PRODUCT_CATEGORIES = [
  "Beauty",
  "Gifts",
  "Accessories",
  "Other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export function isKnownCategory(value: string): boolean {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value);
}

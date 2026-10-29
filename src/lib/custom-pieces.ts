/**
 * Custom commission pieces and their price ranges (USD).
 *
 * Single source for the /customs page price list, its Service structured data,
 * and the ContactForm "piece type" options — change prices here only.
 */

export type CustomPiece = {
  value: string;
  name: string;
  minPrice: number;
  maxPrice: number;
};

export const CUSTOM_PIECES: readonly CustomPiece[] = [
  { value: "fanny-pack", name: "Fanny Pack", minPrice: 85, maxPrice: 115 },
  {
    value: "cropped-flannel",
    name: "Cropped Flannel",
    minPrice: 110,
    maxPrice: 145,
  },
  {
    value: "cropped-military-jacket",
    name: "Cropped Military Jacket",
    minPrice: 195,
    maxPrice: 245,
  },
  {
    value: "full-length-military-jacket",
    name: "Full Length Military Jacket",
    minPrice: 195,
    maxPrice: 245,
  },
  { value: "vest", name: "Vest", minPrice: 285, maxPrice: 350 },
];

export function formatPriceRange({ minPrice, maxPrice }: CustomPiece) {
  return `$${minPrice}–$${maxPrice}`;
}

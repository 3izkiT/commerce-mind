export const PRICES = {
  single: 29,
  pro: 149,
  buffet: 590,
} as const;

export type PackageType = keyof typeof PRICES;

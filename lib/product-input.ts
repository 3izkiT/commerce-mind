export const MIN_TEXT_LENGTH = 10;
export const MIN_URL_LENGTH = 15;

export function isProductUrl(input: string): boolean {
  const trimmed = input.trim();
  return /^https?:\/\/.+/i.test(trimmed);
}

export function isValidProductInput(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;

  if (isProductUrl(trimmed)) {
    try {
      new URL(trimmed);
      return trimmed.length >= MIN_URL_LENGTH;
    } catch {
      return false;
    }
  }

  return trimmed.length >= MIN_TEXT_LENGTH;
}

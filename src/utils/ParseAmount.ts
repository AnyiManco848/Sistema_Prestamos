/**
 * Parses a loan amount typed by the user. Dots and commas are always treated as
 * thousands separators (never as decimal marks), so "1.000", "1,000" and "1000"
 * all become 1000, and "5.000.000" becomes 5000000.
 */
export function parseAmount(input: string): number {
  const digitsOnly = input.replace(/[.,]/g, '').trim();

  if (digitsOnly === '' || !/^\d+$/.test(digitsOnly)) {
    throw new Error('Error: Amount must be a valid number.');
  }

  return parseInt(digitsOnly, 10);
}

/**
 * Format price in paise into INR currency format (e.g., ₹1,500.00)
 */
export function formatINR(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

/**
 * Formats a high-precision numeric quantity by stripping trailing decimal zeros,
 * and appends the appropriate unit.
 */
export function formatQuantity(quantity: number | string, unit: string): string {
  const num = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
  if (isNaN(num)) return `0 ${unit}`;
  
  // Strip trailing zeros after parsing up to 6 decimal places
  const formatted = parseFloat(num.toFixed(6)).toString();
  return `${formatted} ${unit}`;
}

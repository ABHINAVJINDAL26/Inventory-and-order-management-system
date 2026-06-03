// Conversion factors: "1 X = ? base_unit"
export const CONVERSION_TO_BASE: Record<string, Record<string, number>> = {
  weight: {
    g: 1,
    kg: 1000,
  },
  volume: {
    mL: 1,
    L: 1000,
  },
  count: {
    unit: 1,
  },
};

// Which dimension does each unit belong to?
export const UNIT_DIMENSION: Record<string, string> = {
  g: 'weight',
  kg: 'weight',
  mL: 'volume',
  L: 'volume',
  unit: 'count',
};

// Convert any quantity to the dimension's base unit (g, mL, or unit)
export function toBaseUnit(quantity: number, fromUnit: string): number {
  const dim = UNIT_DIMENSION[fromUnit];
  if (!dim) return quantity;
  const factor = CONVERSION_TO_BASE[dim][fromUnit];
  return quantity * factor;
}

// Convert quantity from base unit back to a specific target unit
export function fromBaseUnit(baseQuantity: number, targetUnit: string): number {
  const dim = UNIT_DIMENSION[targetUnit];
  if (!dim) return baseQuantity;
  const factor = CONVERSION_TO_BASE[dim][targetUnit];
  return baseQuantity / factor;
}

// Get all units that share the same dimension as the base unit
export function getSupportedUnits(baseUnit: string): string[] {
  const dim = UNIT_DIMENSION[baseUnit];
  if (!dim) return [baseUnit];
  return Object.keys(CONVERSION_TO_BASE[dim]);
}

// Live calculation: ordered_quantity in any unit -> price in paise
export function calculateLineTotalPaise(
  orderedQty: number,
  orderedUnit: string,
  pricePerBaseUnitPaise: number
): number {
  const baseQty = toBaseUnit(orderedQty, orderedUnit);
  // Using Math.round to handle floating point issues and ensure we get a clean integer
  return Math.round(baseQty * pricePerBaseUnitPaise);
}

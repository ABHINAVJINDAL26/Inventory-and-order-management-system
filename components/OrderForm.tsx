'use client';

import { useState, useEffect } from 'react';
import { X, Calculator, AlertCircle, Check } from 'lucide-react';
import { getSupportedUnits, calculateLineTotalPaise, toBaseUnit } from '@/lib/unitConversion';
import { formatINR, formatQuantity } from '@/lib/priceCalculator';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  baseUnit: 'g' | 'kg' | 'mL' | 'L' | 'unit';
  stockQuantity: string;
  pricePerBaseUnitPaise: number;
}

interface OrderFormProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OrderForm({ product, onClose, onSuccess }: OrderFormProps) {
  const [orderedUnit, setOrderedUnit] = useState<string>('');
  const [quantityInput, setQuantityInput] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Set default unit when product changes
  useEffect(() => {
    if (product) {
      const units = getSupportedUnits(product.baseUnit);
      setOrderedUnit(units[0] || product.baseUnit);
      setQuantityInput('1');
      setNotes('');
      setError(null);
      setSuccess(false);
    }
  }, [product]);

  if (!product) return null;

  const supportedUnits = getSupportedUnits(product.baseUnit);
  const qty = parseFloat(quantityInput) || 0;

  // Real-time calculations
  const baseQuantity = toBaseUnit(qty, orderedUnit);
  const lineTotalPaise = calculateLineTotalPaise(qty, orderedUnit, product.pricePerBaseUnitPaise);
  const maxAvailableBase = parseFloat(product.stockQuantity);
  const isOutOfStock = baseQuantity > maxAvailableBase || qty <= 0;

  // Price formatting helper
  const rateInSelectedUnit = product.pricePerBaseUnitPaise * toBaseUnit(1, orderedUnit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOutOfStock) {
      setError('Insufficient stock for the requested quantity.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              productId: product.id,
              orderedUnit,
              orderedQuantity: qty,
            },
          ],
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place the order.');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 p-6">
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-200">Create Quotation</h3>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Check className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-semibold text-gray-200">Quotation Submitted!</h4>
            <p className="mt-2 text-sm text-gray-400">Your quotation request has been placed successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Product Details */}
            <div className="rounded-xl bg-gray-950/50 p-4 border border-gray-800/50">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-200 text-base">{product.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">SKU: {product.sku || 'N/A'}</p>
                </div>
                <span className="inline-flex items-center rounded-md bg-blue-400/10 px-2 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-400/20">
                  {product.category || 'General'}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-800/80 pt-3 text-xs">
                <div>
                  <p className="text-gray-500">Available Stock</p>
                  <p className="font-medium text-gray-300 mt-0.5">
                    {formatQuantity(product.stockQuantity, product.baseUnit)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Base Unit Rate</p>
                  <p className="font-medium text-gray-300 mt-0.5">
                    {formatINR(product.pricePerBaseUnitPaise)} / {product.baseUnit}
                  </p>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Quantity</label>
                <input
                  type="number"
                  min="0.000001"
                  step="any"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Unit</label>
                <select
                  value={orderedUnit}
                  onChange={(e) => setOrderedUnit(e.target.value)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {supportedUnits.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Pricing Breakdown */}
            <div className="rounded-xl bg-gray-950/80 p-4 border border-blue-500/10 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Effective Rate</span>
                <span className="font-medium text-gray-300">{formatINR(rateInSelectedUnit)} per {orderedUnit}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Converted Qty</span>
                <span className="font-medium text-gray-300">{formatQuantity(baseQuantity, product.baseUnit)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-800/80 pt-2 text-sm font-semibold">
                <span className="text-gray-200">Total Price (INR)</span>
                <span className="text-blue-400">{formatINR(lineTotalPaise)}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Special Instructions / Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter shipping details or special instructions..."
                rows={2}
                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600 resize-none"
              />
            </div>

            {/* Stock Warning/Errors */}
            {error && (
              <div className="flex items-center space-x-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {isOutOfStock && !error && qty > 0 && (
              <div className="flex items-center space-x-2 rounded-lg bg-yellow-500/10 p-3 text-xs text-yellow-400 border border-yellow-500/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Insufficient Stock! Requested: {formatQuantity(baseQuantity, product.baseUnit)}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || isOutOfStock}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:shadow-none transition-all duration-300"
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

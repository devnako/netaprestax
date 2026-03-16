export function computeLineTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export interface VatBreakdownEntry {
  rate: number;
  base: number;
  amount: number;
}

export interface DocumentTotals {
  totalHT: number;
  vatBreakdown: VatBreakdownEntry[];
  totalTVA: number;
  totalTTC: number;
}

export function computeDocumentTotals(
  lines: Array<{ quantity: number; unitPrice: number; vatRate: number | null }>,
  tvaAssujetti: boolean
): DocumentTotals {
  let totalHT = 0;
  const vatMap = new Map<number, { base: number; amount: number }>();

  for (const line of lines) {
    const lineHT = computeLineTotal(line.quantity, line.unitPrice);
    totalHT += lineHT;

    if (tvaAssujetti && line.vatRate !== null) {
      const rate = line.vatRate;
      const existing = vatMap.get(rate) || { base: 0, amount: 0 };
      existing.base += lineHT;
      existing.amount += Math.round(lineHT * rate * 100) / 10000;
      vatMap.set(rate, existing);
    }
  }

  totalHT = Math.round(totalHT * 100) / 100;

  const vatBreakdown: VatBreakdownEntry[] = [];
  let totalTVA = 0;
  for (const [rate, { base, amount }] of vatMap) {
    const roundedAmount = Math.round(amount * 100) / 100;
    vatBreakdown.push({ rate, base: Math.round(base * 100) / 100, amount: roundedAmount });
    totalTVA += roundedAmount;
  }
  vatBreakdown.sort((a, b) => a.rate - b.rate);
  totalTVA = Math.round(totalTVA * 100) / 100;

  return {
    totalHT,
    vatBreakdown,
    totalTVA,
    totalTTC: Math.round((totalHT + totalTVA) * 100) / 100,
  };
}

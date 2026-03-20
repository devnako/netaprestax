"use client";

import { Plus, Trash2 } from "lucide-react";

interface LineItem {
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
}

interface Props {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
  tvaAssujetti: boolean;
  hideTotals?: boolean;
}

const formatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function LineItemsEditor({ lines, onChange, tvaAssujetti, hideTotals }: Props) {
  const handleLineChange = (index: number, field: keyof LineItem, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    onChange(newLines);
  };

  const handleDeleteLine = (index: number) => {
    const newLines = lines.filter((_, i) => i !== index);
    onChange(newLines);
  };

  const handleAddLine = () => {
    const newLines = [
      ...lines,
      { description: "", quantity: "1", unitPrice: "0", vatRate: "20" },
    ];
    onChange(newLines);
  };

  const calculateLineTotal = (quantity: string, unitPrice: string): number => {
    const q = parseFloat(quantity) || 0;
    const p = parseFloat(unitPrice) || 0;
    return q * p;
  };

  const calculateTotalHT = (): number => {
    return lines.reduce((sum, line) => {
      return sum + calculateLineTotal(line.quantity, line.unitPrice);
    }, 0);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header */}
          <div className="hidden sm:flex items-center gap-3 mb-3 px-3 py-2 bg-muted rounded-lg">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground">
                Description
              </label>
            </div>
            <div className="w-20">
              <label className="text-xs font-medium text-muted-foreground">Qté</label>
            </div>
            <div className="w-28">
              <label className="text-xs font-medium text-muted-foreground">
                Prix unit. HT
              </label>
            </div>
            {tvaAssujetti && (
              <div className="w-24">
                <label className="text-xs font-medium text-muted-foreground">TVA</label>
              </div>
            )}
            <div className="w-24 text-right">
              <label className="text-xs font-medium text-muted-foreground">Total HT</label>
            </div>
            <div className="w-10"></div>
          </div>

          {/* Lines */}
          <div className="space-y-4">
            {lines.map((line, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 p-3 border border-border rounded-lg"
              >
                <div className="flex-1">
                  <label className="sm:hidden text-xs font-medium text-muted-foreground">
                    Description
                  </label>
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => handleLineChange(index, "description", e.target.value)}
                    placeholder="Description"
                    className="mt-1 sm:mt-0 w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="w-full sm:w-20">
                  <label className="sm:hidden text-xs font-medium text-muted-foreground">
                    Qté
                  </label>
                  <input
                    type="number"
                    value={line.quantity}
                    onChange={(e) => handleLineChange(index, "quantity", e.target.value)}
                    placeholder="1"
                    className="mt-1 sm:mt-0 w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="w-full sm:w-28">
                  <label className="sm:hidden text-xs font-medium text-muted-foreground">
                    Prix unit. HT
                  </label>
                  <div className="mt-1 sm:mt-0 relative">
                    <input
                      type="number"
                      value={line.unitPrice}
                      onChange={(e) => handleLineChange(index, "unitPrice", e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-border px-3 py-2 pr-6 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                      €
                    </span>
                  </div>
                </div>

                {tvaAssujetti && (
                  <div className="w-full sm:w-24">
                    <label className="sm:hidden text-xs font-medium text-muted-foreground">
                      TVA
                    </label>
                    <select
                      value={line.vatRate}
                      onChange={(e) => handleLineChange(index, "vatRate", e.target.value)}
                      className="mt-1 sm:mt-0 w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="5.5">5.5%</option>
                      <option value="10">10%</option>
                      <option value="20">20%</option>
                    </select>
                  </div>
                )}

                <div className="w-full sm:w-24 text-right">
                  <label className="sm:hidden text-xs font-medium text-muted-foreground">
                    Total HT
                  </label>
                  <div className="mt-1 sm:mt-0 font-semibold text-foreground text-sm">
                    {formatter.format(calculateLineTotal(line.quantity, line.unitPrice))}
                  </div>
                </div>

                <div className="w-full sm:w-10 flex justify-end">
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteLine(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Supprimer la ligne"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Line Button */}
      <button
        type="button"
        onClick={handleAddLine}
        className="text-sm text-primary hover:underline flex items-center gap-1"
      >
        <Plus size={16} />
        Ajouter une ligne
      </button>

      {/* Totals */}
      {!hideTotals && <div className="flex justify-end pt-4 border-t border-border">
        <div className="text-right space-y-1">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Total HT</p>
            <p className={`font-bold text-foreground ${tvaAssujetti ? "text-base" : "text-lg"}`}>
              {formatter.format(calculateTotalHT())}
            </p>
          </div>
          {tvaAssujetti && (() => {
            const totalHT = calculateTotalHT();
            const totalVAT = lines.reduce((sum, line) => {
              const ht = calculateLineTotal(line.quantity, line.unitPrice);
              const rate = parseFloat(line.vatRate) || 0;
              return sum + ht * rate / 100;
            }, 0);
            if (totalVAT <= 0) return null;
            return (
              <>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">TVA</p>
                  <p className="text-sm text-foreground">{formatter.format(totalVAT)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Total TTC</p>
                  <p className="text-lg font-bold text-primary">{formatter.format(totalHT + totalVAT)}</p>
                </div>
              </>
            );
          })()}
        </div>
      </div>}
    </div>
  );
}

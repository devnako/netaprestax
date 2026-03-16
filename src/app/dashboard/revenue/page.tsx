"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Plus, Calculator } from "lucide-react";
import { MonthPicker, MONTH_NAMES } from "@/components/dashboard/month-picker";

interface RevenueEntry {
  id: string;
  amount: string;
  description: string | null;
  activityType: string | null;
  createdAt: string;
}

const ACTIVITY_OPTIONS = [
  { value: "BIC_VENTE", label: "Vente de marchandises" },
  { value: "BIC_PRESTATION", label: "Prestation de services (BIC)" },
  { value: "BNC_LIBERAL_URSSAF", label: "Profession libérale (URSSAF)" },
  { value: "BNC_LIBERAL_CIPAV", label: "Profession libérale (CIPAV)" },
];

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}


export default function RevenuePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [defaultActivityType, setDefaultActivityType] = useState<string>("BIC_PRESTATION");

  // Form
  const [amount, setAmount] = useState("");
  const [activityType, setActivityType] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculator
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcLines, setCalcLines] = useState<Array<{ label: string; value: string }>>([
    { label: "", value: "" },
  ]);

  const isCurrentOrFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);

  const loadRevenues = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/revenue?month=${month}&year=${year}`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data.revenues);
      setTotal(data.total);
      if (data.defaultActivityType) {
        setDefaultActivityType(data.defaultActivityType);
        if (!activityType) setActivityType(data.defaultActivityType);
      }
    }
    setLoading(false);
  }, [month, year]);

  useEffect(() => {
    loadRevenues();
  }, [loadRevenues]);

  const handleMonthChange = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/revenue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(amount),
        month,
        year,
        description: description || null,
        activityType: activityType || defaultActivityType,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Erreur");
      setSaving(false);
      return;
    }

    setAmount("");
    setDescription("");
    setActivityType(defaultActivityType);
    setSaving(false);
    loadRevenues();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/revenue?id=${id}`, { method: "DELETE" });
    loadRevenues();
  };

  // Calculator logic
  const calcTotal = calcLines.reduce((sum, line) => {
    const val = parseFloat(line.value);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const addCalcLine = () => {
    setCalcLines([...calcLines, { label: "", value: "" }]);
  };

  const updateCalcLine = (index: number, field: "label" | "value", val: string) => {
    const updated = [...calcLines];
    updated[index][field] = val;
    setCalcLines(updated);
  };

  const removeCalcLine = (index: number) => {
    if (calcLines.length <= 1) return;
    setCalcLines(calcLines.filter((_, i) => i !== index));
  };

  const useCalcTotal = () => {
    setAmount(calcTotal.toFixed(2));
    const labels = calcLines
      .filter((l) => l.label && parseFloat(l.value))
      .map((l) => l.label)
      .join(", ");
    if (labels) setDescription(labels);
    setCalcOpen(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Revenus</h1>
      <MonthPicker month={month} year={year} onChange={handleMonthChange} />

      {/* Total CA */}
      <div className="rounded-2xl border border-accent bg-accent/5 p-6 text-center">
        <p className="text-sm text-muted-foreground">CA du mois</p>
        <p className="mt-1 text-3xl font-bold text-accent">
          {loading ? "..." : formatEuro(total)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {entries.length} entrée{entries.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Add form */}
      {!isCurrentOrFuture && (
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Ajouter un revenu</h2>
            <button
              onClick={() => setCalcOpen(!calcOpen)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                calcOpen
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calculator className="h-4 w-4" />
              Calculatrice
            </button>
          </div>

          {/* Mini calculator */}
          {calcOpen && (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium text-foreground">Additionne tes prestations</p>
              <div className="mt-3 space-y-2">
                {calcLines.map((line, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Label"
                      value={line.label}
                      onChange={(e) => updateCalcLine(i, "label", e.target.value)}
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={line.value}
                      onChange={(e) => updateCalcLine(i, "value", e.target.value)}
                      className="w-28 rounded-lg border border-border px-3 py-2 text-right text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                    <span className="text-sm text-muted-foreground">€</span>
                    {calcLines.length > 1 && (
                      <button
                        onClick={() => removeCalcLine(i)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addCalcLine}
                className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter une ligne
              </button>
              <div className="mt-3 flex items-center justify-between border-t border-primary/20 pt-3">
                <span className="text-sm font-semibold text-foreground">
                  Total : {formatEuro(calcTotal)}
                </span>
                <button
                  onClick={useCalcTotal}
                  disabled={calcTotal <= 0}
                  className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Utiliser ce montant
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleAdd} className="mt-4 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={activityType || defaultActivityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-56 sm:shrink-0"
              >
                {ACTIVITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Description (ex: Mission client X)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="relative w-full sm:w-32 sm:shrink-0">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="block w-full rounded-lg border border-border px-3 py-2.5 pr-8 text-right font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || !amount}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {saving ? "Enregistrement..." : "Ajouter"}
            </button>
          </form>
        </div>
      )}

      {/* Entries list */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="font-semibold text-foreground">
          Entrées — {MONTH_NAMES[month - 1]} {year}
        </h2>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Chargement...</p>
        ) : entries.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Aucun revenu enregistré ce mois-ci.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {entry.description || "Revenu"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ACTIVITY_OPTIONS.find((a) => a.value === (entry.activityType || defaultActivityType))?.label ?? "—"}
                    {" · "}
                    {new Date(entry.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">
                    {formatEuro(Number(entry.amount))}
                  </span>
                  {!isCurrentOrFuture && (
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

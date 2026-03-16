"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Trash2, Plus } from "lucide-react";

const CATEGORIES = [
  { value: "LOGICIEL", label: "Logiciel / Abonnement" },
  { value: "TRANSPORT", label: "Transport / Essence" },
  { value: "MATERIEL", label: "Matériel" },
  { value: "TELEPHONE", label: "Téléphone / Internet" },
  { value: "BUREAU", label: "Bureau / Coworking" },
  { value: "FORMATION", label: "Formation" },
  { value: "ASSURANCE", label: "Assurance" },
  { value: "AUTRE", label: "Autre" },
];

interface Expense {
  id: string;
  amount: number;
  category: string;
  label: string;
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export default function ExpensesPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("AUTRE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCurrentOrFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/expenses?month=${month}&year=${year}`);
    if (res.ok) {
      setExpenses(await res.json());
    }
    setLoading(false);
  }, [month, year]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const goToPrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(amount),
        category,
        label,
        month,
        year,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Erreur");
      setSaving(false);
      return;
    }

    setLabel("");
    setAmount("");
    setCategory("AUTRE");
    setSaving(false);
    loadExpenses();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    loadExpenses();
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Frais</h1>
        <div className="flex items-center gap-2">
          <button onClick={goToPrev} className="rounded-lg border border-border p-2 hover:bg-white">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[10rem] text-center font-semibold">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button
            onClick={goToNext}
            disabled={isCurrentOrFuture}
            className="rounded-lg border border-border p-2 hover:bg-white disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="rounded-2xl border border-orange-300 bg-orange-50 p-6 text-center">
        <p className="text-sm text-muted-foreground">Total frais du mois</p>
        <p className="mt-1 text-3xl font-bold text-orange-600">
          {loading ? "..." : formatEuro(total)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {expenses.length} frais enregistré{expenses.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Category breakdown */}
      {Object.keys(byCategory).length > 1 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, catTotal]) => (
              <div key={cat} className="rounded-xl border border-border bg-white p-4">
                <p className="text-xs text-muted-foreground">
                  {CATEGORIES.find((c) => c.value === cat)?.label}
                </p>
                <p className="mt-1 font-semibold text-foreground">{formatEuro(catTotal)}</p>
              </div>
            ))}
        </div>
      )}

      {/* Add form */}
      {!isCurrentOrFuture && (
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-semibold text-foreground">Ajouter un frais</h2>

          {error && (
            <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleAdd} className="mt-4 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-48 sm:shrink-0"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Description (ex: ChatGPT Pro)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
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
              disabled={saving || !amount || !label}
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
          Frais — {MONTH_NAMES[month - 1]} {year}
        </h2>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Chargement...</p>
        ) : expenses.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Aucun frais enregistré ce mois-ci.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{expense.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {CATEGORIES.find((c) => c.value === expense.category)?.label}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">{formatEuro(expense.amount)}</span>
                  {!isCurrentOrFuture && (
                    <button
                      onClick={() => handleDelete(expense.id)}
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

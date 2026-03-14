"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

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

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("AUTRE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];

  const loadExpenses = useCallback(async () => {
    const res = await fetch(
      `/api/expenses?month=${now.getMonth() + 1}&year=${now.getFullYear()}`
    );
    if (res.ok) {
      const data = await res.json();
      setExpenses(data);
    }
  }, [now.getMonth(), now.getFullYear()]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(amount),
        category,
        label,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Erreur");
      setLoading(false);
      return;
    }

    setLabel("");
    setAmount("");
    setCategory("AUTRE");
    setLoading(false);
    loadExpenses();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    loadExpenses();
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Frais réels</h1>
          <p className="mt-1 text-muted-foreground">
            {monthNames[now.getMonth()]} {now.getFullYear()}
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Voir mon net
        </button>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="mt-6 rounded-xl border border-border bg-white p-6">
        <h2 className="font-semibold text-foreground">Ajouter un frais</h2>

        {error && (
          <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-foreground">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border px-3 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-foreground">Description</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-border px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Ex: ChatGPT"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Montant</label>
            <div className="relative mt-1">
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="block w-full rounded-lg border border-border px-3 py-2.5 pr-8 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Ajouter
            </button>
          </div>
        </div>
      </form>

      {/* Expenses list */}
      {expenses.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-white">
          <div className="divide-y divide-border">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-foreground">{expense.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {CATEGORIES.find((c) => c.value === expense.category)?.label}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-foreground">{expense.amount.toFixed(2)} €</span>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Total frais</span>
              <span className="text-lg font-bold text-foreground">{total.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

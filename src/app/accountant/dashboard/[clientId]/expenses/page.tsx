"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MonthPicker } from "@/components/dashboard/month-picker";

interface Expense {
  id: string;
  label: string;
  amount: number;
  category: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  LOGICIEL: "Logiciel",
  TRANSPORT: "Transport",
  MATERIEL: "Matériel",
  TELEPHONE: "Téléphone",
  BUREAU: "Bureau",
  FORMATION: "Formation",
  ASSURANCE: "Assurance",
  AUTRE: "Autre",
};

export default function ExpensesPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/accountant/${clientId}/expenses?month=${month}&year=${year}`
        );
        if (res.ok) {
          const data = await res.json();
          setExpenses(data);
        }
      } catch (err) {
        console.error("Failed to fetch expenses");
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [clientId, month, year]);

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Frais</h1>
      </div>

      <MonthPicker
        month={month}
        year={year}
        onChange={(m, y) => {
          setMonth(m);
          setYear(y);
        }}
      />

      {!loading && expenses.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm text-muted-foreground">Total du mois</p>
          <p className="text-2xl font-bold text-foreground">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(total)}
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center text-muted-foreground">Chargement...</div>
      )}

      {!loading && expenses.length === 0 && (
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <p className="text-muted-foreground">Aucun frais ce mois-ci</p>
        </div>
      )}

      {!loading && expenses.length > 0 && (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div key={expense.id} className="rounded-lg border border-border bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    }).format(Number(expense.amount))}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {expense.label}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  {CATEGORY_LABELS[expense.category] || expense.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

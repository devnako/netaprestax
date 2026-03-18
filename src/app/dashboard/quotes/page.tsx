"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/invoicing/status-badge";
import { MonthPicker } from "@/components/dashboard/month-picker";

interface QuoteLine {
  quantity: number;
  unitPrice: number;
}

interface Quote {
  id: string;
  number: string;
  clientId: string;
  client: {
    name: string;
  };
  status: string;
  createdAt: string;
  lines: QuoteLine[];
  invoiceId: string | null;
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value);
}

export default function QuotesPage() {
  const router = useRouter();
  const now = new Date();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("TOUS");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const tabs = [
    { value: "TOUS", label: "Tous" },
    { value: "DRAFT", label: "Brouillon" },
    { value: "SENT", label: "Envoyé" },
    { value: "ACCEPTED", label: "Accepté" },
    { value: "REFUSED", label: "Refusé" },
  ];

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/quotes");
    if (res.ok) {
      setQuotes(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const computeTotalHT = (lines: QuoteLine[]): number => {
    return lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  };

  const handleMonthChange = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
  };

  const handleDelete = async (e: React.MouseEvent, quoteId: string) => {
    e.stopPropagation();
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")) return;

    const res = await fetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
    if (res.ok) {
      setQuotes((prev) => prev.filter((q) => q.id !== quoteId));
    }
  };

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const d = new Date(q.createdAt);
      if (d.getMonth() + 1 !== month || d.getFullYear() !== year) return false;
      if (filter !== "TOUS" && q.status !== filter) return false;
      return true;
    });
  }, [quotes, month, year, filter]);

  const monthTotal = useMemo(() => {
    return filteredQuotes.reduce((sum, q) => sum + computeTotalHT(q.lines), 0);
  }, [filteredQuotes]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Devis</h1>
        <a
          href="/dashboard/quotes/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nouveau devis
        </a>
      </div>

      <MonthPicker
        month={month}
        year={year}
        onChange={handleMonthChange}
        subtitle={`${filteredQuotes.length} devis — ${formatEuro(monthTotal)} HT`}
      />

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
              filter === tab.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : filteredQuotes.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-6 text-center">
            <p className="text-sm text-muted-foreground">Aucun devis ce mois-ci</p>
          </div>
        ) : (
          filteredQuotes.map((quote) => (
            <div
              key={quote.id}
              onClick={() => router.push(`/dashboard/quotes/${quote.id}`)}
              className="cursor-pointer rounded-2xl border border-border bg-white p-4 md:p-6 hover:border-primary hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-sm font-medium text-foreground">Devis {quote.number}</h3>
                    <StatusBadge status={quote.status} type="quote" />
                    {quote.invoiceId && (
                      <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                        Facturé
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-foreground font-semibold">{quote.client.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(quote.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">
                      {formatEuro(computeTotalHT(quote.lines))}
                    </p>
                    <p className="text-xs text-muted-foreground">HT</p>
                  </div>
                  {quote.status === "DRAFT" && (
                    <button
                      onClick={(e) => handleDelete(e, quote.id)}
                      className="mt-1 rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

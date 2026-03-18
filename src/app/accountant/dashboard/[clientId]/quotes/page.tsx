"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { StatusBadge } from "@/components/invoicing/status-badge";

interface Quote {
  id: string;
  number: string;
  clientName?: string;
  clientEmail?: string;
  date: string;
  status: string;
  totalHT: number;
}

export default function QuotesPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("TOUS");

  useEffect(() => {
    const fetchQuotes = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/accountant/${clientId}/quotes?month=${month}&year=${year}`
        );
        if (res.ok) {
          const data = await res.json();
          setQuotes(data);
        }
      } catch (err) {
        console.error("Failed to fetch quotes");
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [clientId, month, year]);

  const statuses = ["TOUS", "DRAFT", "SENT", "ACCEPTED", "REFUSED"];
  const statusLabels: Record<string, string> = {
    TOUS: "Tous",
    DRAFT: "Brouillon",
    SENT: "Envoyé",
    ACCEPTED: "Accepté",
    REFUSED: "Refusé",
  };

  const filtered = statusFilter === "TOUS"
    ? quotes
    : quotes.filter((quote) => quote.status === statusFilter);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Devis</h1>
      </div>

      <MonthPicker
        month={month}
        year={year}
        onChange={(m, y) => {
          setMonth(m);
          setYear(y);
        }}
      />

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
              statusFilter === status
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {statusLabels[status]}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center text-muted-foreground">Chargement...</div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <p className="text-muted-foreground">Aucun devis</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((quote) => (
            <div key={quote.id} className="rounded-lg border border-border bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    Devis {quote.number}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {quote.clientName || quote.clientEmail}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(quote.date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={quote.status} type="quote" />
                  <p className="font-semibold text-foreground">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    }).format(Number(quote.totalHT))}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

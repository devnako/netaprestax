"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Eye } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REFUSED: "bg-red-100 text-red-800",
};

interface Quote {
  id: string;
  number: string;
  status: string;
  issuedAt: string;
  client: { name: string };
  lines: { quantity: string; unitPrice: string; vatRate?: string }[];
}

export default function QuotesPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/accountant/${clientId}/quotes`);
        if (res.ok) {
          const data = await res.json();
          setQuotes(data);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clientId]);

  const filtered = quotes.filter((q) => filter === "ALL" || q.status === filter);

  const calcTotal = (lines: Quote["lines"]) =>
    lines.reduce((sum, l) => {
      const ht = Number(l.quantity) * Number(l.unitPrice);
      const vat = l.vatRate ? ht * Number(l.vatRate) / 100 : 0;
      return sum + ht + vat;
    }, 0);

  const handlePDF = (q: Quote) => {
    window.open(`/api/quotes/pdf?id=${q.id}`, "_blank");
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <h1 className="text-2xl font-bold text-foreground">Devis</h1>

      <div className="flex gap-2 overflow-x-auto">
        {["ALL", "DRAFT", "SENT", "ACCEPTED", "REFUSED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "ALL" ? "Tous" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <p className="text-muted-foreground">Aucun devis</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <div key={q.id} className="rounded-xl border border-border bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground">{q.number}</span>
                  <span className="ml-2 text-sm text-muted-foreground">{q.client.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePDF(q)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Télécharger PDF"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[q.status]}`}>
                    {STATUS_LABELS[q.status]}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>{new Date(q.issuedAt).toLocaleDateString("fr-FR")}</span>
                <span className="font-semibold text-foreground">
                  {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(calcTotal(q.lines))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

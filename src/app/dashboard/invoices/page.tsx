"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { StatusBadge } from "@/components/invoicing/status-badge";

interface InvoiceLine {
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  number: string;
  clientId: string;
  client: {
    name: string;
  };
  status: string;
  createdAt: string;
  lines: InvoiceLine[];
  quoteId: string | null;
  quote: {
    number: string;
  } | null;
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value);
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("TOUS");

  const tabs = [
    { value: "TOUS", label: "Tous" },
    { value: "DRAFT", label: "Brouillon" },
    { value: "PENDING", label: "En attente" },
    { value: "PAID", label: "Payée" },
    { value: "OVERDUE", label: "En retard" },
  ];

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/invoices");
    if (res.ok) {
      setInvoices(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const computeTotalHT = (lines: InvoiceLine[]): number => {
    return lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  };

  const filteredInvoices = filter === "TOUS" ? invoices : invoices.filter((i) => i.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Factures</h1>
        <a
          href="/dashboard/invoices/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nouvelle facture
        </a>
      </div>

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
        ) : filteredInvoices.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-6 text-center">
            <p className="text-sm text-muted-foreground">Aucune facture trouvée</p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
              className="cursor-pointer rounded-2xl border border-border bg-white p-4 md:p-6 hover:border-primary hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-sm font-medium text-foreground">Facture {invoice.number}</h3>
                    <StatusBadge status={invoice.status} type="invoice" />
                    {invoice.quoteId && invoice.quote && (
                      <span className="inline-block text-xs text-muted-foreground">
                        Devis {invoice.quote.number}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-foreground font-semibold">{invoice.client.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(invoice.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">
                    {formatEuro(computeTotalHT(invoice.lines))}
                  </p>
                  <p className="text-xs text-muted-foreground">HT</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

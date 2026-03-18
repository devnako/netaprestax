"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, FileText } from "lucide-react";
import { openPdfPreview } from "@/lib/pdf-preview";
import { StatusBadge } from "@/components/invoicing/status-badge";
import { MonthPicker } from "@/components/dashboard/month-picker";

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
  parentInvoiceId: string | null;
  parentInvoice: {
    id: string;
    number: string;
  } | null;
  creditNotes: {
    id: string;
    number: string;
  }[];
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value);
}


export default function InvoicesPage() {
  const now = new Date();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("TOUS");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = [
    { value: "TOUS", label: "Tous" },
    { value: "DRAFT", label: "Brouillon" },
    { value: "PENDING", label: "En attente" },
    { value: "PAID", label: "Payée" },
    { value: "OVERDUE", label: "En retard" },
    { value: "CANCELLED", label: "Annulée" },
    { value: "AVOIR", label: "Avoirs" },
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

  const handleMonthChange = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
  };

  const computeTotalHT = (lines: InvoiceLine[]): number => {
    return lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Month filter
      const d = new Date(inv.createdAt);
      if (d.getMonth() + 1 !== month || d.getFullYear() !== year) return false;

      // Status/type filter
      if (filter === "AVOIR") {
        if (!inv.parentInvoiceId) return false;
      } else if (filter === "TOUS") {
        if (inv.parentInvoiceId) return false;
      } else {
        if (inv.status !== filter || inv.parentInvoiceId) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const totalHT = computeTotalHT(inv.lines);
        const matchName = inv.client.name.toLowerCase().includes(q);
        const matchNumber = inv.number.toLowerCase().includes(q);
        const matchAmount = formatEuro(totalHT).toLowerCase().includes(q) || totalHT.toString().includes(q);
        if (!matchName && !matchNumber && !matchAmount) return false;
      }

      return true;
    });
  }, [invoices, month, year, filter, searchQuery]);

  const monthTotal = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + computeTotalHT(inv.lines), 0);
  }, [filteredInvoices]);

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

      <MonthPicker
        month={month}
        year={year}
        onChange={handleMonthChange}
        subtitle={`${filteredInvoices.length} document${filteredInvoices.length !== 1 ? "s" : ""} — ${formatEuro(monthTotal)} HT`}
      />

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher par client, numéro ou montant..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border px-4 py-2.5 pl-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {/* Filter tabs */}
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

      {/* Invoice list */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : filteredInvoices.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Aucun résultat pour cette recherche" : "Aucune facture ce mois-ci"}
            </p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="rounded-2xl border border-border bg-white hover:border-primary hover:shadow-sm transition"
            >
              <div className="flex items-center">
                <Link
                  href={`/dashboard/invoices/${invoice.id}`}
                  className="flex flex-1 items-start justify-between gap-4 p-4 md:p-6"
                >
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <h3 className="text-sm font-medium text-foreground">
                        {invoice.parentInvoiceId ? "Avoir" : "Facture"} {invoice.number}
                      </h3>
                      {invoice.parentInvoiceId ? (
                        <span className="inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                          Avoir
                        </span>
                      ) : (
                        <StatusBadge status={invoice.status} type="invoice" />
                      )}
                      {invoice.quoteId && invoice.quote && (
                        <span className="inline-block text-xs text-muted-foreground">
                          Devis {invoice.quote.number}
                        </span>
                      )}
                      {invoice.parentInvoice && (
                        <span className="inline-block text-xs text-muted-foreground">
                          Facture {invoice.parentInvoice.number}
                        </span>
                      )}
                      {invoice.creditNotes.length > 0 && (
                        <span className="inline-block text-xs text-orange-600">
                          Avoir {invoice.creditNotes[0].number}
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
                </Link>
                <button
                  onClick={() => openPdfPreview(`/api/invoices/pdf?id=${invoice.id}`)}
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition mr-4"
                  title="Aperçu PDF"
                >
                  <FileText className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

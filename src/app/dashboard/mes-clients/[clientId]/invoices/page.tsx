"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Download } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PENDING: "En attente",
  PAID: "Payée",
  OVERDUE: "En retard",
  CANCELLED: "Annulée",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-600",
};

interface Invoice {
  id: string;
  number: string;
  status: string;
  issuedAt: string;
  parentInvoiceId?: string;
  client: { name: string };
  lines: { quantity: string; unitPrice: string; vatRate?: string }[];
}

export default function InvoicesPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/accountant/${clientId}/invoices`);
        if (res.ok) {
          const data = await res.json();
          setInvoices(data);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clientId]);

  const filtered = invoices
    .filter((inv) => !inv.parentInvoiceId)
    .filter((inv) => filter === "ALL" || inv.status === filter);

  const calcTotal = (lines: Invoice["lines"]) =>
    lines.reduce((sum, l) => {
      const ht = Number(l.quantity) * Number(l.unitPrice);
      const vat = l.vatRate ? ht * Number(l.vatRate) / 100 : 0;
      return sum + ht + vat;
    }, 0);

  const handlePDF = async (inv: Invoice) => {
    const res = await fetch(`/api/invoices/pdf?id=${inv.id}`);
    if (!res.ok) return;
    const html = await res.text();
    const html2pdf = (await import("html2pdf.js")).default;
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    const el = container.querySelector("body") || container;
    await html2pdf()
      .set({
        margin: 0,
        filename: `${inv.parentInvoiceId ? "avoir" : "facture"}-${inv.number}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(el)
      .save();
    document.body.removeChild(container);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <h1 className="text-2xl font-bold text-foreground">Factures</h1>

      <div className="flex gap-2 overflow-x-auto">
        {["ALL", "DRAFT", "PENDING", "PAID", "OVERDUE", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "ALL" ? "Toutes" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <p className="text-muted-foreground">Aucune facture</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => (
            <div key={inv.id} className="rounded-xl border border-border bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground">{inv.number}</span>
                  <span className="ml-2 text-sm text-muted-foreground">{inv.client.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePDF(inv)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Télécharger PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status]}`}>
                    {STATUS_LABELS[inv.status]}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>{new Date(inv.issuedAt).toLocaleDateString("fr-FR")}</span>
                <span className="font-semibold text-foreground">
                  {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(calcTotal(inv.lines))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

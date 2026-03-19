"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { StatusBadge } from "@/components/invoicing/status-badge";
import { computeDocumentTotals } from "@/lib/invoicing/calculations";
import { Plus, Download, Copy, Trash2 } from "lucide-react";

interface QuoteLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number | null;
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
  notes: string | null;
  paymentTerms: string;
  paymentMethod: string | null;
  bankAccountHolder: string | null;
  bankIban: string | null;
  bankBic: string | null;
  validUntil: string | null;
  invoiceId: string | null;
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value);
}

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const loadQuote = async () => {
      setLoading(true);
      const res = await fetch(`/api/quotes/${id}`);
      if (res.ok) {
        setQuote(await res.json());
      }
      setLoading(false);
    };

    loadQuote();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Erreur");
      setSaving(false);
      return;
    }

    setSaving(false);
    const updatedQuote = await res.json();
    setQuote(updatedQuote);
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")) return;

    setSaving(true);
    const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Erreur");
      setSaving(false);
      return;
    }

    router.push("/dashboard/quotes");
  };

  const handleConvertToInvoice = async () => {
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/quotes/${id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Erreur");
      setSaving(false);
      return;
    }

    const result = await res.json();
    router.push(`/dashboard/invoices/${result.id}`);
  };

  const handleDuplicate = async () => {
    setSaving(true);
    setError(null);

    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: quote?.clientId,
        lines: quote?.lines.map((line) => ({
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          vatRate: line.vatRate,
        })),
        notes: quote?.notes,
        paymentTerms: quote?.paymentTerms,
        paymentMethod: quote?.paymentMethod,
        bankAccountHolder: quote?.bankAccountHolder,
        bankIban: quote?.bankIban,
        bankBic: quote?.bankBic,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Erreur");
      setSaving(false);
      return;
    }

    const newQuote = await res.json();
    router.push(`/dashboard/quotes/${newQuote.id}`);
  };

  const handlePDF = async () => {
    const res = await fetch(`/api/quotes/pdf?id=${id}`);
    const html = await res.text();
    const html2pdf = (await import("html2pdf.js")).default;
    const container = document.createElement("div");
    container.innerHTML = html;
    container.querySelectorAll("style").forEach((s) => s.remove());
    document.body.appendChild(container);
    const el = container.querySelector("body") || container;
    await html2pdf()
      .set({
        margin: 0,
        filename: `devis-${quote?.number || "document"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(el)
      .save();
    document.body.removeChild(container);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Chargement...</div>;
  }

  if (!quote) {
    return <div className="text-sm text-muted-foreground">Devis non trouvé</div>;
  }

  const totals = computeDocumentTotals(
    quote.lines.map((line) => ({
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      vatRate: line.vatRate || null,
    })),
    quote.lines.some((l) => l.vatRate !== null)
  );

  const renderActions = () => {
    const commonClass = "rounded-lg px-4 py-2.5 font-medium transition text-sm";

    switch (quote.status) {
      case "DRAFT":
        return (
          <div className="space-y-2">
            <a
              href={`/dashboard/quotes/${id}/edit`}
              className={`block text-center ${commonClass} bg-primary text-primary-foreground hover:bg-primary/90`}
            >
              Modifier
            </a>
            <button
              onClick={() => handleStatusChange("SENT")}
              disabled={saving}
              className={`w-full ${commonClass} bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50`}
            >
              Marquer envoyé
            </button>
            <button
              onClick={handlePDF}
              className={`w-full ${commonClass} border border-border text-foreground hover:bg-white`}
            >
              <Download className="inline h-4 w-4 mr-2" />
              Télécharger PDF
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className={`w-full ${commonClass} bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50`}
            >
              Supprimer
            </button>
          </div>
        );
      case "SENT":
        return (
          <div className="space-y-2">
            <button
              onClick={() => handleStatusChange("ACCEPTED")}
              disabled={saving}
              className={`w-full ${commonClass} bg-green-500 text-white hover:bg-green-600 disabled:opacity-50`}
            >
              Accepter
            </button>
            <button
              onClick={() => handleStatusChange("REFUSED")}
              disabled={saving}
              className={`w-full ${commonClass} bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50`}
            >
              Refuser
            </button>
            <button
              onClick={handlePDF}
              className={`w-full ${commonClass} border border-border text-foreground hover:bg-white`}
            >
              <Download className="inline h-4 w-4 mr-2" />
              Télécharger PDF
            </button>
          </div>
        );
      case "ACCEPTED":
        return (
          <div className="space-y-2">
            <button
              onClick={handleConvertToInvoice}
              disabled={saving}
              className={`w-full ${commonClass} bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50`}
            >
              Convertir en facture
            </button>
            <button
              onClick={handlePDF}
              className={`w-full ${commonClass} border border-border text-foreground hover:bg-white`}
            >
              <Download className="inline h-4 w-4 mr-2" />
              Télécharger PDF
            </button>
          </div>
        );
      case "REFUSED":
        return (
          <div className="space-y-2">
            <button
              onClick={handlePDF}
              className={`w-full ${commonClass} border border-border text-foreground hover:bg-white`}
            >
              <Download className="inline h-4 w-4 mr-2" />
              Télécharger PDF
            </button>
            <button
              onClick={handleDuplicate}
              disabled={saving}
              className={`w-full ${commonClass} bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50`}
            >
              <Copy className="inline h-4 w-4 mr-2" />
              Dupliquer
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Devis {quote.number}</h1>
          <div className="mt-2 flex items-center gap-3">
            <StatusBadge status={quote.status} type="quote" />
            {quote.invoiceId && (
              <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                Facturé
              </span>
            )}
          </div>
        </div>
        <a
          href="/dashboard/quotes"
          className="text-sm text-primary hover:underline"
        >
          Retour
        </a>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-white p-4 md:p-6 space-y-4">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Client</h2>
              <p className="mt-1 text-lg font-semibold text-foreground">{quote.client.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
                <p className="mt-1 text-foreground">
                  {new Date(quote.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              {quote.validUntil && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Valide jusqu'au</h3>
                  <p className="mt-1 text-foreground">
                    {new Date(quote.validUntil).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              )}
            </div>

            {quote.paymentTerms && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Conditions de paiement</h3>
                <p className="mt-1 text-foreground">{quote.paymentTerms}</p>
              </div>
            )}

            {quote.paymentMethod && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Moyen de paiement</h3>
                <p className="mt-1 text-foreground">{quote.paymentMethod}</p>
              </div>
            )}

            {quote.paymentMethod === "Virement bancaire" && (quote.bankAccountHolder || quote.bankIban || quote.bankBic) && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-1">
                <p className="text-xs font-medium text-blue-800 mb-2">Coordonnées bancaires</p>
                {quote.bankAccountHolder && (
                  <p className="text-sm text-blue-900"><span className="font-medium">Titulaire :</span> {quote.bankAccountHolder}</p>
                )}
                {quote.bankIban && (
                  <p className="text-sm text-blue-900"><span className="font-medium">IBAN :</span> {quote.bankIban}</p>
                )}
                {quote.bankBic && (
                  <p className="text-sm text-blue-900"><span className="font-medium">BIC :</span> {quote.bankBic}</p>
                )}
              </div>
            )}

            {quote.notes && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                <p className="mt-1 text-foreground whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-white p-4 md:p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Articles</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Description</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Qté</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Prix unit.</th>
                    {quote.lines.some((l) => l.vatRate !== null) && (
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">TVA</th>
                    )}
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.lines.map((line) => (
                    <tr key={line.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-3 text-foreground">{line.description}</td>
                      <td className="text-right py-3 px-3 text-foreground">{line.quantity}</td>
                      <td className="text-right py-3 px-3 text-foreground">{formatEuro(line.unitPrice)}</td>
                      {quote.lines.some((l) => l.vatRate !== null) && (
                        <td className="text-right py-3 px-3 text-foreground">
                          {line.vatRate ? `${line.vatRate}%` : "—"}
                        </td>
                      )}
                      <td className="text-right py-3 px-3 font-semibold text-foreground">
                        {formatEuro(line.quantity * line.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-4 md:p-6 space-y-3">
            <div className="flex justify-end">
              <div className="w-48 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total HT</span>
                  <span className="font-semibold text-foreground">{formatEuro(totals.totalHT)}</span>
                </div>
                {totals.vatBreakdown.length > 0 && (
                  <>
                    {totals.vatBreakdown.map((entry) => (
                      <div key={entry.rate} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">TVA {entry.rate}%</span>
                        <span className="font-semibold text-foreground">{formatEuro(entry.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-border pt-2">
                      <span className="font-medium text-foreground">Total TTC</span>
                      <span className="font-bold text-lg text-foreground">{formatEuro(totals.totalTTC)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 md:p-6 h-fit">
          <h2 className="font-semibold text-foreground mb-4">Actions</h2>
          {renderActions()}
        </div>
      </div>
    </div>
  );
}

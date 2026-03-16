"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Trash2, Edit2, Download } from "lucide-react";
import { StatusBadge } from "@/components/invoicing/status-badge";
import { LineItemsEditor } from "@/components/invoicing/line-items-editor";
import { computeDocumentTotals } from "@/lib/invoicing/calculations";

interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number | null;
}

interface LineItemInput {
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
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
  updatedAt: string;
  paidAt: string | null;
  lines: InvoiceLine[];
  notes: string;
  paymentTerms: string;
  quoteId: string | null;
  quote: {
    number: string;
  } | null;
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editLines, setEditLines] = useState<LineItemInput[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [editPaymentTerms, setEditPaymentTerms] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmPay, setConfirmPay] = useState(false);
  const [tvaAssujetti, setTvaAssujetti] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [invoiceRes, settingsRes] = await Promise.all([
          fetch(`/api/invoices/${id}`),
          fetch("/api/settings"),
        ]);

        if (invoiceRes.ok) {
          const data = await invoiceRes.json();
          setInvoice(data);
          setEditLines(
            data.lines.map((line: InvoiceLine) => ({
              description: line.description || "",
              quantity: line.quantity.toString(),
              unitPrice: line.unitPrice.toString(),
              vatRate: (line.vatRate ?? 20).toString(),
            }))
          );
          setEditNotes(data.notes || "");
          setEditPaymentTerms(data.paymentTerms || "À réception");
        }

        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setTvaAssujetti(settings.tvaAssujetti ?? true);
        }
      } catch (err) {
        setError("Erreur lors du chargement de la facture");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleSaveEdit = async () => {
    if (!invoice) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: editLines.map((line) => ({
            description: line.description,
            quantity: parseFloat(line.quantity) || 0,
            unitPrice: parseFloat(line.unitPrice) || 0,
            vatRate: tvaAssujetti ? parseFloat(line.vatRate) : null,
          })),
          notes: editNotes,
          paymentTerms: editPaymentTerms,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Erreur lors de la mise à jour");
        return;
      }

      const updated = await response.json();
      setInvoice(updated);
      setIsEditing(false);
    } catch (err) {
      setError("Erreur lors de la mise à jour de la facture");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!invoice) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Erreur lors de la mise à jour du statut");
        return;
      }

      const updated = await response.json();
      setInvoice(updated);
      setConfirmPay(false);
    } catch (err) {
      setError("Erreur lors de la mise à jour du statut");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette facture?")) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Erreur lors de la suppression");
        return;
      }

      router.push("/dashboard/invoices");
    } catch (err) {
      setError("Erreur lors de la suppression de la facture");
    } finally {
      setSaving(false);
    }
  };

  const handlePDF = () => {
    window.open(`/api/invoices/pdf?id=${id}`, "_blank");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6">
        <p className="text-sm text-muted-foreground">Facture non trouvée</p>
      </div>
    );
  }

  const totals = computeDocumentTotals(invoice.lines, tvaAssujetti);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Facture {invoice.number}</h1>
        <StatusBadge status={invoice.status} type="invoice" />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Invoice Info */}
          <div className="rounded-2xl border border-border bg-white p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Client</p>
                <p className="text-foreground font-semibold">{invoice.client.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Date</p>
                <p className="text-foreground">
                  {new Date(invoice.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              {invoice.quote && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Depuis</p>
                  <p className="text-foreground">Devis {invoice.quote.number}</p>
                </div>
              )}
              {invoice.paidAt && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Date de paiement
                  </p>
                  <p className="text-foreground">
                    {new Date(invoice.paidAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Conditions de paiement
                </p>
                <p className="text-foreground">{invoice.paymentTerms}</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="text-sm font-medium text-foreground mb-4">Lignes</h2>
            {isEditing ? (
              <LineItemsEditor
                lines={editLines}
                onChange={setEditLines}
                tvaAssujetti={tvaAssujetti}
              />
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  {/* Header */}
                  <div className="hidden sm:flex items-center gap-3 mb-3 px-3 py-2 bg-muted rounded-lg">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Description
                      </label>
                    </div>
                    <div className="w-20">
                      <label className="text-xs font-medium text-muted-foreground">
                        Qté
                      </label>
                    </div>
                    <div className="w-28">
                      <label className="text-xs font-medium text-muted-foreground">
                        Prix unit. HT
                      </label>
                    </div>
                    {tvaAssujetti && (
                      <div className="w-24">
                        <label className="text-xs font-medium text-muted-foreground">
                          TVA
                        </label>
                      </div>
                    )}
                    <div className="w-24 text-right">
                      <label className="text-xs font-medium text-muted-foreground">
                        Total HT
                      </label>
                    </div>
                  </div>

                  {/* Lines */}
                  <div className="space-y-4">
                    {invoice.lines.map((line, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 p-3 border border-border rounded-lg"
                      >
                        <div className="flex-1">
                          <label className="sm:hidden text-xs font-medium text-muted-foreground">
                            Description
                          </label>
                          <p className="mt-1 sm:mt-0 text-sm text-foreground">
                            {line.description || "-"}
                          </p>
                        </div>
                        <div className="w-full sm:w-20">
                          <label className="sm:hidden text-xs font-medium text-muted-foreground">
                            Qté
                          </label>
                          <p className="mt-1 sm:mt-0 text-sm text-foreground">
                            {line.quantity}
                          </p>
                        </div>
                        <div className="w-full sm:w-28">
                          <label className="sm:hidden text-xs font-medium text-muted-foreground">
                            Prix unit. HT
                          </label>
                          <p className="mt-1 sm:mt-0 text-sm text-foreground">
                            {formatEuro(line.unitPrice)}
                          </p>
                        </div>
                        {tvaAssujetti && (
                          <div className="w-full sm:w-24">
                            <label className="sm:hidden text-xs font-medium text-muted-foreground">
                              TVA
                            </label>
                            <p className="mt-1 sm:mt-0 text-sm text-foreground">
                              {line.vatRate ? `${line.vatRate}%` : "-"}
                            </p>
                          </div>
                        )}
                        <div className="w-full sm:w-24 text-right">
                          <label className="sm:hidden text-xs font-medium text-muted-foreground">
                            Total HT
                          </label>
                          <p className="mt-1 sm:mt-0 text-sm text-foreground font-semibold">
                            {formatEuro(line.quantity * line.unitPrice)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm text-foreground">Total HT</p>
                <p className="text-lg font-bold text-foreground">
                  {formatEuro(totals.totalHT)}
                </p>
              </div>

              {tvaAssujetti && totals.vatBreakdown.length > 0 ? (
                <>
                  {totals.vatBreakdown.map((entry) => (
                    <div key={entry.rate} className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">TVA {entry.rate}%</p>
                      <p className="text-sm text-foreground">
                        {formatEuro(entry.amount)}
                      </p>
                    </div>
                  ))}
                  <div className="border-t border-border pt-3 flex justify-between items-center">
                    <p className="text-sm font-medium text-foreground">Total TTC</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatEuro(totals.totalTTC)}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">TVA non applicable</p>
              )}
            </div>
          </div>

          {/* Notes */}
          {!isEditing && invoice.notes && (
            <div className="rounded-2xl border border-border bg-white p-6">
              <h3 className="text-sm font-medium text-foreground mb-2">Notes</h3>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {invoice.notes}
              </p>
            </div>
          )}

          {/* Edit Mode - Payment Terms and Notes */}
          {isEditing && (
            <div className="rounded-2xl border border-border bg-white p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Conditions de paiement
                </label>
                <input
                  type="text"
                  value={editPaymentTerms}
                  onChange={(e) => setEditPaymentTerms(e.target.value)}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Remarques supplémentaires..."
                  rows={4}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions Sidebar */}
        <div className="md:col-span-1">
          <div className="rounded-2xl border border-border bg-white p-6 space-y-3 sticky top-6">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="w-full rounded-lg bg-primary px-4 py-2.5 text-center font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? "Sauvegarde..." : "Enregistrer"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-center font-medium text-foreground hover:bg-muted"
                >
                  Annuler
                </button>
              </>
            ) : (
              <>
                {invoice.status === "DRAFT" && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-center font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Edit2 size={16} />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleStatusChange("PENDING")}
                      disabled={saving}
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-center font-medium text-foreground hover:bg-muted disabled:opacity-50"
                    >
                      {saving ? "Envoi..." : "Envoyer"}
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2.5 text-center font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      Supprimer
                    </button>
                  </>
                )}

                {(invoice.status === "PENDING" || invoice.status === "OVERDUE") && (
                  <>
                    {confirmPay ? (
                      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 space-y-3">
                        <p className="text-sm text-yellow-800">
                          Cette action créera automatiquement un revenu de{" "}
                          <span className="font-bold">
                            {formatEuro(totals.totalHT)}
                          </span>{" "}
                          dans tes revenus du mois.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusChange("PAID")}
                            disabled={saving}
                            className="flex-1 rounded-lg bg-yellow-600 px-3 py-2 text-center font-medium text-white hover:bg-yellow-700 disabled:opacity-50 text-sm"
                          >
                            {saving ? "..." : "Confirmer"}
                          </button>
                          <button
                            onClick={() => setConfirmPay(false)}
                            className="flex-1 rounded-lg border border-yellow-300 px-3 py-2 text-center font-medium text-yellow-700 hover:bg-yellow-100 text-sm"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmPay(true)}
                        className="w-full rounded-lg bg-primary px-4 py-2.5 text-center font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Marquer payée
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={handlePDF}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-center font-medium text-foreground hover:bg-muted"
                >
                  <Download size={16} />
                  PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

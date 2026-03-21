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
  clientId: string | null;
  clientName: string | null;
  client: {
    name: string;
  } | null;
  status: string;
  tvaAssujetti: boolean;
  activityType: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  lines: InvoiceLine[];
  notes: string;
  paymentTerms: string;
  paymentMethod: string | null;
  bankAccountHolder: string | null;
  bankIban: string | null;
  bankBic: string | null;
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

const ACTIVITY_LABELS: Record<string, string> = {
  BIC_VENTE: "Vente de marchandises",
  BIC_PRESTATION: "Prestation de services (BIC)",
  BNC_LIBERAL_URSSAF: "Profession libérale (URSSAF)",
  BNC_LIBERAL_CIPAV: "Profession libérale (CIPAV)",
};

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
  const [editPaymentMethod, setEditPaymentMethod] = useState("");
  const [editBankAccountHolder, setEditBankAccountHolder] = useState("");
  const [editBankIban, setEditBankIban] = useState("");
  const [editBankBic, setEditBankBic] = useState("");
  const [editActivityType, setEditActivityType] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmPay, setConfirmPay] = useState(false);
  const [confirmCreditNote, setConfirmCreditNote] = useState(false);
  const [removeRevenue, setRemoveRevenue] = useState(true);
  useEffect(() => {
    const loadData = async () => {
      try {
        const invoiceRes = await fetch(`/api/invoices/${id}`);

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
          setEditPaymentMethod(data.paymentMethod || "");
          setEditBankAccountHolder(data.bankAccountHolder || "");
          setEditBankIban(data.bankIban || "");
          setEditBankBic(data.bankBic || "");
          setEditActivityType(data.activityType || "");
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
            vatRate: invoice.tvaAssujetti ? parseFloat(line.vatRate) : null,
          })),
          activityType: editActivityType || null,
          notes: editNotes,
          paymentTerms: editPaymentTerms,
          paymentMethod: editPaymentMethod || null,
          bankAccountHolder: editBankAccountHolder,
          bankIban: editBankIban,
          bankBic: editBankBic,
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

  const handlePDF = async () => {
    const res = await fetch(`/api/invoices/pdf?id=${id}`);
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
        filename: `${invoice?.parentInvoiceId ? "avoir" : "facture"}-${invoice?.number || "document"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(el)
      .save();
    document.body.removeChild(container);
  };

  const handleCreateCreditNote = async () => {
    if (!invoice) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/invoices/${id}/credit-note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeRevenue: invoice.status === "PAID" && removeRevenue }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Erreur lors de la création de l'avoir");
        return;
      }

      const creditNote = await response.json();
      router.push(`/dashboard/invoices/${creditNote.id}`);
    } catch {
      setError("Erreur lors de la création de l'avoir");
    } finally {
      setSaving(false);
    }
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

  const displayLines = isEditing
    ? editLines.map((l) => ({
        quantity: parseFloat(l.quantity) || 0,
        unitPrice: parseFloat(l.unitPrice) || 0,
        vatRate: invoice.tvaAssujetti ? parseFloat(l.vatRate) || 0 : null,
      }))
    : invoice.lines;
  const totals = computeDocumentTotals(displayLines, invoice.tvaAssujetti);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {invoice.parentInvoiceId ? "Avoir" : "Facture"} {invoice.number}
          </h1>
          {invoice.parentInvoice && (
            <p className="mt-1 text-sm text-muted-foreground">
              Avoir sur{" "}
              <a href={`/dashboard/invoices/${invoice.parentInvoice.id}`} className="text-primary hover:underline">
                facture {invoice.parentInvoice.number}
              </a>
            </p>
          )}
          {invoice.creditNotes.length > 0 && (
            <p className="mt-1 text-sm text-orange-600">
              Annulée par{" "}
              <a href={`/dashboard/invoices/${invoice.creditNotes[0].id}`} className="text-primary hover:underline">
                avoir {invoice.creditNotes[0].number}
              </a>
            </p>
          )}
        </div>
        {invoice.parentInvoiceId ? (
          <span className="inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
            Avoir
          </span>
        ) : (
          <StatusBadge status={invoice.status} type="invoice" />
        )}
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
                <p className="text-foreground font-semibold">{invoice.clientName || invoice.client?.name || ""}</p>
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
              {invoice.paymentMethod && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Moyen de paiement
                  </p>
                  <p className="text-foreground">{invoice.paymentMethod}</p>
                </div>
              )}
              {invoice.activityType && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Type d&apos;activité
                  </p>
                  <p className="text-foreground">{ACTIVITY_LABELS[invoice.activityType] || invoice.activityType}</p>
                </div>
              )}
            </div>
            {invoice.paymentMethod === "Virement bancaire" && (invoice.bankAccountHolder || invoice.bankIban || invoice.bankBic) && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-1">
                <p className="text-xs font-medium text-blue-800 mb-2">Coordonnées bancaires</p>
                {invoice.bankAccountHolder && (
                  <p className="text-sm text-blue-900"><span className="font-medium">Titulaire :</span> {invoice.bankAccountHolder}</p>
                )}
                {invoice.bankIban && (
                  <p className="text-sm text-blue-900"><span className="font-medium">IBAN :</span> {invoice.bankIban}</p>
                )}
                {invoice.bankBic && (
                  <p className="text-sm text-blue-900"><span className="font-medium">BIC :</span> {invoice.bankBic}</p>
                )}
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="text-sm font-medium text-foreground mb-4">Lignes</h2>
            {isEditing ? (
              <LineItemsEditor
                lines={editLines}
                onChange={setEditLines}
                tvaAssujetti={invoice.tvaAssujetti}
                hideTotals
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
                        {invoice.tvaAssujetti ? "Prix unit. HT" : "Prix unit."}
                      </label>
                    </div>
                    {invoice.tvaAssujetti && (
                      <div className="w-24">
                        <label className="text-xs font-medium text-muted-foreground">
                          TVA
                        </label>
                      </div>
                    )}
                    <div className="w-24 text-right">
                      <label className="text-xs font-medium text-muted-foreground">
                        {invoice.tvaAssujetti ? "Total HT" : "Total TTC"}
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
                            {invoice.tvaAssujetti ? "Prix unit. HT" : "Prix unit."}
                          </label>
                          <p className="mt-1 sm:mt-0 text-sm text-foreground">
                            {formatEuro(line.unitPrice)}
                          </p>
                        </div>
                        {invoice.tvaAssujetti && (
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
                            {invoice.tvaAssujetti ? "Total HT" : "Total TTC"}
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
                <p className="text-sm text-foreground">{invoice.tvaAssujetti ? "Total HT" : "Total TTC"}</p>
                <p className="text-lg font-bold text-foreground">
                  {formatEuro(totals.totalHT)}
                </p>
              </div>

              {invoice.tvaAssujetti && totals.vatBreakdown.length > 0 ? (
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
                  Type d&apos;activité
                </label>
                <select
                  value={editActivityType}
                  onChange={(e) => setEditActivityType(e.target.value)}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="BIC_VENTE">Vente de marchandises</option>
                  <option value="BIC_PRESTATION">Prestation de services (BIC)</option>
                  <option value="BNC_LIBERAL_URSSAF">Profession libérale (URSSAF)</option>
                  <option value="BNC_LIBERAL_CIPAV">Profession libérale (CIPAV)</option>
                </select>
              </div>

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
                  Moyen de paiement (optionnel)
                </label>
                <select
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value)}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">Non précisé</option>
                  <option value="Virement bancaire">Virement bancaire</option>
                  <option value="Chèque">Chèque</option>
                  <option value="Espèces">Espèces</option>
                  <option value="Carte bancaire">Carte bancaire</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              {editPaymentMethod === "Virement bancaire" && (
                <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
                  <p className="text-sm font-medium text-foreground">Coordonnées bancaires (optionnel)</p>
                  <input
                    type="text"
                    value={editBankAccountHolder}
                    onChange={(e) => setEditBankAccountHolder(e.target.value)}
                    placeholder="Titulaire du compte"
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground focus:border-primary focus:outline-none"
                  />
                  <input
                    type="text"
                    value={editBankIban}
                    onChange={(e) => setEditBankIban(e.target.value)}
                    placeholder="IBAN"
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground focus:border-primary focus:outline-none"
                  />
                  <input
                    type="text"
                    value={editBankBic}
                    onChange={(e) => setEditBankBic(e.target.value)}
                    placeholder="BIC"
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              )}

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
                {invoice.status === "DRAFT" && !invoice.parentInvoiceId && (
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

                {(invoice.status === "PENDING" || invoice.status === "OVERDUE") && !invoice.parentInvoiceId && (
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

                {/* Créer un avoir — for PENDING/PAID invoices without existing credit note */}
                {(invoice.status === "PENDING" || invoice.status === "PAID") &&
                  !invoice.parentInvoiceId &&
                  invoice.creditNotes.length === 0 && (
                  <>
                    {confirmCreditNote ? (
                      <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 space-y-3">
                        <p className="text-sm text-orange-800">
                          Un avoir de{" "}
                          <span className="font-bold">{formatEuro(totals.totalHT)}</span>{" "}
                          sera créé et cette facture sera marquée comme annulée.
                        </p>
                        {invoice.status === "PAID" && (
                          <label className="flex items-center gap-2 text-sm text-orange-800">
                            <input
                              type="checkbox"
                              checked={removeRevenue}
                              onChange={(e) => setRemoveRevenue(e.target.checked)}
                              className="rounded border-orange-300"
                            />
                            Retirer le revenu correspondant
                          </label>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={handleCreateCreditNote}
                            disabled={saving}
                            className="flex-1 rounded-lg bg-orange-600 px-3 py-2 text-center font-medium text-white hover:bg-orange-700 disabled:opacity-50 text-sm"
                          >
                            {saving ? "..." : "Confirmer"}
                          </button>
                          <button
                            onClick={() => setConfirmCreditNote(false)}
                            className="flex-1 rounded-lg border border-orange-300 px-3 py-2 text-center font-medium text-orange-700 hover:bg-orange-100 text-sm"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmCreditNote(true)}
                        className="w-full rounded-lg border border-orange-300 px-4 py-2.5 text-center font-medium text-orange-700 hover:bg-orange-50"
                      >
                        Créer un avoir
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={handlePDF}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-center font-medium text-foreground hover:bg-muted"
                >
                  <Download size={16} />
                  Télécharger PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

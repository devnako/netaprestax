"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LineItemsEditor } from "@/components/invoicing/line-items-editor";

interface Client {
  id: string;
  name: string;
}

interface LineItem {
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [lines, setLines] = useState<LineItem[]>([
    { description: "", quantity: "1", unitPrice: "0", vatRate: "20" },
  ]);
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("À réception");
  const [customPaymentTerms, setCustomPaymentTerms] = useState("");
  const [tvaAssujetti, setTvaAssujetti] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsRes, settingsRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/settings"),
        ]);

        if (clientsRes.ok) {
          setClients(await clientsRes.json());
        }

        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setTvaAssujetti(settings.tvaAssujetti ?? true);
        }
      } catch (err) {
        setError("Erreur lors du chargement des données");
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setError("Veuillez sélectionner un client");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const finalPaymentTerms =
        paymentTerms === "Personnalisé" ? customPaymentTerms : paymentTerms;

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          lines: lines.map((line) => ({
            description: line.description,
            quantity: parseFloat(line.quantity) || 0,
            unitPrice: parseFloat(line.unitPrice) || 0,
            vatRate: tvaAssujetti ? parseFloat(line.vatRate) : null,
          })),
          notes,
          paymentTerms: finalPaymentTerms,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Erreur lors de la création de la facture");
        return;
      }

      const invoice = await response.json();
      router.push(`/dashboard/invoices/${invoice.id}`);
    } catch (err) {
      setError("Erreur lors de la création de la facture");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nouvelle facture</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Client Selection */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Client
          </label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground focus:border-primary focus:outline-none"
            required
          >
            <option value="">Sélectionner un client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {/* Line Items */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="text-sm font-medium text-foreground mb-4">Lignes</h2>
          <LineItemsEditor
            lines={lines}
            onChange={setLines}
            tvaAssujetti={tvaAssujetti}
          />
        </div>

        {/* Payment Terms */}
        <div className="rounded-2xl border border-border bg-white p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Conditions de paiement
            </label>
            <select
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground focus:border-primary focus:outline-none"
            >
              <option value="À réception">À réception</option>
              <option value="30 jours">30 jours</option>
              <option value="60 jours">60 jours</option>
              <option value="Personnalisé">Personnalisé</option>
            </select>
          </div>

          {paymentTerms === "Personnalisé" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Conditions personnalisées
              </label>
              <input
                type="text"
                value={customPaymentTerms}
                onChange={(e) => setCustomPaymentTerms(e.target.value)}
                placeholder="Ex: 50% à la signature, 50% à la fin"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Notes (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Remarques supplémentaires..."
            rows={4}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-center font-medium text-foreground hover:bg-muted"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-center font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Création..." : "Créer la facture"}
          </button>
        </div>
      </form>
    </div>
  );
}

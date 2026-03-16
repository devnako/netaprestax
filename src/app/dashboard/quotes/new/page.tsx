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

export default function NewQuotePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [lines, setLines] = useState<LineItem[]>([
    { description: "", quantity: "1", unitPrice: "0", vatRate: "20" },
  ]);
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("À réception");
  const [customPaymentTerms, setCustomPaymentTerms] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [tvaAssujetti, setTvaAssujetti] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
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
          setTvaAssujetti(settings.tvaAssujetti || false);
        }

        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 30);
        setValidUntil(defaultDate.toISOString().split("T")[0]);
      } catch (err) {
        setError("Erreur lors du chargement des données");
      }
    };

    loadInitialData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!clientId) {
      setError("Veuillez sélectionner un client");
      setSaving(false);
      return;
    }

    const finalPaymentTerms = paymentTerms === "Personnalisé" ? customPaymentTerms : paymentTerms;

    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        lines: lines.map((line) => ({
          description: line.description,
          quantity: parseFloat(line.quantity) || 0,
          unitPrice: parseFloat(line.unitPrice) || 0,
          vatRate: tvaAssujetti ? parseInt(line.vatRate) : null,
        })),
        notes: notes || null,
        paymentTerms: finalPaymentTerms,
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Erreur");
      setSaving(false);
      return;
    }

    const quote = await res.json();
    router.push(`/dashboard/quotes/${quote.id}`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Créer un devis</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-white p-4 md:p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Client</h2>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Sélectionner un client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 md:p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Date de validité</h2>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 md:p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Lignes d'article</h2>
          <LineItemsEditor
            lines={lines}
            onChange={setLines}
            tvaAssujetti={tvaAssujetti}
          />
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 md:p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Conditions de paiement</h2>
          <select
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="À réception">À réception</option>
            <option value="30 jours">30 jours</option>
            <option value="60 jours">60 jours</option>
            <option value="Personnalisé">Personnalisé</option>
          </select>
          {paymentTerms === "Personnalisé" && (
            <input
              type="text"
              placeholder="Ex: Net 45 jours"
              value={customPaymentTerms}
              onChange={(e) => setCustomPaymentTerms(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          )}
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 md:p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Notes</h2>
          <textarea
            placeholder="Notes supplémentaires..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            rows={4}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Créer le devis"}
        </button>
      </form>
    </div>
  );
}

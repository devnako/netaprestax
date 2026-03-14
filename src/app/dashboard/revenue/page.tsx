"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RevenuePage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const now = new Date();
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/revenue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(amount),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        description: description || null,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Une erreur est survenue");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/dashboard"), 1000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Ajouter ton CA</h1>
      <p className="mt-2 text-muted-foreground">
        {monthNames[now.getMonth()]} {now.getFullYear()}
      </p>

      {success ? (
        <div className="mt-6 rounded-lg bg-accent/10 p-4 text-accent">
          CA enregistré. Redirection vers le tableau de bord...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-foreground">
              Chiffre d&apos;affaires du mois (en euros)
            </label>
            <div className="relative mt-1">
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="block w-full rounded-lg border border-border px-4 py-3 pr-12 text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="3000"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                €
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground">
              Note (optionnel)
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Ex: missions mars"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !amount}
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Enregistrement..." : "Enregistrer mon CA"}
          </button>
        </form>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users } from "lucide-react";

interface Client {
  id: string;
  name?: string;
  businessName?: string;
  email: string;
  siret?: string;
}

export default function MesClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/accountant/clients");
        if (!res.ok) throw new Error("Failed to fetch clients");
        const data = await res.json();
        setClients(data);
      } catch (err) {
        setError("Impossible de charger vos clients");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mes clients</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Accès en lecture seule aux dossiers de vos clients
        </p>
      </div>

      {loading && (
        <div className="rounded-2xl border border-border bg-white p-8 text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-border bg-white p-8 text-center">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {!loading && clients.length === 0 && (
        <div className="rounded-2xl border border-border bg-white p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            Aucun client pour le moment
          </h2>
          <p className="mt-2 text-muted-foreground">
            Aucun client ne vous a donné accès pour le moment.
          </p>
        </div>
      )}

      {!loading && clients.length > 0 && (
        <div className="grid gap-4">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/dashboard/mes-clients/${client.id}`}
              className="rounded-xl border border-border bg-white p-4 hover:bg-muted transition-colors"
            >
              <h3 className="font-semibold text-foreground">
                {client.businessName || client.name || "Client"}
              </h3>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p>{client.email}</p>
                {client.siret && <p>SIRET: {client.siret}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

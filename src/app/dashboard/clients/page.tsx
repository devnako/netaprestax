"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, Users, X, Search } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
  siret: string | null;
  notes: string | null;
  _count: {
    quotes: number;
    invoices: number;
  };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [siret, setSiret] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/clients");
    if (res.ok) {
      setClients(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setName("");
    setEmail("");
    setAddress("");
    setSiret("");
    setNotes("");
    setEditingId(null);
    setError(null);
  };

  const handleEdit = (client: Client) => {
    setName(client.name);
    setEmail(client.email || "");
    setAddress(client.address || "");
    setSiret(client.siret || "");
    setNotes(client.notes || "");
    setEditingId(client.id);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const method = editingId ? "PUT" : "POST";
      const res = await fetch("/api/clients", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingId && { id: editingId }),
          name,
          email: email || undefined,
          address: address || undefined,
          siret: siret || undefined,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Erreur");
        setSaving(false);
        return;
      }

      resetForm();
      setSaving(false);
      loadClients();
    } catch (err) {
      setError("Erreur");
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) return;

    const res = await fetch(`/api/clients?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Impossible de supprimer ce client");
      return;
    }

    loadClients();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Clients</h1>
        <span className="text-sm text-muted-foreground">
          {clients.length} client{clients.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border px-4 py-2.5 pl-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-border bg-white p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">
            {editingId ? "Modifier le client" : "Ajouter un client"}
          </h2>
          {editingId && (
            <button
              onClick={resetForm}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground">Nom *</label>
            <input
              type="text"
              placeholder="Nom du client"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Adresse</label>
            <input
              type="text"
              placeholder="Adresse complète"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">SIRET</label>
            <input
              type="text"
              placeholder="SIRET"
              value={siret}
              onChange={(e) => setSiret(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Notes</label>
            <textarea
              placeholder="Notes supplémentaires..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={saving || !name}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {saving ? (editingId ? "Modification..." : "Ajout...") : editingId ? "Modifier" : "Ajouter"}
          </button>
        </form>
      </div>

      {/* Clients list */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : filteredClients.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-6 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery ? "Aucun client trouvé" : "Aucun client enregistré"}
            </p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="rounded-2xl border border-border bg-white p-4 md:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-foreground">{client.name}</h3>
                  {client.email && (
                    <p className="text-xs text-muted-foreground">{client.email}</p>
                  )}
                  {client.address && (
                    <p className="text-xs text-muted-foreground">{client.address}</p>
                  )}
                  {client.siret && (
                    <p className="text-xs text-muted-foreground">SIRET: {client.siret}</p>
                  )}
                  <div className="mt-2 flex gap-4">
                    <span className="text-xs text-muted-foreground">
                      {client._count.quotes} devis
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {client._count.invoices} facture{client._count.invoices !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(client)}
                    className="p-2 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    disabled={client._count.quotes > 0 || client._count.invoices > 0}
                    className="p-2 text-muted-foreground hover:text-destructive disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

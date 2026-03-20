"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  FileCheck,
  FileText,
  BarChart3,
  Percent,
  Eye,
  ChevronLeft,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/revenue", icon: Wallet, label: "Revenus" },
  { href: "/expenses", icon: Receipt, label: "Frais" },
  { href: "/invoices", icon: FileCheck, label: "Factures" },
  { href: "/quotes", icon: FileText, label: "Devis" },
  { href: "/history", icon: BarChart3, label: "Historique" },
];

interface ClientInfo {
  id: string;
  name?: string;
  businessName?: string;
  tvaAssujetti?: boolean;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const clientId = params.clientId as string;
  const [clientName, setClientName] = useState<string>("");
  const [tvaAssujetti, setTvaAssujetti] = useState(false);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch("/api/accountant/clients");
        if (res.ok) {
          const clients: ClientInfo[] = await res.json();
          const client = clients.find((c) => c.id === clientId);
          if (client) {
            setClientName(client.businessName || client.name || "Client");
            setTvaAssujetti(client.tvaAssujetti ?? false);
          }
        }
      } catch {}
    };
    fetchClient();
  }, [clientId]);

  const basePath = `/dashboard/mes-clients/${clientId}`;

  const isActive = (href: string) => {
    const sub = pathname.replace(basePath, "");
    return sub === href || sub === href + "/";
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3">
        <Eye className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium text-primary">
          Dossier de {clientName || "..."} — lecture seule
        </span>
      </div>

      {/* Back link + tabs */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/mes-clients"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Link>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-white p-1">
        {[...NAV_ITEMS, ...(tvaAssujetti ? [{ href: "/tva", icon: Percent, label: "TVA" }] : [])].map((item) => (
          <Link
            key={item.href}
            href={`${basePath}${item.href}`}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive(item.href)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}

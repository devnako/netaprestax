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
  Eye,
  ChevronLeft,
  MoreHorizontal,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/revenue", icon: Wallet, label: "Revenus" },
  { href: "/expenses", icon: Receipt, label: "Frais" },
  { href: "/invoices", icon: FileCheck, label: "Factures" },
  { href: "/quotes", icon: FileText, label: "Devis" },
  { href: "/history", icon: BarChart3, label: "Historique" },
];

const PRIMARY_NAV = [
  { href: "", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/revenue", icon: Wallet, label: "Revenus" },
  { href: "/expenses", icon: Receipt, label: "Frais" },
  { href: "/history", icon: BarChart3, label: "Historique" },
];

const SECONDARY_NAV = [
  { href: "/invoices", icon: FileCheck, label: "Factures" },
  { href: "/quotes", icon: FileText, label: "Devis" },
];

interface ClientInfo {
  name?: string;
  businessName?: string;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/accountant/clients`);
        if (res.ok) {
          const clients: ClientInfo[] = await res.json();
          const client = (clients as any[]).find((c: any) => c.id === clientId);
          if (client) {
            setClientName(client.businessName || client.name || "Client");
          }
        }
      } catch (err) {
        console.error("Failed to fetch client name");
      }
    };

    fetchClient();
  }, [clientId]);

  const isActive = (href: string) => {
    const currentPath = pathname.replace(`/accountant/dashboard/${clientId}`, "");
    return currentPath === href || currentPath === href + "/";
  };

  const isSecondaryActive = SECONDARY_NAV.some((item) => isActive(item.href));

  return (
    <div className="min-h-screen bg-muted">
      {/* Banner */}
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <span className="text-sm font-medium">
              Vous consultez le dossier de {clientName} — lecture seule
            </span>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-border bg-white md:block">
          <div className="space-y-1 p-4">
            <Link
              href="/accountant/dashboard"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour à mes clients
            </Link>
          </div>

          <nav className="space-y-1 border-t border-border p-4">
            {NAV_ITEMS.map((item) => {
              const href = `/accountant/dashboard/${clientId}${item.href}`;
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive(item.href)
                      ? "bg-primary/5 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-4 md:px-6 md:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white md:hidden">
        <div className="flex items-stretch">
          {PRIMARY_NAV.map((item) => {
            const href = `/accountant/dashboard/${clientId}${item.href}`;
            return (
              <Link
                key={item.href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 ${
                  isActive(item.href) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* More Menu */}
          <div className="relative flex flex-1 flex-col items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`flex w-full flex-col items-center gap-0.5 py-2 ${
                mobileMenuOpen || isSecondaryActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <MoreHorizontal className="h-5 w-5" />
              )}
              <span className="text-[10px] font-medium">Plus</span>
            </button>

            {mobileMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-48 rounded-xl border border-border bg-white p-2 shadow-lg">
                {SECONDARY_NAV.map((item) => {
                  const href = `/accountant/dashboard/${clientId}${item.href}`;
                  return (
                    <Link
                      key={item.href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                        isActive(item.href)
                          ? "bg-primary/5 text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="border-t border-border my-2 pt-2">
                  <Link
                    href="/accountant/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Retour
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}

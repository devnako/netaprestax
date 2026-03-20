import Link from "next/link";
import { LayoutDashboard, Receipt, Wallet, Settings, BarChart3, Bell, Calculator, Download, Users, FileText, FileCheck, Briefcase, Percent } from "lucide-react";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let hasClients = false;
  let tvaAssujetti = false;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session) {
      const [accessCount, profile] = await Promise.all([
        prisma.accountantAccess.count({
          where: { accountantId: session.user.id, status: "ACTIVE" },
        }),
        prisma.fiscalProfile.findUnique({
          where: { userId: session.user.id },
          select: { tvaAssujetti: true },
        }),
      ]);
      hasClients = accessCount > 0;
      tvaAssujetti = profile?.tvaAssujetti ?? false;
    }
  } catch {}

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
    { href: "/dashboard/revenue", icon: Wallet, label: "Revenus" },
    { href: "/dashboard/expenses", icon: Receipt, label: "Frais" },
    { href: "/dashboard/clients", icon: Users, label: "Clients" },
    { href: "/dashboard/quotes", icon: FileText, label: "Devis" },
    { href: "/dashboard/invoices", icon: FileCheck, label: "Factures" },
    ...(tvaAssujetti ? [{ href: "/dashboard/tva", icon: Percent, label: "TVA" }] : []),
    { href: "/dashboard/history", icon: BarChart3, label: "Historique" },
    { href: "/dashboard/alerts", icon: Bell, label: "Alertes" },
    { href: "/dashboard/simulation", icon: Calculator, label: "Simulation" },
    { href: "/dashboard/export", icon: Download, label: "Exporter" },
    { href: "/dashboard/settings", icon: Settings, label: "Paramètres" },
  ];

  return (
    <div className="min-h-screen bg-muted pb-20 md:pb-0">
      {/* Top nav */}
      <nav className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <Link href="/dashboard" className="text-xl font-bold text-foreground">
            Net<span className="text-primary">AprèsTax</span>
          </Link>
          <SignOutButton />
        </div>
      </nav>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-4 md:px-6 md:py-8">
        {/* Sidebar — desktop only */}
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <SidebarLink key={item.href} href={item.href} icon={<item.icon className="h-5 w-5" />} label={item.label} />
            ))}
            {hasClients && (
              <>
                <div className="my-2 border-t border-border" />
                <SidebarLink href="/dashboard/mes-clients" icon={<Briefcase className="h-5 w-5" />} label="Mes clients" />
              </>
            )}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Bottom tab bar — mobile only */}
      <MobileNav hasClients={hasClients} tvaAssujetti={tvaAssujetti} />
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-white hover:text-foreground"
    >
      {icon}
      {label}
    </Link>
  );
}

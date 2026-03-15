import Link from "next/link";
import { LayoutDashboard, Receipt, Wallet, Settings, BarChart3, Bell, Calculator, Download } from "lucide-react";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted">
      {/* Top nav */}
      <nav className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-xl font-bold text-foreground">
            Net<span className="text-primary">AprèsTax</span>
          </Link>
          <SignOutButton />
        </div>
      </nav>

      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="space-y-1">
            <SidebarLink href="/dashboard" icon={<LayoutDashboard className="h-5 w-5" />} label="Tableau de bord" />
            <SidebarLink href="/dashboard/revenue" icon={<Wallet className="h-5 w-5" />} label="Revenus" />
            <SidebarLink href="/dashboard/expenses" icon={<Receipt className="h-5 w-5" />} label="Frais" />
            <SidebarLink href="/dashboard/history" icon={<BarChart3 className="h-5 w-5" />} label="Historique" />
            <SidebarLink href="/dashboard/alerts" icon={<Bell className="h-5 w-5" />} label="Alertes" />
            <SidebarLink href="/dashboard/simulation" icon={<Calculator className="h-5 w-5" />} label="Simulation" />
            <SidebarLink href="/dashboard/export" icon={<Download className="h-5 w-5" />} label="Exporter" />
            <SidebarLink href="/dashboard/settings" icon={<Settings className="h-5 w-5" />} label="Paramètres" />
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
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

import Link from "next/link";
import { LayoutDashboard, Receipt, Wallet, Settings, BarChart3, Bell, Calculator, Download, MoreHorizontal } from "lucide-react";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord", shortLabel: "Accueil" },
  { href: "/dashboard/revenue", icon: Wallet, label: "Revenus", shortLabel: "Revenus" },
  { href: "/dashboard/expenses", icon: Receipt, label: "Frais", shortLabel: "Frais" },
  { href: "/dashboard/history", icon: BarChart3, label: "Historique", shortLabel: "Historique" },
  { href: "/dashboard/alerts", icon: Bell, label: "Alertes", shortLabel: "Alertes" },
  { href: "/dashboard/simulation", icon: Calculator, label: "Simulation", shortLabel: "Simulation" },
  { href: "/dashboard/export", icon: Download, label: "Exporter", shortLabel: "Export" },
  { href: "/dashboard/settings", icon: Settings, label: "Paramètres", shortLabel: "Réglages" },
] as const;

const MOBILE_PRIMARY = NAV_ITEMS.slice(0, 4);
const MOBILE_SECONDARY = NAV_ITEMS.slice(4);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            {NAV_ITEMS.map((item) => (
              <SidebarLink key={item.href} href={item.href} icon={<item.icon className="h-5 w-5" />} label={item.label} />
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Bottom tab bar — mobile only */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white md:hidden">
        <div className="flex items-stretch">
          {MOBILE_PRIMARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-muted-foreground active:text-primary"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.shortLabel}</span>
            </Link>
          ))}
          {/* More menu */}
          <div className="group relative flex flex-1 flex-col items-center">
            <button className="flex w-full flex-col items-center gap-0.5 py-2 text-muted-foreground active:text-primary">
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium">Plus</span>
            </button>
            <div className="invisible absolute bottom-full right-0 mb-2 w-48 rounded-xl border border-border bg-white p-2 shadow-lg group-focus-within:visible">
              {MOBILE_SECONDARY.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground active:bg-muted active:text-foreground"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
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

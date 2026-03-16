"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Wallet, Receipt, BarChart3,
  Bell, Calculator, Download, Settings, MoreHorizontal, X, Users, FileText, FileCheck,
} from "lucide-react";

const PRIMARY = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Accueil" },
  { href: "/dashboard/revenue", icon: Wallet, label: "Revenus" },
  { href: "/dashboard/expenses", icon: Receipt, label: "Frais" },
  { href: "/dashboard/history", icon: BarChart3, label: "Historique" },
];

const SECONDARY = [
  { href: "/dashboard/clients", icon: Users, label: "Clients" },
  { href: "/dashboard/quotes", icon: FileText, label: "Devis" },
  { href: "/dashboard/invoices", icon: FileCheck, label: "Factures" },
  { href: "/dashboard/alerts", icon: Bell, label: "Alertes" },
  { href: "/dashboard/simulation", icon: Calculator, label: "Simulation" },
  { href: "/dashboard/export", icon: Download, label: "Export" },
  { href: "/dashboard/settings", icon: Settings, label: "Paramètres" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close menu on outside tap
  useEffect(() => {
    if (!open) return;
    function handleTap(e: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleTap);
    document.addEventListener("touchstart", handleTap);
    return () => {
      document.removeEventListener("mousedown", handleTap);
      document.removeEventListener("touchstart", handleTap);
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const isSecondaryActive = SECONDARY.some((item) => isActive(item.href));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white md:hidden">
      <div className="flex items-stretch">
        {PRIMARY.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 ${
              isActive(item.href) ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}

        {/* More */}
        <div ref={menuRef} className="relative flex flex-1 flex-col items-center">
          <button
            onClick={() => setOpen(!open)}
            className={`flex w-full flex-col items-center gap-0.5 py-2 ${
              open || isSecondaryActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {open ? <X className="h-5 w-5" /> : <MoreHorizontal className="h-5 w-5" />}
            <span className="text-[10px] font-medium">Plus</span>
          </button>

          {open && (
            <div className="absolute bottom-full right-0 mb-2 w-48 rounded-xl border border-border bg-white p-2 shadow-lg">
              {SECONDARY.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive(item.href)
                      ? "bg-primary/5 text-primary"
                      : "text-muted-foreground active:bg-muted active:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

import Link from "next/link";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export default function AccountantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted pb-0">
      {/* Top nav */}
      <nav className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <Link href="/accountant/dashboard" className="text-xl font-bold text-foreground">
            Net<span className="text-primary">AprèsTax</span>
          </Link>
          <SignOutButton />
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-4 md:px-6 md:py-8">
        {/* Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}

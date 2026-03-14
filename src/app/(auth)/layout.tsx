import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted px-4">
      <Link
        href="/"
        className="mb-8 text-2xl font-bold text-foreground"
      >
        Net<span className="text-primary">AprèsTax</span>
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}

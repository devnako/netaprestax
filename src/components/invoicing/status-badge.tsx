const QUOTE_STATUS: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Brouillon", className: "bg-gray-100 text-gray-600" },
  SENT: { label: "Envoyé", className: "bg-blue-100 text-blue-700" },
  ACCEPTED: { label: "Accepté", className: "bg-green-100 text-green-700" },
  REFUSED: { label: "Refusé", className: "bg-red-100 text-red-700" },
};

const INVOICE_STATUS: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Brouillon", className: "bg-gray-100 text-gray-600" },
  PENDING: { label: "En attente", className: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "Payée", className: "bg-green-100 text-green-700" },
  OVERDUE: { label: "En retard", className: "bg-red-100 text-red-700" },
};

export function StatusBadge({ status, type }: { status: string; type: "quote" | "invoice" }) {
  const map = type === "quote" ? QUOTE_STATUS : INVOICE_STATUS;
  const config = map[status] || { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}

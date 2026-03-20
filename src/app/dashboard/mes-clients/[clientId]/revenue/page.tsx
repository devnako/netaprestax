"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FileText, Image } from "lucide-react";
import { MonthPicker } from "@/components/dashboard/month-picker";

const ACTIVITY_LABELS: Record<string, string> = {
  BIC_VENTE: "Vente",
  BIC_PRESTATION: "Prestation BIC",
  BNC_LIBERAL_URSSAF: "Libéral URSSAF",
  BNC_LIBERAL_CIPAV: "Libéral CIPAV",
};

function formatEuro(v: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(v);
}

function computeInvoiceVAT(lines: { quantity: number; unitPrice: number; vatRate: number | null }[]) {
  return lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unitPrice) * (l.vatRate ? Number(l.vatRate) / 100 : 0), 0);
}

interface RevenueEntry {
  id: string;
  amount: number;
  description?: string;
  activityType?: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  invoiceId?: string | null;
  vatRate?: number | null;
  vatAmount?: number | null;
  invoice?: {
    tvaAssujetti: boolean;
    lines: { quantity: number; unitPrice: number; vatRate: number | null }[];
  } | null;
}

export default function RevenuePage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [revenues, setRevenues] = useState<RevenueEntry[]>([]);
  const [totalHT, setTotalHT] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/accountant/${clientId}/revenue?month=${month}&year=${year}`);
        if (res.ok) {
          const data = await res.json();
          setRevenues(data.revenues.map((r: any) => ({ ...r, amount: Number(r.amount) })));
          setTotalHT(data.total);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clientId, month, year]);

  const totalVAT = revenues.reduce((sum, r) => {
    if (r.invoiceId && r.invoice?.tvaAssujetti) {
      return sum + computeInvoiceVAT(r.invoice.lines);
    }
    return sum + (r.vatAmount ?? 0);
  }, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Revenus</h1>
        <MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground">Chargement...</div>
      ) : revenues.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <p className="text-muted-foreground">Aucun revenu ce mois-ci</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-accent bg-accent/5 p-6 text-center">
            <p className="text-sm text-muted-foreground">CA du mois (HT)</p>
            <p className="mt-1 text-3xl font-bold text-accent">{formatEuro(totalHT)}</p>
            {totalVAT > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                TTC : {formatEuro(totalHT + totalVAT)} — dont {formatEuro(totalVAT)} de TVA
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {revenues.length} entrée{revenues.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="space-y-3">
            {revenues.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-2">
                    <div>
                      {r.invoiceId && r.invoice?.tvaAssujetti ? (() => {
                        const vat = computeInvoiceVAT(r.invoice.lines);
                        return (
                          <>
                            <span className="font-semibold text-foreground">{formatEuro(r.amount + vat)}</span>
                            <p className="text-xs text-muted-foreground">dont {formatEuro(vat)} de TVA</p>
                          </>
                        );
                      })() : r.vatAmount && r.vatAmount > 0 ? (
                        <>
                          <span className="font-semibold text-foreground">{formatEuro(r.amount + r.vatAmount)}</span>
                          <p className="text-xs text-muted-foreground">dont {formatEuro(r.vatAmount)} de TVA</p>
                        </>
                      ) : (
                        <span className="font-semibold text-foreground">{formatEuro(r.amount)}</span>
                      )}
                    </div>
                    {r.invoiceId && (
                      <a
                        href={`/api/invoices/pdf?id=${r.invoiceId}`}
                        target="_blank"
                        className="text-xs text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Voir la facture
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!r.invoiceId && r.attachmentUrl ? (
                      <button
                        onClick={() => window.open(`/api/attachments?type=revenue&id=${r.id}`, "_blank")}
                        title={r.attachmentName || "Pièce jointe"}
                        className="p-1 text-primary hover:text-primary/70"
                      >
                        {r.attachmentName?.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                          <Image className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </button>
                    ) : null}
                    {r.activityType && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {ACTIVITY_LABELS[r.activityType] || r.activityType}
                      </span>
                    )}
                  </div>
                </div>
                {r.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

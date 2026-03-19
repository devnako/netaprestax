"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Download, FileText, Image } from "lucide-react";
import { MonthPicker } from "@/components/dashboard/month-picker";

const ACTIVITY_LABELS: Record<string, string> = {
  BIC_VENTE: "Vente",
  BIC_PRESTATION: "Prestation BIC",
  BNC_LIBERAL_URSSAF: "Libéral URSSAF",
  BNC_LIBERAL_CIPAV: "Libéral CIPAV",
};

interface RevenueEntry {
  id: string;
  amount: number;
  description?: string;
  activityType?: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  invoiceId?: string | null;
}

export default function RevenuePage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [revenues, setRevenues] = useState<RevenueEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/accountant/${clientId}/revenue?month=${month}&year=${year}`);
        if (res.ok) {
          const data = await res.json();
          setRevenues(data.revenues.map((r: any) => ({ ...r, amount: Number(r.amount) })));
          setTotal(data.total);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clientId, month, year]);

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
          <div className="rounded-xl border border-border bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-bold text-foreground">
                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(total)}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {revenues.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(r.amount)}
                    </span>
                    {r.invoiceId ? (
                      <button
                        onClick={async () => {
                          const res = await fetch(`/api/invoices/pdf?id=${r.invoiceId}`);
                          if (!res.ok) return;
                          const html = await res.text();
                          const html2pdf = (await import("html2pdf.js")).default;
                          const container = document.createElement("div");
                          container.innerHTML = html;
                          document.body.appendChild(container);
                          const el = container.querySelector("body") || container;
                          await html2pdf()
                            .set({
                              margin: 0,
                              image: { type: "jpeg", quality: 0.98 },
                              html2canvas: { scale: 2, useCORS: true },
                              jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                            })
                            .from(el)
                            .save();
                          document.body.removeChild(container);
                        }}
                        title="Télécharger la facture"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    ) : r.attachmentUrl ? (
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
                  </div>
                  {r.activityType && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {ACTIVITY_LABELS[r.activityType] || r.activityType}
                    </span>
                  )}
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

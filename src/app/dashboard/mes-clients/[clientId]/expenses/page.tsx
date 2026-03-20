"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FileText, Image } from "lucide-react";
import { MonthPicker } from "@/components/dashboard/month-picker";

const CATEGORY_LABELS: Record<string, string> = {
  LOGICIEL: "Logiciel",
  TRANSPORT: "Transport",
  MATERIEL: "Matériel",
  TELEPHONE: "Téléphone",
  BUREAU: "Bureau",
  FORMATION: "Formation",
  ASSURANCE: "Assurance",
  AUTRE: "Autre",
};

interface ExpenseEntry {
  id: string;
  amount: number;
  category: string;
  label: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  vatRate: number | null;
  vatAmount: number | null;
}

export default function ExpensesPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/accountant/${clientId}/expenses?month=${month}&year=${year}`);
        if (res.ok) {
          const data = await res.json();
          setExpenses(data.expenses);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clientId, month, year]);

  const total = expenses.reduce((sum, e) => sum + e.amount + (e.vatAmount ?? 0), 0);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Frais</h1>
        <MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground">Chargement...</div>
      ) : expenses.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <p className="text-muted-foreground">Aucun frais ce mois-ci</p>
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
            {expenses.map((e) => (
              <div key={e.id} className="rounded-xl border border-border bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="font-semibold text-foreground">
                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(e.amount + (e.vatAmount ?? 0))}
                      </span>
                      {e.vatAmount != null && e.vatAmount > 0 && (
                        <p className="text-xs text-muted-foreground">dont {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(e.vatAmount)} de TVA</p>
                      )}
                    </div>
                    {e.attachmentUrl && (
                      <button
                        onClick={() => window.open(`/api/attachments?type=expense&id=${e.id}`, "_blank")}
                        title={e.attachmentName || "Pièce jointe"}
                        className="p-1 text-primary hover:text-primary/70"
                      >
                        {e.attachmentName?.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                          <Image className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {CATEGORY_LABELS[e.category] || e.category}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{e.label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

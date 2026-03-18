"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MonthPicker } from "@/components/dashboard/month-picker";

interface Revenue {
  id: string;
  amount: number;
  description: string;
  activityType: string;
}

export default function RevenuesPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenues = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/accountant/${clientId}/revenue?month=${month}&year=${year}`
        );
        if (res.ok) {
          const data = await res.json();
          setRevenues(data);
        }
      } catch (err) {
        console.error("Failed to fetch revenues");
      } finally {
        setLoading(false);
      }
    };

    fetchRevenues();
  }, [clientId, month, year]);

  const total = revenues.reduce((sum, r) => sum + Number(r.amount), 0);

  const ACTIVITY_LABELS: Record<string, string> = {
    BIC_VENTE: "Vente",
    BIC_PRESTATION: "Prestation",
    BNC_LIBERAL_URSSAF: "Libéral URSSAF",
    BNC_LIBERAL_CIPAV: "Libéral CIPAV",
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Revenus</h1>
      </div>

      <MonthPicker
        month={month}
        year={year}
        onChange={(m, y) => {
          setMonth(m);
          setYear(y);
        }}
      />

      {!loading && revenues.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm text-muted-foreground">Total du mois</p>
          <p className="text-2xl font-bold text-foreground">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(total)}
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center text-muted-foreground">Chargement...</div>
      )}

      {!loading && revenues.length === 0 && (
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <p className="text-muted-foreground">Aucun revenu ce mois-ci</p>
        </div>
      )}

      {!loading && revenues.length > 0 && (
        <div className="space-y-3">
          {revenues.map((revenue) => (
            <div key={revenue.id} className="rounded-lg border border-border bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    }).format(Number(revenue.amount))}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {revenue.description}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  {ACTIVITY_LABELS[revenue.activityType] || revenue.activityType}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

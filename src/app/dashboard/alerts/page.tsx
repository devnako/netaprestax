"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

interface AlertData {
  yearlyCA: number;
  seuilCA: number;
  seuilPercent: number;
  activityLabel: string;
  alerts: Array<{
    type: "warning" | "danger" | "info";
    title: string;
    message: string;
  }>;
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AlertsPage() {
  const [data, setData] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const res = await fetch("/api/alerts");
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;
  if (!data) return <p className="text-muted-foreground">Erreur de chargement.</p>;

  const remaining = data.seuilCA - data.yearlyCA;
  const monthsLeft = 12 - new Date().getMonth();
  const maxPerMonth = monthsLeft > 0 ? remaining / monthsLeft : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Alertes &amp; Seuils</h1>
        <p className="mt-1 text-sm text-muted-foreground">{data.activityLabel}</p>
      </div>

      {/* Gauge */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Seuil auto-entrepreneur</h2>
          <span className={`text-sm font-medium ${data.seuilPercent > 80 ? "text-orange-600" : "text-muted-foreground"}`}>
            {data.seuilPercent.toFixed(1)}%
          </span>
        </div>

        <div className="mt-4 h-4 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              data.seuilPercent > 90
                ? "bg-red-500"
                : data.seuilPercent > 80
                  ? "bg-orange-500"
                  : data.seuilPercent > 60
                    ? "bg-yellow-500"
                    : "bg-primary"
            }`}
            style={{ width: `${Math.min(data.seuilPercent, 100)}%` }}
          />
        </div>

        <div className="mt-3 flex justify-between text-sm text-muted-foreground">
          <span>{formatEuro(data.yearlyCA)}</span>
          <span>{formatEuro(data.seuilCA)}</span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Restant avant seuil</p>
            <p className="mt-1 text-xl font-bold text-foreground">{formatEuro(Math.max(remaining, 0))}</p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Max/mois restant</p>
            <p className="mt-1 text-xl font-bold text-foreground">
              {monthsLeft > 0 ? formatEuro(Math.max(maxPerMonth, 0)) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">{monthsLeft} mois restants</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        {data.alerts.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-5">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-accent" />
            <div>
              <p className="font-medium text-foreground">Tout est bon</p>
              <p className="text-sm text-muted-foreground">
                Tu es bien en dessous des seuils. Continue comme ça !
              </p>
            </div>
          </div>
        ) : (
          data.alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-2xl border p-5 ${
                alert.type === "danger"
                  ? "border-red-200 bg-red-50"
                  : alert.type === "warning"
                    ? "border-orange-200 bg-orange-50"
                    : "border-primary/20 bg-primary/5"
              }`}
            >
              {alert.type === "danger" ? (
                <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />
              ) : alert.type === "warning" ? (
                <AlertTriangle className="h-6 w-6 shrink-0 text-orange-600" />
              ) : (
                <TrendingUp className="h-6 w-6 shrink-0 text-primary" />
              )}
              <div>
                <p className="font-medium text-foreground">{alert.title}</p>
                <p className="text-sm text-muted-foreground">{alert.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

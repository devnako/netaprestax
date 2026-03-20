"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

const QUARTER_LABELS = ["T1 (Jan–Mar)", "T2 (Avr–Jun)", "T3 (Jul–Sep)", "T4 (Oct–Dec)"];
const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

interface Detail {
  label: string;
  ht: number;
  tva: number;
}

interface TVAData {
  tvaCollectee: number;
  tvaDeductible: number;
  solde: number;
  collecteeDetails: Detail[];
  deductibleDetails: Detail[];
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value);
}

export default function TVAPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const now = new Date();
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);

  const [mode, setMode] = useState<"month" | "quarter">("quarter");
  const [year, setYear] = useState(now.getFullYear());
  const [period, setPeriod] = useState(mode === "quarter" ? currentQuarter : now.getMonth() + 1);
  const [data, setData] = useState<TVAData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accountant/${clientId}/tva?mode=${mode}&year=${year}&period=${period}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    }
    setLoading(false);
  }, [clientId, mode, year, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleModeChange = (newMode: "month" | "quarter") => {
    setMode(newMode);
    if (newMode === "quarter") {
      setPeriod(currentQuarter);
    } else {
      setPeriod(now.getMonth() + 1);
    }
  };

  const prev = () => {
    const max = mode === "quarter" ? 4 : 12;
    if (period === 1) { setPeriod(max); setYear(year - 1); }
    else { setPeriod(period - 1); }
  };

  const next = () => {
    const max = mode === "quarter" ? 4 : 12;
    if (period === max) { setPeriod(1); setYear(year + 1); }
    else { setPeriod(period + 1); }
  };

  const periodLabel = mode === "quarter"
    ? `${QUARTER_LABELS[period - 1]} ${year}`
    : `${MONTH_NAMES[period - 1]} ${year}`;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <h1 className="text-2xl font-bold text-foreground">TVA</h1>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => handleModeChange("month")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            mode === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white"
          }`}
        >
          Par mois
        </button>
        <button
          onClick={() => handleModeChange("quarter")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            mode === "quarter" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white"
          }`}
        >
          Par trimestre
        </button>
      </div>

      {/* Period navigation */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3">
        <button onClick={prev} className="p-1 text-muted-foreground hover:text-foreground">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <p className="text-sm font-semibold text-foreground">{periodLabel}</p>
        <button onClick={next} className="p-1 text-muted-foreground hover:text-foreground">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center">Chargement...</p>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-white p-5 text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">TVA collectée</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{formatEuro(data.tvaCollectee)}</p>
              <p className="mt-1 text-xs text-muted-foreground">sur factures payées</p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-5 text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">TVA déductible</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{formatEuro(data.tvaDeductible)}</p>
              <p className="mt-1 text-xs text-muted-foreground">sur frais et achats</p>
            </div>
            <div className={`rounded-2xl border p-5 text-center ${
              data.solde > 0 ? "border-red-200 bg-red-50"
                : data.solde < 0 ? "border-green-200 bg-green-50"
                : "border-border bg-white"
            }`}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Solde TVA</p>
              <p className={`mt-2 text-2xl font-bold ${
                data.solde > 0 ? "text-red-600" : data.solde < 0 ? "text-green-600" : "text-foreground"
              }`}>
                {formatEuro(Math.abs(data.solde))}
              </p>
              <p className={`mt-1 text-xs font-medium ${
                data.solde > 0 ? "text-red-600" : data.solde < 0 ? "text-green-600" : "text-muted-foreground"
              }`}>
                {data.solde > 0 ? "À reverser" : data.solde < 0 ? "Crédit de TVA" : "Équilibre"}
              </p>
            </div>
          </div>

          {/* Collectée details */}
          <div className="rounded-2xl border border-border bg-white p-4 md:p-6">
            <h2 className="font-semibold text-foreground">TVA collectée — Détail</h2>
            {data.collecteeDetails.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Aucune facture payée avec TVA sur cette période.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {data.collecteeDetails.map((d, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.label}</p>
                      <p className="text-xs text-muted-foreground">HT : {formatEuro(d.ht)}</p>
                    </div>
                    <span className="font-semibold text-foreground">{formatEuro(d.tva)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 px-4">
                  <span className="text-sm font-medium text-foreground">Total collectée</span>
                  <span className="font-bold text-foreground">{formatEuro(data.tvaCollectee)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Déductible details */}
          <div className="rounded-2xl border border-border bg-white p-4 md:p-6">
            <h2 className="font-semibold text-foreground">TVA déductible — Détail</h2>
            {data.deductibleDetails.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Aucun frais avec TVA sur cette période.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {data.deductibleDetails.map((d, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.label}</p>
                      <p className="text-xs text-muted-foreground">HT : {formatEuro(d.ht)}</p>
                    </div>
                    <span className="font-semibold text-foreground">{formatEuro(d.tva)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 px-4">
                  <span className="text-sm font-medium text-foreground">Total déductible</span>
                  <span className="font-bold text-foreground">{formatEuro(data.tvaDeductible)}</span>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <p className="text-muted-foreground">Pas de données TVA pour cette période</p>
        </div>
      )}
    </div>
  );
}

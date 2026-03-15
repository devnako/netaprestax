"use client";

import { useState, useEffect, useCallback } from "react";
import { calculerNetReel } from "@/lib/fiscal/engine";
import type { FiscalProfile, CalculResult } from "@/lib/fiscal/types";
import { Calculator } from "lucide-react";

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(rate: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: 1,
  }).format(rate);
}

export default function SimulationPage() {
  const [profile, setProfile] = useState<FiscalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ca, setCa] = useState(5000);
  const [frais, setFrais] = useState(0);
  const [result, setResult] = useState<CalculResult | null>(null);

  const loadProfile = useCallback(async () => {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setProfile({
        activityType: data.activityType,
        versementLiberatoire: data.versementLiberatoire,
        tvaAssujetti: data.tvaAssujetti,
        acre: data.acre,
        acreDateDebut: data.acreDateDebut ? new Date(data.acreDateDebut) : null,
        situationFamiliale: data.situationFamiliale,
        enfantsACharge: data.enfantsACharge,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!profile || ca <= 0) {
      setResult(null);
      return;
    }
    setResult(calculerNetReel({ ca, fraisReels: frais, profile }));
  }, [ca, frais, profile]);

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;
  if (!profile) return <p className="text-muted-foreground">Profil non trouvé.</p>;

  const netPercent = result && ca > 0 ? (result.netReel / ca) * 100 : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Simulation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Teste différents scénarios pour voir ce qu&apos;il te reste.
        </p>
      </div>

      {/* Sliders */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Chiffre d&apos;affaires mensuel
              </label>
              <span className="text-lg font-bold text-primary">{formatEuro(ca)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={20000}
              step={100}
              value={ca}
              onChange={(e) => setCa(Number(e.target.value))}
              className="mt-2 w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 €</span>
              <span>20 000 €</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Frais réels</label>
              <span className="text-lg font-bold text-muted-foreground">{formatEuro(frais)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={5000}
              step={50}
              value={frais}
              onChange={(e) => setFrais(Number(e.target.value))}
              className="mt-2 w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 €</span>
              <span>5 000 €</span>
            </div>
          </div>
        </div>
      </div>

      {/* Result */}
      {result && ca > 0 && (
        <>
          {/* Big number */}
          <div className="rounded-2xl border border-accent bg-accent/5 p-8 text-center">
            <Calculator className="mx-auto h-8 w-8 text-accent" />
            <p className="mt-2 text-sm text-muted-foreground">Il te reste</p>
            <p className="mt-1 text-4xl font-bold text-accent">{formatEuro(result.netReel)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              soit {netPercent.toFixed(1)}% de ton CA
            </p>
          </div>

          {/* Breakdown */}
          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="text-lg font-semibold text-foreground">Détail</h2>
            <div className="mt-4 space-y-3">
              <Row label="Chiffre d'affaires" value={formatEuro(ca)} />
              <Row
                label={`Cotisations sociales (${formatPercent(result.tauxCotisations)})`}
                value={`-${formatEuro(result.cotisationsSociales)}`}
                negative
              />
              <Row
                label={`CFP (${formatPercent(result.tauxCFP)})`}
                value={`-${formatEuro(result.cfp)}`}
                negative
              />
              <Row
                label={
                  result.tauxIR !== null
                    ? `Impôt — VFL (${formatPercent(result.tauxIR)})`
                    : `Impôt — barème (${result.partsFiscales} part${result.partsFiscales > 1 ? "s" : ""})`
                }
                value={`-${formatEuro(result.impotRevenu)}`}
                negative
              />
              {frais > 0 && (
                <Row label="Frais réels" value={`-${formatEuro(frais)}`} negative />
              )}
              <div className="border-t border-border pt-3">
                <Row label="Net réel" value={formatEuro(result.netReel)} bold />
              </div>
            </div>
          </div>

          {/* Annual projection */}
          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="text-lg font-semibold text-foreground">Projection annuelle</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Si tu factures {formatEuro(ca)}/mois toute l&apos;année :
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">CA annuel</p>
                <p className="mt-1 text-xl font-bold text-foreground">{formatEuro(ca * 12)}</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Prélèvements annuels</p>
                <p className="mt-1 text-xl font-bold text-orange-600">
                  -{formatEuro((result.cotisationsSociales + result.cfp + result.impotRevenu + frais) * 12)}
                </p>
              </div>
              <div className="rounded-lg bg-accent/5 border border-accent/30 p-4">
                <p className="text-sm text-muted-foreground">Net annuel</p>
                <p className="mt-1 text-xl font-bold text-accent">{formatEuro(result.netReel * 12)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  negative,
  bold,
}: {
  label: string;
  value: string;
  negative?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
      <span
        className={`text-sm ${
          bold ? "font-bold text-accent" : negative ? "text-red-600" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

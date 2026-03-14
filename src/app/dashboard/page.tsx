import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { calculerNetReel } from "@/lib/fiscal/engine";
import { ACTIVITY_LABELS, SEUILS_CA } from "@/lib/fiscal/rates";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { FiscalProfile } from "@/lib/fiscal/types";
import { Wallet, TrendingDown, PiggyBank, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  const profile = await prisma.fiscalProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) redirect("/onboarding");

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Get current month revenue
  const revenue = await prisma.revenue.findUnique({
    where: {
      userId_month_year: {
        userId: session.user.id,
        month: currentMonth,
        year: currentYear,
      },
    },
  });

  // Get current month expenses
  const expenses = await prisma.expense.findMany({
    where: {
      userId: session.user.id,
      month: currentMonth,
      year: currentYear,
    },
  });

  // Get yearly total CA
  const yearlyRevenues = await prisma.revenue.findMany({
    where: { userId: session.user.id, year: currentYear },
  });

  const totalFrais = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const ca = revenue ? Number(revenue.amount) : 0;
  const yearlyCA = yearlyRevenues.reduce((sum, r) => sum + Number(r.amount), 0);
  const seuilCA = SEUILS_CA[profile.activityType as keyof typeof SEUILS_CA];
  const seuilPercent = Math.min((yearlyCA / seuilCA) * 100, 100);

  const fiscalProfile: FiscalProfile = {
    activityType: profile.activityType as FiscalProfile["activityType"],
    versementLiberatoire: profile.versementLiberatoire,
    tvaAssujetti: profile.tvaAssujetti,
    acre: profile.acre,
    acreDateDebut: profile.acreDateDebut,
    situationFamiliale: profile.situationFamiliale as FiscalProfile["situationFamiliale"],
    enfantsACharge: profile.enfantsACharge,
  };

  const result = calculerNetReel({
    ca,
    fraisReels: totalFrais,
    profile: fiscalProfile,
  });

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {monthNames[currentMonth - 1]} {currentYear}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ACTIVITY_LABELS[profile.activityType as keyof typeof ACTIVITY_LABELS]}
        </p>
      </div>

      {ca === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-8 text-center">
          <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            Pas encore de CA ce mois-ci
          </h2>
          <p className="mt-2 text-muted-foreground">
            Ajoute ton chiffre d&apos;affaires pour voir combien il te reste.
          </p>
          <a
            href="/dashboard/revenue"
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Ajouter mon CA
          </a>
        </div>
      ) : (
        <>
          {/* Main cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Chiffre d'affaires"
              value={formatCurrency(result.ca)}
              icon={<Wallet className="h-5 w-5 text-primary" />}
            />
            <StatCard
              label="Cotisations + CFP"
              value={`-${formatCurrency(result.cotisationsSociales + result.cfp)}`}
              sublabel={formatPercent(result.tauxCotisations + result.tauxCFP)}
              icon={<TrendingDown className="h-5 w-5 text-orange-500" />}
            />
            <StatCard
              label="Impôt sur le revenu"
              value={`-${formatCurrency(result.impotRevenu)}`}
              sublabel={result.tauxIR !== null ? `VFL ${formatPercent(result.tauxIR)}` : "Barème progressif"}
              icon={<TrendingDown className="h-5 w-5 text-red-500" />}
            />
            <StatCard
              label="Net réel"
              value={formatCurrency(result.netReel)}
              highlight
              icon={<PiggyBank className="h-5 w-5 text-accent" />}
            />
          </div>

          {/* Breakdown */}
          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="text-lg font-semibold text-foreground">Détail du calcul</h2>
            <div className="mt-4 space-y-3">
              <BreakdownLine label="Chiffre d'affaires" value={formatCurrency(ca)} />
              <BreakdownLine
                label={`Cotisations sociales (${formatPercent(result.tauxCotisations)})`}
                value={`-${formatCurrency(result.cotisationsSociales)}`}
                negative
              />
              <BreakdownLine
                label={`CFP (${formatPercent(result.tauxCFP)})`}
                value={`-${formatCurrency(result.cfp)}`}
                negative
              />
              <BreakdownLine
                label={
                  result.tauxIR !== null
                    ? `Impôt — versement libératoire (${formatPercent(result.tauxIR)})`
                    : `Impôt — barème progressif (${result.partsFiscales} part${result.partsFiscales > 1 ? "s" : ""})`
                }
                value={`-${formatCurrency(result.impotRevenu)}`}
                negative
              />
              {totalFrais > 0 && (
                <BreakdownLine
                  label="Frais réels"
                  value={`-${formatCurrency(totalFrais)}`}
                  negative
                />
              )}
              <div className="border-t border-border pt-3">
                <BreakdownLine
                  label="Net réel (dans ta poche)"
                  value={formatCurrency(result.netReel)}
                  bold
                />
              </div>
            </div>
          </div>

          {/* Yearly CA progress */}
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">CA annuel {currentYear}</h2>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(yearlyCA)} / {formatCurrency(seuilCA)}
              </span>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  seuilPercent > 80 ? "bg-orange-500" : "bg-primary"
                }`}
                style={{ width: `${seuilPercent}%` }}
              />
            </div>
            {seuilPercent > 80 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                Tu approches du seuil auto-entrepreneur
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        highlight
          ? "border-accent bg-accent/5"
          : "border-border bg-white"
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className={`mt-2 text-2xl font-bold ${highlight ? "text-accent" : "text-foreground"}`}>
        {value}
      </p>
      {sublabel && (
        <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
      )}
    </div>
  );
}

function BreakdownLine({
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
          bold
            ? "font-bold text-accent"
            : negative
              ? "text-red-600"
              : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

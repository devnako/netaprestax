import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccountantAccess } from "@/lib/accountant";
import { calculerNetReel } from "@/lib/fiscal/engine";
import { ACTIVITY_LABELS, SEUILS_CA } from "@/lib/fiscal/rates";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { FiscalProfile } from "@/lib/fiscal/types";
import { Wallet, TrendingDown, PiggyBank } from "lucide-react";

export default async function ClientDashboardPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { clientId } = await params;
  const hasAccess = await verifyAccountantAccess(session.user.id, clientId);
  if (!hasAccess) redirect("/dashboard/mes-clients");

  const client = await prisma.user.findUnique({ where: { id: clientId } });
  if (!client) redirect("/dashboard/mes-clients");

  const profile = await prisma.fiscalProfile.findUnique({
    where: { userId: clientId },
  });

  if (!profile) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <p className="text-muted-foreground">Profil fiscal non configuré</p>
      </div>
    );
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [monthRevenues, expenses, yearlyRevenues] = await Promise.all([
    prisma.revenue.findMany({
      where: { userId: clientId, month: currentMonth, year: currentYear },
    }),
    prisma.expense.findMany({
      where: { userId: clientId, month: currentMonth, year: currentYear },
    }),
    prisma.revenue.findMany({
      where: { userId: clientId, year: currentYear },
    }),
  ]);

  const totalFrais = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const ca = monthRevenues.reduce((sum, r) => sum + Number(r.amount), 0);
  const yearlyCA = yearlyRevenues.reduce((sum, r) => sum + Number(r.amount), 0);
  const seuilCA = SEUILS_CA[profile.activityType as keyof typeof SEUILS_CA];
  const seuilPercent = Math.min((yearlyCA / seuilCA) * 100, 100);

  const revenuesByActivity = new Map<string, number>();
  for (const rev of monthRevenues) {
    const type = rev.activityType || profile.activityType;
    revenuesByActivity.set(type, (revenuesByActivity.get(type) || 0) + Number(rev.amount));
  }

  let totalCotisations = 0;
  let totalCFP = 0;
  let totalIR = 0;
  let mainTauxCotisations = 0;
  let mainTauxCFP = 0;
  let mainTauxIR: number | null = null;
  let mainPartsFiscales = 1;
  let mainRevenuImposable: number | null = null;

  for (const [actType, actCA] of revenuesByActivity) {
    const actProfile: FiscalProfile = {
      activityType: actType as FiscalProfile["activityType"],
      versementLiberatoire: profile.versementLiberatoire,
      tvaAssujetti: profile.tvaAssujetti,
      acre: profile.acre,
      acreDateDebut: profile.acreDateDebut,
      situationFamiliale: profile.situationFamiliale as FiscalProfile["situationFamiliale"],
      enfantsACharge: profile.enfantsACharge,
    };
    const actResult = calculerNetReel({ ca: actCA, fraisReels: 0, profile: actProfile });
    totalCotisations += actResult.cotisationsSociales;
    totalCFP += actResult.cfp;
    totalIR += actResult.impotRevenu;

    if (actCA >= (revenuesByActivity.get(profile.activityType) || 0)) {
      mainTauxCotisations = actResult.tauxCotisations;
      mainTauxCFP = actResult.tauxCFP;
      mainTauxIR = actResult.tauxIR;
      mainPartsFiscales = actResult.partsFiscales;
      mainRevenuImposable = actResult.revenuImposable;
    }
  }

  const defaultProfile: FiscalProfile = {
    activityType: profile.activityType as FiscalProfile["activityType"],
    versementLiberatoire: profile.versementLiberatoire,
    tvaAssujetti: profile.tvaAssujetti,
    acre: profile.acre,
    acreDateDebut: profile.acreDateDebut,
    situationFamiliale: profile.situationFamiliale as FiscalProfile["situationFamiliale"],
    enfantsACharge: profile.enfantsACharge,
  };
  const fallbackResult = calculerNetReel({ ca, fraisReels: totalFrais, profile: defaultProfile });

  const result = revenuesByActivity.size > 1
    ? {
        ca,
        cotisationsSociales: totalCotisations,
        cfp: totalCFP,
        impotRevenu: totalIR,
        fraisReels: totalFrais,
        netReel: Math.round((ca - totalCotisations - totalCFP - totalIR - totalFrais) * 100) / 100,
        tauxCotisations: mainTauxCotisations,
        tauxCFP: mainTauxCFP,
        tauxIR: mainTauxIR,
        revenuImposable: mainRevenuImposable,
        partsFiscales: mainPartsFiscales,
      }
    : fallbackResult;

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];

  return (
    <div className="space-y-8">
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
            Pas de CA ce mois-ci
          </h2>
          <p className="mt-2 text-muted-foreground">
            Aucun chiffre d&apos;affaires enregistré pour {monthNames[currentMonth - 1]} {currentYear}.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
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

          <div className="rounded-2xl border border-border bg-white p-4 md:p-6">
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
                  label="Net réel (dans la poche)"
                  value={formatCurrency(result.netReel)}
                  bold
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-4 md:p-6">
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
                Approche du seuil auto-entrepreneur
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
      className={`rounded-xl border p-3 md:p-5 ${
        highlight ? "border-accent bg-accent/5" : "border-border bg-white"
      }`}
    >
      <div className="flex items-center gap-1.5 md:gap-2">
        {icon}
        <span className="text-xs text-muted-foreground md:text-sm">{label}</span>
      </div>
      <p className={`mt-1.5 text-lg font-bold md:mt-2 md:text-2xl ${highlight ? "text-accent" : "text-foreground"}`}>
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

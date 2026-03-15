import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { calculerNetReel } from "@/lib/fiscal/engine";
import { ACTIVITY_LABELS, SEUILS_CA } from "@/lib/fiscal/rates";
import type { FiscalProfile } from "@/lib/fiscal/types";

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const year = Number(request.nextUrl.searchParams.get("year")) || new Date().getFullYear();

  const profile = await prisma.fiscalProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
  }

  const revenues = await prisma.revenue.findMany({
    where: { userId: session.user.id, year },
    orderBy: { month: "asc" },
  });

  const expenses = await prisma.expense.findMany({
    where: { userId: session.user.id, year },
  });

  const fiscalProfile: FiscalProfile = {
    activityType: profile.activityType as FiscalProfile["activityType"],
    versementLiberatoire: profile.versementLiberatoire,
    tvaAssujetti: profile.tvaAssujetti,
    acre: profile.acre,
    acreDateDebut: profile.acreDateDebut,
    situationFamiliale: profile.situationFamiliale as FiscalProfile["situationFamiliale"],
    enfantsACharge: profile.enfantsACharge,
  };

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];

  let totalCA = 0, totalCot = 0, totalCFP = 0, totalIR = 0, totalFrais = 0, totalNet = 0;

  const monthRows = [];
  for (let i = 0; i < 12; i++) {
    const month = i + 1;
    const revenue = revenues.find((r) => r.month === month);
    const monthExpenses = expenses.filter((e) => e.month === month);
    const ca = revenue ? Number(revenue.amount) : 0;
    const frais = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    if (ca > 0) {
      const result = calculerNetReel({ ca, fraisReels: frais, profile: fiscalProfile });
      totalCA += ca;
      totalCot += result.cotisationsSociales;
      totalCFP += result.cfp;
      totalIR += result.impotRevenu;
      totalFrais += frais;
      totalNet += result.netReel;

      monthRows.push(`
        <tr>
          <td>${monthNames[i]}</td>
          <td class="num">${formatEuro(ca)}</td>
          <td class="num neg">${formatEuro(result.cotisationsSociales)}</td>
          <td class="num neg">${formatEuro(result.cfp)}</td>
          <td class="num neg">${formatEuro(result.impotRevenu)}</td>
          <td class="num neg">${formatEuro(frais)}</td>
          <td class="num bold">${formatEuro(result.netReel)}</td>
        </tr>
      `);
    } else {
      monthRows.push(`
        <tr class="empty">
          <td>${monthNames[i]}</td>
          <td class="num">—</td><td class="num">—</td><td class="num">—</td>
          <td class="num">—</td><td class="num">—</td><td class="num">—</td>
        </tr>
      `);
    }
  }

  const activityLabel = ACTIVITY_LABELS[profile.activityType as keyof typeof ACTIVITY_LABELS];
  const seuilCA = SEUILS_CA[profile.activityType as keyof typeof SEUILS_CA];

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>NetAprèsTax — Récapitulatif ${year}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #2563eb; font-size: 24px; }
    h2 { font-size: 16px; margin-top: 32px; margin-bottom: 12px; color: #374151; }
    .subtitle { color: #6b7280; font-size: 14px; margin-top: 4px; }
    .meta { display: flex; gap: 32px; margin-top: 16px; padding: 16px; background: #f3f4f6; border-radius: 8px; font-size: 13px; }
    .meta-item span { color: #6b7280; }
    .meta-item strong { display: block; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
    th { text-align: left; padding: 8px 12px; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600; }
    td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .neg { color: #dc2626; }
    .bold { font-weight: 700; color: #16a34a; }
    .total td { border-top: 2px solid #1a1a1a; font-weight: 700; padding-top: 12px; }
    .total .bold { color: #16a34a; font-size: 14px; }
    .empty td { color: #d1d5db; }
    .summary { display: flex; gap: 16px; margin-top: 24px; }
    .summary-card { flex: 1; padding: 16px; border-radius: 8px; background: #f3f4f6; }
    .summary-card.accent { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .summary-card span { font-size: 12px; color: #6b7280; }
    .summary-card strong { display: block; font-size: 20px; margin-top: 4px; }
    .summary-card.accent strong { color: #16a34a; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
    .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #2563eb; color: white; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; font-size: 14px; z-index: 100; }
    .print-bar button { background: white; color: #2563eb; border: none; padding: 8px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; }
    @media print { body { padding: 20px; } .print-bar { display: none; } }
  </style>
</head>
<body style="padding-top: 60px;">
  <div class="print-bar">
    <span>Enregistre en PDF via la boîte de dialogue</span>
    <button onclick="window.print()">Enregistrer en PDF</button>
  </div>
  <h1>NetAprèsTax</h1>
  <p class="subtitle">Récapitulatif annuel ${year} — ${session.user.name || session.user.email}</p>

  <div class="meta">
    <div class="meta-item"><span>Activité</span><strong>${activityLabel}</strong></div>
    <div class="meta-item"><span>Régime IR</span><strong>${profile.versementLiberatoire ? "Versement libératoire" : "Barème progressif"}</strong></div>
    <div class="meta-item"><span>Plafond CA</span><strong>${formatEuro(seuilCA)}</strong></div>
  </div>

  <div class="summary">
    <div class="summary-card"><span>CA annuel</span><strong>${formatEuro(totalCA)}</strong></div>
    <div class="summary-card"><span>Total prélèvements</span><strong style="color:#dc2626">-${formatEuro(totalCot + totalCFP + totalIR)}</strong></div>
    <div class="summary-card"><span>Frais réels</span><strong>-${formatEuro(totalFrais)}</strong></div>
    <div class="summary-card accent"><span>Net réel annuel</span><strong>${formatEuro(totalNet)}</strong></div>
  </div>

  <h2>Détail mensuel</h2>
  <table>
    <thead>
      <tr>
        <th>Mois</th>
        <th class="num">CA</th>
        <th class="num">Cotisations</th>
        <th class="num">CFP</th>
        <th class="num">Impôt</th>
        <th class="num">Frais</th>
        <th class="num">Net</th>
      </tr>
    </thead>
    <tbody>
      ${monthRows.join("")}
      <tr class="total">
        <td>Total</td>
        <td class="num">${formatEuro(totalCA)}</td>
        <td class="num neg">${formatEuro(totalCot)}</td>
        <td class="num neg">${formatEuro(totalCFP)}</td>
        <td class="num neg">${formatEuro(totalIR)}</td>
        <td class="num neg">${formatEuro(totalFrais)}</td>
        <td class="num bold">${formatEuro(totalNet)}</td>
      </tr>
    </tbody>
  </table>

  <p class="footer">
    Généré le ${new Date().toLocaleDateString("fr-FR")} par NetAprèsTax — Ce document est un récapitulatif indicatif et ne constitue pas un document comptable officiel.
  </p>
</body>
</html>`;

  // Return HTML that the browser can print to PDF via Ctrl+P
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

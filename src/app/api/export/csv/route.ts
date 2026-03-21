import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { calculerMoisMixte } from "@/lib/fiscal/engine";
import type { FiscalProfile } from "@/lib/fiscal/types";

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

  const rows = [
    ["Mois", "CA", "Cotisations sociales", "CFP", "Impôt sur le revenu", "Frais réels", "Net réel"].join(";"),
  ];

  let totalCA = 0, totalCot = 0, totalCFP = 0, totalIR = 0, totalFrais = 0, totalNet = 0;

  for (let i = 0; i < 12; i++) {
    const month = i + 1;
    const monthRevenues = revenues.filter((r) => r.month === month);
    const monthExpenses = expenses.filter((e) => e.month === month);
    const ca = monthRevenues.reduce((sum, r) => sum + Number(r.amount), 0);
    const frais = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const result = calculerMoisMixte(monthRevenues, frais, fiscalProfile);

    if (result) {
      totalCA += ca;
      totalCot += result.cotisationsSociales;
      totalCFP += result.cfp;
      totalIR += result.impotRevenu;
      totalFrais += frais;
      totalNet += result.netReel;

      rows.push([
        monthNames[i],
        ca.toFixed(2),
        result.cotisationsSociales.toFixed(2),
        result.cfp.toFixed(2),
        result.impotRevenu.toFixed(2),
        frais.toFixed(2),
        result.netReel.toFixed(2),
      ].join(";"));
    } else {
      rows.push([monthNames[i], "0", "0", "0", "0", "0", "0"].join(";"));
    }
  }

  rows.push([
    "TOTAL",
    totalCA.toFixed(2),
    totalCot.toFixed(2),
    totalCFP.toFixed(2),
    totalIR.toFixed(2),
    totalFrais.toFixed(2),
    totalNet.toFixed(2),
  ].join(";"));

  const csv = "\uFEFF" + rows.join("\n"); // BOM for Excel UTF-8

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="netaprestax-${year}.csv"`,
    },
  });
}

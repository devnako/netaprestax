import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAccountantSession } from "@/lib/accountant";
import { verifyAccountantAccess } from "@/lib/accountant";
import { calculerNetReel } from "@/lib/fiscal/engine";
import type { FiscalProfile } from "@/lib/fiscal/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getAccountantSession(await headers());

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { clientId } = await params;

  const hasAccess = await verifyAccountantAccess(session.user.id, clientId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const year = Number(request.nextUrl.searchParams.get("year")) || new Date().getFullYear();

  const profile = await prisma.fiscalProfile.findUnique({
    where: { userId: clientId },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
  }

  const revenues = await prisma.revenue.findMany({
    where: { userId: clientId, year },
    orderBy: { month: "asc" },
  });

  const expenses = await prisma.expense.findMany({
    where: { userId: clientId, year },
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
    "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
    "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
  ];

  let cumulCA = 0;
  let cumulNet = 0;

  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const revenue = revenues.find((r) => r.month === month);
    const monthExpenses = expenses.filter((e) => e.month === month);
    const ca = revenue ? Number(revenue.amount) : 0;
    const frais = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const result = ca > 0
      ? calculerNetReel({ ca, fraisReels: frais, profile: fiscalProfile })
      : null;

    cumulCA += ca;
    cumulNet += result ? result.netReel : 0;

    return {
      mois: monthNames[i],
      month,
      ca,
      cotisations: result ? result.cotisationsSociales + result.cfp : 0,
      impot: result ? result.impotRevenu : 0,
      frais,
      net: result ? result.netReel : 0,
      cumulCA,
      cumulNet,
    };
  });

  return NextResponse.json({ year, months });
}

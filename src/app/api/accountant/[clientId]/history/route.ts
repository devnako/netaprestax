import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyAccountantAccess } from "@/lib/accountant";
import { calculerNetReel } from "@/lib/fiscal/engine";
import type { FiscalProfile } from "@/lib/fiscal/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });

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

  // Build per-month TVA data if assujetti
  const tvaByMonth: Record<number, { collectee: number; deductible: number }> = {};
  if (profile.tvaAssujetti) {
    for (let i = 1; i <= 12; i++) tvaByMonth[i] = { collectee: 0, deductible: 0 };

    const [paidInvoices, manualRevenues] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          userId: clientId,
          tvaAssujetti: true,
          status: "PAID",
          paidAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
        },
        include: {
          lines: { select: { quantity: true, unitPrice: true, vatRate: true } },
        },
      }),
      prisma.revenue.findMany({
        where: { userId: clientId, year, invoiceId: null, vatAmount: { not: null } },
        select: { month: true, vatAmount: true },
      }),
    ]);

    for (const inv of paidInvoices) {
      if (!inv.paidAt) continue;
      const m = inv.paidAt.getMonth() + 1;
      for (const l of inv.lines) {
        const ht = Number(l.quantity) * Number(l.unitPrice);
        const rate = l.vatRate !== null ? Number(l.vatRate) : 0;
        tvaByMonth[m].collectee += ht * rate / 100;
      }
    }

    for (const e of expenses) {
      const vat = Number(e.vatAmount ?? 0);
      if (vat > 0) tvaByMonth[e.month].deductible += vat;
    }

    for (const r of manualRevenues) {
      const vat = Number(r.vatAmount ?? 0);
      if (vat > 0) tvaByMonth[r.month].deductible += vat;
    }
  }

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
    const monthRevenues = revenues.filter((r) => r.month === month);
    const monthExpenses = expenses.filter((e) => e.month === month);
    const ca = monthRevenues.reduce((sum, r) => sum + Number(r.amount), 0);
    const frais = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const result = ca > 0
      ? calculerNetReel({ ca, fraisReels: frais, profile: fiscalProfile })
      : null;

    cumulCA += ca;
    cumulNet += result ? result.netReel : 0;

    const tva = tvaByMonth[month];
    const tvaCollectee = tva ? Math.round(tva.collectee * 100) / 100 : 0;
    const tvaDeductible = tva ? Math.round(tva.deductible * 100) / 100 : 0;

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
      tvaCollectee,
      tvaDeductible,
      tvaSolde: Math.round((tvaCollectee - tvaDeductible) * 100) / 100,
    };
  });

  return NextResponse.json({ year, months, tvaAssujetti: profile.tvaAssujetti });
}

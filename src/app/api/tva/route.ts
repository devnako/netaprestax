import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const mode = request.nextUrl.searchParams.get("mode") || "month"; // "month" | "quarter"
  const year = Number(request.nextUrl.searchParams.get("year"));
  const period = Number(request.nextUrl.searchParams.get("period")); // month (1-12) or quarter (1-4)

  if (!year || !period) {
    return NextResponse.json({ error: "year et period requis" }, { status: 400 });
  }

  const profile = await prisma.fiscalProfile.findUnique({
    where: { userId: session.user.id },
    select: { tvaAssujetti: true },
  });

  if (!profile?.tvaAssujetti) {
    return NextResponse.json({ error: "Non assujetti à la TVA" }, { status: 400 });
  }

  // Determine date range
  let months: number[];
  if (mode === "quarter") {
    const start = (period - 1) * 3 + 1;
    months = [start, start + 1, start + 2];
  } else {
    months = [period];
  }

  // 1. TVA collectée: from paid invoices in the period (using paidAt date)
  const startMonth = months[0];
  const endMonth = months[months.length - 1];
  const startDate = new Date(year, startMonth - 1, 1);
  const endDate = new Date(year, endMonth, 1); // first day of next month

  const paidInvoices = await prisma.invoice.findMany({
    where: {
      userId: session.user.id,
      tvaAssujetti: true,
      status: "PAID",
      paidAt: { gte: startDate, lt: endDate },
    },
    include: {
      lines: { select: { quantity: true, unitPrice: true, vatRate: true } },
      client: { select: { name: true } },
    },
  });

  let tvaCollectee = 0;
  const collecteeDetails: { label: string; ht: number; tva: number }[] = [];

  for (const inv of paidInvoices) {
    let invHT = 0;
    let invTVA = 0;
    for (const l of inv.lines) {
      const ht = Number(l.quantity) * Number(l.unitPrice);
      const rate = l.vatRate !== null ? Number(l.vatRate) : 0;
      invHT += ht;
      invTVA += ht * rate / 100;
    }
    tvaCollectee += invTVA;
    if (invTVA > 0) {
      collecteeDetails.push({
        label: `${inv.number} — ${inv.client.name}`,
        ht: Math.round(invHT * 100) / 100,
        tva: Math.round(invTVA * 100) / 100,
      });
    }
  }

  // 2. TVA déductible: from expenses + manual revenues in the period
  const expenses = await prisma.expense.findMany({
    where: {
      userId: session.user.id,
      month: { in: months },
      year,
      vatAmount: { not: null },
    },
    select: { label: true, amount: true, vatAmount: true, vatRate: true },
  });

  const manualRevenues = await prisma.revenue.findMany({
    where: {
      userId: session.user.id,
      month: { in: months },
      year,
      invoiceId: null,
      vatAmount: { not: null },
    },
    select: { description: true, amount: true, vatAmount: true, vatRate: true },
  });

  let tvaDeductible = 0;
  const deductibleDetails: { label: string; ht: number; tva: number }[] = [];

  for (const e of expenses) {
    const vat = Number(e.vatAmount);
    if (vat > 0) {
      tvaDeductible += vat;
      deductibleDetails.push({
        label: e.label,
        ht: Number(e.amount),
        tva: Math.round(vat * 100) / 100,
      });
    }
  }

  for (const r of manualRevenues) {
    const vat = Number(r.vatAmount);
    if (vat > 0) {
      tvaDeductible += vat;
      deductibleDetails.push({
        label: r.description || "Revenu",
        ht: Number(r.amount),
        tva: Math.round(vat * 100) / 100,
      });
    }
  }

  tvaCollectee = Math.round(tvaCollectee * 100) / 100;
  tvaDeductible = Math.round(tvaDeductible * 100) / 100;
  const solde = Math.round((tvaCollectee - tvaDeductible) * 100) / 100;

  return NextResponse.json({
    tvaCollectee,
    tvaDeductible,
    solde,
    collecteeDetails,
    deductibleDetails,
  });
}

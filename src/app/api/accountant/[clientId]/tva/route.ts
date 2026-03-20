import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyAccountantAccess } from "@/lib/accountant";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { clientId } = await params;

  const hasAccess = await verifyAccountantAccess(session.user.id, clientId);
  if (!hasAccess) return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });

  const mode = request.nextUrl.searchParams.get("mode") || "month";
  const year = Number(request.nextUrl.searchParams.get("year"));
  const period = Number(request.nextUrl.searchParams.get("period"));

  if (!year || !period) {
    return NextResponse.json({ error: "year et period requis" }, { status: 400 });
  }

  const profile = await prisma.fiscalProfile.findUnique({
    where: { userId: clientId },
    select: { tvaAssujetti: true },
  });

  if (!profile?.tvaAssujetti) {
    return NextResponse.json({ error: "Non assujetti à la TVA" }, { status: 400 });
  }

  let months: number[];
  if (mode === "quarter") {
    const start = (period - 1) * 3 + 1;
    months = [start, start + 1, start + 2];
  } else {
    months = [period];
  }

  const startMonth = months[0];
  const endMonth = months[months.length - 1];
  const startDate = new Date(year, startMonth - 1, 1);
  const endDate = new Date(year, endMonth, 1);

  const paidInvoices = await prisma.invoice.findMany({
    where: {
      userId: clientId,
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

  const expenses = await prisma.expense.findMany({
    where: { userId: clientId, month: { in: months }, year, vatAmount: { not: null } },
    select: { label: true, amount: true, vatAmount: true, vatRate: true },
  });

  const manualRevenues = await prisma.revenue.findMany({
    where: { userId: clientId, month: { in: months }, year, invoiceId: null, vatAmount: { not: null } },
    select: { description: true, amount: true, vatAmount: true, vatRate: true },
  });

  let tvaDeductible = 0;
  const deductibleDetails: { label: string; ht: number; tva: number }[] = [];

  for (const e of expenses) {
    const vat = Number(e.vatAmount);
    if (vat > 0) {
      tvaDeductible += vat;
      deductibleDetails.push({ label: e.label, ht: Number(e.amount), tva: Math.round(vat * 100) / 100 });
    }
  }

  for (const r of manualRevenues) {
    const vat = Number(r.vatAmount);
    if (vat > 0) {
      tvaDeductible += vat;
      deductibleDetails.push({ label: r.description || "Revenu", ht: Number(r.amount), tva: Math.round(vat * 100) / 100 });
    }
  }

  tvaCollectee = Math.round(tvaCollectee * 100) / 100;
  tvaDeductible = Math.round(tvaDeductible * 100) / 100;
  const solde = Math.round((tvaCollectee - tvaDeductible) * 100) / 100;

  return NextResponse.json({ tvaCollectee, tvaDeductible, solde, collecteeDetails, deductibleDetails });
}

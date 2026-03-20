import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { del } from "@vercel/blob";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const month = Number(request.nextUrl.searchParams.get("month"));
  const year = Number(request.nextUrl.searchParams.get("year"));

  if (!month || !year) {
    return NextResponse.json({ error: "Mois et année requis" }, { status: 400 });
  }

  const [expenses, profile] = await Promise.all([
    prisma.expense.findMany({
      where: { userId: session.user.id, month, year },
      orderBy: { createdAt: "desc" },
    }),
    prisma.fiscalProfile.findUnique({
      where: { userId: session.user.id },
      select: { tvaAssujetti: true },
    }),
  ]);

  return NextResponse.json({
    expenses: expenses.map((e) => ({
      id: e.id,
      amount: Number(e.amount),
      vatRate: e.vatRate !== null ? Number(e.vatRate) : null,
      vatAmount: e.vatAmount !== null ? Number(e.vatAmount) : null,
      category: e.category,
      label: e.label,
      attachmentUrl: e.attachmentUrl,
      attachmentName: e.attachmentName,
    })),
    tvaAssujetti: profile?.tvaAssujetti ?? false,
  });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { amount, category, label, month, year, vatRate } = await request.json();

  if (!amount || !category || !label || !month || !year) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const vatAmount = vatRate != null && vatRate > 0 ? Math.round(amount * vatRate / 100 * 100) / 100 : null;

  const expense = await prisma.expense.create({
    data: {
      userId: session.user.id,
      amount,
      vatRate: vatRate != null ? vatRate : null,
      vatAmount,
      category,
      label,
      month,
      year,
    },
  });

  return NextResponse.json(expense);
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  // Verify ownership
  const expense = await prisma.expense.findUnique({ where: { id } });

  if (!expense || expense.userId !== session.user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  if (expense.attachmentUrl) {
    try { await del(expense.attachmentUrl); } catch {}
  }

  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

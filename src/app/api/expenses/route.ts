import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
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

  const expenses = await prisma.expense.findMany({
    where: {
      userId: session.user.id,
      month,
      year,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    expenses.map((e) => ({
      id: e.id,
      amount: Number(e.amount),
      category: e.category,
      label: e.label,
    }))
  );
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { amount, category, label, month, year } = await request.json();

  if (!amount || !category || !label || !month || !year) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      userId: session.user.id,
      amount,
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

  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

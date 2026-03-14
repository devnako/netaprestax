import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { amount, month, year, description } = await request.json();

  if (!amount || !month || !year) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  if (amount < 0) {
    return NextResponse.json({ error: "Le montant doit être positif" }, { status: 400 });
  }

  const revenue = await prisma.revenue.upsert({
    where: {
      userId_month_year: {
        userId: session.user.id,
        month,
        year,
      },
    },
    create: {
      userId: session.user.id,
      amount,
      month,
      year,
      description,
    },
    update: {
      amount,
      description,
    },
  });

  return NextResponse.json(revenue);
}

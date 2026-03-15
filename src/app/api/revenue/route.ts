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

  const [revenues, profile] = await Promise.all([
    prisma.revenue.findMany({
      where: { userId: session.user.id, month, year },
      orderBy: { createdAt: "desc" },
    }),
    prisma.fiscalProfile.findUnique({
      where: { userId: session.user.id },
      select: { activityType: true },
    }),
  ]);

  const total = revenues.reduce((sum, r) => sum + Number(r.amount), 0);

  return NextResponse.json({
    revenues,
    total,
    defaultActivityType: profile?.activityType ?? null,
  });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { amount, month, year, description, activityType } = await request.json();

  if (!amount || !month || !year) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  if (amount < 0) {
    return NextResponse.json({ error: "Le montant doit être positif" }, { status: 400 });
  }

  const revenue = await prisma.revenue.create({
    data: {
      userId: session.user.id,
      amount,
      month,
      year,
      description,
      activityType: activityType || null,
    },
  });

  return NextResponse.json(revenue);
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

  const revenue = await prisma.revenue.findUnique({ where: { id } });

  if (!revenue || revenue.userId !== session.user.id) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  await prisma.revenue.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

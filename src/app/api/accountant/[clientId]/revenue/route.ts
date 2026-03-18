import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAccountantSession } from "@/lib/accountant";
import { verifyAccountantAccess } from "@/lib/accountant";

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

  const month = Number(request.nextUrl.searchParams.get("month"));
  const year = Number(request.nextUrl.searchParams.get("year"));

  if (!month || !year) {
    return NextResponse.json({ error: "Mois et année requis" }, { status: 400 });
  }

  const [revenues, profile] = await Promise.all([
    prisma.revenue.findMany({
      where: { userId: clientId, month, year },
      orderBy: { createdAt: "desc" },
    }),
    prisma.fiscalProfile.findUnique({
      where: { userId: clientId },
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

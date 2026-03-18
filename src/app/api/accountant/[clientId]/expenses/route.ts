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

  const expenses = await prisma.expense.findMany({
    where: {
      userId: clientId,
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
      attachmentUrl: e.attachmentUrl,
      attachmentName: e.attachmentName,
    }))
  );
}

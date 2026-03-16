import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getNextQuoteNumber } from "@/lib/invoicing/numbering";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const quotes = await prisma.quote.findMany({
    where: { userId: session.user.id },
    include: {
      client: { select: { name: true } },
      lines: { orderBy: { sortOrder: "asc" } },
      invoice: { select: { id: true } }
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(quotes);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { clientId, notes, paymentTerms, validUntil, lines } = body;

  if (!clientId || !lines || lines.length === 0) {
    return NextResponse.json({ error: "clientId et lines sont requis" }, { status: 400 });
  }

  const number = await getNextQuoteNumber(session.user.id, new Date().getFullYear());

  const quote = await prisma.quote.create({
    data: {
      userId: session.user.id,
      clientId,
      number,
      notes: notes || null,
      paymentTerms: paymentTerms || null,
      validUntil: validUntil ? new Date(validUntil) : null,
      lines: {
        create: lines.map((l: any, i: number) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          vatRate: l.vatRate ?? null,
          sortOrder: i,
        })),
      },
    },
    include: { lines: true },
  });

  return NextResponse.json(quote, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id est requis" }, { status: 400 });
  }

  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote || quote.userId !== session.user.id) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  if (quote.status !== "DRAFT") {
    return NextResponse.json({ error: "Seuls les devis en brouillon peuvent être supprimés" }, { status: 400 });
  }

  await prisma.quote.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

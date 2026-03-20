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
  const { clientId, notes, paymentTerms, paymentMethod, bankAccountHolder, bankIban, bankBic, validUntil, lines } = body;

  if (!clientId || !lines || lines.length === 0) {
    return NextResponse.json({ error: "clientId et lines sont requis" }, { status: 400 });
  }

  const [number, profile] = await Promise.all([
    getNextQuoteNumber(session.user.id, new Date().getFullYear()),
    prisma.fiscalProfile.findUnique({ where: { userId: session.user.id }, select: { tvaAssujetti: true } }),
  ]);
  const tvaAssujetti = profile?.tvaAssujetti ?? false;

  const quote = await prisma.quote.create({
    data: {
      userId: session.user.id,
      clientId,
      number,
      tvaAssujetti,
      notes: notes || null,
      paymentTerms: paymentTerms || null,
      paymentMethod: paymentMethod || null,
      bankAccountHolder: paymentMethod === "Virement bancaire" ? (bankAccountHolder || null) : null,
      bankIban: paymentMethod === "Virement bancaire" ? (bankIban || null) : null,
      bankBic: paymentMethod === "Virement bancaire" ? (bankBic || null) : null,
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

  await prisma.quote.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

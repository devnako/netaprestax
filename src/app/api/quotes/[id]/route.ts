import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      client: true,
      lines: { orderBy: { sortOrder: "asc" } },
      invoice: { select: { id: true, number: true } }
    },
  });

  if (!quote || quote.userId !== session.user.id) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  return NextResponse.json(quote);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { clientId, notes, paymentTerms, paymentMethod, bankAccountHolder, bankIban, bankBic, validUntil, lines } = body;

  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote || quote.userId !== session.user.id) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  if (quote.status !== "DRAFT") {
    return NextResponse.json({ error: "Seuls les devis en brouillon peuvent être modifiés" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.documentLine.deleteMany({ where: { quoteId: id } }),
    prisma.quote.update({
      where: { id },
      data: {
        clientId,
        notes,
        paymentTerms,
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
    }),
  ]);

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!["SENT", "ACCEPTED", "REFUSED"].includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote || quote.userId !== session.user.id) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  // Validate status transitions
  if (quote.status === "DRAFT" && !["SENT"].includes(status)) {
    return NextResponse.json({ error: "Un brouillon ne peut passer qu'à ENVOYÉ" }, { status: 400 });
  }

  if (quote.status === "SENT" && !["ACCEPTED", "REFUSED"].includes(status)) {
    return NextResponse.json({ error: "Un devis envoyé ne peut passer qu'à ACCEPTÉ ou REFUSÉ" }, { status: 400 });
  }

  if (quote.status === "ACCEPTED" || quote.status === "REFUSED") {
    return NextResponse.json({ error: "Le statut du devis ne peut pas être modifié" }, { status: 400 });
  }

  const updatedQuote = await prisma.quote.update({
    where: { id },
    data: { status },
    include: {
      client: true,
      lines: { orderBy: { sortOrder: "asc" } },
      invoice: { select: { id: true, number: true } },
    },
  });

  return NextResponse.json(updatedQuote);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;

  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote || quote.userId !== session.user.id) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  if (quote.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Seuls les devis en brouillon peuvent être supprimés" },
      { status: 400 }
    );
  }

  await prisma.quote.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

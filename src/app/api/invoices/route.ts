import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getNextInvoiceNumber } from "@/lib/invoicing/numbering";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    include: {
      client: { select: { name: true } },
      lines: { orderBy: { sortOrder: "asc" } },
      quote: { select: { id: true, number: true } },
      parentInvoice: { select: { id: true, number: true } },
      creditNotes: { select: { id: true, number: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { clientId, notes, paymentTerms, paymentMethod, bankAccountHolder, bankIban, bankBic, lines } = body;

  if (!clientId || !lines || !Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json(
      { error: "clientId et lines (array non vide) requis" },
      { status: 400 }
    );
  }

  // Verify client ownership
  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client || client.userId !== session.user.id) {
    return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
  }

  const [number, profile] = await Promise.all([
    getNextInvoiceNumber(session.user.id, new Date().getFullYear()),
    prisma.fiscalProfile.findUnique({ where: { userId: session.user.id }, select: { tvaAssujetti: true } }),
  ]);
  const tvaAssujetti = profile?.tvaAssujetti ?? false;

  const invoice = await prisma.invoice.create({
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
      status: "DRAFT",
      lines: {
        create: lines.map((line: any, index: number) => ({
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          vatRate: tvaAssujetti ? (line.vatRate || 20) : null,
          sortOrder: index,
        })),
      },
    },
    include: {
      client: { select: { name: true } },
      lines: { orderBy: { sortOrder: "asc" } },
      quote: { select: { id: true, number: true } },
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id query param requis" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
  });

  if (!invoice || invoice.userId !== session.user.id) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  if (invoice.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Seules les factures DRAFT peuvent être supprimées" },
      { status: 400 }
    );
  }

  await prisma.invoice.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

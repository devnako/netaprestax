import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      lines: { orderBy: { sortOrder: "asc" } },
      quote: { select: { id: true, number: true } },
      parentInvoice: { select: { id: true, number: true } },
      creditNotes: { select: { id: true, number: true } },
    },
  });

  if (!invoice || invoice.userId !== session.user.id) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  return NextResponse.json(invoice);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { clientId, notes, paymentTerms, paymentMethod, bankAccountHolder, bankIban, bankBic, lines } = body;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
  });

  if (!invoice || invoice.userId !== session.user.id) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  if (invoice.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Seules les factures DRAFT peuvent être modifiées" },
      { status: 400 }
    );
  }

  if (clientId) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client || client.userId !== session.user.id) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id },
    data: {
      clientId: clientId || undefined,
      notes: notes !== undefined ? notes : undefined,
      paymentTerms: paymentTerms !== undefined ? paymentTerms : undefined,
      paymentMethod: paymentMethod !== undefined ? (paymentMethod || null) : undefined,
      bankAccountHolder: paymentMethod === "Virement bancaire" ? (bankAccountHolder || null) : paymentMethod !== undefined ? null : undefined,
      bankIban: paymentMethod === "Virement bancaire" ? (bankIban || null) : paymentMethod !== undefined ? null : undefined,
      bankBic: paymentMethod === "Virement bancaire" ? (bankBic || null) : paymentMethod !== undefined ? null : undefined,
      lines: {
        deleteMany: {},
        create: lines
          ? lines.map((line: any, index: number) => ({
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              vatRate: line.vatRate || 20,
              sortOrder: index,
            }))
          : undefined,
      },
    },
    include: {
      client: { select: { name: true } },
      lines: { orderBy: { sortOrder: "asc" } },
      quote: { select: { id: true, number: true } },
    },
  });

  return NextResponse.json(updatedInvoice);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { status, lines, notes, paymentTerms, paymentMethod, bankAccountHolder, bankIban, bankBic } = body;

  // Content edit mode (no status change)
  if (!status && (lines || notes !== undefined || paymentTerms !== undefined || paymentMethod !== undefined)) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice || invoice.userId !== session.user.id) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }
    if (invoice.status !== "DRAFT") {
      return NextResponse.json({ error: "Seules les factures DRAFT peuvent être modifiées" }, { status: 400 });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        notes: notes !== undefined ? notes : undefined,
        paymentTerms: paymentTerms !== undefined ? paymentTerms : undefined,
        paymentMethod: paymentMethod !== undefined ? (paymentMethod || null) : undefined,
        bankAccountHolder: paymentMethod === "Virement bancaire" ? (bankAccountHolder || null) : paymentMethod !== undefined ? null : undefined,
        bankIban: paymentMethod === "Virement bancaire" ? (bankIban || null) : paymentMethod !== undefined ? null : undefined,
        bankBic: paymentMethod === "Virement bancaire" ? (bankBic || null) : paymentMethod !== undefined ? null : undefined,
        ...(lines ? {
          lines: {
            deleteMany: {},
            create: lines.map((line: any, index: number) => ({
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              vatRate: line.vatRate ?? 20,
              sortOrder: index,
            })),
          },
        } : {}),
      },
      include: {
        client: { select: { name: true } },
        lines: { orderBy: { sortOrder: "asc" } },
        quote: { select: { id: true, number: true } },
        parentInvoice: { select: { id: true, number: true } },
        creditNotes: { select: { id: true, number: true } },
      },
    });

    return NextResponse.json(updatedInvoice);
  }

  const validStatuses = ["PENDING", "PAID", "OVERDUE"];
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "status invalide ou manquant" },
      { status: 400 }
    );
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      lines: true,
    },
  });

  if (!invoice || invoice.userId !== session.user.id) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  // Validate status transition
  const allowedTransitions: Record<string, string[]> = {
    DRAFT: ["PENDING"],
    PENDING: ["PAID", "OVERDUE"],
    PAID: [],
    OVERDUE: ["PAID"],
  };

  if (!allowedTransitions[invoice.status]?.includes(status)) {
    return NextResponse.json(
      { error: `Transition de ${invoice.status} à ${status} non autorisée` },
      { status: 400 }
    );
  }

  if (status === "PAID") {
    const paidAt = new Date();

    const profile = await prisma.fiscalProfile.findUnique({
      where: { userId: session.user.id },
      select: { activityType: true },
    });

    const totalHT = invoice.lines.reduce(
      (sum, line) => sum + Number(line.quantity) * Number(line.unitPrice),
      0
    );

    await prisma.$transaction([
      prisma.invoice.update({
        where: { id },
        data: { status: "PAID", paidAt },
      }),
      prisma.revenue.create({
        data: {
          userId: session.user.id,
          amount: Math.round(totalHT * 100) / 100,
          month: paidAt.getMonth() + 1,
          year: paidAt.getFullYear(),
          description: `Facture ${invoice.number} — ${invoice.client.name}`,
          activityType: profile?.activityType || null,
          invoiceId: id,
          locked: true,
        },
      }),
    ]);

    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: { select: { name: true } },
        lines: { orderBy: { sortOrder: "asc" } },
        quote: { select: { id: true, number: true } },
        parentInvoice: { select: { id: true, number: true } },
        creditNotes: { select: { id: true, number: true } },
      },
    });

    return NextResponse.json(updatedInvoice);
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id },
    data: { status },
    include: {
      client: { select: { name: true } },
      lines: { orderBy: { sortOrder: "asc" } },
      quote: { select: { id: true, number: true } },
      parentInvoice: { select: { id: true, number: true } },
      creditNotes: { select: { id: true, number: true } },
    },
  });

  return NextResponse.json(updatedInvoice);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;

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

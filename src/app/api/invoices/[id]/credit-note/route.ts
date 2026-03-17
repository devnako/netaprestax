import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getNextCreditNoteNumber } from "@/lib/invoicing/numbering";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { removeRevenue } = body;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      lines: { orderBy: { sortOrder: "asc" } },
      creditNotes: { select: { id: true } },
    },
  });

  if (!invoice || invoice.userId !== session.user.id) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  if (invoice.status !== "PENDING" && invoice.status !== "PAID") {
    return NextResponse.json(
      { error: "Un avoir ne peut être créé que sur une facture envoyée ou payée" },
      { status: 400 }
    );
  }

  if (invoice.creditNotes.length > 0) {
    return NextResponse.json(
      { error: "Un avoir existe déjà pour cette facture" },
      { status: 400 }
    );
  }

  if (invoice.parentInvoiceId) {
    return NextResponse.json(
      { error: "Impossible de créer un avoir sur un avoir" },
      { status: 400 }
    );
  }

  const number = await getNextCreditNoteNumber(session.user.id, new Date().getFullYear());

  const operations = [
    prisma.invoice.create({
      data: {
        userId: session.user.id,
        clientId: invoice.clientId,
        parentInvoiceId: invoice.id,
        number,
        status: "PENDING",
        notes: `Avoir sur facture ${invoice.number} — ${invoice.client.name}`,
        paymentTerms: null,
        lines: {
          create: invoice.lines.map((line, index) => ({
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            vatRate: line.vatRate,
            sortOrder: index,
          })),
        },
      },
    }),
    prisma.invoice.update({
      where: { id },
      data: { status: "CANCELLED" },
    }),
  ];

  // If the invoice was paid and user wants to remove the corresponding revenue
  if (invoice.status === "PAID" && removeRevenue) {
    operations.push(
      prisma.revenue.deleteMany({
        where: {
          userId: session.user.id,
          invoiceId: id,
        },
      }) as any
    );
  }

  const [creditNote] = await prisma.$transaction(operations);

  return NextResponse.json(creditNote, { status: 201 });
}

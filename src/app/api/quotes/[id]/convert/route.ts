import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getNextInvoiceNumber } from "@/lib/invoicing/numbering";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      lines: { orderBy: { sortOrder: "asc" } },
      invoice: true
    },
  });

  if (!quote || quote.userId !== session.user.id) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  if (quote.status !== "ACCEPTED") {
    return NextResponse.json({ error: "Le devis doit être accepté" }, { status: 400 });
  }

  if (quote.invoice) {
    return NextResponse.json({ error: "Ce devis a déjà été converti en facture" }, { status: 400 });
  }

  const number = await getNextInvoiceNumber(session.user.id, new Date().getFullYear());

  const invoice = await prisma.invoice.create({
    data: {
      userId: session.user.id,
      clientId: quote.clientId,
      quoteId: quote.id,
      number,
      notes: quote.notes,
      paymentTerms: quote.paymentTerms,
      paymentMethod: quote.paymentMethod,
      bankAccountHolder: quote.bankAccountHolder,
      bankIban: quote.bankIban,
      bankBic: quote.bankBic,
      lines: {
        create: quote.lines.map((l, i) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          vatRate: l.vatRate,
          sortOrder: i,
        })),
      },
    },
    include: { lines: true },
  });

  return NextResponse.json(invoice, { status: 201 });
}

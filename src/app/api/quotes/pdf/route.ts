import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyAccountantAccess } from "@/lib/accountant";
import { generateDocumentHtml } from "@/lib/invoicing/pdf-template";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { client: true, lines: { orderBy: { sortOrder: "asc" } } },
  });
  if (!quote) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  const isOwner = quote.userId === session.user.id;
  const isAccountant = !isOwner && await verifyAccountantAccess(session.user.id, quote.userId);
  if (!isOwner && !isAccountant) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

  const [profile, quoteOwner] = await Promise.all([
    prisma.fiscalProfile.findUnique({ where: { userId: quote.userId } }),
    isOwner ? null : prisma.user.findUnique({ where: { id: quote.userId }, select: { name: true, email: true } }),
  ]);

  const html = generateDocumentHtml({
    type: "devis",
    number: quote.number,
    issuedAt: quote.issuedAt.toISOString(),
    validUntil: quote.validUntil?.toISOString() || null,
    status: quote.status,
    business: {
      name: isOwner ? (session.user.name || session.user.email) : (quoteOwner?.name || quoteOwner?.email || ""),
      ownerName: profile?.ownerName || null,
      siret: profile?.siret || null,
      address: profile?.address || null,
      businessName: profile?.businessName || null,
      professionalEmail: profile?.professionalEmail || null,
      phone: profile?.phone || null,
      tvaNumber: profile?.tvaNumber || null,
      tvaAssujetti: quote.tvaAssujetti,
    },
    client: {
      name: quote.clientName || quote.client?.name || "",
      email: quote.clientEmail || quote.client?.email || null,
      phone: quote.clientPhone || quote.client?.phone || null,
      address: quote.clientAddress || quote.client?.address || null,
      siret: quote.clientSiret || quote.client?.siret || null,
    },
    lines: quote.lines.map((l) => ({
      description: l.description,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      vatRate: l.vatRate !== null ? Number(l.vatRate) : null,
    })),
    notes: quote.notes,
    paymentTerms: quote.paymentTerms,
    paymentMethod: quote.paymentMethod,
    bankAccountHolder: quote.bankAccountHolder,
    bankIban: quote.bankIban,
    bankBic: quote.bankBic,
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
  if (!quote || quote.userId !== session.user.id) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

  const profile = await prisma.fiscalProfile.findUnique({ where: { userId: session.user.id } });

  const html = generateDocumentHtml({
    type: "devis",
    number: quote.number,
    issuedAt: quote.issuedAt.toISOString(),
    validUntil: quote.validUntil?.toISOString() || null,
    status: quote.status,
    business: {
      name: session.user.name || session.user.email,
      ownerName: profile?.ownerName || null,
      siret: profile?.siret || null,
      address: profile?.address || null,
      businessName: profile?.businessName || null,
      professionalEmail: profile?.professionalEmail || null,
      phone: profile?.phone || null,
      tvaNumber: profile?.tvaNumber || null,
      tvaAssujetti: profile?.tvaAssujetti || false,
    },
    client: {
      name: quote.client.name,
      email: quote.client.email,
      phone: quote.client.phone,
      address: quote.client.address,
      siret: quote.client.siret,
    },
    lines: quote.lines.map((l) => ({
      description: l.description,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      vatRate: l.vatRate !== null ? Number(l.vatRate) : null,
    })),
    notes: quote.notes,
    paymentTerms: quote.paymentTerms,
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyAccountantAccess } from "@/lib/accountant";
import { del, head } from "@vercel/blob";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN non configuré" }, { status: 500 });
  }

  const type = request.nextUrl.searchParams.get("type");
  const id = request.nextUrl.searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json({ error: "Type et ID requis" }, { status: 400 });
  }

  let attachmentUrl: string | null = null;
  let attachmentName: string | null = null;

  if (type === "revenue") {
    const revenue = await prisma.revenue.findUnique({ where: { id } });
    if (!revenue) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    const isOwner = revenue.userId === session.user.id;
    const isAccountant = !isOwner && await verifyAccountantAccess(session.user.id, revenue.userId);
    if (!isOwner && !isAccountant) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }
    attachmentUrl = revenue.attachmentUrl;
    attachmentName = revenue.attachmentName;
  } else if (type === "expense") {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    const isOwner = expense.userId === session.user.id;
    const isAccountant = !isOwner && await verifyAccountantAccess(session.user.id, expense.userId);
    if (!isOwner && !isAccountant) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }
    attachmentUrl = expense.attachmentUrl;
    attachmentName = expense.attachmentName;
  } else {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  if (!attachmentUrl) {
    return NextResponse.json({ error: "Pas de pièce jointe" }, { status: 404 });
  }

  // Proxy: fetch the private blob and stream it to the client
  try {
    const blobMeta = await head(attachmentUrl, { token });
    const blobRes = await fetch(blobMeta.downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!blobRes.ok) {
      return NextResponse.json({ error: "Impossible de récupérer le fichier" }, { status: 502 });
    }

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", blobMeta.contentType);
    responseHeaders.set("Content-Disposition", `inline; filename="${attachmentName || "fichier"}"`);
    responseHeaders.set("Cache-Control", "private, max-age=3600");

    return new NextResponse(blobRes.body, { headers: responseHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Vercel Blob";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const type = request.nextUrl.searchParams.get("type");
  const id = request.nextUrl.searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json({ error: "Type et ID requis" }, { status: 400 });
  }

  let attachmentUrl: string | null = null;

  if (type === "revenue") {
    const revenue = await prisma.revenue.findUnique({ where: { id } });
    if (!revenue || revenue.userId !== session.user.id) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }
    attachmentUrl = revenue.attachmentUrl;
    await prisma.revenue.update({
      where: { id },
      data: { attachmentUrl: null, attachmentName: null },
    });
  } else if (type === "expense") {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense || expense.userId !== session.user.id) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }
    attachmentUrl = expense.attachmentUrl;
    await prisma.expense.update({
      where: { id },
      data: { attachmentUrl: null, attachmentName: null },
    });
  } else {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  if (attachmentUrl) {
    try { await del(attachmentUrl); } catch {}
  }

  return NextResponse.json({ success: true });
}

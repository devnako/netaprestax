import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { del } from "@vercel/blob";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

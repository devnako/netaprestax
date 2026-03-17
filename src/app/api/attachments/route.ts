import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { put, del } from "@vercel/blob";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string; // "revenue" | "expense"
  const id = formData.get("id") as string;

  if (!file || !type || !id) {
    return NextResponse.json({ error: "Fichier, type et ID requis" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Format non supporté. Acceptés : PDF, JPG, PNG, WebP" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 5 MB)" }, { status: 400 });
  }

  // Verify ownership
  if (type === "revenue") {
    const revenue = await prisma.revenue.findUnique({ where: { id } });
    if (!revenue || revenue.userId !== session.user.id) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }
  } else if (type === "expense") {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense || expense.userId !== session.user.id) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }
  } else {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  // Upload to Vercel Blob
  const blob = await put(`attachments/${session.user.id}/${type}/${id}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  // Update record
  if (type === "revenue") {
    await prisma.revenue.update({
      where: { id },
      data: { attachmentUrl: blob.url, attachmentName: file.name },
    });
  } else {
    await prisma.expense.update({
      where: { id },
      data: { attachmentUrl: blob.url, attachmentName: file.name },
    });
  }

  return NextResponse.json({ url: blob.url, name: file.name });
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const type = request.nextUrl.searchParams.get("type"); // "revenue" | "expense"
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

  // Delete from Vercel Blob
  if (attachmentUrl) {
    try {
      await del(attachmentUrl);
    } catch {
      // Blob may already be deleted, continue
    }
  }

  return NextResponse.json({ success: true });
}

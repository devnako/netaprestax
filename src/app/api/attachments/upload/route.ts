import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN non configuré" }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Impossible de lire le fichier" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string;
  const id = formData.get("id") as string;

  if (!file || !type || !id) {
    return NextResponse.json({ error: "Fichier, type et ID requis" }, { status: 400 });
  }

  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Format non supporté (PDF, JPG, PNG, WebP)" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 5 MB)" }, { status: 400 });
  }

  // Verify ownership
  if (type === "revenue") {
    const rev = await prisma.revenue.findUnique({ where: { id } });
    if (!rev || rev.userId !== session.user.id) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  } else if (type === "expense") {
    const exp = await prisma.expense.findUnique({ where: { id } });
    if (!exp || exp.userId !== session.user.id) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  } else {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  // Upload to Vercel Blob
  try {
    const blob = await put(
      `attachments/${session.user.id}/${type}/${id}/${file.name}`,
      file,
      { access: "public", addRandomSuffix: true, token }
    );

    // Save URL to database
    if (type === "revenue") {
      await prisma.revenue.update({ where: { id }, data: { attachmentUrl: blob.url, attachmentName: file.name } });
    } else {
      await prisma.expense.update({ where: { id }, data: { attachmentUrl: blob.url, attachmentName: file.name } });
    }

    return NextResponse.json({ url: blob.url, name: file.name });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Vercel Blob";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { filename } = await request.json();
  if (!filename) return NextResponse.json({ error: "Nom de fichier requis" }, { status: 400 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ error: "Blob storage non configuré" }, { status: 500 });

  const clientToken = await generateClientTokenFromReadWriteToken({
    token,
    pathname: `attachments/${session.user.id}/${filename}`,
    allowedContentTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ],
    maximumSizeInBytes: 5 * 1024 * 1024,
  });

  return NextResponse.json({ clientToken });
}

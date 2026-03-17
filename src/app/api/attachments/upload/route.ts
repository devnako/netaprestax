import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json()) as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
      ],
      maximumSizeInBytes: 5 * 1024 * 1024,
    }),
    onUploadCompleted: async () => {},
  });

  return NextResponse.json(jsonResponse);
}

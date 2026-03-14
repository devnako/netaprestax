import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();

  const {
    activityType,
    versementLiberatoire,
    situationFamiliale,
    enfantsACharge,
    declarationFrequency,
    tvaAssujetti,
    acre,
  } = body;

  if (!activityType || versementLiberatoire === null || !declarationFrequency || tvaAssujetti === null || acre === null) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  await prisma.fiscalProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      activityType,
      versementLiberatoire,
      declarationFrequency,
      tvaAssujetti,
      acre,
      situationFamiliale: versementLiberatoire ? null : situationFamiliale || null,
      enfantsACharge: versementLiberatoire ? 0 : enfantsACharge,
    },
    update: {
      activityType,
      versementLiberatoire,
      declarationFrequency,
      tvaAssujetti,
      acre,
      situationFamiliale: versementLiberatoire ? null : situationFamiliale || null,
      enfantsACharge: versementLiberatoire ? 0 : enfantsACharge,
    },
  });

  return NextResponse.json({ success: true });
}

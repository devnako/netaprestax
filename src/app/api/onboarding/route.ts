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
    acreDateDebut,
    siret,
    address,
    ownerName,
    businessName,
    professionalEmail,
    phone,
    tvaNumber,
  } = body;

  if (!activityType || versementLiberatoire === null || !declarationFrequency || tvaAssujetti === null || acre === null) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const acreDate = acre && acreDateDebut ? new Date(acreDateDebut) : null;

  await prisma.fiscalProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      activityType,
      versementLiberatoire,
      declarationFrequency,
      tvaAssujetti,
      acre,
      acreDateDebut: acreDate,
      situationFamiliale: versementLiberatoire ? null : situationFamiliale || null,
      enfantsACharge: versementLiberatoire ? 0 : enfantsACharge,
      siret,
      address,
      ownerName: ownerName || null,
      businessName: businessName || null,
      professionalEmail: professionalEmail || null,
      phone: phone || null,
      tvaNumber,
    },
    update: {
      activityType,
      versementLiberatoire,
      declarationFrequency,
      tvaAssujetti,
      acre,
      acreDateDebut: acreDate,
      situationFamiliale: versementLiberatoire ? null : situationFamiliale || null,
      enfantsACharge: versementLiberatoire ? 0 : enfantsACharge,
      siret,
      address,
      ownerName: ownerName || null,
      businessName: businessName || null,
      professionalEmail: professionalEmail || null,
      phone: phone || null,
      tvaNumber,
    },
  });

  return NextResponse.json({ success: true });
}

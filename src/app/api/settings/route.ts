import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const profile = await prisma.fiscalProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
  }

  return NextResponse.json({
    activityType: profile.activityType,
    versementLiberatoire: profile.versementLiberatoire,
    declarationFrequency: profile.declarationFrequency,
    tvaAssujetti: profile.tvaAssujetti,
    acre: profile.acre,
    situationFamiliale: profile.situationFamiliale,
    enfantsACharge: profile.enfantsACharge,
  });
}

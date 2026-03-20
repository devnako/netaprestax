import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const accesses = await prisma.accountantAccess.findMany({
    where: {
      accountantId: session.user.id,
      status: "ACTIVE",
    },
    include: {
      client: {
        include: {
          profile: {
            select: {
              businessName: true,
              siret: true,
              tvaAssujetti: true,
            },
          },
        },
      },
    },
  });

  const clients = accesses.map((access) => ({
    id: access.client.id,
    name: access.client.name,
    email: access.client.email,
    businessName: access.client.profile?.businessName,
    siret: access.client.profile?.siret,
    tvaAssujetti: access.client.profile?.tvaAssujetti ?? false,
  }));

  return NextResponse.json(clients);
}

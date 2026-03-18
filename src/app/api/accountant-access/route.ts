import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const accesses = await prisma.accountantAccess.findMany({
    where: {
      clientId: session.user.id,
      status: { not: "REVOKED" },
    },
    include: {
      accountant: {
        select: { name: true, email: true },
      },
    },
  });

  return NextResponse.json(accesses);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { email } = await request.json();

  if (!email) {
    return NextResponse.json(
      { error: "Email requis" },
      { status: 400 }
    );
  }

  const accountant = await prisma.user.findFirst({
    where: {
      email,
      role: "ACCOUNTANT",
    },
  });

  if (!accountant) {
    return NextResponse.json(
      { error: "Comptable non trouvé" },
      { status: 404 }
    );
  }

  // Check if access already exists
  const existingAccess = await prisma.accountantAccess.findFirst({
    where: {
      accountantId: accountant.id,
      clientId: session.user.id,
    },
  });

  if (existingAccess) {
    // If it was revoked, reactivate it
    if (existingAccess.status === "REVOKED") {
      const access = await prisma.accountantAccess.update({
        where: { id: existingAccess.id },
        data: { status: "ACTIVE" },
        include: {
          accountant: {
            select: { name: true, email: true },
          },
        },
      });
      return NextResponse.json(access, { status: 200 });
    }

    return NextResponse.json(
      { error: "Accès déjà actif" },
      { status: 400 }
    );
  }

  const access = await prisma.accountantAccess.create({
    data: {
      accountantId: accountant.id,
      clientId: session.user.id,
      status: "ACTIVE",
    },
    include: {
      accountant: {
        select: { name: true, email: true },
      },
    },
  });

  return NextResponse.json(access, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID requis" },
      { status: 400 }
    );
  }

  const access = await prisma.accountantAccess.findUnique({
    where: { id },
  });

  if (!access || access.clientId !== session.user.id) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  await prisma.accountantAccess.update({
    where: { id },
    data: { status: "REVOKED" },
  });

  return NextResponse.json({ success: true });
}

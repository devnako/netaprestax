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

  const clients = await prisma.client.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { quotes: true, invoices: true } } },
  });

  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { name, email, phone, address, siret, notes } = await request.json();

  if (!name) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: {
      userId: session.user.id,
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      siret: siret || null,
      notes: notes || null,
    },
    include: { _count: { select: { quotes: true, invoices: true } } },
  });

  return NextResponse.json(client);
}

export async function PUT(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id, name, email, phone, address, siret, notes } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  if (!name) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }

  // Verify ownership
  const client = await prisma.client.findUnique({ where: { id } });

  if (!client || client.userId !== session.user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const updatedClient = await prisma.client.update({
    where: { id },
    data: {
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      siret: siret || null,
      notes: notes || null,
    },
    include: { _count: { select: { quotes: true, invoices: true } } },
  });

  return NextResponse.json(updatedClient);
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
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  // Verify ownership
  const client = await prisma.client.findUnique({ where: { id } });

  if (!client || client.userId !== session.user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  await prisma.client.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

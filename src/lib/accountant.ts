import { prisma } from "@/lib/db";

export async function verifyAccountantAccess(accountantId: string, clientId: string) {
  const access = await prisma.accountantAccess.findFirst({
    where: {
      accountantId,
      clientId,
      status: "ACTIVE",
    },
  });
  return !!access;
}

export async function getAccountantSession(headers: Headers) {
  const { auth } = await import("@/lib/auth");
  const session = await auth.api.getSession({ headers });
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ACCOUNTANT") return null;
  return session;
}

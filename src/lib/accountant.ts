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

import { prisma } from "@/lib/db";

export async function getNextQuoteNumber(userId: string, year: number): Promise<string> {
  const prefix = `DEV-${year}-`;
  const count = await prisma.quote.count({
    where: { userId, number: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

export async function getNextInvoiceNumber(userId: string, year: number): Promise<string> {
  const prefix = `FAC-${year}-`;
  const count = await prisma.invoice.count({
    where: { userId, number: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

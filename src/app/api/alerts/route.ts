import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { SEUILS_CA, ACTIVITY_LABELS } from "@/lib/fiscal/rates";
import type { ActivityType } from "@/lib/fiscal/types";

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

  const currentYear = new Date().getFullYear();
  const revenues = await prisma.revenue.findMany({
    where: { userId: session.user.id, year: currentYear },
  });

  const activityType = profile.activityType as ActivityType;
  const yearlyCA = revenues.reduce((sum, r) => sum + Number(r.amount), 0);
  const seuilCA = SEUILS_CA[activityType];
  const seuilPercent = (yearlyCA / seuilCA) * 100;

  const alerts: Array<{ type: "warning" | "danger" | "info"; title: string; message: string }> = [];

  if (seuilPercent >= 100) {
    alerts.push({
      type: "danger",
      title: "Seuil dépassé",
      message: `Ton CA annuel dépasse le plafond de ${new Intl.NumberFormat("fr-FR").format(seuilCA)} €. Tu risques de perdre le statut auto-entrepreneur l'année prochaine.`,
    });
  } else if (seuilPercent >= 90) {
    alerts.push({
      type: "danger",
      title: "Seuil presque atteint",
      message: `Tu es à ${seuilPercent.toFixed(1)}% du plafond. Il ne te reste que ${new Intl.NumberFormat("fr-FR").format(Math.round(seuilCA - yearlyCA))} € de marge.`,
    });
  } else if (seuilPercent >= 75) {
    alerts.push({
      type: "warning",
      title: "Attention au seuil",
      message: `Tu as utilisé ${seuilPercent.toFixed(1)}% de ton plafond annuel. Surveille ton CA sur les prochains mois.`,
    });
  }

  // TVA threshold alert (for non-TVA users)
  if (!profile.tvaAssujetti) {
    const seuilTVA = activityType === "BIC_VENTE" ? 91900 : 36800;
    if (yearlyCA >= seuilTVA) {
      alerts.push({
        type: "warning",
        title: "Seuil de franchise TVA dépassé",
        message: `Ton CA dépasse ${new Intl.NumberFormat("fr-FR").format(seuilTVA)} €. Tu pourrais être redevable de la TVA. Vérifie ta situation auprès de ton centre des impôts.`,
      });
    } else if (yearlyCA >= seuilTVA * 0.9) {
      alerts.push({
        type: "info",
        title: "Seuil TVA en approche",
        message: `Tu approches du seuil de franchise TVA (${new Intl.NumberFormat("fr-FR").format(seuilTVA)} €). Pense à anticiper si tu penses dépasser.`,
      });
    }
  }

  return NextResponse.json({
    yearlyCA,
    seuilCA,
    seuilPercent: Math.min(seuilPercent, 100),
    activityLabel: ACTIVITY_LABELS[activityType],
    alerts,
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SEUILS_CA, ACTIVITY_LABELS } from "@/lib/fiscal/rates";
import type { ActivityType } from "@/lib/fiscal/types";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const EMAIL_FROM = process.env.EMAIL_FROM || "NetAprèsTax <onboarding@resend.dev>";

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json({ error: "Resend non configuré" }, { status: 500 });
  }

  const currentYear = new Date().getFullYear();

  // Get all users with profiles
  const users = await prisma.user.findMany({
    where: { profile: { isNot: null } },
    include: {
      profile: true,
      revenues: { where: { year: currentYear } },
      alertLogs: { where: { year: currentYear } },
    },
  });

  let alertsSent = 0;

  for (const user of users) {
    if (!user.profile) continue;

    const activityType = user.profile.activityType as ActivityType;
    const yearlyCA = user.revenues.reduce((sum, r) => sum + Number(r.amount), 0);
    const seuilCA = SEUILS_CA[activityType];
    const percent = (yearlyCA / seuilCA) * 100;
    const sentAlerts = user.alertLogs.map((a) => a.alertType);

    // Check CA thresholds
    if (percent >= 100 && !sentAlerts.includes("SEUIL_100")) {
      await sendAlert(user.email, user.name, "SEUIL_100", {
        subject: "Tu as dépassé le plafond auto-entrepreneur",
        message: `Ton CA annuel (${formatEuro(yearlyCA)}) dépasse le plafond de ${formatEuro(seuilCA)} pour ton activité "${ACTIVITY_LABELS[activityType]}". Tu risques de perdre ton statut auto-entrepreneur l'année prochaine. Consulte un comptable pour évaluer tes options.`,
      });
      await logAlert(user.id, "SEUIL_100", currentYear);
      alertsSent++;
    } else if (percent >= 90 && !sentAlerts.includes("SEUIL_90")) {
      await sendAlert(user.email, user.name, "SEUIL_90", {
        subject: "Attention : 90% du plafond auto-entrepreneur atteint",
        message: `Tu es à ${percent.toFixed(1)}% de ton plafond (${formatEuro(seuilCA)}). Il ne te reste que ${formatEuro(Math.round(seuilCA - yearlyCA))} de marge cette année.`,
      });
      await logAlert(user.id, "SEUIL_90", currentYear);
      alertsSent++;
    } else if (percent >= 75 && !sentAlerts.includes("SEUIL_75")) {
      await sendAlert(user.email, user.name, "SEUIL_75", {
        subject: "75% de ton plafond auto-entrepreneur utilisé",
        message: `Tu as atteint ${percent.toFixed(1)}% de ton plafond annuel (${formatEuro(seuilCA)}). Pense à surveiller ton CA sur les prochains mois.`,
      });
      await logAlert(user.id, "SEUIL_75", currentYear);
      alertsSent++;
    }

    // Check TVA threshold
    if (!user.profile.tvaAssujetti) {
      const seuilTVA = activityType === "BIC_VENTE" ? 91900 : 36800;

      if (yearlyCA >= seuilTVA && !sentAlerts.includes("TVA_DEPASSE")) {
        await sendAlert(user.email, user.name, "TVA_DEPASSE", {
          subject: "Seuil de franchise TVA dépassé",
          message: `Ton CA (${formatEuro(yearlyCA)}) dépasse le seuil de franchise TVA (${formatEuro(seuilTVA)}). Tu pourrais être redevable de la TVA. Vérifie ta situation auprès de ton centre des impôts.`,
        });
        await logAlert(user.id, "TVA_DEPASSE", currentYear);
        alertsSent++;
      } else if (yearlyCA >= seuilTVA * 0.9 && !sentAlerts.includes("TVA_APPROCHE")) {
        await sendAlert(user.email, user.name, "TVA_APPROCHE", {
          subject: "Seuil TVA en approche",
          message: `Tu approches du seuil de franchise TVA (${formatEuro(seuilTVA)}). Anticipe pour ne pas être surpris.`,
        });
        await logAlert(user.id, "TVA_APPROCHE", currentYear);
        alertsSent++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    usersChecked: users.length,
    alertsSent,
  });
}

async function sendAlert(
  email: string,
  name: string | null,
  _type: string,
  content: { subject: string; message: string }
) {
  if (!resend) return;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: content.subject,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #2563eb;">NetAprèsTax</h2>
        <p>Salut ${name || ""},</p>
        <p>${content.message}</p>
        <p style="margin-top: 24px;">
          <a href="${process.env.BETTER_AUTH_URL}/dashboard/alerts"
             style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none;">
            Voir mes alertes
          </a>
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
          Tu reçois cet email car tu utilises NetAprèsTax.
        </p>
      </div>
    `,
  });
}

async function logAlert(userId: string, alertType: string, year: number) {
  await prisma.alertLog.upsert({
    where: {
      userId_alertType_year: {
        userId,
        alertType: alertType as "SEUIL_75" | "SEUIL_90" | "SEUIL_100" | "TVA_APPROCHE" | "TVA_DEPASSE",
        year,
      },
    },
    create: {
      userId,
      alertType: alertType as "SEUIL_75" | "SEUIL_90" | "SEUIL_100" | "TVA_APPROCHE" | "TVA_DEPASSE",
      year,
    },
    update: {
      sentAt: new Date(),
    },
  });
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

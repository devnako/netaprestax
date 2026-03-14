import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const socialProviders = process.env.GOOGLE_CLIENT_ID
  ? {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    }
  : undefined;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: resend
      ? async ({ user, url }) => {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || "NetAprèsTax <onboarding@resend.dev>",
            to: user.email,
            subject: "Réinitialise ton mot de passe",
            html: `<p>Salut ${user.name || ""},</p><p>Clique sur le lien pour réinitialiser ton mot de passe :</p><p><a href="${url}">Réinitialiser mon mot de passe</a></p><p>Si tu n'as pas fait cette demande, ignore cet email.</p>`,
          });
        }
      : undefined,
  },
  emailVerification: {
    sendVerificationEmail: resend
      ? async ({ user, url }) => {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || "NetAprèsTax <onboarding@resend.dev>",
            to: user.email,
            subject: "Vérifie ton adresse email",
            html: `<p>Salut ${user.name || ""},</p><p>Clique sur le lien pour vérifier ton email :</p><p><a href="${url}">Vérifier mon email</a></p>`,
          });
        }
      : undefined,
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  socialProviders,
});

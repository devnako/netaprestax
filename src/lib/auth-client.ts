"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession, changePassword, updateUser, resetPassword } = authClient;

export async function requestPasswordReset(email: string, redirectTo: string) {
  return authClient.$fetch("/request-password-reset", {
    method: "POST",
    body: { email, redirectTo },
  });
}

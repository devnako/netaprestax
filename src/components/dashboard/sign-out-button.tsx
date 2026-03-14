"use client";

import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
    >
      <LogOut className="h-4 w-4" />
      Déconnexion
    </button>
  );
}

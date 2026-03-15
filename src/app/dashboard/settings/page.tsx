"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, User } from "lucide-react";
import { useSession, updateUser, changePassword } from "@/lib/auth-client";

type ActivityType = "BIC_VENTE" | "BIC_PRESTATION" | "BNC_LIBERAL_URSSAF" | "BNC_LIBERAL_CIPAV";
type DeclarationFrequency = "MENSUELLE" | "TRIMESTRIELLE";
type SituationFamiliale = "CELIBATAIRE" | "EN_COUPLE";

interface ProfileData {
  activityType: ActivityType;
  versementLiberatoire: boolean;
  declarationFrequency: DeclarationFrequency;
  tvaAssujetti: boolean;
  acre: boolean;
  situationFamiliale: SituationFamiliale | null;
  enfantsACharge: number;
}

const ACTIVITY_OPTIONS = [
  { value: "BIC_VENTE", label: "Vente de marchandises", taux: "12.3%" },
  { value: "BIC_PRESTATION", label: "Prestation de services (BIC)", taux: "21.2%" },
  { value: "BNC_LIBERAL_URSSAF", label: "Profession libérale (URSSAF)", taux: "25.6%" },
  { value: "BNC_LIBERAL_CIPAV", label: "Profession libérale (CIPAV)", taux: "23.2%" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // User profile state
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session]);

  const loadProfile = useCallback(async () => {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Erreur lors de la sauvegarde");
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    router.refresh();
  };

  if (loading) {
    return <p className="text-muted-foreground">Chargement...</p>;
  }

  if (!profile) {
    return <p className="text-muted-foreground">Profil non trouvé.</p>;
  }

  const handleNameSave = async () => {
    setSavingName(true);
    await updateUser({ name });
    setSavingName(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 3000);
  };

  const handlePasswordChange = async () => {
    setPasswordError(null);
    if (newPassword.length < 8) {
      setPasswordError("Le mot de passe doit faire au moins 8 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }
    setSavingPassword(true);
    const result = await changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: false,
    });
    if (result.error) {
      setPasswordError(result.error.message ?? "Mot de passe actuel incorrect");
      setSavingPassword(false);
      return;
    }
    setSavingPassword(false);
    setPasswordSaved(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>

      {/* User Profile Section */}
      <section className="mt-6 max-w-lg">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <User className="h-5 w-5" />
          Mon compte
        </h2>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Email</label>
            <p className="mt-1 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              {session?.user?.email ?? "—"}
            </p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">Nom</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleNameSave}
              disabled={savingName}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {savingName ? "Enregistrement..." : "Modifier le nom"}
            </button>
            {nameSaved && (
              <span className="flex items-center gap-1 text-sm text-accent">
                <CheckCircle2 className="h-4 w-4" /> Enregistré
              </span>
            )}
          </div>
        </div>

        {/* Password Change */}
        <div className="mt-6 space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-semibold text-foreground">Changer le mot de passe</h3>

          {passwordError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {passwordError}
            </div>
          )}
          {passwordSaved && (
            <div className="flex items-center gap-2 rounded-lg bg-accent/10 p-3 text-sm text-accent">
              <CheckCircle2 className="h-4 w-4" /> Mot de passe modifié
            </div>
          )}

          <input
            type="password"
            placeholder="Mot de passe actuel"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="block w-full rounded-lg border border-border px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="password"
            placeholder="Nouveau mot de passe (8 car. min)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="block w-full rounded-lg border border-border px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="password"
            placeholder="Confirmer le nouveau mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="block w-full rounded-lg border border-border px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handlePasswordChange}
            disabled={savingPassword || !currentPassword || !newPassword}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {savingPassword ? "Modification..." : "Changer le mot de passe"}
          </button>
        </div>
      </section>

      {/* Fiscal Profile Section */}
      <section className="mt-10 max-w-lg border-t border-border pt-6">
        <h2 className="text-lg font-semibold text-foreground">Profil fiscal</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Modifie ton profil fiscal. Les calculs seront mis à jour automatiquement.
        </p>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent/10 p-3 text-sm text-accent">
          <CheckCircle2 className="h-4 w-4" />
          Profil mis à jour
        </div>
      )}

      <div className="mt-4 space-y-6">
        {/* Activity Type */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            Type d&apos;activité
          </label>
          <select
            value={profile.activityType}
            onChange={(e) =>
              setProfile({ ...profile, activityType: e.target.value as ActivityType })
            }
            className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {ACTIVITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} — {opt.taux}
              </option>
            ))}
          </select>
        </div>

        {/* Versement Libératoire */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            Versement libératoire
          </label>
          <div className="mt-2 flex gap-4">
            <RadioButton
              selected={profile.versementLiberatoire === true}
              onClick={() =>
                setProfile({
                  ...profile,
                  versementLiberatoire: true,
                  situationFamiliale: null,
                  enfantsACharge: 0,
                })
              }
              label="Oui"
            />
            <RadioButton
              selected={profile.versementLiberatoire === false}
              onClick={() => setProfile({ ...profile, versementLiberatoire: false })}
              label="Non (barème progressif)"
            />
          </div>
        </div>

        {/* Situation Familiale (if no VL) */}
        {!profile.versementLiberatoire && (
          <div className="rounded-lg bg-muted p-4 space-y-4">
            <p className="text-sm font-medium text-foreground">Situation familiale</p>
            <div className="flex gap-4">
              <RadioButton
                selected={profile.situationFamiliale === "CELIBATAIRE"}
                onClick={() => setProfile({ ...profile, situationFamiliale: "CELIBATAIRE" })}
                label="Célibataire"
              />
              <RadioButton
                selected={profile.situationFamiliale === "EN_COUPLE"}
                onClick={() => setProfile({ ...profile, situationFamiliale: "EN_COUPLE" })}
                label="En couple"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Enfants à charge
              </label>
              <select
                value={profile.enfantsACharge}
                onChange={(e) =>
                  setProfile({ ...profile, enfantsACharge: Number(e.target.value) })
                }
                className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={0}>Aucun</option>
                <option value={1}>1 enfant</option>
                <option value={2}>2 enfants</option>
                <option value={3}>3 enfants</option>
                <option value={4}>4 enfants ou plus</option>
              </select>
            </div>
          </div>
        )}

        {/* Declaration Frequency */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            Fréquence de déclaration
          </label>
          <div className="mt-2 flex gap-4">
            <RadioButton
              selected={profile.declarationFrequency === "MENSUELLE"}
              onClick={() => setProfile({ ...profile, declarationFrequency: "MENSUELLE" })}
              label="Mensuelle"
            />
            <RadioButton
              selected={profile.declarationFrequency === "TRIMESTRIELLE"}
              onClick={() => setProfile({ ...profile, declarationFrequency: "TRIMESTRIELLE" })}
              label="Trimestrielle"
            />
          </div>
        </div>

        {/* TVA */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            Assujetti à la TVA
          </label>
          <div className="mt-2 flex gap-4">
            <RadioButton
              selected={profile.tvaAssujetti === false}
              onClick={() => setProfile({ ...profile, tvaAssujetti: false })}
              label="Non (franchise)"
            />
            <RadioButton
              selected={profile.tvaAssujetti === true}
              onClick={() => setProfile({ ...profile, tvaAssujetti: true })}
              label="Oui"
            />
          </div>
        </div>

        {/* ACRE */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            Bénéficiaire ACRE
          </label>
          <div className="mt-2 flex gap-4">
            <RadioButton
              selected={profile.acre === false}
              onClick={() => setProfile({ ...profile, acre: false })}
              label="Non"
            />
            <RadioButton
              selected={profile.acre === true}
              onClick={() => setProfile({ ...profile, acre: true })}
              label="Oui"
            />
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>
      </section>
    </div>
  );
}

function RadioButton({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
        selected
          ? "border-primary bg-primary/5 text-primary"
          : "border-border text-muted-foreground hover:border-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";

type ActivityType = "BIC_VENTE" | "BIC_PRESTATION" | "BNC_LIBERAL_URSSAF" | "BNC_LIBERAL_CIPAV";
type DeclarationFrequency = "MENSUELLE" | "TRIMESTRIELLE";
type SituationFamiliale = "CELIBATAIRE" | "EN_COUPLE";

interface OnboardingData {
  activityType: ActivityType | "";
  versementLiberatoire: boolean | null;
  situationFamiliale: SituationFamiliale | "";
  enfantsACharge: number;
  declarationFrequency: DeclarationFrequency | "";
  tvaAssujetti: boolean | null;
  acre: boolean | null;
}

const STEPS = [
  "Activité",
  "Impôt",
  "Déclaration",
  "TVA & ACRE",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    activityType: "",
    versementLiberatoire: null,
    situationFamiliale: "",
    enfantsACharge: 0,
    declarationFrequency: "",
    tvaAssujetti: null,
    acre: null,
  });

  const canNext = () => {
    switch (step) {
      case 0:
        return data.activityType !== "";
      case 1:
        if (data.versementLiberatoire === null) return false;
        if (!data.versementLiberatoire && data.situationFamiliale === "") return false;
        return true;
      case 2:
        return data.declarationFrequency !== "";
      case 3:
        return data.tvaAssujetti !== null && data.acre !== null;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Une erreur est survenue");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted px-4">
      <div className="mb-8 text-2xl font-bold text-foreground">
        Net<span className="text-primary">AprèsTax</span>
      </div>

      <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-8 shadow-sm">
        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-2 w-full rounded-full ${
                  i <= step ? "bg-primary" : "bg-border"
                }`}
              />
              <span
                className={`text-xs ${
                  i <= step ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Step 0: Activity Type */}
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold text-foreground">Quelle est ton activité ?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ça détermine tes taux de cotisations URSSAF.
            </p>
            <div className="mt-6 space-y-3">
              <RadioOption
                selected={data.activityType === "BIC_VENTE"}
                onClick={() => setData({ ...data, activityType: "BIC_VENTE" })}
                label="Vente de marchandises"
                description="Commerce, e-commerce, vente en ligne — Taux : 12.3%"
              />
              <RadioOption
                selected={data.activityType === "BIC_PRESTATION"}
                onClick={() => setData({ ...data, activityType: "BIC_PRESTATION" })}
                label="Prestation de services"
                description="Artisan, VTC, services commerciaux — Taux : 21.2%"
              />
              <RadioOption
                selected={data.activityType === "BNC_LIBERAL_URSSAF"}
                onClick={() => setData({ ...data, activityType: "BNC_LIBERAL_URSSAF" })}
                label="Activité libérale (URSSAF)"
                description="Consultant, développeur, coach — Taux : 25.6%"
              />
              <RadioOption
                selected={data.activityType === "BNC_LIBERAL_CIPAV"}
                onClick={() => setData({ ...data, activityType: "BNC_LIBERAL_CIPAV" })}
                label="Activité libérale (CIPAV)"
                description="Architecte, psychologue, ingénieur conseil — Taux : 23.2%"
              />
            </div>
          </div>
        )}

        {/* Step 1: Tax Regime */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-foreground">Ton régime fiscal</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Le versement libératoire te permet de payer l&apos;impôt directement avec tes cotisations, à un taux fixe.
            </p>
            <div className="mt-6 space-y-3">
              <RadioOption
                selected={data.versementLiberatoire === true}
                onClick={() => setData({ ...data, versementLiberatoire: true })}
                label="Oui, versement libératoire"
                description="Tu paies l'impôt avec tes cotisations (taux fixe)"
              />
              <RadioOption
                selected={data.versementLiberatoire === false}
                onClick={() => setData({ ...data, versementLiberatoire: false })}
                label="Non, barème progressif"
                description="Ton revenu AE est ajouté à ta déclaration d'impôt classique"
              />
            </div>

            {data.versementLiberatoire === false && (
              <div className="mt-6 space-y-4 rounded-lg bg-muted p-4">
                <p className="text-sm font-medium text-foreground">
                  Pour estimer ton impôt, on a besoin de ta situation :
                </p>
                <div className="space-y-3">
                  <RadioOption
                    selected={data.situationFamiliale === "CELIBATAIRE"}
                    onClick={() => setData({ ...data, situationFamiliale: "CELIBATAIRE" })}
                    label="Célibataire"
                    description="1 part fiscale"
                  />
                  <RadioOption
                    selected={data.situationFamiliale === "EN_COUPLE"}
                    onClick={() => setData({ ...data, situationFamiliale: "EN_COUPLE" })}
                    label="En couple (marié/pacsé)"
                    description="2 parts fiscales"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Enfants à charge
                  </label>
                  <select
                    value={data.enfantsACharge}
                    onChange={(e) =>
                      setData({ ...data, enfantsACharge: Number(e.target.value) })
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
          </div>
        )}

        {/* Step 2: Declaration Frequency */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-foreground">Fréquence de déclaration</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              À quelle fréquence déclares-tu ton CA à l&apos;URSSAF ?
            </p>
            <div className="mt-6 space-y-3">
              <RadioOption
                selected={data.declarationFrequency === "MENSUELLE"}
                onClick={() => setData({ ...data, declarationFrequency: "MENSUELLE" })}
                label="Mensuelle"
                description="Tu déclares ton CA chaque mois"
              />
              <RadioOption
                selected={data.declarationFrequency === "TRIMESTRIELLE"}
                onClick={() => setData({ ...data, declarationFrequency: "TRIMESTRIELLE" })}
                label="Trimestrielle"
                description="Tu déclares ton CA tous les 3 mois"
              />
            </div>
          </div>
        )}

        {/* Step 3: TVA & ACRE */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-foreground">TVA et ACRE</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Dernières questions pour calibrer tes calculs.
            </p>

            <div className="mt-6">
              <p className="text-sm font-medium text-foreground">
                Es-tu assujetti à la TVA ?
              </p>
              <div className="mt-3 space-y-3">
                <RadioOption
                  selected={data.tvaAssujetti === false}
                  onClick={() => setData({ ...data, tvaAssujetti: false })}
                  label="Non (franchise en base)"
                  description="Tu ne factures pas la TVA"
                />
                <RadioOption
                  selected={data.tvaAssujetti === true}
                  onClick={() => setData({ ...data, tvaAssujetti: true })}
                  label="Oui"
                  description="Tu factures et reverses la TVA"
                />
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-foreground">
                Bénéficies-tu de l&apos;ACRE ?
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                L&apos;ACRE réduit tes cotisations pendant ta 1ère année d&apos;activité.
              </p>
              <div className="mt-3 space-y-3">
                <RadioOption
                  selected={data.acre === false}
                  onClick={() => setData({ ...data, acre: false })}
                  label="Non"
                  description="Taux de cotisations normal"
                />
                <RadioOption
                  selected={data.acre === true}
                  onClick={() => setData({ ...data, acre: true })}
                  label="Oui"
                  description="Taux réduits pendant 4 trimestres"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Suivant
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canNext() || loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Enregistrement..." : "Terminer"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RadioOption({
  selected,
  onClick,
  label,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border p-4 text-left transition ${
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:border-muted-foreground"
      }`}
    >
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </button>
  );
}

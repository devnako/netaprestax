import type { CalculInput, CalculResult, SituationFamiliale } from "./types";
import {
  COTISATIONS_RATES,
  CFP_RATES,
  VFL_RATES,
  ABATTEMENT_RATES,
  BAREME_IR_2026,
  ACRE_REDUCTION_BEFORE_JULY_2026,
  ACRE_REDUCTION_AFTER_JULY_2026,
  ACRE_REFORM_DATE,
} from "./rates";

/**
 * Calcule le nombre de parts fiscales selon la situation familiale.
 */
export function calculerPartsFiscales(
  situation: SituationFamiliale | null | undefined,
  enfants: number
): number {
  let parts = situation === "EN_COUPLE" ? 2 : 1;

  if (enfants >= 1) parts += 0.5;
  if (enfants >= 2) parts += 0.5;
  if (enfants >= 3) parts += enfants - 2; // 1 part par enfant à partir du 3ème

  return parts;
}

/**
 * Calcule l'impôt sur le revenu au barème progressif pour un revenu imposable donné.
 * Le calcul se fait par part puis est multiplié par le nombre de parts.
 */
export function calculerIRBaremeProgressif(
  revenuImposable: number,
  partsFiscales: number
): number {
  const revenuParPart = revenuImposable / partsFiscales;
  let impotParPart = 0;
  let previousMax = 0;

  for (const tranche of BAREME_IR_2026) {
    if (revenuParPart <= previousMax) break;

    const revenuDansTranche = Math.min(revenuParPart, tranche.max) - previousMax;
    impotParPart += revenuDansTranche * tranche.taux;
    previousMax = tranche.max;
  }

  return Math.round(impotParPart * partsFiscales * 100) / 100;
}

/**
 * Détermine le taux de cotisations applicable (avec ou sans ACRE).
 */
export function getTauxCotisations(
  tauxNormal: number,
  acre: boolean,
  acreDateDebut?: Date | null
): number {
  if (!acre) return tauxNormal;

  if (acreDateDebut && acreDateDebut < ACRE_REFORM_DATE) {
    return tauxNormal * (1 - ACRE_REDUCTION_BEFORE_JULY_2026);
  }

  return tauxNormal * (1 - ACRE_REDUCTION_AFTER_JULY_2026);
}

/**
 * Moteur principal de calcul du revenu net réel.
 */
export function calculerNetReel(input: CalculInput): CalculResult {
  const { ca, fraisReels, profile } = input;
  const { activityType, versementLiberatoire, acre, acreDateDebut } = profile;

  // 1. Cotisations sociales
  const tauxNormal = COTISATIONS_RATES[activityType];
  const tauxCotisations = getTauxCotisations(tauxNormal, acre, acreDateDebut);
  const cotisationsSociales = Math.round(ca * tauxCotisations * 100) / 100;

  // 2. CFP
  const tauxCFP = CFP_RATES[activityType];
  const cfp = Math.round(ca * tauxCFP * 100) / 100;

  // 3. Impôt sur le revenu
  let impotRevenu: number;
  let tauxIR: number | null;
  let revenuImposable: number | null;
  let partsFiscales: number;

  if (versementLiberatoire) {
    tauxIR = VFL_RATES[activityType];
    impotRevenu = Math.round(ca * tauxIR * 100) / 100;
    revenuImposable = null;
    partsFiscales = 1;
  } else {
    const abattement = ABATTEMENT_RATES[activityType];
    revenuImposable = Math.round(ca * (1 - abattement) * 100) / 100;
    partsFiscales = calculerPartsFiscales(
      profile.situationFamiliale,
      profile.enfantsACharge
    );
    impotRevenu = calculerIRBaremeProgressif(revenuImposable, partsFiscales);
    tauxIR = null;
  }

  // 4. Net réel
  const netReel =
    Math.round((ca - cotisationsSociales - cfp - impotRevenu - fraisReels) * 100) / 100;

  return {
    ca,
    cotisationsSociales,
    cfp,
    impotRevenu,
    fraisReels,
    netReel,
    tauxCotisations,
    tauxCFP,
    tauxIR,
    revenuImposable,
    partsFiscales,
  };
}

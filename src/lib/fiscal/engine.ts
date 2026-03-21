import type { CalculInput, CalculResult, FiscalProfile, SituationFamiliale } from "./types";
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
 * Calcule la date de fin d'ACRE à partir de la date de création.
 * L'ACRE dure 4 trimestres civils : le trimestre de création + les 3 suivants.
 */
export function getAcreEndDate(dateCreation: Date): Date {
  const month = dateCreation.getMonth(); // 0-indexed
  const year = dateCreation.getFullYear();
  const quarterStartMonth = Math.floor(month / 3) * 3; // 0, 3, 6, 9
  // Fin du 4e trimestre = dernier jour du mois (quarterStart + 11)
  return new Date(year, quarterStartMonth + 12, 0);
}

/**
 * Vérifie si l'ACRE est encore active à une date donnée.
 */
export function isAcreActive(
  acre: boolean,
  acreDateDebut?: Date | null,
  referenceDate?: Date
): boolean {
  if (!acre || !acreDateDebut) return false;
  const endDate = getAcreEndDate(acreDateDebut);
  const now = referenceDate ?? new Date();
  return now <= endDate;
}

/**
 * Détermine le taux de cotisations applicable (avec ou sans ACRE).
 * Prend en compte l'expiration automatique de l'ACRE.
 */
export function getTauxCotisations(
  tauxNormal: number,
  acre: boolean,
  acreDateDebut?: Date | null,
  referenceDate?: Date
): number {
  if (!acre) return tauxNormal;

  // Si on a une date, vérifier que l'ACRE est encore active
  if (acreDateDebut) {
    if (!isAcreActive(acre, acreDateDebut, referenceDate)) return tauxNormal;
    if (acreDateDebut < ACRE_REFORM_DATE) {
      return tauxNormal * (1 - ACRE_REDUCTION_BEFORE_JULY_2026);
    }
    return tauxNormal * (1 - ACRE_REDUCTION_AFTER_JULY_2026);
  }

  // Sans date : applique le nouveau régime (backward compat)
  return tauxNormal * (1 - ACRE_REDUCTION_AFTER_JULY_2026);
}

/**
 * Calcule les cotisations pour un mois en respectant le type d'activité
 * stocké sur chaque revenu (et non le type courant du profil).
 */
export function calculerMoisMixte(
  monthRevenues: { amount: number | { toString(): string }; activityType: string | null }[],
  fraisReels: number,
  profile: FiscalProfile,
  referenceDate?: Date
): CalculResult | null {
  const ca = monthRevenues.reduce((sum, r) => sum + Number(r.amount), 0);
  if (ca <= 0) return null;

  // Group revenues by their stored activityType (fallback to profile)
  const byType = new Map<string, number>();
  for (const rev of monthRevenues) {
    const type = rev.activityType || profile.activityType;
    byType.set(type, (byType.get(type) || 0) + Number(rev.amount));
  }

  // Single type: straightforward
  if (byType.size === 1) {
    const actType = [...byType.keys()][0] as FiscalProfile["activityType"];
    return calculerNetReel({ ca, fraisReels, profile: { ...profile, activityType: actType }, referenceDate });
  }

  // Multiple types: aggregate cotisations per type
  let totalCot = 0, totalCFP = 0, totalIR = 0;
  for (const [actType, actCA] of byType) {
    const r = calculerNetReel({
      ca: actCA,
      fraisReels: 0,
      profile: { ...profile, activityType: actType as FiscalProfile["activityType"] },
      referenceDate,
    });
    totalCot += r.cotisationsSociales;
    totalCFP += r.cfp;
    totalIR += r.impotRevenu;
  }

  const dominant = [...byType.entries()].sort((a, b) => b[1] - a[1])[0][0] as FiscalProfile["activityType"];
  const ref = calculerNetReel({ ca, fraisReels, profile: { ...profile, activityType: dominant }, referenceDate });

  return {
    ca,
    cotisationsSociales: totalCot,
    cfp: totalCFP,
    impotRevenu: totalIR,
    fraisReels,
    netReel: Math.round((ca - totalCot - totalCFP - totalIR - fraisReels) * 100) / 100,
    tauxCotisations: ref.tauxCotisations,
    tauxCFP: ref.tauxCFP,
    tauxIR: ref.tauxIR,
    revenuImposable: ref.revenuImposable,
    partsFiscales: ref.partsFiscales,
  };
}

/**
 * Moteur principal de calcul du revenu net réel.
 */
export function calculerNetReel(input: CalculInput): CalculResult {
  const { ca, fraisReels, profile, referenceDate } = input;
  const { activityType, versementLiberatoire, acre, acreDateDebut } = profile;

  // 1. Cotisations sociales
  const tauxNormal = COTISATIONS_RATES[activityType];
  const tauxCotisations = getTauxCotisations(tauxNormal, acre, acreDateDebut, referenceDate);
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

import type { ActivityType } from "./types";

// ==========================================
// Taux de cotisations sociales URSSAF 2026
// ==========================================

export const COTISATIONS_RATES: Record<ActivityType, number> = {
  BIC_VENTE: 0.123,
  BIC_PRESTATION: 0.212,
  BNC_LIBERAL_URSSAF: 0.256,
  BNC_LIBERAL_CIPAV: 0.232,
};

// ==========================================
// ACRE - Réduction des cotisations
// Avant 01/07/2026 : réduction de 50%
// Après 01/07/2026 : réduction de 25%
// ==========================================

export const ACRE_REDUCTION_BEFORE_JULY_2026 = 0.5;
export const ACRE_REDUCTION_AFTER_JULY_2026 = 0.25;
export const ACRE_REFORM_DATE = new Date("2026-07-01");
export const ACRE_DURATION_QUARTERS = 4;

// ==========================================
// Contribution Formation Professionnelle
// ==========================================

export const CFP_RATES: Record<ActivityType, number> = {
  BIC_VENTE: 0.001,        // 0.1% — activité commerciale
  BIC_PRESTATION: 0.002,   // 0.2% — prestation de services
  BNC_LIBERAL_URSSAF: 0.002, // 0.2% — profession libérale
  BNC_LIBERAL_CIPAV: 0.002,  // 0.2% — profession libérale
};

// ==========================================
// Versement Forfaitaire Libératoire IR
// ==========================================

export const VFL_RATES: Record<ActivityType, number> = {
  BIC_VENTE: 0.01,
  BIC_PRESTATION: 0.017,
  BNC_LIBERAL_URSSAF: 0.022,
  BNC_LIBERAL_CIPAV: 0.022,
};

// ==========================================
// Abattements forfaitaires (micro-fiscal)
// ==========================================

export const ABATTEMENT_RATES: Record<ActivityType, number> = {
  BIC_VENTE: 0.71,
  BIC_PRESTATION: 0.5,
  BNC_LIBERAL_URSSAF: 0.34,
  BNC_LIBERAL_CIPAV: 0.34,
};

// ==========================================
// Barème IR 2026 (revenus 2025)
// Revalorisé +0.9% (inflation)
// ==========================================

export const BAREME_IR_2026 = [
  { max: 11600, taux: 0 },
  { max: 29579, taux: 0.11 },
  { max: 84577, taux: 0.3 },
  { max: 181917, taux: 0.41 },
  { max: Infinity, taux: 0.45 },
];

// ==========================================
// Seuils auto-entrepreneur (CA annuel)
// ==========================================

export const SEUILS_CA: Record<ActivityType, number> = {
  BIC_VENTE: 188700,
  BIC_PRESTATION: 77700,
  BNC_LIBERAL_URSSAF: 77700,
  BNC_LIBERAL_CIPAV: 77700,
};

// ==========================================
// Labels lisibles
// ==========================================

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  BIC_VENTE: "Vente de marchandises",
  BIC_PRESTATION: "Prestation de services (BIC)",
  BNC_LIBERAL_URSSAF: "Profession libérale (URSSAF)",
  BNC_LIBERAL_CIPAV: "Profession libérale (CIPAV)",
};

export type ActivityType =
  | "BIC_VENTE"
  | "BIC_PRESTATION"
  | "BNC_LIBERAL_URSSAF"
  | "BNC_LIBERAL_CIPAV";

export type SituationFamiliale = "CELIBATAIRE" | "EN_COUPLE";

export interface FiscalProfile {
  activityType: ActivityType;
  versementLiberatoire: boolean;
  tvaAssujetti: boolean;
  acre: boolean;
  acreDateDebut?: Date | null;
  situationFamiliale?: SituationFamiliale | null;
  enfantsACharge: number;
}

export interface CalculInput {
  ca: number;
  fraisReels: number;
  profile: FiscalProfile;
  referenceDate?: Date;
}

export interface CalculResult {
  ca: number;
  cotisationsSociales: number;
  cfp: number;
  impotRevenu: number;
  fraisReels: number;
  netReel: number;
  // Détail
  tauxCotisations: number;
  tauxCFP: number;
  tauxIR: number | null; // null si barème progressif
  revenuImposable: number | null; // null si versement libératoire
  partsFiscales: number;
}

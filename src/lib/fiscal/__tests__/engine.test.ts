import { describe, it, expect } from "vitest";
import {
  calculerNetReel,
  calculerPartsFiscales,
  calculerIRBaremeProgressif,
  getTauxCotisations,
  getAcreEndDate,
  isAcreActive,
} from "../engine";

// ==========================================
// Tests des parts fiscales
// ==========================================

describe("calculerPartsFiscales", () => {
  it("célibataire sans enfant = 1 part", () => {
    expect(calculerPartsFiscales("CELIBATAIRE", 0)).toBe(1);
  });

  it("en couple sans enfant = 2 parts", () => {
    expect(calculerPartsFiscales("EN_COUPLE", 0)).toBe(2);
  });

  it("célibataire avec 1 enfant = 1.5 parts", () => {
    expect(calculerPartsFiscales("CELIBATAIRE", 1)).toBe(1.5);
  });

  it("en couple avec 2 enfants = 3 parts", () => {
    expect(calculerPartsFiscales("EN_COUPLE", 2)).toBe(3);
  });

  it("en couple avec 3 enfants = 4 parts (1 part pour le 3ème)", () => {
    expect(calculerPartsFiscales("EN_COUPLE", 3)).toBe(4);
  });

  it("célibataire avec 4 enfants = 4 parts", () => {
    expect(calculerPartsFiscales("CELIBATAIRE", 4)).toBe(4);
  });

  it("null situation = 1 part", () => {
    expect(calculerPartsFiscales(null, 0)).toBe(1);
  });
});

// ==========================================
// Tests du barème IR progressif
// ==========================================

describe("calculerIRBaremeProgressif", () => {
  it("revenu sous le seuil = 0€ d'impôt", () => {
    expect(calculerIRBaremeProgressif(10000, 1)).toBe(0);
  });

  it("revenu à 11600€ (seuil exact) = 0€", () => {
    expect(calculerIRBaremeProgressif(11600, 1)).toBe(0);
  });

  it("revenu à 20000€, 1 part", () => {
    // 11600 à 0% + 8400 à 11% = 924€
    const result = calculerIRBaremeProgressif(20000, 1);
    expect(result).toBe(924);
  });

  it("revenu à 30000€, 1 part", () => {
    // 11600 à 0% + 17979 (11601-29579) à 11% = 1977.69 + 421 (29580-30000) à 30% = 126.30
    // Total = 1977.69 + 126.30 = 2103.99
    const result = calculerIRBaremeProgressif(30000, 1);
    expect(result).toBeCloseTo(2103.99, 1);
  });

  it("revenu à 20000€, 2 parts = moins d'impôt", () => {
    // 10000 par part → sous le seuil de 11600 → 0€
    const result = calculerIRBaremeProgressif(20000, 2);
    expect(result).toBe(0);
  });

  it("revenu à 40000€, 2 parts", () => {
    // 20000 par part → (20000 - 11600) * 11% = 924 par part → 1848 total
    const result = calculerIRBaremeProgressif(40000, 2);
    expect(result).toBe(1848);
  });
});

// ==========================================
// Tests ACRE
// ==========================================

describe("getAcreEndDate", () => {
  it("création en Q1 (janvier) → fin le 31 décembre", () => {
    const end = getAcreEndDate(new Date("2026-01-15"));
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(11); // décembre
    expect(end.getDate()).toBe(31);
  });

  it("création en Q2 (avril) → fin le 31 mars suivant", () => {
    const end = getAcreEndDate(new Date("2026-04-01"));
    expect(end.getFullYear()).toBe(2027);
    expect(end.getMonth()).toBe(2); // mars
    expect(end.getDate()).toBe(31);
  });

  it("création en Q3 (juillet) → fin le 30 juin suivant", () => {
    const end = getAcreEndDate(new Date("2026-07-15"));
    expect(end.getFullYear()).toBe(2027);
    expect(end.getMonth()).toBe(5); // juin
    expect(end.getDate()).toBe(30);
  });

  it("création en Q4 (octobre) → fin le 30 septembre suivant", () => {
    const end = getAcreEndDate(new Date("2026-10-01"));
    expect(end.getFullYear()).toBe(2027);
    expect(end.getMonth()).toBe(8); // septembre
    expect(end.getDate()).toBe(30);
  });
});

describe("isAcreActive", () => {
  it("active pendant la période", () => {
    expect(isAcreActive(true, new Date("2026-03-01"), new Date("2026-06-15"))).toBe(true);
  });

  it("expirée après la période", () => {
    expect(isAcreActive(true, new Date("2026-01-01"), new Date("2027-01-01"))).toBe(false);
  });

  it("false si acre=false", () => {
    expect(isAcreActive(false, new Date("2026-03-01"), new Date("2026-06-15"))).toBe(false);
  });

  it("false si pas de date", () => {
    expect(isAcreActive(true, null, new Date("2026-06-15"))).toBe(false);
  });
});

describe("getTauxCotisations", () => {
  it("sans ACRE = taux normal", () => {
    expect(getTauxCotisations(0.212, false)).toBe(0.212);
  });

  it("ACRE avant juillet 2026 et encore active = -50%", () => {
    const date = new Date("2026-03-01");
    const ref = new Date("2026-06-15");
    expect(getTauxCotisations(0.212, true, date, ref)).toBeCloseTo(0.106);
  });

  it("ACRE après juillet 2026 et encore active = -25%", () => {
    const date = new Date("2026-08-01");
    const ref = new Date("2026-10-15");
    expect(getTauxCotisations(0.212, true, date, ref)).toBeCloseTo(0.159);
  });

  it("ACRE expirée = taux normal", () => {
    const date = new Date("2025-01-15");
    const ref = new Date("2026-03-01");
    expect(getTauxCotisations(0.212, true, date, ref)).toBe(0.212);
  });

  it("ACRE sans date = -25% (backward compat)", () => {
    expect(getTauxCotisations(0.212, true, null)).toBeCloseTo(0.159);
  });
});

// ==========================================
// Tests du calcul complet
// ==========================================

describe("calculerNetReel", () => {
  it("BIC Prestation, 3000€, VL, sans ACRE, sans frais", () => {
    const result = calculerNetReel({
      ca: 3000,
      fraisReels: 0,
      profile: {
        activityType: "BIC_PRESTATION",
        versementLiberatoire: true,
        tvaAssujetti: false,
        acre: false,
        acreDateDebut: null,
        situationFamiliale: null,
        enfantsACharge: 0,
      },
    });

    // Cotisations: 3000 * 21.2% = 636
    expect(result.cotisationsSociales).toBe(636);
    // CFP: 3000 * 0.2% = 6
    expect(result.cfp).toBe(6);
    // IR VL: 3000 * 1.7% = 51
    expect(result.impotRevenu).toBe(51);
    // Net: 3000 - 636 - 6 - 51 = 2307
    expect(result.netReel).toBe(2307);
    expect(result.tauxIR).toBe(0.017);
  });

  it("BIC Vente, 5000€, VL, sans ACRE, 200€ frais", () => {
    const result = calculerNetReel({
      ca: 5000,
      fraisReels: 200,
      profile: {
        activityType: "BIC_VENTE",
        versementLiberatoire: true,
        tvaAssujetti: false,
        acre: false,
        acreDateDebut: null,
        situationFamiliale: null,
        enfantsACharge: 0,
      },
    });

    // Cotisations: 5000 * 12.3% = 615
    expect(result.cotisationsSociales).toBe(615);
    // CFP: 5000 * 0.1% = 5
    expect(result.cfp).toBe(5);
    // IR VL: 5000 * 1.0% = 50
    expect(result.impotRevenu).toBe(50);
    // Net: 5000 - 615 - 5 - 50 - 200 = 4130
    expect(result.netReel).toBe(4130);
  });

  it("BNC URSSAF, 4000€, barème progressif, célibataire sans enfant", () => {
    const result = calculerNetReel({
      ca: 4000,
      fraisReels: 100,
      profile: {
        activityType: "BNC_LIBERAL_URSSAF",
        versementLiberatoire: false,
        tvaAssujetti: false,
        acre: false,
        acreDateDebut: null,
        situationFamiliale: "CELIBATAIRE",
        enfantsACharge: 0,
      },
    });

    // Cotisations: 4000 * 25.6% = 1024
    expect(result.cotisationsSociales).toBe(1024);
    // CFP: 4000 * 0.2% = 8
    expect(result.cfp).toBe(8);
    // Revenu imposable: 4000 * (1 - 34%) = 2640 → sous 11600 → IR = 0
    expect(result.revenuImposable).toBe(2640);
    expect(result.impotRevenu).toBe(0);
    // Net: 4000 - 1024 - 8 - 0 - 100 = 2868
    expect(result.netReel).toBe(2868);
    expect(result.partsFiscales).toBe(1);
    expect(result.tauxIR).toBeNull();
  });

  it("BIC Prestation, 5000€, barème progressif, en couple 2 enfants", () => {
    const result = calculerNetReel({
      ca: 5000,
      fraisReels: 0,
      profile: {
        activityType: "BIC_PRESTATION",
        versementLiberatoire: false,
        tvaAssujetti: false,
        acre: false,
        acreDateDebut: null,
        situationFamiliale: "EN_COUPLE",
        enfantsACharge: 2,
      },
    });

    // Cotisations: 5000 * 21.2% = 1060
    expect(result.cotisationsSociales).toBe(1060);
    // Revenu imposable: 5000 * (1 - 50%) = 2500
    // 3 parts → 2500/3 = 833 par part → sous 11600 → IR = 0
    expect(result.partsFiscales).toBe(3);
    expect(result.impotRevenu).toBe(0);
  });

  it("ACRE avant juillet 2026 réduit les cotisations de 50%", () => {
    const result = calculerNetReel({
      ca: 3000,
      fraisReels: 0,
      referenceDate: new Date("2026-06-01"),
      profile: {
        activityType: "BIC_PRESTATION",
        versementLiberatoire: true,
        tvaAssujetti: false,
        acre: true,
        acreDateDebut: new Date("2026-03-01"),
        situationFamiliale: null,
        enfantsACharge: 0,
      },
    });

    // Cotisations ACRE: 3000 * 10.6% = 318
    expect(result.cotisationsSociales).toBe(318);
    expect(result.tauxCotisations).toBeCloseTo(0.106);
  });

  it("le net réel ne peut pas être négatif avec des gros frais", () => {
    const result = calculerNetReel({
      ca: 1000,
      fraisReels: 5000,
      profile: {
        activityType: "BIC_VENTE",
        versementLiberatoire: true,
        tvaAssujetti: false,
        acre: false,
        acreDateDebut: null,
        situationFamiliale: null,
        enfantsACharge: 0,
      },
    });

    // Le net peut être négatif (c'est la réalité)
    expect(result.netReel).toBeLessThan(0);
    expect(result.ca).toBe(1000);
    expect(result.fraisReels).toBe(5000);
  });
});

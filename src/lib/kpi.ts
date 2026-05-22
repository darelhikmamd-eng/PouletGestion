import type { Bande, ConsommationAliment, SanteHygiene, Sortie, BandeKPIs } from "@/types";

const MARGE_GROS_DISCOUNT = 0.05; // 5% de remise pour vente en gros

export function computeKPIs(
  bande: Bande,
  consommations: ConsommationAliment[],
  santeOps: SanteHygiene[],
  sorties: Sortie[]
): BandeKPIs {
  const totalDeces = sorties
    .filter((s) => s.motif === "décès")
    .reduce((acc, s) => acc + s.quantite, 0);

  const totalVendus = sorties
    .filter((s) => s.motif === "vente")
    .reduce((acc, s) => acc + s.quantite, 0);

  const volaillesActuelles = Math.max(0, bande.nbr_poussins - totalDeces - totalVendus);
  const survivants = Math.max(0, bande.nbr_poussins - totalDeces);

  const tauxMortalite =
    bande.nbr_poussins > 0 ? (totalDeces / bande.nbr_poussins) * 100 : 0;

  const today = new Date();
  const debut = new Date(bande.date_debut);
  const ageBande = Math.max(
    0,
    Math.floor((today.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24))
  );

  const totalAliment = consommations.reduce((acc, c) => acc + c.montant, 0);
  const totalSante = santeOps.reduce((acc, s) => acc + s.montant, 0);
  const totalQuantiteKg = consommations.reduce((acc, c) => acc + c.quantite_kg, 0);

  const totalDepenses = bande.prix_achat_global + totalAliment + totalSante;

  const coutParPoussinInitial =
    bande.nbr_poussins > 0 ? bande.prix_achat_global / bande.nbr_poussins : 0;

  const seuilVenteParSujet =
    survivants > 0 ? totalDepenses / survivants : (bande.nbr_poussins > 0 ? totalDepenses / bande.nbr_poussins : 0);

  const prixRecommande20 = Math.ceil(seuilVenteParSujet * 1.2);
  const prixRecommande30 = Math.ceil(seuilVenteParSujet * 1.3);

  const prixGrosMarge20 = Math.ceil(prixRecommande20 * (1 - MARGE_GROS_DISCOUNT));
  const prixGrosMarge30 = Math.ceil(prixRecommande30 * (1 - MARGE_GROS_DISCOUNT));

  const beneficePotentiel20 = prixRecommande20 * volaillesActuelles - totalDepenses;
  const beneficePotentiel30 = prixRecommande30 * volaillesActuelles - totalDepenses;

  const revenuGenere = sorties
    .filter((s) => s.motif === "vente")
    .reduce((acc, s) => acc + s.montant_total, 0);

  const marge = revenuGenere - totalDepenses;

  const tauxMargeActuel =
    totalDepenses > 0 && revenuGenere > 0
      ? ((revenuGenere - totalDepenses) / totalDepenses) * 100
      : 0;

  const coutParKgEstime = totalQuantiteKg > 0 ? totalDepenses / totalQuantiteKg : 0;

  return {
    volaillesActuelles,
    survivants,
    tauxMortalite,
    ageBande,
    totalDepenses,
    seuilVenteParSujet,
    revenuGenere,
    marge,
    totalDeces,
    totalVendus,
    totalAliment,
    totalSante,
    coutParPoussinInitial,
    prixRecommande20,
    prixRecommande30,
    prixGrosMarge20,
    prixGrosMarge30,
    beneficePotentiel20,
    beneficePotentiel30,
    tauxMargeActuel,
    totalQuantiteKg,
    coutParKgEstime,
  };
}

export function formatMontant(montant: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(montant);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function formatDateLong(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

export interface ProphylaxisMilestone {
  jour: number;
  label: string;
  type: string;
  maladie: string;
  note: string;
}

export const PROPHYLAXIS_SCHEDULE: ProphylaxisMilestone[] = [
  { jour: 1, label: "Newcastle & Bronchite + Anti-stress", type: "Vaccination", maladie: "Newcastle", note: "Vaccin HB1/H120 + vitamines de démarrage." },
  { jour: 5, label: "Maladie de Gumboro (1er passage)", type: "Vaccination", maladie: "Gumboro", note: "Vaccin Gumboro intermédiaire en eau de boisson." },
  { jour: 12, label: "Rappel Maladie de Gumboro", type: "Vaccination", maladie: "Gumboro", note: "Deuxième passage Gumboro pour immunité robuste." },
  { jour: 18, label: "Rappel Newcastle + Bronchite", type: "Vaccination", maladie: "Newcastle", note: "Vaccin La Sota en eau de boisson pour protection durable." },
  { jour: 28, label: "Anti-coccidien (Prévention)", type: "Traitement Curatif", maladie: "Coccidiose", note: "Traitement préventif anticoccidien pendant 3-5 jours." },
  { jour: 35, label: "Vitamines de Finition", type: "Vitamines", maladie: "Autre", note: "Vitamines de croissance pour optimiser le poids corporel final." }
];

export interface ClimateRecommendation {
  tempMin: number;
  tempMax: number;
  humiditeMin: number;
  humiditeMax: number;
  eclairageHeures: number;
  conseil: string;
}

export function getClimateRecommendation(ageJours: number): ClimateRecommendation {
  if (ageJours <= 3) {
    return {
      tempMin: 32,
      tempMax: 33,
      humiditeMin: 60,
      humiditeMax: 70,
      eclairageHeures: 23,
      conseil: "Période de démarrage très critique. Chauffage stable requis, évitez absolument les courants d'air. Donnez de l'eau tiède avec vitamines anti-stress.",
    };
  } else if (ageJours <= 7) {
    return {
      tempMin: 30,
      tempMax: 31,
      humiditeMin: 60,
      humiditeMax: 70,
      eclairageHeures: 22,
      conseil: "Transition douce vers l'aliment croissance. Nettoyez régulièrement les assiettes de démarrage pour enlever la poussière et stimuler l'appétit.",
    };
  } else if (ageJours <= 14) {
    return {
      tempMin: 28,
      tempMax: 29,
      humiditeMin: 60,
      humiditeMax: 70,
      eclairageHeures: 20,
      conseil: "Rappel vaccinal Gumboro proche. Vérifiez la sécheresse et l'épaisseur de la litière. Remplacez toute litière humide par du copeau propre.",
    };
  } else if (ageJours <= 21) {
    return {
      tempMin: 25,
      tempMax: 26,
      humiditeMin: 50,
      humiditeMax: 60,
      eclairageHeures: 18,
      conseil: "Phase de croissance rapide. La ventilation doit être augmentée pour évacuer les odeurs d'ammoniac tout en évitant le refroidissement direct.",
    };
  } else if (ageJours <= 28) {
    return {
      tempMin: 22,
      tempMax: 23,
      humiditeMin: 50,
      humiditeMax: 60,
      eclairageHeures: 16,
      conseil: "Rappel vaccinal Newcastle. Ajustez la hauteur des abreuvoirs et mangeoires au niveau du dos des sujets pour limiter le gaspillage.",
    };
  } else {
    return {
      tempMin: 20,
      tempMax: 21,
      humiditeMin: 50,
      humiditeMax: 60,
      eclairageHeures: 16,
      conseil: "Phase de finition. Prévenez le stress thermique les jours de forte chaleur. IMPORTANT : Aucun traitement médicamenteux 5 jours avant abattage.",
    };
  }
}


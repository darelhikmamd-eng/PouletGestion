import type { Bande, ConsommationAliment, SanteHygiene, Sortie, BandeKPIs } from "@/types";

const MARGE_GROS_DISCOUNT = 0.05; // 5% de remise pour vente en gros

export function getEstimatedWeight(ageJours: number): number {
  if (ageJours <= 0) return 0.04; // 40g poussins
  if (ageJours <= 7) return 0.04 + (ageJours * 0.02); // ~180g à 7 jours
  if (ageJours <= 14) return 0.18 + ((ageJours - 7) * 0.04); // ~460g à 14 jours
  if (ageJours <= 21) return 0.46 + ((ageJours - 14) * 0.07); // ~950g à 21 jours
  if (ageJours <= 28) return 0.95 + ((ageJours - 21) * 0.08); // ~1.51kg à 28 jours
  if (ageJours <= 35) return 1.51 + ((ageJours - 28) * 0.09); // ~2.14kg à 35 jours
  if (ageJours <= 42) return 2.14 + ((ageJours - 35) * 0.08); // ~2.7kg à 42 jours
  if (ageJours <= 45) return 2.7 + ((ageJours - 42) * 0.07); // ~2.91kg à 45 jours
  return 2.91 + ((ageJours - 45) * 0.03); // après 45 jours la croissance ralentit fortement à 30g/jour
}

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

  const poidsMoyenEstime = getEstimatedWeight(ageBande);
  const gainPoidsTotalKg = Math.max(0.1, (survivants * poidsMoyenEstime) - (bande.nbr_poussins * 0.04));
  const fcr = gainPoidsTotalKg > 0 ? totalQuantiteKg / gainPoidsTotalKg : 0;

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
    poidsMoyenEstime,
    fcr,
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

export interface FeedRecommendation {
  semaine: number;
  typeAliment: string;
  besoinJournalierParSujetGrams: number;
  besoinJournalierTotalKg: number;
  besoinHebdoTotalKg: number;
  conseil: string;
}

export function getFeedRecommendation(ageJours: number, effectif: number): FeedRecommendation {
  const semaine = Math.max(1, Math.ceil(ageJours / 7));
  let typeAliment = "Aliment Démarrage (Miette)";
  let besoinJournalierParSujetGrams = 20;
  let conseil = "Veillez à ce que les abreuvoirs soient toujours propres et l'aliment accessible en permanence.";

  if (semaine === 1) {
    besoinJournalierParSujetGrams = 20;
    typeAliment = "Aliment Démarrage (Miette)";
    conseil = "Démarrage critique. Assurez un chauffage stable à 32°C. Distribuez de petites quantités fraîches 4 à 5 fois par jour.";
  } else if (semaine === 2) {
    besoinJournalierParSujetGrams = 50;
    typeAliment = "Aliment Démarrage / Croissance";
    conseil = "Transition progressive vers l'aliment croissance. Nettoyez régulièrement les mangeoires pour stimuler la prise d'aliment.";
  } else if (semaine === 3) {
    besoinJournalierParSujetGrams = 90;
    typeAliment = "Aliment Croissance (Granulé)";
    conseil = "Croissance musculaire rapide. Veillez à ajuster la hauteur des lignes d'alimentation au niveau du dos des volailles.";
  } else if (semaine === 4) {
    besoinJournalierParSujetGrams = 130;
    typeAliment = "Aliment Croissance (Granulé)";
    conseil = "Phase intensive. Assurez une ventilation accrue pour dissiper l'humidité et l'ammoniac accumulés dans le bâtiment.";
  } else if (semaine === 5) {
    besoinJournalierParSujetGrams = 170;
    typeAliment = "Aliment Finition";
    conseil = "Transition vers l'aliment de finition. Limitez les manipulations au strict minimum pour éviter de stresser les volailles.";
  } else if (semaine === 6) {
    besoinJournalierParSujetGrams = 200;
    typeAliment = "Aliment Finition";
    conseil = "Finition et engraissement final. Surveillez la température ambiante les après-midis pour éviter le stress thermique.";
  } else {
    besoinJournalierParSujetGrams = 220;
    typeAliment = "Aliment Finition";
    conseil = "Étape d'écoulement commercial (Cycle nominal de 45 jours atteint). Arrêtez impérativement tout traitement médicamenteux (délai d'attente).";
  }

  const besoinJournalierTotalKg = (besoinJournalierParSujetGrams * (effectif || 0)) / 1000;
  const besoinHebdoTotalKg = besoinJournalierTotalKg * 7;

  return {
    semaine,
    typeAliment,
    besoinJournalierParSujetGrams,
    besoinJournalierTotalKg,
    besoinHebdoTotalKg,
    conseil,
  };
}

export interface PathologieIA {
  id: string;
  nom: string;
  description: string;
  symptomes: string[];
  mesuresUrgence: string[];
  traitementPropose: string;
  dureeConvalescenceJours: number;
}

export const DIAGNOSTIC_IA_DISEASES: PathologieIA[] = [
  {
    id: "coccidiose",
    nom: "Coccidiose Aviaire",
    description: "Infection parasitaire intestinale extrêmement fréquente due à des protozoaires du genre Eimeria. Elle altère gravement l'absorption des nutriments.",
    symptomes: [
      "Fientes diarrhéiques contenant des traces de sang (fientes rosâtres à rouges)",
      "Prostration générale des sujets, plumes ébouriffées, ailes pendantes",
      "Perte d'appétit brutale et forte baisse de l'activité du lot",
      "Pâleur des crêtes et des barbillons due à l'anémie"
    ],
    mesuresUrgence: [
      "Isoler immédiatement les sujets présentant des symptômes sévères",
      "Changer complètement la litière humide autour des abreuvoirs et la brûler",
      "Désinfecter le matériel d'alimentation et de boisson à l'aide d'un anticoccidien",
      "Réduire l'humidité relative du bâtiment par une ventilation optimale"
    ],
    traitementPropose: "Administration d'un anticoccidien (ex: Amprolium, Toltrazuril) dans l'eau de boisson pendant 3 à 5 jours, suivie d'une cure de vitamines A et K.",
    dureeConvalescenceJours: 7
  },
  {
    id: "newcastle",
    nom: "Maladie de Newcastle (Pseudo-peste)",
    description: "Maladie virale hautement contagieuse et redoutable touchant les systèmes respiratoire, digestif et nerveux des oiseaux. Mortalité souvent très élevée en cas de souches vélogènes.",
    symptomes: [
      "Difficultés respiratoires sévères (râles, sifflements, bec ouvert)",
      "Diarrhée verdâtre aqueuse très caractéristique",
      "Symptômes nerveux tardifs (torticolis, paralysie des ailes ou des pattes, tremblements)",
      "Mortalité subite et importante dans le lot"
    ],
    mesuresUrgence: [
      "Mettre le bâtiment sous quarantaine stricte et interdire tout accès extérieur",
      "Déclarer immédiatement l'alerte à un vétérinaire agréé ou aux autorités sanitaires",
      "Éliminer de manière hygiénique les cadavres (enfouissement ou incinération)",
      "Désinfection complète des sas sanitaires et barrière biosécuritaire totale"
    ],
    traitementPropose: "Aucun traitement curatif n'existe pour le virus de Newcastle. Administration de vitamines de soutien et couverture antibiotique de large spectre (ex: Oxytétracycline) pour prévenir les surinfections bactériennes.",
    dureeConvalescenceJours: 14
  },
  {
    id: "colibacillose",
    nom: "Colibacillose Aviaire (E. coli)",
    description: "Infection bactérienne systémique causée par Escherichia coli. Survient généralement suite à un stress bioclimatique (coup de froid, excès d'ammoniac) ou à un manque d'hygiène.",
    symptomes: [
      "Respiration difficile (dyspnée) et râles bronchiques légers",
      "Fientes blanchâtres à jaunâtres d'aspect pâteux",
      "Suivie d'un retard de croissance important et d'une baisse de l'indice FCR",
      "Somnolence des poussins qui se regroupent sous les sources de chaleur"
    ],
    mesuresUrgence: [
      "Améliorer d'urgence la qualité de l'air en évacuant l'ammoniac accumulé",
      "Assainir l'eau de boisson par chloration (2 à 3 ppm de chlore actif) ou traitement acide",
      "Vérifier le taux d'humidité de la litière et ajouter du copeau propre et sec",
      "Éviter les variations brusques de température dans le poulailler"
    ],
    traitementPropose: "Antibiothérapie ciblée par voie orale (ex: Colistine, Néomycine ou Enrofloxacine) pendant 5 jours consécutifs sous contrôle de dosage rigoureux.",
    dureeConvalescenceJours: 5
  },
  {
    id: "sain",
    nom: "Sujets Sains & Litière Normale",
    description: "L'analyse d'image ne révèle aucune anomalie pathologique visible. Les fientes et l'aspect corporel sont conformes aux standards de bonne santé.",
    symptomes: [
      "Fientes sèches, bien formées, d'aspect brun-grisâtre avec une coiffe d'urates blanche",
      "Activité vigoureuse et répartition homogène des volailles dans le poulailler",
      "Consommation normale d'eau et d'aliments",
      "Plumage propre, lisse et comportement alerte"
    ],
    mesuresUrgence: [
      "Maintenir les protocoles de biosécurité standards à l'entrée du bâtiment",
      "Continuer le calendrier de prophylaxie vaccinale prévu",
      "Assurer des paramètres bioclimatiques stables",
      "Garantir de l'eau potable propre et fraîche en permanence"
    ],
    traitementPropose: "Aucun traitement médical nécessaire. Poursuivre le programme de rationnement alimentaire en vigueur et l'apport régulier de vitamines de croissance.",
    dureeConvalescenceJours: 0
  }
];


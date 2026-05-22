"use client";

import { useState, useEffect, useMemo } from "react";
import { Save, X, Calculator, AlertTriangle, ShieldCheck, Stethoscope, ClipboardList, Zap } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useBandesStore } from "@/store/useBandesStore";
import { formatMontant } from "@/lib/kpi";
import type { SortieFormData, MotifSortie } from "@/types";

interface SortieFormProps {
  bandeId?: string;
  onSuccess: () => void;
  onCancel: () => void;
  onlyVente?: boolean;
}

const defaultForm = (bandeId: string): SortieFormData => ({
  bande_id: bandeId,
  date: new Date().toISOString().split("T")[0],
  motif: "vente",
  cause_deces: "",
  quantite: 0,
  prix_unitaire: 0,
  montant_total: 0,
});

// ─── Protocoles vétérinaires par cause ────────────────────────────────────────

interface Protocole {
  urgence: "critique" | "haute" | "moderee" | "faible";
  traitement: string[];
  suivi: string[];
  prevention: string[];
  duree: string;
}

const PROTOCOLES: Record<string, Protocole> = {
  "Stress thermique (chaleur excessive)": {
    urgence: "haute",
    traitement: [
      "Ouvrir immédiatement toutes les ouvertures pour maximiser la ventilation",
      "Mettre en marche les ventilateurs en mode haute vitesse",
      "Brumiser de l'eau fraîche dans le bâtiment (nebuliseur ou aspersion)",
      "Distribuer de l'eau froide avec électrolytes (sel + sucre) en continu",
      "Administrer de la vitamine C dans l'eau de boisson (anti-stress thermique)",
    ],
    suivi: [
      "Surveiller la temperature ambiante toutes les 2 heures (cible < 28°C)",
      "Compter les morts chaque matin et soir pendant 3 jours",
      "Observer le comportement : halètement, ailes écartées = stress persistant",
      "Peser un echantillon de 20 sujets pour evaluer la perte de poids",
    ],
    prevention: [
      "Installer des filets ombreux ou baches sur le toit les jours de forte chaleur",
      "Arroser le toit en tôle avec de l'eau fraîche le matin",
      "Éviter de distribuer l'aliment aux heures les plus chaudes (11h-15h)",
    ],
    duree: "3 à 5 jours de suivi intensif",
  },
  "Coup de froid / hypothermie": {
    urgence: "haute",
    traitement: [
      "Allumer immédiatement les sources de chaleur (chauffage, lampes infrarouge)",
      "Fermer toutes les ouvertures pour supprimer les courants d'air",
      "Regrouper les poussins sous les sources de chaleur (zone de confort)",
      "Distribuer de l'eau tiède avec vitamines anti-stress",
      "Vérifier et remplacer la litière humide par du copeau sec",
    ],
    suivi: [
      "Vérifier la température ambiante au niveau des sujets (cible ≥ 30°C en phase démarrage)",
      "Observer les comportements d'entassement excessif = signe de froid persistant",
      "Surveiller les signes respiratoires (rales, éternuements) dans les 72h",
      "Contrôler la consommation d'eau et d'aliment : une baisse = signal d'alarme",
    ],
    prevention: [
      "Installer un thermomètre à hauteur des sujets dans plusieurs zones du bâtiment",
      "Réduire la ventilation la nuit les premières semaines",
      "Vérifier l'étanchéité du bâtiment avant chaque nouvelle bande",
    ],
    duree: "48 à 72 heures de surveillance rapprochée",
  },
  "Variation brusque de température": {
    urgence: "moderee",
    traitement: [
      "Stabiliser la température ambiante progressivement (±1°C/heure maximum)",
      "Administrer vitamines anti-stress dans l'eau de boisson pendant 3 jours",
      "Surveiller les signes de coccidiose ou colibacillose qui surviennent souvent après un stress",
    ],
    suivi: [
      "Observer les fientes pendant 5 jours (diarrhée = complication infectieuse)",
      "Vérifier la consommation alimentaire quotidiennement",
      "Surveiller les premiers signes respiratoires (Mycoplasmose post-stress)",
    ],
    prevention: [
      "Programmer des changements de température gradués (courbe de chauffage)",
      "Installer un thermomètre-hygromètre connecté avec alarme",
    ],
    duree: "5 jours de surveillance",
  },
  "Maladie de Newcastle": {
    urgence: "critique",
    traitement: [
      "⚠️ AUCUN traitement curatif n'existe contre le virus Newcastle",
      "Mettre le bâtiment sous QUARANTAINE STRICTE — interdire tout accès",
      "Éliminer hygieniquement les cadavres (enfouissement ou incinération)",
      "Administrer antibiotiques large spectre (Oxytétracycline) contre les surinfections bactériennes",
      "Vitamines solubles (A, D, E, C) pour soutenir le système immunitaire",
      "Déclarer l'alerte au vétérinaire agréé ou aux autorités sanitaires",
    ],
    suivi: [
      "Compter les morts DEUX FOIS par jour — tenir un registre précis",
      "Observer les signes nerveux (torticolis, paralysie) pour évaluer l'évolution",
      "Désinfection complète du sas d'entrée avec produit virucide actif",
      "Ne jamais déplacer de volailles vers ou depuis d'autres élevages",
      "Vérifier le statut vaccinal du lot : rappel La Sota si nécessaire",
    ],
    prevention: [
      "Vaccination systématique : HB1 à J1, La Sota à J18 — sans aucun écart",
      "Biosécurité maximale : bac de désinfection, tenue spécifique bâtiment",
      "Ne jamais mélanger des oiseaux de lots d'âges différents",
    ],
    duree: "14 à 21 jours de quarantaine et surveillance",
  },
  "Maladie de Gumboro (IBD)": {
    urgence: "haute",
    traitement: [
      "Isoler immédiatement les sujets malades dans un espace séparé",
      "Traitement électrolyte + vitamines A et K dans l'eau (lutte contre la diarrhée hémorragique)",
      "Antibiotique oral (Amoxicilline) pour prévenir les surinfections",
      "Antidiarrhéique (Kaolin + Pectine) pour réduire les pertes hydriques",
      "Maintenir la litière très sèche pour limiter la transmission par fomites",
    ],
    suivi: [
      "Observer les sujets déprimés avec plumes ébouriffées et tremblements",
      "Surveiller la couleur et la consistance des fientes (diarrhée blanchâtre = IBD actif)",
      "Peser les pertes journalières et comparer au lot standard Cobb 500",
      "Contrôle immunologique si disponible à J35 post-infection",
    ],
    prevention: [
      "Vaccin Gumboro intermédiaire à J5 puis rappel à J12 en eau de boisson",
      "Désinfection totale du bâtiment entre chaque bande (Glutaraldéhyde ou Formol)",
      "Vérifier la qualité de l'eau de boisson (pas de contamination fécale)",
    ],
    duree: "7 à 10 jours de traitement actif",
  },
  "Bronchite infectieuse": {
    urgence: "haute",
    traitement: [
      "Améliorer d'urgence la ventilation sans créer de courant d'air direct",
      "Antibiotique (Tylosine ou Spiramycine) contre les surinfections mycoplasmiques",
      "Vitamines solubles (A, D, C) pour soutenir les muqueuses respiratoires",
      "Fluidifiants bronchiques (Thym + Eucalyptus) en nébulisation si disponible",
      "Maintenir la température stable (éviter les variations >2°C en 24h)",
    ],
    suivi: [
      "Observer l'évolution des signes respiratoires (rales, éternuements) chaque matin",
      "Surveiller la ponte si bande reproductrice (chute de ponte = critère de gravité)",
      "Prélever des sujets morts pour analyse virologique si possible",
      "Vérifier que la consommation d'eau ne chute pas (signe de déshydratation)",
    ],
    prevention: [
      "Vaccin H120 + H52 à J1 et J18 en eau de boisson (broiler)",
      "Bonne ventilation et humidité < 70% pour réduire la charge virale",
      "Éviter les densités de peuplement excessives (max 10 sujets/m²)",
    ],
    duree: "7 jours de traitement, 14 jours de surveillance",
  },
  "Coccidiose aviaire": {
    urgence: "haute",
    traitement: [
      "Traitement anticoccidien immédiat : Amprolium ou Toltrazuril dans l'eau pendant 3-5 jours",
      "Vitamines A et K après la cure (réparation des lésions intestinales)",
      "Remplacer la litière humide autour des abreuvoirs par du copeau sec propre",
      "Désinfecter les abreuvoirs et les mangeoires avec ammoniac quaternaire",
      "Réduire l'humidité du bâtiment par ventilation accrue",
    ],
    suivi: [
      "Observer les fientes : disparition du sang après J3 = réponse au traitement",
      "Surveillance poids : peser 20 sujets le J1, J5 et J10 du traitement",
      "Contrôle coproscopique si mortalité persiste après J5 de traitement",
      "Surveiller la récidive dans les 15 jours suivant l'arrêt du traitement",
    ],
    prevention: [
      "Anticoccidien préventif à J28 systématiquement",
      "Litière sèche : changer les zones humides autour des abreuvoirs 2x/semaine",
      "Rotation des anticoccidiens d'une bande à l'autre pour éviter les résistances",
    ],
    duree: "5 jours de traitement + 15 jours de surveillance",
  },
  "Colibacillose (E. coli)": {
    urgence: "haute",
    traitement: [
      "Antibiothérapie orale ciblée (Colistine, Néomycine ou Enrofloxacine) pendant 5 jours",
      "Chloration de l'eau de boisson (2-3 ppm chlore actif) pour éliminer la source bactérienne",
      "Vitamines et électrolytes pour compenser les pertes par la diarrhée",
      "Améliorer d'urgence la qualité de l'air (évacuer l'ammoniac)",
      "Remplacer la litière humide dans les zones à forte densité",
    ],
    suivi: [
      "Observer les fientes (blanchâtres, pâteuses = E. coli actif)",
      "Surveiller la mortalité quotidiennement — une hausse après J3 = antibiotique inefficace",
      "Vérifier la qualité de l'eau (bactériologie si possible)",
      "Éviter les variations de température qui aggravent l'immunodépression",
    ],
    prevention: [
      "Hygiène stricte de l'eau : nettoyage hebdomadaire des lignes d'abreuvement",
      "Ventilation optimale pour maintenir l'ammoniac < 20 ppm",
      "Probiotiques dans l'eau en prévention (Lactobacillus sp.) entre les traitements",
    ],
    duree: "5 jours de traitement, 10 jours de surveillance",
  },
  "Mycoplasmose respiratoire": {
    urgence: "moderee",
    traitement: [
      "Tylosine, Lincomycine-Spectinomycine ou Enrofloxacine dans l'eau pendant 5-7 jours",
      "Antihistaminique pour réduire l'inflammation des voies respiratoires",
      "Vitamines A et D pour soutenir les muqueuses respiratoires",
      "Optimiser la ventilation sans créer de courant d'air froid direct",
    ],
    suivi: [
      "Suivre l'évolution des rales bronchiques 48h après debut du traitement",
      "Contrôler la consommation d'eau et d'aliment chaque jour",
      "Surveiller le FCR : une dégradation > 0.3 pts = surinfection probable",
      "Peser un échantillon pour évaluer le retard de croissance",
    ],
    prevention: [
      "Éviter le surpeuplement (densité max 10 sujets/m²)",
      "Maintenir l'ammoniac < 20 ppm dans le bâtiment",
      "Biosécurité : ne pas introduire de volailles de statut Mycoplasme inconnu",
    ],
    duree: "7 jours de traitement, 14 jours de surveillance",
  },
  "Maladie de Marek": {
    urgence: "critique",
    traitement: [
      "⚠️ Aucun traitement curatif disponible",
      "Isoler les sujets présentant paralysie ou tumeurs",
      "Éliminer les sujets gravement atteints (éviter le picage et la souffrance)",
      "Vitamines de soutien (B complexe) pour les sujets légèrement atteints",
      "Biosécurité maximale : désinfecter les chaussures et les mains à l'entrée",
    ],
    suivi: [
      "Surveiller l'apparition progressive de paralysie des membres",
      "Tenir un registre précis des morts avec description des signes observés",
      "Ne PAS vacciner des sujets déjà infectés — pas d'effet",
    ],
    prevention: [
      "Vaccination Marek obligatoire en couvoir dès le premier jour de vie",
      "Confirmer auprès du fournisseur que les poussins ont bien été vaccinés",
      "Désinfection totale du bâtiment entre chaque bande (virus résistant dans la poussière)",
    ],
    duree: "Surveillance permanente jusqu'à fin du cycle",
  },
  "Salmonellose": {
    urgence: "critique",
    traitement: [
      "Antibiotique oral : Ampicilline ou Fluoroquinolone pendant 5 jours",
      "Chloration de l'eau de boisson",
      "Vitamines et électrolytes pour compenserla diarrhée profuse",
      "⚠️ Signalement obligatoire aux autorités sanitaires (zoonose réglementée)",
      "Ne PAS consommer les œufs ou viandes du lot atteint sans traitement thermique",
    ],
    suivi: [
      "Prélèvements bactériologiques sur les cadavres pour confirmer le sérovar",
      "Surveillance de la mortalité deux fois par jour",
      "Respect strict du délai d'attente avant abattage (minimum 28 jours post-antibiotique)",
      "Désinfection complète de tout le matériel avec produit bactéricide homologué",
    ],
    prevention: [
      "Contrôle sanitaire du couvoir et du fournisseur de poussins",
      "Hygiène stricte de l'eau et de l'aliment",
      "Programme de prophylaxie conforme aux réglementations nationales",
    ],
    duree: "5 jours de traitement + 28 jours délai d'attente",
  },
  "Typhose aviaire (Pasteurellose)": {
    urgence: "haute",
    traitement: [
      "Sulfamides + Triméthoprime dans l'eau pendant 5-7 jours",
      "Tétracycline (Oxytétracycline) en alternative si résistance aux sulfamides",
      "Vitamines K pour réduire les hémorragies internes",
      "Améliorer immédiatement les conditions d'hygiène (litière, abreuvoirs)",
    ],
    suivi: [
      "Observer la couleur du foie sur les cadavres (foie bronzé = Typhose)",
      "Surveiller la mortalité 2x/jour les 5 premiers jours de traitement",
      "Vérifier que la mortalité cesse dans les 72h suivant le début du traitement",
    ],
    prevention: [
      "Éviter tout contact avec des oiseaux sauvages ou des rongeurs",
      "Biosécurité : bac de désinfection fonctionnel à l'entrée",
      "Gestion rigoureuse des déchets et cadavres (ne pas laisser pourrir)",
    ],
    duree: "7 jours de traitement, 14 jours de surveillance",
  },
  "Étouffement / entassement": {
    urgence: "critique",
    traitement: [
      "INTERVENTION IMMÉDIATE : disperser manuellement les entassements",
      "Identifier et éliminer la source de panique (prédateur, bruit, lumière)",
      "Augmenter l'espace disponible ou réduire la densité de peuplement",
      "Vérifier l'uniformité de l'éclairage (zones sombres = zone d'entassement)",
      "Administrer vitamines anti-stress dans l'eau",
    ],
    suivi: [
      "Surveiller la densité au sol (maximum 10 sujets/m² pour Cobb 500)",
      "Observer les comportements de fuite 2h après l'incident",
      "Inspecter le bâtiment pour identifier les entrées de prédateurs",
      "Vérifier le bon fonctionnement de l'éclairage (pas de zones d'ombre excessive)",
    ],
    prevention: [
      "Maintenir une densité de peuplement adaptée à l'âge",
      "Programme d'éclairage uniforme avec intensité progressivement réduite",
      "Sécuriser le bâtiment contre les intrusions de prédateurs (chats, serpents, rongeurs)",
    ],
    duree: "Surveillance 48h post-incident",
  },
  "Intoxication (ammoniac / fumée)": {
    urgence: "critique",
    traitement: [
      "Ouvrir IMMÉDIATEMENT toutes les ouvertures pour renouveler l'air",
      "Évacuer les sujets les plus touchés dans un espace propre et aéré",
      "Administrer vitamines A et C (protection des muqueuses respiratoires) dans l'eau",
      "Supprimer la source d'intoxication (litière saturée, fumée, gaz)",
      "Remplacer intégralement la litière contaminée",
    ],
    suivi: [
      "Mesurer le taux d'ammoniac (cible < 20 ppm) avec un détecteur si disponible",
      "Observer la conjonctivite et les larmoiements (signes d'irritation persistante)",
      "Surveiller les signes respiratoires secondaires dans les 5 jours",
      "Compter les morts matin et soir pendant une semaine",
    ],
    prevention: [
      "Changer régulièrement les zones humides de la litière (2x/semaine)",
      "Assurer une ventilation minimale de 0.1 m3/heure/kg de poids vif",
      "Ajouter des produits acidifiants sur la litière (acide phosphorique ou PROBIOX)",
    ],
    duree: "5 à 7 jours de surveillance post-intoxication",
  },
  "Noyade dans les abreuvoirs": {
    urgence: "moderee",
    traitement: [
      "Retirer ou réajuster immédiatement les abreuvoirs pour les rendre inaccessibles aux poussins",
      "Ajouter des cailloux ou des billes dans les plats d'eau pour les premiers jours",
      "Vérifier la hauteur des abreuvoirs (doit correspondre à la hauteur du dos des sujets)",
    ],
    suivi: [
      "Inspecter les abreuvoirs 3 fois par jour les 7 premiers jours",
      "S'assurer que les poussins peuvent accéder à l'eau sans risquer de chuter dedans",
    ],
    prevention: [
      "Utiliser des abreuvoirs ronds à pipette ou des abreuvoirs avec margelle étroite",
      "Ajuster la hauteur des abreuvoirs chaque semaine en fonction de la croissance",
      "Placer les abreuvoirs en dehors des zones d'entassement nocturne",
    ],
    duree: "Correction immédiate, surveillance 1 semaine",
  },
  "Traumatisme / blessure": {
    urgence: "moderee",
    traitement: [
      "Isoler les sujets blessés pour éviter le picage des congénères",
      "Désinfecter les plaies avec un antiseptique iodé (Bétadine) ou spray cicatrisant",
      "Antibiotique local ou systémique si infection secondaire",
      "Retirer les corps étrangers blessants du bâtiment (clous, fils barbelés, bois éclatés)",
    ],
    suivi: [
      "Surveiller les plaies tous les jours jusqu'à cicatrisation complète",
      "Observer les autres sujets pour détecter de nouveaux cas de cannibalisme",
      "Vérifier que les blessés isolés mangent et boivent normalement",
    ],
    prevention: [
      "Inspecter le bâtiment en début de bande pour retirer tous les corps blessants",
      "Réduire l'intensité lumineuse pour diminuer les comportements agressifs",
      "Maintenir une densité adaptée (surpeuplement = agressivité)",
    ],
    duree: "Surveillance jusqu'à cicatrisation complète",
  },
  "Cannibalisme / picage": {
    urgence: "moderee",
    traitement: [
      "Réduire IMMÉDIATEMENT l'intensité lumineuse (seuil maximum de 10 lux en phase croissance)",
      "Isoler les sujets ensanglantés pour éviter l'escalade",
      "Appliquer spray anti-picage (rouge ou bleu) sur les blessures visibles",
      "Envisager le débeccage si le problème persiste (sur avis vétérinaire)",
      "Ajouter de l'enrichissement environnemental (ballons, perchoirs, grains éparpillés)",
    ],
    suivi: [
      "Observer le comportement du troupeau 2 fois par jour",
      "Surveiller la consommation alimentaire (sous-alimentation = cause fréquente de picage)",
      "Vérifier la densité de peuplement et le nombre de mangeoires/abreuvoirs",
    ],
    prevention: [
      "Programme d'éclairage adapté selon l'âge (commencer fort, réduire progressivement)",
      "Garantir 1 abreuvoir pour 60 sujets et 1 mangeoire pour 25 sujets",
      "Éviter les denses trop élevées (> 12 sujets/m²)",
    ],
    duree: "7 à 14 jours de surveillance comportementale",
  },
  "Déshydratation / manque d'eau": {
    urgence: "critique",
    traitement: [
      "RÉTABLIR L'ACCÈS À L'EAU EN URGENCE — vérifier les fuites ou obstructions",
      "Distribuer manuellement de l'eau avec électrolytes (sel + sucre) dans des plateaux",
      "Ne pas donner trop d'eau d'un coup aux sujets déshydratés (risque de mort par choc)",
      "Vitamines C et B dans l'eau de réhydratation",
      "Contrôler les lignes d'abreuvement (pression, fuites, calcaire)",
    ],
    suivi: [
      "Vérifier le fonctionnement des abreuvoirs toutes les 2 heures pendant 24h",
      "Observer la reprise de consommation alimentaire après réhydratation",
      "Surveiller les reins sur les cadavres (sujets blancs, calcifiés = insuffisance rénale)",
    ],
    prevention: [
      "Inspection quotidienne obligatoire de tous les points d'eau",
      "Installer un système de détection de pression d'eau avec alarme",
      "Calculer la consommation journalière théorique et comparer à la réalité",
    ],
    duree: "48 à 72 heures de surveillance intensive",
  },
  "Sous-alimentation / malnutrition": {
    urgence: "moderee",
    traitement: [
      "Corriger immédiatement les rations selon le programme Cobb 500",
      "Distribuer un aliment de haute densité nutritionnelle pendant 7 jours",
      "Ajouter vitamines et acides aminés (Lysine, Méthionine) dans l'eau",
      "Vérifier le nombre et l'accessibilité des mangeoires",
    ],
    suivi: [
      "Peser un échantillon de 20 sujets et comparer au standard de poids Cobb 500",
      "Contrôler la consommation journalière (enregistrer les kg distribués)",
      "Évaluer l'uniformité du lot (coefficient de variation < 10% = lot homogène)",
    ],
    prevention: [
      "Suivre strictement le programme de rationnement Cobb 500 selon l'âge",
      "Ajuster les rations en cas de chaleur excessive (appétit réduit)",
      "Vérifier que les mangeoires ne sont pas vides plus d'une heure",
    ],
    duree: "10 à 14 jours de correction nutritionnelle",
  },
  "Intoxication alimentaire (aliment avarié)": {
    urgence: "critique",
    traitement: [
      "Retirer IMMÉDIATEMENT tout l'aliment contaminé des mangeoires",
      "Laver et désinfecter les mangeoires avec de l'eau chaude et du savon",
      "Distribuer un aliment propre et neuf de source contrôlée",
      "Adsorbant (charbon activé ou Bentonite) dans l'eau pour lier les mycotoxines",
      "Vitamines A, D, E pour soutenir la récupération hépatique",
    ],
    suivi: [
      "Faire analyser l'aliment retiré si possible (mycotoxines, salmonelle)",
      "Observer la reprise alimentaire dans les 24h suivant le changement d'aliment",
      "Surveiller la couleur du foie sur les cadavres (jaunissement = mycotoxicose)",
    ],
    prevention: [
      "Contrôler systématiquement l'odeur et l'aspect de l'aliment à chaque livraison",
      "Ne stocker les sacs d'aliment que 15 jours maximum en climat humide",
      "Surélever les sacs de 30 cm du sol et protéger des rongeurs",
    ],
    duree: "7 jours de surveillance post-intoxication",
  },
  "Mortalité de démarrage (J1–J5)": {
    urgence: "haute",
    traitement: [
      "Maintenir la température à 32-33°C avec chauffage stable",
      "Distribuer de l'eau tiède (30°C) avec vitamines anti-stress",
      "Vérifier la qualité des poussins : nombril fermé, yeux vifs, plumage sec",
      "Ajouter du glucose (50 g/litre) dans l'eau les 48 premières heures",
      "Assurer 23h d'éclairage pour stimuler la prise alimentaire",
    ],
    suivi: [
      "Compter les morts matin et soir les 5 premiers jours",
      "Observer le comportement : poussins entassés = trop froid / écartés = trop chaud",
      "Peser un échantillon à J7 et comparer au standard Cobb 500 (cible : 170-185g)",
      "Signaler au fournisseur si mortalité J1-J5 dépasse 1% du cheptel",
    ],
    prevention: [
      "Préchauffer le bâtiment 24h avant l'arrivée des poussins",
      "Inspecter les poussins à la réception (refuser les lots de mauvaise qualité)",
      "Contrôler la source et le couvoir de provenance des poussins",
    ],
    duree: "Surveillance intensive les 7 premiers jours",
  },
  "Poussin de mauvaise qualité (cheptel)": {
    urgence: "moderee",
    traitement: [
      "Trier et isoler les poussins faibles dès la réception",
      "Administrer vitamines anti-stress et glucose dans l'eau 48h",
      "Chauffage et confort optimal pour compenser la fragilité initiale",
      "Informer et documenter pour réclamer au fournisseur",
    ],
    suivi: [
      "Peser un échantillon à J7, J14 et J21 et comparer aux standards",
      "Calculer le taux de mortalité de démarrage (refus si > 1% en J1-J7)",
      "Évaluer l'homogénéité du lot (sujets retardataires = lot non-uniforme)",
    ],
    prevention: [
      "Choisir un couvoir certifié avec programme sanitaire documenté",
      "Exiger un certificat de vaccination Marek + Newcastle à la réception",
      "Contrôler le taux d'éclosion et d'uniformité du lot avant achat",
    ],
    duree: "14 jours de surveillance renforcée",
  },
  "Cause indéterminée": {
    urgence: "moderee",
    traitement: [
      "Prélever des cadavres frais et les envoyer au laboratoire vétérinaire le plus proche",
      "Administrer vitamines de soutien général dans l'eau",
      "Améliorer les conditions générales (litière, ventilation, eau, alimentation)",
      "Contacter un vétérinaire pour examen clinique du lot",
    ],
    suivi: [
      "Tenir un registre précis de la mortalité avec heure et signes observés",
      "Observer les sujets malades : signes respiratoires, nerveux, digestifs ?",
      "Attendre les résultats de laboratoire avant tout traitement spécifique",
    ],
    prevention: [
      "Maintenir un carnet d'élevage détaillé pour faciliter les diagnostics futurs",
      "Établir une relation avec un vétérinaire aviaire de proximité",
    ],
    duree: "Selon résultats d'analyse vétérinaire",
  },
  "Autre": {
    urgence: "faible",
    traitement: [
      "Documenter précisément les signes observés avant, pendant et après les morts",
      "Contacter un vétérinaire ou un technicien aviaire pour avis",
      "Administrer vitamines de soutien dans l'eau en attendant le diagnostic",
    ],
    suivi: [
      "Tenir un registre précis de la mortalité",
      "Observer et noter tout changement comportemental du lot",
    ],
    prevention: [
      "Maintenir les bonnes pratiques d'élevage et la biosécurité",
    ],
    duree: "Selon diagnostic vétérinaire",
  },
};

const URGENCE_CONFIG = {
  critique: { label: "URGENCE CRITIQUE", bg: "bg-red-50", border: "border-red-200", header: "bg-red-500", text: "text-red-700", dot: "bg-red-500 animate-ping" },
  haute:    { label: "URGENCE HAUTE",     bg: "bg-orange-50", border: "border-orange-200", header: "bg-orange-500", text: "text-orange-700", dot: "bg-orange-500 animate-pulse" },
  moderee:  { label: "URGENCE MODÉRÉE",   bg: "bg-amber-50", border: "border-amber-200", header: "bg-amber-500", text: "text-amber-700", dot: "bg-amber-400" },
  faible:   { label: "SUIVI STANDARD",    bg: "bg-blue-50", border: "border-blue-200", header: "bg-blue-500", text: "text-blue-700", dot: "bg-blue-400" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SortieForm({ bandeId = "", onSuccess, onCancel, onlyVente = false }: SortieFormProps) {
  const { bandes, addSortie } = useBandesStore();
  const [form, setForm] = useState<SortieFormData>(defaultForm(bandeId));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SortieFormData, string>>>({});

  const today = new Date();
  const eligibleBandes = bandes
    .filter((b) => {
      if (bandeId && b.id === bandeId) return true;
      if (b.statut !== "actif") return false;
      const debut = new Date(b.date_debut);
      const ageJours = Math.max(
        0,
        Math.floor((today.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24))
      );
      return ageJours >= 45;
    })
    .sort((a, b) => a.nom_lot.localeCompare(b.nom_lot));

  useEffect(() => {
    if (form.motif === "vente") {
      setForm((prev) => ({
        ...prev,
        montant_total: prev.quantite * prev.prix_unitaire,
      }));
    } else {
      setForm((prev) => ({ ...prev, montant_total: 0, prix_unitaire: 0 }));
    }
  }, [form.quantite, form.prix_unitaire, form.motif]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof SortieFormData, string>> = {};
    if (!form.bande_id) errs.bande_id = "Sélectionnez une bande.";
    if (!form.date) errs.date = "La date est requise.";
    if (form.quantite <= 0) errs.quantite = "La quantité doit être > 0.";
    if (form.motif === "vente" && form.prix_unitaire <= 0)
      errs.prix_unitaire = "Le prix unitaire doit être > 0.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await addSortie(form);
    setLoading(false);
    onSuccess();
  }

  const isVente = form.motif === "vente";
  const protocole = useMemo(
    () => (form.cause_deces ? PROTOCOLES[form.cause_deces] ?? null : null),
    [form.cause_deces]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Bande *"
          name="bande_id"
          value={form.bande_id}
          onChange={handleChange}
          error={errors.bande_id}
          disabled={!!bandeId}
        >
          <option value="">— Sélectionner —</option>
          {eligibleBandes.map((b) => (
            <option key={b.id} value={b.id}>{b.nom_lot}</option>
          ))}
        </Select>

        <Input
          label="Date *"
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          error={errors.date}
        />

        {onlyVente ? (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Motif</label>
            <div className="px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-600 font-medium">
              💰 Vente
            </div>
          </div>
        ) : (
          <Select
            label="Motif *"
            name="motif"
            value={form.motif}
            onChange={handleChange}
          >
            {(["vente", "décès"] as MotifSortie[]).map((m) => (
              <option key={m} value={m}>{m === "vente" ? "💰 Vente" : "💀 Décès"}</option>
            ))}
          </Select>
        )}

        <Input
          label="Quantité *"
          name="quantite"
          type="number"
          min={1}
          value={form.quantite || ""}
          onChange={handleChange}
          placeholder="Nombre de sujets"
          error={errors.quantite}
        />

        {!isVente && (
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Cause du décès</label>
            <select
              name="cause_deces"
              value={form.cause_deces ?? ""}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="">— Sélectionner la cause —</option>
              <optgroup label="🌡️ Causes climatiques">
                <option value="Stress thermique (chaleur excessive)">Stress thermique (chaleur excessive)</option>
                <option value="Coup de froid / hypothermie">Coup de froid / hypothermie</option>
                <option value="Variation brusque de température">Variation brusque de température</option>
              </optgroup>
              <optgroup label="🦠 Maladies infectieuses">
                <option value="Maladie de Newcastle">Maladie de Newcastle</option>
                <option value="Maladie de Gumboro (IBD)">Maladie de Gumboro (IBD)</option>
                <option value="Bronchite infectieuse">Bronchite infectieuse</option>
                <option value="Coccidiose aviaire">Coccidiose aviaire</option>
                <option value="Colibacillose (E. coli)">Colibacillose (E. coli)</option>
                <option value="Mycoplasmose respiratoire">Mycoplasmose respiratoire</option>
                <option value="Maladie de Marek">Maladie de Marek</option>
                <option value="Salmonellose">Salmonellose</option>
                <option value="Typhose aviaire (Pasteurellose)">Typhose aviaire (Pasteurellose)</option>
              </optgroup>
              <optgroup label="💨 Asphyxie & accidents">
                <option value="Étouffement / entassement">Étouffement / entassement</option>
                <option value="Intoxication (ammoniac / fumée)">Intoxication (ammoniac / fumée)</option>
                <option value="Noyade dans les abreuvoirs">Noyade dans les abreuvoirs</option>
                <option value="Traumatisme / blessure">Traumatisme / blessure</option>
                <option value="Cannibalisme / picage">Cannibalisme / picage</option>
              </optgroup>
              <optgroup label="🍽️ Nutrition & gestion">
                <option value="Déshydratation / manque d'eau">Déshydratation / manque d'eau</option>
                <option value="Sous-alimentation / malnutrition">Sous-alimentation / malnutrition</option>
                <option value="Intoxication alimentaire (aliment avarié)">Intoxication alimentaire (aliment avarié)</option>
              </optgroup>
              <optgroup label="🐣 Mortalité démarrage">
                <option value="Mortalité de démarrage (J1–J5)">Mortalité de démarrage (J1–J5)</option>
                <option value="Poussin de mauvaise qualité (cheptel)">Poussin de mauvaise qualité (cheptel)</option>
              </optgroup>
              <optgroup label="❓ Indéterminé">
                <option value="Cause indéterminée">Cause indéterminée</option>
                <option value="Autre">Autre (préciser dans les notes)</option>
              </optgroup>
            </select>
          </div>
        )}

        {isVente && (
          <>
            <Input
              label="Prix unitaire (FCFA) *"
              name="prix_unitaire"
              type="number"
              min={0}
              value={form.prix_unitaire || ""}
              onChange={handleChange}
              placeholder="Ex: 3500"
              error={errors.prix_unitaire}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Calculator size={13} className="text-forest-500" />
                Montant total (calculé)
              </label>
              <div className="px-3 py-2 rounded-lg border border-forest-300 bg-forest-50 text-sm font-bold text-forest-800">
                {formatMontant(form.montant_total)}
              </div>
              <p className="text-xs text-gray-500">
                {form.quantite} × {formatMontant(form.prix_unitaire)}
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Recommandations médicales dynamiques ── */}
      {!isVente && protocole && (
        <div className={`rounded-xl border ${URGENCE_CONFIG[protocole.urgence].border} ${URGENCE_CONFIG[protocole.urgence].bg} overflow-hidden`}>
          {/* Header */}
          <div className={`${URGENCE_CONFIG[protocole.urgence].header} px-4 py-2.5 flex items-center gap-2`}>
            <div className="relative flex-shrink-0">
              <div className={`w-2 h-2 rounded-full ${URGENCE_CONFIG[protocole.urgence].dot}`} />
            </div>
            <Stethoscope size={14} className="text-white" />
            <span className="text-white text-xs font-black uppercase tracking-wider">
              {URGENCE_CONFIG[protocole.urgence].label} — Protocole vétérinaire
            </span>
            <span className="ml-auto text-white/80 text-[10px] font-semibold">{protocole.duree}</span>
          </div>

          <div className="p-4 space-y-4">
            {/* Traitements */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Zap size={13} className={URGENCE_CONFIG[protocole.urgence].text} />
                <p className={`text-[11px] font-black uppercase tracking-wider ${URGENCE_CONFIG[protocole.urgence].text}`}>
                  Traitements & actions immédiates
                </p>
              </div>
              <ul className="space-y-1.5">
                {protocole.traitement.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-gray-700 font-semibold leading-relaxed">
                    <span className={`flex-shrink-0 w-4 h-4 rounded-full ${URGENCE_CONFIG[protocole.urgence].header} text-white text-[8px] font-black flex items-center justify-center mt-0.5`}>
                      {i + 1}
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Suivi */}
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center gap-1.5 mb-2">
                <ClipboardList size={13} className="text-blue-600" />
                <p className="text-[11px] font-black uppercase tracking-wider text-blue-700">
                  Suivi & surveillance à effectuer
                </p>
              </div>
              <ul className="space-y-1.5">
                {protocole.suivi.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-gray-700 font-semibold leading-relaxed">
                    <span className="flex-shrink-0 text-blue-500 mt-0.5">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Prévention */}
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center gap-1.5 mb-2">
                <ShieldCheck size={13} className="text-emerald-600" />
                <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
                  Prévention pour les prochaines bandes
                </p>
              </div>
              <ul className="space-y-1.5">
                {protocole.prevention.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-gray-600 font-semibold leading-relaxed">
                    <span className="flex-shrink-0 text-emerald-500 mt-0.5">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {protocole.urgence === "critique" && (
              <div className="flex items-center gap-2 bg-red-100 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle size={13} className="text-red-600 flex-shrink-0" />
                <p className="text-[10px] font-black text-red-700">
                  Situation critique — Consultez un vétérinaire aviaire IMMÉDIATEMENT et signalez aux autorités sanitaires si nécessaire.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          <X size={15} />
          Annuler
        </Button>
        <Button type="submit" loading={loading} variant={isVente ? "primary" : "danger"}>
          <Save size={15} />
          Enregistrer {isVente ? "la vente" : "le décès"}
        </Button>
      </div>
    </form>
  );
}

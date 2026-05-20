import { pgTable, text, integer, real, timestamp } from "drizzle-orm/pg-core";

export const bandes = pgTable("bandes", {
  id: text("id").primaryKey(),
  nom_lot: text("nom_lot").notNull(),
  date_debut: text("date_debut").notNull(),
  objectif: text("objectif").notNull(),
  nbr_poussins: integer("nbr_poussins").notNull(),
  prix_achat_global: real("prix_achat_global").notNull(),
  race: text("race").notNull(),
  fournisseur: text("fournisseur").notNull(),
  contact_fournisseur: text("contact_fournisseur").default(""),
  statut: text("statut").notNull().default("actif"),
  created_at: timestamp("created_at").defaultNow(),
});

export const consommations = pgTable("consommations", {
  id: text("id").primaryKey(),
  bande_id: text("bande_id").notNull().references(() => bandes.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  type_aliment: text("type_aliment").notNull(),
  conditionnement: text("conditionnement").notNull(),
  quantite_kg: real("quantite_kg").notNull(),
  montant: real("montant").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const sante = pgTable("sante", {
  id: text("id").primaryKey(),
  bande_id: text("bande_id").notNull().references(() => bandes.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  type_op: text("type_op").notNull(),
  medicament: text("medicament").notNull(),
  maladie_cible: text("maladie_cible").default(""),
  montant: real("montant").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const sorties = pgTable("sorties", {
  id: text("id").primaryKey(),
  bande_id: text("bande_id").notNull().references(() => bandes.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  motif: text("motif").notNull(),
  cause_deces: text("cause_deces").default(""),
  quantite: integer("quantite").notNull(),
  prix_unitaire: real("prix_unitaire").notNull().default(0),
  montant_total: real("montant_total").notNull().default(0),
  created_at: timestamp("created_at").defaultNow(),
});

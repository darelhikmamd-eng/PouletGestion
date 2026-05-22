import { pgTable, text, integer, real, timestamp } from "drizzle-orm/pg-core";

// ─── Users (une ligne = une ferme) ─────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  nom_ferme: text("nom_ferme").notNull(),
  localite: text("localite").default(""),
  ville: text("ville").default(""),
  pays: text("pays").default(""),
  contact: text("contact").default(""),
  activite_principale: text("activite_principale").default(""),
  objectif_utilisateur: text("objectif_utilisateur").default(""),
  created_at: timestamp("created_at").defaultNow(),
});

// ─── Bandes ─────────────────────────────────────────────────────────────────
export const bandes = pgTable("bandes", {
  id: text("id").primaryKey(),
  farm_id: text("farm_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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

// ─── Consommations ───────────────────────────────────────────────────────────
export const consommations = pgTable("consommations", {
  id: text("id").primaryKey(),
  farm_id: text("farm_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bande_id: text("bande_id").notNull().references(() => bandes.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  type_aliment: text("type_aliment").notNull(),
  conditionnement: text("conditionnement").notNull(),
  quantite_kg: real("quantite_kg").notNull(),
  montant: real("montant").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// ─── Sante ───────────────────────────────────────────────────────────────────
export const sante = pgTable("sante", {
  id: text("id").primaryKey(),
  farm_id: text("farm_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bande_id: text("bande_id").notNull().references(() => bandes.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  type_op: text("type_op").notNull(),
  medicament: text("medicament").notNull(),
  maladie_cible: text("maladie_cible").default(""),
  montant: real("montant").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// ─── Sorties ─────────────────────────────────────────────────────────────────
export const sorties = pgTable("sorties", {
  id: text("id").primaryKey(),
  farm_id: text("farm_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bande_id: text("bande_id").notNull().references(() => bandes.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  motif: text("motif").notNull(),
  cause_deces: text("cause_deces").default(""),
  quantite: integer("quantite").notNull(),
  prix_unitaire: real("prix_unitaire").notNull().default(0),
  montant_total: real("montant_total").notNull().default(0),
  created_at: timestamp("created_at").defaultNow(),
});

-- ============================================================
-- Migration Multi-Tenant : PouletGestion
-- À exécuter dans la console SQL de Neon (neon.tech)
-- ATTENTION : Efface les données existantes (option B)
-- ============================================================

-- 1. Supprimer les tables existantes (dans l'ordre des dépendances)
DROP TABLE IF EXISTS sorties CASCADE;
DROP TABLE IF EXISTS sante CASCADE;
DROP TABLE IF EXISTS consommations CASCADE;
DROP TABLE IF EXISTS bandes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Créer la table users (une ligne = une ferme)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nom_ferme TEXT NOT NULL,
  localite TEXT DEFAULT '',
  ville TEXT DEFAULT '',
  pays TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  activite_principale TEXT DEFAULT '',
  objectif_utilisateur TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Créer la table bandes avec farm_id
CREATE TABLE bandes (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nom_lot TEXT NOT NULL,
  date_debut TEXT NOT NULL,
  objectif TEXT NOT NULL,
  nbr_poussins INTEGER NOT NULL,
  prix_achat_global REAL NOT NULL,
  race TEXT NOT NULL,
  fournisseur TEXT NOT NULL,
  contact_fournisseur TEXT DEFAULT '',
  statut TEXT NOT NULL DEFAULT 'actif',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Créer la table consommations avec farm_id
CREATE TABLE consommations (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bande_id TEXT NOT NULL REFERENCES bandes(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  type_aliment TEXT NOT NULL,
  conditionnement TEXT NOT NULL,
  quantite_kg REAL NOT NULL,
  montant REAL NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Créer la table sante avec farm_id
CREATE TABLE sante (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bande_id TEXT NOT NULL REFERENCES bandes(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  type_op TEXT NOT NULL,
  medicament TEXT NOT NULL,
  maladie_cible TEXT DEFAULT '',
  montant REAL NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Créer la table sorties avec farm_id
CREATE TABLE sorties (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bande_id TEXT NOT NULL REFERENCES bandes(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  motif TEXT NOT NULL,
  cause_deces TEXT DEFAULT '',
  quantite INTEGER NOT NULL,
  prix_unitaire REAL NOT NULL DEFAULT 0,
  montant_total REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Index pour les performances
CREATE INDEX idx_bandes_farm_id ON bandes(farm_id);
CREATE INDEX idx_consommations_farm_id ON consommations(farm_id);
CREATE INDEX idx_sante_farm_id ON sante(farm_id);
CREATE INDEX idx_sorties_farm_id ON sorties(farm_id);
CREATE INDEX idx_users_email ON users(email);

-- Fin de migration
-- Vous pouvez maintenant vous inscrire depuis l'interface de l'application.

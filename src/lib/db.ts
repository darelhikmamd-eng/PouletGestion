import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzle(neon(url), { schema });
}

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

/**
 * Auto-migration : crée toutes les tables si elles n'existent pas encore.
 * Appelée automatiquement au premier appel des routes auth (register / login).
 * Idempotente — peut être exécutée plusieurs fois sans risque.
 */
export async function ensureTablesExist(): Promise<void> {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
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
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS bandes (
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
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS consommations (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bande_id TEXT NOT NULL REFERENCES bandes(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      type_aliment TEXT NOT NULL,
      conditionnement TEXT NOT NULL,
      quantite_kg REAL NOT NULL,
      montant REAL NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sante (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bande_id TEXT NOT NULL REFERENCES bandes(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      type_op TEXT NOT NULL,
      medicament TEXT NOT NULL,
      maladie_cible TEXT DEFAULT '',
      montant REAL NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sorties (
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
    )
  `;

  // Indexes for performance (ignore if already exist)
  try { await sql`CREATE INDEX IF NOT EXISTS idx_bandes_farm_id ON bandes(farm_id)`; } catch { /* ignore */ }
  try { await sql`CREATE INDEX IF NOT EXISTS idx_consommations_farm_id ON consommations(farm_id)`; } catch { /* ignore */ }
  try { await sql`CREATE INDEX IF NOT EXISTS idx_sante_farm_id ON sante(farm_id)`; } catch { /* ignore */ }
  try { await sql`CREATE INDEX IF NOT EXISTS idx_sorties_farm_id ON sorties(farm_id)`; } catch { /* ignore */ }
}

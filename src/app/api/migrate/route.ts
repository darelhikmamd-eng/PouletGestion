import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const MIGRATION_TOKEN = process.env.MIGRATION_TOKEN ?? "poulet-migrate-2024";

export async function POST(req: NextRequest) {
  // Protect this route with a secret token
  const { token } = await req.json().catch(() => ({ token: "" }));
  if (token !== MIGRATION_TOKEN) {
    return NextResponse.json({ error: "Token invalide" }, { status: 403 });
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json({ error: "DATABASE_URL non définie" }, { status: 500 });
  }

  const sql = neon(url);

  try {
    // Drop old tables and recreate with multi-tenant schema
    await sql`DROP TABLE IF EXISTS sorties CASCADE`;
    await sql`DROP TABLE IF EXISTS sante CASCADE`;
    await sql`DROP TABLE IF EXISTS consommations CASCADE`;
    await sql`DROP TABLE IF EXISTS bandes CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;

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

    // Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_bandes_farm_id ON bandes(farm_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_consommations_farm_id ON consommations(farm_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sante_farm_id ON sante(farm_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sorties_farm_id ON sorties(farm_id)`;

    return NextResponse.json({
      success: true,
      message: "Migration exécutée avec succès. Toutes les tables ont été recréées avec isolation multi-ferme.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Migration error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

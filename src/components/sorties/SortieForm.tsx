"use client";

import { useState, useEffect } from "react";
import { Save, X, Calculator } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useBandesStore } from "@/store/useBandesStore";
import { formatMontant } from "@/lib/kpi";
import type { SortieFormData, MotifSortie } from "@/types";

interface SortieFormProps {
  bandeId?: string;
  onSuccess: () => void;
  onCancel: () => void;
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

export function SortieForm({ bandeId = "", onSuccess, onCancel }: SortieFormProps) {
  const { bandes, addSortie } = useBandesStore();
  const [form, setForm] = useState<SortieFormData>(defaultForm(bandeId));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SortieFormData, string>>>({});

  const bandesSorted = [...bandes].sort((a, b) =>
    a.statut === "actif" && b.statut !== "actif" ? -1 : a.statut !== "actif" && b.statut === "actif" ? 1 : 0
  );

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
          {bandesSorted.map((b) => (
            <option key={b.id} value={b.id}>{b.nom_lot}{b.statut === "cloture" ? " (clôturée)" : ""}</option>
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
          <Input
            label="Cause du décès"
            name="cause_deces"
            value={form.cause_deces ?? ""}
            onChange={handleChange}
            placeholder="Ex: Chaleur, Étouffement, Maladie..."
            className="sm:col-span-2"
          />
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

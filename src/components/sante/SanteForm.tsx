"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useBandesStore } from "@/store/useBandesStore";
import { MALADIES_CIBLES } from "@/types";
import type { SanteFormData, TypeOperation } from "@/types";

interface SanteFormProps {
  bandeId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const defaultForm = (bandeId: string): SanteFormData => ({
  bande_id: bandeId,
  date: new Date().toISOString().split("T")[0],
  type_op: "Vaccination",
  medicament: "",
  maladie_cible: "Newcastle",
  montant: 0,
});

export function SanteForm({ bandeId = "", onSuccess, onCancel }: SanteFormProps) {
  const { bandes, addSanteOp } = useBandesStore();
  const [form, setForm] = useState<SanteFormData>(defaultForm(bandeId));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SanteFormData, string>>>({});

  const bandesSorted = [...bandes].sort((a, b) =>
    a.statut === "actif" && b.statut !== "actif" ? -1 : a.statut !== "actif" && b.statut === "actif" ? 1 : 0
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof SanteFormData, string>> = {};
    if (!form.bande_id) errs.bande_id = "Sélectionnez une bande.";
    if (!form.date) errs.date = "La date est requise.";
    if (!form.medicament.trim()) errs.medicament = "Le nom du médicament/produit est requis.";
    if (form.montant < 0) errs.montant = "Le montant ne peut pas être négatif.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await addSanteOp(form);
    setLoading(false);
    onSuccess();
  }

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
          label="Type d'opération *"
          name="type_op"
          value={form.type_op}
          onChange={handleChange}
        >
          {(["Vaccination", "Traitement Curatif", "Vitamines"] as TypeOperation[]).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>

        <Select
          label="Maladie / Cible"
          name="maladie_cible"
          value={form.maladie_cible}
          onChange={handleChange}
        >
          {MALADIES_CIBLES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </Select>

        <Input
          label="Médicament / Produit *"
          name="medicament"
          value={form.medicament}
          onChange={handleChange}
          placeholder="Ex: Hitchner B1, Amprolium..."
          error={errors.medicament}
        />

        <Input
          label="Montant (FCFA)"
          name="montant"
          type="number"
          min={0}
          value={form.montant || ""}
          onChange={handleChange}
          placeholder="Ex: 8500"
          hint="Coût total du traitement"
          error={errors.montant}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          <X size={15} />
          Annuler
        </Button>
        <Button type="submit" loading={loading}>
          <Save size={15} />
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

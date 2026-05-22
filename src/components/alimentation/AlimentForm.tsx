"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useBandesStore } from "@/store/useBandesStore";
import type { ConsommationFormData, TypeAliment, TypeConditionnement } from "@/types";

interface AlimentFormProps {
  bandeId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const defaultForm = (bandeId: string): ConsommationFormData => ({
  bande_id: bandeId,
  date: new Date().toISOString().split("T")[0],
  type_aliment: "Démarrage",
  conditionnement: "Sac (50 kg)",
  quantite_kg: 0,
  montant: 0,
});

export function AlimentForm({ bandeId = "", onSuccess, onCancel }: AlimentFormProps) {
  const { bandes, addConsommation } = useBandesStore();
  const [form, setForm] = useState<ConsommationFormData>(defaultForm(bandeId));
  const [nbSacs, setNbSacs] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ConsommationFormData, string>>>({});

  const bandesSorted = [...bandes].sort((a, b) =>
    a.statut === "actif" && b.statut !== "actif" ? -1 : a.statut !== "actif" && b.statut === "actif" ? 1 : 0
  );

  const isSac = form.conditionnement === "Sac (50 kg)";

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    if (name === "conditionnement") {
      setNbSacs(0);
      setForm((prev) => ({ ...prev, conditionnement: value as typeof prev.conditionnement, quantite_kg: 0 }));
      setErrors((prev) => ({ ...prev, conditionnement: undefined, quantite_kg: undefined }));
      return;
    }
    if (name === "nb_sacs") {
      const n = Number(value);
      setNbSacs(n);
      setForm((prev) => ({ ...prev, quantite_kg: n * 50 }));
      setErrors((prev) => ({ ...prev, quantite_kg: undefined }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof ConsommationFormData, string>> = {};
    if (!form.bande_id) errs.bande_id = "Sélectionnez une bande.";
    if (!form.date) errs.date = "La date est requise.";
    if (form.quantite_kg <= 0) errs.quantite_kg = "La quantité doit être > 0.";
    if (form.montant < 0) errs.montant = "Le montant ne peut pas être négatif.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await addConsommation(form);
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
            <option key={b.id} value={b.id}>
              {b.nom_lot}{b.statut === "cloture" ? " (clôturée)" : ""}
            </option>
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
          label="Type d'aliment *"
          name="type_aliment"
          value={form.type_aliment}
          onChange={handleChange}
        >
          {(["Démarrage", "Croissance", "Finition"] as TypeAliment[]).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>

        <Select
          label="Conditionnement *"
          name="conditionnement"
          value={form.conditionnement}
          onChange={handleChange}
        >
          {(["Sac (50 kg)", "Détail (kg)"] as TypeConditionnement[]).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>

        {isSac ? (
          <Input
            label="Nombre de sacs *"
            name="nb_sacs"
            type="number"
            min={1}
            step={1}
            value={nbSacs || ""}
            onChange={handleChange}
            placeholder="Ex: 2"
            hint={nbSacs > 0 ? `= ${nbSacs * 50} kg au total` : "1 sac = 50 kg"}
            error={errors.quantite_kg}
          />
        ) : (
          <Input
            label="Quantité (kg) *"
            name="quantite_kg"
            type="number"
            min={0}
            step={0.5}
            value={form.quantite_kg || ""}
            onChange={handleChange}
            placeholder="Ex: 25"
            hint="Saisir directement en kg"
            error={errors.quantite_kg}
          />
        )}

        <Input
          label="Montant (FCFA) *"
          name="montant"
          type="number"
          min={0}
          value={form.montant || ""}
          onChange={handleChange}
          placeholder="Ex: 18000"
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

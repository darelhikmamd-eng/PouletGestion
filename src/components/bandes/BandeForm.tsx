"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, X } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useBandesStore } from "@/store/useBandesStore";
import type { BandeFormData } from "@/types";

const defaultForm: BandeFormData = {
  nom_lot: "",
  date_debut: new Date().toISOString().split("T")[0],
  objectif: "engraissement",
  nbr_poussins: 0,
  prix_achat_global: 0,
  race: "",
  fournisseur: "",
  contact_fournisseur: "",
  statut: "actif",
};

interface BandeFormErrors {
  nom_lot?: string;
  date_debut?: string;
  nbr_poussins?: string;
  prix_achat_global?: string;
  race?: string;
  fournisseur?: string;
}

function validateForm(data: BandeFormData): BandeFormErrors {
  const errors: BandeFormErrors = {};
  if (!data.nom_lot.trim()) errors.nom_lot = "Le nom du lot est requis.";
  if (!data.date_debut) errors.date_debut = "La date de démarrage est requise.";
  if (data.nbr_poussins <= 0) errors.nbr_poussins = "Le nombre de poussins doit être > 0.";
  if (data.prix_achat_global < 0) errors.prix_achat_global = "Le montant ne peut pas être négatif.";
  if (!data.race.trim()) errors.race = "La race est requise.";
  if (!data.fournisseur.trim()) errors.fournisseur = "Le fournisseur est requis.";
  return errors;
}

export function BandeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rotationFrom = searchParams.get("rotation_from");
  const addBande = useBandesStore((s) => s.addBande);

  const [form, setForm] = useState<BandeFormData>(defaultForm);

  useEffect(() => {
    if (rotationFrom) {
      const decoded = decodeURIComponent(rotationFrom);
      setForm((prev) => ({
        ...prev,
        nom_lot: `Rotation après ${decoded}`,
        race: "Cobb 500",
      }));
    }
  }, [rotationFrom]);
  const [errors, setErrors] = useState<BandeFormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
    if (errors[name as keyof BandeFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      const newBande = await addBande(form);
      router.push(`/bandes/${newBande.id}`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Erreur inconnue");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {apiError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
          ⚠️ {apiError}
        </div>
      )}
      <section className="card p-4 lg:p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2">
          Informations générales
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nom du lot *"
            name="nom_lot"
            value={form.nom_lot}
            onChange={handleChange}
            placeholder="Ex: Lot Printemps 2025"
            error={errors.nom_lot}
          />
          <Input
            label="Date de démarrage *"
            name="date_debut"
            type="date"
            value={form.date_debut}
            onChange={handleChange}
            error={errors.date_debut}
          />
          <Select
            label="Objectif"
            name="objectif"
            value={form.objectif}
            onChange={handleChange}
          >
            <option value="engraissement">Engraissement</option>
            <option value="reproduction">Reproduction</option>
            <option value="ponte">Ponte</option>
          </Select>
          <Input
            label="Durée maximale du cycle"
            name="cycle_max"
            value="45 jours"
            disabled
            hint="Cette durée de cycle de 45 jours est configurée automatiquement."
          />
        </div>
      </section>

      <section className="card p-4 lg:p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2">
          Détails du cheptel
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombre de poussins *"
            name="nbr_poussins"
            type="number"
            min={1}
            value={form.nbr_poussins || ""}
            onChange={handleChange}
            placeholder="Ex: 500"
            error={errors.nbr_poussins}
          />
          <Input
            label="Prix d'achat global (FCFA) *"
            name="prix_achat_global"
            type="number"
            min={0}
            value={form.prix_achat_global || ""}
            onChange={handleChange}
            placeholder="Ex: 125000"
            hint="Montant total payé pour tous les poussins"
            error={errors.prix_achat_global}
          />
          <Input
            label="Race / Souche *"
            name="race"
            value={form.race}
            onChange={handleChange}
            placeholder="Ex: Cobb 500, Ross 308"
            error={errors.race}
          />
        </div>
      </section>

      <section className="card p-4 lg:p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2">
          Fournisseur
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nom du fournisseur *"
            name="fournisseur"
            value={form.fournisseur}
            onChange={handleChange}
            placeholder="Ex: Agri-Poussin SARL"
            error={errors.fournisseur}
          />
          <Input
            label="Contact fournisseur"
            name="contact_fournisseur"
            value={form.contact_fournisseur}
            onChange={handleChange}
            placeholder="Ex: +225 07 00 00 00"
          />
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 pb-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          <X size={16} />
          Annuler
        </Button>
        <Button type="submit" loading={loading}>
          <Save size={16} />
          Enregistrer la bande
        </Button>
      </div>
    </form>
  );
}

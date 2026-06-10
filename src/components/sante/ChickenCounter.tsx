"use client";

import { useRef, useState } from "react";
import { ImageUp, Camera, ScanEye, AlertTriangle, RotateCcw, Hash } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { processFileForUpload } from "@/lib/image";

interface Detection {
  cx: number; // centre X en %
  cy: number; // centre Y en %
  w: number; // largeur en %
  h: number; // hauteur en %
}

export function ChickenCounter() {
  const [image, setImage] = useState<string | null>(null);
  const [isCounting, setIsCounting] = useState(false);
  const [detections, setDetections] = useState<Detection[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const importInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImage = async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    setError(null);
    setDetections(null);
    setTotal(null);

    let dataUrl: string;
    try {
      const processed = await processFileForUpload(file, 1280, 0.8);
      dataUrl = processed.dataUrl;
    } catch {
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
        reader.readAsDataURL(file);
      });
    }

    setImage(dataUrl);
    setIsCounting(true);

    try {
      const res = await fetch("/api/comptage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Comptage impossible.");
      setDetections(data.detections ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comptage impossible. Réessayez.");
    } finally {
      setIsCounting(false);
    }
  };

  const reset = () => {
    setImage(null);
    setDetections(null);
    setTotal(null);
    setError(null);
  };

  return (
    <div className="border-t border-gray-100 pt-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-150/80">
        <div>
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <ScanEye size={15} className="text-brand-500" />
            Comptage Intelligent des Sujets (Vision IA)
          </h3>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">
            Comptez automatiquement vos poulets à partir d&apos;une photo du poulailler
          </p>
        </div>
        <Badge variant="warning" className="bg-brand-500 text-white border-none">BETA</Badge>
      </div>

      <input
        ref={importInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImage(f); e.target.value = ""; }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImage(f); e.target.value = ""; }}
      />

      {/* Zone d'action / résultat */}
      {!image && !isCounting && (
        <div className="border border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/40">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center shadow-inner mb-4">
            <ScanEye size={28} />
          </div>
          <p className="text-sm font-black text-gray-800 tracking-tight">Comptez vos poulets en une capture</p>
          <p className="text-xs text-gray-400 mt-1 font-semibold max-w-sm">
            Cadrez le lot avec votre smartphone ou importez une photo. L&apos;IA marque chaque sujet et calcule le total.
          </p>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:border-brand-400 hover:bg-brand-50 text-gray-700 text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              <ImageUp size={15} className="text-brand-500" />
              Importer
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <Camera size={15} />
              Prendre une photo
            </button>
          </div>
          <p className="text-[9px] text-gray-400 mt-2.5">PNG, JPG — caméra sur mobile</p>
        </div>
      )}

      {image && (
        <div className="space-y-4">
          {/* Image + overlay des pastilles */}
          <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 bg-black/5 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="Lot de poulets analysé" className="w-full h-auto block max-h-[60vh] object-contain mx-auto" />

            {/* Pastilles numérotées */}
            {!isCounting && detections?.map((d, i) => (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-brand-500 text-white text-[9px] font-black border border-white shadow-md animate-[fadeIn_0.3s_ease]"
                style={{
                  left: `${d.cx}%`,
                  top: `${d.cy}%`,
                  width: 18,
                  height: 18,
                  animationDelay: `${Math.min(i * 20, 800)}ms`,
                }}
              >
                {i + 1}
              </div>
            ))}

            {/* Overlay "Comptage en cours" */}
            {isCounting && (
              <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex flex-col items-center justify-center">
                <div className="relative w-16 h-16 mb-3">
                  <span className="absolute inset-0 rounded-full border-4 border-white/30" />
                  <span className="absolute inset-0 rounded-full border-4 border-t-brand-400 border-transparent animate-spin" />
                  <span className="absolute inset-0 flex items-center justify-center text-white">
                    <ScanEye size={24} />
                  </span>
                </div>
                <p className="text-sm font-black text-white uppercase tracking-widest animate-pulse">Counting in progress…</p>
                <p className="text-[10px] text-white/70 font-semibold mt-1">Détection et marquage des sujets</p>
              </div>
            )}

            {/* Badge total */}
            {!isCounting && total !== null && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 text-gray-900 px-3 py-1.5 rounded-xl shadow-lg border border-gray-100">
                <Hash size={14} className="text-brand-500" />
                <span className="text-lg font-black leading-none">{total}</span>
                <span className="text-[9px] font-bold uppercase text-gray-400 leading-none">poulets<br />détectés</span>
              </div>
            )}
          </div>

          {/* Résultat / actions */}
          {error && !isCounting && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl">
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-red-500" />
              <p className="text-xs font-semibold leading-snug">{error}</p>
            </div>
          )}

          {!isCounting && total !== null && !error && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2.5 rounded-xl">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-amber-500" />
              <p className="text-[11px] font-semibold leading-snug">
                Comptage assisté par IA, à titre indicatif. La précision baisse sur les lots très denses ou flous : rapprochez-vous et prenez plusieurs photos pour fiabiliser l&apos;estimation.
              </p>
            </div>
          )}

          {!isCounting && (
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw size={14} /> Nouvelle photo
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:border-brand-400 hover:bg-brand-50 text-gray-700 text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <ImageUp size={14} className="text-brand-500" /> Importer
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <Camera size={14} /> Photo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

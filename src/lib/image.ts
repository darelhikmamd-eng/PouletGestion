"use client";

export interface ProcessedFile {
  dataUrl: string;
  size: number; // taille approximative en octets du dataUrl encodé
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
    reader.readAsDataURL(file);
  });
}

function estimateBase64Bytes(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(",");
  const b64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  // 4 caractères base64 ≈ 3 octets
  return Math.floor((b64.length * 3) / 4);
}

/**
 * Compresse et redimensionne une image côté client avant stockage.
 * Les fichiers non-image (PDF) sont renvoyés tels quels (lus en dataURL).
 */
export async function processFileForUpload(
  file: File,
  maxDimension = 1600,
  quality = 0.72
): Promise<ProcessedFile> {
  // Fichiers non-image : pas de compression possible côté client
  if (!file.type.startsWith("image/")) {
    const dataUrl = await readAsDataUrl(file);
    return { dataUrl, size: estimateBase64Bytes(dataUrl) };
  }

  const originalDataUrl = await readAsDataUrl(file);

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image invalide"));
    image.src = originalDataUrl;
  });

  let { width, height } = img;
  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { dataUrl: originalDataUrl, size: estimateBase64Bytes(originalDataUrl) };
  }
  ctx.drawImage(img, 0, 0, width, height);

  const compressed = canvas.toDataURL("image/jpeg", quality);

  // Garde la version la plus légère
  const best =
    estimateBase64Bytes(compressed) < estimateBase64Bytes(originalDataUrl)
      ? compressed
      : originalDataUrl;

  return { dataUrl: best, size: estimateBase64Bytes(best) };
}

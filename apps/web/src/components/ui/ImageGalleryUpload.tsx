"use client";

import { useRef, useState } from "react";
import { Upload, X, Plus, GripVertical } from "lucide-react";
import { getPublicClient } from "@/lib/db";

interface Props {
  userId: string;
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageGalleryUpload({ userId, images, onChange, maxImages = 6 }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFiles(files: FileList | File[]) {
    const remaining = maxImages - images.length;
    const candidates = Array.from(files).slice(0, remaining);
    if (candidates.length === 0) return;

    // Client-side validation: MIME type + max size (5 MB per image)
    const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    const toUpload: File[] = [];
    for (const file of candidates) {
      if (!ALLOWED_TYPES.has(file.type)) {
        setError(`Formato no permitido: ${file.name}. Usa JPG, PNG, WebP o GIF.`);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`La imagen "${file.name}" supera los 5 MB permitidos.`);
        return;
      }
      toUpload.push(file);
    }

    setUploading(true);
    setError(null);

    const supabase = getPublicClient();
    const urls: string[] = [];

    for (const file of toUpload) {
      try {
        // Use the actual MIME extension, not the filename extension (prevents extension spoofing)
        const mimeToExt: Record<string, string> = {
          "image/jpeg": "jpg",
          "image/png":  "png",
          "image/webp": "webp",
          "image/gif":  "gif",
          "image/avif": "avif",
        };
        const ext  = mimeToExt[file.type] ?? "jpg";
        const path = `products/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("public-images")
          .upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("public-images").getPublicUrl(path);
        urls.push(data.publicUrl);
      } catch {
        setError("No se pudo subir una o más imágenes.");
      }
    }

    onChange([...images, ...urls]);
    setUploading(false);
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  }

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-3">
      {/* Grid de imágenes */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div key={url + i} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <img src={url} alt={`Imagen ${i + 1}`} className="w-full h-full object-cover" />
              {/* Overlay con botón eliminar */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
              {/* Badge de posición */}
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 text-[10px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded-md">
                  Principal
                </span>
              )}
            </div>
          ))}

          {/* Celda de añadir más */}
          {canAddMore && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Añadir</span>
            </button>
          )}
        </div>
      )}

      {/* Zona de drop — solo visible cuando no hay imágenes */}
      {images.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
            dragOver
              ? "border-indigo-400 bg-indigo-50"
              : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
          }`}
        >
          <Upload className={`w-7 h-7 ${dragOver ? "text-indigo-500" : "text-slate-300"}`} />
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600">Arrastra imágenes aquí</p>
            <p className="text-xs text-slate-400 mt-0.5">o haz clic para seleccionar · máx. {maxImages} fotos</p>
          </div>
        </div>
      )}

      {/* Botón secundario cuando ya hay imágenes y aún caben más */}
      {images.length > 0 && canAddMore && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full py-2.5 border border-dashed border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Subiendo..." : `Añadir más fotos (${images.length}/${maxImages})`}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />

      {error && (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}

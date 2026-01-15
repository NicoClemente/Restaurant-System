"use client";

import { useState, useTransition } from "react";

import { attachMenuItemImage } from "@/actions/menu";

type Props = {
  menuItemId: string;
};

type SignaturePayload = {
  timestamp: number;
  signature: string;
  folder: string;
  apiKey: string;
  cloudName: string;
  allowedFormats: string[];
  maxFileSize: number;
};

export const ImageUploader = ({ menuItemId }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const onFileChange = async (file?: File | null) => {
    if (!file) return;
    setMessage(null);

    startTransition(async () => {
      try {
        const signatureRes = await fetch("/api/uploads/cloudinary/sign");
        if (!signatureRes.ok) {
          throw new Error("Signature failed");
        }
        const signature = (await signatureRes.json()) as SignaturePayload;

        if (!signature.allowedFormats.includes(file.type.split("/")[1])) {
          setMessage("Formato no permitido.");
          return;
        }

        if (file.size > signature.maxFileSize) {
          setMessage("El archivo supera el tamaño permitido.");
          return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signature.apiKey);
        formData.append("timestamp", signature.timestamp.toString());
        formData.append("signature", signature.signature);
        formData.append("folder", signature.folder);
        formData.append("allowed_formats", signature.allowedFormats.join(","));
        formData.append("max_file_size", signature.maxFileSize.toString());

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
          { method: "POST", body: formData },
        );

        if (!uploadRes.ok) {
          throw new Error("Upload failed");
        }

        const upload = await uploadRes.json();

        await attachMenuItemImage({
          menuItemId,
          upload,
        });

        setMessage("Imagen subida.");
      } catch (error) {
        setMessage("No pudimos subir la imagen.");
      }
    });
  };

  return (
    <div className="flex items-center gap-3 text-xs text-slate-500">
      <label className="cursor-pointer rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
        {isPending ? "Subiendo..." : "Subir imagen"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => onFileChange(event.target.files?.[0])}
        />
      </label>
      {message ? <span>{message}</span> : null}
    </div>
  );
};

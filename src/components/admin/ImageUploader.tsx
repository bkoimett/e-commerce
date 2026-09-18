"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface ImageUploaderProps {
  onImagesChange: (urls: string[]) => void;
  initialImages?: string[];
  maxFiles?: number;
  maxSizeMB?: number;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function ImageUploader({
  onImagesChange,
  initialImages = [],
  maxFiles = 5,
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const validFiles = files.filter((file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError(`${file.name}: Invalid file type. Use JPEG, PNG, WebP, or GIF.`);
          return false;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(`${file.name}: File too large. Max ${maxSizeMB}MB.`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      if (images.length + validFiles.length > maxFiles) {
        setError(`Maximum ${maxFiles} images allowed.`);
        return;
      }

      setUploading(true);
      setError("");

      const newUrls: string[] = [];

      for (const file of validFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          setError(`Failed to upload ${file.name}: ${uploadError.message}`);
          setUploading(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      setImages((prev) => [...prev, ...newUrls]);
      onImagesChange([...images, ...newUrls]);
      setUploading(false);
    },
    [images, maxFiles, maxSizeMB, onImagesChange, supabase]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    uploadFiles(files);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files);
  };

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((u) => u !== url));
    onImagesChange(images.filter((u) => u !== url));
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        id="image-upload"
        disabled={uploading}
      />
      <label
        htmlFor="image-upload"
        className="cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            Drag & drop images here, or click to browse
          </p>
          <p className="text-xs text-gray-400 mt-1">
            JPEG, PNG, WebP, GIF · Max {maxSizeMB}MB · Up to {maxFiles} images
          </p>
        </div>
      </label>

      {error && (
        <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {images.map((url, idx) => (
            <div key={idx} className="relative aspect-square border rounded-lg overflow-hidden">
              <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" /> {/* eslint-disable-line @next/next/no-img-element */}
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute top-1 right-1 rounded-full bg-red-500 text-white p-1 hover:bg-red-600"
                aria-label="Remove image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="mt-3 text-center text-sm text-gray-600">Uploading...</div>
      )}
    </div>
  );
}
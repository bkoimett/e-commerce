"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const main = images[active];

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-black/10 bg-white text-sm text-muted-foreground">
        Image coming soon
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl border bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element -- product images live in Supabase Storage; optimized loader lands with the perf pass (#33) */}
        <img src={main} alt={alt} className="aspect-square w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="mt-2 flex gap-2">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-pressed={i === active}
              className={cn(
                "size-16 overflow-hidden rounded-lg border-2 bg-white focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none",
                i === active ? "border-brand-blue" : "border-transparent hover:border-brand-blue/50"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`${alt} — view ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
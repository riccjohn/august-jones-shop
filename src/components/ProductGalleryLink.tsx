"use client";

import Image from "next/image";
import { trackShopClick } from "@/lib/analytics";

interface ProductGalleryLinkProps {
  product: {
    id: number;
    title: string;
    src: string;
    alt: string;
    href: string;
    category: string;
  };
  index: number;
}

/**
 * Editorial-style product link — no card, just image + minimal type.
 * Hover: subtle image scale + title color shift to yellow accent.
 */
export function ProductGalleryLink({
  product,
  index,
}: ProductGalleryLinkProps) {
  const num = String(index + 1).padStart(2, "0");

  return (
    <a
      href={product.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackShopClick(`gallery_${product.category}`)}
      className="group flex flex-col gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb612] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f6f4f0]"
    >
      {/* Item number */}
      <span className="text-eyebrow text-[#222]/65">
        {num} / {product.category}
      </span>

      {/* Image */}
      <div className="relative aspect-3/4 overflow-hidden bg-[#e8e6e0]">
        <Image
          src={product.src}
          alt={product.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          style={{ transitionTimingFunction: "cubic-bezier(0.19, 1, 0.22, 1)" }}
        />
        {/* Subtle dark vignette on hover */}
        <div
          className="absolute inset-0 bg-[#0c0c10]/0 transition-colors duration-500 group-hover:bg-[#0c0c10]/20"
          aria-hidden="true"
        />
      </div>

      {/* Title + shop arrow */}
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-display text-2xl text-[#222] sm:text-3xl">
          {product.title}
        </h3>
        <span
          className="text-eyebrow shrink-0 text-[#222]/70 transition-colors duration-200 group-hover:text-[#222]"
          aria-hidden="true"
        >
          Shop ↗
        </span>
      </div>
    </a>
  );
}

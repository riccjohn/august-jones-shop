"use client";

import Image from "next/image";
import { trackShopifyClick } from "@/lib/analytics";

interface ProductGalleryLinkProps {
  product: {
    id: number;
    title: string;
    src: string;
    alt: string;
    href: string;
    category: string;
  };
}

/**
 * Tracked product gallery link component
 * Client component to handle click tracking with product metadata
 */
export function ProductGalleryLink({ product }: ProductGalleryLinkProps) {
  const handleClick = () => {
    // Track with source matching the UTM campaign parameter
    trackShopifyClick(`gallery_${product.category}`);
  };

  return (
    <a
      href={product.href}
      target="_blank"
      rel="noopener"
      onClick={handleClick}
      className="group flex flex-col gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm sm:gap-3"
    >
      <h3 className="font-bebas-neue text-lg tracking-wider text-foreground transition-colors group-hover:text-accent sm:text-xl">
        {product.title}
      </h3>
      <div className="relative aspect-3/4 overflow-hidden rounded-sm">
        <Image
          src={product.src}
          alt={product.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Hover scrim — solid overlay that fades in via opacity for reliable cross-browser animation */}
        <div
          className="absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />
        {/* CTA pill — positioned over scrim, slides up on hover */}
        <div className="absolute inset-0 flex items-end justify-center pb-8 sm:pb-10">
          {/* Charcoal bg + yellow text = 9.1:1 contrast ratio (exceeds WCAG AAA) */}
          <span className="font-bebas-neue bg-foreground/90 text-accent rounded-sm px-5 py-2 text-base tracking-wider opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 flex items-center gap-2 sm:text-lg sm:px-6 sm:py-2.5">
            Shop Now
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-external-link"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" x2="21" y1="14" y2="3" />
            </svg>
          </span>
        </div>
      </div>
    </a>
  );
}

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About the Business

**August Jones** is a solo, female-owned brand selling hand-made, one-of-a-kind, upcycled sports fashion — streetwear hoodies, sweatpants, jackets, and more created from upcycled pro sports jerseys and fan gear.

## Site Structure

This is the main marketing website (not a storefront). Pages:

- **Home (`/`)** — Landing page with brief brand description and CTA linking to the Shopify store
- **About (`/about`)** — Background on the brand and maker
- **Contact (`/contact`)** — Contact form

Product purchases happen on a separate Shopify site; this site drives traffic there.

## Design System

**Always use shadcn/ui components when building UI.** Components are copied into `src/components/ui` and fully customizable.

### Brand Design

- **Display font:** Bebas Neue Bold (headings, hero text)
- **Colors:**
  - Charcoal `#222` — primary dark / text
  - Eggshell `#f6f4f0` — background / light surfaces
  - Yellow `#ffb612` — accent / CTAs

### shadcn/ui Setup

- **Style:** New York
- **Base color:** Zinc
- **Icons:** Lucide React
- **Add components:** `pnpm dlx shadcn@latest add <component-name>`
- **Config:** `components.json` (uses path aliases from tsconfig)

## Commands

- `pnpm dev` — Start dev server (http://localhost:3000)
- `pnpm build` — Production build
- `pnpm lint` — Lint with Biome (`biome check`)
- `pnpm format` — Auto-format with Biome (`biome format --write`)
- `pnpm test:e2e` — Run Playwright e2e tests
- `pnpm test:e2e:ui` — Run Playwright tests in UI mode

## Tech Stack

- **Next.js 16** with App Router, React 19, TypeScript (strict mode)
- **React Compiler** enabled (`reactCompiler: true` in next.config.ts)
- **Tailwind CSS v4** via PostCSS (imported with `@import "tailwindcss"` in globals.css)
- **shadcn/ui** for component library (New York style, Lucide icons)
- **Playwright** for e2e testing (`e2e/` directory)
- **Biome 2** for linting and formatting (space indent, width 2, recommended rules + Next/React domains)
- **pnpm 10.29.1** as package manager (pinned via `packageManager` field)

## Code Conventions

- **Path aliases:**
  - `@/*` maps to `./src/*`
  - `@/components` for components
  - `@/lib/utils` for utilities (includes `cn()` for className merging)
- **Fonts:** Geist Sans and Geist Mono loaded via `next/font/google`, exposed as CSS variables `--font-geist-sans` and `--font-geist-mono`
- **Dark mode:** Uses `prefers-color-scheme` media query with CSS custom properties (`--background`, `--foreground`)
- **Biome:** `noUnknownAtRules` disabled (for Tailwind's `@theme` directive)
- **shadcn components:** Installed to `src/components/ui/`, customizable after copying

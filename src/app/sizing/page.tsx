import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { GrainOverlay } from "@/components/GrainOverlay";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Size Charts | August Jones",
  description:
    "Size charts for August Jones military jackets and vests, upcycled sports fashion. Measurements are approximate since every piece is made from repurposed garments.",
  alternates: {
    canonical: "/sizing",
  },
};

type JacketRow = {
  size: string;
  length: string;
  width: string;
  sleeve: string;
};

const JACKET_ROWS: JacketRow[] = [
  { size: "S", length: '17"–18"', width: '21"', sleeve: '22"' },
  { size: "M", length: '18"–19"', width: '21 1/2"', sleeve: '23"–24"' },
  { size: "L", length: '19"', width: '23"–24"', sleeve: '24"–25"' },
  { size: "XL", length: '20"–21"', width: '24"', sleeve: '25"–26"' },
];

type VestRow = {
  size: string;
  croppedWidth: string;
  croppedLength: string;
  fullWidth: string;
  fullLength: string;
};

const VEST_ROWS: VestRow[] = [
  {
    size: "XS",
    croppedWidth: '19 1/2"',
    croppedLength: '19 1/2"',
    fullWidth: '19 1/2"',
    fullLength: '19 1/2"',
  },
  {
    size: "S",
    croppedWidth: '20"',
    croppedLength: '20"',
    fullWidth: '20"',
    fullLength: '22"',
  },
  {
    size: "M",
    croppedWidth: '21 1/2"',
    croppedLength: '21"',
    fullWidth: '21 1/2"',
    fullLength: '23"',
  },
  {
    size: "L",
    croppedWidth: '23"',
    croppedLength: '22 1/2"',
    fullWidth: '23"',
    fullLength: '24"',
  },
  {
    size: "XL",
    croppedWidth: '24 1/2"',
    croppedLength: '23"',
    fullWidth: '24 1/2"',
    fullLength: '25"',
  },
];

export default function SizingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 pb-16 pt-16 sm:pb-20 sm:pt-24">
        <GrainOverlay />
        <div className="relative z-10 mx-auto max-w-6xl">
          <p className="text-eyebrow mb-6 text-accent/80">Find your fit</p>
          <h1
            className="text-hero text-foreground"
            style={{ fontSize: "clamp(4rem, 12vw, 11rem)" }}
          >
            Size Charts
          </h1>
          <p
            className="text-editorial mt-8 max-w-xl text-foreground/60"
            style={{ fontSize: "clamp(1.1rem, 2vw, 1.35rem)" }}
          >
            Because every piece is made from repurposed garments, all
            measurements are approximate.
          </p>
        </div>
      </section>

      {/* ── MILITARY JACKET CHART ────────────────────────────────────────── */}
      <section
        aria-labelledby="jacket-heading"
        className="relative overflow-hidden bg-background px-6 pb-16 sm:pb-24"
      >
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="h-px bg-border mb-12" aria-hidden="true" />
          <h2
            id="jacket-heading"
            className="text-display mb-8 text-foreground"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            Cropped Military Jacket
          </h2>
          <div className="overflow-x-auto">
            <table
              aria-label="Cropped Military Jacket size chart"
              className="w-full min-w-[480px] border-collapse text-left"
            >
              <thead>
                <tr className="border-b border-border">
                  <th
                    scope="col"
                    className="text-eyebrow py-3 pr-4 text-foreground/65"
                  >
                    Size
                  </th>
                  <th
                    scope="col"
                    className="text-eyebrow py-3 pr-4 text-foreground/65"
                  >
                    Length
                  </th>
                  <th
                    scope="col"
                    className="text-eyebrow py-3 pr-4 text-foreground/65"
                  >
                    Width
                  </th>
                  <th
                    scope="col"
                    className="text-eyebrow py-3 text-foreground/65"
                  >
                    Sleeve
                  </th>
                </tr>
              </thead>
              <tbody>
                {JACKET_ROWS.map((row) => (
                  <tr key={row.size} className="border-b border-border">
                    <th
                      scope="row"
                      className="py-4 pr-4 text-sm font-semibold text-foreground"
                    >
                      {row.size}
                    </th>
                    <td className="py-4 pr-4 text-sm text-foreground/75">
                      {row.length}
                    </td>
                    <td className="py-4 pr-4 text-sm text-foreground/75">
                      {row.width}
                    </td>
                    <td className="py-4 text-sm text-foreground/75">
                      {row.sleeve}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 max-w-xl text-sm/relaxed text-foreground/55">
            Since each piece is made from a repurposed jacket, sizes are
            approximate.
          </p>
          <p className="mt-4 max-w-xl text-sm/relaxed text-foreground/55">
            Looking for a Full Length Military Jacket? Sizing details are coming
            soon.{" "}
            <Link
              href="/contact"
              className="underline underline-offset-4 hover:text-accent transition-colors duration-200"
            >
              Reach out
            </Link>{" "}
            and I'll help you find your fit.
          </p>
        </div>
      </section>

      {/* ── VEST CHART ───────────────────────────────────────────────────── */}
      <section
        aria-labelledby="vest-heading"
        className="relative overflow-hidden bg-background px-6 pb-16 sm:pb-24"
      >
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="h-px bg-border mb-12" aria-hidden="true" />
          <h2
            id="vest-heading"
            className="text-display mb-8 text-foreground"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            Vest
          </h2>
          <div className="overflow-x-auto">
            <table
              aria-label="Vest size chart"
              className="w-full min-w-[560px] border-collapse text-left"
            >
              <thead>
                <tr className="border-b border-border">
                  <th
                    scope="col"
                    rowSpan={2}
                    className="text-eyebrow py-3 pr-4 align-bottom text-foreground/65"
                  >
                    Size
                  </th>
                  <th
                    scope="colgroup"
                    colSpan={2}
                    className="text-eyebrow py-3 pr-4 text-foreground/65"
                  >
                    Cropped Vest
                  </th>
                  <th
                    scope="colgroup"
                    colSpan={2}
                    className="text-eyebrow py-3 text-foreground/65"
                  >
                    Full Length Vest
                  </th>
                </tr>
                <tr className="border-b border-border">
                  <th
                    scope="col"
                    className="py-2 pr-4 text-xs text-foreground/55"
                  >
                    Width
                  </th>
                  <th
                    scope="col"
                    className="py-2 pr-4 text-xs text-foreground/55"
                  >
                    Length
                  </th>
                  <th
                    scope="col"
                    className="py-2 pr-4 text-xs text-foreground/55"
                  >
                    Width
                  </th>
                  <th scope="col" className="py-2 text-xs text-foreground/55">
                    Length
                  </th>
                </tr>
              </thead>
              <tbody>
                {VEST_ROWS.map((row) => (
                  <tr key={row.size} className="border-b border-border">
                    <th
                      scope="row"
                      className="py-4 pr-4 text-sm font-semibold text-foreground"
                    >
                      {row.size}
                    </th>
                    <td className="py-4 pr-4 text-sm text-foreground/75">
                      {row.croppedWidth}
                    </td>
                    <td className="py-4 pr-4 text-sm text-foreground/75">
                      {row.croppedLength}
                    </td>
                    <td className="py-4 pr-4 text-sm text-foreground/75">
                      {row.fullWidth}
                    </td>
                    <td className="py-4 text-sm text-foreground/75">
                      {row.fullLength}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 max-w-xl text-sm/relaxed text-foreground/55">
            Width is measured pit to pit. Length is measured shoulder to hem.
          </p>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="bg-accent px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr] lg:items-end">
            <div className="flex flex-col gap-6">
              <p className="text-eyebrow text-[#222]/65">Still unsure?</p>
              <h2
                className="text-display text-[#222]"
                style={{
                  fontSize: "clamp(3rem, 7vw, 6rem)",
                  textWrap: "balance",
                }}
              >
                Let's find your fit.
              </h2>
              <p className="max-w-xl text-base/relaxed text-[#222]/70 sm:text-lg">
                Send your measurements and I'll help you pick the right size for
                your custom piece.
              </p>
            </div>

            <div className="flex items-end">
              <Button
                asChild
                size="lg"
                variant="brand"
                className="h-14 gap-3 px-10 text-base font-medium uppercase tracking-widest"
              >
                <Link href="/contact">
                  <span>Get in Touch</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

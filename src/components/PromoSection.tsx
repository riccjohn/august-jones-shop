import type { ReactNode } from "react";
import { GrainOverlay } from "@/components/GrainOverlay";

interface PromoSectionProps {
  /**
   * The ID for the h2 heading — used for section's aria-labelledby and heading's id
   */
  headingId: string;
  /**
   * Eyebrow text (small label above heading)
   */
  eyebrow: ReactNode;
  /**
   * CSS classes for eyebrow text, including color (e.g., "text-foreground/65")
   */
  eyebrowClassName?: string;
  /**
   * Main heading content
   */
  heading: ReactNode;
  /**
   * clamp() value for heading font size (e.g., "clamp(2.5rem, 6vw, 5rem)")
   */
  headingClampSize: string;
  /**
   * Body/supporting text below heading
   */
  body: ReactNode;
  /**
   * CSS classes for body text, including size and color
   */
  bodyClassName?: string;
  /**
   * CSS classes for the layout wrapper (flex or grid), e.g., "flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between"
   */
  layoutClassName: string;
  /**
   * CSS classes for the text wrapper div containing eyebrow/heading/body
   */
  textWrapperClassName?: string;
  /**
   * CTA element(s) to display alongside the text
   */
  children: ReactNode;
}

export function PromoSection({
  headingId,
  eyebrow,
  eyebrowClassName = "text-foreground/65",
  heading,
  headingClampSize,
  body,
  bodyClassName,
  layoutClassName,
  textWrapperClassName = "flex flex-col gap-4",
  children,
}: PromoSectionProps) {
  return (
    <section
      aria-labelledby={headingId}
      className="relative overflow-hidden bg-background px-6 py-20 sm:py-28"
    >
      <GrainOverlay />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className={layoutClassName}>
          <div className={textWrapperClassName}>
            <p className={`text-eyebrow ${eyebrowClassName}`}>{eyebrow}</p>
            <h2
              id={headingId}
              className="text-display text-foreground"
              style={{
                fontSize: headingClampSize,
                textWrap: "balance",
              }}
            >
              {heading}
            </h2>
            <p className={bodyClassName}>{body}</p>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

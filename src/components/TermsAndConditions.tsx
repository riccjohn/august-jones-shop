export function TermsAndConditions() {
  return (
    <section
      id="terms"
      aria-labelledby="terms-heading"
      className="relative scroll-mt-24 overflow-hidden bg-background px-6 pb-16 sm:pb-24"
    >
      <div className="relative z-10 mx-auto max-w-2xl">
        <div className="h-px bg-border mb-12" aria-hidden="true" />
        <h2
          id="terms-heading"
          className="text-display mb-6 text-foreground"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          Custom Order Policy
        </h2>
        <p className="text-sm/relaxed text-foreground/70 sm:text-base">
          Thank you for your interest in a custom August Jones piece! I create
          one-of-a-kind, handcrafted garments engineered entirely from curated,
          reclaimed vintage and thrifted textiles. Because each piece is a
          collaborative, sustainable journey, please review the process and
          policies below.
        </p>
        <p className="mt-4 text-sm/relaxed text-foreground/70 sm:text-base">
          <span aria-hidden="true">⏱️ </span>
          <strong className="text-foreground">Current Turnaround Time:</strong>{" "}
          Custom garments typically take 4 to 8 weeks to design and construct
          once your deposit is received.
        </p>

        <h3 className="text-display mt-10 mb-4 text-xl text-foreground sm:text-2xl">
          The Custom Process
        </h3>
        <ol className="flex flex-col gap-4 text-sm/relaxed text-foreground/70 sm:text-base">
          <li>
            <strong className="text-foreground">
              Phase 1: Consultation & Concept
            </strong>{" "}
            — I map out your vision, team preferences, sizing, and style
            direction. You can provide your own pieces to be reinvented or I can
            source for you.
          </li>
          <li>
            <strong className="text-foreground">
              Phase 2: Secure Your Slot
            </strong>{" "}
            — Once you approve the scope and estimated cost, a 50%
            non-refundable deposit secures your place in my production schedule,
            locks in your 4–8 week window, and initiates material sourcing.
          </li>
          <li>
            <strong className="text-foreground">Phase 3: Construction</strong> —
            I meticulously cut and sew your garment in my studio. By
            commissioning a piece, you trust the August Jones aesthetic — I
            retain creative direction over final material placement and
            structural styling.
          </li>
          <li>
            <strong className="text-foreground">
              Phase 4: Approval & Delivery
            </strong>{" "}
            — I will send photos of the finished piece. Once you approve and
            settle the remaining 50% balance, your garment ships straight to
            your door.
          </li>
        </ol>

        <p className="mt-10 text-sm/relaxed text-foreground/70 sm:text-base">
          By submitting your deposit, you agree to the following terms:
        </p>
        <ul className="mt-4 flex list-disc flex-col gap-3 pl-5 text-sm/relaxed text-foreground/70 sm:text-base">
          <li>
            <strong className="text-foreground">Timeline:</strong> The standard
            production window is 4–8 weeks from the date the deposit is paid.
            Sourcing specific, rare vintage textiles can occasionally impact
            this timeline; I will communicate any major updates.
          </li>
          <li>
            <strong className="text-foreground">Deposits:</strong> The 50%
            deposit is non-refundable and non-transferable, as materials and
            studio time are immediately committed to your piece.
          </li>
          <li>
            <strong className="text-foreground">Revisions:</strong> Includes one
            (1) complimentary round of minor functional adjustments (e.g., hem
            shortening). Major structural changes or swapping for entirely new
            materials will incur extra labor and material fees and may extend
            the delivery timeline.
          </li>
          <li>
            <strong className="text-foreground">Final Balance:</strong> The
            remaining 50% must be paid within seven (7) business days of photo
            approval. Garments will not ship until paid. Items unpaid after 30
            days will be forfeited and added to public inventory.
          </li>
          <li>
            <strong className="text-foreground">All Sales Final:</strong> Due to
            the deeply personalized nature of upcycled clothing, all custom
            garments are 100% final sale. No returns, exchanges, or refunds.
          </li>
          <li>
            <strong className="text-foreground">
              Vintage Material Character:
            </strong>{" "}
            Authentic, pre-loved textiles may feature subtle fading, texture
            variations, or minor signs of historical wear. These are not flaws;
            they are the character of sustainable fashion.
          </li>
        </ul>

        <p className="mt-10 text-sm/relaxed text-foreground/70 sm:text-base">
          Thank you for supporting sustainable, hand-crafted design. I can't
          wait to build something incredible for you! 💛
        </p>
      </div>
    </section>
  );
}

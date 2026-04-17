"use client";

import type { AddToCalendarButtonType } from "add-to-calendar-button-react";
import { AddToCalendarButton as AtcbButton } from "add-to-calendar-button-react";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

const SHADOW_STYLES = `
  #atcb-reference { display: none !important; }
  .atcb-button {
    padding: 0.5rem 1.25rem !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    line-height: 1.5 !important;
    letter-spacing: 0.025em !important;
    min-width: 0 !important;
  }
  .atcb-list-item {
    transition: background-color 0.25s ease, color 0.25s ease !important;
  }
`;

function AtcbWithShadowStyles(props: AddToCalendarButtonType) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number;

    function tryInject() {
      const el = ref.current?.querySelector("add-to-calendar-button");
      if (!el?.shadowRoot) {
        raf = requestAnimationFrame(tryInject);
        return;
      }
      if (el.shadowRoot.querySelector("#aj-custom-styles")) return;
      const style = document.createElement("style");
      style.id = "aj-custom-styles";
      style.textContent = SHADOW_STYLES;
      el.shadowRoot.appendChild(style);
    }

    tryInject();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={ref} style={{ display: "contents" }}>
      <AtcbButton {...props} />
    </div>
  );
}

// ssr: false prevents hydration mismatches — this library adds attributes
// imperatively during init that React doesn't expect during hydration.
export const AddToCalendarButton = dynamic(
  () => Promise.resolve(AtcbWithShadowStyles),
  { ssr: false },
);

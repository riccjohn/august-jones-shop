import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TermsAndConditions } from "@/components/TermsAndConditions";

describe("TermsAndConditions", () => {
  it("renders a section with id 'terms' labelled by its heading", () => {
    render(<TermsAndConditions />);
    const heading = screen.getByRole("heading", {
      level: 2,
      name: /custom order policy/i,
    });
    expect(heading).toBeInTheDocument();

    const section = document.getElementById("terms");
    expect(section).toBeInTheDocument();
    expect(section?.tagName).toBe("SECTION");
    expect(section).toHaveAttribute("aria-labelledby", heading.id);
  });

  it("renders all four process phases and the policy list", () => {
    render(<TermsAndConditions />);
    expect(
      screen.getByText(/phase 1: consultation & concept/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/phase 4: approval & delivery/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/all sales final/i)).toBeInTheDocument();
  });
});

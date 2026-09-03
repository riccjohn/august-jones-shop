import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmailFallbackNote } from "@/components/EmailFallbackNote";
import * as analytics from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({
  trackShopClick: vi.fn(),
  trackInstagramClick: vi.fn(),
  trackNavClick: vi.fn(),
  trackEmailClick: vi.fn(),
}));

describe("EmailFallbackNote", () => {
  it("renders the lead-in copy passed as children", () => {
    render(<EmailFallbackNote>Sign-ups are paused.</EmailFallbackNote>);
    expect(screen.getByText(/sign-ups are paused/i)).toBeInTheDocument();
  });

  it("renders a link with the correct mailto href", () => {
    render(<EmailFallbackNote>Sign-ups are paused.</EmailFallbackNote>);
    const link = screen.getByRole("link", {
      name: /contact@augustjones\.shop/i,
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "mailto:contact@augustjones.shop");
  });

  it("calls trackEmailClick when the link is clicked", async () => {
    const user = userEvent.setup();
    render(<EmailFallbackNote>Sign-ups are paused.</EmailFallbackNote>);
    const link = screen.getByRole("link", {
      name: /contact@augustjones\.shop/i,
    });
    await user.click(link);
    expect(analytics.trackEmailClick).toHaveBeenCalled();
  });

  it("merges a call-site className onto the wrapping paragraph", () => {
    const { container } = render(
      <EmailFallbackNote className="mt-8 max-w-xl">
        Prefer email or have other questions?
      </EmailFallbackNote>,
    );
    const paragraph = container.querySelector("p");
    expect(paragraph).toHaveClass("mt-8");
    expect(paragraph).toHaveClass("max-w-xl");
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FooterShopLink } from "@/components/FooterShopLink";
import * as analytics from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({
  trackShopClick: vi.fn(),
  trackInstagramClick: vi.fn(),
  trackNavClick: vi.fn(),
  trackEmailClick: vi.fn(),
}));

describe("FooterShopLink", () => {
  it("renders an anchor pointing to the shop URL", () => {
    render(<FooterShopLink />);
    const link = screen.getByRole("link", { name: /shop now/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://store.augustjones.shop");
  });

  it("calls trackShopClick with source 'footer' when clicked", async () => {
    const user = userEvent.setup();
    render(<FooterShopLink />);
    const link = screen.getByRole("link", { name: /shop now/i });
    await user.click(link);
    expect(analytics.trackShopClick).toHaveBeenCalledWith("footer");
  });
});

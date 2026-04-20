import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ShopCtaButton } from "@/components/ShopCtaButton";
import * as analytics from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({
  trackShopClick: vi.fn(),
  trackInstagramClick: vi.fn(),
  trackNavClick: vi.fn(),
  trackEmailClick: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

describe("ShopCtaButton", () => {
  it("renders a link pointing to the shop URL with UTM parameters", () => {
    render(<ShopCtaButton />);
    const link = screen.getByRole("link", { name: /shop now/i });
    expect(link).toBeInTheDocument();
    const href = link.getAttribute("href") ?? "";
    expect(href).toContain("https://store.augustjones.shop");
    expect(href).toContain("utm_source=augustjones");
    expect(href).toContain("utm_medium=website");
    expect(href).toContain("utm_campaign=shop_cta");
  });

  it("calls trackShopClick with source 'hero' when clicked", async () => {
    const user = userEvent.setup();
    render(<ShopCtaButton />);
    const link = screen.getByRole("link", { name: /shop now/i });
    await user.click(link);
    expect(analytics.trackShopClick).toHaveBeenCalledWith("hero");
  });
});

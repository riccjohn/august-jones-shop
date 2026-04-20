import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InstagramLink } from "@/components/InstagramLink";
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

describe("InstagramLink", () => {
  it("renders an anchor pointing to the Instagram URL", () => {
    render(<InstagramLink location="hero">Follow us</InstagramLink>);
    const link = screen.getByRole("link", { name: /follow us/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://instagram.com/augustjonesshop",
    );
  });

  it("calls trackInstagramClick with 'hero' when location is hero", async () => {
    const user = userEvent.setup();
    render(<InstagramLink location="hero">Follow us</InstagramLink>);
    const link = screen.getByRole("link", { name: /follow us/i });
    await user.click(link);
    expect(analytics.trackInstagramClick).toHaveBeenCalledWith("hero");
  });

  it("calls trackInstagramClick with 'footer' when location is footer", async () => {
    const user = userEvent.setup();
    render(<InstagramLink location="footer">Follow us</InstagramLink>);
    const link = screen.getByRole("link", { name: /follow us/i });
    await user.click(link);
    expect(analytics.trackInstagramClick).toHaveBeenCalledWith("footer");
  });
});

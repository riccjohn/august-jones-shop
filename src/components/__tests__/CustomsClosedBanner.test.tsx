import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CustomsClosedBanner } from "@/components/CustomsClosedBanner";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("CustomsClosedBanner", () => {
  it("does not render when isClosed is false", () => {
    const { container } = render(<CustomsClosedBanner isClosed={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the banner when isClosed is true", () => {
    render(<CustomsClosedBanner isClosed={true} />);
    expect(
      screen.getByText(/custom commissions are temporarily closed/i),
    ).toBeInTheDocument();
  });

  it("includes a link to the email list join page", () => {
    render(<CustomsClosedBanner isClosed={true} />);
    const link = screen.getByRole("link", { name: /email list/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/join");
  });

  it("applies correct styling classes when closed", () => {
    const { container } = render(<CustomsClosedBanner isClosed={true} />);
    const bannerDiv = container.querySelector("div");
    expect(bannerDiv).toHaveClass("bg-foreground/90");
    expect(bannerDiv).toHaveClass("text-background");
  });
});

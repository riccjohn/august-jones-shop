import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("does not render when isClosed is false", async () => {
    const { CustomsClosedBanner } = await import(
      "@/components/CustomsClosedBanner"
    );
    const { container } = render(<CustomsClosedBanner isClosed={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("applies correct styling classes when closed", async () => {
    const { CustomsClosedBanner } = await import(
      "@/components/CustomsClosedBanner"
    );
    const { container } = render(<CustomsClosedBanner isClosed={true} />);
    const bannerDiv = container.querySelector("div");
    expect(bannerDiv).toHaveClass("bg-foreground/90");
    expect(bannerDiv).toHaveClass("text-background");
  });

  describe("when EMAIL_SIGNUP_ENABLED is false (default)", () => {
    it("renders simplified copy with no /join link", async () => {
      const { CustomsClosedBanner } = await import(
        "@/components/CustomsClosedBanner"
      );
      render(<CustomsClosedBanner isClosed={true} />);
      expect(
        screen.getByText("Custom commissions are temporarily closed."),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /email list/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("when EMAIL_SIGNUP_ENABLED is true", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_EMAIL_SIGNUP_ENABLED", "true");
    });

    it("renders the full copy with a link to the email list join page", async () => {
      const { CustomsClosedBanner } = await import(
        "@/components/CustomsClosedBanner"
      );
      render(<CustomsClosedBanner isClosed={true} />);
      expect(
        screen.getByText(/custom commissions are temporarily closed/i),
      ).toBeInTheDocument();
      const link = screen.getByRole("link", { name: /email list/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/join");
    });
  });
});

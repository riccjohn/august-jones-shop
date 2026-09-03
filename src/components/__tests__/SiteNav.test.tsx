import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...rest
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => <img src={src} alt={alt} {...rest} />,
}));

describe("SiteNav", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe("Desktop nav", () => {
    it("renders a nav with aria-label 'Main navigation'", async () => {
      const { SiteNav } = await import("@/components/SiteNav");
      render(<SiteNav />);
      expect(
        screen.getByRole("navigation", { name: "Main navigation" }),
      ).toBeInTheDocument();
    });

    it("contains a link to /about", async () => {
      const { SiteNav } = await import("@/components/SiteNav");
      render(<SiteNav />);
      const mainNav = screen.getByRole("navigation", {
        name: "Main navigation",
      });
      const links = mainNav.querySelectorAll("a[href='/about']");
      expect(links.length).toBeGreaterThan(0);
    });

    it("contains a link to /events", async () => {
      const { SiteNav } = await import("@/components/SiteNav");
      render(<SiteNav />);
      const mainNav = screen.getByRole("navigation", {
        name: "Main navigation",
      });
      const links = mainNav.querySelectorAll("a[href='/events']");
      expect(links.length).toBeGreaterThan(0);
    });

    it("links 'Customs & Contact' to the Shopify custom-orders page, opened in a new tab", async () => {
      const { SiteNav } = await import("@/components/SiteNav");
      render(<SiteNav />);
      const mainNav = screen.getByRole("navigation", {
        name: "Main navigation",
      });
      const link = within(mainNav).getByRole("link", {
        name: /customs & contact/i,
      });
      expect(link).toHaveAttribute(
        "href",
        "https://store.augustjones.shop/pages/custom-orders",
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("tracks a shop click when 'Customs & Contact' is clicked", async () => {
      const user = userEvent.setup();
      const { SiteNav } = await import("@/components/SiteNav");
      render(<SiteNav />);
      const mainNav = screen.getByRole("navigation", {
        name: "Main navigation",
      });
      await user.click(
        within(mainNav).getByRole("link", { name: /customs & contact/i }),
      );
      expect(analytics.trackShopClick).toHaveBeenCalledWith("contact");
    });

    describe("when EMAIL_SIGNUP_ENABLED is false (default)", () => {
      it("does not contain a link to /join", async () => {
        const { SiteNav } = await import("@/components/SiteNav");
        render(<SiteNav />);
        const mainNav = screen.getByRole("navigation", {
          name: "Main navigation",
        });
        const links = mainNav.querySelectorAll("a[href='/join']");
        expect(links.length).toBe(0);
      });
    });

    describe("when EMAIL_SIGNUP_ENABLED is true", () => {
      beforeEach(() => {
        vi.stubEnv("NEXT_PUBLIC_EMAIL_SIGNUP_ENABLED", "true");
      });

      it("contains a link to /join", async () => {
        const { SiteNav } = await import("@/components/SiteNav");
        render(<SiteNav />);
        const mainNav = screen.getByRole("navigation", {
          name: "Main navigation",
        });
        const links = mainNav.querySelectorAll("a[href='/join']");
        expect(links.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Mobile nav", () => {
    it("does not show mobile navigation before menu is opened", async () => {
      const { SiteNav } = await import("@/components/SiteNav");
      render(<SiteNav />);
      expect(
        screen.queryByRole("navigation", { name: "Mobile navigation" }),
      ).not.toBeInTheDocument();
    });

    it("shows mobile navigation after clicking the Open menu button", async () => {
      const user = userEvent.setup();
      const { SiteNav } = await import("@/components/SiteNav");
      render(<SiteNav />);
      const openButton = screen.getByRole("button", { name: "Open menu" });
      await user.click(openButton);
      expect(
        screen.getByRole("navigation", { name: "Mobile navigation" }),
      ).toBeInTheDocument();
    });

    it("contains a link to /about in mobile navigation", async () => {
      const user = userEvent.setup();
      const { SiteNav } = await import("@/components/SiteNav");
      render(<SiteNav />);
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      const mobileNav = screen.getByRole("navigation", {
        name: "Mobile navigation",
      });
      expect(mobileNav.querySelector("a[href='/about']")).toBeInTheDocument();
    });

    it("contains a link to /events in mobile navigation", async () => {
      const user = userEvent.setup();
      const { SiteNav } = await import("@/components/SiteNav");
      render(<SiteNav />);
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      const mobileNav = screen.getByRole("navigation", {
        name: "Mobile navigation",
      });
      expect(mobileNav.querySelector("a[href='/events']")).toBeInTheDocument();
    });

    it("links 'Customs & Contact' to the Shopify custom-orders page in mobile navigation", async () => {
      const user = userEvent.setup();
      const { SiteNav } = await import("@/components/SiteNav");
      render(<SiteNav />);
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      const mobileNav = screen.getByRole("navigation", {
        name: "Mobile navigation",
      });
      const link = within(mobileNav).getByRole("link", {
        name: /customs & contact/i,
      });
      expect(link).toHaveAttribute(
        "href",
        "https://store.augustjones.shop/pages/custom-orders",
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    describe("when EMAIL_SIGNUP_ENABLED is false (default)", () => {
      it("does not contain a link to /join in mobile navigation", async () => {
        const user = userEvent.setup();
        const { SiteNav } = await import("@/components/SiteNav");
        render(<SiteNav />);
        await user.click(screen.getByRole("button", { name: "Open menu" }));
        const mobileNav = screen.getByRole("navigation", {
          name: "Mobile navigation",
        });
        expect(
          mobileNav.querySelector("a[href='/join']"),
        ).not.toBeInTheDocument();
      });
    });

    describe("when EMAIL_SIGNUP_ENABLED is true", () => {
      beforeEach(() => {
        vi.stubEnv("NEXT_PUBLIC_EMAIL_SIGNUP_ENABLED", "true");
      });

      it("contains a link to /join in mobile navigation", async () => {
        const user = userEvent.setup();
        const { SiteNav } = await import("@/components/SiteNav");
        render(<SiteNav />);
        await user.click(screen.getByRole("button", { name: "Open menu" }));
        const mobileNav = screen.getByRole("navigation", {
          name: "Mobile navigation",
        });
        expect(mobileNav.querySelector("a[href='/join']")).toBeInTheDocument();
      });
    });
  });
});

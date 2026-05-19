import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SiteNav } from "@/components/SiteNav";

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
  describe("Desktop nav", () => {
    it("renders a nav with aria-label 'Main navigation'", () => {
      render(<SiteNav />);
      expect(
        screen.getByRole("navigation", { name: "Main navigation" }),
      ).toBeInTheDocument();
    });

    it("contains a link to /about", () => {
      render(<SiteNav />);
      const mainNav = screen.getByRole("navigation", {
        name: "Main navigation",
      });
      const links = mainNav.querySelectorAll("a[href='/about']");
      expect(links.length).toBeGreaterThan(0);
    });

    it("contains a link to /events", () => {
      render(<SiteNav />);
      const mainNav = screen.getByRole("navigation", {
        name: "Main navigation",
      });
      const links = mainNav.querySelectorAll("a[href='/events']");
      expect(links.length).toBeGreaterThan(0);
    });

    it("contains a link to /contact", () => {
      render(<SiteNav />);
      const mainNav = screen.getByRole("navigation", {
        name: "Main navigation",
      });
      const links = mainNav.querySelectorAll("a[href='/contact']");
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe("Mobile nav", () => {
    it("does not show mobile navigation before menu is opened", () => {
      render(<SiteNav />);
      expect(
        screen.queryByRole("navigation", { name: "Mobile navigation" }),
      ).not.toBeInTheDocument();
    });

    it("shows mobile navigation after clicking the Open menu button", async () => {
      const user = userEvent.setup();
      render(<SiteNav />);
      const openButton = screen.getByRole("button", { name: "Open menu" });
      await user.click(openButton);
      expect(
        screen.getByRole("navigation", { name: "Mobile navigation" }),
      ).toBeInTheDocument();
    });

    it("contains a link to /about in mobile navigation", async () => {
      const user = userEvent.setup();
      render(<SiteNav />);
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      const mobileNav = screen.getByRole("navigation", {
        name: "Mobile navigation",
      });
      expect(mobileNav.querySelector("a[href='/about']")).toBeInTheDocument();
    });

    it("contains a link to /events in mobile navigation", async () => {
      const user = userEvent.setup();
      render(<SiteNav />);
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      const mobileNav = screen.getByRole("navigation", {
        name: "Mobile navigation",
      });
      expect(mobileNav.querySelector("a[href='/events']")).toBeInTheDocument();
    });

    it("contains a link to /contact in mobile navigation", async () => {
      const user = userEvent.setup();
      render(<SiteNav />);
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      const mobileNav = screen.getByRole("navigation", {
        name: "Mobile navigation",
      });
      expect(mobileNav.querySelector("a[href='/contact']")).toBeInTheDocument();
    });
  });
});

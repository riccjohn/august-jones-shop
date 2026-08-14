import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Next.js components globally
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

vi.mock("@/components/Footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock("@/components/GrainOverlay", () => ({
  GrainOverlay: () => <div data-testid="grain-overlay" />,
}));

vi.mock("@/components/TermsAndConditions", () => ({
  TermsAndConditions: () => (
    <section data-testid="terms-section">Terms</section>
  ),
}));

vi.mock("@/components/ContactForm", () => ({
  ContactForm: () => <form data-testid="contact-form">Contact Form</form>,
}));

describe("Contact Page", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe("when CUSTOMS_OPEN is true (default)", () => {
    it("renders 'Custom Commissions Are Open' heading", async () => {
      const ContactPage = (await import("../page")).default;
      render(<ContactPage />);

      expect(
        screen.getByRole("heading", {
          name: /custom commissions are open/i,
        }),
      ).toBeInTheDocument();
    });

    it("renders the ContactForm", async () => {
      const ContactPage = (await import("../page")).default;
      render(<ContactPage />);

      expect(screen.getByTestId("contact-form")).toBeInTheDocument();
    });

    it("shows the default open message in the callout", async () => {
      const ContactPage = (await import("../page")).default;
      render(<ContactPage />);

      expect(
        screen.getByText(/looking for a custom piece\?/i),
      ).toBeInTheDocument();
    });

    it("shows the email fallback line", async () => {
      const ContactPage = (await import("../page")).default;
      render(<ContactPage />);

      expect(
        screen.getByText(/prefer email or have other questions\?/i),
      ).toBeInTheDocument();
      const emailLink = screen.getByRole("link", {
        name: /contact@augustjones\.shop/i,
      });
      expect(emailLink).toHaveAttribute(
        "href",
        "mailto:contact@augustjones.shop",
      );
    });
  });

  describe("when CUSTOMS_OPEN is false", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_CUSTOMS_OPEN", "false");
    });

    it("renders 'Custom Commissions Are Closed' heading", async () => {
      vi.resetModules();
      const ContactPage = (await import("../page")).default;
      render(<ContactPage />);

      expect(
        screen.getByRole("heading", {
          name: /custom commissions are closed/i,
        }),
      ).toBeInTheDocument();
    });

    it("does not render the ContactForm", async () => {
      vi.resetModules();
      const ContactPage = (await import("../page")).default;
      render(<ContactPage />);

      expect(screen.queryByTestId("contact-form")).not.toBeInTheDocument();
    });

    it("shows the closed message in the callout with email list link", async () => {
      vi.resetModules();
      const ContactPage = (await import("../page")).default;
      render(<ContactPage />);

      expect(
        screen.getByText(/i'm temporarily closed for custom commissions/i),
      ).toBeInTheDocument();
      const joinLink = screen.getByRole("link", { name: /email list/i });
      expect(joinLink).toHaveAttribute("href", "/join");
    });

    it("renders the closed state message", async () => {
      vi.resetModules();
      const ContactPage = (await import("../page")).default;
      render(<ContactPage />);

      expect(
        screen.getByText(
          /custom commissions are temporarily closed while i focus on existing orders/i,
        ),
      ).toBeInTheDocument();
    });

    it("shows the email fallback line", async () => {
      vi.resetModules();
      const ContactPage = (await import("../page")).default;
      render(<ContactPage />);

      expect(
        screen.getByText(/prefer email or have other questions\?/i),
      ).toBeInTheDocument();
      const emailLink = screen.getByRole("link", {
        name: /contact@augustjones\.shop/i,
      });
      expect(emailLink).toHaveAttribute(
        "href",
        "mailto:contact@augustjones.shop",
      );
    });
  });
});

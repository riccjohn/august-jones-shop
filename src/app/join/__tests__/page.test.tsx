import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/Footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock("@/components/GrainOverlay", () => ({
  GrainOverlay: () => <div data-testid="grain-overlay" />,
}));

vi.mock("@/components/EmailSignupForm", () => ({
  EmailSignupForm: ({ source }: { source: string }) => (
    <div data-testid="email-signup-form" data-source={source} />
  ),
}));

describe("Join Page", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe("when EMAIL_SIGNUP_ENABLED is false (default)", () => {
    it("does not render the EmailSignupForm", async () => {
      const JoinPage = (await import("../page")).default;
      render(<JoinPage />);

      expect(screen.queryByTestId("email-signup-form")).not.toBeInTheDocument();
    });

    it("shows a paused message with a mailto fallback", async () => {
      const JoinPage = (await import("../page")).default;
      render(<JoinPage />);

      expect(
        screen.getByText(/sign-ups are temporarily paused/i),
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

  describe("when EMAIL_SIGNUP_ENABLED is true", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_EMAIL_SIGNUP_ENABLED", "true");
    });

    it("renders the EmailSignupForm with source='join'", async () => {
      const JoinPage = (await import("../page")).default;
      render(<JoinPage />);

      const emailSignupForm = screen.getByTestId("email-signup-form");
      expect(emailSignupForm).toBeInTheDocument();
      expect(emailSignupForm).toHaveAttribute("data-source", "join");
    });

    it("does not show the paused message", async () => {
      const JoinPage = (await import("../page")).default;
      render(<JoinPage />);

      expect(
        screen.queryByText(/sign-ups are temporarily paused/i),
      ).not.toBeInTheDocument();
    });
  });
});

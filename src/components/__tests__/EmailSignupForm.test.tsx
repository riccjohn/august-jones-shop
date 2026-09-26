import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EmailSignupForm } from "@/components/EmailSignupForm";
import * as analytics from "@/lib/analytics";
import { CONTACT_EMAIL } from "@/lib/constants";

vi.mock("@/lib/analytics", () => ({
  trackEmailSignup: vi.fn(),
  trackEmailSignupError: vi.fn(),
}));

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  email = "jane@example.com",
) {
  await user.type(screen.getByRole("textbox", { name: /email/i }), email);
  await user.click(screen.getByRole("button", { name: "Sign Up" }));
}

const sources = ["footer", "join", "home"] as const;

describe("EmailSignupForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe.each(sources)("source=%s", (source) => {
    describe("idle state", () => {
      it("renders a required email input and an enabled brand submit button", () => {
        render(<EmailSignupForm source={source} />);
        const emailInput = screen.getByRole("textbox", { name: /email/i });
        expect(emailInput).toBeEnabled();
        expect(emailInput).toHaveAttribute("type", "email");
        expect(emailInput).toBeRequired();

        const button = screen.getByRole("button", { name: "Sign Up" });
        expect(button).toBeEnabled();
      });

      it("renders a hidden honeypot input that is not visible to users", () => {
        render(<EmailSignupForm source={source} />);
        const honeypot = document.querySelector('input[name="website"]');
        expect(honeypot).toBeInTheDocument();
        expect(honeypot).not.toHaveStyle({ display: "none" });
        expect(honeypot?.closest("[aria-hidden]")).toHaveAttribute(
          "aria-hidden",
          "true",
        );
      });
    });

    describe("honeypot anti-spam", () => {
      it("silently shows success without calling fetch or tracking when the honeypot is filled", async () => {
        const user = userEvent.setup();
        const mockFetch = vi.fn();
        vi.stubGlobal("fetch", mockFetch);

        render(<EmailSignupForm source={source} />);
        await user.type(
          screen.getByRole("textbox", { name: /email/i }),
          "jane@example.com",
        );

        const honeypot = document.querySelector(
          'input[name="website"]',
        ) as HTMLInputElement;
        await user.type(honeypot, "http://spam.example.com");

        await user.click(screen.getByRole("button", { name: "Sign Up" }));

        await waitFor(() =>
          expect(
            screen.getByText("Thanks for subscribing! You're in."),
          ).toBeInTheDocument(),
        );
        expect(mockFetch).not.toHaveBeenCalled();
        expect(analytics.trackEmailSignup).not.toHaveBeenCalled();
      });
    });

    describe("submitting state", () => {
      it("disables the email input and button and shows a loading label while pending", async () => {
        const user = userEvent.setup();
        let resolveFetch!: (value: Response) => void;
        vi.stubGlobal(
          "fetch",
          vi.fn(
            () =>
              new Promise<Response>((resolve) => {
                resolveFetch = resolve;
              }),
          ),
        );

        render(<EmailSignupForm source={source} />);
        await user.type(
          screen.getByRole("textbox", { name: /email/i }),
          "jane@example.com",
        );
        await user.click(screen.getByRole("button", { name: "Sign Up" }));

        expect(screen.getByRole("textbox", { name: /email/i })).toBeDisabled();
        expect(
          screen.getByRole("button", { name: "Signing up..." }),
        ).toBeInTheDocument();

        resolveFetch(new Response(JSON.stringify({}), { status: 200 }));
      });

      it("calls fetch with the correct request shape", async () => {
        const user = userEvent.setup();
        const mockFetch = vi
          .fn()
          .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
        vi.stubGlobal("fetch", mockFetch);

        render(<EmailSignupForm source={source} />);
        await fillAndSubmit(user, "jane@example.com");

        await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce());

        const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
        expect(url).toBe("/api/subscribe");
        expect(init.method).toBe("POST");
        expect(init.headers).toEqual({
          "Content-Type": "application/json",
          Accept: "application/json",
        });

        const body = JSON.parse(init.body as string) as {
          email: string;
          source: string;
        };
        expect(body.email).toBe("jane@example.com");
        expect(body.source).toBe(source);
      });
    });

    describe("success state", () => {
      it("replaces the form with a success message and tracks the signup exactly once", async () => {
        const user = userEvent.setup();
        vi.stubGlobal(
          "fetch",
          vi
            .fn()
            .mockResolvedValue(
              new Response(JSON.stringify({}), { status: 200 }),
            ),
        );

        render(<EmailSignupForm source={source} />);
        await fillAndSubmit(user, "jane@example.com");

        await waitFor(() =>
          expect(
            screen.getByText("Thanks for subscribing! You're in."),
          ).toBeInTheDocument(),
        );
        expect(
          screen.queryByRole("textbox", { name: /email/i }),
        ).not.toBeInTheDocument();

        expect(analytics.trackEmailSignup).toHaveBeenCalledTimes(1);
        expect(analytics.trackEmailSignup).toHaveBeenCalledWith(source);
        expect(analytics.trackEmailSignupError).not.toHaveBeenCalled();
      });
    });

    describe.each([
      [
        "a non-ok response",
        () =>
          vi
            .fn()
            .mockResolvedValue(
              new Response(JSON.stringify({}), { status: 500 }),
            ),
      ],
      [
        "a thrown network error",
        () => vi.fn().mockRejectedValue(new Error("Network error")),
      ],
    ] as const)("error state — %s", (_label, mockFetchFactory) => {
      it("shows an error message with a mailto fallback link", async () => {
        const user = userEvent.setup();
        vi.stubGlobal("fetch", mockFetchFactory());

        render(<EmailSignupForm source={source} />);
        await fillAndSubmit(user, "jane@example.com");

        await waitFor(() =>
          expect(screen.getByText(/something went wrong/i)).toBeInTheDocument(),
        );
        const link = screen.getByRole("link", {
          name: new RegExp(CONTACT_EMAIL.replace(".", "\\."), "i"),
        });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", `mailto:${CONTACT_EMAIL}`);
        expect(analytics.trackEmailSignup).not.toHaveBeenCalled();
      });

      it("calls trackEmailSignupError with the source on failure", async () => {
        const user = userEvent.setup();
        vi.stubGlobal("fetch", mockFetchFactory());

        render(<EmailSignupForm source={source} />);
        await fillAndSubmit(user, "jane@example.com");

        await waitFor(() =>
          expect(analytics.trackEmailSignupError).toHaveBeenCalledOnce(),
        );
        expect(analytics.trackEmailSignupError).toHaveBeenCalledWith(source);
      });
    });
  });

  describe("email validation", () => {
    it("blocks submission of an email with no dot after the @, matching the server rule", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn();
      vi.stubGlobal("fetch", mockFetch);

      render(<EmailSignupForm source="footer" />);
      await fillAndSubmit(user, "jane@gmail");

      expect(screen.getByRole("textbox", { name: /email/i })).toBeInvalid();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("leaves an empty field to the browser's required message", async () => {
      const user = userEvent.setup();
      render(<EmailSignupForm source="footer" />);
      const email = screen.getByRole<HTMLInputElement>("textbox", {
        name: /email/i,
      });

      await user.type(email, "a");
      await user.clear(email);

      expect(email.validationMessage).not.toMatch(/valid email address/i);
    });

    it("blocks a bad email set without a change event", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn();
      vi.stubGlobal("fetch", mockFetch);
      render(<EmailSignupForm source="footer" />);
      const email = screen.getByRole("textbox", { name: /email/i });

      // Simulates autofill: the value lands without React seeing an event.
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(email, "jane@gmail");
      await user.click(screen.getByRole("button", { name: /./ }));

      expect(mockFetch).not.toHaveBeenCalled();
      expect(email).toBeInvalid();
    });

    it("submits a corrected email set without a change event, instead of keeping the stale error", async () => {
      const user = userEvent.setup();
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new Response(null, { status: 200 }));
      vi.stubGlobal("fetch", mockFetch);
      render(<EmailSignupForm source="footer" />);
      const email = screen.getByRole("textbox", { name: /email/i });

      await user.type(email, "jane@gmail");
      await user.tab();
      // Simulates autofill fixing the typo: React sees no event.
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(email, "jane@gmail.com");
      await user.click(screen.getByRole("button", { name: "Sign Up" }));

      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it("clears the validation error once the email is corrected", async () => {
      const user = userEvent.setup();
      render(<EmailSignupForm source="footer" />);
      const email = screen.getByRole("textbox", { name: /email/i });

      await user.type(email, "jane@gmail");
      expect(email).toBeInvalid();

      await user.type(email, ".com");
      expect(email).toBeValid();
    });
  });

  describe("server rejected the input (400)", () => {
    it("keeps the generic message and emailing fallback for a rejection that isn't a bad email", async () => {
      const user = userEvent.setup();
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ error: "Invalid subscribe request" }), {
            status: 400,
          }),
        ),
      );

      render(<EmailSignupForm source="footer" />);
      await fillAndSubmit(user);

      await waitFor(() =>
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument(),
      );
      expect(
        screen.queryByText(/invalid subscribe request/i),
      ).not.toBeInTheDocument();
    });

    it("shows the server's specific message instead of the generic one", async () => {
      const user = userEvent.setup();
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              error:
                "Please enter a valid email address, like you@example.com.",
              invalidEmail: true,
            }),
            { status: 400 },
          ),
        ),
      );

      render(<EmailSignupForm source="footer" />);
      await fillAndSubmit(user);

      await waitFor(() =>
        expect(
          screen.getByText(/please enter a valid email address/i),
        ).toBeInTheDocument(),
      );
      expect(
        screen.queryByText(/something went wrong/i),
      ).not.toBeInTheDocument();
      expect(analytics.trackEmailSignupError).toHaveBeenCalledWith("footer");
    });
  });
});

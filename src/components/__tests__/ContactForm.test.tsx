import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ContactForm } from "@/components/ContactForm";

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: { name?: string; email?: string; message?: string } = {},
) {
  const name = overrides.name ?? "Jane Doe";
  const email = overrides.email ?? "jane@example.com";
  const message = overrides.message ?? "I want a custom hoodie";

  await user.type(screen.getByRole("textbox", { name: /name/i }), name);
  await user.type(screen.getByRole("textbox", { name: /email/i }), email);
  await user.type(
    screen.getByRole("textbox", {
      name: /tell me about your custom request/i,
    }),
    message,
  );
}

describe("ContactForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("idle state", () => {
    it("renders all form fields enabled with the submit button", () => {
      render(<ContactForm />);
      expect(screen.getByRole("textbox", { name: /name/i })).toBeEnabled();
      expect(screen.getByRole("textbox", { name: /email/i })).toBeEnabled();
      expect(
        screen.getByRole("textbox", {
          name: /tell me about your custom request/i,
        }),
      ).toBeEnabled();
      expect(
        screen.getByRole("button", { name: /request a custom/i }),
      ).toBeEnabled();
    });
  });

  describe("submitting state", () => {
    it("disables all form fields and shows a loading indicator while submitting", async () => {
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

      render(<ContactForm />);
      await fillForm(user);
      await user.click(
        screen.getByRole("button", { name: /request a custom/i }),
      );

      expect(screen.getByRole("textbox", { name: /name/i })).toBeDisabled();
      expect(screen.getByRole("textbox", { name: /email/i })).toBeDisabled();
      expect(
        screen.getByRole("textbox", {
          name: /tell me about your custom request/i,
        }),
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: /sending/i }),
      ).toBeInTheDocument();

      resolveFetch(new Response(JSON.stringify({}), { status: 200 }));
    });

    it("calls fetch with correct payload including subject custom-commission", async () => {
      const user = userEvent.setup();
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
      vi.stubGlobal("fetch", mockFetch);

      render(<ContactForm />);
      await fillForm(user);
      await user.click(
        screen.getByRole("button", { name: /request a custom/i }),
      );

      await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce());

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("/api/contact");
      expect(init.method).toBe("POST");

      const body = JSON.parse(init.body as string) as {
        name: string;
        email: string;
        subject: string;
        message: string;
      };
      expect(body.subject).toBe("custom-commission");
      expect(body.name).toBe("Jane Doe");
      expect(body.email).toBe("jane@example.com");
      expect(body.message).toBe("I want a custom hoodie");
    });
  });

  describe("success state", () => {
    it("shows a success message and hides form fields after fetch resolves ok", async () => {
      const user = userEvent.setup();
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 })),
      );

      render(<ContactForm />);
      await fillForm(user);
      await user.click(
        screen.getByRole("button", { name: /request a custom/i }),
      );

      await waitFor(() =>
        expect(screen.getByText(/request received/i)).toBeInTheDocument(),
      );
      expect(
        screen.queryByRole("textbox", { name: /name/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("textbox", { name: /email/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("textbox", {
          name: /tell me about your custom request/i,
        }),
      ).not.toBeInTheDocument();
    });
  });

  describe("error state — bad response (ok: false)", () => {
    it("shows an error message and fallback email link when fetch returns non-ok", async () => {
      const user = userEvent.setup();
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(new Response(JSON.stringify({}), { status: 500 })),
      );

      render(<ContactForm />);
      await fillForm(user);
      await user.click(
        screen.getByRole("button", { name: /request a custom/i }),
      );

      await waitFor(() =>
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument(),
      );
      const link = screen.getByRole("link", {
        name: /customs@augustjones\.shop/i,
      });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "mailto:customs@augustjones.shop");
    });
  });

  describe("error state — fetch throws exception", () => {
    it("shows an error message and fallback email link when fetch throws", async () => {
      const user = userEvent.setup();
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("Network error")),
      );

      render(<ContactForm />);
      await fillForm(user);
      await user.click(
        screen.getByRole("button", { name: /request a custom/i }),
      );

      await waitFor(() =>
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument(),
      );
      const link = screen.getByRole("link", {
        name: /customs@augustjones\.shop/i,
      });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "mailto:customs@augustjones.shop");
    });
  });
});

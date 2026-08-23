import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ContactForm } from "@/components/ContactForm";
import * as analytics from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({
  trackContactFormError: vi.fn(),
}));

async function selectPieceType(
  user: ReturnType<typeof userEvent.setup>,
  label: RegExp,
) {
  await user.click(
    screen.getByRole("combobox", { name: /what type of piece/i }),
  );
  await user.click(await screen.findByRole("option", { name: label }));
}

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: {
    firstName?: string;
    lastName?: string;
    email?: string;
    team?: string;
    pieceTypeLabel?: RegExp;
    sizeName?: RegExp;
    materialsSourceName?: RegExp;
    message?: string;
  } = {},
) {
  const firstName = overrides.firstName ?? "Jane";
  const lastName = overrides.lastName ?? "Doe";
  const email = overrides.email ?? "jane@example.com";
  const team = overrides.team ?? "Wisconsin Badgers";
  const pieceTypeLabel = overrides.pieceTypeLabel ?? /cropped flannel/i;
  const sizeName = overrides.sizeName ?? /unisex m/i;
  const materialsSourceName =
    overrides.materialsSourceName ?? /sending you my own/i;
  const message = overrides.message ?? "I want a custom hoodie";

  await user.type(
    screen.getByRole("textbox", { name: /first name/i }),
    firstName,
  );
  await user.type(
    screen.getByRole("textbox", { name: /last name/i }),
    lastName,
  );
  await user.type(screen.getByRole("textbox", { name: /^email$/i }), email);
  await user.type(
    screen.getByRole("textbox", { name: /team or university/i }),
    team,
  );

  await selectPieceType(user, pieceTypeLabel);
  await user.click(screen.getByRole("radio", { name: sizeName }));
  await user.click(screen.getByRole("radio", { name: materialsSourceName }));
  await user.type(
    screen.getByRole("textbox", { name: /description/i }),
    message,
  );
  await user.click(
    screen.getByRole("checkbox", { name: /50% non-refundable deposit/i }),
  );
}

describe("ContactForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(analytics.trackContactFormError).mockClear();
  });

  describe("honeypot anti-spam", () => {
    it("renders a hidden honeypot input that is not visible to users", () => {
      render(<ContactForm />);
      const honeypot = document.querySelector('input[name="website"]');
      expect(honeypot).toBeInTheDocument();
      expect(honeypot?.closest("[aria-hidden]")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });

    it("silently shows success without calling the API when the honeypot is filled", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn();
      vi.stubGlobal("fetch", mockFetch);

      render(<ContactForm />);
      await fillForm(user);

      const honeypot = document.querySelector(
        'input[name="website"]',
      ) as HTMLInputElement;
      await user.type(honeypot, "http://spam.example.com");

      await user.click(
        screen.getByRole("button", { name: /request a custom/i }),
      );

      await waitFor(() =>
        expect(screen.getByText(/request received/i)).toBeInTheDocument(),
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("idle state", () => {
    it("renders the Send a Message heading", () => {
      render(<ContactForm />);
      expect(
        screen.getByRole("heading", { name: /send a message/i }),
      ).toBeInTheDocument();
    });

    it("renders all form fields enabled with the submit button", () => {
      render(<ContactForm />);
      expect(
        screen.getByRole("textbox", { name: /first name/i }),
      ).toBeEnabled();
      expect(screen.getByRole("textbox", { name: /last name/i })).toBeEnabled();
      expect(screen.getByRole("textbox", { name: /^email$/i })).toBeEnabled();
      expect(
        screen.getByRole("textbox", { name: /instagram handle/i }),
      ).toBeEnabled();
      expect(
        screen.getByRole("textbox", { name: /team or university/i }),
      ).toBeEnabled();
      expect(
        screen.getByRole("combobox", { name: /what type of piece/i }),
      ).toBeEnabled();
      expect(
        screen.getByRole("textbox", { name: /description/i }),
      ).toBeEnabled();
      expect(
        screen.getByRole("checkbox", { name: /50% non-refundable deposit/i }),
      ).toBeEnabled();
      expect(
        screen.getByRole("button", { name: /request a custom/i }),
      ).toBeEnabled();
    });

    it("shows every size option when no piece type is selected yet", () => {
      render(<ContactForm />);
      expect(
        screen.getByRole("radio", { name: /one size \(fanny packs\)/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /unisex s/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /unisex xl/i }),
      ).toBeInTheDocument();
    });

    it("links the policy checkbox label to the Terms & Conditions section", () => {
      render(<ContactForm />);
      const link = screen.getByRole("link", { name: /custom policy/i });
      expect(link).toHaveAttribute("href", "#terms");
    });
  });

  describe("piece type -> size dependency", () => {
    it("shows only One Size, pre-selected, when Fanny Pack is selected", async () => {
      const user = userEvent.setup();
      render(<ContactForm />);

      await selectPieceType(user, /fanny pack/i);

      expect(
        screen.getByRole("radio", { name: /one size \(fanny packs\)/i }),
      ).toBeChecked();
      expect(
        screen.queryByRole("radio", { name: /custom \/ other/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("radio", { name: /unisex s/i }),
      ).not.toBeInTheDocument();
    });

    it("hides One Size and shows Unisex S/M/L/XL for any non-Fanny-Pack piece", async () => {
      const user = userEvent.setup();
      render(<ContactForm />);

      await selectPieceType(user, /cropped flannel/i);

      expect(
        screen.queryByRole("radio", { name: /one size \(fanny packs\)/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /unisex s/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /unisex xl/i }),
      ).toBeInTheDocument();
    });

    it("replaces a previously selected size with the auto-selected One Size when switching to Fanny Pack", async () => {
      const user = userEvent.setup();
      render(<ContactForm />);

      await selectPieceType(user, /cropped flannel/i);
      await user.click(screen.getByRole("radio", { name: /unisex m/i }));
      expect(screen.getByRole("radio", { name: /unisex m/i })).toBeChecked();

      await selectPieceType(user, /fanny pack/i);

      expect(
        screen.getByRole("radio", { name: /one size \(fanny packs\)/i }),
      ).toBeChecked();
      expect(
        screen.queryByRole("radio", { name: /unisex m/i }),
      ).not.toBeInTheDocument();
    });

    it("clears the auto-selected One Size when switching away from Fanny Pack", async () => {
      const user = userEvent.setup();
      render(<ContactForm />);

      await selectPieceType(user, /fanny pack/i);
      expect(
        screen.getByRole("radio", { name: /one size \(fanny packs\)/i }),
      ).toBeChecked();

      await selectPieceType(user, /cropped flannel/i);

      expect(
        screen.queryByRole("radio", { name: /one size \(fanny packs\)/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /unisex m/i }),
      ).not.toBeChecked();
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

      expect(
        screen.getByRole("textbox", { name: /first name/i }),
      ).toBeDisabled();
      expect(screen.getByRole("textbox", { name: /^email$/i })).toBeDisabled();
      expect(
        screen.getByRole("combobox", { name: /what type of piece/i }),
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: /sending/i }),
      ).toBeInTheDocument();

      resolveFetch(new Response(JSON.stringify({}), { status: 200 }));
    });

    it("calls fetch with correct payload shape", async () => {
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
        firstName: string;
        lastName: string;
        email: string;
        instagram: string;
        team: string;
        pieceType: string;
        size: string;
        materialsSource: string;
        message: string;
        policyAgreed: boolean;
      };
      expect(body.firstName).toBe("Jane");
      expect(body.lastName).toBe("Doe");
      expect(body.email).toBe("jane@example.com");
      expect(body.instagram).toBe("");
      expect(body.team).toBe("Wisconsin Badgers");
      expect(body.pieceType).toBe("Cropped Flannel");
      expect(body.size).toBe("Unisex M");
      expect(body.materialsSource).toBe(
        "I am sending you my own garments/materials.",
      );
      expect(body.message).toBe("I want a custom hoodie");
      expect(body.policyAgreed).toBe(true);
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
        screen.queryByRole("textbox", { name: /first name/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("combobox", { name: /what type of piece/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: /send a message/i }),
      ).not.toBeInTheDocument();
    });

    it("scrolls the success message into view", async () => {
      const user = userEvent.setup();
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 })),
      );
      const scrollIntoViewSpy = vi.spyOn(
        window.HTMLElement.prototype,
        "scrollIntoView",
      );

      render(<ContactForm />);
      await fillForm(user);
      await user.click(
        screen.getByRole("button", { name: /request a custom/i }),
      );

      await waitFor(() =>
        expect(screen.getByText(/request received/i)).toBeInTheDocument(),
      );
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
    });

    it("does not call trackContactFormError on a successful submission", async () => {
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
      expect(analytics.trackContactFormError).not.toHaveBeenCalled();
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

    it("calls trackContactFormError when fetch returns non-ok", async () => {
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
        expect(analytics.trackContactFormError).toHaveBeenCalledOnce(),
      );
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

    it("calls trackContactFormError when fetch throws", async () => {
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
        expect(analytics.trackContactFormError).toHaveBeenCalledOnce(),
      );
    });
  });
});

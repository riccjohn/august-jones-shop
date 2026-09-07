import * as Sentry from "@sentry/cloudflare";
import { describe, expect, it, vi } from "vitest";
import { caughtErrorResponse, errorResponse } from "../error-response";

vi.mock("@sentry/cloudflare", () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));

describe("errorResponse", () => {
  it("returns a 500 JSON response with the given error message", async () => {
    const response = errorResponse("Something went wrong");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Something went wrong" });
  });

  it("reports the message to Sentry at error level", () => {
    errorResponse("Something went wrong");

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Something went wrong",
      "error",
    );
  });

  it("redacts email addresses before reporting to Sentry", () => {
    errorResponse("Email jane@example.com is invalid");

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Email [redacted-email] is invalid",
      "error",
    );
  });

  it("returns the unredacted message to the client", async () => {
    const response = errorResponse("Email jane@example.com is invalid");

    expect(await response.json()).toEqual({
      error: "Email jane@example.com is invalid",
    });
  });
});

describe("caughtErrorResponse", () => {
  it("returns a 500 JSON response with the caught Error's message", async () => {
    const response = caughtErrorResponse(new Error("boom"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "boom" });
  });

  it("falls back to a generic message when the caught value isn't an Error", async () => {
    const response = caughtErrorResponse("not an error object");

    expect(await response.json()).toEqual({
      error: "Shopify request failed",
    });
  });

  it("reports the caught value to Sentry via captureException", () => {
    const err = new Error("boom");
    caughtErrorResponse(err);

    expect(Sentry.captureException).toHaveBeenCalledWith(err);
  });

  it("redacts email addresses from the message and stack before reporting to Sentry", () => {
    const err = new Error("Customer jane@example.com already exists");
    caughtErrorResponse(err);

    expect(Sentry.captureException).toHaveBeenLastCalledWith(err);
    expect(err.message).toBe("Customer [redacted-email] already exists");
    expect(err.stack).not.toContain("jane@example.com");
  });

  it("returns the caught Error's original, unredacted message to the client", async () => {
    const response = caughtErrorResponse(
      new Error("Customer jane@example.com already exists"),
    );

    expect(await response.json()).toEqual({
      error: "Customer jane@example.com already exists",
    });
  });
});

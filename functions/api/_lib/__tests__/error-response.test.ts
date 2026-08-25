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
});

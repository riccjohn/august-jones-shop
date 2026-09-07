import { describe, expect, it } from "vitest";
import { isContactPayload } from "../contact-validation";

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    instagram: "",
    team: "Wisconsin Badgers",
    pieceType: "Cropped Flannel",
    size: "Unisex M",
    materialsSource: "I am sending you my own garments/materials.",
    message: "I want a custom hoodie",
    policyAgreed: true,
    ...overrides,
  };
}

describe("isContactPayload", () => {
  it("accepts a fully populated, valid payload", () => {
    expect(isContactPayload(validPayload())).toBe(true);
  });

  it("rejects a non-object value", () => {
    expect(isContactPayload("not an object")).toBe(false);
    expect(isContactPayload(null)).toBe(false);
  });

  it("rejects when policyAgreed is not exactly true", () => {
    expect(isContactPayload(validPayload({ policyAgreed: "on" }))).toBe(false);
    expect(isContactPayload(validPayload({ policyAgreed: false }))).toBe(false);
  });

  it("rejects a missing required field", () => {
    const { team: _team, ...withoutTeam } = validPayload();
    expect(isContactPayload(withoutTeam)).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(isContactPayload(validPayload({ email: "not-an-email" }))).toBe(
      false,
    );
  });

  it("accepts an empty instagram/message (optional fields)", () => {
    expect(isContactPayload(validPayload({ instagram: "", message: "" }))).toBe(
      true,
    );
  });

  it("rejects when the honeypot website field is filled", () => {
    expect(
      isContactPayload(validPayload({ website: "http://spam.example.com" })),
    ).toBe(false);
  });

  it("accepts when the honeypot website field is empty", () => {
    expect(isContactPayload(validPayload({ website: "" }))).toBe(true);
  });
});

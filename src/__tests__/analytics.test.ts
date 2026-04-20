import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  trackEmailClick,
  trackInstagramClick,
  trackNavClick,
  trackShopClick,
} from "@/lib/analytics";

describe("track (internal) — missing umami guard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not throw when window.umami is undefined", () => {
    vi.stubGlobal("umami", undefined);
    expect(() => trackShopClick("header")).not.toThrow();
  });
});

describe("trackShopClick", () => {
  let mockTrack: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTrack = vi.fn();
    vi.stubGlobal("umami", { track: mockTrack });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls window.umami.track with event name "shopify_store_click" and payload { source }', () => {
    trackShopClick("header");
    expect(mockTrack).toHaveBeenCalledWith("shopify_store_click", {
      source: "header",
    });
  });

  it("calls window.umami.track with no payload when source is omitted", () => {
    trackShopClick();
    expect(mockTrack).toHaveBeenCalledWith("shopify_store_click", undefined);
  });
});

describe("trackInstagramClick", () => {
  let mockTrack: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTrack = vi.fn();
    vi.stubGlobal("umami", { track: mockTrack });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls window.umami.track with event name "instagram_click" and payload { source: location }', () => {
    trackInstagramClick("hero");
    expect(mockTrack).toHaveBeenCalledWith("instagram_click", {
      source: "hero",
    });
  });
});

describe("trackNavClick", () => {
  let mockTrack: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTrack = vi.fn();
    vi.stubGlobal("umami", { track: mockTrack });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls window.umami.track with event name "nav_click" and payload { destination }', () => {
    trackNavClick("about");
    expect(mockTrack).toHaveBeenCalledWith("nav_click", {
      destination: "about",
    });
  });
});

describe("trackEmailClick", () => {
  let mockTrack: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTrack = vi.fn();
    vi.stubGlobal("umami", { track: mockTrack });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls window.umami.track with event name "email_click" and no payload', () => {
    trackEmailClick();
    expect(mockTrack).toHaveBeenCalledWith("email_click", undefined);
  });
});

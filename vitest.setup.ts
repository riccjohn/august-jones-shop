import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll } from "vitest";

beforeAll(() => {
  // Relay tests run under `// @vitest-environment node` (no DOM globals),
  // sharing this setup file. Skip the jsdom-only patches there.
  if (typeof window === "undefined") return;

  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.HTMLElement.prototype.hasPointerCapture = () => false;
  window.HTMLElement.prototype.releasePointerCapture = () => {};

  if (typeof window.ResizeObserver === "undefined") {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;
  }
});

afterEach(() => {
  cleanup();
});

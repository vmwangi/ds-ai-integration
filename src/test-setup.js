import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// jsdom does not implement scrolling; the app calls both forms on navigation
window.scrollTo = vi.fn();
Element.prototype.scrollTo = vi.fn();

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});

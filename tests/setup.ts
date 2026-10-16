import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom does not implement these; GSAP and Next components touch them.
if (typeof window !== "undefined") {
  window.matchMedia ??= (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;

  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  if (!window.IntersectionObserver) {
    class MockIntersectionObserver implements IntersectionObserver {
      scrollMargin = "";
      root = null;
      rootMargin = "";
      thresholds: ReadonlyArray<number> = [];
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }
    window.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
  }
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
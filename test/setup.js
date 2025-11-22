import "@testing-library/jest-dom";
import { expect, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";

// Mock localStorage for tests
beforeAll(() => {
  const localStorageMock = {
    getItem: (key) => localStorageMock[key] || null,
    setItem: (key, value) => {
      localStorageMock[key] = value;
    },
    removeItem: (key) => {
      delete localStorageMock[key];
    },
    clear: () => {
      Object.keys(localStorageMock).forEach((key) => {
        if (
          key !== "getItem" &&
          key !== "setItem" &&
          key !== "removeItem" &&
          key !== "clear"
        ) {
          delete localStorageMock[key];
        }
      });
    },
  };
  global.localStorage = localStorageMock;
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

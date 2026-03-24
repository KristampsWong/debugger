import '@testing-library/jest-dom/vitest'

// Polyfill localStorage for test environment
const store: Record<string, string> = {}
if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage?.setItem) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { for (const key in store) delete store[key] },
      get length() { return Object.keys(store).length },
      key: (index: number) => Object.keys(store)[index] ?? null,
    },
    writable: true,
  })
}

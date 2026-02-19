import '@testing-library/jest-dom';

// Polyfill CSS.supports for Primer React in jsdom test environment
if (typeof CSS === 'undefined' || typeof CSS.supports === 'undefined') {
  (globalThis as unknown as { CSS: { supports: () => boolean } }).CSS = {
    supports: () => false,
  };
}

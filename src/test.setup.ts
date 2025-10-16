import '@testing-library/jest-dom';

if (!(globalThis as any).crypto?.randomUUID) {
  (globalThis as any).crypto = {
    ...(globalThis as any).crypto,
    randomUUID: () => 'test-' + Math.random().toString(16).slice(2)
  };
}

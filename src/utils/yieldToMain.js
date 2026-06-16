/**
 * Yield to the main thread so the browser can process user input / paint.
 * Uses scheduler.yield() when available, falls back to setTimeout(0).
 * Useful for breaking up long tasks (>50ms) to improve INP on mobile.
 */
export function yieldToMain() {
  if (globalThis.scheduler?.yield) {
    return scheduler.yield();
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}

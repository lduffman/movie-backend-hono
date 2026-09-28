import { createMemoryCache } from "#core/utils/memory-cache.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("createMemoryCache", () => {
  beforeEach(() => {
    // horloge simulée : on avance le temps sans attendre réellement
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls the loader only once for concurrent requests", async () => {
    const cache = createMemoryCache<string[]>({ ttlMs: 1000 });
    const loader = vi.fn().mockResolvedValue(["Action"]);

    const [first, second] = await Promise.all([
      cache.get("genres", loader),
      cache.get("genres", loader),
    ]);

    expect(first).toEqual(["Action"]);
    expect(second).toEqual(["Action"]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("reloads once the entry has expired", async () => {
    const cache = createMemoryCache<string[]>({ ttlMs: 1000 });
    const loader = vi.fn().mockResolvedValue(["Action"]);

    await cache.get("genres", loader);
    vi.advanceTimersByTime(1001);
    await cache.get("genres", loader);

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("does not keep a failure in cache", async () => {
    const cache = createMemoryCache<string[]>({ ttlMs: 1000 });
    const failing = vi.fn().mockRejectedValue(new Error("db down"));
    const working = vi.fn().mockResolvedValue(["Drama"]);

    await expect(cache.get("genres", failing)).rejects.toThrow("db down");

    await expect(cache.get("genres", working)).resolves.toEqual(["Drama"]);
    expect(working).toHaveBeenCalledTimes(1);
  });
});

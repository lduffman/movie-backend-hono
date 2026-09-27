// Cache en mémoire du process, équivalent du @Cacheable côté Spring.
// Le middleware `hono/cache` s'appuie sur la Web Cache API (Cloudflare Workers,
// Deno...) : elle n'existe pas sous Node, il ne faisait donc rien ici.
//
// On stocke la Promise (et pas la valeur) : deux requêtes simultanées sur une
// clé absente ne déclenchent qu'un seul appel à la base.
export const createMemoryCache = <T>({ ttlMs }: { ttlMs: number }) => {
  const entries = new Map<string, { value: Promise<T>; expiresAt: number }>();

  const get = (key: string, loader: () => Promise<T>): Promise<T> => {
    const now = Date.now();
    const hit = entries.get(key);

    if (hit && hit.expiresAt > now) {
      return hit.value;
    }

    const value = loader();
    entries.set(key, { value, expiresAt: now + ttlMs });
    // une erreur ne doit pas rester en cache : la requête suivante réessaiera
    value.catch(() => entries.delete(key));

    return value;
  };

  const evict = (key: string) => entries.delete(key);
  const clear = () => entries.clear();

  return { get, evict, clear };
};

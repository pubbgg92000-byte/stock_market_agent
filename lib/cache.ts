import { prisma } from "@/lib/db";

export async function getCachedJson<T>(key: string): Promise<T | null> {
  try {
    const cached = await prisma.providerCache.findUnique({ where: { key } });
    if (!cached || cached.expiresAt <= new Date()) {
      return null;
    }
    return JSON.parse(cached.payload) as T;
  } catch {
    return null;
  }
}

export async function setCachedJson(key: string, provider: string, payload: unknown, ttlSeconds: number) {
  try {
    await prisma.providerCache.upsert({
      where: { key },
      create: {
        key,
        provider,
        payload: JSON.stringify(payload),
        expiresAt: new Date(Date.now() + ttlSeconds * 1000)
      },
      update: {
        payload: JSON.stringify(payload),
        expiresAt: new Date(Date.now() + ttlSeconds * 1000)
      }
    });
  } catch {
    // Cache failures should never block analysis.
  }
}

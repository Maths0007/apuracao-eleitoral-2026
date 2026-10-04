import type { Profile } from '../config/profiles';

export const TTL_RESUMO_MS = 30 * 1000;
export const TTL_CATALOGO_MS = 30 * 60 * 1000;

export const MENSAGEM_DESATUALIZADO =
  'Dados temporariamente indisponíveis para atualização. Exibindo a última informação recebida do TSE.' as const;

export type CacheEntry<T> = {
  data: T;
  cachedAt: number;
  obtidoEm: string;
  profileId: string;
};

export type CachedResult<T> =
  | {
      status: 'atualizado';
      data: T;
      obtidoEm: string;
      cached: boolean;
    }
  | {
      status: 'desatualizado';
      data: T;
      obtidoEm: string;
      mensagem: typeof MENSAGEM_DESATUALIZADO;
    }
  | {
      status: 'indisponivel';
      data: null;
      motivo: string;
    };

export function formatBrasiliaIso(date: Date = new Date()): string {
  const tzOffset = -3 * 60;
  const brasiliaDate = new Date(date.getTime() + (date.getTimezoneOffset() + tzOffset) * 60000);
  return brasiliaDate.toISOString().replace('Z', '-03:00');
}

export function buildProfileId(profile: Profile): string {
  return `${profile.mode}-${profile.year}-${profile.round}-${profile.election}-${profile.contract}`;
}

export function buildCacheKey(
  profile: Profile,
  resource: string,
  filters: Record<string, string | undefined> = {}
): string {
  const sortedFilters = Object.entries(filters)
    .filter(([, v]) => v !== undefined && v !== '')
    .sort(([a], [b]) => a.localeCompare(b));

  return JSON.stringify([
    profile.mode,
    profile.election,
    profile.round,
    profile.contract,
    resource,
    sortedFilters,
  ]);
}

export class CacheService {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string, profile: Profile): CacheEntry<T> | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;
    if (entry.profileId !== buildProfileId(profile)) return undefined;
    return entry;
  }

  set<T>(key: string, profile: Profile, data: T, obtidoEm: string, nowMs: number = Date.now()): void {
    this.store.set(key, {
      data,
      cachedAt: nowMs,
      obtidoEm,
      profileId: buildProfileId(profile),
    });
  }

  clear(): void {
    this.store.clear();
  }

  async getOrFetch<T>(options: {
    profile: Profile;
    resource: string;
    filters?: Record<string, string | undefined>;
    ttlMs: number;
    fetcher: () => Promise<T>;
    now?: () => number;
    nowBrasilia?: () => string;
  }): Promise<CachedResult<T>> {
    const now = options.now ? options.now() : Date.now();
    const nowBrasilia = options.nowBrasilia ? options.nowBrasilia() : formatBrasiliaIso();
    const key = buildCacheKey(options.profile, options.resource, options.filters);
    const existing = this.get<T>(key, options.profile);

    if (existing && now - existing.cachedAt < options.ttlMs) {
      return {
        status: 'atualizado',
        data: existing.data,
        obtidoEm: existing.obtidoEm,
        cached: true,
      };
    }

    try {
      const freshData = await options.fetcher();
      this.set(key, options.profile, freshData, nowBrasilia, now);
      return {
        status: 'atualizado',
        data: freshData,
        obtidoEm: nowBrasilia,
        cached: false,
      };
    } catch (err) {
      if (existing) {
        return {
          status: 'desatualizado',
          data: existing.data,
          obtidoEm: existing.obtidoEm,
          mensagem: MENSAGEM_DESATUALIZADO,
        };
      }
      return {
        status: 'indisponivel',
        data: null,
        motivo: err instanceof Error ? err.message : 'Fonte de dados indisponível',
      };
    }
  }
}

export const cacheService = new CacheService();

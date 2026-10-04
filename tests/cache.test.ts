import { describe, it, expect } from 'vitest';
import { profiles } from '../src/config/profiles';
import {
  CacheService,
  MENSAGEM_DESATUALIZADO,
  TTL_RESUMO_MS,
  buildCacheKey,
} from '../src/services/cache';

const p1 = profiles[0]!, p2 = profiles[1]!;

describe('Camada de Cache', () => {
  it('retorna dados em cache dentro do TTL', async () => {
    const cache = new CacheService();
    let fetchCount = 0;
    const fetcher = async () => {
      fetchCount++;
      return { total: 100 };
    };

    let fakeNow = 1_000_000;
    const res1 = await cache.getOrFetch({
      profile: p1,
      resource: 'resumo',
      ttlMs: TTL_RESUMO_MS,
      fetcher,
      now: () => fakeNow,
    });

    expect(res1.status).toBe('atualizado');
    expect(res1.data).toEqual({ total: 100 });
    expect(fetchCount).toBe(1);

    // Próxima chamada dentro de 30s
    fakeNow += 10_000;
    const res2 = await cache.getOrFetch({
      profile: p1,
      resource: 'resumo',
      ttlMs: TTL_RESUMO_MS,
      fetcher,
      now: () => fakeNow,
    });

    expect(res2.status).toBe('atualizado');
    if (res2.status === 'atualizado') {
      expect(res2.cached).toBe(true);
    }
    expect(fetchCount).toBe(1); // Não chamou a fonte novamente
  });

  it('em falha da fonte após expiração do TTL, devolve desatualizado com texto exato do AGENTS.md', async () => {
    const cache = new CacheService();
    let shouldFail = false;
    const fetcher = async () => {
      if (shouldFail) throw new Error('Falha de conexão com TSE');
      return { total: 200 };
    };

    let fakeNow = 1_000_000;
    const initial = await cache.getOrFetch({
      profile: p1,
      resource: 'resumo',
      ttlMs: TTL_RESUMO_MS,
      fetcher,
      now: () => fakeNow,
    });
    expect(initial.status).toBe('atualizado');

    // Avança o tempo além do TTL (31 segundos depois)
    fakeNow += 31_000;
    shouldFail = true;

    const stale = await cache.getOrFetch({
      profile: p1,
      resource: 'resumo',
      ttlMs: TTL_RESUMO_MS,
      fetcher,
      now: () => fakeNow,
    });

    expect(stale.status).toBe('desatualizado');
    if (stale.status === 'desatualizado') {
      expect(stale.data).toEqual({ total: 200 });
      expect(stale.mensagem).toBe(MENSAGEM_DESATUALIZADO);
      expect(stale.mensagem).toBe(
        'Dados temporariamente indisponíveis para atualização. Exibindo a última informação recebida do TSE.'
      );
    }
  });

  it('sem cópia anterior e com falha da fonte, devolve indisponivel', async () => {
    const cache = new CacheService();
    const fetcher = async () => {
      throw new Error('Servidor TSE inacessível');
    };

    const res = await cache.getOrFetch({
      profile: p1,
      resource: 'resumo',
      ttlMs: TTL_RESUMO_MS,
      fetcher,
    });

    expect(res.status).toBe('indisponivel');
    expect(res.data).toBeNull();
  });

  it('nunca reaproveita cache de outro perfil', async () => {
    const cache = new CacheService();
    const fetcherP1 = async () => ({ pleito: '406' });
    const fetcherP2 = async () => ({ pleito: '407' });

    await cache.getOrFetch({
      profile: p1,
      resource: 'resumo',
      ttlMs: TTL_RESUMO_MS,
      fetcher: fetcherP1,
    });

    const keyP1 = buildCacheKey(p1, 'resumo');
    const keyP2 = buildCacheKey(p2, 'resumo');
    expect(keyP1).not.toBe(keyP2);

    const fromP2 = await cache.getOrFetch({
      profile: p2,
      resource: 'resumo',
      ttlMs: TTL_RESUMO_MS,
      fetcher: fetcherP2,
    });

    expect(fromP2.data).toEqual({ pleito: '407' });
  });
});

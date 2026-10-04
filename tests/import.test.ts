import { describe, it, expect } from 'vitest';
import { unlink } from 'node:fs/promises';
import { profiles } from '../src/config/profiles';
import { SqliteRepository } from '../src/repositories/sqlite';
import { importProfileSamples } from '../src/services/import-service';
import { downloadOficialStream } from '../src/services/stream-download';

const p1 = profiles[0]!, p2 = profiles[1]!;

describe('Importação de amostras e stream', () => {
  it('importação é idempotente e rodar duas vezes não altera os totais', async () => {
    const repo = new SqliteRepository(':memory:');

    // 1ª importação
    const res1 = await importProfileSamples(p1, repo);
    expect(res1.outcomes.received).toBe(3);
    const summary1 = await repo.getSummary(p1);

    // 2ª importação
    const res2 = await importProfileSamples(p1, repo);
    expect(res2.outcomes.received).toBe(0);
    expect(res2.outcomes.unchanged).toBe(3);
    const summary2 = await repo.getSummary(p1);

    // Totais exatamente idênticos
    expect(summary1.totalSections).toBe(summary2.totalSections);
    expect(summary1.turnout).toBe(summary2.turnout);
    expect(summary1.whites).toBe(summary2.whites);
    expect(summary1.nulls).toBe(summary2.nulls);
    expect(summary1.candidates).toEqual(summary2.candidates);

    repo.close();
  });

  it('separa dados por perfil entre 1º e 2º turno', async () => {
    const repo = new SqliteRepository(':memory:');

    await importProfileSamples(p1, repo);
    await importProfileSamples(p2, repo);

    const sum1 = await repo.getSummary(p1);
    const sum2 = await repo.getSummary(p2);

    expect(sum1.totalSections).toBeGreaterThan(0);
    expect(sum2.totalSections).toBeGreaterThan(0);

    // O 2º turno de 2022 tem 2 candidatos presidenciais; o 1º tem 11 candidatos
    expect(sum2.candidates.length).toBeLessThan(sum1.candidates.length);

    repo.close();
  });

  it('downloadOficialStream verifica limite de tamanho', async () => {
    const mockFetcher = async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(100));
          controller.close();
        },
      });
      return new Response(stream, {
        status: 200,
        headers: { 'content-length': '100' },
      });
    };

    const dest = './temp-stream-test.bin';
    await expect(
      downloadOficialStream('https://cdn.tse.jus.br/test.zip', dest, {
        fetcher: mockFetcher as unknown as typeof fetch,
        maxBytes: 50,
      })
    ).rejects.toThrow('excede o limite');

    await unlink(dest).catch(() => {});
  });

  it('downloadOficialStream valida SHA-512 oficial quando fornecido', async () => {
    const content = new TextEncoder().encode('tse-stream-test-content');
    const mockFetcher = async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(content);
          controller.close();
        },
      });
      return new Response(stream, { status: 200 });
    };

    const dest = './temp-sha-test.bin';
    try {
      // SHA-512 errado deve falhar e excluir o arquivo
      await expect(
        downloadOficialStream('https://cdn.tse.jus.br/test.zip', dest, {
          fetcher: mockFetcher as unknown as typeof fetch,
          expectedSha512: 'wrong-hash-00000000',
        })
      ).rejects.toThrow('SHA-512 oficial divergente');

      // SHA-512 correto passa
      const result = await downloadOficialStream('https://cdn.tse.jus.br/test.zip', dest, {
        fetcher: mockFetcher as unknown as typeof fetch,
      });
      expect(result.bytes).toBe(content.length);

      const verified = await downloadOficialStream('https://cdn.tse.jus.br/test.zip', dest, {
        fetcher: mockFetcher as unknown as typeof fetch,
        expectedSha512: result.sha512,
      });
      expect(verified.sha512).toBe(result.sha512);
    } finally {
      await unlink(dest).catch(() => {});
    }
  });
});

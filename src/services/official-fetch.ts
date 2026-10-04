import { z } from 'zod';
export const OFFICIAL_HOSTS = Object.freeze(['dadosabertos.tse.jus.br','cdn.tse.jus.br','resultados.tse.jus.br']);
export function validateOfficialUrl(input: string): URL {
  const url = new URL(input);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !OFFICIAL_HOSTS.includes(url.hostname)) throw new Error('URL oficial não permitida');
  return url;
}
// Callers select a resource, never supply an address. Redirects are checked before fetching.
const resources = { configuration: 'https://resultados.tse.jus.br/oficial/comum/config/ele-c.json' } as const;
const resourceSchema = z.enum(['configuration']);
export async function fetchOficial(resource: keyof typeof resources, options: { fetcher?: typeof fetch; timeoutMs?: number; maxBytes?: number } = {}): Promise<Uint8Array> {
  if (typeof window !== 'undefined') throw new Error('Integração TSE exclusiva do servidor');
  const fetcher = options.fetcher ?? fetch;
  const maxBytes = options.maxBytes ?? 2_000_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('Tempo limite TSE')), options.timeoutMs ?? 10_000);
  try {
    let url = validateOfficialUrl(resources[resourceSchema.parse(resource)]);
    for (let redirect = 0; redirect <= 3; redirect++) {
      const response = await fetcher(url, { signal: controller.signal, redirect: 'manual' });
      if ([301,302,303,307,308].includes(response.status)) {
        await response.body?.cancel();
        const location = response.headers.get('location');
        if (!location) throw new Error('Redirecionamento sem destino');
        url = validateOfficialUrl(new URL(location, url).href); continue;
      }
      if (!response.ok) { await response.body?.cancel(); throw new Error(`TSE HTTP ${response.status}`); }
      const length = response.headers.get('content-length');
      if (length && Number(length) > maxBytes) { await response.body?.cancel(); throw new Error('Resposta TSE excede limite'); }
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Resposta TSE sem corpo');
      const chunks: Uint8Array[] = []; let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          size += value.length;
          if (size > maxBytes) throw new Error('Resposta TSE excede limite');
          chunks.push(value);
        }
      } finally { await reader.cancel(); reader.releaseLock(); }
      return Buffer.concat(chunks);
    }
    throw new Error('Limite de redirecionamentos');
  } finally { clearTimeout(timer); }
}

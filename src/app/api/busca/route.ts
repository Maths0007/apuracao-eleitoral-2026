import { z } from 'zod';
import { getRepository } from '../../../repositories/index';
import { cacheService, TTL_CATALOGO_MS } from '../../../services/cache';
import {
  createApiResponse,
  createErrorResponse,
  resolveRequestProfile,
} from '../../../services/api-response';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  q: z.string().max(50).optional(),
  uf: z.string().regex(/^[A-Z]{2}$/).optional(),
  zona: z.string().regex(/^\d+$/).optional(),
  secao: z.string().regex(/^\d+$/).optional(),
});

export async function GET(request: Request) {
  let profile;
  try {
    profile = resolveRequestProfile(request);
  } catch (err) {
    return createErrorResponse(request, null, err, 400);
  }

  const url = new URL(request.url);
  const rawParams = {
    q: url.searchParams.get('q') || undefined,
    uf: url.searchParams.get('uf') || undefined,
    zona: url.searchParams.get('zona') || undefined,
    secao: url.searchParams.get('secao') || undefined,
  };

  const parsed = querySchema.safeParse(rawParams);
  if (!parsed.success) {
    return createErrorResponse(
      request,
      profile,
      new Error(`Parâmetros inválidos: ${parsed.error.issues.map(i => i.message).join('; ')}`),
      400
    );
  }

  const { q, uf, zona, secao } = parsed.data;

  try {
    const repo = getRepository();
    const result = await cacheService.getOrFetch({
      profile,
      resource: 'localidades',
      filters: { search_q: q, search_uf: uf, search_zona: zona, search_secao: secao },
      ttlMs: TTL_CATALOGO_MS,
      fetcher: () => repo.searchSections(profile, { q, uf, zone: zona, section: secao }),
    });

    if (result.status === 'indisponivel') {
      return createApiResponse(
        request,
        {
          profile,
          status: 'indisponivel',
          motivo: result.motivo,
          dados: [],
        },
        { status: 503 }
      );
    }

    return createApiResponse(request, {
      profile,
      status: result.status,
      obtidoEm: result.obtidoEm,
      ...(result.status === 'desatualizado' ? { mensagem: result.mensagem } : {}),
      dados: result.data,
    });
  } catch (err) {
    return createErrorResponse(request, profile, err, 500);
  }
}

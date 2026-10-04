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
  numero: z.string().regex(/^\d+$/, 'Número do candidato deve conter apenas dígitos'),
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
    numero: url.searchParams.get('numero') ?? '',
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

  const { numero } = parsed.data;

  try {
    const repo = getRepository();
    const result = await cacheService.getOrFetch({
      profile,
      resource: 'candidatos',
      filters: { numero },
      ttlMs: TTL_CATALOGO_MS,
      fetcher: async () => {
        const found = await repo.getCandidateDetail(profile, numero);
        if (!found) throw new Error('Candidato não encontrado para este perfil');
        return found;
      },
    });

    if (result.status === 'indisponivel') {
      return createApiResponse(
        request,
        {
          profile,
          status: 'indisponivel',
          motivo: result.motivo,
          dados: null,
        },
        { status: result.motivo === 'Candidato não encontrado para este perfil' ? 404 : 503 }
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

import { getRepository } from '../../../repositories/index';
import { cacheService, TTL_RESUMO_MS } from '../../../services/cache';
import {
  createApiResponse,
  createErrorResponse,
  resolveRequestProfile,
} from '../../../services/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  let profile;
  try {
    profile = resolveRequestProfile(request);
  } catch (err) {
    return createErrorResponse(request, null, err, 400);
  }

  try {
    const repo = getRepository();
    const result = await cacheService.getOrFetch({
      profile,
      resource: 'resumo',
      ttlMs: TTL_RESUMO_MS,
      fetcher: () => repo.getSummary(profile),
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
        { status: 503 }
      );
    }

    if (result.data.totalSections === 0) {
      return createApiResponse(request, {
        profile,
        status: 'indisponivel',
        obtidoEm: result.obtidoEm,
        motivo:
          profile.mode === 'atual'
            ? 'Aguardando publicação oficial de boletins de urna para a eleição de 2026'
            : 'Nenhum boletim de urna importado para este perfil',
        dados: {
          totalSections: 0,
          turnout: null,
          whites: null,
          nulls: null,
          candidates: [],
          motivoAusencia: 'Dados ainda não totalizados',
        },
      });
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

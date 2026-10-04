import { z } from 'zod';
import { getRepository } from '../../../repositories/index';
import { cacheService, TTL_CATALOGO_MS } from '../../../services/cache';
import {
  createApiResponse,
  createErrorResponse,
  resolveRequestProfile,
} from '../../../services/api-response';

export const dynamic = 'force-dynamic';

const sectionParamsSchema = z.object({
  uf: z.string().regex(/^[A-Z]{2}$/, 'UF deve ser sigla de 2 letras maiúsculas'),
  municipio: z.string().regex(/^\d+$/, 'Código do município deve conter apenas dígitos'),
  zona: z.string().regex(/^\d+$/, 'Zona deve conter apenas dígitos'),
  secao: z.string().regex(/^\d+$/, 'Seção deve conter apenas dígitos'),
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
    uf: url.searchParams.get('uf') ?? '',
    municipio: url.searchParams.get('municipio') ?? '',
    zona: url.searchParams.get('zona') ?? '',
    secao: url.searchParams.get('secao') ?? '',
  };

  const parsed = sectionParamsSchema.safeParse(rawParams);
  if (!parsed.success) {
    return createErrorResponse(
      request,
      profile,
      new Error(`Parâmetros inválidos: ${parsed.error.issues.map(i => i.message).join('; ')}`),
      400
    );
  }

  const { uf, municipio, zona, secao } = parsed.data;

  try {
    const repo = getRepository();
    const result = await cacheService.getOrFetch({
      profile,
      resource: 'secao',
      filters: { uf, municipio, zona, secao },
      ttlMs: TTL_CATALOGO_MS,
      fetcher: async () => {
        const found = await repo.getSection(profile, {
          uf,
          locality: municipio,
          zone: zona,
          section: secao,
        });
        if (!found) throw new Error('Seção eleitoral não encontrada');
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
        { status: result.motivo === 'Seção eleitoral não encontrada' ? 404 : 503 }
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

import { z } from 'zod';
import { getRepository } from '../../../repositories/index';
import { cacheService, TTL_CATALOGO_MS } from '../../../services/cache';
import {
  createApiResponse,
  createErrorResponse,
  resolveRequestProfile,
} from '../../../services/api-response';

export const dynamic = 'force-dynamic';

const querySchema = z
  .object({
    uf: z.string().regex(/^[A-Z]{2}$/, 'UF deve ser sigla de 2 letras').optional(),
    municipio: z.string().regex(/^\d+$/, 'Código do município deve conter apenas dígitos').optional(),
    zona: z.string().regex(/^\d+$/, 'Zona deve conter apenas dígitos').optional(),
  })
  .refine(
    data => {
      if (data.zona && !data.municipio) return false;
      if (data.municipio && !data.uf) return false;
      return true;
    },
    { message: 'Filtros dependentes: zona exige município, município exige UF' }
  );

export async function GET(request: Request) {
  let profile;
  try {
    profile = resolveRequestProfile(request);
  } catch (err) {
    return createErrorResponse(request, null, err, 400);
  }

  const url = new URL(request.url);
  const rawParams = {
    uf: url.searchParams.get('uf') || undefined,
    municipio: url.searchParams.get('municipio') || undefined,
    zona: url.searchParams.get('zona') || undefined,
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

  const { uf, municipio, zona } = parsed.data;

  try {
    const repo = getRepository();
    const result = await cacheService.getOrFetch({
      profile,
      resource: 'localidades',
      filters: { uf, municipio, zona },
      ttlMs: TTL_CATALOGO_MS,
      fetcher: () =>
        repo.getLocalities(profile, {
          uf,
          locality: municipio,
          zone: zona,
        }),
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

import { getRepository } from '../../../repositories/index';
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
    const lastImport = await repo.getLastImport(profile);
    const stats = await repo.getImportStats(profile);

    return createApiResponse(request, {
      profile,
      status: 'atualizado',
      dados: {
        perfilAtivo: profile,
        ultimaImportacao: lastImport ?? null,
        motivoUltimaImportacao: lastImport ? null : 'Nenhuma importação registrada para este perfil',
        registrosProcessados: stats.processed,
        erros: stats.errors,
      },
    });
  } catch (err) {
    return createErrorResponse(request, profile, err, 500);
  }
}

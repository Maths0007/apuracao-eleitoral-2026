import { profiles, serverProfile, type Profile } from '../config/profiles';
import { NaoConfirmado } from '../core/errors';
import { formatBrasiliaIso } from './cache';
import { extractClientIp, rateLimiter } from './rate-limit';
import { applySecurityHeaders } from './security-headers';

export const FONTE_OFICIAL = 'Tribunal Superior Eleitoral — TSE';

export function getHistoricalNotice(profile: Profile): string | null {
  if (profile.mode !== 'historico') return null;
  return `ENSAIO — DADOS HISTÓRICOS OFICIAIS DO TSE — ELEIÇÃO ${profile.year} — ${profile.round}º TURNO`;
}

export function resolveRequestProfile(request: Request): Profile {
  const url = new URL(request.url);
  const perfilParam = url.searchParams.get('perfil');
  const modo = url.searchParams.get('modo');
  const ano = url.searchParams.get('ano');
  const turno = url.searchParams.get('turno');

  if (perfilParam) {
    const clean = perfilParam.trim().toLowerCase();
    const found = profiles.find(p => {
      const k1 = `${p.mode}-${p.year}-${p.round}`;
      const k2 = `${p.year}-${p.round}`;
      return clean === k1 || clean === k2;
    });
    if (!found) throw new NaoConfirmado('docs/lacunas.md#contratos-nao-confirmados: perfil-eleitoral');
    return structuredClone(found);
  }

  if (modo || ano || turno) {
    const found = profiles.find(p => p.mode === modo && p.year === ano && p.round === turno);
    if (!found) throw new NaoConfirmado('docs/lacunas.md#contratos-nao-confirmados: perfil-eleitoral');
    return structuredClone(found);
  }

  return serverProfile(process.env);
}

export type ApiResponsePayload<T> = {
  profile: Profile;
  status: 'atualizado' | 'desatualizado' | 'indisponivel';
  dados: T;
  obtidoEm?: string;
  mensagem?: string | null;
  motivo?: string | null;
};

export function createApiResponse<T>(
  request: Request,
  payload: ApiResponsePayload<T>,
  init: ResponseInit = {}
): Response {
  const ip = extractClientIp(request);
  const rate = rateLimiter.check(ip);

  const headers = new Headers(init.headers);
  applySecurityHeaders(headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');

  if (!rate.allowed) {
    headers.set('Retry-After', String(rate.retryAfter ?? 60));
    return new Response(
      JSON.stringify({
        perfil: payload.profile,
        fonte: FONTE_OFICIAL,
        obtidoEm: formatBrasiliaIso(),
        aviso: getHistoricalNotice(payload.profile),
        status: 'indisponivel',
        motivo: 'Limite de requisições excedido. Tente novamente mais tarde.',
        dados: null,
      }),
      { status: 429, headers }
    );
  }

  const envelope = {
    perfil: payload.profile,
    fonte: FONTE_OFICIAL,
    obtidoEm: payload.obtidoEm ?? formatBrasiliaIso(),
    aviso: getHistoricalNotice(payload.profile),
    status: payload.status,
    ...(payload.mensagem ? { mensagem: payload.mensagem } : {}),
    ...(payload.motivo ? { motivo: payload.motivo } : {}),
    dados: payload.dados,
  };

  return new Response(JSON.stringify(envelope), {
    ...init,
    headers,
  });
}

export function createErrorResponse(
  request: Request,
  profile: Profile | null,
  error: unknown,
  status: number = 400
): Response {
  const headers = new Headers();
  applySecurityHeaders(headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');

  const message = error instanceof Error ? error.message : String(error);
  const fallbackProfile: Profile = profile ?? {
    mode: 'atual',
    year: '2026',
    round: '1',
    cycle: 'ele2026',
    pleito: '3220',
    election: '6257',
    office: '1',
    contract: 'ele-c-2026-v1',
    channel: 'configuracao',
    source: 'TSE',
  };

  return new Response(
    JSON.stringify({
      perfil: fallbackProfile,
      fonte: FONTE_OFICIAL,
      obtidoEm: formatBrasiliaIso(),
      aviso: getHistoricalNotice(fallbackProfile),
      status: 'indisponivel',
      motivo: message,
      dados: null,
    }),
    { status, headers }
  );
}

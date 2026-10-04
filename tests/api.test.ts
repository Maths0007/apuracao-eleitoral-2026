import { describe, it, expect, beforeEach } from 'vitest';
import { profiles } from '../src/config/profiles';
import { setRepository } from '../src/repositories/index';
import { SqliteRepository } from '../src/repositories/sqlite';
import { importProfileSamples } from '../src/services/import-service';
import { cacheService } from '../src/services/cache';
import { rateLimiter, RateLimiter } from '../src/services/rate-limit';
import { GET as getResumo } from '../src/app/api/resumo/route';
import { GET as getCandidatos } from '../src/app/api/candidatos/route';
import { GET as getLocalidades } from '../src/app/api/localidades/route';
import { GET as getSecao } from '../src/app/api/secao/route';
import { GET as getExterior } from '../src/app/api/exterior/route';
import { GET as getStatus } from '../src/app/api/status/route';
import { GET as getCandidato } from '../src/app/api/candidato/route';
import { GET as getBusca } from '../src/app/api/busca/route';

const p1 = profiles[0]!;

describe('API Route Handlers', () => {
  let repo: SqliteRepository;

  beforeEach(async () => {
    cacheService.clear();
    rateLimiter.reset();
    repo = new SqliteRepository(':memory:');
    setRepository(repo);
    await importProfileSamples(p1, repo);
  });

  it('GET /api/resumo retorna totais com envelope, aviso de ensaio e cabeçalhos de segurança', async () => {
    const req = new Request('http://localhost:3000/api/resumo?perfil=2022-1');
    const res = await getResumo(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-security-policy')).toBe("default-src 'self'");
    expect(res.headers.get('x-frame-options')).toBe('DENY');

    const json = await res.json();
    expect(json.fonte).toBe('Tribunal Superior Eleitoral — TSE');
    expect(json.aviso).toBe('ENSAIO — DADOS HISTÓRICOS OFICIAIS DO TSE — ELEIÇÃO 2022 — 1º TURNO');
    expect(json.perfil.year).toBe('2022');
    expect(json.status).toBe('atualizado');
    expect(json.dados.totalSections).toBe(3);
    expect(json.dados.turnout).toBeGreaterThan(0);
    expect(json.dados.candidates.length).toBeGreaterThan(0);
  });

  it('GET /api/resumo para perfil sem dados retorna null com motivo, nunca zero fictício', async () => {
    const emptyRepo = new SqliteRepository(':memory:');
    setRepository(emptyRepo);

    const req = new Request('http://localhost:3000/api/resumo?perfil=2022-2');
    const res = await getResumo(req);

    const json = await res.json();
    expect(json.status).toBe('indisponivel');
    expect(json.dados.turnout).toBeNull();
    expect(json.dados.whites).toBeNull();
    expect(json.dados.nulls).toBeNull();
    expect(json.dados.motivoAusencia).toBe('Dados ainda não totalizados');

    emptyRepo.close();
  });

  it('GET /api/candidatos retorna lista ordenada alfabeticamente', async () => {
    const req = new Request('http://localhost:3000/api/candidatos?perfil=2022-1');
    const res = await getCandidatos(req);
    const json = await res.json();

    expect(json.status).toBe('atualizado');
    const cands = json.dados as { number: string; name: string | null; party: string | null }[];
    expect(cands.length).toBeGreaterThan(0);

    const names = cands.map(c => c.name);
    const sorted = [...names].sort((a, b) => (a ?? '').localeCompare(b ?? '', 'pt-BR'));
    expect(names).toEqual(sorted);
  });

  it('GET /api/localidades aplica filtros dependentes e valida com Zod', async () => {
    // 1. Sem filtro: lista UFs
    const reqUfs = new Request('http://localhost:3000/api/localidades?perfil=2022-1');
    const resUfs = await getLocalidades(reqUfs);
    const jsonUfs = await resUfs.json();
    expect(jsonUfs.dados.level).toBe('ufs');
    expect(jsonUfs.dados.ufs).toContain('AC');

    // 2. Com UF: lista municípios
    const reqMun = new Request('http://localhost:3000/api/localidades?perfil=2022-1&uf=AC');
    const resMun = await getLocalidades(reqMun);
    const jsonMun = await resMun.json();
    expect(jsonMun.dados.level).toBe('localidades');
    expect(jsonMun.dados.localidades[0].name).toBeNull();
    expect(jsonMun.dados.localidades[0].missingNameReason).toContain('não disponível');

    // 3. Filtro inválido: zona sem município
    const reqBad = new Request('http://localhost:3000/api/localidades?perfil=2022-1&zona=1');
    const resBad = await getLocalidades(reqBad);
    expect(resBad.status).toBe(400);
    const jsonBad = await resBad.json();
    expect(jsonBad.motivo).toContain('Filtros dependentes');
  });

  it('GET /api/secao valida parâmetros e retorna 404 quando seção não existe', async () => {
    // Parâmetro ausente
    const reqIncomplete = new Request('http://localhost:3000/api/secao?perfil=2022-1&uf=AC');
    const resIncomplete = await getSecao(reqIncomplete);
    expect(resIncomplete.status).toBe(400);

    // Seção inexistente
    const reqMissing = new Request(
      'http://localhost:3000/api/secao?perfil=2022-1&uf=AC&municipio=99999&zona=9999&secao=9999'
    );
    const resMissing = await getSecao(reqMissing);
    expect(resMissing.status).toBe(404);
    const jsonMissing = await resMissing.json();
    expect(jsonMissing.status).toBe('indisponivel');
    expect(jsonMissing.motivo).toBe('Seção eleitoral não encontrada');

    // Seção existente
    const reqFound = new Request(
      'http://localhost:3000/api/secao?perfil=2022-1&uf=AC&municipio=1392&zona=1&secao=3'
    );
    const resFound = await getSecao(reqFound);
    expect(resFound.status).toBe(200);
    const jsonFound = await resFound.json();
    expect(jsonFound.status).toBe('atualizado');
    expect(jsonFound.dados.section).toBe('3');
    expect(jsonFound.dados.turnout).toBe(155);
  });

  it('GET /api/exterior exibe localidades do exterior com país indisponível', async () => {
    const req = new Request('http://localhost:3000/api/exterior?perfil=2022-1');
    const res = await getExterior(req);
    const json = await res.json();

    expect(json.status).toBe('atualizado');
    const exterior = json.dados as { locality: string; country: null; countryLabel: string; zones: string[] }[];
    expect(exterior.length).toBeGreaterThan(0);
    for (const item of exterior) {
      expect(item.country).toBeNull();
      expect(item.countryLabel).toBe('país indisponível');
    }
  });

  it('GET /api/status retorna perfil ativo e trilha de auditoria', async () => {
    const req = new Request('http://localhost:3000/api/status?perfil=2022-1');
    const res = await getStatus(req);
    const json = await res.json();

    expect(json.status).toBe('atualizado');
    expect(json.dados.perfilAtivo.year).toBe('2022');
    expect(json.dados.ultimaImportacao).toBeDefined();
    expect(json.dados.registrosProcessados).toBeGreaterThan(0);
  });

  it('bloqueia requisições em excesso com HTTP 429 e cabeçalho Retry-After', async () => {
    const customLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 2 });
    const ip = '10.0.0.1';

    const r1 = customLimiter.check(ip);
    expect(r1.allowed).toBe(true);

    const r2 = customLimiter.check(ip);
    expect(r2.allowed).toBe(true);

    const r3 = customLimiter.check(ip);
    expect(r3.allowed).toBe(false);
    expect(r3.retryAfter).toBeGreaterThan(0);
  });

  it('rejeita perfil não confirmado com referência em docs/lacunas.md', async () => {
    const req = new Request('http://localhost:3000/api/resumo?perfil=2018-1');
    const res = await getResumo(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.motivo).toContain('docs/lacunas.md#contratos-nao-confirmados: perfil-eleitoral');
  });

  it('GET /api/candidato retorna detalhes factuais do candidato ou 404 quando inexistente', async () => {
    // Candidato inexistente
    const reqNotFound = new Request('http://localhost:3000/api/candidato?perfil=2022-1&numero=99999');
    const resNotFound = await getCandidato(reqNotFound);
    expect(resNotFound.status).toBe(404);

    // Candidato existente (ex: 13)
    const reqFound = new Request('http://localhost:3000/api/candidato?perfil=2022-1&numero=13');
    const resFound = await getCandidato(reqFound);
    expect(resFound.status).toBe(200);
    const jsonFound = await resFound.json();
    expect(jsonFound.dados.number).toBe('13');
    expect(jsonFound.dados.totalVotes).toBeGreaterThan(0);
    expect(jsonFound.dados.votesByUf.length).toBeGreaterThan(0);
  });

  it('GET /api/busca busca seções no banco e retorna array vazio quando não encontrar', async () => {
    // Busca sem resultado
    const reqEmpty = new Request('http://localhost:3000/api/busca?perfil=2022-1&q=9999999');
    const resEmpty = await getBusca(reqEmpty);
    expect(resEmpty.status).toBe(200);
    const jsonEmpty = await resEmpty.json();
    expect(jsonEmpty.dados).toEqual([]);

    // Busca com resultado por zona
    const reqFound = new Request('http://localhost:3000/api/busca?perfil=2022-1&q=1');
    const resFound = await getBusca(reqFound);
    expect(resFound.status).toBe(200);
    const jsonFound = await resFound.json();
    expect(jsonFound.dados.length).toBeGreaterThan(0);
    expect(jsonFound.dados[0].zone).toBe('1');
  });

  it('perfil histórico configurado com ELECTION_MODE=historical ativa ensaio e exibe banner', async () => {
    const originalEnv = { ...process.env };
    try {
      process.env.ELECTION_MODE = 'historical';
      process.env.ELECTION_YEAR = '2022';
      process.env.ELECTION_ROUND = '1';

      // Requisição sem parâmetro explícito de URL (como o usuário comum no navegador)
      const reqStatus = new Request('http://localhost:3000/api/status');
      const resStatus = await getStatus(reqStatus);
      const jsonStatus = await resStatus.json();

      expect(jsonStatus.status).toBe('atualizado');
      expect(jsonStatus.dados.perfilAtivo.mode).toBe('historico');
      expect(jsonStatus.dados.perfilAtivo.year).toBe('2022');
      expect(jsonStatus.dados.perfilAtivo.round).toBe('1');
      expect(jsonStatus.aviso).toBe('ENSAIO — DADOS HISTÓRICOS OFICIAIS DO TSE — ELEIÇÃO 2022 — 1º TURNO');

      const reqResumo = new Request('http://localhost:3000/api/resumo');
      const resResumo = await getResumo(reqResumo);
      const jsonResumo = await resResumo.json();

      expect(jsonResumo.aviso).toBe('ENSAIO — DADOS HISTÓRICOS OFICIAIS DO TSE — ELEIÇÃO 2022 — 1º TURNO');
      expect(jsonResumo.dados.totalSections).toBe(3);
    } finally {
      process.env = originalEnv;
    }
  });

  it('sem variáveis de ambiente, padrão é 2026 e nunca exibe dados de 2022', async () => {
    const originalEnv = { ...process.env };
    try {
      delete process.env.ELECTION_MODE;
      delete process.env.ELECTION_YEAR;
      delete process.env.ELECTION_ROUND;

      const reqStatus = new Request('http://localhost:3000/api/status');
      const resStatus = await getStatus(reqStatus);
      const jsonStatus = await resStatus.json();

      expect(jsonStatus.status).toBe('atualizado');
      expect(jsonStatus.dados.perfilAtivo.mode).toBe('atual');
      expect(jsonStatus.dados.perfilAtivo.year).toBe('2026');
      expect(jsonStatus.dados.perfilAtivo.round).toBe('1');
      expect(jsonStatus.aviso).toBeNull();

      const reqResumo = new Request('http://localhost:3000/api/resumo');
      const resResumo = await getResumo(reqResumo);
      const jsonResumo = await resResumo.json();

      // Não traz dados de 2022
      expect(jsonResumo.status).toBe('indisponivel');
      expect(jsonResumo.dados.totalSections).toBe(0);
      expect(jsonResumo.dados.turnout).toBeNull();
      expect(jsonResumo.dados.whites).toBeNull();
      expect(jsonResumo.dados.nulls).toBeNull();
      expect(jsonResumo.aviso).toBeNull();
      expect(jsonResumo.motivo).toContain('Aguardando publicação oficial');
    } finally {
      process.env = originalEnv;
    }
  });
});

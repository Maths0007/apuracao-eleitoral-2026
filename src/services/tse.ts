import type { Profile } from '../config/profiles';
import { NaoConfirmado, ContratoInesperado } from '../core/errors';
import { normalizeBu, type ValidationLogger } from '../core/normalize';
import { parseBu } from '../parsers/bu';
import { parseConfiguration } from '../parsers/configuration';
import type { Repository } from '../repositories/repository';
import { fetchOficial } from './official-fetch';
export { parseBu } from '../parsers/bu';
export { parseHistory } from '../parsers/history';
export { parseConfiguration } from '../parsers/configuration';
export { normalizeBu } from '../core/normalize';
export async function loadConfiguration() {
  const bytes = await fetchOficial('configuration');
  return parseConfiguration(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
}
export async function ingestBu(bytes: Uint8Array, profile: Profile, repository: Repository, coverage: { completeSectionKeys: readonly string[]; evidence: string }, log?: ValidationLogger) {
  const results = normalizeBu(parseBu(bytes), profile, log);
  if (!coverage.evidence.trim() || results.some(result => !coverage.completeSectionKeys.includes(result.key))) throw new ContratoInesperado('Completude da seção não comprovada; recorte não substitui seção completa');
  const outcomes = [];
  for (const result of results) {
    if (result.validation !== 'validado') { await repository.quarantine(result); outcomes.push('quarantined' as const); }
    else outcomes.push(await repository.replaceCompleteSection(result));
  }
  return outcomes;
}
export const UNCONFIRMED = ['municipios','configuracao-2022','zonas-secoes','pais-exterior','acompanhamento-ea14-ea15','resultados-ea04','bu-ea17','bu-binario-assinatura','votacao-secao','agregados-reconciliacao','secoes-sem-resultado','cronologia-secao','eleicao-2018','perfil-eleitoral'] as const;
export function naoConfirmado(feature: typeof UNCONFIRMED[number]): never { throw new NaoConfirmado(`docs/lacunas.md#contratos-nao-confirmados: ${feature}`); }

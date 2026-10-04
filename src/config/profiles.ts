import { z } from 'zod';
import data from './profiles.json';
import { NaoConfirmado } from '../core/errors';
const schema = z.object({ mode: z.enum(['atual', 'historico']), year: z.string().regex(/^\d{4}$/), round: z.enum(['1','2']), cycle: z.string(), pleito: z.string(), election: z.string(), office: z.string(), contract: z.string(), channel: z.enum(['bu-csv','configuracao']), source: z.string().min(1) }).strict();
export type Profile = z.infer<typeof schema>;
export const profiles = z.array(schema).parse(data);
export function serverProfile(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): Profile {
  const rawMode = env.ELECTION_MODE;
  const rawYear = env.ELECTION_YEAR;
  const rawRound = env.ELECTION_ROUND;

  // Sem variáveis, o padrão continua sendo a eleição atual de 2026 (1º turno)
  if (!rawMode && !rawYear && !rawRound) {
    const defaultProfile = profiles.find(p => p.mode === 'atual' && p.year === '2026' && p.round === '1');
    if (!defaultProfile) throw new NaoConfirmado('docs/lacunas.md#contratos-nao-confirmados: perfil-eleitoral');
    return structuredClone(defaultProfile);
  }

  // Normaliza 'historical' para 'historico' conforme documentado em .env.example
  const mode = rawMode === 'historical' ? 'historico' : rawMode;
  const year = rawYear;
  const round = rawRound;

  const profile = profiles.find(p => p.mode === mode && p.year === year && p.round === round);
  if (!profile) throw new NaoConfirmado('docs/lacunas.md#contratos-nao-confirmados: perfil-eleitoral');
  return structuredClone(profile);
}

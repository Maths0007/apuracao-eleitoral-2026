import { z } from 'zod';
import data from './profiles.json';
import { NaoConfirmado } from '../core/errors';
const schema = z.object({ mode: z.enum(['atual', 'historico']), year: z.string().regex(/^\d{4}$/), round: z.enum(['1','2']), cycle: z.string(), pleito: z.string(), election: z.string(), office: z.string(), contract: z.string(), channel: z.enum(['bu-csv','configuracao']), source: z.string().min(1) }).strict();
export type Profile = z.infer<typeof schema>;
export const profiles = z.array(schema).parse(data);
export function serverProfile(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): Profile {
  const profile = profiles.find(p => p.mode === env.ELECTION_MODE && p.year === env.ELECTION_YEAR && p.round === env.ELECTION_ROUND);
  if (!profile) throw new NaoConfirmado('docs/lacunas.md#contratos-nao-confirmados: perfil-eleitoral');
  return structuredClone(profile);
}

import { z } from 'zod';
import { ContratoInesperado } from '../core/errors';
const text = z.string();
const office = z.object({ cd: text, ds: text, tp: text }).strict();
const election = z.object({ cd: text, cdt2: text, sqele: text.optional(), nm: text, t: text, tp: text, abr: z.array(z.object({ cd: text, mu: z.array(z.object({ cd: text, cdi: text }).strict()).optional(), cp: z.array(office) }).strict()) }).strict();
export const configurationSchema = z.object({ dg: text, hg: text, f: text, idg: text, arq: z.array(z.object({ tp: text, dir: text }).strict()), pl: z.array(z.object({ cd: text, cdpr: text, c: text, dt: text, dtlim: text, e: z.array(election) }).strict()) }).strict();
export type Configuration = z.infer<typeof configurationSchema>;
export function parseConfiguration(input: unknown): Configuration {
  const parsed = configurationSchema.safeParse(input);
  if (!parsed.success) throw new ContratoInesperado(parsed.error.message);
  return parsed.data;
}

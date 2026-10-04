import fs from 'node:fs';

if (!fs.existsSync('.env.local')) {
  const mode = process.env.ELECTION_MODE ?? 'atual';
  const year = process.env.ELECTION_YEAR ?? '2026';
  const round = process.env.ELECTION_ROUND ?? '1';
  console.log(`[Aviso] .env.local não encontrado. Perfil ativo: ${mode} ${year} (${round}º turno)`);
}

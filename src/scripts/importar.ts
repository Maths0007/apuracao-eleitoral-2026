import { getRepository } from '../repositories/index';
import { findProfileByIdentifier, importProfileSamples } from '../services/import-service';
import { serverProfile } from '../config/profiles';

async function main() {
  const args = process.argv.slice(2);
  const targetArg = args[0];
  let profile;
  if (targetArg) {
    profile = findProfileByIdentifier(targetArg);
  } else {
    try {
      profile = serverProfile();
    } catch {
      // Sem perfil definido no ambiente
    }
  }

  if (!profile) {
    console.error('Perfil eleitoral não informado ou não reconhecido.');
    console.error('Uso: npm run importar -- <2022-1 | 2022-2 | historico-2022-1 | historico-2022-2>');
    process.exit(1);
  }

  console.log(`Iniciando importação para o perfil: ${profile.mode} ${profile.year} turno ${profile.round}...`);
  const repo = getRepository();
  try {
    const result = await importProfileSamples(profile, repo);
    console.log(`Arquivos processados: ${result.filesProcessed}`);
    console.log(`Seções processadas: ${result.totalSections}`);
    console.log(
      `Resultados: recebidas=${result.outcomes.received}, atualizadas=${result.outcomes.updated}, inalteradas=${result.outcomes.unchanged}, quarentena=${result.outcomes.quarantined}`
    );
  } finally {
    repo.close?.();
  }
}

main().catch(err => {
  console.error('Erro na importação:', err);
  process.exit(1);
});

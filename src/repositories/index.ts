import type { Repository } from './repository';
import { MemoryRepository } from './memory';
import { SqliteRepository } from './sqlite';

export * from './repository';
export { MemoryRepository } from './memory';
export { SqliteRepository } from './sqlite';

let globalRepository: Repository | null = null;

export function getRepository(): Repository {
  if (globalRepository) return globalRepository;
  const dbType = process.env.DATABASE_TYPE;
  if (dbType === 'memory') {
    globalRepository = new MemoryRepository();
    return globalRepository;
  }
  const dbPath = process.env.DATABASE_PATH || './data/eleicoes.sqlite';
  globalRepository = new SqliteRepository(dbPath);
  return globalRepository;
}

export function setRepository(repo: Repository | null): void {
  globalRepository = repo;
}

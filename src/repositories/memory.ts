import type { PollingStationResult } from '../core/normalize';
import type { Repository } from './repository';
// Test implementation only. No production persistence guarantees.
export class MemoryRepository implements Repository {
  private records = new Map<string, PollingStationResult>();
  private rejected = new Map<string, PollingStationResult>();
  async get(key: string) { const value = this.records.get(key); return value ? structuredClone(value) : undefined; }
  async quarantine(value: PollingStationResult) { this.rejected.set(value.key, structuredClone(value)); }
  async getQuarantined(key: string) { const value = this.rejected.get(key); return value ? structuredClone(value) : undefined; }
  async replaceCompleteSection(value: PollingStationResult) {
    if (value.validation !== 'validado') throw new Error('Resultado não validado');
    const previous = this.records.get(value.key);
    if (previous?.revision === value.revision) return 'unchanged' as const;
    this.records.set(value.key, structuredClone(value));
    return previous ? 'updated' as const : 'received' as const;
  }
}

import type { PollingStationResult } from '../core/normalize';
export interface Repository {
  get(key: string): Promise<PollingStationResult | undefined>;
  // Must atomically replace the entire section, not increment vote counts.
  replaceCompleteSection(value: PollingStationResult): Promise<'unchanged' | 'received' | 'updated'>;
  quarantine(value: PollingStationResult): Promise<void>;
}

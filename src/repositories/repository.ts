import type { PollingStationResult } from '../core/normalize';
import type { Profile } from '../config/profiles';

export type CandidateSummary = {
  number: string;
  name: string | null;
  party: string | null;
  votes?: number | null;
};

export type SummaryResult = {
  totalSections: number;
  turnout: number | null;
  whites: number | null;
  nulls: number | null;
  candidates: { number: string; name: string | null; party: string | null; votes: number | null }[];
  missingReason?: string | null;
};

export type LocalityResult =
  | { level: 'ufs'; ufs: string[] }
  | { level: 'localidades'; uf: string; localidades: { code: string; name: null; missingNameReason: string }[] }
  | { level: 'zonas'; uf: string; locality: string; zonas: string[] }
  | { level: 'secoes'; uf: string; locality: string; zone: string; secoes: string[] };

export type ExteriorLocalityResult = {
  locality: string;
  country: null;
  countryLabel: 'país indisponível';
  zones: string[];
};

export type ImportLogEntry = {
  origin: string;
  url: string;
  timestamp: string;
  size: number;
  hash: string;
  recordCount: number;
  status: 'sucesso' | 'erro' | 'quarentena';
  errorMessage?: string | null;
  profileMode: string;
  profileYear: string;
  profileRound: string;
  profileElection: string;
};

export interface Repository {
  get(key: string): Promise<PollingStationResult | undefined>;
  // Must atomically replace the entire section, not increment vote counts.
  replaceCompleteSection(value: PollingStationResult): Promise<'unchanged' | 'received' | 'updated'>;
  quarantine(value: PollingStationResult): Promise<void>;
  getQuarantined(key: string): Promise<PollingStationResult | undefined>;

  getSummary(profile: Profile): Promise<SummaryResult>;
  getCandidates(profile: Profile): Promise<CandidateSummary[]>;
  getLocalities(profile: Profile, filter?: { uf?: string; locality?: string; zone?: string }): Promise<LocalityResult>;
  getSection(profile: Profile, filter: { uf: string; locality: string; zone: string; section: string }): Promise<PollingStationResult | undefined>;
  getExteriorLocalities(profile: Profile): Promise<ExteriorLocalityResult[]>;

  recordImport(entry: ImportLogEntry): Promise<void>;
  getLastImport(profile?: Profile): Promise<ImportLogEntry | undefined>;
  getImportStats(profile?: Profile): Promise<{ processed: number; errors: number }>;
  close?(): void;
}


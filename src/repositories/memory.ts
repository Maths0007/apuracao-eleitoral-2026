import type { PollingStationResult } from '../core/normalize';
import type { Profile } from '../config/profiles';
import type {
  CandidateDetail,
  CandidateSummary,
  ExteriorLocalityResult,
  ImportLogEntry,
  LocalityResult,
  Repository,
  SearchSectionResult,
  SummaryResult,
} from './repository';

// Test implementation only. No production persistence guarantees.
export class MemoryRepository implements Repository {
  private records = new Map<string, PollingStationResult>();
  private rejected = new Map<string, PollingStationResult>();
  private imports: ImportLogEntry[] = [];

  async get(key: string) {
    const value = this.records.get(key);
    return value ? structuredClone(value) : undefined;
  }

  async quarantine(value: PollingStationResult) {
    this.rejected.set(value.key, structuredClone(value));
  }

  async getQuarantined(key: string) {
    const value = this.rejected.get(key);
    return value ? structuredClone(value) : undefined;
  }

  async replaceCompleteSection(value: PollingStationResult) {
    if (value.validation !== 'validado') throw new Error('Resultado não validado');
    const previous = this.records.get(value.key);
    if (previous?.revision === value.revision) return 'unchanged' as const;
    this.records.set(value.key, structuredClone(value));
    return previous ? ('updated' as const) : ('received' as const);
  }

  private filterByProfile(profile: Profile): PollingStationResult[] {
    return Array.from(this.records.values()).filter(
      r =>
        r.profile.mode === profile.mode &&
        r.profile.year === profile.year &&
        r.profile.round === profile.round &&
        r.profile.election === profile.election
    );
  }

  async getSummary(profile: Profile): Promise<SummaryResult> {
    const sections = this.filterByProfile(profile);
    if (sections.length === 0) {
      return {
        totalSections: 0,
        turnout: null,
        whites: null,
        nulls: null,
        candidates: [],
        missingReason: 'Nenhum boletim de urna recebido para este perfil',
      };
    }

    let turnout = 0;
    let whites = 0;
    let nulls = 0;
    let hasNullTurnout = false;
    let hasNullWhites = false;
    let hasNullNulls = false;

    const candMap = new Map<string, { number: string; name: string | null; party: string | null; votes: number }>();

    for (const sec of sections) {
      if (sec.turnout === null) hasNullTurnout = true;
      else turnout += sec.turnout;

      if (sec.whites === null) hasNullWhites = true;
      else whites += sec.whites;

      if (sec.nulls === null) hasNullNulls = true;
      else nulls += sec.nulls;

      for (const cand of sec.candidates) {
        const existing = candMap.get(cand.number) ?? {
          number: cand.number,
          name: cand.name,
          party: cand.party,
          votes: 0,
        };
        if (cand.votes !== null) existing.votes += cand.votes;
        candMap.set(cand.number, existing);
      }
    }

    const candidates = Array.from(candMap.values()).sort((a, b) =>
      (a.name ?? a.number).localeCompare(b.name ?? b.number, 'pt-BR')
    );

    return {
      totalSections: sections.length,
      turnout: hasNullTurnout ? null : turnout,
      whites: hasNullWhites ? null : whites,
      nulls: hasNullNulls ? null : nulls,
      candidates,
    };
  }

  async getCandidates(profile: Profile): Promise<CandidateSummary[]> {
    const sections = this.filterByProfile(profile);
    const candMap = new Map<string, CandidateSummary>();

    for (const sec of sections) {
      for (const cand of sec.candidates) {
        if (!candMap.has(cand.number)) {
          candMap.set(cand.number, {
            number: cand.number,
            name: cand.name,
            party: cand.party,
          });
        }
      }
    }

    return Array.from(candMap.values()).sort((a, b) =>
      (a.name ?? a.number).localeCompare(b.name ?? b.number, 'pt-BR')
    );
  }

  async getLocalities(
    profile: Profile,
    filter?: { uf?: string; locality?: string; zone?: string }
  ): Promise<LocalityResult> {
    const sections = this.filterByProfile(profile);

    if (!filter?.uf) {
      const ufs = Array.from(new Set(sections.map(s => s.uf))).sort();
      return { level: 'ufs', ufs };
    }

    const inUf = sections.filter(s => s.uf === filter.uf);
    if (!filter.locality) {
      const distinctLocs = Array.from(new Set(inUf.map(s => s.locality))).sort();
      return {
        level: 'localidades',
        uf: filter.uf,
        localidades: distinctLocs.map(code => ({
          code,
          name: null,
          missingNameReason: 'Cadastro oficial de nomes de municípios não disponível no boletim de urna',
        })),
      };
    }

    const inLoc = inUf.filter(s => s.locality === filter.locality);
    if (!filter.zone) {
      const zonas = Array.from(new Set(inLoc.map(s => s.zone))).sort();
      return { level: 'zonas', uf: filter.uf, locality: filter.locality, zonas };
    }

    const inZone = inLoc.filter(s => s.zone === filter.zone);
    const secoes = Array.from(new Set(inZone.map(s => s.section))).sort();
    return { level: 'secoes', uf: filter.uf, locality: filter.locality, zone: filter.zone, secoes };
  }

  async getSection(
    profile: Profile,
    filter: { uf: string; locality: string; zone: string; section: string }
  ): Promise<PollingStationResult | undefined> {
    const sections = this.filterByProfile(profile);
    const found = sections.find(
      s =>
        s.uf === filter.uf &&
        s.locality === filter.locality &&
        s.zone === filter.zone &&
        s.section === filter.section
    );
    return found ? structuredClone(found) : undefined;
  }

  async getExteriorLocalities(profile: Profile): Promise<ExteriorLocalityResult[]> {
    const sections = this.filterByProfile(profile).filter(s => s.uf === 'ZZ');
    const grouped = new Map<string, Set<string>>();

    for (const sec of sections) {
      const set = grouped.get(sec.locality) ?? new Set<string>();
      set.add(sec.zone);
      grouped.set(sec.locality, set);
    }

    return Array.from(grouped.entries())
      .map(([locality, zones]) => ({
        locality,
        country: null,
        countryLabel: 'país indisponível' as const,
        zones: Array.from(zones).sort(),
      }))
      .sort((a, b) => a.locality.localeCompare(b.locality));
  }

  async recordImport(entry: ImportLogEntry): Promise<void> {
    this.imports.push(structuredClone(entry));
  }

  async getLastImport(profile?: Profile): Promise<ImportLogEntry | undefined> {
    const list = profile
      ? this.imports.filter(
          i =>
            i.profileMode === profile.mode &&
            i.profileYear === profile.year &&
            i.profileRound === profile.round
        )
      : this.imports;
    const last = list.at(-1);
    return last ? structuredClone(last) : undefined;
  }

  async getImportStats(profile?: Profile): Promise<{ processed: number; errors: number }> {
    const list = profile
      ? this.imports.filter(
          i =>
            i.profileMode === profile.mode &&
            i.profileYear === profile.year &&
            i.profileRound === profile.round
        )
      : this.imports;

    let processed = 0;
    let errors = 0;
    for (const imp of list) {
      processed += imp.recordCount;
      if (imp.status === 'erro' || imp.status === 'quarentena') errors++;
    }
    return { processed, errors };
  }

  async getCandidateDetail(profile: Profile, candidateNumber: string): Promise<CandidateDetail | undefined> {
    const sections = this.filterByProfile(profile);
    let candidateName: string | null = null;
    let candidateParty: string | null = null;
    let totalVotes = 0;
    let totalValid = 0;
    let found = false;

    const ufVotes = new Map<string, number>();
    const locVotes = new Map<string, { uf: string; locality: string; votes: number }>();

    for (const sec of sections) {
      for (const cand of sec.candidates) {
        if (cand.votes !== null) totalValid += cand.votes;
        if (cand.number === candidateNumber) {
          found = true;
          if (cand.name) candidateName = cand.name;
          if (cand.party) candidateParty = cand.party;
          if (cand.votes !== null) {
            totalVotes += cand.votes;
            ufVotes.set(sec.uf, (ufVotes.get(sec.uf) ?? 0) + cand.votes);
            const locKey = `${sec.uf}__${sec.locality}`;
            const existing = locVotes.get(locKey) ?? { uf: sec.uf, locality: sec.locality, votes: 0 };
            existing.votes += cand.votes;
            locVotes.set(locKey, existing);
          }
        }
      }
    }

    if (!found) return undefined;

    const votesPercent = totalValid > 0 ? (totalVotes / totalValid) * 100 : null;
    const votesByUf = Array.from(ufVotes.entries())
      .map(([uf, votes]) => ({ uf, votes }))
      .sort((a, b) => a.uf.localeCompare(b.uf));
    const votesByLocality = Array.from(locVotes.values()).sort(
      (a, b) => a.uf.localeCompare(b.uf) || a.locality.localeCompare(b.locality)
    );

    return {
      number: candidateNumber,
      name: candidateName,
      party: candidateParty,
      totalVotes,
      validVotesTotal: totalValid,
      votesPercent,
      votesByUf,
      votesByLocality,
    };
  }

  async searchSections(
    profile: Profile,
    query: { q?: string; uf?: string; zone?: string; section?: string }
  ): Promise<SearchSectionResult[]> {
    const sections = this.filterByProfile(profile);
    const q = query.q?.trim().toUpperCase();

    const filtered = sections.filter(s => {
      if (query.uf && s.uf.toUpperCase() !== query.uf.toUpperCase()) return false;
      if (query.zone && s.zone !== query.zone) return false;
      if (query.section && s.section !== query.section) return false;
      if (q) {
        const match =
          s.uf.toUpperCase() === q ||
          s.zone === q ||
          s.section === q ||
          s.locality.toUpperCase() === q;
        if (!match) return false;
      }
      return true;
    });

    return filtered.slice(0, 25).map(s => ({
      uf: s.uf,
      locality: s.locality,
      zone: s.zone,
      section: s.section,
    }));
  }
}

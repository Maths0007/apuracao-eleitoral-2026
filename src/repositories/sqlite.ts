import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
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

export class SqliteRepository implements Repository {
  private db: DatabaseSync;

  constructor(target: string | DatabaseSync = './data/eleicoes.sqlite') {
    if (typeof target === 'string') {
      if (target !== ':memory:') {
        mkdirSync(dirname(target), { recursive: true });
      }
      this.db = new DatabaseSync(target);
    } else {
      this.db = target;
    }
    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sections (
        key TEXT PRIMARY KEY,
        mode TEXT NOT NULL,
        year TEXT NOT NULL,
        round TEXT NOT NULL,
        cycle TEXT NOT NULL,
        pleito TEXT NOT NULL,
        election TEXT NOT NULL,
        contract TEXT NOT NULL,
        channel TEXT NOT NULL,
        office TEXT NOT NULL,
        uf TEXT NOT NULL,
        locality TEXT NOT NULL,
        zone TEXT NOT NULL,
        section TEXT NOT NULL,
        revision TEXT NOT NULL,
        turnout INTEGER,
        whites INTEGER,
        nulls INTEGER,
        country TEXT,
        country_label TEXT NOT NULL,
        aggregated_raw TEXT,
        urn_type TEXT NOT NULL,
        validation TEXT NOT NULL,
        issues_json TEXT NOT NULL,
        data_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sections_profile ON sections(mode, year, round, election);
      CREATE INDEX IF NOT EXISTS idx_sections_loc ON sections(mode, year, round, election, uf, locality, zone, section);

      CREATE TABLE IF NOT EXISTS section_candidates (
        section_key TEXT NOT NULL,
        mode TEXT NOT NULL,
        year TEXT NOT NULL,
        round TEXT NOT NULL,
        election TEXT NOT NULL,
        candidate_number TEXT NOT NULL,
        name TEXT,
        party TEXT,
        votes INTEGER,
        PRIMARY KEY (section_key, candidate_number),
        FOREIGN KEY (section_key) REFERENCES sections(key) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_sec_cand_profile ON section_candidates(mode, year, round, election);

      CREATE TABLE IF NOT EXISTS quarantined_sections (
        key TEXT PRIMARY KEY,
        mode TEXT NOT NULL,
        year TEXT NOT NULL,
        round TEXT NOT NULL,
        election TEXT NOT NULL,
        revision TEXT NOT NULL,
        issues_json TEXT NOT NULL,
        data_json TEXT NOT NULL,
        quarantined_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS imports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        origin TEXT NOT NULL,
        url TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        size INTEGER NOT NULL,
        hash TEXT NOT NULL,
        record_count INTEGER NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT,
        profile_mode TEXT NOT NULL,
        profile_year TEXT NOT NULL,
        profile_round TEXT NOT NULL,
        profile_election TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_imports_profile ON imports(profile_mode, profile_year, profile_round);
    `);
  }

  async get(key: string): Promise<PollingStationResult | undefined> {
    const stmt = this.db.prepare('SELECT data_json FROM sections WHERE key = ?');
    const row = stmt.get(key) as { data_json: string } | undefined;
    return row ? (JSON.parse(row.data_json) as PollingStationResult) : undefined;
  }

  async getQuarantined(key: string): Promise<PollingStationResult | undefined> {
    const stmt = this.db.prepare('SELECT data_json FROM quarantined_sections WHERE key = ?');
    const row = stmt.get(key) as { data_json: string } | undefined;
    return row ? (JSON.parse(row.data_json) as PollingStationResult) : undefined;
  }

  async replaceCompleteSection(value: PollingStationResult): Promise<'unchanged' | 'received' | 'updated'> {
    if (value.validation !== 'validado') throw new Error('Resultado não validado');

    const checkStmt = this.db.prepare('SELECT revision FROM sections WHERE key = ?');
    const existing = checkStmt.get(value.key) as { revision: string } | undefined;

    if (existing && existing.revision === value.revision) {
      return 'unchanged';
    }

    const now = new Date().toISOString();
    this.db.exec('BEGIN TRANSACTION');
    try {
      this.db.prepare('DELETE FROM section_candidates WHERE section_key = ?').run(value.key);

      const insertSection = this.db.prepare(`
        INSERT INTO sections (
          key, mode, year, round, cycle, pleito, election, contract, channel, office,
          uf, locality, zone, section, revision, turnout, whites, nulls,
          country, country_label, aggregated_raw, urn_type, validation, issues_json, data_json, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?
        ) ON CONFLICT(key) DO UPDATE SET
          mode=excluded.mode, year=excluded.year, round=excluded.round, cycle=excluded.cycle,
          pleito=excluded.pleito, election=excluded.election, contract=excluded.contract,
          channel=excluded.channel, office=excluded.office, uf=excluded.uf, locality=excluded.locality,
          zone=excluded.zone, section=excluded.section, revision=excluded.revision,
          turnout=excluded.turnout, whites=excluded.whites, nulls=excluded.nulls,
          country=excluded.country, country_label=excluded.country_label,
          aggregated_raw=excluded.aggregated_raw, urn_type=excluded.urn_type,
          validation=excluded.validation, issues_json=excluded.issues_json,
          data_json=excluded.data_json, updated_at=excluded.updated_at
      `);

      insertSection.run(
        value.key,
        value.profile.mode,
        value.profile.year,
        value.profile.round,
        value.profile.cycle,
        value.profile.pleito,
        value.profile.election,
        value.profile.contract,
        value.profile.channel,
        value.profile.office,
        value.uf,
        value.locality,
        value.zone,
        value.section,
        value.revision,
        value.turnout,
        value.whites,
        value.nulls,
        value.country,
        value.countryLabel,
        value.aggregatedRaw,
        value.urnType,
        value.validation,
        JSON.stringify(value.issues),
        JSON.stringify(value),
        now
      );

      const insertCandidate = this.db.prepare(`
        INSERT INTO section_candidates (
          section_key, mode, year, round, election, candidate_number, name, party, votes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const cand of value.candidates) {
        insertCandidate.run(
          value.key,
          value.profile.mode,
          value.profile.year,
          value.profile.round,
          value.profile.election,
          cand.number,
          cand.name,
          cand.party,
          cand.votes
        );
      }

      this.db.exec('COMMIT');
      return existing ? 'updated' : 'received';
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  async quarantine(value: PollingStationResult): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO quarantined_sections (
        key, mode, year, round, election, revision, issues_json, data_json, quarantined_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        mode=excluded.mode, year=excluded.year, round=excluded.round, election=excluded.election,
        revision=excluded.revision, issues_json=excluded.issues_json, data_json=excluded.data_json,
        quarantined_at=excluded.quarantined_at
    `);
    stmt.run(
      value.key,
      value.profile.mode,
      value.profile.year,
      value.profile.round,
      value.profile.election,
      value.revision,
      JSON.stringify(value.issues),
      JSON.stringify(value),
      new Date().toISOString()
    );
  }

  async getSummary(profile: Profile): Promise<SummaryResult> {
    const summaryStmt = this.db.prepare(`
      SELECT
        COUNT(*) as total_sections,
        SUM(turnout) as total_turnout,
        SUM(whites) as total_whites,
        SUM(nulls) as total_nulls,
        SUM(CASE WHEN turnout IS NULL THEN 1 ELSE 0 END) as null_turnout_count,
        SUM(CASE WHEN whites IS NULL THEN 1 ELSE 0 END) as null_whites_count,
        SUM(CASE WHEN nulls IS NULL THEN 1 ELSE 0 END) as null_nulls_count
      FROM sections
      WHERE mode = ? AND year = ? AND round = ? AND election = ?
    `);

    const summaryRow = summaryStmt.get(
      profile.mode,
      profile.year,
      profile.round,
      profile.election
    ) as {
      total_sections: number;
      total_turnout: number | null;
      total_whites: number | null;
      total_nulls: number | null;
      null_turnout_count: number;
      null_whites_count: number;
      null_nulls_count: number;
    };

    if (!summaryRow || summaryRow.total_sections === 0) {
      return {
        totalSections: 0,
        turnout: null,
        whites: null,
        nulls: null,
        candidates: [],
        missingReason: 'Nenhum boletim de urna recebido para este perfil',
      };
    }

    const candStmt = this.db.prepare(`
      SELECT
        candidate_number,
        name,
        party,
        SUM(votes) as total_votes
      FROM section_candidates
      WHERE mode = ? AND year = ? AND round = ? AND election = ?
      GROUP BY candidate_number
    `);

    const candRows = candStmt.all(
      profile.mode,
      profile.year,
      profile.round,
      profile.election
    ) as {
      candidate_number: string;
      name: string | null;
      party: string | null;
      total_votes: number | null;
    }[];

    const candidates = candRows
      .map(r => ({
        number: r.candidate_number,
        name: r.name,
        party: r.party,
        votes: r.total_votes,
      }))
      .sort((a, b) => (a.name ?? a.number).localeCompare(b.name ?? b.number, 'pt-BR'));

    return {
      totalSections: summaryRow.total_sections,
      turnout: summaryRow.null_turnout_count > 0 ? null : summaryRow.total_turnout,
      whites: summaryRow.null_whites_count > 0 ? null : summaryRow.total_whites,
      nulls: summaryRow.null_nulls_count > 0 ? null : summaryRow.total_nulls,
      candidates,
    };
  }

  async getCandidates(profile: Profile): Promise<CandidateSummary[]> {
    const stmt = this.db.prepare(`
      SELECT DISTINCT
        candidate_number,
        name,
        party
      FROM section_candidates
      WHERE mode = ? AND year = ? AND round = ? AND election = ?
      GROUP BY candidate_number
    `);

    const rows = stmt.all(
      profile.mode,
      profile.year,
      profile.round,
      profile.election
    ) as {
      candidate_number: string;
      name: string | null;
      party: string | null;
    }[];

    return rows
      .map(r => ({
        number: r.candidate_number,
        name: r.name,
        party: r.party,
      }))
      .sort((a, b) => (a.name ?? a.number).localeCompare(b.name ?? b.number, 'pt-BR'));
  }

  async getLocalities(
    profile: Profile,
    filter?: { uf?: string; locality?: string; zone?: string }
  ): Promise<LocalityResult> {
    if (!filter?.uf) {
      const stmt = this.db.prepare(`
        SELECT DISTINCT uf
        FROM sections
        WHERE mode = ? AND year = ? AND round = ? AND election = ?
        ORDER BY uf ASC
      `);
      const rows = stmt.all(
        profile.mode,
        profile.year,
        profile.round,
        profile.election
      ) as { uf: string }[];
      return { level: 'ufs', ufs: rows.map(r => r.uf) };
    }

    if (!filter.locality) {
      const stmt = this.db.prepare(`
        SELECT DISTINCT locality
        FROM sections
        WHERE mode = ? AND year = ? AND round = ? AND election = ? AND uf = ?
        ORDER BY locality ASC
      `);
      const rows = stmt.all(
        profile.mode,
        profile.year,
        profile.round,
        profile.election,
        filter.uf
      ) as { locality: string }[];
      return {
        level: 'localidades',
        uf: filter.uf,
        localidades: rows.map(r => ({
          code: r.locality,
          name: null,
          missingNameReason: 'Cadastro oficial de nomes de municípios não disponível no boletim de urna',
        })),
      };
    }

    if (!filter.zone) {
      const stmt = this.db.prepare(`
        SELECT DISTINCT zone
        FROM sections
        WHERE mode = ? AND year = ? AND round = ? AND election = ? AND uf = ? AND locality = ?
        ORDER BY zone ASC
      `);
      const rows = stmt.all(
        profile.mode,
        profile.year,
        profile.round,
        profile.election,
        filter.uf,
        filter.locality
      ) as { zone: string }[];
      return {
        level: 'zonas',
        uf: filter.uf,
        locality: filter.locality,
        zonas: rows.map(r => r.zone),
      };
    }

    const stmt = this.db.prepare(`
      SELECT DISTINCT section
      FROM sections
      WHERE mode = ? AND year = ? AND round = ? AND election = ? AND uf = ? AND locality = ? AND zone = ?
      ORDER BY section ASC
    `);
    const rows = stmt.all(
      profile.mode,
      profile.year,
      profile.round,
      profile.election,
      filter.uf,
      filter.locality,
      filter.zone
    ) as { section: string }[];
    return {
      level: 'secoes',
      uf: filter.uf,
      locality: filter.locality,
      zone: filter.zone,
      secoes: rows.map(r => r.section),
    };
  }

  async getSection(
    profile: Profile,
    filter: { uf: string; locality: string; zone: string; section: string }
  ): Promise<PollingStationResult | undefined> {
    const stmt = this.db.prepare(`
      SELECT data_json
      FROM sections
      WHERE mode = ? AND year = ? AND round = ? AND election = ? AND uf = ? AND locality = ? AND zone = ? AND section = ?
    `);
    const row = stmt.get(
      profile.mode,
      profile.year,
      profile.round,
      profile.election,
      filter.uf,
      filter.locality,
      filter.zone,
      filter.section
    ) as { data_json: string } | undefined;

    return row ? (JSON.parse(row.data_json) as PollingStationResult) : undefined;
  }

  async getExteriorLocalities(profile: Profile): Promise<ExteriorLocalityResult[]> {
    const stmt = this.db.prepare(`
      SELECT DISTINCT locality, zone
      FROM sections
      WHERE mode = ? AND year = ? AND round = ? AND election = ? AND uf = 'ZZ'
      ORDER BY locality ASC, zone ASC
    `);

    const rows = stmt.all(
      profile.mode,
      profile.year,
      profile.round,
      profile.election
    ) as { locality: string; zone: string }[];

    const grouped = new Map<string, Set<string>>();
    for (const r of rows) {
      const set = grouped.get(r.locality) ?? new Set<string>();
      set.add(r.zone);
      grouped.set(r.locality, set);
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
    const stmt = this.db.prepare(`
      INSERT INTO imports (
        origin, url, timestamp, size, hash, record_count, status, error_message,
        profile_mode, profile_year, profile_round, profile_election
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      entry.origin,
      entry.url,
      entry.timestamp,
      entry.size,
      entry.hash,
      entry.recordCount,
      entry.status,
      entry.errorMessage ?? null,
      entry.profileMode,
      entry.profileYear,
      entry.profileRound,
      entry.profileElection
    );
  }

  async getLastImport(profile?: Profile): Promise<ImportLogEntry | undefined> {
    if (profile) {
      const stmt = this.db.prepare(`
        SELECT origin, url, timestamp, size, hash, record_count, status, error_message,
               profile_mode, profile_year, profile_round, profile_election
        FROM imports
        WHERE profile_mode = ? AND profile_year = ? AND profile_round = ?
        ORDER BY id DESC LIMIT 1
      `);
      const row = stmt.get(profile.mode, profile.year, profile.round) as {
        origin: string;
        url: string;
        timestamp: string;
        size: number;
        hash: string;
        record_count: number;
        status: 'sucesso' | 'erro' | 'quarentena';
        error_message: string | null;
        profile_mode: string;
        profile_year: string;
        profile_round: string;
        profile_election: string;
      } | undefined;

      if (!row) return undefined;
      return {
        origin: row.origin,
        url: row.url,
        timestamp: row.timestamp,
        size: row.size,
        hash: row.hash,
        recordCount: row.record_count,
        status: row.status,
        errorMessage: row.error_message,
        profileMode: row.profile_mode,
        profileYear: row.profile_year,
        profileRound: row.profile_round,
        profileElection: row.profile_election,
      };
    }

    const stmt = this.db.prepare(`
      SELECT origin, url, timestamp, size, hash, record_count, status, error_message,
             profile_mode, profile_year, profile_round, profile_election
      FROM imports
      ORDER BY id DESC LIMIT 1
    `);
    const row = stmt.get() as {
      origin: string;
      url: string;
      timestamp: string;
      size: number;
      hash: string;
      record_count: number;
      status: 'sucesso' | 'erro' | 'quarentena';
      error_message: string | null;
      profile_mode: string;
      profile_year: string;
      profile_round: string;
      profile_election: string;
    } | undefined;

    if (!row) return undefined;
    return {
      origin: row.origin,
      url: row.url,
      timestamp: row.timestamp,
      size: row.size,
      hash: row.hash,
      recordCount: row.record_count,
      status: row.status,
      errorMessage: row.error_message,
      profileMode: row.profile_mode,
      profileYear: row.profile_year,
      profileRound: row.profile_round,
      profileElection: row.profile_election,
    };
  }

  async getImportStats(profile?: Profile): Promise<{ processed: number; errors: number }> {
    let stmt;
    let rows;
    if (profile) {
      stmt = this.db.prepare(`
        SELECT record_count, status
        FROM imports
        WHERE profile_mode = ? AND profile_year = ? AND profile_round = ?
      `);
      rows = stmt.all(profile.mode, profile.year, profile.round) as { record_count: number; status: string }[];
    } else {
      stmt = this.db.prepare(`SELECT record_count, status FROM imports`);
      rows = stmt.all() as { record_count: number; status: string }[];
    }

    let processed = 0;
    let errors = 0;
    for (const r of rows) {
      processed += r.record_count;
      if (r.status === 'erro' || r.status === 'quarentena') errors++;
    }
    return { processed, errors };
  }

  async getCandidateDetail(profile: Profile, candidateNumber: string): Promise<CandidateDetail | undefined> {
    const candStmt = this.db.prepare(`
      SELECT candidate_number, name, party, SUM(votes) as total_votes
      FROM section_candidates
      WHERE mode = ? AND year = ? AND round = ? AND election = ? AND candidate_number = ?
      GROUP BY candidate_number
    `);

    const candRow = candStmt.get(
      profile.mode,
      profile.year,
      profile.round,
      profile.election,
      candidateNumber
    ) as { candidate_number: string; name: string | null; party: string | null; total_votes: number | null } | undefined;

    if (!candRow) return undefined;

    const validStmt = this.db.prepare(`
      SELECT SUM(votes) as total_valid
      FROM section_candidates
      WHERE mode = ? AND year = ? AND round = ? AND election = ?
    `);
    const validRow = validStmt.get(
      profile.mode,
      profile.year,
      profile.round,
      profile.election
    ) as { total_valid: number | null } | undefined;

    const ufStmt = this.db.prepare(`
      SELECT s.uf, SUM(sc.votes) as votes
      FROM section_candidates sc
      JOIN sections s ON s.key = sc.section_key
      WHERE sc.mode = ? AND sc.year = ? AND sc.round = ? AND sc.election = ? AND sc.candidate_number = ?
      GROUP BY s.uf
      ORDER BY s.uf ASC
    `);
    const ufRows = ufStmt.all(
      profile.mode,
      profile.year,
      profile.round,
      profile.election,
      candidateNumber
    ) as { uf: string; votes: number }[];

    const locStmt = this.db.prepare(`
      SELECT s.uf, s.locality, SUM(sc.votes) as votes
      FROM section_candidates sc
      JOIN sections s ON s.key = sc.section_key
      WHERE sc.mode = ? AND sc.year = ? AND sc.round = ? AND sc.election = ? AND sc.candidate_number = ?
      GROUP BY s.uf, s.locality
      ORDER BY s.uf ASC, s.locality ASC
    `);
    const locRows = locStmt.all(
      profile.mode,
      profile.year,
      profile.round,
      profile.election,
      candidateNumber
    ) as { uf: string; locality: string; votes: number }[];

    const totalValid = validRow?.total_valid ?? null;
    const votesPercent =
      totalValid !== null && totalValid > 0 && candRow.total_votes !== null
        ? (candRow.total_votes / totalValid) * 100
        : null;

    return {
      number: candRow.candidate_number,
      name: candRow.name,
      party: candRow.party,
      totalVotes: candRow.total_votes,
      validVotesTotal: totalValid,
      votesPercent,
      votesByUf: ufRows,
      votesByLocality: locRows,
    };
  }

  async searchSections(
    profile: Profile,
    query: { q?: string; uf?: string; zone?: string; section?: string }
  ): Promise<SearchSectionResult[]> {
    let sql = `
      SELECT uf, locality, zone, section
      FROM sections
      WHERE mode = ? AND year = ? AND round = ? AND election = ?
    `;
    const params: string[] = [profile.mode, profile.year, profile.round, profile.election];

    if (query.uf) {
      sql += ' AND uf = ?';
      params.push(query.uf.toUpperCase());
    }
    if (query.zone) {
      sql += ' AND zone = ?';
      params.push(query.zone);
    }
    if (query.section) {
      sql += ' AND section = ?';
      params.push(query.section);
    }
    if (query.q) {
      const q = query.q.trim();
      sql += ' AND (uf = ? OR zone = ? OR section = ? OR locality = ?)';
      params.push(q.toUpperCase(), q, q, q);
    }

    sql += ' ORDER BY uf ASC, locality ASC, zone ASC, section ASC LIMIT 25';

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as SearchSectionResult[];
  }

  close() {
    this.db.close();
  }
}

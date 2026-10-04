// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { SectionResult } from '../../src/components/SectionResult';
import type { PollingStationResult } from '../../src/core/normalize';
import { profiles } from '../../src/config/profiles';

const p1 = profiles[0]!;

describe('SectionResult (Boletim de Urna com Null, Anulada e Validação)', () => {
  it('exibe "indisponível" para campos sem dados', () => {
    const mockSection: PollingStationResult = {
      key: 'test-key',
      profile: p1,
      revision: 'rev-1',
      raw: [],
      uf: 'AC',
      locality: '1392',
      zone: '1',
      section: '3',
      office: '1',
      country: null,
      countryLabel: 'país indisponível',
      aggregatedRaw: '',
      urnType: '1 - OFICIAL',
      turnout: null,
      whites: null,
      nulls: null,
      candidates: [
        { number: '13', name: null, party: null, votes: null },
      ],
      validation: 'validado',
      issues: [],
    };

    render(
      <SectionResult
        sectionData={mockSection}
        obtidoEm="2026-10-04T15:00:00-03:00"
      />
    );

    expect(screen.getByText('UF: AC — Zona 1 — Seção 3')).toBeDefined();
    // Comparecimento null deve aparecer como indisponível
    const allIndisponiveis = screen.getAllByText('indisponível');
    expect(allIndisponiveis.length).toBeGreaterThan(0);
  });

  it('exibe tipo de urna ANULADA exatamente como publicado, sem interpretar', () => {
    const mockSection: PollingStationResult = {
      key: 'test-key-anulada',
      profile: p1,
      revision: 'rev-2',
      raw: [],
      uf: 'ZZ',
      locality: '29416',
      zone: '1',
      section: '38',
      office: '1',
      country: null,
      countryLabel: 'país indisponível',
      aggregatedRaw: '',
      urnType: '2 - ANULADA',
      turnout: 0,
      whites: 0,
      nulls: 0,
      candidates: [],
      validation: 'validado',
      issues: [],
    };

    render(
      <SectionResult
        sectionData={mockSection}
        obtidoEm="2026-10-04T15:00:00-03:00"
      />
    );

    expect(screen.getByText('Urna: 2 - ANULADA')).toBeDefined();
  });

  it('exibe "Aguardando validação da fonte" quando houver inconsistências de validação', () => {
    const mockSection: PollingStationResult = {
      key: 'test-key-issues',
      profile: p1,
      revision: 'rev-3',
      raw: [],
      uf: 'ZZ',
      locality: '29505',
      zone: '1',
      section: '78',
      office: '1',
      country: null,
      countryLabel: 'país indisponível',
      aggregatedRaw: '',
      urnType: '1 - OFICIAL',
      turnout: null,
      whites: null,
      nulls: null,
      candidates: [],
      validation: 'Aguardando validação da fonte',
      issues: ['Contagens indisponíveis para validação'],
    };

    render(
      <SectionResult
        sectionData={mockSection}
        obtidoEm="2026-10-04T15:00:00-03:00"
      />
    );

    expect(screen.getByText('Aguardando validação da fonte')).toBeDefined();
    expect(screen.getByText('Contagens indisponíveis para validação')).toBeDefined();
  });
});

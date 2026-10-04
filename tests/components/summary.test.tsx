// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ElectionSummary } from '../../src/components/ElectionSummary';
import { CountingProgress } from '../../src/components/CountingProgress';
import { ProfileBanner } from '../../src/components/ProfileBanner';

describe('ElectionSummary & CountingProgress (Null -> Indisponível)', () => {
  it('ElectionSummary exibe "indisponível" para valores null, nunca zero', () => {
    render(
      <ElectionSummary
        validVotes={null}
        whites={null}
        nulls={null}
        turnout={null}
      />
    );

    const validos = screen.getByTestId('summary-validos');
    const brancos = screen.getByTestId('summary-brancos');
    const nulos = screen.getByTestId('summary-nulos');
    const apurados = screen.getByTestId('summary-apurados');

    expect(validos.textContent).toBe('indisponível');
    expect(brancos.textContent).toBe('indisponível');
    expect(nulos.textContent).toBe('indisponível');
    expect(apurados.textContent).toBe('indisponível');

    expect(validos.textContent).not.toBe('0');
    expect(brancos.textContent).not.toBe('0');
    expect(nulos.textContent).not.toBe('0');
    expect(apurados.textContent).not.toBe('0');
  });

  it('ElectionSummary formata valores numéricos reais com separador de milhar pt-BR', () => {
    render(
      <ElectionSummary
        validVotes={1250000}
        whites={50000}
        nulls={30000}
        turnout={1330000}
      />
    );

    expect(screen.getByTestId('summary-validos').textContent).toBe('1.250.000');
    expect(screen.getByTestId('summary-brancos').textContent).toBe('50.000');
    expect(screen.getByTestId('summary-nulos').textContent).toBe('30.000');
    expect(screen.getByTestId('summary-apurados').textContent).toBe('1.330.000');
  });

  it('CountingProgress exibe "indisponível" quando totais forem null', () => {
    render(
      <CountingProgress
        totalizedSections={null}
        totalSections={null}
      />
    );

    expect(screen.getByTestId('counting-percentage').textContent).toBe('indisponível');
    expect(screen.getByTestId('totalized-sections').textContent).toBe('indisponível');
    expect(screen.getByTestId('total-sections').textContent).toBe('indisponível');
  });

  it('CountingProgress não exibe 100% apurado sem indicação oficial do TSE', () => {
    render(
      <CountingProgress
        totalizedSections={100}
        totalSections={100}
        isFullyTotalized={false}
      />
    );

    // Sem a flag isFullyTotalized, não pode afirmar 100%
    expect(screen.getByTestId('counting-percentage').textContent).toBe('99,99%');
  });

  it('CountingProgress exibe 100% apurado somente quando oficializado pelo TSE', () => {
    render(
      <CountingProgress
        totalizedSections={100}
        totalSections={100}
        isFullyTotalized={true}
      />
    );

    expect(screen.getByTestId('counting-percentage').textContent).toBe('100%');
  });
});

describe('ProfileBanner (Aviso histórico e neutralidade)', () => {
  it('exibe aviso histórico oficial em perfil histórico', () => {
    render(
      <ProfileBanner
        mode="historico"
        year="2022"
        round="1"
      />
    );

    const banner = screen.getByTestId('historical-banner-text');
    expect(banner.textContent).toBe('ENSAIO — DADOS HISTÓRICOS OFICIAIS DO TSE — ELEIÇÃO 2022 — 1º TURNO');
    expect(banner.textContent?.toLowerCase()).not.toContain('ao vivo');
  });

  it('não exibe aviso de ensaio no modo atual 2026', () => {
    const { container } = render(
      <ProfileBanner
        mode="atual"
        year="2026"
        round="1"
      />
    );

    expect(container.firstChild).toBeNull();
  });
});

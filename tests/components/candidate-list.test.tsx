// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CandidateList, type CandidateItem } from '../../src/components/CandidateList';

const mockCandidates: CandidateItem[] = [
  { number: '22', name: 'JAIR BOLSONARO', ballotName: 'JAIR BOLSONARO', party: 'PL', votes: 4320 },
  { number: '13', name: 'LULA', ballotName: 'LULA', party: 'PT', votes: 4840 },
  { number: '12', name: 'CIRO GOMES', ballotName: 'CIRO GOMES', party: 'PDT', votes: 300 },
  { number: '15', name: 'SIMONE TEBET', ballotName: 'SIMONE TEBET', party: 'MDB', votes: 420 },
];

describe('CandidateList & CandidateCard', () => {
  it('ordena candidatos em ordem alfabética por padrão', () => {
    render(<CandidateList candidates={mockCandidates} validVotesTotal={10000} />);

    const cards = screen.getAllByRole('article');
    // Nomes em ordem alfabética: CIRO GOMES, JAIR BOLSONARO, LULA, SIMONE TEBET
    expect(cards[0]?.textContent).toContain('CIRO GOMES');
    expect(cards[1]?.textContent).toContain('JAIR BOLSONARO');
    expect(cards[2]?.textContent).toContain('LULA');
    expect(cards[3]?.textContent).toContain('SIMONE TEBET');
  });

  it('permite ordenar por total de votos apurados', () => {
    render(<CandidateList candidates={mockCandidates} validVotesTotal={10000} />);

    const select = screen.getByLabelText('Critério de ordenação de candidatos');
    fireEvent.change(select, { target: { value: 'votos' } });

    const cards = screen.getAllByRole('article');
    // Em ordem de votos: LULA (4840), JAIR BOLSONARO (4320), SIMONE TEBET (420), CIRO GOMES (300)
    expect(cards[0]?.textContent).toContain('LULA');
    expect(cards[1]?.textContent).toContain('JAIR BOLSONARO');
    expect(cards[2]?.textContent).toContain('SIMONE TEBET');
    expect(cards[3]?.textContent).toContain('CIRO GOMES');
  });

  it('permite ordenar por número na urna', () => {
    render(<CandidateList candidates={mockCandidates} validVotesTotal={10000} />);

    const select = screen.getByLabelText('Critério de ordenação de candidatos');
    fireEvent.change(select, { target: { value: 'numero' } });

    const cards = screen.getAllByRole('article');
    // Em ordem numérica: 12, 13, 15, 22
    expect(cards[0]?.textContent).toContain('Nº 12');
    expect(cards[1]?.textContent).toContain('Nº 13');
    expect(cards[2]?.textContent).toContain('Nº 15');
    expect(cards[3]?.textContent).toContain('Nº 22');
  });

  it('exibe "indisponível" quando votos do candidato forem null', () => {
    const candidateWithNullVotes: CandidateItem[] = [
      { number: '99', name: 'CANDIDATO TESTE', party: 'PARTIDO', votes: null },
    ];

    render(<CandidateList candidates={candidateWithNullVotes} validVotesTotal={null} />);

    const votesText = screen.getByTestId('candidate-votes-99');
    const percentText = screen.getByTestId('candidate-percent-99');

    expect(votesText.textContent).toBe('indisponível');
    expect(percentText.textContent).toBe('indisponível');
  });
});

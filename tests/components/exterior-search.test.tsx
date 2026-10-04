// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CountrySelector, type ExteriorLocalityItem } from '../../src/components/CountrySelector';
import { SearchBar } from '../../src/components/SearchBar';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe('CountrySelector (Exterior sem país e total esperado indisponível)', () => {
  const mockLocalities: ExteriorLocalityItem[] = [
    {
      locality: '29416',
      country: null,
      countryLabel: 'país indisponível',
      zones: ['1'],
    },
    {
      locality: '29505',
      country: null,
      countryLabel: 'país indisponível',
      zones: ['1'],
    },
  ];

  it('exibe país como "país indisponível" e total esperado como "total esperado indisponível"', () => {
    render(<CountrySelector localities={mockLocalities} />);

    const countryLabels = screen.getAllByText('país indisponível');
    expect(countryLabels.length).toBe(2);

    const expectedTotalLabels = screen.getAllByText('total esperado indisponível');
    expect(expectedTotalLabels.length).toBe(2);
  });
});

describe('SearchBar (Mensagem neutra sem resultados)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exibe mensagem neutra quando busca não encontrar registros', async () => {
    // Mock fetch retornando dados vazios
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ dados: [] }),
    } as unknown as Response);

    render(<SearchBar />);

    const input = screen.getByLabelText('Buscar zona, seção ou localidade');
    const submitBtn = screen.getByRole('button', { name: 'Buscar' });

    fireEvent.change(input, { target: { value: '999999' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Nenhum resultado encontrado para os parâmetros informados.')
      ).toBeDefined();
    });
  });
});

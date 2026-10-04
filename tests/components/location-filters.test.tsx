// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { LocationFilters } from '../../src/components/LocationFilters';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('LocationFilters (Filtros dependentes)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('inicia com UFs carregadas e seletores dependentes desabilitados', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/localidades') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ dados: { level: 'ufs', ufs: ['AC', 'AL', 'ZZ'] } }),
        } as unknown as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ dados: null }),
      } as unknown as Response);
    });

    render(<LocationFilters />);

    await waitFor(() => {
      expect(screen.getByText('AC')).toBeDefined();
      expect(screen.getByText('ZZ (Exterior)')).toBeDefined();
    });

    // Município, zona e seção devem estar desabilitados antes da seleção
    const munSelect = screen.getByLabelText('Selecionar Município ou Localidade') as HTMLSelectElement;
    const zonaSelect = screen.getByLabelText('Selecionar Zona Eleitoral') as HTMLSelectElement;
    const secaoSelect = screen.getByLabelText('Selecionar Seção Eleitoral') as HTMLSelectElement;

    expect(munSelect.disabled).toBe(true);
    expect(zonaSelect.disabled).toBe(true);
    expect(secaoSelect.disabled).toBe(true);
  });
});

interface FooterProps {
  obtidoEm?: string | null;
}

export function Footer({ obtidoEm }: FooterProps) {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 py-6 text-xs text-zinc-600 transition-colors dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
        <div>
          <p className="font-medium text-zinc-800 dark:text-zinc-200">
            Fonte: Tribunal Superior Eleitoral — TSE
          </p>
          <p className="mt-0.5 text-zinc-500 dark:text-zinc-500">
            Dados oficiais consolidados. Este site não realiza apuração própria nem inferências eleitorais.
          </p>
        </div>
        <div className="text-right">
          <p>
            Última obtenção:{' '}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200" data-testid="footer-timestamp">
              {obtidoEm ? `${obtidoEm} (horário de Brasília)` : 'indisponível'}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}

import { EmptyState } from '@/components/feedback/EmptyState';

/** Conteúdo provisório das abas da ficha que serão construídas nas próximas etapas. */
export function EmConstrucao({ titulo, etapa }: { titulo: string; etapa: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-line-strong bg-white">
      <EmptyState icon="construction" title={`${titulo} · em construção`}>
        Esta aba será construída na etapa “{etapa}” do protótipo.
      </EmptyState>
    </section>
  );
}

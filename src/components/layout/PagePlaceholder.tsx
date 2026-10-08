import { Icon } from '@/components/ui';

/** Provisório: telas ainda não construídas nesta etapa do protótipo. */
export function PagePlaceholder({ titulo, icone }: { titulo: string; icone: string }) {
  return (
    <div className="p-10">
      <h1 className="m-0 text-[28px] font-bold tracking-tight">{titulo}</h1>
      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-white py-20 text-ink-500">
        <Icon name={icone} size={40} />
        <div className="text-[15px]">Tela em construção no protótipo.</div>
      </div>
    </div>
  );
}

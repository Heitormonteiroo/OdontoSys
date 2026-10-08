import { Icon } from '@/components/ui';

/** Aviso exibido quando o perfil atual não pode ver uma área (ex.: Recepção na linha do tempo clínica). */
export function SemPermissao({ area, perfil }: { area: string; perfil: string }) {
  return (
    <section className="mx-auto flex max-w-[560px] flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-ink-600">
        <Icon name="lock" size={32} fill />
      </div>
      <div className="text-lg font-semibold">Sem permissão para ver {area}</div>
      <div className="max-w-[440px] text-[15px] leading-normal text-ink-600">
        O perfil <strong>{perfil}</strong> não tem acesso ao registro clínico. Para demonstrar esta área, saia e entre
        novamente com o perfil Dentista.
      </div>
    </section>
  );
}

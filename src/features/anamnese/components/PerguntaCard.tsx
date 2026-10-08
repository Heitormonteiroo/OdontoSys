'use client';

import { Icon } from '@/components/ui';
import type { PerguntaAnamnese, RespostasAnamnese } from '@/mock/types';

const INPUT =
  'h-[58px] w-full rounded-xl border-2 border-line-strong bg-white px-4 text-[20px] text-ink outline-none focus:border-brand focus:shadow-field';

/** Uma pergunta do totem: opções grandes (alvo ≥ 64 px), complementos quando "Sim" e avisos. */
export function PerguntaCard({
  q,
  a,
  erro,
  onChange,
}: {
  q: PerguntaAnamnese;
  a: RespostasAnamnese;
  erro: string | null;
  onChange: (fn: (a: RespostasAnamnese) => RespostasAnamnese) => void;
}) {
  const r = a.respostas[q.id];
  const sim = r === 'Sim';
  const chips = a.chips[q.id] ?? [];

  const box = erro
    ? 'border-2 border-danger-strong bg-[#FFFBFA]'
    : q.importante
      ? 'border-2 border-warn-border bg-white'
      : 'border border-line bg-white';

  return (
    <div className={`flex flex-col gap-3.5 rounded-2xl px-6 py-5 shadow-card ${box}`}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex min-w-[280px] flex-1 flex-col gap-1.5">
          {q.importante && (
            <span className="inline-flex h-[26px] w-fit items-center gap-1.5 rounded-full bg-warn-bg px-2.5 text-[13px] font-bold tracking-[0.04em] text-warn-text">
              <Icon name="priority_high" size={16} />
              IMPORTANTE
            </span>
          )}
          <span className="text-[23px] font-semibold leading-[1.3]">{q.texto}</span>
          {q.dica && <span className="text-[17px] leading-snug text-ink-600">{q.dica}</span>}
        </div>
        <div role="radiogroup" aria-label={q.texto} className="flex shrink-0 gap-2.5">
          {q.opcoes.map((o) => {
            const on = r === o;
            return (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange((x) => ({ ...x, respostas: { ...x.respostas, [q.id]: o } }))}
                className={`flex h-16 items-center justify-center gap-2 rounded-[14px] border-2 px-5 text-xl ${
                  q.opcoes.length > 3 ? 'min-w-[108px]' : 'min-w-[132px]'
                } ${on ? 'border-brand bg-brand font-bold text-white' : 'border-line-strong bg-white font-semibold text-ink active:bg-surface-bg'}`}
              >
                {on && <Icon name="check" size={24} />}
                {o}
              </button>
            );
          })}
        </div>
      </div>

      {erro && (
        <span className="flex items-center gap-1.5 text-[17px] font-semibold text-danger">
          <Icon name="error" size={22} />
          {erro}
        </span>
      )}

      {sim && q.chips && (
        <div className="flex flex-col gap-2.5 pt-1">
          <span className="text-lg font-semibold">{q.chips.rotulo}</span>
          <div className="flex flex-wrap gap-2.5">
            {q.chips.opcoes.map((c) => {
              const on = chips.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    onChange((x) => {
                      const atual = x.chips[q.id] ?? [];
                      const novo = atual.includes(c) ? atual.filter((y) => y !== c) : [...atual, c];
                      return { ...x, chips: { ...x.chips, [q.id]: novo } };
                    })
                  }
                  className={`flex h-[52px] items-center gap-2 rounded-full border-2 px-[18px] text-lg ${
                    on ? 'border-danger bg-danger-bg font-semibold text-danger-text' : 'border-line-strong bg-white font-medium text-ink'
                  }`}
                >
                  {on && <Icon name="check" size={22} />}
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sim && q.detalhe && (
        <label className="flex flex-col gap-2 text-lg font-semibold">
          {q.detalhe.rotulo}
          <input
            value={a.detalhes[q.id] ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              onChange((x) => ({ ...x, detalhes: { ...x.detalhes, [q.id]: v } }));
            }}
            placeholder={q.detalhe.placeholder}
            className={`${INPUT} font-normal`}
          />
        </label>
      )}

      {sim && q.remedios && (
        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_56px] gap-2.5 text-base font-semibold text-ink-700">
            <span>Nome do remédio</span>
            <span>Quanto e quando</span>
            <span />
          </div>
          {a.remedios.map((m, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_56px] gap-2.5">
              <input
                aria-label="Nome do remédio"
                placeholder="Ex.: Losartana"
                value={m.nome}
                onChange={(e) => {
                  const v = e.target.value;
                  onChange((x) => ({ ...x, remedios: x.remedios.map((y, j) => (j === i ? { ...y, nome: v } : y)) }));
                }}
                className={INPUT}
              />
              <input
                aria-label="Dose e frequência"
                placeholder="Ex.: 50 mg, 1 vez ao dia"
                value={m.dose}
                onChange={(e) => {
                  const v = e.target.value;
                  onChange((x) => ({ ...x, remedios: x.remedios.map((y, j) => (j === i ? { ...y, dose: v } : y)) }));
                }}
                className={INPUT}
              />
              <button
                type="button"
                aria-label="Remover remédio"
                onClick={() =>
                  onChange((x) => ({
                    ...x,
                    remedios: x.remedios.length > 1 ? x.remedios.filter((_, j) => j !== i) : [{ nome: '', dose: '' }],
                  }))
                }
                className="flex h-[58px] w-14 items-center justify-center rounded-xl border-2 border-line bg-white text-ink-600"
              >
                <Icon name="delete" size={24} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange((x) => ({ ...x, remedios: [...x.remedios, { nome: '', dose: '' }] }))}
            className="flex h-14 w-fit items-center gap-2 rounded-xl border-2 border-dashed border-brand bg-brand-tint px-5 text-lg font-semibold text-brand-dark"
          >
            <Icon name="add" size={24} />
            Adicionar outro remédio
          </button>
        </div>
      )}

      {sim && q.avisoSim && (
        <div className="flex items-center gap-2.5 rounded-xl bg-danger-bg px-4 py-3 text-[17px] font-medium text-danger-text">
          <Icon name="notifications_active" size={24} fill className="text-danger" />
          {q.avisoSim}
        </div>
      )}
      {r === 'Não sei' && q.avisoNaoSei && (
        <div className="flex items-center gap-2.5 rounded-xl bg-info-bg px-4 py-3 text-[17px] font-medium text-info-text">
          <Icon name="info" size={24} className="text-info" />
          {q.avisoNaoSei}
        </div>
      )}
    </div>
  );
}

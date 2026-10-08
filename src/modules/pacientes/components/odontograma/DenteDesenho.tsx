'use client';

import type { CSSProperties } from 'react';
import { Icon } from '@/components/ui';
import type { Achado, Face } from '@/mock/types';
import { nomeFace, posicoesFaces } from '@/modules/pacientes/utils/odontograma/dentes';
import type { Catalogo, EstadoDente } from '@/modules/pacientes/utils/odontograma/estado';
import { POSICOES, RECORTES, amostra, fundoFace } from '@/modules/pacientes/utils/odontograma/visual';

/** Linhas que separam as 5 faces (decorativas). */
function Divisores({ espessura }: { espessura: number }) {
  const l: CSSProperties = { position: 'absolute', width: '42.43%', height: espessura, background: '#8A9BA8', pointerEvents: 'none' };
  return (
    <>
      <div className="pointer-events-none absolute left-[30%] top-[30%] h-[40%] w-[40%] border-ink-400" style={{ borderWidth: espessura }} />
      <div style={{ ...l, left: 0, top: 0, transformOrigin: '0 0', transform: 'rotate(45deg)' }} />
      <div style={{ ...l, right: 0, top: 0, transformOrigin: '100% 0', transform: 'rotate(-45deg)' }} />
      <div style={{ ...l, left: 0, bottom: 0, transformOrigin: '0 100%', transform: 'rotate(-45deg)' }} />
      <div style={{ ...l, right: 0, bottom: 0, transformOrigin: '100% 100%', transform: 'rotate(45deg)' }} />
    </>
  );
}

/** Desenho de um dente com faces clicáveis, contorno de coroa, X de ausente e ✓ de hígido. */
export function DenteDesenho({
  n,
  estado,
  cat,
  tamanho,
  faceSelecionada,
  facesPendentes,
  onFace,
  centro,
}: {
  n: number;
  estado: EstadoDente;
  cat: Catalogo;
  tamanho: number;
  faceSelecionada: Face | null;
  facesPendentes: Face[] | 'todas' | null;
  onFace: (f: Face) => void;
  centro?: string;
}) {
  const pos = posicoesFaces(n);
  const aus = estado.inteiro.ausente;
  const coroa = estado.inteiro.coroa;
  const grande = tamanho > 60;
  return (
    <div
      className="relative box-border"
      style={{
        width: tamanho,
        height: tamanho,
        border: `${grande ? 2 : 1.5}px solid #8A9BA8`,
        borderRadius: grande ? 12 : 6,
        outline: coroa ? `${grande ? 3 : 2}px ${coroa === 'planejado' ? 'dashed' : 'solid'} ${cat.coroa.cor}` : 'none',
        outlineOffset: grande ? 3 : 1,
      }}
    >
      <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: grande ? 10 : 4 }}>
        {POSICOES.map((p) => {
          const f = pos[p];
          const pend = facesPendentes === 'todas' || (facesPendentes?.includes(f) ?? false);
          return (
            <div
              key={p}
              role="button"
              tabIndex={0}
              aria-label={`Dente ${n}, face ${nomeFace(n, f)}`}
              title={`Dente ${n} · ${nomeFace(n, f)}`}
              onClick={(e) => {
                e.stopPropagation();
                onFace(f);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onFace(f);
                }
              }}
              className="absolute inset-0 cursor-pointer outline-none hover:brightness-[.88] focus-visible:brightness-[.8]"
              style={{
                clipPath: RECORTES[p],
                background: fundoFace(estado.faces[f], cat, !!aus, pend ? 'pendente' : faceSelecionada === f ? 'selecionada' : 'nenhum'),
              }}
            />
          );
        })}
        <Divisores espessura={grande ? 1.5 : 1} />
        {centro && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] font-bold">{centro}</div>
        )}
      </div>
      {aus && (
        <>
          {[45, -45].map((r) => (
            <div
              key={r}
              className="pointer-events-none absolute left-[-12%] top-1/2 h-[3px] w-[124%] -mt-[1.5px] rounded-sm"
              style={{
                transform: `rotate(${r}deg)`,
                background: aus === 'planejado' ? `repeating-linear-gradient(90deg,${cat.ausente.cor} 0 4px,transparent 4px 7px)` : cat.ausente.cor,
              }}
            />
          ))}
        </>
      )}
      {estado.higido && !grande && (
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Icon name="check" size={16} style={{ color: cat.higido.cor, fontWeight: 700 }} />
        </div>
      )}
    </div>
  );
}

/** Raiz esquemática acima/abaixo do dente: canal (linha) e implante (rosca). */
export function RaizDesenho({ estado, cat }: { estado: EstadoDente; cat: Catalogo }) {
  const ca = estado.inteiro.canal;
  const im = estado.inteiro.implante;
  return (
    <div aria-hidden className="relative h-[14px] w-[34px]">
      <div
        className="absolute left-[11px] top-0 h-[14px] w-3 rounded-sm"
        style={{
          background: im ? `repeating-linear-gradient(180deg,${cat.implante.cor} 0 2px,transparent 2px 4px)` : 'transparent',
          opacity: im === 'planejado' ? 0.45 : 1,
        }}
      />
      <div
        className="absolute left-[15px] top-0 box-border h-[14px] w-1"
        style={{ background: ca === 'presente' ? cat.canal.cor : 'transparent', borderLeft: ca === 'planejado' ? `4px dashed ${cat.canal.cor}` : 'none' }}
      />
    </div>
  );
}

/** Quadradinho de legenda/ferramenta. */
export function Amostra({ achado, cat, planejado, tamanho = 16 }: { achado: Achado; cat: Catalogo; planejado?: boolean; tamanho?: number }) {
  const a = amostra(achado, cat, planejado);
  return (
    <span
      aria-hidden
      className="box-border inline-flex shrink-0 items-center justify-center rounded"
      style={{ width: tamanho, height: tamanho, background: a.background, border: a.border }}
    >
      {a.icone && <Icon name={a.icone} size={tamanho - 3} style={{ color: a.corIcone, fontWeight: 700 }} />}
    </span>
  );
}

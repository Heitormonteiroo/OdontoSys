import type { Achado } from '@/mock/types';
import type { Catalogo, EstadoFace } from '@/modules/pacientes/utils/odontograma/estado';

/** Recortes das 5 regiões do dente (vista oclusal esquemática). */
export const RECORTES = {
  top: 'polygon(0 0,100% 0,70% 30%,30% 30%)',
  right: 'polygon(100% 0,100% 100%,70% 70%,70% 30%)',
  bottom: 'polygon(30% 70%,70% 70%,100% 100%,0 100%)',
  left: 'polygon(0 0,30% 30%,30% 70%,0 100%)',
  center: 'polygon(30% 30%,70% 30%,70% 70%,30% 70%)',
} as const;

export type Posicao = keyof typeof RECORTES;
export const POSICOES: Posicao[] = ['top', 'right', 'bottom', 'left', 'center'];

const hachura = (cor: string, fundo: string) => `repeating-linear-gradient(45deg,${cor} 0 2.5px,${fundo} 2.5px 5px)`;

/** Fundo de uma face: sólido = existente/realizado; hachurado = planejado. */
export function fundoFace(fs: EstadoFace, cat: Catalogo, ausente: boolean, destaque: 'nenhum' | 'selecionada' | 'pendente'): string {
  const base = ausente ? '#EEF2F5' : '#FFFFFF';
  const cor = fs.atual ? cat[fs.atual].cor : base;
  const bg = fs.planejado ? hachura(cat[fs.planejado].cor, cor) : cor;
  if (destaque === 'pendente') return `linear-gradient(rgba(15,118,110,.62),rgba(15,118,110,.62)),${bg}`;
  if (destaque === 'selecionada') return `linear-gradient(rgba(15,118,110,.3),rgba(15,118,110,.3)),${bg}`;
  return bg;
}

/** Amostra (swatch) de um achado para legenda, ferramentas e histórico. */
export function amostra(a: Achado, cat: Catalogo, planejado = false): { background: string; border: string; icone: string; corIcone: string } {
  const c = cat[a].cor;
  const traco = planejado ? 'dashed' : 'solid';
  const r = { background: '#FFFFFF', border: `1.5px ${traco} #C9D4DC`, icone: '', corIcone: c };
  if (a === 'carie' || a === 'restauracao') return { ...r, background: planejado ? hachura(c, '#FFFFFF') : c, border: `1.5px solid ${c}` };
  if (a === 'coroa') return { ...r, border: `2.5px ${traco} ${c}` };
  if (a === 'canal') return { ...r, background: `linear-gradient(90deg,transparent 5.5px,${c} 5.5px 9.5px,transparent 9.5px)`, border: planejado ? `1.5px dashed ${c}` : '1.5px solid #C9D4DC' };
  if (a === 'implante') return { ...r, background: `repeating-linear-gradient(180deg,${c} 0 2px,#FFFFFF 2px 4px)`, border: `1.5px ${traco} ${c}` };
  if (a === 'ausente') return { ...r, icone: 'close' };
  return { ...r, icone: 'check', border: '1.5px solid #ABEFC6' };
}

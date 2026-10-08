import type { Achado, Face, FindingType, NovoEventoDente, ToothEvent } from '@/mock/types';
import { ORDEM_FACES, TODOS_DENTES } from '@/modules/pacientes/utils/odontograma/dentes';

export interface EstadoFace {
  atual: Achado | null; // existente ou realizado
  planejado: Achado | null;
}

export interface EstadoDente {
  faces: Record<Face, EstadoFace>;
  /** Achados do dente inteiro: "presente" (existente/realizado) ou "planejado". */
  inteiro: Partial<Record<Achado, 'presente' | 'planejado'>>;
  higido: boolean;
  temAchados: boolean;
}

export type Catalogo = Record<Achado, FindingType>;

export const catalogoPorId = (lista: FindingType[]): Catalogo =>
  Object.fromEntries(lista.map((f) => [f.id, f])) as Catalogo;

/** Ids de eventos que já foram substituídos por uma correção. */
export const idsCorrigidos = (eventos: ToothEvent[]) => new Set(eventos.flatMap((e) => (e.substitui ? [e.substitui] : [])));

/**
 * Estado atual de um dente = projeção dos eventos (append-only), em ordem de gravação,
 * ignorando os que foram corrigidos. Nada é alterado: o histórico continua completo.
 */
export function estadoDente(eventosDoDente: ToothEvent[], cat: Catalogo, corrigidos = idsCorrigidos(eventosDoDente)): EstadoDente {
  const faces = Object.fromEntries(ORDEM_FACES.map((f) => [f, { atual: null, planejado: null }])) as Record<Face, EstadoFace>;
  const inteiro: EstadoDente['inteiro'] = {};
  const ativos = eventosDoDente.filter((e) => !corrigidos.has(e.id)).sort((a, b) => a.seq - b.seq);
  for (const e of ativos) {
    if (cat[e.achado].escopo === 'face') {
      for (const f of e.faces) {
        const fs = faces[f];
        if (e.situacao === 'planejado') fs.planejado = e.achado;
        else {
          fs.atual = e.achado;
          if (fs.planejado === e.achado) fs.planejado = null;
        }
      }
    } else if (e.situacao === 'planejado') {
      if (!inteiro[e.achado]) inteiro[e.achado] = 'planejado';
    } else {
      inteiro[e.achado] = 'presente';
    }
  }
  const temFace = ORDEM_FACES.some((f) => faces[f].atual || faces[f].planejado);
  const outros = (Object.keys(inteiro) as Achado[]).filter((a) => a !== 'higido');
  return { faces, inteiro, higido: !!inteiro.higido && !temFace && outros.length === 0, temAchados: temFace || outros.length > 0 };
}

/** Estado de todos os dentes de um paciente. */
export function estadoBoca(eventos: ToothEvent[], cat: Catalogo): Map<number, EstadoDente> {
  const corrigidos = idsCorrigidos(eventos);
  const porDente = new Map<number, ToothEvent[]>();
  for (const e of eventos) porDente.set(e.dente, [...(porDente.get(e.dente) ?? []), e]);
  const out = new Map<number, EstadoDente>();
  for (const n of TODOS_DENTES) out.set(n, estadoDente(porDente.get(n) ?? [], cat, corrigidos));
  return out;
}

/** Motivo pelo qual um novo registro não pode ser feito (ou null se pode). */
export function bloqueioRegistro(novo: NovoEventoDente, estado: EstadoDente, cat: Catalogo): string | null {
  const escopo = cat[novo.achado].escopo;
  if (escopo === 'face' && novo.faces.length === 0) return 'Escolha ao menos uma face.';
  if (novo.achado === 'higido' && estado.temAchados)
    return `O dente ${novo.dente} tem achados ativos. Para marcá-lo como hígido, registre uma correção nos eventos dele.`;
  if (escopo === 'face' && estado.inteiro.ausente === 'presente')
    return `O dente ${novo.dente} está registrado como ausente. Não é possível marcar faces.`;
  return null;
}

/** Planejados ainda não cumpridos por um evento posterior (existente/realizado) do mesmo achado. */
export function planejadosPendentes(eventos: ToothEvent[]): ToothEvent[] {
  const corrigidos = idsCorrigidos(eventos);
  const ativos = eventos.filter((e) => !corrigidos.has(e.id));
  return ativos
    .filter((e) => e.situacao === 'planejado')
    .filter(
      (e) =>
        !ativos.some(
          (x) =>
            x.dente === e.dente &&
            x.achado === e.achado &&
            x.seq > e.seq &&
            x.situacao !== 'planejado' &&
            (e.faces.length === 0 || e.faces.every((f) => x.faces.includes(f))),
        ),
    )
    .sort((a, b) => a.dente - b.dente || a.seq - b.seq);
}

/** Rótulo do achado no histórico ("ausente" planejado é uma extração). */
export function rotuloAchado(e: Pick<ToothEvent, 'achado' | 'situacao'>, cat: Catalogo): string {
  if (e.achado === 'ausente' && e.situacao === 'planejado') return 'Extração';
  if (e.achado === 'canal') return 'Tratamento de canal';
  return cat[e.achado].label;
}

export interface ItemSituacao {
  achado: Achado;
  texto: string; // "Cárie M, O"
  planejado: boolean;
}

/** Situação atual do dente em itens legíveis (painel do dente, resumo e exportação). */
export function situacaoDente(n: number, est: EstadoDente, cat: Catalogo, sigla: (n: number, f: Face) => string): ItemSituacao[] {
  const grupos = new Map<string, Face[]>();
  for (const f of ORDEM_FACES) {
    const fs = est.faces[f];
    if (fs.atual) grupos.set(`${fs.atual}|s`, [...(grupos.get(`${fs.atual}|s`) ?? []), f]);
    if (fs.planejado) grupos.set(`${fs.planejado}|p`, [...(grupos.get(`${fs.planejado}|p`) ?? []), f]);
  }
  const out: ItemSituacao[] = [...grupos.entries()].map(([k, faces]) => {
    const [a, p] = k.split('|') as [Achado, string];
    return { achado: a, texto: `${cat[a].label} ${faces.map((f) => sigla(n, f)).join(', ')}`, planejado: p === 'p' };
  });
  for (const [a, v] of Object.entries(est.inteiro) as [Achado, 'presente' | 'planejado'][]) {
    if (a === 'higido' && !est.higido) continue;
    out.push({ achado: a, texto: rotuloAchado({ achado: a, situacao: v === 'planejado' ? 'planejado' : 'existente' }, cat), planejado: v === 'planejado' });
  }
  return out;
}

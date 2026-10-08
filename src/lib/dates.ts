/**
 * "Hoje" fixo da demonstração, para os dados de exemplo não envelhecerem.
 * Troque por `new Date()` quando houver backend.
 */
export const HOJE = '2026-10-08';

const pad = (n: number) => String(n).padStart(2, '0');

export function idadeEm(nascimentoIso: string, refIso: string = HOJE): number {
  const [ay, am, ad] = nascimentoIso.split('-').map(Number);
  const [ry, rm, rd] = refIso.split('-').map(Number);
  let idade = ry - ay;
  if (rm < am || (rm === am && rd < ad)) idade -= 1;
  return idade;
}

/** "2026-10-08T09:00" -> "Hoje, 09:00"; outras datas -> "12/09/2026"; null -> "—". */
export function dataRelativa(iso: string | null): string {
  if (!iso) return '—';
  const [data, hora] = iso.split('T');
  if (data === HOJE) return `Hoje, ${hora?.slice(0, 5) ?? ''}`.replace(/, $/, '');
  return formatarData(data);
}

/** "2026-09-12" -> "12/09/2026" */
export function formatarData(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** Diferença aproximada em meses entre uma data ISO e HOJE. */
export function mesesDesde(iso: string, refIso: string = HOJE): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const [ry, rm, rd] = refIso.split('-').map(Number);
  let meses = (ry - y) * 12 + (rm - m);
  if (rd < d) meses -= 1;
  return meses;
}

/** "Agora" da demonstração: data fixa (HOJE) com a hora real do relógio, ex.: "2026-10-08T09:14". */
export function agora(): string {
  const d = new Date();
  return `${HOJE}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "2026-10-07T08:58" -> "07/10/2026 às 08:58" */
export function dataHora(iso: string): string {
  const [data, hora] = iso.split('T');
  return hora ? `${formatarData(data)} às ${hora.slice(0, 5)}` : formatarData(data);
}

/** Hora local (HH:MM) de um instante em milissegundos. */
export function horaDe(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export { pad };

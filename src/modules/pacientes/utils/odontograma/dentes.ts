import type { Denticao, Face } from '@/mock/types';

/** Ordem na tela: vista do profissional (direita do paciente à esquerda). Notação FDI. */
export const PERM_SUP = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const PERM_INF = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
export const DEC_SUP = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
export const DEC_INF = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];
export const TODOS_DENTES = [...PERM_SUP, ...PERM_INF, ...DEC_SUP, ...DEC_INF];

export const ORDEM_FACES: Face[] = ['O', 'M', 'D', 'V', 'L'];

export type Linha = { legenda: string; dentes: number[] } | 'divisor';

export function linhasDenticao(d: Denticao): Linha[] {
  if (d === 'decidua') return [{ legenda: '', dentes: DEC_SUP }, 'divisor', { legenda: '', dentes: DEC_INF }];
  if (d === 'mista')
    return [
      { legenda: 'Permanentes superiores', dentes: PERM_SUP },
      { legenda: 'Decíduos superiores', dentes: DEC_SUP },
      'divisor',
      { legenda: 'Decíduos inferiores', dentes: DEC_INF },
      { legenda: 'Permanentes inferiores', dentes: PERM_INF },
    ];
  return [{ legenda: '', dentes: PERM_SUP }, 'divisor', { legenda: '', dentes: PERM_INF }];
}

/** Dentição sugerida pela idade (decisão pendente nº 17: o profissional pode trocar). */
export function denticaoPorIdade(idade: number): Denticao {
  if (idade < 6) return 'decidua';
  if (idade < 12) return 'mista';
  return 'permanente';
}

export const dentesValidos = new Set(TODOS_DENTES);

const quadrante = (n: number) => Math.floor(n / 10);
export const ehSuperior = (n: number) => [1, 2, 5, 6].includes(quadrante(n));
export const ehDeciduo = (n: number) => quadrante(n) >= 5;

/** Posição de cada face no desenho (vista do profissional). */
export function posicoesFaces(n: number): Record<'top' | 'right' | 'bottom' | 'left' | 'center', Face> {
  const sup = ehSuperior(n);
  const ladoDireitoPaciente = [1, 4, 5, 8].includes(quadrante(n));
  return {
    top: sup ? 'V' : 'L',
    bottom: sup ? 'L' : 'V',
    left: ladoDireitoPaciente ? 'D' : 'M',
    right: ladoDireitoPaciente ? 'M' : 'D',
    center: 'O',
  };
}

const anterior = (n: number) => n % 10 <= 3;

/** Sigla da face no dente: O vira I nos anteriores; L vira P nos superiores. */
export function siglaFace(n: number, f: Face): string {
  if (f === 'O') return anterior(n) ? 'I' : 'O';
  if (f === 'L') return ehSuperior(n) ? 'P' : 'L';
  return f;
}

export function nomeFace(n: number, f: Face): string {
  return { O: anterior(n) ? 'Incisal' : 'Oclusal', M: 'Mesial', D: 'Distal', V: 'Vestibular', L: ehSuperior(n) ? 'Palatina' : 'Lingual' }[f];
}

export function siglasFaces(n: number, faces: Face[]): string {
  return ORDEM_FACES.filter((f) => faces.includes(f)).map((f) => siglaFace(n, f)).join(', ');
}

export function nomeDente(n: number): string {
  const q = quadrante(n), u = n % 10, dec = q >= 5;
  const perm: Record<number, string> = { 1: 'Incisivo central', 2: 'Incisivo lateral', 3: 'Canino', 4: '1º pré-molar', 5: '2º pré-molar', 6: '1º molar', 7: '2º molar', 8: '3º molar (siso)' };
  const decN: Record<number, string> = { 1: 'Incisivo central', 2: 'Incisivo lateral', 3: 'Canino', 4: '1º molar', 5: '2º molar' };
  const lado = ({ 1: 'superior direito', 2: 'superior esquerdo', 3: 'inferior esquerdo', 4: 'inferior direito' } as Record<number, string>)[dec ? q - 4 : q];
  return `${(dec ? decN : perm)[u]} ${lado} · ${dec ? 'decíduo' : 'permanente'}`;
}

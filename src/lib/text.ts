/** Minúsculas e sem acentos, para busca. */
export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Primeira e última palavra do nome: "Mariana Alves Costa" -> "MC". */
export function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return '';
  if (p.length === 1) return p[0][0].toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export const soDigitos = (s: string) => s.replace(/\D/g, '');

/** Máscara progressiva 000.000.000-00 */
export function mascaraCpf(s: string): string {
  const d = soDigitos(s).slice(0, 11);
  const a = d.slice(0, 3), b = d.slice(3, 6), c = d.slice(6, 9), e = d.slice(9, 11);
  let out = a;
  if (b) out += '.' + b;
  if (c) out += '.' + c;
  if (e) out += '-' + e;
  return out;
}

/** Máscara progressiva (00) 00000-0000 */
export function mascaraTelefone(s: string): string {
  const d = soDigitos(s).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

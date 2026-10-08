/**
 * Valores monetários sempre em centavos (inteiro). Nunca float.
 */
export function formatarCentavos(c: number): string {
  const neg = c < 0;
  const abs = Math.abs(Math.trunc(c));
  const reais = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const cent = String(abs % 100).padStart(2, '0');
  return `${neg ? '−' : ''}R$ ${reais},${cent}`;
}

/** "1.234,5" / "1234,50" / "R$ 80" -> 123450 / 8000. Texto inválido -> null. Sem passar por float. */
export function lerCentavos(texto: string): number | null {
  const t = texto.replace(/R\$|\s/g, '').replace(/\./g, '');
  if (t === '') return 0;
  const m = /^(\d+)(?:,(\d{0,2}))?$/.exec(t);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
}

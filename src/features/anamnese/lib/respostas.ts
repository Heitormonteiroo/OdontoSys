import { soDigitos } from '@/lib/text';
import type {
  AlertaCritico,
  AnamneseTemplate,
  DadosPessoaisAnamnese,
  PassoAnamnese,
  PerguntaAnamnese,
  RespostasAnamnese,
} from '@/mock/types';

/** campo ou perguntaId -> mensagem de erro */
export type Erros = Record<string, string>;

export function respostasIniciais(dados: DadosPessoaisAnamnese): RespostasAnamnese {
  return { dados, respostas: {}, detalhes: {}, chips: {}, remedios: [{ nome: '', dose: '' }] };
}

const remediosPreenchidos = (a: RespostasAnamnese) => a.remedios.filter((r) => r.nome.trim() !== '');

function dataValida(ddmmaaaa: string): boolean {
  const d = soDigitos(ddmmaaaa);
  if (d.length !== 8) return false;
  const dia = Number(d.slice(0, 2)), mes = Number(d.slice(2, 4)), ano = Number(d.slice(4));
  const dt = new Date(ano, mes - 1, dia);
  return ano >= 1900 && dt.getFullYear() === ano && dt.getMonth() === mes - 1 && dt.getDate() === dia && dt <= new Date();
}

export function errosDados(d: DadosPessoaisAnamnese): Erros {
  const e: Erros = {};
  if (!d.nome.trim()) e.nome = 'Preencha este campo.';
  if (!d.nascimento.trim()) e.nascimento = 'Preencha este campo.';
  else if (!dataValida(d.nascimento)) e.nascimento = 'Data incompleta ou inválida.';
  const cel = soDigitos(d.celular).length;
  if (cel === 0) e.celular = 'Preencha este campo.';
  else if (cel < 10) e.celular = 'Número incompleto.';
  const cpf = soDigitos(d.cpf).length;
  if (cpf > 0 && cpf < 11) e.cpf = 'CPF incompleto.';
  const em = soDigitos(d.emergenciaTelefone).length;
  if (em > 0 && em < 10) e.emergenciaTelefone = 'Número incompleto.';
  return e;
}

export function erroPergunta(q: PerguntaAnamnese, a: RespostasAnamnese): string | null {
  const r = a.respostas[q.id];
  if (!r) return 'Escolha uma resposta.';
  if (!q.opcoes.includes(r)) return 'Resposta inválida.';
  if (r !== 'Sim') return null;
  if (q.chips && !(a.chips[q.id]?.length) && !a.detalhes[q.id]?.trim()) return 'Toque no remédio ou descreva a alergia.';
  if (q.remedios && remediosPreenchidos(a).length === 0) return 'Escreva o nome de pelo menos um remédio.';
  return null;
}

export function errosPasso(passo: PassoAnamnese, a: RespostasAnamnese): Erros {
  const e: Erros = {};
  for (const q of passo.perguntas) {
    const msg = erroPergunta(q, a);
    if (msg) e[q.id] = msg;
  }
  return e;
}

/**
 * Validação completa contra o modelo. No sistema real roda no SERVIDOR
 * (Zod gerado do schema do modelo) antes de gravar; aqui o store a chama.
 */
export function validarRespostas(tpl: AnamneseTemplate, a: RespostasAnamnese): Erros {
  const e: Erros = errosDados(a.dados);
  for (const p of tpl.passos) Object.assign(e, errosPasso(p, a));
  const ids = new Set(tpl.passos.flatMap((p) => p.perguntas.map((q) => q.id)));
  for (const k of Object.keys(a.respostas)) if (!ids.has(k)) e[k] = 'Pergunta fora do modelo.';
  return e;
}

/** Remove o que não se aplica (detalhes de respostas "Não", linhas de remédio vazias). */
export function limparRespostas(tpl: AnamneseTemplate, a: RespostasAnamnese): RespostasAnamnese {
  const out: RespostasAnamnese = { dados: { ...a.dados }, respostas: { ...a.respostas }, detalhes: {}, chips: {}, remedios: [] };
  for (const q of tpl.passos.flatMap((p) => p.perguntas)) {
    if (a.respostas[q.id] !== 'Sim') continue;
    if (q.detalhe && a.detalhes[q.id]?.trim()) out.detalhes[q.id] = a.detalhes[q.id].trim();
    if (q.chips && a.chips[q.id]?.length) out.chips[q.id] = [...a.chips[q.id]];
    if (q.remedios) out.remedios = remediosPreenchidos(a).map((r) => ({ nome: r.nome.trim(), dose: r.dose.trim() }));
  }
  return out;
}

/** Complemento de uma resposta "Sim": chips, detalhe e/ou remédios. */
function complemento(q: PerguntaAnamnese, a: RespostasAnamnese): string {
  const partes: string[] = [];
  const chips = a.chips[q.id] ?? [];
  if (chips.length) partes.push(chips.join(', '));
  const det = a.detalhes[q.id]?.trim();
  if (det) partes.push(chips.length ? `(${det})` : det);
  if (q.remedios) {
    const rs = remediosPreenchidos(a).map((r) => (r.dose.trim() ? `${r.nome.trim()} ${r.dose.trim()}` : r.nome.trim()));
    if (rs.length) partes.push(rs.join('; '));
  }
  return partes.join(' ');
}

/**
 * Alertas críticos tipados derivados das respostas. "Não sei" também gera
 * alerta (para confirmar com o paciente), porque o risco é o mesmo.
 */
export function derivarAlertas(tpl: AnamneseTemplate, a: RespostasAnamnese): AlertaCritico[] {
  const out: AlertaCritico[] = [];
  for (const q of tpl.passos.flatMap((p) => p.perguntas)) {
    if (!q.alerta) continue;
    const r = a.respostas[q.id];
    if (r === 'Sim') {
      const extra = complemento(q, a);
      out.push({ id: `al-${q.id}`, tipo: q.alerta.tipo, curto: q.alerta.curto, texto: extra ? `${q.alerta.texto}: ${extra}` : q.alerta.texto });
    } else if (r === 'Não sei') {
      out.push({ id: `al-${q.id}`, tipo: q.alerta.tipo, curto: q.alerta.curto, texto: `${q.alerta.texto}? Não sabe informar · confirmar` });
    }
  }
  return out;
}

export interface LinhaResumo {
  id: string;
  rotulo: string;
  valor: string;
  critico: boolean;
}

/** Pergunta -> linha exibida à equipe na ficha ("Sim — Penicilina (urticária)"). */
export function resumoPergunta(q: PerguntaAnamnese, a: RespostasAnamnese): LinhaResumo {
  const r = a.respostas[q.id];
  const extra = r === 'Sim' ? complemento(q, a) : '';
  return {
    id: q.id,
    rotulo: q.rotulo,
    valor: !r ? 'Sem resposta' : extra ? `${r} — ${extra}` : r,
    critico: !!q.alerta && (r === 'Sim' || r === 'Não sei'),
  };
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui';
import { formatarData } from '@/utils/dates';
import { useSessao, useUsuarios } from '@/hooks/useAuth';
import { useClinica } from '@/hooks/useClinica';
import { useAbrirLinkAnamnese, useEnviarAnamnese, useSalvarRascunhoAnamnese } from '@/modules/pacientes/services';
import type { AberturaLink } from '@/modules/pacientes/services';
import type { AnamneseTemplate, Patient, RespostasAnamnese } from '@/mock/types';
import { DadosPessoaisForm } from '@/modules/pacientes/components/anamnese/DadosPessoaisForm';
import { PerguntaCard } from '@/modules/pacientes/components/anamnese/PerguntaCard';
import { TelaBloqueio } from '@/modules/pacientes/components/anamnese/TelaBloqueio';
import { errosDados, errosPasso, respostasIniciais, type Erros } from '@/modules/pacientes/utils/anamnese/respostas';
import { LINK_VALIDADE_HORAS } from '@/modules/pacientes/utils/anamnese/regras';

type Tela =
  | { id: 'boasvindas' }
  | { id: 'passo'; i: number }
  | { id: 'obrigado' }
  | { id: 'expirado' };

/**
 * Totem do tablet. O paciente não faz login: o token da URL é a única credencial
 * e vale uma vez. O travamento real do tablet é do sistema (modo quiosque ou acesso guiado).
 */
export function TotemAnamnesePage({ token }: { token: string }) {
  const abrir = useAbrirLinkAnamnese();
  // Lido só no cliente, depois de montar (o estado vive na memória do navegador).
  const [abertura, setAbertura] = useState<AberturaLink | null>(null);
  useEffect(() => setAbertura(abrir(token)), [abrir, token]);

  if (!abertura) return null;
  if (abertura.situacao !== 'ativo' || !abertura.patient || !abertura.template) {
    return <Totem token={token} inicial={{ id: 'expirado' }} codigo={abertura.codigo} criadoEm={abertura.criadoEm} />;
  }
  return (
    <Totem
      token={token}
      inicial={{ id: 'boasvindas' }}
      codigo={abertura.codigo}
      criadoEm={abertura.criadoEm}
      paciente={abertura.patient}
      template={abertura.template}
      rascunho={abertura.rascunho}
    />
  );
}

function Totem({
  token,
  inicial,
  codigo,
  criadoEm,
  paciente,
  template,
  rascunho,
}: {
  token: string;
  inicial: Tela;
  codigo: string | null;
  criadoEm: string | null;
  paciente?: Patient;
  template?: AnamneseTemplate;
  rascunho?: RespostasAnamnese | null;
}) {
  const router = useRouter();
  const clinic = useClinica();
  const users = useUsuarios();
  const session = useSessao();
  const salvarRascunho = useSalvarRascunhoAnamnese();
  const enviar = useEnviarAnamnese();

  const [tela, setTela] = useState<Tela>(inicial);
  const [equipe, setEquipe] = useState<null | 'pin' | { liberadoPor: string }>(null);
  const [mostrarErros, setMostrarErros] = useState(false);
  const [a, setA] = useState<RespostasAnamnese>(() => {
    if (rascunho) return structuredClone(rascunho);
    const [y, m, d] = (paciente?.nascimento ?? '').split('-');
    return respostasIniciais({
      nome: paciente?.nome ?? '',
      nascimento: paciente ? `${d}/${m}/${y}` : '',
      cpf: paciente?.cpf ?? '',
      celular: paciente?.telefone ?? '',
      emergenciaNome: '',
      emergenciaTelefone: '',
    });
  });
  const mainRef = useRef<HTMLElement>(null);

  const passos = template?.passos ?? [];
  const nomes = ['Dados pessoais', ...passos.map((p) => p.titulo)];
  const total = nomes.length;
  const enviado = tela.id === 'obrigado';
  const primeiroNome = paciente?.nome.split(' ')[0] ?? '';

  const erros: Erros = useMemo(() => {
    if (tela.id !== 'passo') return {};
    return tela.i === 0 ? errosDados(a.dados) : errosPasso(passos[tela.i - 1], a);
  }, [tela, a, passos]);
  const nErros = Object.keys(erros).length;

  function ir(t: Tela) {
    setTela(t);
    setMostrarErros(false);
    mainRef.current?.scrollTo({ top: 0 });
  }

  function continuar() {
    if (tela.id !== 'passo') return;
    if (nErros > 0) {
      setMostrarErros(true);
      mainRef.current?.scrollTo({ top: 0 });
      return;
    }
    if (tela.i < total - 1) {
      salvarRascunho(token, a);
      return ir({ id: 'passo', i: tela.i + 1 });
    }
    const r = enviar(token, a);
    if (r.ok) return ir({ id: 'obrigado' });
    if (r.motivo === 'link') return ir({ id: 'expirado' });
    // Validação do "servidor" recusou: volta ao primeiro passo com erro.
    const comErro = passos.findIndex((p) => Object.keys(errosPasso(p, a)).length > 0);
    setTela({ id: 'passo', i: Object.keys(errosDados(a.dados)).length > 0 ? 0 : comErro + 1 });
    setMostrarErros(true);
  }

  function abrirEquipe() {
    if (tela.id === 'passo' || tela.id === 'boasvindas') salvarRascunho(token, a);
    setEquipe('pin');
  }

  if (equipe === 'pin') {
    return (
      <Moldura>
        <TelaBloqueio onLiberado={(userId) => setEquipe({ liberadoPor: userId })} onCancelar={() => setEquipe(null)} />
      </Moldura>
    );
  }

  if (equipe) {
    const quem = users.find((u) => u.id === equipe.liberadoPor)?.nome ?? '—';
    const salvos = tela.id === 'passo' ? `${tela.i} de ${total} passos` : 'nenhum passo concluído';
    const destino = !session ? '/login' : paciente ? `/pacientes/${paciente.id}` : '/pacientes';
    return (
      <Moldura>
        <main className="flex flex-1 items-center justify-center bg-ink px-10 text-white">
          <div className="flex max-w-[640px] flex-col items-center gap-5 text-center">
            <Icon name="lock_open" size={72} className="text-brand-mid" />
            <h1 className="m-0 text-[38px] font-bold">Modo totem encerrado</h1>
            <p className="m-0 text-[19px] leading-normal text-line-strong">
              {enviado
                ? `Respostas enviadas. Liberado por ${quem}.`
                : tela.id === 'expirado'
                ? `Liberado por ${quem}.`
                : `Liberado por ${quem}. Respostas salvas: ${salvos}. O questionário pode ser retomado enviando de novo pela ficha do paciente.`}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {!enviado && tela.id !== 'expirado' && (
                <button
                  type="button"
                  onClick={() => setEquipe(null)}
                  className="h-[60px] rounded-[14px] border-2 border-ink-700 px-6 text-[19px] font-semibold"
                >
                  Voltar ao modo totem
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push(destino)}
                className="flex h-[60px] items-center gap-2 rounded-[14px] bg-brand px-6 text-[19px] font-semibold"
              >
                <Icon name="person" size={24} />
                {paciente && session ? 'Ir para a ficha do paciente' : session ? 'Ir para Pacientes' : 'Ir para o login'}
              </button>
            </div>
          </div>
        </main>
      </Moldura>
    );
  }

  const cabecalho = (
    <header className="flex h-[76px] shrink-0 items-center gap-3.5 border-b border-line bg-white px-8">
      <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-brand text-[19px] font-bold text-white">
        {clinic.nome.charAt(clinic.nome.indexOf(' ') + 1) || 'I'}
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-lg font-bold">{clinic.nome}</span>
        <span className="text-sm text-ink-600">Questionário de saúde</span>
      </div>
      {tela.id === 'passo' && (
        <span className="text-lg font-semibold tabular-nums text-ink-700">
          Passo {tela.i + 1} de {total}
        </span>
      )}
      <button
        type="button"
        onClick={abrirEquipe}
        aria-label="Área da equipe"
        className="ml-3 flex h-12 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-ink-500"
      >
        <Icon name="lock" size={20} />
        Equipe
      </button>
    </header>
  );

  if (tela.id === 'boasvindas') {
    return (
      <Moldura>
        {cabecalho}
        <main className="flex flex-1 items-center justify-center overflow-auto p-10">
          <div className="flex w-full max-w-[820px] flex-col gap-8">
            <div className="flex flex-col gap-3.5">
              <span className="text-xl font-semibold text-brand">Bem-vindo à {clinic.nome}</span>
              <h1 className="m-0 text-5xl font-bold leading-[1.1] tracking-tight">Olá, {primeiroNome}</h1>
              <p className="m-0 text-[22px] leading-normal text-ink-700">
                Antes da consulta, responda algumas perguntas sobre sua saúde. Isso ajuda o dentista a cuidar de você com
                segurança.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {nomes.map((n, i) => (
                <span key={n} className="flex h-12 items-center gap-2.5 rounded-xl border border-line bg-white px-4 text-lg font-medium">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-[15px] font-bold text-brand-dark">
                    {i + 1}
                  </span>
                  {n}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-7 text-lg text-ink-700">
              <span className="flex items-center gap-2">
                <Icon name="schedule" size={24} className="text-brand" />
                Cerca de 5 minutos
              </span>
              <span className="flex items-center gap-2">
                <Icon name="shield_person" size={24} className="text-brand" />
                Somente a equipe da clínica verá suas respostas
              </span>
            </div>
            {rascunho && (
              <div className="flex items-center gap-2.5 rounded-xl border border-info-border bg-info-bg px-4 py-3 text-[17px] text-info-text">
                <Icon name="history" size={24} className="text-info" />
                Suas respostas anteriores foram guardadas. Você pode conferir e continuar.
              </div>
            )}
            <div className="flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={() => ir({ id: 'passo', i: 0 })}
                className="flex h-[76px] min-w-[320px] items-center justify-center gap-3 rounded-2xl bg-brand px-9 text-2xl font-bold text-white active:bg-brand-dark"
              >
                Começar
                <Icon name="arrow_forward" size={30} />
              </button>
              <span className="text-lg text-ink-600">
                Não é você? <strong className="text-ink">Avise a recepção antes de começar.</strong>
              </span>
            </div>
          </div>
        </main>
      </Moldura>
    );
  }

  if (tela.id === 'obrigado') {
    return (
      <Moldura>
        {cabecalho}
        <main className="flex flex-1 items-center justify-center p-10">
          <div className="flex max-w-[760px] flex-col items-center gap-6 text-center">
            <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-ok-bg text-ok">
              <Icon name="check_circle" size={72} fill />
            </div>
            <h1 className="m-0 text-[52px] font-bold leading-[1.1] tracking-tight">Obrigado, {primeiroNome}!</h1>
            <div className="flex items-center gap-3.5 rounded-2xl bg-brand px-7 py-5 text-[28px] font-bold text-white">
              <Icon name="tablet" size={36} />
              Entregue o tablet à recepção
            </div>
            <p className="m-0 max-w-[600px] text-xl leading-normal text-ink-700">
              Suas respostas foram enviadas. O dentista vai revisá-las com você antes do atendimento. Por segurança, este
              questionário foi fechado.
            </p>
          </div>
        </main>
      </Moldura>
    );
  }

  if (tela.id === 'expirado') {
    return (
      <Moldura>
        {cabecalho}
        <main className="flex flex-1 items-center justify-center p-10">
          <div className="flex max-w-[760px] flex-col items-center gap-[22px] text-center">
            <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-warn-bg text-warn">
              <Icon name="link_off" size={64} />
            </div>
            <h1 className="m-0 text-[42px] font-bold leading-[1.15] tracking-tight">
              Este questionário expirou
              <br />
              ou já foi respondido
            </h1>
            <p className="m-0 max-w-[620px] text-xl leading-normal text-ink-700">
              Por segurança, cada questionário pode ser respondido uma única vez e vale por {LINK_VALIDADE_HORAS} horas.
              Nenhuma resposta foi perdida.
            </p>
            <div className="flex items-center gap-3.5 rounded-2xl border-2 border-brand bg-white px-[26px] py-[18px] text-2xl font-bold text-brand-dark">
              <Icon name="tablet" size={32} />
              Entregue o tablet à recepção para receber um novo
            </div>
            {codigo && criadoEm && (
              <span className="text-[15px] tabular-nums text-ink-600">
                Código para a recepção: {codigo} · gerado em {formatarData(criadoEm)} às {criadoEm.slice(11, 16)}
              </span>
            )}
          </div>
        </main>
      </Moldura>
    );
  }

  // Passos
  const i = tela.i;
  const passo = i > 0 ? passos[i - 1] : null;
  const errosVisiveis = mostrarErros ? erros : {};
  const respondidas = passo ? passo.perguntas.filter((q) => a.respostas[q.id]).length : 0;
  const obrigatoriosOk = 3 - (['nome', 'nascimento', 'celular'] as const).filter((k) => erros[k]).length;

  return (
    <Moldura>
      {cabecalho}
      <nav aria-label="Progresso" className="grid shrink-0 gap-2.5 border-b border-line bg-white px-8 pb-4 pt-[18px]" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
        {nomes.map((n, k) => (
          <div key={n} className="flex flex-col gap-2">
            <div className={`h-2 rounded-full ${k <= i ? 'bg-brand' : 'bg-line'}`} />
            <span
              className={`flex items-center gap-1.5 text-base ${
                k === i ? 'font-bold text-brand-dark' : k < i ? 'font-medium text-ink-700' : 'font-medium text-ink-500'
              }`}
            >
              {k < i && <Icon name="check_circle" size={20} className="text-brand" />}
              <span className="truncate">{n}</span>
            </span>
          </div>
        ))}
      </nav>

      <main ref={mainRef} className="min-h-0 flex-1 overflow-auto px-8 pb-8 pt-7">
        <div className="mx-auto flex max-w-[1000px] flex-col gap-4">
          <div className="mb-1 flex flex-col gap-1.5">
            <h1 className="m-0 text-[34px] font-bold tracking-tight">{nomes[i]}</h1>
            <p className="m-0 text-[19px] text-ink-700">{passo ? passo.subtitulo : 'Confira seus dados de contato.'}</p>
          </div>

          {mostrarErros && nErros > 0 && (
            <div role="alert" className="flex items-center gap-3.5 rounded-2xl border-2 border-[#F97066] bg-danger-bg px-5 py-4 text-[19px] text-danger-text">
              <Icon name="error" size={28} fill className="text-danger" />
              <span>
                <strong>
                  {passo
                    ? nErros === 1 ? 'Falta responder 1 pergunta.' : `Faltam ${nErros} respostas.`
                    : nErros === 1 ? 'Falta 1 campo.' : `Faltam ${nErros} campos.`}
                </strong>{' '}
                {nErros === 1 ? 'Ela está marcada' : 'Elas estão marcadas'} em vermelho abaixo.
              </span>
            </div>
          )}

          {passo ? (
            passo.perguntas.map((q) => (
              <PerguntaCard key={q.id} q={q} a={a} erro={errosVisiveis[q.id] ?? null} onChange={(fn) => setA(fn)} />
            ))
          ) : (
            <DadosPessoaisForm dados={a.dados} erros={errosVisiveis} onChange={(dados) => setA((x) => ({ ...x, dados }))} />
          )}
        </div>
      </main>

      <footer className="flex h-[104px] shrink-0 items-center justify-between gap-4 border-t border-line bg-white px-8 shadow-[0_-2px_8px_rgba(16,40,56,.04)]">
        <button
          type="button"
          onClick={() => ir(i === 0 ? { id: 'boasvindas' } : { id: 'passo', i: i - 1 })}
          className="flex h-[68px] min-w-[180px] items-center justify-center gap-2.5 rounded-[14px] border-2 border-line-strong bg-white px-6 text-[21px] font-semibold active:bg-surface-bg"
        >
          <Icon name="arrow_back" size={26} />
          Voltar
        </button>
        <span className="text-[17px] text-ink-600">
          {passo ? `${respondidas} de ${passo.perguntas.length} respondidas` : `${obrigatoriosOk} de 3 campos obrigatórios`}
        </span>
        <button
          type="button"
          onClick={continuar}
          className="flex h-[68px] min-w-[300px] items-center justify-center gap-2.5 rounded-[14px] bg-brand px-7 text-[21px] font-bold text-white active:bg-brand-dark"
        >
          {i === total - 1 ? 'Enviar respostas' : 'Continuar'}
          <Icon name={i === total - 1 ? 'send' : 'arrow_forward'} size={26} />
        </button>
      </footer>
    </Moldura>
  );
}

/** Ocupa a tela toda abaixo do banner do protótipo (sem sidebar). */
function Moldura({ children }: { children: ReactNode }) {
  return <div className="flex h-[calc(100vh-28px)] flex-col overflow-hidden bg-surface-bg">{children}</div>;
}

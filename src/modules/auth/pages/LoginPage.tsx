'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '@/hooks/useAuth';
import { useClinica } from '@/hooks/useClinica';
import type { Role } from '@/mock/types';
import { Button, Field, Icon } from '@/components/ui';

export function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const clinic = useClinica();
  const [step, setStep] = useState<'creds' | 'perfil'>('creds');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [ver, setVer] = useState(false);

  const pronto = email.trim() !== '' && senha.trim() !== '';

  function entrar(role: Role) {
    login(role);
    router.push('/inicio');
  }

  return (
    <div className="flex h-[calc(100vh-28px)] min-h-[640px] bg-surface-bg">
      {/* Painel esquerdo */}
      <div className="flex w-[560px] shrink-0 flex-col gap-8 bg-brand-soft p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-brand text-[19px] font-bold text-white">
            I
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-lg font-bold">{clinic.nome}</div>
            <div className="text-[13px] text-[#3B5B58]">{clinic.subtitulo}</div>
          </div>
        </div>
        <div
          className="flex flex-1 items-center justify-center rounded-[16px] font-mono text-[13px] text-[#2F5F5A]"
          style={{ background: 'repeating-linear-gradient(135deg,#D7EDE9 0 10px,#CDE7E2 10px 20px)' }}
        >
          foto da recepção da clínica
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="text-[26px] font-bold leading-tight tracking-tight text-[#0B3B37]">
            Tudo o que você precisa durante o atendimento, em poucos cliques.
          </div>
          <div className="text-[15px] leading-relaxed text-[#2F4F4C]">
            Agenda, registro clínico e documentos para impressão. Uso restrito à equipe da clínica.
          </div>
        </div>
      </div>

      {/* Painel direito */}
      <div className="flex flex-1 items-center justify-center">
        <div className="flex w-[440px] flex-col gap-7">
          {step === 'creds' ? (
            <>
              <div className="flex flex-col gap-2">
                <div className="text-[13px] font-semibold tracking-wider text-brand">ETAPA 1 DE 2</div>
                <h1 className="m-0 text-[30px] font-bold tracking-tight">Entrar</h1>
                <div className="text-[15px] text-ink-600">Use seu e-mail profissional cadastrado pela clínica.</div>
              </div>
              <form
                className="flex flex-col gap-[18px]"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (pronto) setStep('perfil');
                }}
              >
                <Field
                  big
                  label="E-mail"
                  type="email"
                  placeholder="nome@odontoipe.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
                <Field
                  big
                  label="Senha"
                  type={ver ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  right={
                    <button
                      type="button"
                      aria-label={ver ? 'Ocultar senha' : 'Mostrar senha'}
                      onClick={() => setVer((v) => !v)}
                      className="flex h-10 w-10 items-center justify-center rounded-md text-ink-600 hover:bg-surface-hover"
                    >
                      <Icon name={ver ? 'visibility_off' : 'visibility'} size={22} />
                    </button>
                  }
                />
                <Button type="submit" size="lg" disabled={!pronto}>
                  Continuar
                </Button>
                <div className="text-center text-[13px] text-ink-500">
                  {pronto ? 'Protótipo: qualquer e-mail e senha entram.' : 'Preencha e-mail e senha para continuar.'}
                </div>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('creds')}
                className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink"
              >
                <Icon name="arrow_back" size={18} />
                Voltar
              </button>
              <div className="flex flex-col gap-2">
                <div className="text-[13px] font-semibold tracking-wider text-brand">ETAPA 2 DE 2 · DEMONSTRAÇÃO</div>
                <h1 className="m-0 text-[30px] font-bold tracking-tight">Escolha o perfil</h1>
                <div className="text-[15px] leading-normal text-ink-600">
                  Em vez do código de verificação, o protótipo pergunta com qual perfil você quer demonstrar o sistema.
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <PerfilCard
                  icon="stethoscope"
                  titulo="Dentista"
                  desc="Acesso completo: registro clínico, odontograma, receitas e plano."
                  onClick={() => entrar('dentista')}
                />
                <PerfilCard
                  icon="support_agent"
                  titulo="Recepção"
                  desc="Agenda e cadastro. Sem acesso à linha do tempo clínica."
                  onClick={() => entrar('recepcao')}
                />
              </div>
            </>
          )}
          <div className="flex items-center gap-2 border-t border-line pt-5 text-[13px] text-ink-500">
            <Icon name="lock" size={18} />
            Ambiente de demonstração. Nenhuma credencial é verificada.
          </div>
        </div>
      </div>
    </div>
  );
}

function PerfilCard({ icon, titulo, desc, onClick }: { icon: string; titulo: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 rounded-xl border border-line bg-white p-4 text-left shadow-card hover:border-brand"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
        <Icon name={icon} size={26} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-base font-semibold">{titulo}</span>
        <span className="text-[13px] leading-snug text-ink-600">{desc}</span>
      </span>
      <Icon name="chevron_right" size={22} className="ml-auto text-ink-400" />
    </button>
  );
}

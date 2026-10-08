'use client';

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/ui';
import { horaDe } from '@/lib/dates';
import { useStore } from '@/mock/store';
import { PIN_BLOQUEIO_MINUTOS, PIN_DIGITOS } from '../lib/regras';

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'apagar'];

/** "Área da equipe": PIN para sair do modo totem. Verificação, tentativas e bloqueio ficam no store ("servidor"). */
export function TelaBloqueio({ onLiberado, onCancelar }: { onLiberado: (userId: string) => void; onCancelar: () => void }) {
  const verificar = useStore((s) => s.verificarPinTotem);
  const bloqueadoAte = useStore((s) => s.totemPin.bloqueadoAte);
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [agoraMs, setAgoraMs] = useState(() => Date.now());

  const bloqueado = !!bloqueadoAte && agoraMs < bloqueadoAte;

  // Enquanto bloqueado, atualiza o relógio para liberar o teclado no fim do prazo.
  useEffect(() => {
    if (!bloqueadoAte) return;
    const t = setInterval(() => setAgoraMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [bloqueadoAte]);
  useEffect(() => {
    if (bloqueadoAte && agoraMs >= bloqueadoAte) setErro(null);
  }, [bloqueadoAte, agoraMs]);

  const pressionar = useCallback(
    (k: string) => {
      if (bloqueado) return;
      if (k === 'apagar') return setPin((p) => p.slice(0, -1));
      const novo = pin + k;
      if (novo.length < PIN_DIGITOS) {
        setPin(novo);
        setErro(null);
        return;
      }
      setPin('');
      const r = verificar(novo);
      setAgoraMs(Date.now());
      if (r.ok) return onLiberado(r.userId);
      setErro(
        r.bloqueadoAte
          ? `Tablet bloqueado por ${PIN_BLOQUEIO_MINUTOS} minutos.`
          : `Restam ${r.tentativasRestantes} tentativa${r.tentativasRestantes > 1 ? 's' : ''}.`,
      );
    },
    [bloqueado, pin, verificar, onLiberado],
  );

  // Teclado físico (computador) também funciona.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (/^\d$/.test(e.key)) pressionar(e.key);
      else if (e.key === 'Backspace') pressionar('apagar');
      else if (e.key === 'Escape') onCancelar();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pressionar, onCancelar]);

  return (
    <main className="flex flex-1 flex-col bg-ink text-white md:flex-row">
      <div className="flex flex-1 flex-col justify-center gap-7 px-10 py-10 md:px-[72px]">
        <div className="flex items-center gap-2.5 text-base font-semibold tracking-[0.05em] text-brand-border">
          <Icon name="admin_panel_settings" size={22} />
          ÁREA DA EQUIPE
        </div>
        <h1 className="m-0 text-[40px] font-bold leading-tight tracking-tight">Sair do modo totem</h1>
        <p className="m-0 max-w-[440px] text-[19px] leading-normal text-line-strong">
          Digite o PIN de {PIN_DIGITOS} dígitos do dentista ou da recepção. As respostas já dadas pelo paciente ficam salvas.
        </p>
        <div aria-live="polite" aria-label={`${pin.length} de ${PIN_DIGITOS} dígitos`} className="flex gap-[18px]">
          {Array.from({ length: PIN_DIGITOS }, (_, i) => (
            <span
              key={i}
              className={`h-[26px] w-[26px] rounded-full border-2 ${
                i < pin.length ? 'border-brand-mid bg-brand-mid' : erro || bloqueado ? 'border-[#F97066]' : 'border-ink-400'
              }`}
            />
          ))}
        </div>
        {(erro || bloqueado) && (
          <div role="alert" className="flex w-fit items-center gap-2.5 rounded-xl bg-danger-bg px-4 py-3 text-[17px] font-semibold text-danger-text">
            <Icon name="error" size={24} fill className="text-danger" />
            {bloqueado && bloqueadoAte
              ? `PIN incorreto várias vezes. Tablet bloqueado até ${horaDe(bloqueadoAte)}.`
              : `PIN incorreto. ${erro}`}
          </div>
        )}
        <button
          type="button"
          onClick={onCancelar}
          className="flex h-[60px] w-fit items-center gap-2.5 rounded-[14px] border-2 border-ink-700 bg-transparent px-6 text-[19px] font-semibold"
        >
          <Icon name="arrow_back" size={24} />
          Voltar ao questionário
        </button>
        <span className="text-sm text-ink-400">Protótipo · PIN de teste da Dra. Helena: 2580</span>
      </div>
      <div className="flex items-center justify-center bg-[#1A2D3A] px-10 py-10 md:w-[520px]">
        <div className="grid grid-cols-[repeat(3,112px)] gap-4">
          {TECLAS.map((k, i) =>
            k === '' ? (
              <span key={i} />
            ) : (
              <button
                key={i}
                type="button"
                disabled={bloqueado}
                aria-label={k === 'apagar' ? 'Apagar' : k}
                onClick={() => pressionar(k)}
                className={`flex h-24 items-center justify-center rounded-[20px] disabled:opacity-40 ${
                  k === 'apagar'
                    ? 'bg-transparent text-line-strong active:bg-[#24394A]'
                    : 'bg-[#24394A] text-4xl font-semibold tabular-nums active:bg-brand'
                }`}
              >
                {k === 'apagar' ? <Icon name="backspace" size={36} /> : k}
              </button>
            ),
          )}
        </div>
      </div>
    </main>
  );
}

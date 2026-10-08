'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, Button, Icon, Modal } from '@/components/ui';
import { horaDe } from '@/utils/dates';
import { useGerarLinkAnamnese } from '@/modules/pacientes/services';
import type { AnamneseLink } from '@/mock/types';

type Envio = { token: string; link: AnamneseLink };

/** Gera o link de uso único. O token só fica na memória deste componente (o store guarda o hash). */
export function useEnviarAoTablet() {
  const gerar = useGerarLinkAnamnese();
  const [envio, setEnvio] = useState<Envio | null>(null);
  return {
    envio,
    enviar: (patientId: string) => setEnvio(gerar(patientId)),
    fechar: () => setEnvio(null),
  };
}

export function EnviarTabletDialog({ envio, onClose }: { envio: Envio | null; onClose: () => void }) {
  const router = useRouter();
  if (!envio) return null;
  return (
    <Modal
      open
      width={520}
      title="Anamnese pronta para o tablet"
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          <Button icon="tablet" onClick={() => router.push(`/totem/${envio.token}`)}>
            Abrir modo totem aqui
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 rounded-xl border border-line bg-surface-subtle px-4 py-3.5">
          <Icon name="qr_code_2" size={36} className="text-brand" />
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-bold tabular-nums text-ink">{envio.link.codigo}</span>
            <span className="text-sm text-ink-600">
              Link de uso único · válido até {horaDe(envio.link.expiraEm)} · modelo v{envio.link.templateVersao}
            </span>
          </div>
        </div>
        <p className="m-0">
          Entregue o tablet ao paciente. Ao terminar, ele devolve o tablet à recepção e a equipe sai do modo totem com o
          PIN. Links anteriores deste paciente que não foram usados deixam de valer.
        </p>
        <Alert tone="info">
          O tablet deve estar travado pelo próprio aparelho (modo quiosque no Android ou Acesso Guiado no iPad). O navegador
          sozinho não impede o paciente de sair da página.
        </Alert>
        <p className="m-0 text-[13px] text-ink-500">
          Protótipo: não há tablet de verdade, então o modo totem abre neste mesmo navegador.
        </p>
      </div>
    </Modal>
  );
}

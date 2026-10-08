'use client';

import { Imprimivel, LinhaAssinatura, RodapeImpressao, Timbre } from '@/components/print/Imprimivel';
import { dataHora } from '@/lib/dates';
import { useStore } from '@/mock/store';
import type { IssuedDocument } from '@/mock/types';

/** Reimpressão a partir do snapshot gravado na emissão (o modelo atual não interfere). */
export function DocumentoImpressao({ doc, onFim }: { doc: IssuedDocument; onFim: () => void }) {
  const paciente = useStore((s) => s.patients.find((p) => p.id === doc.patientId));
  const autor = useStore((s) => s.users.find((u) => u.id === doc.autorId));
  return (
    <Imprimivel onFim={onFim}>
      <Timbre titulo={doc.titulo} direita={`nº ${doc.numero} · emitido em ${dataHora(doc.criadoEm)}`} />
      <section className="mb-4 text-[12px]">
        <strong>Paciente:</strong> {paciente?.nome} · prontuário nº {paciente?.prontuarioNo}
        {paciente?.responsavel && <> · responsável: {paciente.responsavel}</>}
      </section>
      <div className="min-h-[200px] whitespace-pre-wrap text-[13px] leading-relaxed">{doc.conteudo || doc.subtitulo}</div>
      <LinhaAssinatura rotulo={autor ? `${autor.nome}${autor.cro ? ` · ${autor.cro}` : ''}` : 'Assinatura'} />
      <RodapeImpressao>
        Reimpressão do documento nº {doc.numero}, com o conteúdo gravado na emissão. Documento para assinatura à mão. Hash {doc.hash}.
      </RodapeImpressao>
    </Imprimivel>
  );
}

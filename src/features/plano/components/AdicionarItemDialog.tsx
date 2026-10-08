'use client';

import { useMemo, useState } from 'react';
import { Alert, Button, Field, Modal, Select } from '@/components/ui';
import { ORDEM_FACES, dentesValidos, nomeDente, nomeFace, siglaFace } from '@/features/odontograma/lib/dentes';
import { formatarCentavos } from '@/lib/dinheiro';
import { useCurrentUser, useStore } from '@/mock/store';
import type { Face, TreatmentPlan } from '@/mock/types';

export function AdicionarItemDialog({
  patientId,
  plano,
  etapaSugerida,
  inicial,
  onFechar,
}: {
  patientId: string;
  plano: TreatmentPlan | null;
  etapaSugerida: number;
  inicial: { dente: number | null; faces: Face[] };
  onFechar: (msg?: string) => void;
}) {
  const user = useCurrentUser();
  const users = useStore((s) => s.users);
  const procedures = useStore((s) => s.procedures);
  const adicionar = useStore((s) => s.adicionarItemPlano);
  const ativos = useMemo(() => procedures.filter((p) => p.ativo), [procedures]);
  const dentistas = useMemo(() => users.filter((u) => u.papel === 'dentista'), [users]);

  const [procId, setProcId] = useState(() => {
    if (inicial.dente === null) return ativos[0]?.id ?? '';
    return (ativos.find((p) => p.escopo === (inicial.faces.length ? 'face' : 'dente')) ?? ativos[0])?.id ?? '';
  });
  const [dente, setDente] = useState(inicial.dente ? String(inicial.dente) : '');
  const [faces, setFaces] = useState<Face[]>(inicial.faces);
  const [etapa, setEtapa] = useState(String(etapaSugerida));
  const [dentistaId, setDentistaId] = useState(user?.papel === 'dentista' ? user.id : dentistas[0]?.id ?? '');
  const [nota, setNota] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const proc = ativos.find((p) => p.id === procId);
  const nDente = Number(dente);
  const denteOk = dentesValidos.has(nDente);

  function salvar() {
    if (!proc) return;
    const r = adicionar(patientId, {
      procedureId: proc.id,
      dente: proc.escopo === 'boca' ? null : denteOk ? nDente : null,
      faces: proc.escopo === 'face' ? faces : [],
      etapa: Number(etapa),
      dentistaId,
      nota,
    });
    if (!r.ok) return setErro(r.erro);
    onFechar(`${proc.nome} incluído no plano como proposto.`);
  }

  return (
    <Modal
      open
      width={560}
      title="Adicionar procedimento ao plano"
      onClose={() => onFechar()}
      actions={
        <>
          <Button variant="secondary" onClick={() => onFechar()}>
            Cancelar
          </Button>
          <Button icon="add" onClick={salvar}>
            Adicionar ao plano
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {plano?.aprovadoEm && (
          <Alert tone="info">
            O plano v{plano.versao} já foi aprovado. Ao incluir este procedimento, o sistema cria a <strong>versão {plano.versao + 1}</strong> e preserva
            a anterior. O novo item precisa de um novo orçamento.
          </Alert>
        )}
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
          Procedimento
          <Select value={procId} onChange={(e) => setProcId(e.target.value)}>
            {ativos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} · {formatarCentavos(p.precoCentavos)}
              </option>
            ))}
          </Select>
          <span className="text-[13px] font-normal text-ink-500">Catálogo e preços de exemplo da clínica (fictícios).</span>
        </label>
        {proc && proc.escopo !== 'boca' && (
          <div className="grid grid-cols-[140px_1fr] items-start gap-4">
            <Field
              label="Dente (FDI)"
              inputMode="numeric"
              value={dente}
              onChange={(e) => setDente(e.target.value.replace(/\D/g, '').slice(0, 2))}
              error={dente && !denteOk ? 'Dente inválido' : undefined}
            />
            <div className="flex flex-col gap-1.5 pt-[30px] text-[13px] text-ink-600">{denteOk ? nomeDente(nDente) : 'Ex.: 36, 11, 85'}</div>
          </div>
        )}
        {proc?.escopo === 'face' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Faces</span>
            <div className="flex gap-2">
              {ORDEM_FACES.map((f) => {
                const on = faces.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={on}
                    title={denteOk ? nomeFace(nDente, f) : f}
                    onClick={() => setFaces((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f]))}
                    className={`h-10 w-12 rounded-md border text-sm ${on ? 'border-brand bg-brand-soft font-bold text-brand-dark' : 'border-line-strong bg-white font-medium'}`}
                  >
                    {denteOk ? siglaFace(nDente, f) : f}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="grid grid-cols-[140px_1fr] gap-4">
          <Field label="Etapa" inputMode="numeric" value={etapa} onChange={(e) => setEtapa(e.target.value.replace(/\D/g, '').slice(0, 2))} />
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
            Dentista responsável
            <Select value={dentistaId} onChange={(e) => setDentistaId(e.target.value)}>
              {dentistas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <Field label="Observação (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ex.: após a conclusão do canal" />
        {erro && <Alert tone="danger">{erro}</Alert>}
      </div>
    </Modal>
  );
}

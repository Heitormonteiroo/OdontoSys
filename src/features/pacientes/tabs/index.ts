import type { ComponentType } from 'react';
import type { Permissao } from '@/lib/permissions';
import type { Face, Patient } from '@/mock/types';
import { AnamneseTab } from './AnamneseTab';
import { DocumentosTab } from './DocumentosTab';
import { LinhaDoTempoTab } from './LinhaDoTempoTab';
import { OdontogramaTab } from './OdontogramaTab';
import { PlanoTab } from './PlanoTab';

export type AbaId = 'linha' | 'odonto' | 'plano' | 'docs' | 'anam';

/** Pedido de uma aba para outra (ex.: odontograma -> "Adicionar ao plano"). `n` muda a cada pedido. */
export type Intencao =
  | { n: number; tipo: 'nova-evolucao' }
  | { n: number; tipo: 'adicionar-procedimento'; dente: number | null; faces: Face[] };

type SemN<T> = T extends unknown ? Omit<T, 'n'> : never;

export interface AbaProps {
  paciente: Patient;
  /** Intenção dirigida a esta aba (ou null). */
  intencao: Intencao | null;
  irPara: (aba: AbaId, intencao?: SemN<Intencao>) => void;
}

export interface AbaConfig {
  id: AbaId;
  label: string;
  icon: string;
  /** Permissão necessária; sem ela a aba mostra o aviso "sem permissão". */
  permissao: Permissao;
  /** Como o aviso se refere à área ("a linha do tempo clínica"). */
  area: string;
  Component: ComponentType<AbaProps>;
}

/** Ordem das abas da ficha, conforme o design. */
export const ABAS: AbaConfig[] = [
  { id: 'linha', label: 'Linha do tempo', icon: 'timeline', permissao: 'prontuario:ver', area: 'a linha do tempo clínica', Component: LinhaDoTempoTab },
  { id: 'odonto', label: 'Odontograma', icon: 'dentistry', permissao: 'odontograma:ver', area: 'o odontograma', Component: OdontogramaTab },
  { id: 'plano', label: 'Plano e orçamento', icon: 'request_quote', permissao: 'plano:ver', area: 'o plano de tratamento', Component: PlanoTab },
  { id: 'docs', label: 'Documentos', icon: 'description', permissao: 'documentos:ver', area: 'os documentos', Component: DocumentosTab },
  { id: 'anam', label: 'Anamnese', icon: 'assignment', permissao: 'anamnese:ver', area: 'a anamnese', Component: AnamneseTab },
];

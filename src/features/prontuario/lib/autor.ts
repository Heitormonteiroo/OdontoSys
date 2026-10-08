import type { TipoEntrada, User } from '@/mock/types';

export const TIPOS_ENTRADA: Record<TipoEntrada, { label: string; icon: string }> = {
  evolucao: { label: 'Evolução clínica', icon: 'stethoscope' },
  procedimento: { label: 'Procedimento', icon: 'dentistry' },
  prescricao: { label: 'Prescrição', icon: 'prescriptions' },
  anamnese: { label: 'Anamnese', icon: 'assignment' },
  odontograma: { label: 'Odontograma', icon: 'grid_view' },
  plano: { label: 'Plano e orçamento', icon: 'request_quote' },
  adendo: { label: 'Adendo', icon: 'link' },
};

/** "Dra. Helena Prado · CRO-MS 0000", "Camila Souza · Recepção", "Paciente · tablet". */
export function rotuloAutor(users: User[], autorId: string | null): string {
  if (autorId === null) return 'Paciente · tablet';
  const u = users.find((x) => x.id === autorId);
  if (!u) return '—';
  return u.cro ? `${u.nome} · ${u.cro}` : `${u.nome} · ${u.papel === 'recepcao' ? 'Recepção' : 'Equipe'}`;
}

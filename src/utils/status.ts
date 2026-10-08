import type { Tone } from '@/components/ui';
import type { StatusTratamento } from '@/mock/types';

export const STATUS_TRATAMENTO: Record<StatusTratamento, { label: string; tone: Tone }> = {
  proposto: { label: 'Proposto', tone: 'info' },
  aprovado: { label: 'Aprovado', tone: 'brand' },
  em_andamento: { label: 'Em andamento', tone: 'warn' },
  concluido: { label: 'Concluído', tone: 'ok' },
  cancelado: { label: 'Cancelado', tone: 'neutral' },
};

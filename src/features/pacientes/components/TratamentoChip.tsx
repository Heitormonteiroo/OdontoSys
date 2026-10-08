import { Chip } from '@/components/ui';
import { STATUS_TRATAMENTO } from '@/lib/status';
import type { StatusTratamento } from '@/mock/types';

export function TratamentoChip({ status, size = 'sm' }: { status: StatusTratamento | null; size?: 'sm' | 'md' }) {
  if (!status) {
    return (
      <Chip tone="neutral" size={size}>
        Sem plano
      </Chip>
    );
  }
  const s = STATUS_TRATAMENTO[status];
  return (
    <Chip tone={s.tone} size={size} dot>
      {s.label}
    </Chip>
  );
}

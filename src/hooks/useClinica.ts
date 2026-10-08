'use client';

import { useStore } from '@/mock/store';

/** Dados da clínica (nome, timbre dos documentos). */
export const useClinica = () => useStore((s) => s.clinic);

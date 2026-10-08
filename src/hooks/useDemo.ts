'use client';

import { useStore } from '@/mock/store';

/** Só do protótipo: restaura os dados de exemplo. */
export const useRestaurarDemo = () => useStore((s) => s.reset);

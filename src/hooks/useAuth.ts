'use client';

import { useCurrentUser as useUsuarioDaSessao, useStore } from '@/mock/store';

/**
 * Sessão e usuários. Hoje lê o store de demonstração (login fictício);
 * na Fase 1 passa a usar o Supabase Auth (config/supabase).
 */
export const useCurrentUser = useUsuarioDaSessao;
export const useSessao = () => useStore((s) => s.session);
export const useUsuarios = () => useStore((s) => s.users);
export const useLogin = () => useStore((s) => s.login);
export const useLogout = () => useStore((s) => s.logout);

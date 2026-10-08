'use client';

import { useStore } from '@/mock/store';

export type { AberturaLink, ResultadoEnvio, ResultadoPin } from '@/mock/store/types';

/**
 * Acesso a dados do módulo Pacientes (cadastro, prontuário, anamnese,
 * odontograma e plano de tratamento). As telas só usam estas funções.
 * Hoje: store em memória (src/mock). Fase 1: chamadas à API do backend/Supabase.
 */

// Cadastro
export const usePacientes = () => useStore((s) => s.patients);
export const useCadastrarPaciente = () => useStore((s) => s.addPatient);

// Prontuário (linha do tempo append-only)
export const useEntradasClinicas = () => useStore((s) => s.clinicalEntries);
export const useRegistrarEvolucao = () => useStore((s) => s.registrarEvolucao);
export const useRegistrarAdendo = () => useStore((s) => s.registrarAdendo);

// Anamnese e totem
export const useModelosAnamnese = () => useStore((s) => s.anamneseTemplates);
export const useRespostasAnamnese = () => useStore((s) => s.anamneseRespostas);
export const useLinksAnamnese = () => useStore((s) => s.anamneseLinks);
export const useRascunhosAnamnese = () => useStore((s) => s.anamneseRascunhos);
export const useGerarLinkAnamnese = () => useStore((s) => s.gerarLinkAnamnese);
export const useAbrirLinkAnamnese = () => useStore((s) => s.abrirLinkAnamnese);
export const useSalvarRascunhoAnamnese = () => useStore((s) => s.salvarRascunhoAnamnese);
export const useEnviarAnamnese = () => useStore((s) => s.enviarAnamnese);
export const useConferirAnamnese = () => useStore((s) => s.conferirAnamnese);
export const useVerificarPinTotem = () => useStore((s) => s.verificarPinTotem);
export const useBloqueioTotem = () => useStore((s) => s.totemPin.bloqueadoAte);

// Odontograma (eventos append-only)
export const useEventosDente = () => useStore((s) => s.toothEvents);
export const useTiposAchado = () => useStore((s) => s.findingTypes);
export const useRegistrarEventoDente = () => useStore((s) => s.registrarEventoDente);

// Plano de tratamento
export const usePlanos = () => useStore((s) => s.treatmentPlans);
export const useItensPlano = () => useStore((s) => s.treatmentPlanItems);
export const useEventosItensPlano = () => useStore((s) => s.planItemEvents);
export const useProcedimentos = () => useStore((s) => s.procedures);
export const useAdicionarItemPlano = () => useStore((s) => s.adicionarItemPlano);
export const useMudarStatusItem = () => useStore((s) => s.mudarStatusItem);

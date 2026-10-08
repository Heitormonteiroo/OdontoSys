import type { StateCreator } from 'zustand';
import type { Patient } from '../types';
import type { AppState, PatientsSlice } from './types';

export const createPatientsSlice: StateCreator<AppState, [], [], PatientsSlice> = (set, get) => ({
  addPatient: (input) => {
    const proximo = Math.max(0, ...get().patients.map((p) => Number(p.prontuarioNo))) + 1;
    const prontuarioNo = String(proximo).padStart(5, '0');
    const novo: Patient = {
      id: `p-${prontuarioNo}`,
      ...input,
      prontuarioNo,
      alertas: [],
      anamnese: 'pendente',
      ultimoAtendimento: null,
      tratamento: null,
      novo: true,
    };
    set((s) => ({ patients: [novo, ...s.patients] }));
    return novo;
  },
});

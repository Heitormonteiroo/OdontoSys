import { hashSimulado } from '@/lib/hash';
import type { User } from '../types';

// Pessoas e registros profissionais FICTÍCIOS. O login usa o primeiro usuário de cada papel.
// PINs de teste do totem: Dra. Helena 2580 · Dr. Marcos 1470 · Camila 3690.
export const users: User[] = [
  { id: 'u-dentista', nome: 'Dra. Helena Prado', papel: 'dentista', cargo: 'Dentista · CRO-MS 0000 (fictício)', iniciais: 'HP', pinHash: hashSimulado('2580') },
  { id: 'u-dentista-2', nome: 'Dr. Marcos Teixeira', papel: 'dentista', cargo: 'Dentista · CRO-MS 0000 (fictício)', iniciais: 'MT', pinHash: hashSimulado('1470') },
  { id: 'u-recepcao', nome: 'Camila Souza', papel: 'recepcao', cargo: 'Recepção', iniciais: 'CS', pinHash: hashSimulado('3690') },
];

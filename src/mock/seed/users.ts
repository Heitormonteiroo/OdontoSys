import type { User } from '../types';

// Pessoas e registros profissionais FICTÍCIOS. O login usa o primeiro usuário de cada papel.
export const users: User[] = [
  { id: 'u-dentista', nome: 'Dra. Helena Prado', papel: 'dentista', cargo: 'Dentista · CRO-MS 0000 (fictício)', iniciais: 'HP' },
  { id: 'u-dentista-2', nome: 'Dr. Marcos Teixeira', papel: 'dentista', cargo: 'Dentista · CRO-MS 0000 (fictício)', iniciais: 'MT' },
  { id: 'u-recepcao', nome: 'Camila Souza', papel: 'recepcao', cargo: 'Recepção', iniciais: 'CS' },
];

export type Role = 'dentista' | 'recepcao';

export interface User {
  id: string;
  nome: string;
  papel: Role;
  cargo: string; // texto exibido na sidebar
  iniciais: string;
}

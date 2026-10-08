// Tipos do domínio do protótipo. Quando houver backend real, estes tipos
// são substituídos pelos tipos gerados do banco.

export type Role = 'dentista' | 'recepcao';

export interface User {
  id: string;
  nome: string;
  papel: Role;
  cargo: string; // texto exibido na sidebar
  iniciais: string;
}

export interface Clinic {
  nome: string;
  subtitulo: string;
}

export interface SeedData {
  clinic: Clinic;
  users: User[];
}

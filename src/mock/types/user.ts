export type Role = 'dentista' | 'recepcao';

export interface User {
  id: string;
  nome: string;
  papel: Role;
  cargo: string; // texto exibido na sidebar
  iniciais: string;
  /** Hash do PIN que desbloqueia o totem (no sistema real: argon2/bcrypt, só no servidor). */
  pinHash: string;
}

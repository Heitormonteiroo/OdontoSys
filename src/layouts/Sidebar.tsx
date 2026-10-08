'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCurrentUser, useLogout } from '@/hooks/useAuth';
import { useClinica } from '@/hooks/useClinica';
import { Avatar, Icon } from '@/components/ui';

const items = [
  { href: '/inicio', label: 'Início', icon: 'home' },
  { href: '/agenda', label: 'Agenda', icon: 'calendar_month' },
  { href: '/pacientes', label: 'Pacientes', icon: 'group' },
  { href: '/documentos', label: 'Documentos', icon: 'description' },
  { href: '/configuracoes', label: 'Configurações', icon: 'settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();
  const clinic = useClinica();
  const logout = useLogout();

  return (
    <nav
      aria-label="Navegação principal"
      className="no-print flex h-full w-[248px] shrink-0 flex-col border-r border-line bg-white px-3.5 py-5"
    >
      <div className="flex items-center gap-3 px-2.5 pb-6 pt-1">
        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-brand text-[17px] font-bold text-white">
          {clinic.nome.charAt(clinic.nome.indexOf(' ') + 1) || 'I'}
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="text-base font-bold tracking-tight">{clinic.nome}</div>
          <div className="text-xs text-ink-500">{clinic.subtitulo}</div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + '/');
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? 'page' : undefined}
              className={`flex h-11 items-center gap-3 rounded-md px-3 text-[15px] ${
                active
                  ? 'bg-brand-soft font-semibold text-brand-dark'
                  : 'font-medium text-ink-700 hover:bg-surface-hover hover:text-ink'
              }`}
            >
              <Icon name={it.icon} size={22} fill={active} />
              {it.label}
            </Link>
          );
        })}
      </div>

      <div className="flex-1" />

      {user && (
        <div className="flex items-center gap-2.5 border-t border-line px-2.5 py-3">
          <Avatar initials={user.iniciais} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="truncate text-sm font-semibold">{user.nome}</div>
            <div className="truncate text-xs text-ink-500">{user.cargo}</div>
          </div>
          <button
            aria-label="Sair"
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="flex h-9 w-9 items-center justify-center rounded-md text-ink-500 hover:bg-surface-hover"
          >
            <Icon name="logout" size={20} />
          </button>
        </div>
      )}
    </nav>
  );
}

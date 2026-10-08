import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import 'material-symbols/rounded.css';
import './globals.css';
import { PrototypeBanner } from '@/components/layout/PrototypeBanner';

export const metadata: Metadata = {
  title: 'Odonto Ipê · Protótipo',
  description: 'Protótipo clicável com dados fictícios. Não usar em atendimento.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="pt-7">
        <PrototypeBanner />
        {children}
      </body>
    </html>
  );
}

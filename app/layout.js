import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Equivale — Plataforma para Nutricionistas',
  description: 'Equivale — plataforma de substituição de alimentos, gerenciamento de pacientes e personalização.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

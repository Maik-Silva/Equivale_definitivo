import Link from 'next/link';
import { Poppins } from 'next/font/google';
import { BrandLogo } from '@/components/brand';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export default function HomePage() {
  return (
    <div className={`${poppins.className} min-h-screen bg-brand-soft text-brand-dark`}>      
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,_rgba(58,171,89,0.14),_transparent_30%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-20 h-56 bg-[radial-gradient(circle_at_top_right,_rgba(2,48,19,0.10),_transparent_28%)]" />

        <div className="container mx-auto px-4 py-6">
          <header className="flex items-center justify-between">
            <BrandLogo size="lg" className="w-32" />

            <div className="flex items-center gap-3">
              <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:bg-brand-hover">
                Entrar
              </Link>

              <Link href="/register" className="inline-flex items-center justify-center rounded-full border border-brand/15 bg-white/60 px-5 py-2.5 text-sm font-semibold text-brand-dark shadow-sm transition hover:bg-white/80 hover:border-brand/40">
                Cadastre-se
              </Link>
            </div>
          </header>

          <section className="mt-32 flex flex-col items-center gap-14 text-center">
            <div className="max-w-4xl">
              <div className="inline-flex rounded-full border border-brand/15 bg-gradient-to-r from-brand/5 to-brand/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-brand shadow-sm backdrop-blur-sm">
                Plataforma para nutricionistas
              </div>

              <h1 className="mt-12 text-6xl font-bold tracking-tight text-brand-dark sm:text-7xl">
                Equivalências alimentares
                <span className="block bg-gradient-to-r from-brand via-[#47c070] to-[#3AAB59] bg-clip-text text-transparent">
                  com a sua marca
                </span>
              </h1>

              <p className="mx-auto mt-10 max-w-2xl text-lg leading-relaxed text-brand-dark/70">
                Ofereça aos seus pacientes uma experiência profissional de equivalências alimentares com a sua marca.
                <br />
                <span className="text-brand-dark/80 font-medium">Mais autonomia para eles, mais produtividade para você.</span>
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
              <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-gradient-to-b from-brand to-brand-hover px-10 py-4 text-base font-semibold text-white shadow-lg shadow-brand/30 transition duration-200 hover:shadow-xl hover:shadow-brand/40">
                Entrar
              </Link>
              <button type="button" className="inline-flex items-center justify-center rounded-full border border-brand/25 bg-white/50 px-10 py-4 text-base font-semibold text-brand-dark shadow-sm backdrop-blur-sm transition duration-200 hover:bg-white/80 hover:border-brand/40">
                Ver demonstração
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 pt-8">
              {['Acesso antecipado', 'Sem compromisso', 'Suporte humano'].map((item) => (
                <div key={item} className="inline-flex items-center justify-center gap-2.5 rounded-full border border-brand/10 bg-gradient-to-br from-white to-brand/5 px-5 py-3 text-sm font-medium text-brand-dark shadow-sm backdrop-blur-sm transition duration-200 hover:bg-white hover:border-brand/20">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs text-white font-bold">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-brand-dark/10 bg-white/90">
        <div className="container mx-auto px-4 py-6 text-sm text-brand-dark/70">
          <p>© Equivale</p>
          <p>Plataforma para nutricionistas.</p>
        </div>
      </footer>
    </div>
  );
}

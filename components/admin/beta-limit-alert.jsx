import { AlertTriangle, ShieldAlert } from 'lucide-react';

const alertContent = {
  nutri: {
    title: 'Limite do Plano Beta Atingido!',
    description:
      'Você já cadastrou o máximo de 5 pacientes permitidos nesta fase de testes. Para continuar ampliando o atendimento, avalie a migração para o plano completo.',
    icon: ShieldAlert,
    badge: 'Plano Beta',
  },
  paciente: {
    title: 'Limite de Consultas Atingido!',
    description:
      'Você atingiu o máximo de 5 consultas/registros permitidos no plano Beta. Para continuar acompanhando seu progresso, entre em contato com seu nutricionista.',
    icon: AlertTriangle,
    badge: 'Atenção',
  },
};

export function BetaLimitAlert({ variant = 'nutri' }) {
  const alert = alertContent[variant] ?? alertContent.nutri;
  const Icon = alert.icon;

  return (
    <section className="rounded-[2rem] border border-orange-200/80 bg-orange-50/90 p-6 shadow-lg shadow-orange-200/30">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-orange-500 text-white shadow-sm shadow-orange-500/20">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-orange-700">
            <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-orange-800">
              {alert.badge}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">{alert.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">{alert.description}</p>
        </div>
      </div>
    </section>
  );
}

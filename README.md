# Equivale

Core SaaS de ferramentas para nutricionistas — base escalável construída em Next.js (App Router).

Este projeto será o **núcleo único** que receberá a migração dos módulos existentes:
- Substituição de alimentos
- Calculadora de equivalências

## Estrutura

```
/app
  page.js                        → Landing page (botão "Entrar")
  layout.js                      → Layout raiz
  globals.css                    → Estilos globais

    /login
      page.js                      → Página de login unificada para nutricionista e paciente
    /nutricionista/dashboard
      page.js                      → Dashboard do nutricionista
    /paciente/dashboard
      page.js                      → Dashboard do paciente
      page.js                    → Reservada para futura migração

  /api/[[...path]]
    route.js                     → Rota API base (sem lógica ainda)

/lib                             → Lógica compartilhada (vazia por enquanto)
/components                      → Componentes reutilizáveis (shadcn/ui)
/styles                          → globals.css (em /app/globals.css)
```

## Regras desta etapa
- ❌ Sem lógica de negócio
- ❌ Sem banco de dados
- ❌ Sem autenticação
- ✅ Apenas arquitetura limpa e escalável
- ✅ Padrão Next.js App Router
- ✅ Pronto para expansão multi-módulo

## Rodando

O projeto roda automaticamente via supervisor na porta 3000.

```bash
sudo supervisorctl restart nextjs
```

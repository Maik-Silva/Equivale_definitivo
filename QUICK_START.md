# 🚀 Quick Start - Guia Rápido

## Resumo do que foi implementado

✅ **Modal de Trava de Segurança** quando API retorna `permitido: false`  
✅ **Novo serviço de API** unificado em `/lib/api-equivalencia.js`  
✅ **Componente de busca** com autocomplete de alimentos  
✅ **Página de substituição** totalmente funcional em `/app/tools/substituicao`  
✅ **Integração** na página `/app/equivale`  

---

## 📝 O que você precisa fazer agora

### 1️⃣ Configurar variáveis de ambiente
Adicione ao seu `.env.local`:
```
NEXT_PUBLIC_API_URL=https://seu-backend.com
```

### 2️⃣ Implementar rotas no backend

#### A. POST `/api/equivalencia/verificar`
Recebe: `{ alimento_base, alimento_substituto, quantidade }`
Retorna: `{ permitido: boolean, mensagem: string, equivalencia: {...}, avisos: [] }`

**Importante:** Quando `permitido: false`, o frontend abre um modal de aviso mas ainda permite o usuário confirmar e continuar.

#### B. GET `/api/equivalencia/sugerir?q=termo&limit=10`
Retorna: `{ alimentos: [{nome, grupo}, ...] }`

Veja exemplos em `BACKEND_EXAMPLES.md`

### 3️⃣ Testar no frontend

Acesse: `http://localhost:3000/tools/substituicao`

Teste os cenários:
- ✅ Buscar alimento (deve autocomplete)
- ✅ Calcular substituição (deve retornar resultado)
- ✅ Se backend retorna `permitido: false`, modal deve aparecer
- ✅ Clicar "Confirmar e continuar" deve processar resultado
- ✅ Histórico deve aparecer abaixo

---

## 🎯 Estrutura de Arquivos Novos

```
projeto/
├── components/
│   ├── equivalencia-security-modal.jsx      (NOVO)
│   └── alimento-search-input.jsx            (NOVO)
├── lib/
│   └── api-equivalencia.js                  (NOVO)
├── app/
│   ├── equivale/
│   │   └── page.js                          (ATUALIZADO)
│   └── tools/substituicao/
│       └── page.js                          (ATUALIZADO)
├── IMPLEMENTATION_NOTES.md                  (NOVO)
├── BACKEND_EXAMPLES.md                      (NOVO)
└── QUICK_START.md                           (ESTE ARQUIVO)
```

---

## 🔧 Arquitetura da Solução

```
┌─────────────────────┐
│   Frontend (Next.js) │
├─────────────────────┤
│ Página substituição │
│ ou equivale         │
└──────────┬──────────┘
           │
      ┌────▼────┐
      │ Modal   │
      │ Segurança
      └────┬────┘
           │ Usuário clica "Confirmar"
           │
    ┌──────▼────────────────┐
    │ lib/api-equivalencia  │
    │ - verificarEquivalencia
    │ - formatarQuantidade
    │ - buscarAlimentos
    └──────┬────────────────┘
           │
      ┌────▼──────────────────────┐
      │   Backend API             │
      │ POST /api/equivalencia/    │
      │      verificar            │
      │ GET /api/equivalencia/    │
      │      sugerir              │
      └────┬──────────────────────┘
           │
      ┌────▼──────────────┐
      │  banco_equivale   │
      │  (tabela/BD)      │
      └───────────────────┘
```

---

## ⚡ Exemplo de Fluxo Real

### Cenário: Trocar Arroz por Batata

**1. Usuário digita na página /tools/substituicao**
```
Alimento base: [arroz ▾]  (autocomplete mostra: arroz branco, arroz integral)
Quantidade: [100] g
Alimento substituto: [batata ▾]
Botão: "Calcular substituição"
```

**2. Frontend chama API**
```javascript
const response = await verificarEquivalencia(
  "arroz",
  "batata", 
  "100"
);
// response = {
//   permitido: true,
//   mensagem: "Substituição validada",
//   equivalencia: { quantidade: 100, alimento_substituto: "batata", ... }
// }
```

**3. Resultado é exibido**
```
✅ Equivalência calculada
100g de arroz equivale a 100g de batata
```

**4. Item é salvo no histórico**
```
14/01 10:35 | 100g de arroz → 100g de batata
```

---

### Cenário com Trava Ativa

**1. Usuário tenta trocar Arroz por Cenoura**

**2. Backend retorna:**
```json
{
  "permitido": false,
  "mensagem": "⚠️ ATENÇÃO: Alimentos de grupos diferentes...",
  "equivalencia": { ... }
}
```

**3. Frontend abre Modal**
```
┌─────────────────────────────┐
│ Verificação de Segurança    │
│                             │
│ ⚠️ Aviso do Sistema         │
│ "ATENÇÃO: Alimentos de      │
│  grupos diferentes..."      │
│                             │
│ Alimento base:    Arroz     │
│           ➜  Cenoura        │
│              Substituto     │
│                             │
│ ✓ Você pode continuar       │
│ Clique em "Confirmar"       │
│                             │
│ [Cancelar] [Confirmar ►]    │
└─────────────────────────────┘
```

**4. Usuário clica "Confirmar e continuar"**

**5. Resultado é processado mesmo com trava**
```
✅ Equivalência calculada
100g de arroz equivale a 31g de cenoura
⚠️ Avisos: Grupos diferentes, Diferença calórica: 89%
```

---

## 🧪 Testes Recomendados

### Test 1: Autocomplete funciona
- [ ] Digitar "arr" em alimento base → aparece "arroz branco", "arroz integral"
- [ ] Clicar em "arroz branco" → campo preenchido

### Test 2: Cálculo sem trava
- [ ] Arroz → Batata: deve mostrar resultado direto
- [ ] Verificar se quantidade está correta
- [ ] Histórico deve atualizar

### Test 3: Trava ativa
- [ ] Arroz → Cenoura: deve abrir modal
- [ ] Modal mostra mensagem correta
- [ ] Clicar "Cancelar" → modal fecha, nada é salvo
- [ ] Clicar "Confirmar e continuar" → resultado é processado
- [ ] Histórico é atualizado mesmo com trava

### Test 4: Erros
- [ ] Deixar campos vazios → deve mostrar toast de erro
- [ ] Digitar alimento inválido → deve retornar erro
- [ ] Backend offline → deve mostrar mensagem amigável

### Test 5: Histórico
- [ ] Múltiplas substituições → deve listar todas
- [ ] Clicar "X" em item → deve remover
- [ ] Recarregar página → histórico persiste

---

## 📱 Componentes Reutilizáveis

### EquivalenciaSecurityModal
Use em qualquer página onde precisa de trava de segurança:

```jsx
import { EquivalenciaSecurityModal } from '@/components/equivalencia-security-modal';

// Em seu componente
<EquivalenciaSecurityModal
  open={open}
  onOpenChange={setOpen}
  message="Mensagem do servidor..."
  onConfirm={handleConfirm}
  isLoading={false}
  alimentoBase="Arroz"
  alimentoSubstituto="Batata"
/>
```

### AlimentoSearchInput
Use para qualquer campo que precise de busca de alimentos:

```jsx
import { AlimentoSearchInput } from '@/components/alimento-search-input';

<AlimentoSearchInput
  id="base"
  label="Alimento base"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  onSelect={(alimento) => console.log(alimento)}
/>
```

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| Autocomplete não funciona | Verifique se `NEXT_PUBLIC_API_URL` está configurada |
| Modal não aparece | Verifique se backend retorna `permitido: false` |
| Erro 404 na API | Confirme que rota `/api/equivalencia/verificar` existe |
| CORS error | Configure CORS no backend para aceitar origem do frontend |
| Histórico não persiste | Verifique localStorage (F12 > Application > Storage) |
| Componentes importados com erro | Rode `npm install` e reinicie o dev server |

---

## 📞 Próximos Passos

1. **Implementar backend** usando exemplos em `BACKEND_EXAMPLES.md`
2. **Testar fluxo completo** seguindo os testes recomendados
3. **Integrar em outras páginas** (paciente/dashboard, calculadora, etc.)
4. **Adicionar autenticação** se necessário (token no header)
5. **Configurar logging/auditoria** para rastrear travas acionadas

---

## 📚 Documentação Completa

- `IMPLEMENTATION_NOTES.md` - Explicação técnica detalhada
- `BACKEND_EXAMPLES.md` - Exemplos de código do backend
- Este arquivo - Quick start e referência rápida

---

**Status:** ✅ Frontend Pronto | ⏳ Backend Aguardando Implementação

Boa sorte! 🚀

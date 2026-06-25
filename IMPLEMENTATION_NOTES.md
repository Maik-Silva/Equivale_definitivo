# Implementação: Trava de Segurança para Equivalência de Alimentos

## ✅ Mudanças Implementadas

### 1. Novos Componentes Criados

#### `components/equivalencia-security-modal.jsx`
Modal visível quando `permitido: false` é retornado da API.
- Exibe mensagem do servidor
- Mostra os alimentos sendo trocados
- Oferece opção de confirmar e prosseguir
- Design com alertas visuais (AmberOS)

**Uso:**
```jsx
<EquivalenciaSecurityModal
  open={modalOpen}
  onOpenChange={setModalOpen}
  message="Mensagem do servidor"
  onConfirm={handleConfirm}
  isLoading={loading}
  alimentoBase="Arroz"
  alimentoSubstituto="Batata"
/>
```

#### `components/alimento-search-input.jsx`
Campo de busca com autocomplete para alimentos da tabela `banco_equivale`.
- Busca em tempo real com debounce
- Exibe grupo alimentar nas sugestões
- Tratamento de cliques fora
- Loading indicator

**Uso:**
```jsx
<AlimentoSearchInput
  id="alimento-base"
  label="Alimento base"
  value={baseFood}
  onChange={(e) => setBaseFood(e.target.value)}
  placeholder="Ex: arroz"
  debounceDelay={300}
  maxSuggestions={10}
/>
```

### 2. Novo Serviço de API

#### `lib/api-equivalencia.js`
Encapsula toda a lógica de comunicação com a API unificada.

**Funções principais:**
- `verificarEquivalencia(base, substituto, qtd, options)` - POST para `/api/equivalencia/verificar`
- `buscarAlimentos(query, options)` - GET para `/api/equivalencia/sugerir`
- `normalizeResponse(data)` - Normaliza diferentes formatos de resposta
- `formatarQuantidade(quantidade)` - Formata quantidades com unidade 'g'
- `extrairGrupos(payload)` - Extrai grupos da resposta

**Resposta normalizada:**
```javascript
{
  permitido: boolean,
  mensagem: string,
  equivalencia: {
    quantidade: number,
    alimento_substituto: string,
    grupo: string,
    grupos_diferentes: boolean
  },
  avisos: string[],
  raw: object // dados originais
}
```

### 3. Páginas Atualizadas

#### `/app/equivale/page.js`
- Integrada com novo serviço `verificarEquivalencia`
- Adicionado modal de segurança
- Novos estados para gerenciar trava de segurança
- Novas funções: `processEquivalenceResult`, `extractResponseText`, `extractWarning`, `handleSecurityConfirm`
- Lógica: se `permitido: false`, abre modal; ao confirmar, processa resultado

#### `/app/tools/substituicao/page.js`
**Totalmente preenchido** com funcionalidade completa:
- ✅ Formulário com campos unificados usando `AlimentoSearchInput`
- ✅ Lógica de verificação com modal de segurança
- ✅ Resultado visual claro
- ✅ Histórico persistido no localStorage
- ✅ Remoção de itens do histórico
- ✅ Toast notifications

## 🔄 Fluxo da Trava de Segurança

```
1. Usuário preenche:
   - Alimento base (com autocomplete)
   - Quantidade (em gramas)
   - Alimento substituto (com autocomplete)

2. Clica "Calcular substituição"

3. Frontend chama POST /api/equivalencia/verificar com:
   {
     "alimento_base": "arroz",
     "alimento_substituto": "batata",
     "quantidade": 100
   }

4. Backend retorna:
   {
     "permitido": false,
     "mensagem": "Esta substituição requer aprovação...",
     "equivalencia": { ... }
   }

5. Se permitido = false:
   → Modal de aviso é exibido
   → Mostra mensagem do servidor
   → Usuário clica "Confirmar e continuar"
   → Sistema prossegue com atualização

6. Se permitido = true:
   → Resultado é exibido diretamente
   → Histórico é atualizado
```

## 📝 Próximos Passos - Backend

Seu backend DEVE seguir este contrato:

### 1. Nova Rota - POST `/api/equivalencia/verificar`

**Request:**
```json
{
  "alimento_base": "string",
  "alimento_substituto": "string",
  "quantidade": "number"
}
```

**Response (com trava ativa):**
```json
{
  "permitido": false,
  "mensagem": "Esta substituição não é recomendada por motivos clínicos. Favor consultar o nutricionista responsável.",
  "equivalencia": {
    "quantidade": 120,
    "alimento_substituto": "batata-doce",
    "grupo": "cereais_e_tuberculos",
    "grupos_diferentes": false
  },
  "avisos": [
    "Grupos alimentares diferentes detectados"
  ]
}
```

**Response (sem trava):**
```json
{
  "permitido": true,
  "mensagem": "Substituição validada com sucesso",
  "equivalencia": {
    "quantidade": 100,
    "alimento_substituto": "batata",
    "grupo": "cereais_e_tuberculos",
    "grupos_diferentes": false
  },
  "avisos": []
}
```

### 2. Rota de Sugestões - GET `/api/equivalencia/sugerir?q=arroz&limit=10`

**Response:**
```json
{
  "alimentos": [
    {
      "nome": "arroz branco",
      "grupo": "cereais_e_tuberculos"
    },
    {
      "nome": "arroz integral",
      "grupo": "cereais_e_tuberculos"
    }
  ]
}
```

Alternativas aceitas:
- `{ "sugestoes": [...] }`
- `{ "results": [...] }`
- Array direto: `[...]`

## 🛠️ Instruções de Integração

### 1. Atualizar variáveis de ambiente
```bash
NEXT_PUBLIC_API_URL=https://seu-backend.com
```

### 2. Implementar rotas no backend
- `POST /api/equivalencia/verificar` (com lógica de `permitido`)
- `GET /api/equivalencia/sugerir` (busca da tabela `banco_equivale`)

### 3. Testar fluxo completo
```bash
1. Acesse /tools/substituicao
2. Digite "arroz" no campo base
3. Digite "batata" no campo substituto
4. Clique "Calcular"
5. Aguarde resposta do backend
6. Se permitido=false, modal deve aparecer
7. Clique "Confirmar e continuar"
8. Verifique se resultado foi processado
```

## 📊 Exemplo de Resposta com Trava

```javascript
// Backend retorna quando trava é ativada
{
  "permitido": false,
  "mensagem": "⚠️ ATENÇÃO: Esta substituição envolve alimentos de grupos diferentes. Pode alterar o perfil nutricional da refeição. Consulte o nutricionista responsável antes de prosseguir.",
  "equivalencia": {
    "quantidade": 120,
    "alimento_substituto": "batata-doce",
    "grupo": "cereais",
    "grupos_diferentes": true
  }
}
```

Frontend:
1. Detecta `permitido: false`
2. Armazena dados em `pendingEquivalenceData`
3. Abre `EquivalenciaSecurityModal`
4. Exibe mensagem com alertas visuais
5. Usuário clica "Confirmar e continuar"
6. Sistema processa resultado normalmente

## ✨ Funcionalidades Extras Implementadas

- ✅ **Histórico persistente** no localStorage (últimas 20 substituições)
- ✅ **Remoção de itens** do histórico individual
- ✅ **Autocomplete unificado** para alimentos (componente reutilizável)
- ✅ **Toast notifications** em tempo real
- ✅ **Loading states** em todos os formulários
- ✅ **Tratamento de erros** robusto
- ✅ **Design responsivo** (mobile first)
- ✅ **Acessibilidade** com labels e ARIA attributes

## 🔌 Como Usar os Novos Componentes

### Em outras páginas (paciente/dashboard, calculadora, etc.)

```jsx
import { verificarEquivalencia } from '@/lib/api-equivalencia';
import { EquivalenciaSecurityModal } from '@/components/equivalencia-security-modal';
import { AlimentoSearchInput } from '@/components/alimento-search-input';

// Em seu componente
const [baseFood, setBaseFood] = useState('');

// Buscar alimentos
async function buscar() {
  try {
    const response = await verificarEquivalencia(base, sub, qty);
    
    if (response.permitido === false) {
      // Mostrar modal
    } else {
      // Processar resultado
    }
  } catch (error) {
    console.error(error);
  }
}

// Renderizar
return (
  <>
    <AlimentoSearchInput 
      value={baseFood}
      onChange={(e) => setBaseFood(e.target.value)}
    />
    <EquivalenciaSecurityModal 
      open={open}
      onOpenChange={setOpen}
      // ...props
    />
  </>
);
```

## 🐛 Debug

Variáveis de payload raw armazenadas em `lastPayload` na página equivale.

Para visualizar:
1. Abra o console do navegador
2. Ou clique em "Mostrar payload bruto" na página

## 📞 Suporte

Se encontrar problemas:
1. Verifique se `NEXT_PUBLIC_API_URL` está configurada
2. Verifique CORS no backend
3. Teste a rota `/api/equivalencia/verificar` diretamente com Postman
4. Verifique console do navegador (F12) para erros

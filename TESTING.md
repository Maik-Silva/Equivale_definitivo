# 🧪 Testes de Integração e Validação

## Checklist de Validação Funcional

### ✅ Componentes

- [ ] `EquivalenciaSecurityModal` renderiza corretamente
  - [ ] Modal abre quando `open={true}`
  - [ ] Título e descrição aparecem
  - [ ] Alertas visuais (amber/blue) aparecem
  - [ ] Botões "Cancelar" e "Confirmar" funcionam
  - [ ] Animação de loading funciona

- [ ] `AlimentoSearchInput` funciona corretamente
  - [ ] Input aceita texto
  - [ ] Debounce funciona (aguarda 300ms)
  - [ ] Sugestões aparecem após 2 caracteres
  - [ ] Clique fora fecha sugestões
  - [ ] Selecionar sugestão preenche campo

### ✅ Serviço de API

- [ ] `verificarEquivalencia()` funciona
  - [ ] Faz POST para `/api/equivalencia/verificar`
  - [ ] Envia dados corretamente
  - [ ] Normaliza resposta
  - [ ] Retorna `permitido` boolean

- [ ] `buscarAlimentos()` funciona
  - [ ] Faz GET para `/api/equivalencia/sugerir`
  - [ ] Retorna array de alimentos
  - [ ] Usa debounce
  - [ ] Limpa cache ao trocar query

- [ ] `formatarQuantidade()` funciona
  - [ ] Formata números: `100` → `"100g"`
  - [ ] Formata decimais: `100.5` → `"100.5g"`
  - [ ] Remove 'g' duplicado: `"100g"` → `"100g"`
  - [ ] Trata string: `"100.5"` → `"100.5g"`

### ✅ Páginas

- [ ] `/app/equivale/page.js`
  - [ ] Renderiza sem erros
  - [ ] Formulário com 3 campos funciona
  - [ ] Botão "Calcular substituição" funciona
  - [ ] Modal de segurança abre quando `permitido: false`
  - [ ] Histórico aparece e persiste
  - [ ] Logout funciona

- [ ] `/app/tools/substituicao/page.js`
  - [ ] Renderiza sem erros
  - [ ] Campos de busca mostram autocomplete
  - [ ] Cálculo funciona
  - [ ] Modal aparece quando trava ativa
  - [ ] Resultado é exibido
  - [ ] Histórico funciona
  - [ ] Remoção de itens funciona

---

## 🧬 Testes de Fluxo

### Fluxo 1: Substituição sem Trava

```
1. Ir para /tools/substituicao
2. Digitar "arroz" em "Alimento base"
   ESPERADO: Sugestões aparecem
3. Clicar em "arroz branco"
   ESPERADO: Campo preenchido com "arroz branco"
4. Manter quantidade em "100"
5. Digitar "batata" em "Alimento substituto"
   ESPERADO: Sugestões aparecem
6. Clicar em "batata"
   ESPERADO: Campo preenchido com "batata"
7. Clicar "Calcular substituição"
   ESPERADO: Carregando por ~2 seg
8. Verificar resposta do backend
   SE: permitido: true
       → Resultado é exibido diretamente
       → "✅ Equivalência calculada"
       → Quantidade equivalente mostra
       → Item é adicionado ao histórico
   SE: permitido: false
       → PRÓXIMO FLUXO (Fluxo com Trava)
```

### Fluxo 2: Substituição COM Trava

```
1. Ir para /tools/substituicao
2. Preencher campos:
   - Base: "arroz"
   - Quantidade: "100"
   - Substituto: "cenoura" (grupos diferentes)
3. Clicar "Calcular substituição"
   ESPERADO: Backend retorna permitido: false
4. Modal de segurança aparece
   ESPERADO: 
   - Título: "Verificação de Segurança"
   - Alerta Amber com ícone ⚠️
   - Mensagem do servidor exibida
   - Alimentos mostrados (arroz → cenoura)
   - Alerta azul com ✓ (pode continuar)
   - Botões: Cancelar | Confirmar e continuar
5. Clicar "Cancelar"
   ESPERADO: Modal fecha, nada é salvo
6. Preencher novamente e clicar "Confirmar e continuar"
   ESPERADO:
   - Modal fecha
   - Resultado é exibido
   - "✅ Equivalência calculada"
   - Item é adicionado ao histórico
   - Toast notification: "Substituição confirmada"
```

### Fluxo 3: Histórico e Remoção

```
1. Fazer 2-3 substituições no /tools/substituicao
2. Verificar que cada uma aparece na seção "Histórico de substituições"
   ESPERADO: Ordem cronológica reversa (mais recentes primeiro)
3. Clicar "X" em um item
   ESPERADO: Item é removido da lista
4. Recarregar a página (F5)
   ESPERADO: Histórico persiste (localStorage funciona)
5. Limpar localStorage manualmente
   → F12 > Application > Storage > Local Storage > Deletar
6. Recarregar página
   ESPERADO: Histórico vazio
```

### Fluxo 4: Validação de Campos

```
1. Ir para /tools/substituicao
2. Clicar "Calcular substituição" SEM preencher
   ESPERADO: Toast vermelho "Campos obrigatórios - Preencha alimento..."
3. Preencher apenas base
4. Clicar "Calcular"
   ESPERADO: Toast "Campos obrigatórios - Preencha alimento..."
5. Preencher base e substituto, deixar quantidade vazia
6. Clicar "Calcular"
   ESPERADO: Toast "Campos obrigatórios - Preencha..."
```

### Fluxo 5: Erro de API

```
1. Desligar backend / API
2. Ir para /tools/substituicao
3. Preencher campos corretamente
4. Clicar "Calcular"
   ESPERADO: Toast vermelho "Erro - Não foi possível verificar..."
   ESPERADO: Console mostra erro detalhado
5. Ligar backend novamente
6. Tentar novamente
   ESPERADO: Funciona normalmente
```

---

## 🔌 Testes de API

Use Postman, cURL ou insomnia para testar as rotas:

### Test 1: POST /api/equivalencia/verificar (Sem Trava)

**Request:**
```bash
curl -X POST http://localhost:5000/api/equivalencia/verificar \
  -H "Content-Type: application/json" \
  -d '{
    "alimento_base": "arroz",
    "alimento_substituto": "batata",
    "quantidade": 100
  }'
```

**Expected Response (200):**
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

### Test 2: POST /api/equivalencia/verificar (COM Trava)

**Request:**
```bash
curl -X POST http://localhost:5000/api/equivalencia/verificar \
  -H "Content-Type: application/json" \
  -d '{
    "alimento_base": "arroz",
    "alimento_substituto": "cenoura",
    "quantidade": 100
  }'
```

**Expected Response (200):**
```json
{
  "permitido": false,
  "mensagem": "⚠️ ATENÇÃO: Esta substituição envolve grupos diferentes...",
  "equivalencia": {
    "quantidade": 50,
    "alimento_substituto": "cenoura",
    "grupo": "verduras_e_legumes",
    "grupos_diferentes": true
  },
  "avisos": [
    "Grupos alimentares diferentes",
    "Diferença calórica significativa"
  ]
}
```

### Test 3: GET /api/equivalencia/sugerir

**Request:**
```bash
curl "http://localhost:5000/api/equivalencia/sugerir?q=arr&limit=5"
```

**Expected Response (200):**
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

### Test 4: Erro - Alimento não encontrado

**Request:**
```bash
curl -X POST http://localhost:5000/api/equivalencia/verificar \
  -H "Content-Type: application/json" \
  -d '{
    "alimento_base": "xyzabc",
    "alimento_substituto": "batata",
    "quantidade": 100
  }'
```

**Expected Response (404 ou 200 com permitido: false):**
```json
{
  "permitido": false,
  "mensagem": "Alimento não encontrado na tabela banco_equivale"
}
```

---

## 📊 Casos de Teste Edge

| Caso | Input | Esperado |
|------|-------|----------|
| Quantidade zero | `{ alimento_base: "arroz", alimento_substituto: "batata", quantidade: 0 }` | Erro ou tratamento |
| Quantidade negativa | `quantidade: -100` | Erro ou tratamento |
| Strings vazias | `alimento_base: ""` | Erro 400 ou mensagem |
| Quantidade muito grande | `quantidade: 999999999` | Processado ou erro |
| Alimento com espaços | `"  arroz  "` | Trimmed e processado |
| Alimento com caps | `"ARROZ"` | Case-insensitive |
| Query muito curta | `q: "a"` | Retorna `alimentos: []` |
| Query muito longa | `q: "arroz integral branco especial..."` | Pesquisa normal |

---

## 🎯 Performance

### Testes de Debounce

```javascript
// In console while on /tools/substituicao
const input = document.querySelector('#alimento-base');

// Digitar rápido 5 letras
for (let i = 0; i < 5; i++) {
  input.value += 'a';
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

// ESPERADO: Apenas 1 chamada de API (após 300ms da última letra)
// NÃO esperado: 5 chamadas de API
```

### Teste de Histórico (localStorage)

```javascript
// In console
// Verificar se histórico está sendo salvo
JSON.parse(localStorage.getItem('historicoSubstituicao'))

// Esperado: Array com últimas 20 substituições

// Verificar tamanho (deve ter limite)
localStorage.getItem('historicoSubstituicao').length // < 100KB

// Limpar
localStorage.removeItem('historicoSubstituicao')
```

---

## 🔍 Testes de Acessibilidade

- [ ] Todos os campos têm `<label>` com `htmlFor`
- [ ] Modal é keyboard-navigable
- [ ] Botões têm focus styles
- [ ] Cores não são única forma de comunicar estado
- [ ] Toast notifications têm role correto
- [ ] Input com autocomplete tem `aria-describedby`

---

## 📝 Teste Manual - Checklist

```
[ ] Frontend carrega sem erros
[ ] Autocomplete funciona (digitar "arr")
[ ] Cálculo sem trava retorna resultado
[ ] Cálculo com trava abre modal
[ ] Modal fecha ao clicar "Cancelar"
[ ] Modal processa ao clicar "Confirmar"
[ ] Histórico aparece e persiste
[ ] Remover item do histórico funciona
[ ] Logout funciona
[ ] Toast notifications aparecem
[ ] Responsivo em mobile (320px)
[ ] Responsivo em desktop (1920px)
[ ] Sem erros no console (F12)
```

---

## 📈 Métricas para Monitorar

Após deploy, monitore:

1. **Taxa de Modal Exibição**
   - Quantas vezes `permitido: false` é retornado
   - Quantos % dos usuários clicam "Confirmar"

2. **Taxa de Erro**
   - Quantas chamadas falham
   - Erros mais comuns

3. **Performance**
   - Tempo de resposta da API
   - Tempo para autocomplete

4. **Uso**
   - Qual par de alimentos é mais usado
   - Quantidade média de histórico por usuário

---

## 🚀 Deploy Checklist

- [ ] Variável `NEXT_PUBLIC_API_URL` configurada
- [ ] Backend deploy concluído
- [ ] Rotas de API testadas em produção
- [ ] CORS configurado corretamente
- [ ] Certificado SSL ativo
- [ ] localStorage funciona
- [ ] Toast notifications funcionam
- [ ] Modal de segurança testado
- [ ] Histórico persiste após reload
- [ ] Nenhum erro no console

---

**Última atualização:** 2024  
**Status:** Pronto para testes 🎉

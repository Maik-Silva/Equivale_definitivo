# Exemplos de Implementação - Backend (Node.js + Express)

## 🔧 Rota POST /api/equivalencia/verificar

### Exemplo Básico com Lógica de Trava

```javascript
// routes/equivalencia.js
const express = require('express');
const router = express.Router();

// Simulando dados da tabela banco_equivale
const BANCO_EQUIVALE = {
  'arroz branco': { grupo: 'cereais_e_tuberculos', calorias: 130, grupo_id: 1 },
  'arroz integral': { grupo: 'cereais_e_tuberculos', calorias: 111, grupo_id: 1 },
  'batata': { grupo: 'cereais_e_tuberculos', calorias: 77, grupo_id: 1 },
  'batata-doce': { grupo: 'cereais_e_tuberculos', calorias: 86, grupo_id: 1 },
  'cenoura': { grupo: 'verduras_e_legumes', calorias: 41, grupo_id: 2 },
  'feijão': { grupo: 'leguminosas', calorias: 76, grupo_id: 3 },
};

// Função para verificar se é uma substituição "travada"
function deveTravarSubstituicao(base, substituto) {
  const baseInfo = BANCO_EQUIVALE[base.toLowerCase()];
  const subInfo = BANCO_EQUIVALE[substituto.toLowerCase()];
  
  if (!baseInfo || !subInfo) {
    return false;
  }

  // Exemplo: Travar se grupos são muito diferentes
  // ou se diferença calórica > 50%
  const diferencaCaloria = Math.abs(baseInfo.calorias - subInfo.calorias);
  const diferenca = diferencaCaloria / baseInfo.calorias;
  
  return diferenca > 0.5 || baseInfo.grupo_id !== subInfo.grupo_id;
}

// Calcular equivalência (proporção 1:1 simplificada)
function calcularEquivalencia(base, substituto, quantidade) {
  const baseInfo = BANCO_EQUIVALE[base.toLowerCase()];
  const subInfo = BANCO_EQUIVALE[substituto.toLowerCase()];
  
  if (!baseInfo || !subInfo) {
    return null;
  }

  // Ajusta pela diferença de calorias
  const razao = baseInfo.calorias / subInfo.calorias;
  const quantidadeEquivalente = Math.round(quantidade * razao);
  
  return {
    quantidade: quantidadeEquivalente,
    alimento_substituto: substituto,
    grupo: baseInfo.grupo,
  };
}

// Rota POST /api/equivalencia/verificar
router.post('/equivalencia/verificar', async (req, res) => {
  try {
    const { alimento_base, alimento_substituto, quantidade = 100 } = req.body;

    // Validação
    if (!alimento_base || !alimento_substituto) {
      return res.status(400).json({
        permitido: false,
        mensagem: 'Alimentos base e substituto são obrigatórios',
      });
    }

    // Calcula equivalência
    const equivalencia = calcularEquivalencia(
      alimento_base,
      alimento_substituto,
      quantidade
    );

    if (!equivalencia) {
      return res.status(404).json({
        permitido: false,
        mensagem: 'Um dos alimentos não foi encontrado na tabela banco_equivale',
      });
    }

    // Verifica se deve travar
    const deveTrava = deveTravarSubstituicao(alimento_base, alimento_substituto);

    if (deveTrava) {
      // TRAVA ATIVA - retorna permitido: false
      return res.status(200).json({
        permitido: false,
        mensagem: `⚠️ ATENÇÃO: A substituição de "${alimento_base}" por "${alimento_substituto}" pode alterar significativamente o perfil nutricional. Favor revisar com o nutricionista responsável antes de prosseguir.`,
        equivalencia: {
          ...equivalencia,
          grupos_diferentes: true,
        },
        avisos: [
          'Diferença calórica significativa detectada',
          'Grupos alimentares diferentes ou perfil nutricional alterado',
        ],
      });
    }

    // SEM TRAVA - processamento normal
    return res.status(200).json({
      permitido: true,
      mensagem: 'Substituição validada com sucesso',
      equivalencia: {
        ...equivalencia,
        grupos_diferentes: false,
      },
      avisos: [],
    });
  } catch (error) {
    console.error('Erro em /api/equivalencia/verificar:', error);
    res.status(500).json({
      permitido: false,
      mensagem: 'Erro ao verificar equivalência',
    });
  }
});

module.exports = router;
```

---

## 🔍 Rota GET /api/equivalencia/sugerir

### Exemplo com Busca na Tabela

```javascript
// Adicionar na mesma rota file

// Rota GET /api/equivalencia/sugerir
router.get('/equivalencia/sugerir', async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        alimentos: [],
      });
    }

    // Busca por termo na tabela
    const sugeridos = Object.entries(BANCO_EQUIVALE)
      .filter(([nome]) => nome.toLowerCase().includes(q.toLowerCase()))
      .slice(0, parseInt(limit))
      .map(([nome, info]) => ({
        nome,
        grupo: info.grupo,
        calorias: info.calorias,
      }));

    return res.status(200).json({
      alimentos: sugeridos,
    });
  } catch (error) {
    console.error('Erro em /api/equivalencia/sugerir:', error);
    res.status(500).json({
      alimentos: [],
    });
  }
});
```

---

## 🗄️ Versão com MongoDB

Se você usa MongoDB com a tabela `banco_equivale`:

```javascript
// routes/equivalencia.js (com MongoDB)
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Schema da tabela banco_equivale
const equivalenciaSchema = new mongoose.Schema({
  nome: { type: String, required: true, lowercase: true, trim: true },
  grupo: String,
  grupo_id: Number,
  calorias: Number,
  proteinas: Number,
  carboidratos: Number,
  gorduras: Number,
  trava: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const BancoEquivalente = mongoose.model('banco_equivale', equivalenciaSchema);

// POST /api/equivalencia/verificar
router.post('/equivalencia/verificar', async (req, res) => {
  try {
    const { alimento_base, alimento_substituto, quantidade = 100 } = req.body;

    // Buscar alimentos no banco
    const [baseDoc, subDoc] = await Promise.all([
      BancoEquivalente.findOne({ nome: alimento_base.toLowerCase() }),
      BancoEquivalente.findOne({ nome: alimento_substituto.toLowerCase() }),
    ]);

    if (!baseDoc || !subDoc) {
      return res.status(404).json({
        permitido: false,
        mensagem: 'Alimento não encontrado na tabela banco_equivale',
      });
    }

    // Calcula equivalência por proporção calórica
    const razao = baseDoc.calorias / subDoc.calorias;
    const quantidadeEquivalente = Math.round(quantidade * razao);

    // Verifica trava
    const deveTrava = baseDoc.trava || subDoc.trava || 
                     (baseDoc.grupo_id !== subDoc.grupo_id);

    const response = {
      permitido: !deveTrava,
      mensagem: deveTrava 
        ? `Substituição requer aprovação. ${baseDoc.nome} → ${subDoc.nome}`
        : 'Substituição validada',
      equivalencia: {
        quantidade: quantidadeEquivalente,
        alimento_substituto: subDoc.nome,
        grupo: baseDoc.grupo,
        grupos_diferentes: baseDoc.grupo_id !== subDoc.grupo_id,
      },
    };

    if (deveTrava) {
      response.avisos = [
        'Grupos alimentares diferentes',
        'Perfil nutricional alterado',
      ];
    }

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      permitido: false,
      mensagem: 'Erro ao processar solicitação',
    });
  }
});

// GET /api/equivalencia/sugerir
router.get('/equivalencia/sugerir', async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({ alimentos: [] });
    }

    const alimentos = await BancoEquivalente
      .find({ nome: new RegExp(q, 'i') })
      .select('nome grupo calorias')
      .limit(parseInt(limit));

    res.json({ alimentos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ alimentos: [] });
  }
});

module.exports = router;
```

---

## ⚙️ Integração no Express Principal

```javascript
// server.js ou app.js
const express = require('express');
const equivalenciaRoutes = require('./routes/equivalencia');

const app = express();

app.use(express.json());

// CORS
app.use(express.cors({
  origin: process.env.CORS_ORIGINS || 'http://localhost:3000',
}));

// Rotas
app.use('/api', equivalenciaRoutes);

// Começar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em :${PORT}`);
});
```

---

## 📋 Fluxo com Trava Ativa

### Cenário: Trocar "arroz" por "cenoura"

**Frontend envia:**
```json
POST /api/equivalencia/verificar
{
  "alimento_base": "arroz",
  "alimento_substituto": "cenoura",
  "quantidade": 100
}
```

**Backend processa:**
1. Busca "arroz" → grupo: cereais_e_tuberculos (grupo_id: 1)
2. Busca "cenoura" → grupo: verduras_e_legumes (grupo_id: 2)
3. Compara: grupo_id 1 ≠ grupo_id 2 → GRUPOS DIFERENTES
4. Retorna `permitido: false` com mensagem de aviso

**Backend retorna:**
```json
{
  "permitido": false,
  "mensagem": "⚠️ ATENÇÃO: A substituição de \"arroz\" por \"cenoura\" envolve grupos alimentares diferentes. Isso pode alterar significativamente o perfil nutricional. Consulte o nutricionista responsável.",
  "equivalencia": {
    "quantidade": 31,
    "alimento_substituto": "cenoura",
    "grupo": "cereais_e_tuberculos",
    "grupos_diferentes": true
  },
  "avisos": [
    "Grupos alimentares diferentes",
    "Diferença calórica: 89%"
  ]
}
```

**Frontend:**
1. Detecta `permitido: false`
2. Abre modal com a mensagem
3. Usuário lê aviso
4. Clica "Confirmar e continuar"
5. Sistema processa resultado mesmo assim

---

## 🚀 Testes com Postman/cURL

### POST (com trava)
```bash
curl -X POST http://localhost:5000/api/equivalencia/verificar \
  -H "Content-Type: application/json" \
  -d '{
    "alimento_base": "arroz",
    "alimento_substituto": "cenoura",
    "quantidade": 100
  }'
```

### GET (sugestões)
```bash
curl "http://localhost:5000/api/equivalencia/sugerir?q=arr&limit=5"
```

---

## 📊 Estrutura de Dados Recomendada - MongoDB

```javascript
// Inserir na collection banco_equivale
db.banco_equivale.insertMany([
  {
    nome: "arroz branco",
    grupo: "cereais_e_tuberculos",
    grupo_id: 1,
    calorias: 130,
    proteinas: 2.7,
    carboidratos: 28,
    gorduras: 0.3,
    trava: false
  },
  {
    nome: "batata",
    grupo: "cereais_e_tuberculos",
    grupo_id: 1,
    calorias: 77,
    proteinas: 1.7,
    carboidratos: 17,
    gorduras: 0.1,
    trava: false
  },
  {
    nome: "cenoura",
    grupo: "verduras_e_legumes",
    grupo_id: 2,
    calorias: 41,
    proteinas: 0.9,
    carboidratos: 10,
    gorduras: 0.2,
    trava: false
  }
])
```

---

## ✅ Checklist de Implementação

- [ ] Criar rota POST `/api/equivalencia/verificar`
- [ ] Implementar lógica de `permitido` (com base em grupos ou regra customizada)
- [ ] Criar rota GET `/api/equivalencia/sugerir`
- [ ] Configurar `CORS` corretamente
- [ ] Testar com o frontend fornecido
- [ ] Adicionar validação de entrada
- [ ] Adicionar logs de auditoria
- [ ] Configurar autenticação (opcional)
- [ ] Documentar regras de trava para o time

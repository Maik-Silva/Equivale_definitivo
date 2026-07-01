function toText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    const joined = value
      .map((item) => toText(item, ''))
      .filter(Boolean)
      .join(', ');

    return joined || fallback;
  }

  if (typeof value === 'object') {
    const candidates = [
      value.nome,
      value.name,
      value.fullName,
      value.displayName,
      value.email,
      value.paciente,
      value.patient,
      value.nome_paciente,
      value.nomePaciente,
      value.nutricionista,
      value.nome_nutricionista,
      value.nomeNutri,
      value.label,
      value.title,
      value.value,
    ];

    for (const candidate of candidates) {
      const converted = toText(candidate, '');
      if (converted) return converted;
    }

    return fallback;
  }

  return fallback;
}

function normalizeAccess(access = {}) {
  return {
    id: toText(access.id ?? access._id ?? `${access.patient ?? access.nome_paciente ?? 'desconhecido'}-${access.date ?? access.data_acesso ?? ''}`),
    patient: toText(access.patient ?? access.nome_paciente ?? access.nomePaciente ?? access.paciente, 'Paciente desconhecido'),
    nutritionist: toText(access.nutritionist ?? access.nutricionista ?? access.nome_nutricionista ?? access.nomeNutri, 'Nutricionista desconhecido'),
    date: toText(access.date ?? access.data_acesso ?? access.createdAt ?? access.created_at, ''),
  };
}

function normalizeUser(user = {}) {
  return {
    id: toText(user.id ?? user._id ?? user.email),
    nome: toText(user.nome ?? user.name ?? user.fullName ?? user.email, 'Sem nome'),
    email: toText(user.email, 'sem-email@exemplo.com'),
    role: toText(user.role ?? user.tipo ?? user.perfil, 'nutricionista'),
    totalPacientes: Number(toText(user.totalPacientes ?? user.pacientes ?? user.patients, 0)),
    suggestionsCount: Number(toText(user.sugestoes?.length ?? user.suggestions?.length ?? user.suggestionsCount ?? user.totalSugestoes, 0)),
    plano: toText(user.plano ?? user.plan ?? user.planType ?? user.plano_atual, 'básico'),
    limite_pacientes: Number(toText(user.limite_pacientes ?? user.limite ?? user.limitePacientes, 5)),
    status: toText(user.status ?? user.estado, 'ativo').toLowerCase(),
  };
}

function normalizePaciente(paciente = {}, index = 0) {
  const nome = toText(
    paciente.nome ?? paciente.name ?? paciente.nome_paciente ?? paciente.nomePaciente ?? paciente.patient ?? paciente.paciente,
    'Sem nome'
  );
  const email = toText(
    paciente.email ?? paciente.emailPaciente ?? paciente.email_paciente ?? paciente.patientEmail,
    'Sem e-mail'
  );

  return {
    id: toText(paciente.id ?? paciente._id ?? `${nome}-${index}`),
    nome,
    email,
  };
}

function extractList(payload, ...keys) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;

    if (value && typeof value === 'object') {
      const nested = extractList(value, ...keys);
      if (nested.length > 0) return nested;
    }
  }

  return [];
}

module.exports = {
  toText,
  normalizeAccess,
  normalizeUser,
  normalizePaciente,
  extractList,
};

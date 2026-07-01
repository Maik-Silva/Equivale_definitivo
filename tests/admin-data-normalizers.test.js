const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeAccess, normalizeUser, normalizePaciente, extractList } = require('../lib/admin-data-normalizers');

test('normalizeAccess converts nested object values to strings', () => {
  const normalized = normalizeAccess({
    patient: { nome: 'Ana' },
    nutricionista: { nome: 'Dr. João' },
    date: '2024-01-01T00:00:00.000Z',
  });

  assert.equal(normalized.patient, 'Ana');
  assert.equal(normalized.nutritionist, 'Dr. João');
  assert.equal(normalized.date, '2024-01-01T00:00:00.000Z');
});

test('normalizeUser and normalizePaciente handle nested objects safely', () => {
  const user = normalizeUser({
    id: 'u1',
    nome: { nome: 'Maria' },
    email: { email: 'maria@example.com' },
    role: { label: 'Nutricionista' },
  });

  const paciente = normalizePaciente({ nome: { nome: 'Pedro' }, email: { email: 'pedro@example.com' } }, 0);

  assert.equal(user.nome, 'Maria');
  assert.equal(user.email, 'maria@example.com');
  assert.equal(user.role, 'Nutricionista');
  assert.equal(paciente.nome, 'Pedro');
  assert.equal(paciente.email, 'pedro@example.com');
});

test('extractList resolves nested arrays from common admin payload shapes', () => {
  const payload = {
    data: {
      nutricionistas: [{ id: '1' }, { id: '2' }],
    },
  };

  assert.deepEqual(extractList(payload, 'nutricionistas', 'users', 'data'), [{ id: '1' }, { id: '2' }]);
});

const test = require('node:test');
const assert = require('node:assert/strict');

const { getLimitProgressState } = require('../lib/admin-limit-utils');

test('marca alerta quando pacientes atingem ou ultrapassam o limite', () => {
  const reached = getLimitProgressState(5, 5);
  assert.equal(reached.isLimitReached, true);
  assert.equal(reached.percentage, 100);

  const exceeded = getLimitProgressState(7, 5);
  assert.equal(exceeded.isLimitReached, true);
  assert.equal(exceeded.percentage, 140);

  const normal = getLimitProgressState(3, 5);
  assert.equal(normal.isLimitReached, false);
  assert.equal(normal.percentage, 60);
});

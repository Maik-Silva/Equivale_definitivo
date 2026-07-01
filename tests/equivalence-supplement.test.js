const test = require('node:test');
const assert = require('node:assert/strict');

const { shouldShowSupplementCta, buildSupplementSearchUrl } = require('../lib/equivalence-supplement');

test('deve exibir o bloco para substitutos do grupo suplementos', () => {
  assert.equal(shouldShowSupplementCta('suplementos'), true);
  assert.equal(shouldShowSupplementCta('Suplementos'), true);
  assert.equal(shouldShowSupplementCta('suplementos '), true);
});

test('não deve exibir o bloco para outros grupos', () => {
  assert.equal(shouldShowSupplementCta('cereais'), false);
  assert.equal(shouldShowSupplementCta(''), false);
  assert.equal(shouldShowSupplementCta(undefined), false);
});

test('deve montar o link do Google com o alimento substituto', () => {
  assert.equal(
    buildSupplementSearchUrl('Whey Protein'),
    'https://www.google.com/search?q=comprar+Whey%20Protein'
  );
  assert.equal(
    buildSupplementSearchUrl('Vitamina D3'),
    'https://www.google.com/search?q=comprar+Vitamina%20D3'
  );
});

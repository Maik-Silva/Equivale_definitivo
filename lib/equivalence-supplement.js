function shouldShowSupplementCta(group) {
  if (typeof group !== 'string') return false;
  return group.trim().toLowerCase() === 'suplementos';
}

function buildSupplementSearchUrl(alimentoSubstituto) {
  const term = typeof alimentoSubstituto === 'string' ? alimentoSubstituto.trim() : '';
  return `https://www.google.com/search?q=comprar+${encodeURIComponent(term)}`;
}

module.exports = {
  shouldShowSupplementCta,
  buildSupplementSearchUrl,
};

function getLimitProgressState(totalPacientes, limitePacientes) {
  const safeTotal = Number(totalPacientes ?? 0);
  const safeLimit = Number(limitePacientes ?? 5);
  const normalizedLimit = Number.isFinite(safeLimit) && safeLimit > 0 ? safeLimit : 5;
  const normalizedTotal = Number.isFinite(safeTotal) ? safeTotal : 0;
  const percentage = Math.round((normalizedTotal / normalizedLimit) * 100);

  return {
    totalPacientes: normalizedTotal,
    limitePacientes: normalizedLimit,
    percentage: Number.isFinite(percentage) ? percentage : 0,
    isLimitReached: normalizedTotal >= normalizedLimit,
  };
}

module.exports = {
  getLimitProgressState,
};

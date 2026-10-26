function toCents(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return NaN;
  return Math.round(number * 100);
}

function fromCents(cents) {
  return Number((Number(cents || 0) / 100).toFixed(2));
}

function formatMoney(cents, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(fromCents(cents));
}

module.exports = { toCents, fromCents, formatMoney };

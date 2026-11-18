export const formatINR = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

const trim = (v) => v.toFixed(1).replace(/\.0$/, '');

export function formatCompact(n) {
  if (n >= 1e7) return `₹${trim(n / 1e7)}Cr`;
  if (n >= 1e5) return `₹${trim(n / 1e5)}L`;
  if (n >= 1e3) return `₹${trim(n / 1e3)}K`;
  return `₹${Math.round(n)}`;
}

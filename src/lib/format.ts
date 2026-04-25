export const fmtUgx = (n: number | null | undefined) => {
  const v = Number(n ?? 0);
  if (v >= 1_000_000) return `UGX ${(v / 1_000_000).toFixed(1)}M`;
  return `UGX ${new Intl.NumberFormat().format(v)}`;
};

export const fmtUgxFull = (n: number | null | undefined) =>
  `UGX ${new Intl.NumberFormat().format(Number(n ?? 0))}`;

export const daysUntil = (date: string | null | undefined) => {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

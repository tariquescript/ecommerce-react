/** Money always arrives from the API in cents. */
export function formatMoney(amountCents) {
  return `$${(amountCents / 100).toFixed(2)}`;
}

const dateFmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

const shortDateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

/** Replaces dayjs (~7 KB gz) with the platform's own formatter. */
export const formatDeliveryDate = (ms) => dateFmt.format(new Date(ms));
export const formatOrderDate = (ms) => shortDateFmt.format(new Date(ms));

const DAY_MS = 86_400_000;

/** "in 3 days" / "tomorrow" — softer than a bare date in the UI. */
export function formatRelativeDays(ms) {
  const days = Math.round((ms - Date.now()) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

export const formatCount = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n);

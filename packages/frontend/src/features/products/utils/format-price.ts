export function formatPrice(
  amount: string | null,
  currency: string | null,
): string {
  if (amount === null || amount === '') {
    return 'Price unavailable';
  }

  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount)) {
    return 'Price unavailable';
  }

  if (currency) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
      }).format(numericAmount);
    } catch {
      return `${new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericAmount)} ${currency}`;
    }
  }

  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

export function formatDate(isoString: string | null): string {
  if (!isoString) {
    return '\u2014';
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '\u2014';
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

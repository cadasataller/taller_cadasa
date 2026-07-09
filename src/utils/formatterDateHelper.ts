export type DateFormatterInput = Date | Date[] | string | null | undefined;

export const formatLongSpanishDate = (value: DateFormatterInput): string => {
  const rawDate = Array.isArray(value) ? value[0] : value;
  const date = typeof rawDate === 'string' ? new Date(rawDate) : rawDate;

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
    .format(date)
    .toLowerCase();
};

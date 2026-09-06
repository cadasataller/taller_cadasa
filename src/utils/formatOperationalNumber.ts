export function formatOperationalNumber(value: string | number): string {
  const normalizedValue = String(value).trim();

  if (!/^\d{6}$/.test(normalizedValue)) return normalizedValue;

  return `${normalizedValue.slice(0, 1)}-${normalizedValue.slice(
    1,
    3,
  )}-${normalizedValue.slice(3, 6)}`;
}

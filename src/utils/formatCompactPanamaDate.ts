type CompactDateInput = Date | string | null | undefined;

const abbreviatedMonths = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "agos",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

const pad = (value: number): string => String(value).padStart(2, "0");

export function formatCompactDate(value: Date | null | undefined): string {
  if (!value || Number.isNaN(value.getTime())) return "—";

  return `${pad(value.getDate())} ${abbreviatedMonths[value.getMonth()]} ${String(
    value.getFullYear(),
  ).slice(-2)}`;
}

export function formatCompactPanamaDateTime(value: CompactDateInput): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const parts = new Intl.DateTimeFormat("es-PA", {
    timeZone: "America/Panama",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("day")} ${abbreviatedMonths[Number(part("month")) - 1]} ${part(
    "year",
  )} - ${part("hour")}:${part("minute")}`;
}

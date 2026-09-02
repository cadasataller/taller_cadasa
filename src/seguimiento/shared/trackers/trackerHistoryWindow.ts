const panamaTimeZone = "America/Panama";
const startTime = "06:00:00";
const endTime = "18:00:00";
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

interface PanamaDateParts {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
}

export interface TrackerHistoryWindow {
  cacheKey: string;
  date: string;
  from: string;
  to: string;
}

function getPanamaDateParts(date: Date): PanamaDateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: panamaTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute"),
    second: getPart("second"),
  };
}

export function formatPanamaDateTime(date: Date): string {
  const parts = getPanamaDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

export function createTrackerHistoryWindow(
  trackerId: number,
  selectedDate: string,
  now = new Date(),
): TrackerHistoryWindow | null {
  if (!datePattern.test(selectedDate)) return null;
  const nowInPanama = formatPanamaDateTime(now);
  const todayInPanama = nowInPanama.slice(0, 10);
  if (selectedDate > todayInPanama) return null;
  if (selectedDate === todayInPanama && nowInPanama.slice(11) < startTime)
    return null;
  const end =
    selectedDate === todayInPanama && nowInPanama.slice(11) < endTime
      ? nowInPanama.slice(11)
      : endTime;
  return {
    cacheKey: `${trackerId}:${selectedDate}:${startTime}:${endTime}`,
    date: selectedDate,
    from: `${selectedDate} ${startTime}`,
    to: `${selectedDate} ${end}`,
  };
}

export function isInTrackerHistoryWindow(
  capturedAt: string,
  window: TrackerHistoryWindow,
): boolean {
  return (
    capturedAt.slice(0, 10) === window.date &&
    capturedAt >= window.from &&
    capturedAt <= `${window.date} ${endTime}`
  );
}

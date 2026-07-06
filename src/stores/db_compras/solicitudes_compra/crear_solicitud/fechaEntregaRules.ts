export const TEMPORADA_ZAFRA_ACTIVA_FEATURE_KEY = 'temporada_zafra_activa';
export const FECHA_ENTREGA_MIN_DIAS_HABILES = 12;

export type FechaEntregaValidationReason =
  | 'required'
  | 'invalid'
  | 'before-min-date'
  | 'weekend'
  | 'holiday'
  | 'month-window'
  | 'rules-not-ready';

export interface FechaEntregaValidationResult {
  isValid: boolean;
  message: string | null;
  reason: FechaEntregaValidationReason | null;
}

export interface FechaEntregaValidationInput {
  fechaEntrega: string | null | undefined;
  today?: Date;
  isZafraActiva: boolean;
  minimumAllowedDate: string | null;
  holidaysByYear: Record<string, string[]>;
  rulesReady?: boolean;
}

export interface CalculateMinimumFechaEntregaOptions {
  today?: Date;
  ensureYear: (year: number) => Promise<void>;
  getHolidaysForYear: (year: number) => string[];
}

const HOLIDAY_MESSAGE = 'La fecha de entrega no puede caer en un feriado nacional.';
const WEEKEND_MESSAGE = 'La fecha de entrega no puede caer en sabado o domingo.';
const WINDOW_MESSAGE = 'La fecha de entrega solo puede programarse entre los dias 1 y 24 de cada mes.';
const BEFORE_MIN_DATE_MESSAGE = 'La fecha de entrega no cumple la anticipacion minima permitida.';

export const startOfDay = (value: Date): Date => {
  const normalized = new Date(value);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export const formatDateForDb = (value: Date): string => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const parseIsoDate = (value: string | null | undefined): Date | null => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return startOfDay(date);
};

const isWeekend = (value: Date): boolean => {
  const day = value.getDay();
  return day === 0 || day === 6;
};

const isHoliday = (
  value: Date,
  holidaysByYear: Record<string, string[]>
): boolean => {
  const yearKey = String(value.getFullYear());
  const yearHolidays = holidaysByYear[yearKey] ?? [];
  return yearHolidays.includes(formatDateForDb(value));
};

export const isAllowedDeliveryDateInNormalMode = (
  value: Date,
  holidaysByYear: Record<string, string[]>
): FechaEntregaValidationResult => {
  if (value.getDate() > 24) {
    return {
      isValid: false,
      message: WINDOW_MESSAGE,
      reason: 'month-window',
    };
  }

  if (isWeekend(value)) {
    return {
      isValid: false,
      message: WEEKEND_MESSAGE,
      reason: 'weekend',
    };
  }

  if (isHoliday(value, holidaysByYear)) {
    return {
      isValid: false,
      message: HOLIDAY_MESSAGE,
      reason: 'holiday',
    };
  }

  return {
    isValid: true,
    message: null,
    reason: null,
  };
};

export const validateFechaEntregaSync = ({
  fechaEntrega,
  today = new Date(),
  isZafraActiva,
  minimumAllowedDate,
  holidaysByYear,
  rulesReady = true,
}: FechaEntregaValidationInput): FechaEntregaValidationResult => {
  if (!fechaEntrega) {
    return {
      isValid: false,
      message: 'La fecha de entrega es obligatoria.',
      reason: 'required',
    };
  }

  const parsedDate = parseIsoDate(fechaEntrega);
  if (!parsedDate) {
    return {
      isValid: false,
      message: 'La fecha de entrega no es valida.',
      reason: 'invalid',
    };
  }

  if (isZafraActiva) {
    return {
      isValid: true,
      message: null,
      reason: null,
    };
  }

  if (!rulesReady || !minimumAllowedDate) {
    return {
      isValid: false,
      message: 'Las reglas de fecha de entrega aun se estan cargando.',
      reason: 'rules-not-ready',
    };
  }

  const minimumDate = parseIsoDate(minimumAllowedDate);
  const currentDay = startOfDay(today);

  if (!minimumDate) {
    return {
      isValid: false,
      message: 'Las reglas de fecha de entrega aun se estan cargando.',
      reason: 'rules-not-ready',
    };
  }

  if (parsedDate < currentDay || parsedDate < minimumDate) {
    return {
      isValid: false,
      message: BEFORE_MIN_DATE_MESSAGE,
      reason: 'before-min-date',
    };
  }

  return isAllowedDeliveryDateInNormalMode(parsedDate, holidaysByYear);
};

export const requiresFechaEntregaDraftReview = (
  input: FechaEntregaValidationInput
): boolean => !validateFechaEntregaSync(input).isValid;

const advanceOneDay = (value: Date): Date => {
  const next = new Date(value);
  next.setDate(next.getDate() + 1);
  return startOfDay(next);
};

const isBusinessDay = (
  value: Date,
  holidaysByYear: Record<string, string[]>
): boolean => !isWeekend(value) && !isHoliday(value, holidaysByYear);

export const calculateMinimumFechaEntrega = async ({
  today = new Date(),
  ensureYear,
  getHolidaysForYear,
}: CalculateMinimumFechaEntregaOptions): Promise<string> => {
  const currentDay = startOfDay(today);
  const holidaysByYear: Record<string, string[]> = {};

  const hydrateYear = async (year: number): Promise<void> => {
    if (holidaysByYear[String(year)]) {
      return;
    }

    await ensureYear(year);
    holidaysByYear[String(year)] = getHolidaysForYear(year);
  };

  await hydrateYear(currentDay.getFullYear());

  let cursor = currentDay;
  let countedBusinessDays = 0;

  while (countedBusinessDays < FECHA_ENTREGA_MIN_DIAS_HABILES) {
    cursor = advanceOneDay(cursor);
    await hydrateYear(cursor.getFullYear());

    if (isBusinessDay(cursor, holidaysByYear)) {
      countedBusinessDays += 1;
    }
  }

  while (true) {
    await hydrateYear(cursor.getFullYear());
    const validation = isAllowedDeliveryDateInNormalMode(cursor, holidaysByYear);

    if (validation.isValid) {
      return formatDateForDb(cursor);
    }

    cursor = advanceOneDay(cursor);
  }
};

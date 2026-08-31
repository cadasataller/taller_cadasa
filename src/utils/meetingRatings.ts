export const MEETING_NOTE_START = '[[GO_REUNION]]';
export const MEETING_NOTE_END = '[[/GO_REUNION]]';
export const MEETING_CRITERION_ID = 5;

export const MEETING_WEEKDAY_BY_EMAIL: Record<string, string> = {
  'ivanp@cadasa.com': 'Lunes',
  'joseim@cadasa.com': 'Martes',
  'equipop@cadasa.com': 'Miercoles',
  'testjl@cadasa.com': 'Jueves',
  'eladiop@cadasa.com': 'Viernes',
};

export type MeetingObservationActor = 'supervisor' | 'gerencia';

export interface MeetingObservationBlock {
  supervisor?: string;
  gerencia?: string;
}

export interface ParsedMeetingObservation {
  generalObservation: string;
  meetingObservation: MeetingObservationBlock;
  hasMeetingBlock: boolean;
}

export interface MeetingCriterionLike {
  id_criterio: number;
  descripcion_tarea?: string | null;
  nombre?: string | null;
}

const MEETING_CRITERION_KEYWORDS = [
  'reunion',
  'calificacion reunion',
  'calificacion de reunion',
  'reunion supervisor',
  'reunion de supervisor',
];

const normalizeText = (value: string | null | undefined) => (
  value || ''
)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const cleanBlankLines = (value: string) => (
  value
    .replace(/\n{3,}/g, '\n\n')
    .trim()
);

const escapeRegExp = (value: string) => (
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
);

const getMeetingRegex = () => (
  new RegExp(
    `${escapeRegExp(MEETING_NOTE_START)}([\\s\\S]*?)${escapeRegExp(MEETING_NOTE_END)}`
  )
);

export const parseMeetingObservation = (
  observation: string | null | undefined
): ParsedMeetingObservation => {
  const normalizedObservation = (observation || '').replace(/\r\n/g, '\n');
  const match = normalizedObservation.match(getMeetingRegex());

  if (!match) {
    return {
      generalObservation: normalizedObservation.trim(),
      meetingObservation: {},
      hasMeetingBlock: false,
    };
  }

  let meetingObservation: MeetingObservationBlock = {};

  try {
    meetingObservation = JSON.parse(match[1]) as MeetingObservationBlock;
  } catch (error) {
    console.warn('No se pudo parsear el bloque reservado de reunion', error);
  }

  const generalObservation = cleanBlankLines(
    normalizedObservation.replace(match[0], '')
  );

  return {
    generalObservation,
    meetingObservation,
    hasMeetingBlock: true,
  };
};

const stringifyMeetingObservation = (
  meetingObservation: MeetingObservationBlock
): string | null => {
  const normalizedBlock = Object.fromEntries(
    Object.entries(meetingObservation)
      .map(([key, value]) => [key, (value || '').trim()])
      .filter(([, value]) => value.length > 0)
  );

  if (Object.keys(normalizedBlock).length === 0) {
    return null;
  }

  return `${MEETING_NOTE_START}${JSON.stringify(normalizedBlock)}${MEETING_NOTE_END}`;
};

export const upsertMeetingObservationBlock = (
  observation: string | null | undefined,
  actor: MeetingObservationActor,
  value: string
): string => {
  const parsed = parseMeetingObservation(observation);
  const nextMeetingObservation: MeetingObservationBlock = {
    ...parsed.meetingObservation,
  };
  const normalizedValue = value.trim();

  if (normalizedValue) {
    nextMeetingObservation[actor] = normalizedValue;
  } else {
    delete nextMeetingObservation[actor];
  }

  const serializedMeetingBlock = stringifyMeetingObservation(nextMeetingObservation);
  const fragments = [parsed.generalObservation];

  if (serializedMeetingBlock) {
    fragments.push(serializedMeetingBlock);
  }

  return cleanBlankLines(fragments.filter(Boolean).join('\n\n'));
};

export const mergeGeneralObservationWithMeetingBlock = (
  generalObservation: string,
  originalObservation: string | null | undefined
): string => {
  const parsed = parseMeetingObservation(originalObservation);
  const serializedMeetingBlock = stringifyMeetingObservation(parsed.meetingObservation);
  const fragments = [generalObservation.trim()];

  if (serializedMeetingBlock) {
    fragments.push(serializedMeetingBlock);
  }

  return cleanBlankLines(fragments.filter(Boolean).join('\n\n'));
};

export const removeMeetingObservationBlock = (
  observation: string | null | undefined
): string => {
  const parsed = parseMeetingObservation(observation);
  return parsed.generalObservation;
};

export const resolveMeetingCriterionId = (
  criterios: MeetingCriterionLike[]
): number | null => {
  const criterionById = criterios.find((criterio) => criterio.id_criterio === MEETING_CRITERION_ID);

  if (criterionById) {
    return MEETING_CRITERION_ID;
  }

  const match = criterios.find((criterio) => {
    const label = normalizeText(
      criterio.descripcion_tarea || criterio.nombre || ''
    );

    return MEETING_CRITERION_KEYWORDS.some((keyword) => label.includes(keyword));
  });

  return match?.id_criterio ?? null;
};

export const getMeetingAssignedWeekday = (email: string | null | undefined) => {
  const normalizedEmail = normalizeText(email);
  return MEETING_WEEKDAY_BY_EMAIL[normalizedEmail] || 'Sin asignar';
};

const WEEKDAY_INDEX: Record<string, number> = {
  Lunes: 1,
  Martes: 2,
  Miercoles: 3,
  Jueves: 4,
  Viernes: 5,
};

export const getRelativeMeetingWeekdayLabel = (
  weekday: string,
  referenceDate = new Date()
) => {
  const assignedIndex = WEEKDAY_INDEX[weekday];

  if (!assignedIndex) {
    return weekday;
  }

  const jsDay = referenceDate.getDay();
  const currentIndex = jsDay === 0 ? 7 : jsDay;

  if (assignedIndex === currentIndex) {
    return 'Hoy';
  }

  if (assignedIndex === currentIndex - 1) {
    return 'Ayer';
  }

  if (assignedIndex === currentIndex + 1) {
    return 'Mañana';
  }

  return weekday;
};

const MEETING_BADGE_DAY_FORMATTER = new Intl.DateTimeFormat('es', {
  weekday: 'long',
  timeZone: 'UTC',
});

const capitalize = (value: string) => (
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value
);

export const getMeetingBadgeLabel = (
  filter: string,
  date: string
) => {
  if (filter === 'Hoy') return 'Reunion Hoy';
  if (filter === 'Ayer') return 'Reunion Ayer';

  const weekday = capitalize(
    normalizeText(
      MEETING_BADGE_DAY_FORMATTER.format(new Date(`${date}T00:00:00Z`))
    )
  );

  if (filter === 'Todas') {
    return `Reunion ${weekday} ${date}`;
  }

  return `Reunion ${weekday}`;
};

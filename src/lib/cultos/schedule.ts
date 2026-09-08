export type WorshipServiceType = "quarta" | "sabado" | "domingo" | "especial";
export type WorshipSpecialType =
  | "semana_oracao"
  | "mini_semana_oracao"
  | "culto_gratidao"
  | "culto_virada"
  | "outro";

export type WorshipTemplate = {
  type: Exclude<WorshipServiceType, "especial">;
  weekday: number;
  label: string;
  startTime: string;
  endTime: string;
};

export type WorshipOccurrence = {
  serviceDate: string;
  serviceType: WorshipServiceType;
  startTime: string;
  endTime: string;
};

export type SpecialWorshipOccurrence = {
  serviceDate: string;
  startTime: string;
  endTime: string;
  title: string;
  specialType: WorshipSpecialType;
};

export type CalendarDay = {
  date: string;
  day: number;
  currentMonth: boolean;
};

export const worshipTemplates: WorshipTemplate[] = [
  {
    type: "domingo",
    weekday: 0,
    label: "Domingo",
    startTime: "19:45",
    endTime: "21:00",
  },
  {
    type: "quarta",
    weekday: 3,
    label: "Quarta-feira",
    startTime: "19:45",
    endTime: "21:00",
  },
  {
    type: "sabado",
    weekday: 6,
    label: "Sábado",
    startTime: "08:45",
    endTime: "12:00",
  },
];

export const specialWorshipOptions: Array<{
  value: WorshipSpecialType;
  label: string;
}> = [
  { value: "semana_oracao", label: "Semana de Oração" },
  { value: "mini_semana_oracao", label: "Mini Semana de Oração" },
  { value: "culto_gratidao", label: "Culto de Gratidão" },
  { value: "culto_virada", label: "Culto da Virada" },
  { value: "outro", label: "Outro culto especial" },
];

export function validateMonthRange({
  year,
  startMonth,
  endMonth,
}: {
  year: number;
  startMonth: number;
  endMonth: number;
}) {
  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    return "Informe um ano válido.";
  }

  if (!isValidMonth(startMonth) || !isValidMonth(endMonth)) {
    return "Informe meses válidos.";
  }

  if (endMonth < startMonth) {
    return "O mês final deve ser igual ou posterior ao mês inicial.";
  }

  if (endMonth - startMonth + 1 > 3) {
    return "Gere no máximo 3 meses por vez.";
  }

  return null;
}

export function buildWorshipOccurrences({
  year,
  startMonth,
  endMonth,
}: {
  year: number;
  startMonth: number;
  endMonth: number;
}) {
  const validationError = validateMonthRange({ year, startMonth, endMonth });

  if (validationError) {
    throw new Error(validationError);
  }

  const occurrences: WorshipOccurrence[] = [];

  for (let month = startMonth; month <= endMonth; month += 1) {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(Date.UTC(year, month - 1, day));
      const template = worshipTemplates.find(
        (item) => item.weekday === date.getUTCDay(),
      );

      if (template) {
        occurrences.push({
          serviceDate: formatDateKey(year, month, day),
          serviceType: template.type,
          startTime: template.startTime,
          endTime: template.endTime,
        });
      }
    }
  }

  return occurrences;
}

export function validateSpecialWorshipRange({
  title,
  specialType,
  startDate,
  endDate,
  startTime,
  endTime,
}: {
  title: string;
  specialType: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}) {
  if (!title.trim()) {
    return "Informe o nome do culto especial.";
  }

  if (!isSpecialWorshipType(specialType)) {
    return "Escolha um tipo de culto especial válido.";
  }

  if (!isDateKey(startDate) || !isDateKey(endDate)) {
    return "Informe datas válidas.";
  }

  if (endDate < startDate) {
    return "A data final deve ser igual ou posterior à data inicial.";
  }

  if (!isTimeValue(startTime) || !isTimeValue(endTime)) {
    return "Informe horários válidos.";
  }

  if (endTime <= startTime) {
    return "O horário de término deve ser posterior ao início.";
  }

  if (countDaysInclusive(startDate, endDate) > 31) {
    return "Cultos especiais podem ter no máximo 31 dias por criação.";
  }

  return null;
}

export function buildSpecialWorshipOccurrences({
  title,
  specialType,
  startDate,
  endDate,
  startTime,
  endTime,
}: {
  title: string;
  specialType: WorshipSpecialType;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}) {
  const validationError = validateSpecialWorshipRange({
    title,
    specialType,
    startDate,
    endDate,
    startTime,
    endTime,
  });

  if (validationError) {
    throw new Error(validationError);
  }

  const occurrences: SpecialWorshipOccurrence[] = [];
  const current = parseDateKey(startDate);
  const finalDate = parseDateKey(endDate);

  while (current <= finalDate) {
    occurrences.push({
      serviceDate: toDateInputValue(current),
      specialType,
      title: title.trim(),
      startTime,
      endTime,
    });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return occurrences;
}

export function buildCalendarDays(year: number, month: number): CalendarDay[] {
  if (!Number.isInteger(year) || !isValidMonth(month)) {
    return [];
  }

  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = firstOfMonth.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const previousMonthDays = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
  const days: CalendarDay[] = [];

  for (let index = firstWeekday - 1; index >= 0; index -= 1) {
    const day = previousMonthDays - index;
    const date = new Date(Date.UTC(year, month - 2, day));
    days.push({
      date: toDateInputValue(date),
      day,
      currentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({
      date: formatDateKey(year, month, day),
      day,
      currentMonth: true,
    });
  }

  while (days.length % 7 !== 0) {
    const nextDay = days.length - firstWeekday - daysInMonth + 1;
    const date = new Date(Date.UTC(year, month, nextDay));
    days.push({
      date: toDateInputValue(date),
      day: nextDay,
      currentMonth: false,
    });
  }

  return days;
}

export function getAdjacentMonth(year: number, month: number, direction: -1 | 1) {
  const date = new Date(Date.UTC(year, month - 1 + direction, 1));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
  };
}

export function getMonthName(month: number) {
  const date = new Date(Date.UTC(2026, month - 1, 1));
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date);
}

export function getTemplateLabel(type: WorshipServiceType) {
  if (type === "especial") {
    return "Especial";
  }

  return worshipTemplates.find((template) => template.type === type)?.label ?? type;
}

export function getSpecialWorshipLabel(type: WorshipSpecialType | string | null) {
  return (
    specialWorshipOptions.find((option) => option.value === type)?.label ??
    "Culto especial"
  );
}

function isValidMonth(month: number) {
  return Number.isInteger(month) && month >= 1 && month <= 12;
}

function isSpecialWorshipType(value: string): value is WorshipSpecialType {
  return specialWorshipOptions.some((option) => option.value === value);
}

function isDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return toDateInputValue(parseDateKey(value)) === value;
}

function isTimeValue(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function countDaysInclusive(startDate: string, endDate: string) {
  const start = parseDateKey(startDate).getTime();
  const end = parseDateKey(endDate).getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  return Math.floor((end - start) / oneDay) + 1;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toDateInputValue(date: Date) {
  return formatDateKey(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

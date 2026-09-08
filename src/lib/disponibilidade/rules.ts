export type AvailabilityRoleKey = "pregador" | "cantor";

export function isAvailabilityRoleKey(value: string): value is AvailabilityRoleKey {
  return value === "pregador" || value === "cantor";
}

export function normalizeSelectedDates({
  selectedDates,
  allowedDates,
}: {
  selectedDates: string[];
  allowedDates: string[];
}) {
  const allowed = new Set(allowedDates);

  return Array.from(new Set(selectedDates))
    .filter((date) => allowed.has(date))
    .sort();
}

export function validateAvailabilityMonth({
  monthStart,
  monthEnd,
}: {
  monthStart: string;
  monthEnd: string;
}) {
  if (!isDateKey(monthStart) || !isDateKey(monthEnd)) {
    return "Período de disponibilidade inválido.";
  }

  if (monthEnd < monthStart) {
    return "O fim do período deve ser posterior ao início.";
  }

  if (monthStart.slice(0, 7) !== monthEnd.slice(0, 7)) {
    return "Salve a disponibilidade de um mês por vez.";
  }

  return null;
}

function isDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

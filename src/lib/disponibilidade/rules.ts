export type AvailabilityRoleKey = "pregador" | "cantor";

export type AvailabilityServiceSource = {
  id: string;
  church_id: string;
  service_date: string;
  is_special: boolean;
};

export type AvailabilitySlot = {
  key: string;
  serviceDate: string;
  worshipServiceId: string | null;
};

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

export function getRegularAvailabilitySlotKey(serviceDate: string) {
  return `regular:${serviceDate}`;
}

export function getSpecialAvailabilitySlotKey(worshipServiceId: string) {
  return `special:${worshipServiceId}`;
}

export function buildAvailabilitySlots({
  services,
  selectedChurchIds,
}: {
  services: AvailabilityServiceSource[];
  selectedChurchIds: string[];
}) {
  const selectedChurches = new Set(selectedChurchIds);
  const slots = new Map<string, AvailabilitySlot>();

  for (const service of services) {
    if (!selectedChurches.has(service.church_id)) {
      continue;
    }

    const slot: AvailabilitySlot = service.is_special
      ? {
          key: getSpecialAvailabilitySlotKey(service.id),
          serviceDate: service.service_date,
          worshipServiceId: service.id,
        }
      : {
          key: getRegularAvailabilitySlotKey(service.service_date),
          serviceDate: service.service_date,
          worshipServiceId: null,
        };

    slots.set(slot.key, slot);
  }

  return Array.from(slots.values()).sort(
    (first, second) =>
      first.serviceDate.localeCompare(second.serviceDate) ||
      Number(Boolean(first.worshipServiceId)) - Number(Boolean(second.worshipServiceId)) ||
      first.key.localeCompare(second.key),
  );
}

export function normalizeSelectedSlots({
  selectedSlots,
  allowedSlots,
}: {
  selectedSlots: string[];
  allowedSlots: AvailabilitySlot[];
}) {
  const allowed = new Set(allowedSlots.map((slot) => slot.key));

  return Array.from(new Set(selectedSlots))
    .filter((slot) => allowed.has(slot))
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

export type VolunteerAssignment = {
  serviceId: string;
  serviceDate: string;
  userId: string | null;
};

export type VolunteerAvailability = {
  available: boolean;
  managed: boolean;
  serviceDate: string;
  serviceId: string | null;
  userId: string;
};

export type VolunteerChurchLink = {
  churchId: string;
  userId: string;
};

export function isVolunteerAvailableForService({
  availability,
  churchLinks,
  service,
  userId,
}: {
  availability: VolunteerAvailability[];
  churchLinks: VolunteerChurchLink[];
  service: {
    churchId: string;
    date: string;
    id: string;
    isSpecial: boolean;
  };
  userId: string;
}) {
  const hasChurchLink = churchLinks.some(
    (link) => link.userId === userId && link.churchId === service.churchId,
  );
  const serviceAvailability = availability.find(
    (item) => item.userId === userId && item.serviceId === service.id,
  );

  if (serviceAvailability) {
    return (
      serviceAvailability.available &&
      (serviceAvailability.managed || hasChurchLink)
    );
  }

  if (service.isSpecial || !hasChurchLink) {
    return false;
  }

  return availability.some(
    (item) =>
      item.userId === userId &&
      item.serviceId === null &&
      item.serviceDate === service.date &&
      item.available,
  );
}

export function hasVolunteerDateConflict({
  assignments,
  currentServiceId,
  serviceDate,
  userId,
}: {
  assignments: VolunteerAssignment[];
  currentServiceId?: string;
  serviceDate: string;
  userId: string;
}) {
  return assignments.some(
    (assignment) =>
      assignment.userId === userId &&
      assignment.serviceDate === serviceDate &&
      assignment.serviceId !== currentServiceId,
  );
}

export function getOccupiedVolunteerDateKeys(assignments: VolunteerAssignment[]) {
  return new Set(
    assignments
      .filter((assignment) => assignment.userId)
      .map((assignment) => `${assignment.userId}:${assignment.serviceDate}`),
  );
}

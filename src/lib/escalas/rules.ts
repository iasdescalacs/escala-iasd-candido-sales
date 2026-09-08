export type VolunteerAssignment = {
  serviceId: string;
  serviceDate: string;
  userId: string | null;
};

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

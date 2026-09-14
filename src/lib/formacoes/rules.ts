export type MusicalFormationType = "dupla" | "trio" | "grupo";
export type MusicalFormationStatus = "pending" | "active" | "inactive";

export const musicalFormationTypes: Array<{
  key: MusicalFormationType;
  label: string;
}> = [
  { key: "dupla", label: "Dupla" },
  { key: "trio", label: "Trio" },
  { key: "grupo", label: "Grupo" },
];

export function isMusicalFormationType(
  value: string,
): value is MusicalFormationType {
  return musicalFormationTypes.some((type) => type.key === value);
}

export function isMusicalFormationStatus(
  value: string,
): value is MusicalFormationStatus {
  return value === "pending" || value === "active" || value === "inactive";
}

export function validateFormationMemberCount(
  formationType: MusicalFormationType,
  memberCount: number,
) {
  if (formationType === "dupla" && memberCount !== 2) {
    return "Uma dupla precisa ter exatamente dois integrantes.";
  }

  if (formationType === "trio" && memberCount !== 3) {
    return "Um trio precisa ter exatamente três integrantes.";
  }

  if (formationType === "grupo" && memberCount < 2) {
    return "Um grupo precisa ter pelo menos dois integrantes.";
  }

  return null;
}

export function formationTypeLabel(value: string) {
  return musicalFormationTypes.find((type) => type.key === value)?.label ?? "Formação";
}

export function formationStatusLabel(value: string) {
  if (value === "active") {
    return "Ativa";
  }

  if (value === "inactive") {
    return "Inativa";
  }

  return "Aguardando aprovação";
}

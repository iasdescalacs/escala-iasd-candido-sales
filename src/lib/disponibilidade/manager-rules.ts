import type { AvailabilityRoleKey } from "./rules";

export function getManagedAvailabilityRoleKeys(
  viewerRoleKeys: string[],
): AvailabilityRoleKey[] {
  if (viewerRoleKeys.includes("admin")) {
    return ["pregador", "cantor"];
  }

  const roles: AvailabilityRoleKey[] = [];

  if (viewerRoleKeys.includes("anciao")) {
    roles.push("pregador");
  }

  if (viewerRoleKeys.includes("lider_musica")) {
    roles.push("cantor");
  }

  return roles;
}

export function canManageAvailabilityRole({
  targetRoleKey,
  viewerRoleKeys,
}: {
  targetRoleKey: string;
  viewerRoleKeys: string[];
}) {
  return getManagedAvailabilityRoleKeys(viewerRoleKeys).includes(
    targetRoleKey as AvailabilityRoleKey,
  );
}

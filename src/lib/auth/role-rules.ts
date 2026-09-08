export type RoleKey = "admin" | "anciao" | "lider_musica" | "pregador" | "cantor";

export const assignableRoleKeys = ["anciao", "lider_musica", "pregador", "cantor"] as const;
export const selfManagedRoleKeys = ["pregador", "cantor"] as const;

export type AssignableRoleKey = (typeof assignableRoleKeys)[number];
export type SelfManagedRoleKey = (typeof selfManagedRoleKeys)[number];

export function isRoleKey(value: string): value is RoleKey {
  return ["admin", ...assignableRoleKeys].includes(value as RoleKey);
}

export function isAssignableRoleKey(value: string): value is AssignableRoleKey {
  return assignableRoleKeys.includes(value as AssignableRoleKey);
}

export function isSelfManagedRoleKey(value: string): value is SelfManagedRoleKey {
  return selfManagedRoleKeys.includes(value as SelfManagedRoleKey);
}

export function normalizeRoleKeys(values: string[], { allowAdmin = false } = {}) {
  return Array.from(new Set(values.filter((value) => {
    if (allowAdmin && value === "admin") {
      return true;
    }

    return isAssignableRoleKey(value);
  }))) as RoleKey[];
}

export function mergeSelfManagedRoles({
  currentRoleKeys,
  selectedSelfRoleKeys,
}: {
  currentRoleKeys: string[];
  selectedSelfRoleKeys: string[];
}) {
  const protectedRoleKeys = currentRoleKeys.filter((roleKey) => !isSelfManagedRoleKey(roleKey));
  const selfRoles = selectedSelfRoleKeys.filter(isSelfManagedRoleKey);

  return normalizeRoleKeys([...protectedRoleKeys, ...selfRoles], { allowAdmin: true });
}

export function isManagerRoleKey(roleKey: RoleKey) {
  return roleKey === "anciao" || roleKey === "lider_musica";
}

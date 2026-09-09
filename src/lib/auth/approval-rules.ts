import type { RoleKey } from "./role-rules";

export type ApprovalRequestRole = "pregador" | "cantor";

export type ApprovalViewer = {
  managedChurchIds: string[];
  roleKeys: RoleKey[];
};

export type PendingApprovalRequest = {
  churchId: string;
  roleKey: ApprovalRequestRole;
};

export function canApprovePendingUserRole({
  request,
  viewer,
}: {
  request: PendingApprovalRequest;
  viewer: ApprovalViewer;
}) {
  if (viewer.roleKeys.includes("admin")) {
    return true;
  }

  if (viewer.roleKeys.includes("anciao") && viewer.managedChurchIds.includes(request.churchId)) {
    return request.roleKey === "pregador" || request.roleKey === "cantor";
  }

  if (viewer.roleKeys.includes("lider_musica") && viewer.managedChurchIds.includes(request.churchId)) {
    return request.roleKey === "cantor";
  }

  return false;
}

export function getAllowedManagedCreationRoles(roleKeys: RoleKey[]) {
  if (roleKeys.includes("admin") || roleKeys.includes("anciao")) {
    return ["pregador", "cantor"] as ApprovalRequestRole[];
  }

  if (roleKeys.includes("lider_musica")) {
    return ["cantor"] as ApprovalRequestRole[];
  }

  return [] as ApprovalRequestRole[];
}

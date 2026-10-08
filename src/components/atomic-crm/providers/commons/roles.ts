export const ROLE = {
  SUPER_ADMIN: "super_admin",
  HEAD_OF_SALES: "head_of_sales",
  RSM: "rsm",
  SSM: "ssm",
  ASM: "asm",
  BDO: "bdo",
} as const;

export type CrmRole = (typeof ROLE)[keyof typeof ROLE];

export const CRM_ROLES: readonly CrmRole[] = [
  ROLE.SUPER_ADMIN,
  ROLE.HEAD_OF_SALES,
  ROLE.RSM,
  ROLE.SSM,
  ROLE.ASM,
  ROLE.BDO,
];

export const ROLE_LABELS: Record<CrmRole, string> = {
  [ROLE.SUPER_ADMIN]: "Super Admin",
  [ROLE.HEAD_OF_SALES]: "Head of Sales",
  [ROLE.RSM]: "RSM",
  [ROLE.SSM]: "SSM",
  [ROLE.ASM]: "ASM",
  [ROLE.BDO]: "BDO",
};

export const PARENT_ROLES: Record<CrmRole, CrmRole | null> = {
  [ROLE.SUPER_ADMIN]: null,
  [ROLE.HEAD_OF_SALES]: null,
  [ROLE.RSM]: null,
  [ROLE.SSM]: ROLE.RSM,
  [ROLE.ASM]: ROLE.SSM,
  [ROLE.BDO]: ROLE.SSM,
};

export const isSuperAdmin = (role: string | null | undefined) =>
  role === ROLE.SUPER_ADMIN;

export const getMigratedRole = (
  role: string | null | undefined,
  administrator?: boolean,
): CrmRole => {
  if (CRM_ROLES.includes(role as CrmRole)) return role as CrmRole;
  return administrator ? ROLE.SUPER_ADMIN : ROLE.BDO;
};

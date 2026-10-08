import type { CrmRole } from "../providers/commons/roles";

export const canCreateLead = (role?: CrmRole) =>
	role === "super_admin" ||
	role === "head_of_sales" ||
	role === "rsm" ||
	role === "ssm" ||
	role === "asm";
export const canEditLead = (role?: CrmRole) => role === "rsm" || role === "ssm" || role === "asm" || role === "bdo";
export const canAssignLead = (role?: CrmRole) => role === "rsm" || role === "ssm" || role === "asm";
export const canConvertLead = (role?: CrmRole) => role === "rsm" || role === "ssm" || role === "asm" || role === "bdo";
export const isLeadReadOnly = (role?: CrmRole) => role === "super_admin" || role === "head_of_sales";

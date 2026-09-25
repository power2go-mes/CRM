import { isSuperAdmin } from "./roles";

// FIXME: This should be exported from the ra-core package
type CanAccessParams<
  RecordType extends Record<string, any> = Record<string, any>,
> = {
  action: string;
  resource: string;
  record?: RecordType;
};

export const canAccess = <
  RecordType extends Record<string, any> = Record<string, any>,
>(
  role: string,
  params: CanAccessParams<RecordType>,
) => {
  if (isSuperAdmin(role)) {
    return true;
  }

  // Only Super Admin can manage users or global configuration.
  if (params.resource === "sales" || params.resource === "users") {
    return false;
  }

  if (params.resource === "configuration" || params.resource === "regions") {
    return false;
  }

  return true;
};

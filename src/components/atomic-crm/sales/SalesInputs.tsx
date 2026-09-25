import {
  email,
  required,
  useGetIdentity,
  useGetList,
  useRecordContext,
} from "ra-core";
import { BooleanInput } from "@/components/admin/boolean-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";
import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import type { Sale } from "../types";
import { CRM_ROLES, ROLE_LABELS, type CrmRole } from "../providers/commons/roles";

export function SalesInputs({ includePassword = false }: { includePassword?: boolean }) {
  const { setValue } = useFormContext();
  const { identity } = useGetIdentity();
  const record = useRecordContext<Sale>();
  const { data: managers = [] } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "first_name", order: "ASC" },
    filter: { "disabled@neq": true },
  });
  const { data: regions = [] } = useGetList("regions", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "name", order: "ASC" },
    filter: { "is_active@eq": true },
  });
  const role = useWatch({ name: "role" }) as CrmRole | undefined;
  const regionId = useWatch({ name: "region_id" });
  const reportsToUserId = useWatch({ name: "reports_to_user_id" });
  const managerRole: Partial<Record<CrmRole, CrmRole>> = {
    ssm: "rsm",
    asm: "rsm",
    bdo: "asm",
  };
  const eligibleManagers = managers.filter((manager) => {
    if (!role || manager.role !== managerRole[role]) return false;
    return (
      String(manager.region_id) === String(regionId)
    );
  });
  const requiresRegion = role != null && ["rsm", "ssm", "asm", "bdo"].includes(role);
  const requiresManager = role === "bdo";
  const assignsToRegionalManager = role === "ssm" || role === "asm";

  useEffect(() => {
    if (role === "super_admin" || role === "head_of_sales") {
      setValue("region_id", null);
    }
    if (!requiresManager) {
      if (assignsToRegionalManager) {
        setValue("reports_to_user_id", eligibleManagers[0]?.user_id ?? null);
      } else {
        setValue("reports_to_user_id", null);
      }
      return;
    }
    if (
      reportsToUserId &&
      managers.length > 0 &&
      !eligibleManagers.some((manager) => manager.user_id === reportsToUserId)
    ) {
      setValue("reports_to_user_id", null);
    }
  }, [assignsToRegionalManager, eligibleManagers, managers.length, reportsToUserId, requiresManager, role, setValue]);

  return (
    <div className="space-y-4 w-full">
      <TextInput source="first_name" validate={required()} helperText={false} />
      <TextInput source="last_name" validate={required()} helperText={false} />
      <TextInput
        source="email"
        validate={[required(), email()]}
        helperText={false}
      />
      {includePassword ? (
        <TextInput
          source="password"
          type="password"
          autoComplete="new-password"
          validate={(value: string) =>
            value?.length >= 6
              ? undefined
              : "Password must be at least 6 characters"
          }
          helperText={false}
        />
      ) : null}
      <TextInput source="designation" helperText={false} />
      <SelectInput
        source="role"
        choices={CRM_ROLES.map((role) => ({
          id: role,
          name: ROLE_LABELS[role],
        }))}
        validate={required()}
        helperText={false}
      />
      <SelectInput
        source="region_id"
        label="Region"
        emptyText={requiresRegion ? "Select a region" : "All regions"}
        choices={regions.map((region) => ({ id: region.id, name: region.name }))}
        validate={requiresRegion ? required() : undefined}
        helperText={
          role === "super_admin" || role === "head_of_sales"
            ? "Super Admin and Head of Sales operate across all regions."
            : false
        }
      />
      {requiresManager ? (
        <SelectInput
          source="reports_to_user_id"
          label="Associated ASM"
          emptyText={regionId ? "Select a manager" : "Select a region first"}
          choices={eligibleManagers.map((manager) => ({
            id: manager.user_id,
            name: `${manager.first_name} ${manager.last_name} (${ROLE_LABELS[manager.role as CrmRole] ?? "Unknown"})`,
          }))}
          validate={required()}
          helperText={false}
        />
      ) : null}
      {assignsToRegionalManager ? (
        <p className={eligibleManagers.length ? "text-sm text-muted-foreground" : "text-sm text-destructive"}>
          {eligibleManagers.length
            ? `Automatically assigned to the RSM for this region: ${eligibleManagers[0].first_name} ${eligibleManagers[0].last_name}.`
            : regionId
              ? "Create or activate an RSM for this region before creating this user."
              : "Select a region to assign its RSM automatically."}
        </p>
      ) : null}
      <BooleanInput
        source="disabled"
        readOnly={record?.id === identity?.id}
        helperText={false}
      />
    </div>
  );
}

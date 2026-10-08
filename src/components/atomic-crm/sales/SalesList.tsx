import { useGetList, useRecordContext } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { Badge } from "@/components/ui/badge";

import { TopToolbar } from "../layout/TopToolbar";
import { ROLE_LABELS, type CrmRole } from "../providers/commons/roles";
import type { Region, Sale } from "../types";

const SalesListActions = () => (
  <TopToolbar>
    <ExportButton />
    <CreateButton label="Add User" />
  </TopToolbar>
);

const filters = [<SearchInput source="q" alwaysOn />];

const RegionField = () => {
  const record = useRecordContext<Sale>();
  const { data: regions = [] } = useGetList<Region>("regions", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "name", order: "ASC" },
    filter: {},
  });

  if (!record?.region_id) return "All regions";
  return (
    regions.find((region) => String(region.id) === String(record.region_id))
      ?.name ?? `Region #${record.region_id}`
  );
};

const OptionsField = (_props: { label?: string | boolean }) => {
  const record = useRecordContext();
  if (!record) return null;
  return (
    <div className="flex flex-row gap-1">
      {record.role && (
        <Badge
          variant="outline"
          className="border-blue-300 dark:border-blue-700"
        >
          {ROLE_LABELS[record.role as CrmRole] ?? record.role}
        </Badge>
      )}
      {record.disabled && (
        <Badge
          variant="outline"
          className="border-orange-300 dark:border-orange-700"
        >
          Inactive
        </Badge>
      )}
    </div>
  );
};

const ReportsToField = () => {
  const record = useRecordContext<Sale>();
  const { data: users = [] } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "first_name", order: "ASC" },
    filter: {},
  });

  if (!record?.reports_to_user_id) return "—";

  const manager = users.find(
    (user) => String(user.user_id) === String(record.reports_to_user_id),
  );

  if (!manager) return record.reports_to_user_id;

  const managerName = [manager.first_name, manager.last_name]
    .filter(Boolean)
    .join(" ");

  return managerName || (ROLE_LABELS[manager.role] ?? manager.role);
};

export function SalesList() {
  return (
    <List
      title="Users & Roles"
      description="Create and manage FINLONEXA users, roles, reporting managers, Regions, and access status. Select a user to open their profile."
      filters={filters}
      actions={<SalesListActions />}
      sort={{ field: "first_name", order: "ASC" }}
    >
      <DataTable rowClick="show">
        <DataTable.Col source="first_name" />
        <DataTable.Col source="last_name" />
        <DataTable.Col source="email" />
        <DataTable.Col source="designation" />
        <DataTable.Col source="role" />
        <DataTable.Col label="Region">
          <RegionField />
        </DataTable.Col>
        <DataTable.Col label="Reports To">
          <ReportsToField />
        </DataTable.Col>
        <DataTable.Col label={false}>
          <OptionsField />
        </DataTable.Col>
      </DataTable>
    </List>
  );
}

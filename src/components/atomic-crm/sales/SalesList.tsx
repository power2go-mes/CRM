import { useRecordContext } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { Badge } from "@/components/ui/badge";

import { TopToolbar } from "../layout/TopToolbar";
import { ROLE_LABELS, type CrmRole } from "../providers/commons/roles";

const SalesListActions = () => (
  <TopToolbar>
    <ExportButton />
    <CreateButton label="Add User" />
  </TopToolbar>
);

const filters = [<SearchInput source="q" alwaysOn />];

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
        <DataTable.Col source="region_id" label="Region" />
        <DataTable.Col source="reports_to_user_id" label="Reports To" />
        <DataTable.Col label={false}>
          <OptionsField />
        </DataTable.Col>
      </DataTable>
    </List>
  );
}

import { BooleanField } from "@/components/admin/boolean-field";
import { BooleanInput } from "@/components/admin/boolean-input";
import { CancelButton } from "@/components/admin/cancel-button";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { FormToolbar } from "../layout/FormToolbar";
import { List } from "@/components/admin/list";
import { SaveButton } from "@/components/admin/form";
import { TextInput } from "@/components/admin/text-input";
import { Card, CardContent } from "@/components/ui/card";
import { CreateBase, EditBase, Form, required } from "ra-core";
import type { Region } from "../types";
import { TopToolbar } from "../layout/TopToolbar";
import { RegionShow } from "./RegionShow";

const RegionInputs = () => (
  <div className="space-y-4 pt-4">
    <TextInput source="name" validate={required()} helperText={false} />
    <TextInput source="code" validate={required()} helperText={false} />
    <TextInput source="description" multiline helperText={false} />
    <BooleanInput source="is_active" label="Active" helperText={false} />
  </div>
);

const RegionList = () => (
  <List
    title="Regions"
    description="Manage sales Regions and their assigned teams. Select a Region to view its team structure and monitoring details."
    actions={<TopToolbar><CreateButton label="Add Region" /></TopToolbar>}
    sort={{ field: "name", order: "ASC" }}
  >
    <DataTable<Region> rowClick="show" bulkActionButtons={false}>
      <DataTable.Col source="name" />
      <DataTable.Col source="code" />
      <DataTable.Col source="is_active" label="Status"><BooleanField source="is_active" /></DataTable.Col>
      <DataTable.NumberCol source="rsm_count" label="RSMs" />
      <DataTable.NumberCol source="ssm_count" label="SSMs" />
      <DataTable.NumberCol source="asm_count" label="ASMs" />
      <DataTable.NumberCol source="bdo_count" label="BDOs" />
      <DataTable.NumberCol source="user_count" label="Users" />
    </DataTable>
  </List>
);

const RegionCreate = () => (
  <CreateBase redirect="list">
    <div className="max-w-xl mx-auto mt-8"><Form defaultValues={{ is_active: true }}>
      <Card><CardContent><RegionInputs /><div className="flex justify-end gap-2 pt-4"><CancelButton /><SaveButton label="Create Region" /></div></CardContent></Card>
    </Form></div>
  </CreateBase>
);

const RegionEdit = () => (
  <EditBase redirect="list">
    <div className="max-w-xl mx-auto mt-8"><Form>
      <Card><CardContent><RegionInputs /><FormToolbar /></CardContent></Card>
    </Form></div>
  </EditBase>
);

export default {
  list: RegionList,
  create: RegionCreate,
  edit: RegionEdit,
  show: RegionShow,
  recordRepresentation: (record: Region) => record.name,
};

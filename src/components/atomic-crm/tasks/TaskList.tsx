import { useGetIdentity } from "ra-core";

import { CreateButton } from "@/components/admin/create-button";
import { List } from "@/components/admin/list";

import { TopToolbar } from "../layout/TopToolbar";
import { TasksListContent } from "./TasksListContent";

export const TaskList = () => {
  const { identity } = useGetIdentity();

  if (!identity) return null;

  return (
    <List
      title="Tasks"
      description="Manage your follow-ups and sales tasks. Open a task to update it or open its related record."
      actions={
        <TopToolbar>
          <CreateButton label="Create task" />
        </TopToolbar>
      }
      perPage={100}
      pagination={false}
    >
      <TasksListContent />
    </List>
  );
};

export default TaskList;

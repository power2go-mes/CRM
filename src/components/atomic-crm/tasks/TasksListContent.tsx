import { TasksListByDueDate } from "./TasksListByDueDate";
import { useTranslate } from "ra-core";

export const TasksListContent = () => {
  const translate = useTranslate();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold">Tasks</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your follow-ups and sales tasks. Open a task to update it or open its related record.
        </p>
      </div>
      <TasksListByDueDate
        emptyPlaceholder={
          <p className="text-sm">
            {translate("resources.tasks.empty_list_hint")}
          </p>
        }
      />
    </div>
  );
};

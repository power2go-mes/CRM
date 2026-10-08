import { useTranslate } from "ra-core";

import { TasksListByDueDate } from "./TasksListByDueDate";

export const TasksListContent = () => {
  const translate = useTranslate();

  return (
    <div className="w-full space-y-4 pb-2">
      <TasksListByDueDate
        emptyPlaceholder={
          <div className="rounded-[1.5rem] border border-border/80 bg-card/90 px-5 py-6 text-sm text-muted-foreground shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
            {translate("resources.tasks.empty_list_hint")}
          </div>
        }
      />
    </div>
  );
};

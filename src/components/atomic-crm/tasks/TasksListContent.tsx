import { useTranslate } from "ra-core";

import { TasksListByDueDate } from "./TasksListByDueDate";

export const TasksListContent = () => {
  const translate = useTranslate();

  return (
    <div className="w-full">
      <TasksListByDueDate
        emptyPlaceholder={
          <div className="rounded-[22px] border border-slate-200 bg-white/80 px-5 py-6 text-sm text-slate-600 shadow-[0_12px_35px_rgba(15,23,42,0.04)]">
            {translate("resources.tasks.empty_list_hint")}
          </div>
        }
      />
    </div>
  );
};

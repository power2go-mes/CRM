import {
  ListContextProvider,
  ResourceContextProvider,
  useList,
  useTranslate,
} from "ra-core";

import { TasksIterator } from "./TasksIterator";

type TaskListProps = {
  tasks: any[];
  title: string;
  showContact?: boolean;
  isMobile: boolean;
};

export const TaskListFilter = ({
  tasks,
  title,
  showContact,
  isMobile,
}: TaskListProps) => {
  const translate = useTranslate();
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const listContext = useList({
    data: safeTasks,
    resource: "tasks",
    perPage: isMobile ? 10 : 5,
  });

  const { total } = listContext;

  if (!safeTasks.length || !total) return null;

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white/80 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.04)]">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      <ResourceContextProvider value="tasks">
        <ListContextProvider value={listContext}>
          <TasksIterator showContact={showContact} />
        </ListContextProvider>
      </ResourceContextProvider>
      {total > listContext.perPage && (
        <div className="mt-3 flex justify-center">
          <a
            href="#"
            onClick={(e) => {
              listContext.setPerPage(listContext.perPage + 10);
              e.preventDefault();
            }}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {translate("crm.common.load_more")}
          </a>
        </div>
      )}
    </div>
  );
};

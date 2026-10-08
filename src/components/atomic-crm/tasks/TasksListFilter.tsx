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
    <div className="rounded-[1.5rem] border border-border/80 bg-card/90 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.04)] md:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
        </p>
        {safeTasks.length > 0 && (
          <span className="rounded-full border border-primary/10 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
            {safeTasks.length}
          </span>
        )}
      </div>
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
            className="text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
          >
            {translate("crm.common.load_more")}
          </a>
        </div>
      )}
    </div>
  );
};

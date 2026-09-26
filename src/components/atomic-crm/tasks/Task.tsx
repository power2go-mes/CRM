import { useQueryClient } from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";
import {
  useDeleteWithUndoController,
  useGetRecordRepresentation,
  useNotify,
  useTranslate,
  useUpdate,
} from "ra-core";
import { useEffect, useState } from "react";
import { ReferenceField } from "@/components/admin/reference-field";
import { DateField } from "@/components/admin/date-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Contact, Task as TData } from "../types";
import { TaskEdit } from "./TaskEdit";
import { TaskEditSheet } from "./TaskEditSheet";
import { useIsMobile } from "@/hooks/use-mobile";

export const Task = ({
  task,
  showContact,
}: {
  task: TData;
  showContact?: boolean;
}) => {
  const isMobile = useIsMobile();
  const { taskTypes } = useConfigurationContext();
  const notify = useNotify();
  const translate = useTranslate();
  const queryClient = useQueryClient();
  const getContactRepresentation = useGetRecordRepresentation("contacts");

  const [openEdit, setOpenEdit] = useState(false);

  const handleCloseEdit = () => {
    setOpenEdit(false);
  };

  const [update, { isPending: isUpdatePending, isSuccess, variables }] =
    useUpdate();
  const { handleDelete } = useDeleteWithUndoController({
    record: task,
    redirect: false,
    mutationOptions: {
      onSuccess() {
        notify("resources.tasks.deleted", {
          undoable: true,
        });
      },
    },
  });

  const handleEdit = () => {
    setOpenEdit(true);
  };

  const handleCheck = () => () => {
    update("tasks", {
      id: task.id,
      data: {
        done_date: task.done_date ? null : new Date().toISOString(),
      },
      previousData: task,
    });
  };

  useEffect(() => {
    // We do not want to invalidate the query when a tack is checked or unchecked
    if (
      isUpdatePending ||
      !isSuccess ||
      variables?.data?.done_date != undefined
    ) {
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["tasks", "getList"] });
  }, [queryClient, isUpdatePending, isSuccess, variables]);

  const labelId = `checkbox-list-label-${task.id}`;

  return (
    <>
      <div className="flex items-start justify-between gap-3 rounded-[1.2rem] border border-border/80 bg-slate-50/80 px-3 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.02)] transition-all duration-200 hover:border-primary/20 hover:bg-white/90 hover:shadow-[0_12px_28px_rgba(37,99,235,0.06)]">
        <div
          className="flex flex-1 items-start gap-3"
          onClick={isMobile ? handleCheck() : undefined}
        >
          <Checkbox
            id={labelId}
            checked={!!task.done_date}
            onCheckedChange={handleCheck()}
            disabled={isUpdatePending}
            className="mt-1.5 h-4 w-4 rounded-[6px] border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
          <div className={`min-w-0 flex-1 ${task.done_date ? "line-through text-slate-400" : "text-slate-800"}`}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {task.type && task.type !== "none" && (
                <span className="inline-flex rounded-full border border-primary/10 bg-primary/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-primary">
                  {(() => {
                    const matchedTaskType = taskTypes.find(
                      (taskType) => taskType.value === task.type,
                    );
                    return matchedTaskType ? matchedTaskType.label : task.type;
                  })()}
                </span>
              )}
              <span className="font-semibold tracking-[-0.01em]">{task.text}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground md:text-sm">
              {translate("resources.tasks.fields.due_short")}
              &nbsp;
              <DateField source="due_date" record={task} showDate showTime />
              {showContact && (
                <ReferenceField<TData, Contact>
                  source="contact_id"
                  reference="contacts"
                  record={task}
                  link="show"
                  className="inline text-xs text-muted-foreground md:text-sm"
                  render={({ referenceRecord }) => {
                    if (!referenceRecord) return null;
                    return (
                      <>
                        {" "}
                        {translate("resources.tasks.regarding_contact", {
                          name: getContactRepresentation(referenceRecord),
                        })}
                      </>
                    );
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer rounded-full text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              aria-label={translate("resources.tasks.actions.title")}
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              className="cursor-pointer h-12 md:h-8 px-4 md:px-2 text-base md:text-sm"
              onClick={() => {
                update("tasks", {
                  id: task.id,
                  data: {
                    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000)
                      .toISOString()
                      .slice(0, 10),
                  },
                  previousData: task,
                });
              }}
            >
              {translate("resources.tasks.actions.postpone_tomorrow")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer h-12 md:h-8 px-4 md:px-2 text-base md:text-sm"
              onClick={() => {
                update("tasks", {
                  id: task.id,
                  data: {
                    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .slice(0, 10),
                  },
                  previousData: task,
                });
              }}
            >
              {translate("resources.tasks.actions.postpone_next_week")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer h-12 md:h-8 px-4 md:px-2 text-base md:text-sm"
              onClick={handleEdit}
            >
              {translate("ra.action.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer h-12 md:h-8 px-4 md:px-2 text-base md:text-sm"
              onClick={handleDelete}
            >
              {translate("ra.action.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isMobile ? (
        <TaskEditSheet
          taskId={task.id}
          open={openEdit}
          onOpenChange={setOpenEdit}
        />
      ) : (
        <TaskEdit taskId={task.id} open={openEdit} close={handleCloseEdit} />
      )}
    </>
  );
};

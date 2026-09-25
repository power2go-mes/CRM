import { useState } from "react";
import { Link } from "react-router";
import { ShowBase, useGetIdentity, useGetList, useShowContext, useUpdate } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Lead, Task } from "../types";
import type { CrmRole } from "../providers/commons/roles";
import { TaskCreateSheet } from "../tasks/TaskCreateSheet";

export const LeadShow = () => <ShowBase><LeadShowContent /></ShowBase>;
const LeadShowContent = () => {
  const { record, isPending } = useShowContext<Lead>();
  const { identity } = useGetIdentity();
  const role = (identity as { role?: CrmRole } | undefined)?.role;
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [update, { isPending: isUpdating }] = useUpdate();
  const tasks = useGetList<Task>("tasks", { pagination: { page: 1, perPage: 100 }, sort: { field: "due_date", order: "ASC" }, filter: record ? { lead_id: record.id } : {} }, { enabled: !!record });
  if (isPending || !record) return null;
  const openTasks = (tasks.data ?? []).filter((task) => !task.done_date);
  const next = openTasks.find((task) => new Date(task.due_date) >= new Date());
  const nextStatuses = record.status === "new" ? ["contacted"] : record.status === "contacted" ? ["qualified", "unqualified"] : record.status === "qualified" ? ["contacted"] : [];
  return <div className="mx-auto mt-4 max-w-5xl space-y-4 pb-20"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-semibold">{record.first_name} {record.last_name}</h2><p className="text-muted-foreground">{record.company_name || "No company"} · {record.status}</p></div>{role === "bdo" ? <div className="flex gap-2"><Button variant="outline" asChild><Link to={`/leads/${record.id}`}>Update details</Link></Button><Button onClick={() => setFollowUpOpen(true)}>Create Follow-up</Button></div> : null}</div><Card><CardHeader><CardTitle>Lead information</CardTitle></CardHeader><CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Detail label="Email" value={record.email} /><Detail label="Phone" value={record.phone} /><Detail label="Source" value={record.source} /><Detail label="Status" value={record.status} /><Detail label="Owner" value={record.owner_name} /><Detail label="Region" value={record.region_name} /><Detail label="Created" value={new Date(record.created_at).toLocaleString()} /><Detail label="Updated" value={new Date(record.updated_at).toLocaleString()} /></CardContent></Card><Card><CardHeader><CardTitle>Lead progress</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{nextStatuses.map((status) => <Button key={status} disabled={isUpdating} onClick={() => update("leads", { id: record.id, data: { status }, previousData: record })}>{status === "contacted" ? "Mark Contacted" : status === "qualified" ? "Mark Qualified" : "Mark Unqualified"}</Button>)}</div>{record.status === "qualified" && !record.converted_at ? <p className="mt-3 text-sm text-muted-foreground">Ready to convert. Transactional conversion is not available yet.</p> : null}{record.status === "unqualified" ? <div className="mt-4"><Detail label="Unqualified reason" value={record.unqualified_reason} /><Detail label="Unqualified at" value={record.unqualified_at ? new Date(record.unqualified_at).toLocaleString() : undefined} /></div> : null}</CardContent></Card><Card><CardHeader><CardTitle>Follow-ups</CardTitle></CardHeader><CardContent><Detail label="Next follow-up" value={next ? new Date(next.due_date).toLocaleString() : "None"} /><div className="mt-3 space-y-2">{(tasks.data ?? []).map((task) => <div key={task.id} className="rounded-md border p-3"><p className="font-medium">{task.text}</p><p className="text-sm text-muted-foreground">{new Date(task.due_date).toLocaleString()} · {task.done_date ? "Completed" : new Date(task.due_date) < new Date() ? "Overdue" : "Pending"}</p></div>)}</div></CardContent></Card><Card><CardHeader><CardTitle>Notes</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap">{record.notes || "No notes yet. Use Update details to add notes."}</p></CardContent></Card><TaskCreateSheet open={followUpOpen} onOpenChange={setFollowUpOpen} lead_id={record.id} /></div>;
};
const Detail = ({ label, value }: { label: string; value?: string | null }) => <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium capitalize">{value || "—"}</p></div>;

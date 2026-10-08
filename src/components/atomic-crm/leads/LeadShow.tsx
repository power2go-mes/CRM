import { useState } from "react";
import { Link } from "react-router";
import { ShowBase, useGetIdentity, useGetList, useRefresh, useShowContext, useUpdate } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Lead, Task } from "../types";
import type { CrmRole } from "../providers/commons/roles";
import { TaskCreateSheet } from "../tasks/TaskCreateSheet";
import { canConvertLead, canEditLead } from "./permissions";
import { LeadConvertDialog } from "./LeadConvertDialog";

export const LeadShow = () => <ShowBase><LeadShowContent /></ShowBase>;

const LeadShowContent = () => {
  const { record, isPending } = useShowContext<Lead>();
  const { identity } = useGetIdentity();
  const refresh = useRefresh();
  const role = (identity as { role?: CrmRole } | undefined)?.role;
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [conversion, setConversion] = useState<{ contact_id: string | number; company_id: string | number; deal_id: string | number | null } | null>(null);
  const [update, { isPending: isUpdating }] = useUpdate();
  const tasks = useGetList<Task>("tasks", { pagination: { page: 1, perPage: 100 }, sort: { field: "due_date", order: "ASC" }, filter: record ? { lead_id: record.id } : {} }, { enabled: !!record });
  if (isPending || !record) return null;
  const openTasks = (tasks.data ?? []).filter((task) => !task.done_date);
  const next = openTasks.find((task) => new Date(task.due_date) >= new Date());
  const nextStatuses = record.status === "new" ? ["contacted"] : record.status === "contacted" ? ["qualified", "unqualified"] : record.status === "qualified" ? ["contacted"] : [];
  const canConvert = canConvertLead(role) && record.status === "qualified" && !record.converted_at;
  const contactId = conversion?.contact_id ?? record.converted_contact_id;
  const companyId = conversion?.company_id ?? record.converted_company_id;
  const dealId = conversion?.deal_id ?? record.converted_deal_id;
  return <div className="mx-auto mt-4 max-w-5xl space-y-4 pb-20">
    <Button variant="ghost" asChild><Link to="/leads">← Back to Leads</Link></Button>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-muted-foreground">Leads / {record.first_name} {record.last_name}</p><h2 className="text-2xl font-semibold">{record.first_name} {record.last_name}</h2><p className="text-muted-foreground">{record.company_name || "No company"} · Current status: {record.status}</p></div><div className="flex flex-wrap gap-2">{role === "bdo" ? <Button variant="outline" asChild><Link to={`/leads/${record.id}`}>Update details</Link></Button> : null}{role === "bdo" ? <Button onClick={() => setFollowUpOpen(true)}>Create Follow-up</Button> : null}{canConvert ? <Button onClick={() => setConvertOpen(true)}>Convert Lead</Button> : null}</div></div>
    <Card><CardHeader><CardTitle>Lead information</CardTitle></CardHeader><CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Detail label="Email" value={record.email} /><Detail label="Phone" value={record.phone} /><Detail label="Source" value={record.source} /><Detail label="Status" value={record.status} /><Detail label="Owner (Lead creator)" value={record.owner_name} /><Detail label="Assigned BDO (responsible for working this Lead)" value={record.assigned_bdo_name} /><Detail label="Region (managed by your sales hierarchy)" value={record.region_name} /><Detail label="Created" value={new Date(record.created_at).toLocaleString()} /><Detail label="Updated" value={new Date(record.updated_at).toLocaleString()} /></CardContent></Card>
    <Card><CardHeader><CardTitle>Lead progress</CardTitle></CardHeader><CardContent><p className="mb-3 text-sm text-muted-foreground">Current status: <strong>{record.status}</strong>. {record.status === "qualified" ? canConvert ? "Convert this qualified Lead into CRM records." : "This Lead is ready for conversion by an authorized sales user." : "Choose the next valid action below."}</p>{canEditLead(role) ? <div className="flex flex-wrap gap-2">{nextStatuses.map((status) => <Button key={status} disabled={isUpdating} onClick={() => update("leads", { id: record.id, data: { status }, previousData: record })}>{status === "contacted" ? "Mark Contacted" : status === "qualified" ? "Mark Qualified" : "Mark Unqualified"}</Button>)}</div> : null}{record.status === "unqualified" ? <div className="mt-4"><Detail label="Unqualified reason" value={record.unqualified_reason} /><Detail label="Unqualified at" value={record.unqualified_at ? new Date(record.unqualified_at).toLocaleString() : undefined} /></div> : null}</CardContent></Card>
    {record.status === "converted" || record.converted_at || conversion ? <Card><CardHeader><CardTitle>Conversion</CardTitle></CardHeader><CardContent className="space-y-3"><Detail label="Converted at" value={record.converted_at ? new Date(record.converted_at).toLocaleString() : "Just now"} /><div className="flex flex-wrap gap-2">{contactId ? <Button variant="outline" asChild><Link to={`/contacts/${contactId}/show`}>Open Contact</Link></Button> : null}{companyId ? <Button variant="outline" asChild><Link to={`/companies/${companyId}/show`}>Open Company</Link></Button> : null}{dealId ? <Button variant="outline" asChild><Link to={`/deals/${dealId}/show`}>Open Opportunity</Link></Button> : null}</div></CardContent></Card> : null}
    <Card><CardHeader><CardTitle>Follow-ups</CardTitle></CardHeader><CardContent><Detail label="Next follow-up" value={next ? new Date(next.due_date).toLocaleString() : "No follow-up scheduled"} />{!(tasks.data ?? []).length ? <p className="mt-3 text-sm text-muted-foreground">No follow-up scheduled. Create one to plan the next customer interaction.</p> : <div className="mt-3 space-y-2">{(tasks.data ?? []).map((task) => <div key={task.id} className="rounded-md border p-3"><p className="font-medium">{task.text}</p><p className="text-sm text-muted-foreground">{new Date(task.due_date).toLocaleString()} · {task.done_date ? "Completed" : new Date(task.due_date) < new Date() ? "Overdue" : "Pending"}</p></div>)}</div>}</CardContent></Card>
    <Card><CardHeader><CardTitle>Notes</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap">{record.notes || "No notes yet. Use Update details to add notes."}</p></CardContent></Card>
    <TaskCreateSheet open={followUpOpen} onOpenChange={setFollowUpOpen} lead_id={record.id} />
    <LeadConvertDialog lead={record} open={convertOpen} onOpenChange={setConvertOpen} onConverted={(result) => { setConversion(result); refresh(); }} />
  </div>;
};
const Detail = ({ label, value }: { label: string; value?: string | null }) => <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium capitalize">{value || "—"}</p></div>;

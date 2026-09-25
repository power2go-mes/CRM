import { Link } from "react-router";
import { ShowBase, useGetList, useShowContext } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Company, Contact, Deal, Sale, Task } from "../types";
import { ROLE_LABELS } from "../providers/commons/roles";

export const SalesShow = () => <ShowBase><SalesShowContent /></ShowBase>;

const SalesShowContent = () => {
  const { record, isPending } = useShowContext<Sale>();
  const query = record ? { pagination: { page: 1, perPage: 1000 }, sort: { field: "id", order: "ASC" as const }, filter: { sales_id: record.id } } : undefined;
  const contacts = useGetList<Contact>("contacts", query!, { enabled: !!record });
  const companies = useGetList<Company>("companies", query!, { enabled: !!record });
  const deals = useGetList<Deal>("deals", query!, { enabled: !!record });
  const tasks = useGetList<Task>("tasks", query!, { enabled: !!record });
  const managers = useGetList<Sale>("sales", { pagination: { page: 1, perPage: 200 }, sort: { field: "id", order: "ASC" }, filter: {} });
  if (isPending || !record) return null;
  const manager = managers.data?.find((sale) => sale.user_id === record.reports_to_user_id);
  const managerChain = (() => {
    const all = managers.data ?? [];
    const chain: Sale[] = [];
    let next = manager;
    while (next && !chain.some((item) => item.id === next!.id)) {
      chain.push(next);
      next = all.find((sale) => sale.user_id === next!.reports_to_user_id);
    }
    return chain;
  })();
  const pipeline = (deals.data ?? []).filter((deal) => !["won", "lost"].includes(deal.stage)).reduce((sum, deal) => sum + deal.amount, 0);
  return <div className="mx-auto mt-6 max-w-4xl space-y-5"><div className="flex items-center justify-between"><div><h2 className="text-2xl font-semibold">{record.first_name} {record.last_name}</h2><p className="text-muted-foreground">{record.email}</p></div><Link className="text-sm underline" to={`/users/${record.id}`}>Edit user</Link></div><Card><CardHeader><CardTitle>User details</CardTitle></CardHeader><CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Detail label="Designation" value={record.designation ?? "—"} /><Detail label="Role" value={ROLE_LABELS[record.role]} /><Detail label="Region" value={record.region ?? (record.region_id ? `Region #${record.region_id}` : "All regions")} /><Detail label="Reports to" value={manager ? `${manager.first_name} ${manager.last_name}` : "—"} /><Detail label="Status" value={record.disabled ? "Inactive" : "Active"} /><Detail label="Pipeline value" value={pipeline.toLocaleString(undefined, { style: "currency", currency: "PKR", maximumFractionDigits: 0 })} /></CardContent></Card>{managerChain.length ? <Card><CardHeader><CardTitle>Manager chain</CardTitle></CardHeader><CardContent><p>{managerChain.map((sale) => `${sale.first_name} ${sale.last_name} (${ROLE_LABELS[sale.role]})`).join(" → ")}</p></CardContent></Card> : null}<Card><CardHeader><CardTitle>Owned records</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4"><Detail label="Contacts" value={String(contacts.total ?? 0)} /><Detail label="Accounts" value={String(companies.total ?? 0)} /><Detail label="Opportunities" value={String(deals.total ?? 0)} /><Detail label="Tasks" value={String(tasks.total ?? 0)} /></CardContent></Card></div>;
};
const Detail = ({ label, value }: { label: string; value: string }) => <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div>;

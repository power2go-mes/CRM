import { Link } from "react-router";
import { ShowBase, useGetList, useShowContext } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Company, Contact, Deal, Region, Sale, Task } from "../types";
import { ROLE_LABELS } from "../providers/commons/roles";

export const RegionShow = () => <ShowBase><RegionShowContent /></ShowBase>;
const RegionShowContent = () => {
  const { record, isPending } = useShowContext<Region>();
  const users = useGetList<Sale>("sales", { pagination: { page: 1, perPage: 1000 }, sort: { field: "first_name", order: "ASC" }, filter: record ? { region_id: record.id } : {} }, { enabled: !!record });
  const companies = useGetList<Company>("companies", { pagination: { page: 1, perPage: 1000 }, sort: { field: "id", order: "ASC" }, filter: {} }, { enabled: !!record });
  const contacts = useGetList<Contact>("contacts", { pagination: { page: 1, perPage: 1000 }, sort: { field: "id", order: "ASC" }, filter: {} }, { enabled: !!record });
  const deals = useGetList<Deal>("deals", { pagination: { page: 1, perPage: 1000 }, sort: { field: "id", order: "ASC" }, filter: {} }, { enabled: !!record });
  const tasks = useGetList<Task>("tasks", { pagination: { page: 1, perPage: 1000 }, sort: { field: "id", order: "ASC" }, filter: {} }, { enabled: !!record });
  if (isPending || !record) return null;
  const ids = new Set((users.data ?? []).map((user) => String(user.id)));
  const regionDeals = (deals.data ?? []).filter((deal) => ids.has(String(deal.sales_id)));
  const pipeline = regionDeals.filter((deal) => !["won", "lost"].includes(deal.stage)).reduce((sum, deal) => sum + deal.amount, 0);
  return <div className="mx-auto mt-6 max-w-5xl space-y-5"><div className="flex items-center justify-between"><div><h2 className="text-2xl font-semibold">{record.name}</h2><p className="text-muted-foreground">{record.code} · {record.is_active ? "Active" : "Inactive"}</p></div><Link className="text-sm underline" to={`/regions/${record.id}`}>Edit Region</Link></div><Card><CardHeader><CardTitle>Region performance</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-4 md:grid-cols-5"><Metric label="Pipeline" value={pipeline.toLocaleString(undefined,{style:"currency",currency:"PKR",maximumFractionDigits:0})}/><Metric label="Users" value={String(users.total ?? 0)}/><Metric label="Contacts" value={String((contacts.data ?? []).filter((item)=>ids.has(String(item.sales_id))).length)}/><Metric label="Accounts" value={String((companies.data ?? []).filter((item)=>ids.has(String(item.sales_id))).length)}/><Metric label="Tasks" value={String((tasks.data ?? []).filter((item)=>ids.has(String(item.sales_id))).length)}/></CardContent></Card><Card><CardHeader><CardTitle>Region team</CardTitle></CardHeader><CardContent><div className="grid gap-2 sm:grid-cols-2">{(users.data ?? []).map((user)=><Link className="rounded border p-3 hover:bg-muted" key={user.id} to={`/users/${user.id}/show`}><p className="font-medium">{user.first_name} {user.last_name}</p><p className="text-sm text-muted-foreground">{ROLE_LABELS[user.role]}</p></Link>)}</div></CardContent></Card></div>;
};
const Metric=({label,value}:{label:string;value:string})=><div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div>;

import { useQueryClient } from "@tanstack/react-query";
import { useGetList, useNotify } from "ra-core";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { Company, Contact, Lead } from "../types";
import { getSupabaseClient } from "../providers/supabase/supabase";

type ConversionResult = {
  lead_id: string | number;
  contact_id: string | number;
  company_id: string | number;
  deal_id: string | number | null;
};

export const LeadConvertDialog = ({
  lead,
  open,
  onOpenChange,
  onConverted,
}: {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConverted: (result: ConversionResult) => void;
}) => {
  const notify = useNotify();
  const queryClient = useQueryClient();
  const companies = useGetList<Company>("companies", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "name", order: "ASC" },
    filter: {},
  }, { enabled: open });
  const contacts = useGetList<Contact>("contacts", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "last_seen", order: "DESC" },
    filter: {},
  }, { enabled: open });
  const [firstName, setFirstName] = useState(lead.first_name);
  const [lastName, setLastName] = useState(lead.last_name ?? "");
  const [email, setEmail] = useState(lead.email ?? "");
  const [phone, setPhone] = useState(lead.phone ?? "");
  const [companyMode, setCompanyMode] = useState<"existing" | "new">("new");
  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState(lead.company_name ?? "");
  const [contactId, setContactId] = useState("");
  const [createDeal, setCreateDeal] = useState(true);
  const [dealName, setDealName] = useState(`${lead.company_name || `${lead.first_name} ${lead.last_name ?? ""}`.trim()} Opportunity`);
  const [amount, setAmount] = useState("0");
  const [closingDate, setClosingDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFirstName(lead.first_name);
    setLastName(lead.last_name ?? "");
    setEmail(lead.email ?? "");
    setPhone(lead.phone ?? "");
    setCompanyName(lead.company_name ?? "");
  }, [lead, open]);

  const possibleDuplicate = useMemo(() => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.replace(/\D/g, "");
    if (!normalizedEmail && !normalizedPhone) return undefined;
    return (contacts.data ?? []).find((contact) =>
      contact.email_jsonb?.some((item) => item.email?.trim().toLowerCase() === normalizedEmail) ||
      contact.phone_jsonb?.some((item) => item.number?.replace(/\D/g, "") === normalizedPhone),
    );
  }, [contacts.data, email, phone]);

  const submit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      notify("Contact first name and last name are required.", { type: "error" });
      return;
    }
    if (companyMode === "new" && !companyName.trim()) {
      notify("Enter a new Company name or select an existing Company.", { type: "error" });
      return;
    }
    if (companyMode === "existing" && !companyId) {
      notify("Select an existing Company.", { type: "error" });
      return;
    }
    if (createDeal && (!dealName.trim() || !closingDate)) {
      notify("Opportunity name and expected closing date are required.", { type: "error" });
      return;
    }
    setIsSaving(true);
    try {
      const { data, error } = await getSupabaseClient().rpc("convert_qualified_lead", {
        p_lead_id: lead.id,
        p_first_name: firstName.trim(),
        p_last_name: lastName.trim(),
        p_email: email.trim() || null,
        p_phone: phone.trim() || null,
        p_existing_contact_id: contactId ? Number(contactId) : null,
        p_existing_company_id: companyMode === "existing" ? Number(companyId) : null,
        p_new_company_name: companyMode === "new" ? companyName.trim() : null,
        p_create_deal: createDeal,
        p_deal_name: createDeal ? dealName.trim() : null,
        p_deal_amount: createDeal ? Number(amount || 0) : 0,
        p_expected_closing_date: createDeal ? closingDate : null,
        p_deal_stage: "opportunity",
      });
      if (error) throw error;
      const result = data as ConversionResult;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
        queryClient.invalidateQueries({ queryKey: ["contacts"] }),
        queryClient.invalidateQueries({ queryKey: ["companies"] }),
        queryClient.invalidateQueries({ queryKey: ["deals"] }),
      ]);
      notify("Lead converted successfully.", { type: "success" });
      onConverted(result);
      onOpenChange(false);
    } catch (error: any) {
      const message = error?.message || "Conversion failed. No records were created.";
      notify(message, { type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Convert Lead</DialogTitle>
        <DialogDescription>Convert this qualified Lead into CRM records. The Lead owner and Assigned BDO will remain unchanged.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-6 py-2">
        <section className="grid gap-3"><h3 className="font-semibold">Contact</h3>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="First name *"><Input value={firstName} onChange={(event) => setFirstName(event.target.value)} /></Field><Field label="Last name *"><Input value={lastName} onChange={(event) => setLastName(event.target.value)} /></Field></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Email"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></Field><Field label="Phone"><Input value={phone} onChange={(event) => setPhone(event.target.value)} /></Field></div>
          {possibleDuplicate ? <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">A matching Contact may already exist: {possibleDuplicate.first_name} {possibleDuplicate.last_name}. Select it below to reuse it instead of creating a duplicate.</p> : null}
          <Field label="Use existing Contact (optional)"><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={contactId} onChange={(event) => setContactId(event.target.value)}><option value="">Create a new Contact</option>{(contacts.data ?? []).map((contact) => <option key={contact.id} value={String(contact.id)}>{contact.first_name} {contact.last_name}{contact.company_name ? ` — ${contact.company_name}` : ""}</option>)}</select></Field>
        </section>
        <section className="grid gap-3"><h3 className="font-semibold">Company</h3>
          <div className="flex gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" checked={companyMode === "existing"} onChange={() => setCompanyMode("existing")} /> Use existing Company</label><label className="flex items-center gap-2"><input type="radio" checked={companyMode === "new"} onChange={() => setCompanyMode("new")} /> Create new Company</label></div>
          {companyMode === "existing" ? <Field label="Company *"><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={companyId} onChange={(event) => setCompanyId(event.target.value)}><option value="">Select a Company</option>{(companies.data ?? []).map((company) => <option key={company.id} value={String(company.id)}>{company.name}</option>)}</select></Field> : <Field label="Company name *"><Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} /></Field>}
        </section>
        <section className="grid gap-3"><div className="flex items-center gap-2"><Checkbox id="create-opportunity" checked={createDeal} onCheckedChange={(value) => setCreateDeal(value === true)} /><Label htmlFor="create-opportunity">Create an Opportunity</Label></div>
          {createDeal ? <div className="grid gap-3 sm:grid-cols-2"><Field label="Opportunity name *"><Input value={dealName} onChange={(event) => setDealName(event.target.value)} /></Field><Field label="Amount"><Input min="0" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} /></Field><Field label="Expected closing date *"><Input type="date" value={closingDate} onChange={(event) => setClosingDate(event.target.value)} /></Field><Field label="Stage"><Input value="Opportunity" readOnly /></Field></div> : null}
        </section>
      </div>
      <DialogFooter><Button variant="outline" disabled={isSaving} onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={isSaving} onClick={submit}>{isSaving ? "Converting…" : "Convert Lead"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => <label className="grid gap-1.5 text-sm font-medium"><span>{label}</span>{children}</label>;

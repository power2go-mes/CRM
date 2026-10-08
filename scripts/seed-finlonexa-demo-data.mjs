import { createClient } from "@supabase/supabase-js";

const projectUrl = process.env.VITE_SUPABASE_URL;
const publishableKey = process.env.VITE_SB_PUBLISHABLE_KEY;
const password = process.env.SUPABASE_TEST_ACCOUNT_PASSWORD;

const accountEmails = [
  "admin@gmail.com",
  "izharali2a@gmail.com",
  "hussain@gmail.com",
  "huzaifa@gmail.com",
  "abdullah@gmail.com",
  "rafay@gmail.com",
];

const companies = [
  {
    key: "northstar",
    name: "Demo Northstar Robotics",
    sector: "industrials",
    size: 75,
    city: "Seattle",
    country: "United States",
    description: "Fictional robotics manufacturer for CRM testing.",
    owner: "rafay@gmail.com",
  },
  {
    key: "juniper",
    name: "Demo Juniper Health",
    sector: "health-care",
    size: 240,
    city: "Boston",
    country: "United States",
    description: "Fictional healthcare group for CRM testing.",
    owner: "abdullah@gmail.com",
  },
  {
    key: "harborlane",
    name: "Demo Harborlane Logistics",
    sector: "industrials",
    size: 38,
    city: "Karachi",
    country: "Pakistan",
    description: "Fictional logistics operator for CRM testing.",
    owner: "huzaifa@gmail.com",
  },
  {
    key: "quarry",
    name: "Demo Quarry Analytics",
    sector: "information-technology",
    size: 112,
    city: "Lahore",
    country: "Pakistan",
    description: "Fictional analytics provider for CRM testing.",
    owner: "hussain@gmail.com",
  },
];

const contacts = [
  {
    first_name: "Ava",
    last_name: "Chen",
    title: "Chief Operating Officer",
    email: "demo.ava.chen@example.com",
    phone: "+1 202-555-0101",
    company: "northstar",
    owner: "rafay@gmail.com",
    status: "hot",
    tag: "Demo - Priority",
    color: "#bc5b4b",
  },
  {
    first_name: "Noah",
    last_name: "Patel",
    title: "Operations Director",
    email: "demo.noah.patel@example.com",
    phone: "+1 202-555-0102",
    company: "northstar",
    owner: "rafay@gmail.com",
    status: "warm",
    tag: "Demo - Enterprise",
    color: "#4778a8",
  },
  {
    first_name: "Mina",
    last_name: "Rahman",
    title: "Technology Lead",
    email: "demo.mina.rahman@example.com",
    phone: "+1 202-555-0103",
    company: "juniper",
    owner: "abdullah@gmail.com",
    status: "warm",
    tag: "Demo - Follow-up",
    color: "#43836e",
  },
  {
    first_name: "Elliot",
    last_name: "Brooks",
    title: "Finance Manager",
    email: "demo.elliot.brooks@example.com",
    phone: "+1 202-555-0104",
    company: "juniper",
    owner: "abdullah@gmail.com",
    status: "cold",
    tag: "Demo - Enterprise",
    color: "#74658d",
  },
  {
    first_name: "Sofia",
    last_name: "Almeida",
    title: "Procurement Manager",
    email: "demo.sofia.almeida@example.com",
    phone: "+92 21 5550 0105",
    company: "harborlane",
    owner: "huzaifa@gmail.com",
    status: "warm",
    tag: "Demo - Follow-up",
    color: "#b17b38",
  },
  {
    first_name: "Luca",
    last_name: "Moretti",
    title: "Chief Executive Officer",
    email: "demo.luca.moretti@example.com",
    phone: "+92 42 5550 0106",
    company: "quarry",
    owner: "hussain@gmail.com",
    status: "hot",
    tag: "Demo - Priority",
    color: "#477d80",
  },
];

const tags = [
  { name: "Demo - Priority", color: "#bc5b4b" },
  { name: "Demo - Enterprise", color: "#4778a8" },
  { name: "Demo - Follow-up", color: "#43836e" },
];

const deals = [
  {
    name: "Demo - Northstar automation rollout",
    company: "northstar",
    contact: "demo.ava.chen@example.com",
    owner: "rafay@gmail.com",
    category: "other",
    stage: "proposal-sent",
    amount: 4200000,
    closingDays: 24,
    description: "Fictional warehouse automation opportunity.",
  },
  {
    name: "Demo - Juniper patient portal",
    company: "juniper",
    contact: "demo.mina.rahman@example.com",
    owner: "abdullah@gmail.com",
    category: "website-design",
    stage: "in-negociation",
    amount: 1850000,
    closingDays: 38,
    description: "Fictional patient portal redesign opportunity.",
  },
  {
    name: "Demo - Harborlane fleet dashboard",
    company: "harborlane",
    contact: "demo.sofia.almeida@example.com",
    owner: "huzaifa@gmail.com",
    category: "ui-design",
    stage: "opportunity",
    amount: 975000,
    closingDays: 52,
    description: "Fictional logistics dashboard opportunity.",
  },
  {
    name: "Demo - Quarry data services",
    company: "quarry",
    contact: "demo.luca.moretti@example.com",
    owner: "hussain@gmail.com",
    category: "copywriting",
    stage: "won",
    amount: 620000,
    closingDays: -5,
    description: "Fictional analytics onboarding deal marked won.",
  },
];

const taskTemplates = [
  { text: "Demo - Send proposal", type: "email", dueDays: 2 },
  { text: "Demo - Schedule discovery call", type: "call", dueDays: 3 },
  { text: "Demo - Prepare product walkthrough", type: "demo", dueDays: 5 },
  { text: "Demo - Confirm project requirements", type: "follow-up", dueDays: 7 },
  { text: "Demo - Review service agreement", type: "meeting", dueDays: 9 },
  { text: "Demo - Send onboarding summary", type: "thank-you", dueDays: -1, done: true },
];

const leads = [
  {
    first_name: "Iris",
    last_name: "Walker",
    company_name: "Demo Solstice Manufacturing",
    email: "demo.iris.walker@example.com",
    phone: "+1 202-555-0111",
    source: "Website",
    status: "new",
    notes: "Fictional lead created for CRM testing.",
  },
  {
    first_name: "Zain",
    last_name: "Malik",
    company_name: "Demo Crescent Retail",
    email: "demo.zain.malik@example.com",
    phone: "+92 21 5550 0112",
    source: "Referral",
    status: "contacted",
    notes: "Fictional lead created for CRM testing.",
  },
  {
    first_name: "Nora",
    last_name: "Kim",
    company_name: "Demo Summit Learning",
    email: "demo.nora.kim@example.com",
    phone: "+1 202-555-0113",
    source: "Event",
    status: "qualified",
    notes: "Fictional lead created for CRM testing.",
  },
];

function demoAvatar(initials, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="${color}"/><text x="48" y="54" fill="#fff" font-family="sans-serif" font-size="28" font-weight="600" text-anchor="middle">${initials}</text></svg>`;
  return {
    src: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    title: "Demo avatar",
  };
}

async function signIn(email) {
  const client = createClient(projectUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Test account sign-in failed for ${email}: ${error.message}`);
  return client;
}

async function ensureRow(client, table, match, record) {
  const { data: existing, error: lookupError } = await client
    .from(table)
    .select("id")
    .match(match)
    .limit(1)
    .maybeSingle();
  if (lookupError) throw new Error(`Could not check ${table}: ${lookupError.message}`);
  if (existing) return { id: existing.id, created: false };

  const { data, error: insertError } = await client
    .from(table)
    .insert(record)
    .select("id")
    .single();
  if (insertError) throw new Error(`Could not seed ${table}: ${insertError.message}`);
  return { id: data.id, created: true };
}

function dateFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

async function main() {
  if (!projectUrl || !publishableKey || !password) {
    throw new Error(
      "Set VITE_SUPABASE_URL, VITE_SB_PUBLISHABLE_KEY, and SUPABASE_TEST_ACCOUNT_PASSWORD.",
    );
  }

  const admin = await signIn("admin@gmail.com");
  const { data: sales, error: salesError } = await admin
    .from("sales")
    .select("id, user_id, email, role")
    .in("email", accountEmails);
  if (salesError) throw new Error(`Could not load test users: ${salesError.message}`);

  const salesByEmail = new Map(sales.map((sale) => [sale.email, sale]));
  if (salesByEmail.size !== accountEmails.length) {
    throw new Error("Expected all six test users before creating demo data.");
  }
  if (salesByEmail.get("admin@gmail.com")?.role !== "super_admin") {
    throw new Error("The seed account must have the super_admin role.");
  }

  const created = {};
  const track = (table, wasCreated) => {
    created[table] = (created[table] ?? 0) + Number(wasCreated);
  };
  const tagIds = new Map();
  for (const tag of tags) {
    const result = await ensureRow(admin, "tags", { name: tag.name }, tag);
    tagIds.set(tag.name, result.id);
    track("tags", result.created);
  }

  const companyIds = new Map();
  for (const company of companies) {
    const { key, owner, ...record } = company;
    const result = await ensureRow(
      admin,
      "companies",
      { name: record.name },
      { ...record, sales_id: salesByEmail.get(owner).id },
    );
    companyIds.set(key, result.id);
    track("companies", result.created);
  }

  const contactIds = new Map();
  for (const contact of contacts) {
    const {
      email,
      phone,
      company,
      owner,
      tag,
      color,
      ...identity
    } = contact;
    const companyId = companyIds.get(company);
    const result = await ensureRow(
      admin,
      "contacts",
      {
        first_name: identity.first_name,
        last_name: identity.last_name,
        company_id: companyId,
      },
      {
        ...identity,
        gender: "unknown",
        email_jsonb: [{ email, type: "Work" }],
        phone_jsonb: [{ number: phone, type: "Work" }],
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        has_newsletter: false,
        tags: [tagIds.get(tag)],
        company_id: companyId,
        sales_id: salesByEmail.get(owner).id,
        avatar: demoAvatar(`${identity.first_name[0]}${identity.last_name[0]}`, color),
      },
    );
    contactIds.set(email, result.id);
    track("contacts", result.created);
  }

  for (const [index, deal] of deals.entries()) {
    const result = await ensureRow(
      admin,
      "deals",
      { name: deal.name },
      {
        name: deal.name,
        company_id: companyIds.get(deal.company),
        contact_ids: [contactIds.get(deal.contact)],
        category: deal.category,
        stage: deal.stage,
        description: deal.description,
        amount: deal.amount,
        expected_closing_date: dateFromNow(deal.closingDays),
        sales_id: salesByEmail.get(deal.owner).id,
        index,
      },
    );
    track("deals", result.created);
  }

  for (const [index, template] of taskTemplates.entries()) {
    const contact = contacts[index];
    const contactId = contactIds.get(contact.email);
    const doneDate = template.done ? dateFromNow(-2) : null;
    const result = await ensureRow(
      admin,
      "tasks",
      { contact_id: contactId, text: template.text },
      {
        contact_id: contactId,
        type: template.type,
        text: template.text,
        due_date: dateFromNow(template.dueDays),
        done_date: doneDate,
        sales_id: salesByEmail.get(contact.owner).id,
      },
    );
    track("tasks", result.created);
  }

  for (const contact of contacts.slice(0, 3)) {
    const contactId = contactIds.get(contact.email);
    const noteText = `Demo note - ${contact.first_name} requested a follow-up.`;
    const result = await ensureRow(
      admin,
      "contact_notes",
      { contact_id: contactId, text: noteText },
      {
        contact_id: contactId,
        text: noteText,
        date: new Date().toISOString(),
        status: contact.status,
        sales_id: salesByEmail.get(contact.owner).id,
      },
    );
    track("contact_notes", result.created);
  }

  const asm = salesByEmail.get("abdullah@gmail.com");
  const bdo = salesByEmail.get("rafay@gmail.com");
  if (bdo.role !== "bdo") throw new Error("The assigned test user is not a BDO.");
  const asmClient = await signIn("abdullah@gmail.com");
  const { data: directReports, error: reportError } = await asmClient
    .from("sales")
    .select("id, user_id")
    .eq("user_id", bdo.user_id)
    .limit(1);
  if (reportError) throw new Error(`Could not verify the ASM team: ${reportError.message}`);
  if (directReports.length !== 1) {
    throw new Error("The BDO is not visible as a direct report of the ASM.");
  }

  for (const lead of leads) {
    const result = await ensureRow(
      asmClient,
      "leads",
      { email: lead.email },
      { ...lead, assigned_bdo_id: bdo.id },
    );
    track("leads", result.created);
  }

  console.log(JSON.stringify({ created, message: "Demo data is ready." }));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
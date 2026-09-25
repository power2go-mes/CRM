import { generateCompanies } from "./companies";
import { generateContactNotes } from "./contactNotes";
import { generateContacts } from "./contacts";
import { generateDealNotes } from "./dealNotes";
import { generateDeals } from "./deals";
import { finalize } from "./finalize";
import { generateSales } from "./sales";
import { generateTags } from "./tags";
import { generateTasks } from "./tasks";
import type { Db } from "./types";

export default (): Db => {
  const db = {} as Db;
  db.regions = [
    { id: 1, name: "South", code: "SOUTH", description: "Southern sales region", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_count: 8, rsm_count: 1, ssm_count: 1, asm_count: 1, bdo_count: 5 },
    { id: 2, name: "North", code: "NORTH", description: "Northern sales region", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_count: 3, rsm_count: 1, ssm_count: 1, asm_count: 1, bdo_count: 0 },
    { id: 3, name: "Central", code: "CENTRAL", description: "Central sales region", is_active: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_count: 0, rsm_count: 0, ssm_count: 0, asm_count: 0, bdo_count: 0 },
  ];
  db.sales = generateSales(db);
  db.tags = generateTags(db);
  db.companies = generateCompanies(db);
  db.contacts = generateContacts(db);
  db.contact_notes = generateContactNotes(db);
  db.deals = generateDeals(db);
  db.deal_notes = generateDealNotes(db);
  db.tasks = generateTasks(db);
  db.configuration = [
    {
      id: 1,
      config: {} as Db["configuration"][number]["config"],
    },
  ];
  finalize(db);

  return db;
};

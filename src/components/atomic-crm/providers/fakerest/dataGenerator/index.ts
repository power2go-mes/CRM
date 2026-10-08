import { finalize } from "./finalize";
import { generateSales } from "./sales";
import type { Db } from "./types";

export default (): Db => {
  const db = {} as Db;
  db.regions = [
    {
      id: 1,
      name: "South",
      code: "SOUTH",
      description: "Southern sales region",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_count: 8,
      rsm_count: 1,
      ssm_count: 1,
      asm_count: 1,
      bdo_count: 5,
    },
    {
      id: 2,
      name: "North",
      code: "NORTH",
      description: "Northern sales region",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_count: 3,
      rsm_count: 1,
      ssm_count: 1,
      asm_count: 1,
      bdo_count: 0,
    },
    {
      id: 3,
      name: "Central",
      code: "CENTRAL",
      description: "Central sales region",
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_count: 0,
      rsm_count: 0,
      ssm_count: 0,
      asm_count: 0,
      bdo_count: 0,
    },
  ];
  db.sales = generateSales(db);
  db.tags = [];
  db.companies = [];
  db.contacts = [];
  db.contact_notes = [];
  db.deals = [];
  db.deal_notes = [];
  db.tasks = [];
  db.configuration = [
    {
      id: 1,
      config: {} as Db["configuration"][number]["config"],
    },
  ];
  finalize(db);

  return db;
};

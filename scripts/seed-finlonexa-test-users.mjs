import { createClient } from "@supabase/supabase-js";

const accounts = [
  {
    email: "admin@gmail.com",
    first_name: "Demo",
    last_name: "Founder",
    role: "super_admin",
    designation: "CEO & Founder",
  },
  {
    email: "izharali2a@gmail.com",
    first_name: "Demo",
    last_name: "Sales Director",
    role: "head_of_sales",
    designation: "Head of sales",
    manager: "admin@gmail.com",
  },
  {
    email: "hussain@gmail.com",
    first_name: "Demo",
    last_name: "Regional Lead",
    role: "rsm",
    designation: "RSM",
    manager: "izharali2a@gmail.com",
  },
  {
    email: "huzaifa@gmail.com",
    first_name: "Demo",
    last_name: "Team Supervisor",
    role: "ssm",
    designation: "SSM",
    manager: "hussain@gmail.com",
  },
  {
    email: "abdullah@gmail.com",
    first_name: "Demo",
    last_name: "Account Manager",
    role: "asm",
    designation: "ASM",
    manager: "huzaifa@gmail.com",
  },
  {
    email: "rafay@gmail.com",
    first_name: "Demo",
    last_name: "Business Rep",
    role: "bdo",
    designation: "BDO",
    manager: "abdullah@gmail.com",
  },
];

const regionalRoles = new Set(["rsm", "ssm", "asm", "bdo"]);
const approvedTestProjectRef = "aoohfgnidpstlubmuzko";

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

function readSecret(prompt) {
  const { stdin, stdout } = process;
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Run this script in an interactive terminal for hidden input.");
  }

  return new Promise((resolve, reject) => {
    let value = "";
    let finished = false;

    const finish = (error) => {
      if (finished) return;
      finished = true;
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };

    const onData = (chunk) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") {
          finish(new Error("Input cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += character;
      }
    };

    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

async function listUsers(supabase) {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) return users;
    page += 1;
  }
}

async function getTestRegion(supabase) {
  const { data: existingRegion, error: lookupError } = await supabase
    .from("regions")
    .select("id, name")
    .eq("code", "TEST")
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existingRegion) {
    if (existingRegion.name !== "Test Region") {
      throw new Error('Region code "TEST" already belongs to another region.');
    }
    return existingRegion.id;
  }

  const { data: newRegion, error: insertError } = await supabase
    .from("regions")
    .insert({ name: "Test Region", code: "TEST" })
    .select("id")
    .single();
  if (insertError) throw insertError;
  return newRegion.id;
}

async function verifySchema(supabase) {
  const checks = [
    () => supabase.from("init_state").select("is_initialized").limit(0),
    () => supabase.from("regions").select("id").limit(0),
    () =>
      supabase
        .from("sales")
        .select("role, designation, reports_to_user_id, region_id")
        .limit(0),
    () => supabase.from("leads").select("assigned_bdo_id").limit(0),
  ];

  for (const check of checks) {
    let result;
    try {
      result = await check();
    } catch (error) {
      const detail = error.cause?.code ?? error.message;
      throw new Error(`CRM schema preflight request failed: ${detail}`);
    }
    const { error } = result;
    if (error) {
      throw new Error(
        `CRM schema is not ready; apply the migrations before seeding users. ${error.message}`,
      );
    }
  }
}

async function createOrUpdateUser(
  supabase,
  account,
  existingUser,
  metadata,
  password,
) {
  if (existingUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { password, email_confirm: true, user_metadata: metadata },
    );
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw error;
  return data.user;
}

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const projectRef = argumentValue("--project-ref");
  const confirmationProvided = process.argv.includes("--confirm-test-project");
  if (!supabaseUrl || !projectRef || !confirmationProvided) {
    throw new Error(
      "Set VITE_SUPABASE_URL and pass --project-ref <ref> --confirm-test-project.",
    );
  }

  const projectUrl = new URL(supabaseUrl);
  if (
    projectUrl.protocol !== "https:" ||
    projectUrl.hostname !== `${projectRef}.supabase.co` ||
    projectRef !== approvedTestProjectRef
  ) {
    throw new Error("The URL and ref must match the approved HTTPS test project.");
  }

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    (await readSecret("Supabase service-role key (hidden): "));
  const password =
    process.env.SUPABASE_TEST_ACCOUNT_PASSWORD ??
    (await readSecret("Shared test-account password (hidden): "));
  if (!serviceRoleKey || !password) {
    throw new Error("Both hidden inputs are required.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await verifySchema(supabase);
  if (process.argv.includes("--check-only")) {
    console.log(`CRM schema is ready in project ${projectRef}.`);
    return;
  }

  const regionId = await getTestRegion(supabase);
  const existingUsers = await listUsers(supabase);
  const usersByEmail = new Map(
    existingUsers.map((user) => [user.email?.toLowerCase(), user]),
  );
  const userIds = new Map();

  for (const account of accounts) {
    const managerId = account.manager ? userIds.get(account.manager) : null;
    if (account.manager && !managerId) {
      throw new Error(`Manager was not created before ${account.email}.`);
    }

    const regionIdForUser = regionalRoles.has(account.role) ? regionId : null;
    const metadata = {
      first_name: account.first_name,
      last_name: account.last_name,
      role: account.role,
      designation: account.designation,
      reports_to_user_id: managerId,
      region_id: regionIdForUser,
      region: regionIdForUser ? "Test Region" : null,
    };
    const existingUser = usersByEmail.get(account.email);
    const user = await createOrUpdateUser(
      supabase,
      account,
      existingUser,
      metadata,
      password,
    );
    if (!user) throw new Error(`Supabase returned no user for ${account.email}.`);
    userIds.set(account.email, user.id);

    const { data: salesRow, error: salesError } = await supabase
      .from("sales")
      .update({
        first_name: account.first_name,
        last_name: account.last_name,
        role: account.role,
        designation: account.designation,
        administrator: account.role === "super_admin",
        reports_to_user_id: managerId,
        region_id: regionIdForUser,
        region: regionIdForUser ? "Test Region" : null,
        disabled: false,
      })
      .eq("user_id", user.id)
      .select("user_id")
      .single();
    if (salesError) throw salesError;
    if (!salesRow) throw new Error(`No sales row exists for ${account.email}.`);

    console.log(
      `${existingUser ? "Updated" : "Created"} ${account.email} (${account.role})`,
    );
  }

  console.log(`Test users provisioned in project ${projectRef}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders, OptionsMiddleware } from "../_shared/cors.ts";
import { createErrorResponse } from "../_shared/utils.ts";
import { AuthMiddleware, UserMiddleware } from "../_shared/authentication.ts";
import { getUserSale } from "../_shared/getUserSale.ts";

const ROLES = [
  "super_admin",
  "head_of_sales",
  "rsm",
  "ssm",
  "asm",
  "bdo",
] as const;

type Role = (typeof ROLES)[number];

const isRole = (value: unknown): value is Role =>
  typeof value === "string" && ROLES.includes(value as Role);

async function createUser(req: Request, currentUserSale: Record<string, any>) {
  if (currentUserSale.role !== "super_admin") {
    return createErrorResponse(403, "Only Super Admin can create users");
  }

  const body = await req.json();
  const {
    email,
    password,
    first_name,
    last_name,
    designation,
    role,
    reports_to_user_id,
    region_id,
    region,
    area,
    disabled = false,
  } = body;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof first_name !== "string" ||
    typeof last_name !== "string" ||
    !email.trim() ||
    !first_name.trim() ||
    !last_name.trim() ||
    !isRole(role)
  ) {
    return createErrorResponse(400, "Invalid user payload");
  }

  if (password.length < 6) {
    return createErrorResponse(400, "Password must be at least 6 characters");
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      designation: typeof designation === "string" ? designation.trim() || null : null,
      role,
      reports_to_user_id: reports_to_user_id || null,
      region_id: region_id || null,
      region: typeof region === "string" ? region.trim() || null : null,
      area: typeof area === "string" ? area.trim() || null : null,
    },
  });

  if (error || !data.user) {
    return createErrorResponse(error?.status ?? 500, error?.message ?? "Failed to invite user");
  }

  const { data: sale, error: saleError } = await supabaseAdmin
    .from("sales")
    .update({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      designation: typeof designation === "string" ? designation.trim() || null : null,
      role,
      reports_to_user_id: reports_to_user_id || null,
      region_id: region_id || null,
      region: typeof region === "string" ? region.trim() || null : null,
      area: typeof area === "string" ? area.trim() || null : null,
      disabled: Boolean(disabled),
      administrator: role === "super_admin",
    })
    .eq("user_id", data.user.id)
    .select(
      "id, user_id, first_name, last_name, email, designation, role, reports_to_user_id, region_id, region, area, disabled",
    )
    .single();

  if (saleError || !sale) {
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    return createErrorResponse(400, saleError?.message ?? "Failed to configure user");
  }

  return new Response(JSON.stringify({ data: sale }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve((req: Request) =>
  OptionsMiddleware(req, (req) =>
    AuthMiddleware(req, (req) =>
      UserMiddleware(req, async (req, user) => {
        if (req.method !== "POST") {
          return createErrorResponse(405, "Method Not Allowed");
        }

        const currentUserSale = await getUserSale(user!);
        if (!currentUserSale) return createErrorResponse(401, "Unauthorized");

        try {
          return await createUser(req, currentUserSale);
        } catch (error) {
          console.error("Unhandled error in admin-create-user:", error);
          return createErrorResponse(
            (error as { status?: number }).status ?? 500,
            error instanceof Error ? error.message : "Internal Server Error",
          );
        }
      }),
    ),
  ),
);

import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import type { StaffRole } from "@/lib/types";

export async function getAuthorizedStaff(
  request: NextRequest,
  allowedRoles: StaffRole[],
): Promise<{ userId: string } | Response> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) {
    return Response.json({ error: "Sign in with an authorized staff account." }, { status: 401 });
  }

  const authClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !userData.user) {
    return Response.json({ error: "Your session is invalid or has expired." }, { status: 401 });
  }

  const { data: role, error: roleError } = await getAdminClient()
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (roleError) {
    return Response.json({ error: "Could not verify staff access." }, { status: 500 });
  }
  if (!role || !allowedRoles.includes(role.role as StaffRole)) {
    return Response.json({ error: "You do not have permission to do that." }, { status: 403 });
  }
  return { userId: userData.user.id };
}

export function isErrorResponse(
  result: { userId: string } | Response,
): result is Response {
  return result instanceof Response;
}

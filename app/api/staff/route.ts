import { NextRequest } from "next/server";
import { getAuthorizedStaff, isErrorResponse } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const staff = await getAuthorizedStaff(request, ["admin", "judge"]);
  if (isErrorResponse(staff)) return staff;
  const { data, error } = await getAdminClient()
    .from("user_roles")
    .select("role")
    .eq("user_id", staff.userId)
    .single();
  if (error) {
    console.error("GET /api/staff failed:", error);
    return Response.json({ error: "Could not load staff profile." }, { status: 500 });
  }
  return Response.json({ role: data.role });
}

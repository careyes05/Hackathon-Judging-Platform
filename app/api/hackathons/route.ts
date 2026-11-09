import { NextRequest } from "next/server";
import { getAuthorizedStaff, isErrorResponse } from "@/lib/auth";
import { getHackathons } from "@/lib/hackathons";
import { getAdminClient } from "@/lib/supabase/admin";
import { isValidRubric } from "@/lib/rubric";

export async function GET() {
  try {
    return Response.json(await getHackathons());
  } catch (error) {
    console.error("GET /api/hackathons failed:", error);
    return Response.json({ error: "Could not load hackathons." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const staff = await getAuthorizedStaff(request, ["admin"]);
  if (isErrorResponse(staff)) return staff;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send valid JSON." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const eventDate = typeof body.event_date === "string" ? body.event_date : null;
  const themes = Array.isArray(body.themes)
    ? body.themes.filter((theme): theme is string => typeof theme === "string").map((theme) => theme.trim()).filter(Boolean)
    : [];
  const rubric = body.rubric;

  if (name.length < 3 || name.length > 100) {
    return Response.json({ error: "Event name must be 3–100 characters." }, { status: 400 });
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) {
    return Response.json({ error: "Use a URL-friendly slug (lowercase letters, numbers, and hyphens)." }, { status: 400 });
  }
  if (description.length < 20 || description.length > 2000) {
    return Response.json({ error: "Event description must be 20–2,000 characters." }, { status: 400 });
  }
  if (themes.length > 10 || themes.some((theme) => theme.length > 80)) {
    return Response.json({ error: "Add at most 10 themes, each no longer than 80 characters." }, { status: 400 });
  }
  if (!isValidRubric(rubric)) {
    return Response.json({ error: "Provide 1–8 rubric categories, each scored from 1 to 10." }, { status: 400 });
  }
  if (eventDate && Number.isNaN(Date.parse(eventDate))) {
    return Response.json({ error: "Event date is invalid." }, { status: 400 });
  }

  const { data, error } = await getAdminClient()
    .from("hackathons")
    .insert({
      name,
      slug,
      description,
      location: location || null,
      event_date: eventDate || null,
      themes,
      rubric,
      created_by: staff.userId,
    })
    .select("id, name, slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "That event URL is already in use." }, { status: 409 });
    }
    console.error("POST /api/hackathons failed:", error);
    return Response.json({ error: "Could not create this hackathon." }, { status: 500 });
  }
  return Response.json({ hackathon: data }, { status: 201 });
}

import { NextRequest } from "next/server";
import { getAuthorizedStaff, isErrorResponse } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { aggregateResults, type JudgmentRecord } from "@/lib/results";
import type { RubricCategory } from "@/lib/types";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * Organizer-only results. The judging route deliberately scopes judgments to
 * the signed-in judge; this one aggregates every judge's scores for an event
 * so an admin can rank teams and export the record.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const staff = await getAuthorizedStaff(request, ["admin"]);
  if (isErrorResponse(staff)) return staff;
  const { slug } = await context.params;
  const supabase = getAdminClient();

  const { data: event, error: eventError } = await supabase
    .from("hackathons")
    .select("id, name, slug, rubric")
    .eq("slug", slug)
    .maybeSingle();
  if (eventError) {
    console.error("Loading results event failed:", eventError);
    return Response.json({ error: "Could not load this event." }, { status: 500 });
  }
  if (!event) return Response.json({ error: "Hackathon not found." }, { status: 404 });

  const rubric = (event.rubric ?? []) as RubricCategory[];

  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("id, team_name, project_title")
    .eq("hackathon_id", event.id)
    .order("created_at", { ascending: true });
  if (submissionsError) {
    console.error("Loading results submissions failed:", submissionsError);
    return Response.json({ error: "Could not load submissions." }, { status: 500 });
  }

  const submissionIds = (submissions ?? []).map((submission) => submission.id);
  let judgments: JudgmentRecord[] = [];
  if (submissionIds.length > 0) {
    const { data, error } = await supabase
      .from("judgments")
      .select("submission_id, judge_id, scores, feedback")
      .in("submission_id", submissionIds);
    if (error) {
      console.error("Loading results judgments failed:", error);
      return Response.json({ error: "Could not load judge scores." }, { status: 500 });
    }
    judgments = (data ?? []) as JudgmentRecord[];
  }

  // Resolve judge ids to something an organizer recognizes in the table.
  const judgeLabels = new Map<string, string>();
  if (judgments.length > 0) {
    const { data: userList, error: userError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (userError) {
      console.error("Resolving judge accounts failed:", userError);
    } else {
      userList.users.forEach((user) => {
        if (user.email) judgeLabels.set(user.id, user.email);
      });
    }
  }

  const { rows, judges, totalPossible } = aggregateResults(
    rubric,
    submissions ?? [],
    judgments,
    (judgeId) => judgeLabels.get(judgeId) ?? `Judge ${judgeId.slice(0, 8)}`,
  );

  return Response.json({
    hackathon: { id: event.id, name: event.name, slug: event.slug, rubric },
    total_possible: totalPossible,
    team_count: rows.length,
    judges,
    rows,
  });
}

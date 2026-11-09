import { NextRequest } from "next/server";
import { getAuthorizedStaff, isErrorResponse } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { isValidRubric } from "@/lib/rubric";

type RouteContext = { params: Promise<{ slug: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const staff = await getAuthorizedStaff(request, ["admin"]);
  if (isErrorResponse(staff)) return staff;
  const { slug } = await context.params;

  let body: { rubric?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send valid JSON." }, { status: 400 });
  }
  if (!isValidRubric(body.rubric)) {
    return Response.json({ error: "Provide 1–8 valid rubric categories, each scored from 1 to 10." }, { status: 400 });
  }

  const { data, error } = await getAdminClient()
    .from("hackathons")
    .update({ rubric: body.rubric })
    .eq("slug", slug)
    .select("id, name, slug, description, event_date, location, themes, rubric, created_at")
    .maybeSingle();
  if (error) {
    console.error("Updating hackathon rubric failed:", error);
    return Response.json({ error: "Could not update this event's judging rubric." }, { status: 500 });
  }
  if (!data) return Response.json({ error: "Hackathon not found." }, { status: 404 });
  return Response.json({ hackathon: data });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const staff = await getAuthorizedStaff(request, ["admin", "judge"]);
  if (isErrorResponse(staff)) return staff;
  const { slug } = await context.params;
  const supabase = getAdminClient();
  const { data: event, error: eventError } = await supabase
    .from("hackathons")
    .select("id, name, slug, description, event_date, location, themes, rubric, created_at")
    .eq("slug", slug)
    .maybeSingle();
  if (eventError) {
    console.error("Loading judging event failed:", eventError);
    return Response.json({ error: "Could not load this event." }, { status: 500 });
  }
  if (!event) return Response.json({ error: "Hackathon not found." }, { status: 404 });

  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("id, team_name, project_title, description, repository_url, demo_url, file_name, file_path, updated_at")
    .eq("hackathon_id", event.id)
    .order("updated_at", { ascending: false });
  if (submissionsError) {
    console.error("Loading judging submissions failed:", submissionsError);
    return Response.json({ error: "Could not load submissions." }, { status: 500 });
  }

  const ids = (submissions ?? []).map((submission) => submission.id);
  let judgments: Array<{ id: string; submission_id: string; scores: Record<string, number>; feedback: string; updated_at: string }> = [];
  if (ids.length > 0) {
    const { data, error } = await supabase
      .from("judgments")
      .select("id, submission_id, scores, feedback, updated_at")
      .eq("judge_id", staff.userId)
      .in("submission_id", ids);
    if (error) {
      console.error("Loading judge scores failed:", error);
      return Response.json({ error: "Could not load your saved scores." }, { status: 500 });
    }
    judgments = data ?? [];
  }

  const judged = new Map(judgments.map((judgment) => [judgment.submission_id, judgment]));
  const withFiles = await Promise.all(
    (submissions ?? []).map(async (submission) => {
      let fileUrl: string | null = null;
      if (submission.file_path) {
        const { data, error } = await supabase.storage
          .from("hackathon-submissions")
          .createSignedUrl(submission.file_path, 60 * 15);
        if (error) {
          console.error("Creating submission download link failed:", error);
          return null;
        }
        fileUrl = data.signedUrl;
      }
      return {
        id: submission.id,
        team_name: submission.team_name,
        project_title: submission.project_title,
        description: submission.description,
        repository_url: submission.repository_url,
        demo_url: submission.demo_url,
        file_name: submission.file_name,
        updated_at: submission.updated_at,
        file_url: fileUrl,
        judgment: judged.get(submission.id) ?? null,
      };
    }),
  );
  if (withFiles.some((submission) => submission === null)) {
    return Response.json({ error: "Could not prepare submission files for judging." }, { status: 500 });
  }
  return Response.json({ hackathon: event, submissions: withFiles });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const staff = await getAuthorizedStaff(request, ["admin", "judge"]);
  if (isErrorResponse(staff)) return staff;
  const { slug } = await context.params;
  let body: { submission_id?: unknown; scores?: unknown; feedback?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send valid JSON." }, { status: 400 });
  }
  if (typeof body.submission_id !== "string" || !body.scores || typeof body.scores !== "object" || Array.isArray(body.scores)) {
    return Response.json({ error: "Select a submission and provide rubric scores." }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data: event, error: eventError } = await supabase
    .from("hackathons")
    .select("id, rubric")
    .eq("slug", slug)
    .maybeSingle();
  if (eventError || !event) {
    return Response.json({ error: eventError ? "Could not verify this hackathon." : "Hackathon not found." }, { status: eventError ? 500 : 404 });
  }
  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select("id")
    .eq("id", body.submission_id)
    .eq("hackathon_id", event.id)
    .maybeSingle();
  if (submissionError || !submission) {
    return Response.json({ error: submissionError ? "Could not verify this submission." : "Submission not found for this event." }, { status: submissionError ? 500 : 404 });
  }

  const rawScores = body.scores as Record<string, unknown>;
  const rubric = event.rubric as Array<{ id: string; maxScore: number }>;
  const scores: Record<string, number> = {};
  for (const category of rubric) {
    const score = rawScores[category.id];
    if (typeof score !== "number" || !Number.isInteger(score) || score < 0 || score > category.maxScore) {
      return Response.json({ error: `Enter a whole-number score from 0 to ${category.maxScore} for every rubric category.` }, { status: 400 });
    }
    scores[category.id] = score;
  }
  if (Object.keys(rawScores).length !== rubric.length) {
    return Response.json({ error: "Scores must match the event rubric." }, { status: 400 });
  }
  const feedback = typeof body.feedback === "string" ? body.feedback.trim() : "";
  if (feedback.length > 3000) {
    return Response.json({ error: "Feedback must be no longer than 3,000 characters." }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("judgments")
    .upsert(
      { submission_id: submission.id, judge_id: staff.userId, scores, feedback },
      { onConflict: "submission_id,judge_id" },
    )
    .select("id, scores, feedback, updated_at")
    .single();
  if (error) {
    console.error("Saving judgment failed:", error);
    return Response.json({ error: "Could not save this judgment." }, { status: 500 });
  }
  return Response.json({ judgment: data });
}

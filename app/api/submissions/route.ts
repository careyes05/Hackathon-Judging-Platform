import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getAdminClient } from "@/lib/supabase/admin";
import type { Submission } from "@/lib/types";

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const STORAGE_BUCKET = "hackathon-submissions";

function hashAccessCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function validHttpUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Could not read the submission form." }, { status: 400 });
  }

  const slug = String(form.get("slug") ?? "").trim();
  const teamName = String(form.get("team_name") ?? "").trim();
  const projectTitle = String(form.get("project_title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const repositoryUrl = String(form.get("repository_url") ?? "").trim();
  const demoUrl = String(form.get("demo_url") ?? "").trim();
  const accessCode = String(form.get("access_code") ?? "").trim();
  const submittedFile = form.get("file");

  if (!slug || teamName.length < 2 || teamName.length > 100) {
    return Response.json({ error: "Enter a team name between 2 and 100 characters." }, { status: 400 });
  }
  if (projectTitle.length < 2 || projectTitle.length > 140) {
    return Response.json({ error: "Project title must be between 2 and 140 characters." }, { status: 400 });
  }
  if (description.length > 3000) {
    return Response.json({ error: "Project description must be no longer than 3,000 characters." }, { status: 400 });
  }
  if (!validHttpUrl(repositoryUrl) || !validHttpUrl(demoUrl)) {
    return Response.json({ error: "Project links must use http or https." }, { status: 400 });
  }
  if (submittedFile instanceof File && submittedFile.size > MAX_FILE_BYTES) {
    return Response.json({ error: "Uploads must be 4 MB or smaller." }, { status: 413 });
  }
  if (submittedFile instanceof File && submittedFile.size > 0 && !submittedFile.name) {
    return Response.json({ error: "The uploaded file needs a name." }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data: hackathon, error: eventError } = await supabase
    .from("hackathons")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (eventError) {
    console.error("Looking up hackathon for submission failed:", eventError);
    return Response.json({ error: "Could not verify this hackathon." }, { status: 500 });
  }
  if (!hackathon) return Response.json({ error: "Hackathon not found." }, { status: 404 });

  const { data: existingRows, error: teamError } = await supabase
    .from("submissions")
    .select("id, team_name, access_code_hash, file_path, file_name")
    .eq("hackathon_id", hackathon.id);
  if (teamError) {
    console.error("Looking up team submission failed:", teamError);
    return Response.json({ error: "Could not load this team's submission." }, { status: 500 });
  }

  const existing = (existingRows ?? []).find(
    (row) => row.team_name.toLocaleLowerCase() === teamName.toLocaleLowerCase(),
  );
  const isNew = !existing;
  if (existing) {
    const providedHash = Buffer.from(hashAccessCode(accessCode || ""), "hex");
    const storedHash = Buffer.from(existing.access_code_hash, "hex");
    if (providedHash.length !== storedHash.length || !timingSafeEqual(providedHash, storedHash)) {
      return Response.json({ error: "That team name already has a submission. Enter its team edit code to update it." }, { status: 403 });
    }
  }
  if (!existing && accessCode) {
    return Response.json({ error: "No submission exists for this team yet. Clear the edit code to create one." }, { status: 400 });
  }

  const teamAccessCode = isNew ? randomBytes(18).toString("base64url") : null;
  const uploaded = submittedFile instanceof File && submittedFile.size > 0 ? submittedFile : null;
  let newFilePath: string | null = null;
  let newFileName: string | null = null;

  if (uploaded) {
    const safeName = uploaded.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "submission";
    newFilePath = `${hackathon.id}/${randomUUID()}-${safeName}`;
    newFileName = uploaded.name.slice(0, 200);
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(newFilePath, uploaded, {
        contentType: uploaded.type || "application/octet-stream",
        upsert: false,
      });
    if (uploadError) {
      console.error("Submission upload failed:", uploadError);
      const message = uploadError.message.toLowerCase().includes("bucket")
        ? "File storage is not configured. Please contact event staff."
        : "The file could not be uploaded. Please try again or contact event staff.";
      return Response.json({ error: message }, { status: 500 });
    }
  }

  const submissionData = {
    hackathon_id: hackathon.id,
    team_name: teamName,
    project_title: projectTitle,
    description,
    repository_url: repositoryUrl || null,
    demo_url: demoUrl || null,
    access_code_hash: teamAccessCode ? hashAccessCode(teamAccessCode) : existing!.access_code_hash,
    file_path: newFilePath ?? existing?.file_path ?? null,
    file_name: newFileName ?? existing?.file_name ?? null,
  };
  const query = existing
    ? supabase.from("submissions").update(submissionData).eq("id", existing.id)
    : supabase.from("submissions").insert(submissionData);
  const { data: saved, error: saveError } = await query
    .select("id, team_name, project_title, description, repository_url, demo_url, file_name, updated_at")
    .single();

  if (saveError) {
    if (newFilePath) await supabase.storage.from(STORAGE_BUCKET).remove([newFilePath]);
    console.error("Saving submission failed:", saveError);
    return Response.json({ error: "Could not save your submission." }, { status: 500 });
  }
  if (newFilePath && existing?.file_path) {
    const { error: removeError } = await supabase.storage.from(STORAGE_BUCKET).remove([existing.file_path]);
    if (removeError) console.error("Could not remove replaced submission file:", removeError);
  }

  return Response.json(
    { submission: saved as Submission, ...(teamAccessCode ? { team_access_code: teamAccessCode } : {}) },
    { status: isNew ? 201 : 200 },
  );
}

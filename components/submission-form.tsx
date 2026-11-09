"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight, Check, Copy, LockKeyhole, UploadCloud } from "lucide-react";

type Props = { slug: string; eventName: string };
type Result = {
  team_access_code?: string;
  submission?: { team_name: string; project_title: string; file_name: string | null };
};

const MAX_FILE_BYTES = 4 * 1024 * 1024;

export default function SubmissionForm({ slug, eventName }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    formData.set("slug", slug);
    try {
      const response = await fetch("/api/submissions", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your submission could not be saved.");
      setResult(data as Result);
      setSelectedFileName("");
      formElement.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your submission could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!result?.team_access_code) return;
    await navigator.clipboard.writeText(result.team_access_code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (result) {
    return (
      <div className="submit-success">
        <span className="success-check"><Check size={23} /></span>
        <span className="eyebrow muted-eyebrow">SUBMISSION SAVED</span>
        <h2>{result.team_access_code ? "You’re on the board." : "Your project is up to date."}</h2>
        <p><strong>{result.submission?.team_name}</strong> · {result.submission?.project_title} for {eventName}</p>
        {result.submission?.file_name && <p>Uploaded file: <strong>{result.submission.file_name}</strong></p>}
        {result.team_access_code && (
          <div className="code-card">
            <div className="code-card-heading"><LockKeyhole size={15} /><strong>Your team edit code</strong></div>
            <code>{result.team_access_code}</code>
            <p>This code is shown only once. Save it and share it with teammates so they can update the submission.</p>
            <button type="button" className="button button-dark" onClick={copyCode}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy edit code"}</button>
          </div>
        )}
        <button className="text-link submit-another" type="button" onClick={() => setResult(null)}>Return to submission form <ArrowUpRight size={15} /></button>
      </div>
    );
  }

  return (
    <form className="submission-form" onSubmit={submit}>
      <div className="form-section-label"><span>01</span> YOUR TEAM</div>
      <label className="field"><span>Team name <b>*</b></span><input name="team_name" required minLength={2} maxLength={100} placeholder="The name everyone knows you by" autoComplete="organization" /></label>
      <label className="field"><span>Team edit code <small>Leave blank for your first submission</small></span><input name="access_code" autoComplete="off" placeholder="Paste your saved team code to make an update" /></label>
      <div className="form-section-label form-section-spaced"><span>02</span> THE PROJECT</div>
      <label className="field"><span>Project title <b>*</b></span><input name="project_title" required minLength={2} maxLength={140} placeholder="What did your team create?" /></label>
      <label className="field"><span>What does it do?</span><textarea name="description" rows={4} maxLength={3000} placeholder="A short overview of the idea, who it helps, and how you built it." /></label>
      <div className="field-row">
        <label className="field"><span>Repository link <small>(optional)</small></span><input name="repository_url" type="url" placeholder="https://" /></label>
        <label className="field"><span>Demo link <small>(optional)</small></span><input name="demo_url" type="url" placeholder="https://" /></label>
      </div>
      <div className="form-section-label form-section-spaced"><span>03</span> SHARE YOUR WORK</div>
      <label className="upload-field">
        <UploadCloud size={22} />
        <strong>Attach a project file <span>(optional)</span></strong>
        <span>{selectedFileName || "PDF, slides, or other supporting material · 4 MB max"}</span>
        <input
          name="file"
          type="file"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file && file.size > MAX_FILE_BYTES) {
              event.currentTarget.value = "";
              setSelectedFileName("");
              setError("Uploads must be 4 MB or smaller.");
              return;
            }
            setSelectedFileName(file?.name ?? "");
            setError("");
          }}
        />
      </label>
      <p className="form-security"><LockKeyhole size={14} /> Your team edit code is private. Only judges can access uploaded files.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-dark submit-button" type="submit" disabled={busy}>{busy ? "Saving your project…" : "Submit your project"} {!busy && <ArrowUpRight size={16} />}</button>
      <p className="form-footnote">Already submitted? Use the same team name and your edit code to update your project.</p>
    </form>
  );
}

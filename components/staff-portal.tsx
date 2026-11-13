"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check, ExternalLink, LoaderCircle, LogOut, Plus, Save, ShieldCheck, Sparkles } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { DEFAULT_RUBRIC } from "@/lib/rubric";
import { siteConfig } from "@/lib/site-config";
import Logo from "@/components/logo";
import ResultsPanel from "@/components/results-panel";
import type { Hackathon, ResultsPayload, RubricCategory, StaffRole, Submission } from "@/lib/types";

type EventPayload = { hackathon: Hackathon; submissions: Submission[] };

function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function hasExpandedRubric(rubric: RubricCategory[]) {
  return rubric.length === DEFAULT_RUBRIC.length &&
    rubric.every((category, index) => category.id === DEFAULT_RUBRIC[index].id);
}

function getScoreTotal(rubric: RubricCategory[], scores: Record<string, number>) {
  return rubric.reduce((total, category) => total + (scores[category.id] ?? 0), 0);
}

function getScoredCategoryCount(rubric: RubricCategory[], scores: Record<string, number>) {
  return rubric.filter((category) => typeof scores[category.id] === "number").length;
}

function isJudgmentSaved(
  submission: Submission,
  rubric: RubricCategory[],
  scores: Record<string, number>,
  feedback: string,
) {
  return Boolean(
    submission.judgment &&
    rubric.every(
      (category) =>
        submission.judgment?.scores[category.id] === scores[category.id] &&
        typeof scores[category.id] === "number",
    ) &&
    submission.judgment.feedback === feedback,
  );
}

export default function StaffPortal() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const client = useMemo(() => configured ? getBrowserClient() : null, [configured]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [events, setEvents] = useState<Hackathon[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [eventData, setEventData] = useState<EventPayload | null>(null);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventName, setEventName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [themesText, setThemesText] = useState("");
  const [results, setResults] = useState<ResultsPayload | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);

  const loadStaff = useCallback(async (token: string) => {
    const response = await fetch("/api/staff", { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not verify staff access.");
    setRole(data.role as StaffRole);
    const eventResponse = await fetch("/api/hackathons");
    const eventPayload = await eventResponse.json();
    if (!eventResponse.ok) throw new Error(eventPayload.error || "Could not load events.");
    setEvents(eventPayload.hackathons as Hackathon[]);
  }, []);

  useEffect(() => {
    if (!client) return;
    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) {
        setError("Could not check your sign-in session.");
        return;
      }
      const current = data.session;
      if (current) {
        setSession({ access_token: current.access_token });
        void loadStaff(current.access_token).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load staff access."));
      }
    });
    const { data: subscription } = client.auth.onAuthStateChange((_event, current) => {
      setSession(current ? { access_token: current.access_token } : null);
      setRole(null);
      if (current) {
        void loadStaff(current.access_token).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load staff access."));
      } else {
        setEventData(null);
      }
    });
    return () => subscription.subscription.unsubscribe();
  }, [client, loadStaff]);

  useEffect(() => {
    setResults(null);
    setResultsOpen(false);
    if (!session || !selectedSlug) {
      setEventData(null);
      return;
    }
    const controller = new AbortController();
    setEventLoading(true);
    setError("");
    fetch(`/api/hackathons/${encodeURIComponent(selectedSlug)}/judging`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load judging submissions.");
        return data as EventPayload;
      })
      .then((data) => {
        setEventData(data);
        const scoreState: Record<string, Record<string, number>> = {};
        const feedbackState: Record<string, string> = {};
        data.submissions.forEach((submission) => {
          scoreState[submission.id] = submission.judgment?.scores ?? {};
          feedbackState[submission.id] = submission.judgment?.feedback ?? "";
        });
        setScores(scoreState);
        setFeedback(feedbackState);
      })
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name !== "AbortError") setError(reason.message);
      })
      .finally(() => setEventLoading(false));
    return () => controller.abort();
  }, [session, selectedSlug]);

  async function signInWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    setBusy(true);
    setError("");
    try {
      const { error: authError } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) setError(authError.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!client) return;
    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) setError(signOutError.message);
    setSession(null);
    setRole(null);
  }

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/hackathons", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
        body: JSON.stringify({
          name: eventName,
          slug,
          description,
          event_date: eventDate || null,
          location,
          themes: themesText.split(/\r?\n/).map((theme) => theme.trim()).filter(Boolean),
          rubric: DEFAULT_RUBRIC,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not create this event.");
      } else {
        setNotice("Your event page is live.");
        setEventName("");
        setSlug("");
        setDescription("");
        setEventDate("");
        setLocation("");
        setThemesText("");
        setSelectedSlug(data.hackathon.slug);
        await loadStaff(session.access_token);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create this event.");
    } finally {
      setBusy(false);
    }
  }

  async function saveJudgment(submission: Submission) {
    if (!session || !eventData) return;
    if (eventData.hackathon.rubric.some((category) => typeof scores[submission.id]?.[category.id] !== "number")) {
      setError("Score every rubric category before saving this judgment.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/hackathons/${encodeURIComponent(eventData.hackathon.slug)}/judging`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          submission_id: submission.id,
          scores: scores[submission.id] ?? {},
          feedback: feedback[submission.id] ?? "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not save this judgment.");
      } else {
        setNotice(`Judgment saved for ${submission.team_name}.`);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this judgment.");
    } finally {
      setBusy(false);
    }
  }

  async function applyExpandedRubric() {
    if (!session || !eventData || role !== "admin") return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/hackathons/${encodeURIComponent(eventData.hackathon.slug)}/judging`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: ["Bearer", session.access_token].join(" ") },
        body: JSON.stringify({ rubric: DEFAULT_RUBRIC }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update the judging rubric.");
      setEventData((current) => current ? { ...current, hackathon: data.hackathon } : current);
      setScores((current) => Object.fromEntries(
        eventData.submissions.map((submission) => [
          submission.id,
          Object.fromEntries(
            DEFAULT_RUBRIC
              .filter((category) => typeof current[submission.id]?.[category.id] === "number")
              .map((category) => [category.id, current[submission.id][category.id]]),
          ),
        ]),
      ));
      setNotice("Expanded judge-only rubric applied. Judges score each team independently.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update the judging rubric.");
    } finally {
      setBusy(false);
    }
  }

  const loadResults = useCallback(async () => {
    if (!session || !selectedSlug) return;
    setResultsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/hackathons/${encodeURIComponent(selectedSlug)}/results`,
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load results.");
      setResults(data as ResultsPayload);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load results.");
    } finally {
      setResultsLoading(false);
    }
  }, [session, selectedSlug]);

  function downloadCsv(filename: string, rows: string[][]) {
    const escapeCell = (value: string) =>
      /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
    const csv = rows.map((row) => row.map(escapeCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportScores() {
    if (!results) return;
    const rubric = results.hackathon.rubric;
    const header = [
      "Rank",
      "Team",
      "Project",
      `Mean total (of ${results.total_possible})`,
      "Judges scored",
      "Partial cards",
      ...rubric.map((category) => `${category.name} (mean of ${category.maxScore})`),
      ...results.judges.map((judge) => `${judge.label} total`),
    ];
    const body = results.rows.map((row, index) => [
      String(index + 1),
      row.team_name,
      row.project_title,
      row.mean_total === null ? "" : row.mean_total.toFixed(2),
      String(row.judge_count),
      String(row.partial_count),
      ...rubric.map((category) => {
        const value = row.category_means[category.id];
        return value === null || value === undefined ? "" : value.toFixed(2);
      }),
      ...results.judges.map((judge) => {
        const value = row.per_judge[judge.id];
        return typeof value === "number" ? String(value) : "";
      }),
    ]);
    downloadCsv(`${results.hackathon.slug}-scores.csv`, [header, ...body]);
  }

  function exportFeedback() {
    if (!results) return;
    const rows: string[][] = [["Team", "Project", "Judge", "Feedback"]];
    results.rows.forEach((row) => {
      row.feedback.forEach((note) => {
        rows.push([row.team_name, row.project_title, note.judge_label, note.text]);
      });
    });
    if (rows.length === 1) {
      setError("No written feedback has been saved yet.");
      return;
    }
    downloadCsv(`${results.hackathon.slug}-feedback.csv`, rows);
  }

  function updateScore(submissionId: string, categoryId: string, value: string) {
    setScores((current) => {
      const submissionScores = { ...current[submissionId] };
      if (value === "") delete submissionScores[categoryId];
      else submissionScores[categoryId] = Number(value);
      return { ...current, [submissionId]: submissionScores };
    });
  }

  if (!configured) {
    return <aside className="portal-card portal-setup"><span className="portal-icon"><Sparkles size={20} /></span><span className="eyebrow muted-eyebrow">ALMOST THERE</span><h2>Connect your event desk.</h2><p>Add your Supabase URL and anon key to the app environment to enable staff sign-in. Follow the setup guide in the README.</p></aside>;
  }

  if (!session) {
    return (
      <aside className="portal-card signin-card">
        {siteConfig.logos.staff ? <Logo slot={siteConfig.logos.staff} className="staff-logo" /> : null}
        <div className="portal-card-top"><span className="eyebrow muted-eyebrow">{siteConfig.staff.signInEyebrow}</span><span className="secure-tag"><ShieldCheck size={14} /> {siteConfig.staff.signInBadge}</span></div>
        <h2>{siteConfig.staff.signInHeadingTop}<br /><em>{siteConfig.staff.signInHeadingBottom}</em></h2>
        <p>{siteConfig.staff.signInBody}</p>
        <form onSubmit={signInWithPassword} className="signin-form">
          <label className="field"><span>Work email</span><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@yourteam.com" /></label>
          <label className="field"><span>Password</span><input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your account password" /></label>
          <button className="button button-dark" disabled={busy}>{busy ? "Signing in…" : "Sign in"} <ShieldCheck size={15} /></button>
        </form>
        {error && <p className="form-error" role="alert">{error}</p>}
        <p className="signin-footnote">{siteConfig.staff.signInFootnote}</p>
      </aside>
    );
  }

  return (
    <div className="portal-card staff-dashboard">
      <div className="dashboard-top"><div><span className="eyebrow muted-eyebrow">{siteConfig.staff.workspaceEyebrow}</span><h2>{role === "admin" ? siteConfig.staff.adminHeading : siteConfig.staff.judgeHeading}</h2><span className="role-pill">{role === "admin" ? "ORGANIZER" : role === "judge" ? "JUDGE" : "CHECKING ACCESS"}</span></div><button type="button" className="icon-button" onClick={signOut} aria-label="Sign out"><LogOut size={17} /></button></div>
      {role === "admin" && (
        <details className="create-event">
          <summary><span><Plus size={16} /> Create a hackathon page</span><ArrowDown size={16} /></summary>
          <form onSubmit={createEvent}>
            <label className="field"><span>Event name</span><input required minLength={3} maxLength={100} value={eventName} onChange={(event) => { setEventName(event.target.value); setSlug(toSlug(event.target.value)); }} placeholder="e.g. Build for Good 2026" /></label>
            <label className="field"><span>Page URL</span><div className="slug-input"><span>/h/</span><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={80} value={slug} onChange={(event) => setSlug(toSlug(event.target.value))} /></div></label>
            <label className="field"><span>Event description <em>optional</em></span><textarea maxLength={2000} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What are you building together?" /></label>
            <div className="field-row"><label className="field"><span>Date</span><input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} /></label><label className="field"><span>Location</span><input maxLength={100} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or online" /></label></div>
            <label className="field"><span>Themes <small>One per line</small></span><textarea rows={3} value={themesText} onChange={(event) => setThemesText(event.target.value)} placeholder={"Climate tech\nAccessible design\nAI for good"} /></label>
            <div className="rubric-editor-note"><ShieldCheck size={15} /><span>Expanded judge-only rubric: 8 categories scored from 0–10 (80 points total).</span></div>
            <button type="submit" className="button button-dark" disabled={busy}>{busy ? "Creating…" : "Publish event page"} <ArrowUpRight size={15} /></button>
          </form>
        </details>
      )}
      <div className="judging-workspace">
        <div className="workspace-heading"><div><span className="eyebrow muted-eyebrow">{siteConfig.staff.deskEyebrow}</span><h3>{siteConfig.staff.deskHeading}</h3></div><span className="submission-count">{eventData?.submissions.length ?? 0} PROJECTS</span></div>
        {events.length > 0 ? <label className="field event-picker"><span>Choose an event</span><select value={selectedSlug} onChange={(event) => setSelectedSlug(event.target.value)}><option value="">Select a hackathon</option>{events.map((item) => <option value={item.slug} key={item.id}>{item.name}</option>)}</select></label> : <p className="empty-note">{role === "admin" ? "Create your first event above to start receiving projects." : "No event pages have been published yet."}</p>}
        {role === "admin" && eventData && !hasExpandedRubric(eventData.hackathon.rubric) && <div className="rubric-update"><p>This event still has its shorter rubric. Apply the expanded, judge-only 8-category rubric.</p><button className="button button-outline" type="button" onClick={applyExpandedRubric} disabled={busy}>{busy ? "Updating rubric…" : "Apply expanded rubric"} <ArrowUpRight size={14} /></button></div>}
        {eventData && <p className="judge-privacy-note"><ShieldCheck size={14} /> {siteConfig.staff.privacyNote}</p>}
        {eventLoading && <p className="loading-note"><LoaderCircle size={16} className="spin" /> Loading submissions…</p>}
        {!eventLoading && selectedSlug && eventData?.submissions.length === 0 && <p className="empty-note">No submissions yet. Share the event page with teams to get started.</p>}
        {!eventLoading && eventData?.submissions.map((submission, index) => (
          <article className="judge-submission" key={submission.id}>
            <div className="submission-card-heading"><span className="submission-index">TEAM SCORECARD / {String(index + 1).padStart(2, "0")}</span><span className="saved-mark">{isJudgmentSaved(submission, eventData.hackathon.rubric, scores[submission.id] ?? {}, feedback[submission.id] ?? "") ? <><Check size={13} /> SAVED</> : "NOT SCORED"}</span></div>
            <h4>{submission.project_title}</h4>
            <p className="submission-team">BY {submission.team_name.toUpperCase()}</p>
            {submission.description && <p className="submission-description">{submission.description}</p>}
            <div className="project-links">{submission.repository_url && <a href={submission.repository_url} target="_blank" rel="noreferrer">Repository <ExternalLink size={13} /></a>}{submission.demo_url && <a href={submission.demo_url} target="_blank" rel="noreferrer">Demo <ExternalLink size={13} /></a>}{submission.file_url && <a href={submission.file_url} target="_blank" rel="noreferrer">{submission.file_name || "Download file"} <ArrowUpRight size={13} /></a>}</div>
            <div className="score-summary"><span>THIS TEAM&apos;S SCORE</span><strong>{getScoreTotal(eventData.hackathon.rubric, scores[submission.id] ?? {})} <small>/ {eventData.hackathon.rubric.reduce((total, category) => total + category.maxScore, 0)}</small></strong><span>{getScoredCategoryCount(eventData.hackathon.rubric, scores[submission.id] ?? {})} OF {eventData.hackathon.rubric.length} CATEGORIES SCORED</span></div>
            <div className="score-list">
              {eventData.hackathon.rubric.map((category) => (
                <label className="score-row" key={category.id}>
                  <span><strong>{category.name}</strong><small>{category.description}</small></span>
                  <select
                    aria-label={submission.team_name + ": " + category.name + " score"}
                    value={scores[submission.id]?.[category.id] ?? ""}
                    onChange={(event) => updateScore(submission.id, category.id, event.target.value)}
                  >
                    <option value="">—</option>
                    {Array.from({ length: category.maxScore + 1 }, (_unused, value) => (
                      <option key={value} value={value}>{value} / {category.maxScore}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <label className="field feedback-field"><span>Feedback <small>Visible only to you</small></span><textarea rows={3} maxLength={3000} value={feedback[submission.id] ?? ""} onChange={(event) => setFeedback((current) => ({ ...current, [submission.id]: event.target.value }))} placeholder="What stood out? What could they take further?" /></label>
            <button type="button" className="button button-dark save-score" onClick={() => saveJudgment(submission)} disabled={busy}><Save size={15} />{busy ? "Saving…" : submission.judgment ? "Update judgment" : "Save judgment"}</button>
          </article>
        ))}
        {eventData && <Link className="view-event-link" href={"/h/" + eventData.hackathon.slug} target="_blank">View public event page <ArrowUpRight size={14} /></Link>}
      </div>
      {role === "admin" && selectedSlug && (
        <ResultsPanel
          results={results}
          open={resultsOpen}
          loading={resultsLoading}
          onToggle={() => { setResultsOpen((isOpen) => !isOpen); if (!results) void loadResults(); }}
          onRefresh={() => void loadResults()}
          onExportScores={exportScores}
          onExportFeedback={exportFeedback}
        />
      )}
      {notice && <p className="form-success" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}

"use client";

import { ArrowDown, BarChart3, Download, LoaderCircle, Trophy } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import type { ResultsPayload } from "@/lib/types";

/**
 * Organizer-only results: ranking, judge coverage, written feedback and CSV
 * export. Kept as its own component so it can be rendered and reviewed
 * without signing in as an admin.
 */
export default function ResultsPanel({
  results,
  open,
  loading,
  onToggle,
  onRefresh,
  onExportScores,
  onExportFeedback,
}: {
  results: ResultsPayload | null;
  open: boolean;
  loading: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  onExportScores: () => void;
  onExportFeedback: () => void;
}) {
  return (
    <section className="results-panel">
      <div className="workspace-heading">
        <div>
          <span className="eyebrow muted-eyebrow">{siteConfig.staff.resultsEyebrow}</span>
          <h3>{siteConfig.staff.resultsHeading}</h3>
        </div>
        <button type="button" className="button button-outline" onClick={onToggle} disabled={loading}>
          {loading ? (
            <><LoaderCircle size={14} className="spin" /> Tallying…</>
          ) : open ? (
            <>Hide results <ArrowDown size={14} /></>
          ) : (
            <>Show results <BarChart3 size={14} /></>
          )}
        </button>
      </div>

      {open && results && (
        <>
          <p className="results-method">
            Every judge&apos;s scorecard is summed out of {results.total_possible}, then averaged across
            the judges who completed it. All {results.hackathon.rubric.length} categories carry equal
            weight. A half-finished scorecard is left out of the average and counted separately, so an
            unfinished card never drags a team down. Check judge coverage before reading the ranking.
          </p>

          {results.rows.length === 0 ? (
            <p className="empty-note">No submissions yet, so there is nothing to rank.</p>
          ) : results.judges.length === 0 ? (
            <p className="empty-note">No judge has saved a scorecard yet. Totals appear here as scores come in.</p>
          ) : (
            <>
              <div className="results-scroll">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Team</th>
                      <th className="num">Mean</th>
                      <th className="num">Judges</th>
                      {results.hackathon.rubric.map((category) => (
                        <th className="num" key={category.id} title={category.name}>
                          {category.name.split(/[\s&]+/)[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.rows.map((row, index) => (
                      <tr key={row.submission_id}>
                        <td className="num">
                          {index === 0 && row.mean_total !== null ? <Trophy size={13} /> : index + 1}
                        </td>
                        <td className="results-team">
                          <strong>{row.team_name}</strong>
                          <small>{row.project_title}</small>
                        </td>
                        <td className="num results-total">
                          {row.mean_total === null ? "—" : row.mean_total.toFixed(1)}
                        </td>
                        <td className={"num" + (row.judge_count < results.judges.length ? " results-gap" : "")}>
                          {row.judge_count} / {results.judges.length}
                          {row.partial_count > 0 && <small>+{row.partial_count} partial</small>}
                        </td>
                        {results.hackathon.rubric.map((category) => {
                          const value = row.category_means[category.id];
                          return (
                            <td className="num" key={category.id}>
                              {value === null || value === undefined ? "—" : value.toFixed(1)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 className="results-subhead">Judge coverage</h4>
              <div className="results-scroll">
                <table className="results-table">
                  <thead>
                    <tr><th>Judge</th><th className="num">Cards completed</th></tr>
                  </thead>
                  <tbody>
                    {results.judges.map((judge) => (
                      <tr key={judge.id}>
                        <td>{judge.label}</td>
                        <td className={"num" + (judge.scored < results.team_count ? " results-gap" : "")}>
                          {judge.scored} / {results.team_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {results.rows.some((row) => row.feedback.length > 0) && (
                <>
                  <h4 className="results-subhead">Written feedback</h4>
                  {results.rows
                    .filter((row) => row.feedback.length > 0)
                    .map((row) => (
                      <details className="results-feedback" key={row.submission_id}>
                        <summary>
                          {row.team_name}{" "}
                          <small>{row.feedback.length} note{row.feedback.length === 1 ? "" : "s"}</small>
                        </summary>
                        {row.feedback.map((note) => (
                          <div className="results-note" key={note.judge_id}>
                            <span>{note.judge_label}</span>
                            <p>{note.text}</p>
                          </div>
                        ))}
                      </details>
                    ))}
                </>
              )}

              <div className="results-actions">
                <button type="button" className="button button-dark" onClick={onExportScores}>
                  <Download size={14} /> Export scores
                </button>
                <button type="button" className="button button-outline" onClick={onExportFeedback}>
                  <Download size={14} /> Export feedback
                </button>
                <button type="button" className="button button-outline" onClick={onRefresh} disabled={loading}>
                  Refresh
                </button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

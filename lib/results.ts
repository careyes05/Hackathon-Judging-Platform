import type { RubricCategory, ResultsJudge, ResultsRow } from "@/lib/types";

export type JudgmentRecord = {
  submission_id: string;
  judge_id: string;
  scores: Record<string, number>;
  feedback: string;
};

export type SubmissionRecord = {
  id: string;
  team_name: string;
  project_title: string;
};

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

/**
 * Aggregates every judge's scorecards for one event.
 *
 * Rules that matter for a live event:
 *  - A scorecard counts toward a team's mean only when every rubric category
 *    carries a score. A judge who saved a half-filled card does not drag the
 *    team down; the card is reported separately as `partial_count`.
 *  - A team's score is the mean of the complete cards, so a team seen by two
 *    judges is comparable to one seen by three. `judge_count` exposes the gap
 *    rather than hiding it.
 *  - Unscored teams sort last with a null mean instead of a zero, which would
 *    read as "scored badly".
 */
export function aggregateResults(
  rubric: RubricCategory[],
  submissions: SubmissionRecord[],
  judgments: JudgmentRecord[],
  judgeLabelFor: (judgeId: string) => string,
): { rows: ResultsRow[]; judges: ResultsJudge[]; totalPossible: number } {
  const totalPossible = rubric.reduce((total, category) => total + category.maxScore, 0);
  const isComplete = (scores: Record<string, number>) =>
    rubric.length > 0 &&
    rubric.every((category) => typeof scores[category.id] === "number");
  const cardTotal = (scores: Record<string, number>) =>
    rubric.reduce((total, category) => total + (scores[category.id] ?? 0), 0);

  const rows: ResultsRow[] = submissions.map((submission) => {
    const forSubmission = judgments.filter(
      (judgment) => judgment.submission_id === submission.id,
    );
    const complete = forSubmission.filter((judgment) => isComplete(judgment.scores));

    const perJudge: Record<string, number | null> = {};
    forSubmission.forEach((judgment) => {
      perJudge[judgment.judge_id] = isComplete(judgment.scores)
        ? cardTotal(judgment.scores)
        : null;
    });

    const categoryMeans: Record<string, number | null> = {};
    rubric.forEach((category) => {
      categoryMeans[category.id] = mean(
        complete
          .map((judgment) => judgment.scores[category.id])
          .filter((value): value is number => typeof value === "number"),
      );
    });

    return {
      submission_id: submission.id,
      team_name: submission.team_name,
      project_title: submission.project_title,
      judge_count: complete.length,
      partial_count: forSubmission.length - complete.length,
      mean_total: mean(complete.map((judgment) => cardTotal(judgment.scores))),
      category_means: categoryMeans,
      per_judge: perJudge,
      feedback: forSubmission
        .filter((judgment) => judgment.feedback.trim().length > 0)
        .map((judgment) => ({
          judge_id: judgment.judge_id,
          judge_label: judgeLabelFor(judgment.judge_id),
          text: judgment.feedback,
        })),
    };
  });

  const ranked = [...rows].sort((a, b) => {
    if (a.mean_total === null && b.mean_total === null) {
      return a.team_name.localeCompare(b.team_name);
    }
    if (a.mean_total === null) return 1;
    if (b.mean_total === null) return -1;
    if (b.mean_total !== a.mean_total) return b.mean_total - a.mean_total;
    const first = rubric[0]?.id;
    if (!first) return 0;
    return (b.category_means[first] ?? 0) - (a.category_means[first] ?? 0);
  });

  const judges: ResultsJudge[] = Array.from(
    new Set(judgments.map((judgment) => judgment.judge_id)),
  )
    .map((judgeId) => ({
      id: judgeId,
      label: judgeLabelFor(judgeId),
      scored: rows.filter((row) => typeof row.per_judge[judgeId] === "number").length,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return { rows: ranked, judges, totalPossible };
}

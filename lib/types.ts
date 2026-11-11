export type RubricCategory = {
  id: string;
  name: string;
  description: string;
  maxScore: number;
};

export type Hackathon = {
  id: string;
  name: string;
  slug: string;
  description: string;
  event_date: string | null;
  location: string | null;
  themes: string[];
  rubric: RubricCategory[];
  created_at: string;
};

export type Submission = {
  id: string;
  team_name: string;
  project_title: string;
  description: string;
  repository_url: string | null;
  demo_url: string | null;
  file_name: string | null;
  file_url?: string | null;
  updated_at: string;
  judgment?: Judgment | null;
};

export type Judgment = {
  id: string;
  scores: Record<string, number>;
  feedback: string;
  updated_at: string;
};

export type StaffRole = "admin" | "judge";

export type ResultsJudge = {
  id: string;
  label: string;
  scored: number;
};

export type ResultsRow = {
  submission_id: string;
  team_name: string;
  project_title: string;
  judge_count: number;
  partial_count: number;
  mean_total: number | null;
  category_means: Record<string, number | null>;
  per_judge: Record<string, number | null>;
  feedback: Array<{ judge_id: string; judge_label: string; text: string }>;
};

export type ResultsPayload = {
  hackathon: Pick<Hackathon, "id" | "name" | "slug" | "rubric">;
  total_possible: number;
  team_count: number;
  judges: ResultsJudge[];
  rows: ResultsRow[];
};

import type { RubricCategory } from "@/lib/types";

export const DEFAULT_RUBRIC: RubricCategory[] = [
  {
    id: "innovation",
    name: "Innovation & originality",
    description: "How fresh, creative, and distinctive is the idea or its approach?",
    maxScore: 10,
  },
  {
    id: "theme_alignment",
    name: "Theme alignment",
    description: "How clearly does the project address the event theme or challenge?",
    maxScore: 10,
  },
  {
    id: "technical_execution",
    name: "Technical execution",
    description: "How well are the chosen tools, architecture, and implementation used?",
    maxScore: 10,
  },
  {
    id: "functionality",
    name: "Functionality & completeness",
    description: "How well does the prototype work, and how much of the core idea is demonstrated?",
    maxScore: 10,
  },
  {
    id: "user_experience",
    name: "User experience & accessibility",
    description: "Is the solution intuitive, inclusive, and thoughtfully designed for its users?",
    maxScore: 10,
  },
  {
    id: "impact",
    name: "Potential impact",
    description: "Could this create meaningful value for its intended users or community?",
    maxScore: 10,
  },
  {
    id: "feasibility",
    name: "Feasibility & sustainability",
    description: "Is there a credible path to adopt, maintain, or grow the solution?",
    maxScore: 10,
  },
  {
    id: "presentation",
    name: "Storytelling & presentation",
    description: "How clearly does the team explain the problem, solution, and demonstration?",
    maxScore: 10,
  },
];

export function isValidRubric(value: unknown): value is RubricCategory[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 8) return false;
  const categories = value as Partial<RubricCategory>[];
  return (
    categories.every((category) =>
      typeof category.id === "string" &&
      /^[a-z0-9_-]{1,40}$/.test(category.id) &&
      typeof category.name === "string" &&
      category.name.trim().length > 0 &&
      category.name.length <= 80 &&
      typeof category.description === "string" &&
      category.description.length <= 300 &&
      typeof category.maxScore === "number" &&
      Number.isInteger(category.maxScore) &&
      category.maxScore >= 1 &&
      category.maxScore <= 10,
    ) &&
    new Set(categories.map((category) => category.id)).size === categories.length
  );
}

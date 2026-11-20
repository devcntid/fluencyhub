export type ProgramGoalSlug =
  | "ready-to-speak"
  | "ready-for-work"
  | "ready-to-go"
  | "ready-for-the-world";

export type ReadyLevelTitle =
  | "Starter"
  | "Warming Up"
  | "Ready to Speak"
  | "Ready to Connect"
  | "Ready to Contribute";

export interface ReadyCheckDimensions {
  kelancaran: number;
  pelafalan: number;
  mendengar: number;
  ketepatan: number;
  lintasBudaya: number;
}

export interface ReadyCheckCorrection {
  original: string;
  improved: string;
  explanation: string;
}

export interface ReadyCheckResult {
  overallScore: number;
  uncertaintyMargin: number;
  levelTitle: ReadyLevelTitle;
  cefrEstimate: "A1" | "A2" | "B1" | "B2" | "C1";
  nextLevelTitle: ReadyLevelTitle | null;
  pointsToNextLevel: number;
  dimensions: ReadyCheckDimensions;
  confidenceIndex: number;
  hardestSituations: string[];
  strengthTitle: string;
  focusTitle: string;
  recommendedGoalSlug: ProgramGoalSlug;
  recommendedGoalTitle: string;
  recommendedDescription: string;
  feedbackText: string;
  corrections: ReadyCheckCorrection[];
  saved: boolean;
  createdAt: string;
  primaryTranscript?: string;
  durationSeconds?: number;
}

export interface StoredReadyCheckSummary {
  overallScore: number;
  levelTitle: ReadyLevelTitle;
  targetProgramSlug: ProgramGoalSlug;
  createdAt: string;
}

export const READY_CHECK_STORAGE_KEY = "englishready_latest_ready_check_v1";


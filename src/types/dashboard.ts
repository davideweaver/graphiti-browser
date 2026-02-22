export const PERIOD_OPTIONS = ["7d", "30d", "90d"] as const;
export type Period = (typeof PERIOD_OPTIONS)[number];

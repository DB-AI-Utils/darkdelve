import type { TaskStatus } from "../types.js";

export const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: "gray",
  running: "green",
  completed: "blue",
  failed: "red",
  cancelled: "yellow",
};

export const STATUS_SYMBOLS: Record<TaskStatus, string> = {
  pending: "○",
  running: "●",
  completed: "✓",
  failed: "✗",
  cancelled: "◆",
};

import React from "react";
import { Box, Text } from "ink";
import type { TaskStatus } from "../../types.js";

interface StatusBarProps {
  taskId: string;
  status: TaskStatus;
  elapsed: string;
  costUsd: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "gray",
  running: "green",
  completed: "blue",
  failed: "red",
  cancelled: "yellow",
};

const STATUS_SYMBOLS: Record<string, string> = {
  pending: "○",
  running: "●",
  completed: "✓",
  failed: "✗",
  cancelled: "◆",
};

export function StatusBar({ taskId, status, elapsed, costUsd }: StatusBarProps) {
  const statusColor = STATUS_COLORS[status] ?? "white";
  const statusSymbol = STATUS_SYMBOLS[status] ?? "?";

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} justifyContent="space-between">
      <Text>
        Task: <Text bold>{taskId}</Text>
      </Text>
      <Text color={statusColor}>
        {statusSymbol} {status.toUpperCase()}
      </Text>
      <Text>
        Cost: <Text bold>${costUsd.toFixed(2)}</Text>
      </Text>
      <Text dimColor>{elapsed}</Text>
    </Box>
  );
}

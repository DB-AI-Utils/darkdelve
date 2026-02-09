import React from "react";
import { Box, Text } from "ink";
import type { OrchestratorState } from "../../state.js";

interface StatusBarProps {
  state: OrchestratorState;
  model: string;
  elapsed: string;
}

const STATUS_COLORS: Record<string, string> = {
  running: "green",
  completed: "blue",
  failed: "red",
  blocked: "yellow",
};

const STATUS_SYMBOLS: Record<string, string> = {
  running: "●",
  completed: "✓",
  failed: "✗",
  blocked: "◆",
};

export function StatusBar({ state, model, elapsed }: StatusBarProps) {
  const statusColor = STATUS_COLORS[state.status] ?? "white";
  const statusSymbol = STATUS_SYMBOLS[state.status] ?? "?";
  const sessionShort = state.sessionId ? state.sessionId.slice(0, 8) : "—";

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} justifyContent="space-between">
      <Text>
        Session: <Text bold>{sessionShort}</Text>
      </Text>
      <Text>
        Model: <Text bold>{model}</Text>
      </Text>
      <Text color={statusColor}>
        {statusSymbol} {state.status.toUpperCase()}
      </Text>
      <Text dimColor>{elapsed}</Text>
    </Box>
  );
}

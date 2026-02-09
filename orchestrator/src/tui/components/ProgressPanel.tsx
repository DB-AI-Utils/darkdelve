import React from "react";
import { Box, Text } from "ink";

interface ProgressPanelProps {
  iteration: number;
  maxIterations: number;
  costUsd: number;
  maxBudgetUsd: number;
  elapsedMs: number;
  maxHours: number;
  compactions: number;
  stagnantCount: number;
  errorCount: number;
}

function progressColor(pct: number): string {
  if (pct > 90) return "red";
  if (pct > 70) return "yellow";
  return "green";
}

const BAR_WIDTH = 24;
const FILLED = "█";
const EMPTY = "░";

function BarRow({ label, value, max, suffix }: { label: string; value: number; max: number; suffix: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = progressColor(pct);
  const filled = Math.min(BAR_WIDTH, Math.max(0, Math.round((pct / 100) * BAR_WIDTH)));
  const empty = BAR_WIDTH - filled;

  return (
    <Box>
      <Box width={12}>
        <Text>{label}</Text>
      </Box>
      <Text color={color}>[{FILLED.repeat(filled)}{EMPTY.repeat(empty)}]</Text>
      <Text> </Text>
      <Text dimColor>{suffix}</Text>
    </Box>
  );
}

export function ProgressPanel({
  iteration,
  maxIterations,
  costUsd,
  maxBudgetUsd,
  elapsedMs,
  maxHours,
  compactions,
  stagnantCount,
  errorCount,
}: ProgressPanelProps) {
  const elapsedMin = Math.floor(elapsedMs / 60_000);
  const maxMin = maxHours * 60;

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold dimColor>─ Progress ─</Text>
      <BarRow label="Iteration" value={iteration} max={maxIterations} suffix={`${iteration}/${maxIterations}`} />
      <BarRow label="Cost" value={costUsd} max={maxBudgetUsd} suffix={`$${costUsd.toFixed(2)}/$${maxBudgetUsd}`} />
      <BarRow label="Time" value={elapsedMin} max={maxMin} suffix={`${elapsedMin}m/${maxMin}m`} />
      <Box gap={2}>
        <Text dimColor>Compactions: {compactions}</Text>
        <Text dimColor>Stagnant: {stagnantCount}/3</Text>
        <Text dimColor>Errors: {errorCount}</Text>
      </Box>
    </Box>
  );
}

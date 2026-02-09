import React from "react";
import { Box, Text } from "ink";

export interface ToolMetrics {
  [toolName: string]: number;
}

interface MetricsPanelProps {
  tools: ToolMetrics;
  avgTurnSeconds: number;
}

export function MetricsPanel({ tools, avgTurnSeconds }: MetricsPanelProps) {
  const sorted = Object.entries(tools).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <Box paddingX={1}>
      <Text bold dimColor>─ Metrics ─  </Text>
      {sorted.map(([name, count]) => (
        <Text key={name} dimColor>
          {name}: {count}  </Text>
      ))}
      <Text dimColor>Avg turn: {avgTurnSeconds.toFixed(1)}s</Text>
    </Box>
  );
}

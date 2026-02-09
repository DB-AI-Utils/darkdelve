import React from "react";
import { Box, Text } from "ink";
import type { TaskStatus } from "../../types.js";
import { STATUS_COLORS, STATUS_SYMBOLS } from "../theme.js";

type StatusBarProps =
  | { mode: "global"; runningCount: number; totalCost: number; uptime: string }
  | { mode: "task"; taskId: string; status: TaskStatus; elapsed: string; costUsd: number };

export function StatusBar(props: StatusBarProps) {
  if (props.mode === "global") {
    return (
      <Box borderStyle="single" borderColor="gray" paddingX={1} justifyContent="space-between">
        <Text>
          Tasks: <Text bold color="green">{props.runningCount} running</Text>
        </Text>
        <Text>
          Cost: <Text bold>${props.totalCost.toFixed(2)}</Text>
        </Text>
        <Text dimColor>{props.uptime}</Text>
      </Box>
    );
  }

  const statusColor = STATUS_COLORS[props.status] ?? "white";
  const statusSymbol = STATUS_SYMBOLS[props.status] ?? "?";

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} justifyContent="space-between">
      <Text>
        Task: <Text bold>{props.taskId}</Text>
      </Text>
      <Text color={statusColor}>
        {statusSymbol} {props.status.toUpperCase()}
      </Text>
      <Text>
        Cost: <Text bold>${props.costUsd.toFixed(2)}</Text>
      </Text>
      <Text dimColor>{props.elapsed}</Text>
    </Box>
  );
}

import React from "react";
import { Box, Text } from "ink";
import type { Task } from "../../types.js";

interface TaskListProps {
  tasks: Task[];
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

export function TaskListView({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <Box paddingX={1}>
        <Text dimColor>No tasks. Use `claudestrator run` to start one.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold dimColor>─ Tasks ─</Text>
      {tasks.map((task) => {
        const color = STATUS_COLORS[task.status] ?? "white";
        const symbol = STATUS_SYMBOLS[task.status] ?? "?";
        return (
          <Box key={task.id} gap={2}>
            <Text color={color}>{symbol}</Text>
            <Box width={14}>
              <Text bold>{task.id}</Text>
            </Box>
            <Box width={12}>
              <Text color={color}>{task.status.padEnd(10)}</Text>
            </Box>
            <Box width={8}>
              <Text dimColor>i:{task.iteration}</Text>
            </Box>
            <Box width={10}>
              <Text dimColor>${task.costUsd.toFixed(2)}</Text>
            </Box>
            <Text wrap="truncate">{task.prompt.slice(0, 60)}</Text>
          </Box>
        );
      })}
    </Box>
  );
}

import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import type { Task } from "../../types.js";
import { STATUS_COLORS, STATUS_SYMBOLS } from "../theme.js";

interface TaskListProps {
  tasks: Task[];
  onSelect: (taskId: string) => void;
  onNew: () => void;
  onCancel: (taskId: string) => void;
  onQuit: () => void;
}

export function TaskListView({ tasks, onSelect, onNew, onCancel, onQuit }: TaskListProps) {
  const [cursorIndex, setCursorIndex] = useState(0);

  // Clamp cursor when tasks change
  useEffect(() => {
    setCursorIndex((prev) => Math.min(prev, Math.max(0, tasks.length - 1)));
  }, [tasks.length]);

  useInput((input, key) => {
    if (key.upArrow) {
      setCursorIndex((p) => Math.max(0, p - 1));
    } else if (key.downArrow) {
      setCursorIndex((p) => Math.min(tasks.length - 1, p + 1));
    } else if (key.return && tasks.length > 0) {
      onSelect(tasks[cursorIndex].id);
    } else if (input === "n") {
      onNew();
    } else if (input === "c" && tasks.length > 0) {
      const task = tasks[cursorIndex];
      if (task.status === "running" || task.status === "pending") {
        onCancel(task.id);
      }
    } else if (input === "q") {
      onQuit();
    }
  });

  if (tasks.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1} flexGrow={1}>
        <Text bold dimColor>─ Tasks ─</Text>
        <Box paddingY={1}>
          <Text dimColor>No tasks yet. Press <Text bold>n</Text> to create one.</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      <Text bold dimColor>─ Tasks ─</Text>
      {tasks.map((task, i) => {
        const color = STATUS_COLORS[task.status] ?? "white";
        const symbol = STATUS_SYMBOLS[task.status] ?? "?";
        const isSelected = i === cursorIndex;
        return (
          <Box key={task.id} gap={2}>
            <Text>{isSelected ? "▸" : " "}</Text>
            <Text color={color}>{symbol}</Text>
            <Box width={14}>
              <Text bold={isSelected}>{task.id}</Text>
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
      <Box paddingTop={1} gap={2}>
        <Text dimColor><Text bold>↑/↓</Text> Navigate</Text>
        <Text dimColor><Text bold>Enter</Text> View</Text>
        <Text dimColor><Text bold>n</Text> New</Text>
        <Text dimColor><Text bold>c</Text> Cancel</Text>
        <Text dimColor><Text bold>q</Text> Quit</Text>
      </Box>
    </Box>
  );
}

import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import type { Task } from "../../types.js";
import { STATUS_COLORS, STATUS_SYMBOLS } from "../theme.js";

interface TaskListProps {
  tasks: Task[];
  onSelect: (taskId: string) => void;
  onNew: () => void;
  onCancel: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onQuit: () => void;
}

function compactElapsed(startedAt: string | null, finishedAt: string | null): string {
  if (!startedAt) return "-";
  const start = new Date(startedAt).getTime();
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  const ms = end - start;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? `${String(m).padStart(2, "0")}m` : ""}`;
  if (m > 0) return `${m}m`;
  return "<1m";
}

export function TaskListView({ tasks, onSelect, onNew, onCancel, onDelete, onQuit }: TaskListProps) {
  const [cursorIndex, setCursorIndex] = useState(0);
  const [pendingAction, setPendingAction] = useState<null | { type: "quit" } | { type: "cancel"; taskId: string }>(null);

  // Clamp cursor when tasks change
  useEffect(() => {
    setCursorIndex((prev) => Math.min(prev, Math.max(0, tasks.length - 1)));
  }, [tasks.length]);

  // Auto-dismiss confirmation after 3s
  useEffect(() => {
    if (!pendingAction) return;
    const timer = setTimeout(() => setPendingAction(null), 3000);
    return () => clearTimeout(timer);
  }, [pendingAction]);

  useInput((input, key) => {
    // Handle pending confirmation first
    if (pendingAction) {
      if (pendingAction.type === "quit" && input === "q") {
        setPendingAction(null);
        onQuit();
        return;
      }
      if (pendingAction.type === "cancel" && input === "c") {
        onCancel(pendingAction.taskId);
        setPendingAction(null);
        return;
      }
      // Any other key dismisses
      setPendingAction(null);
      return;
    }

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
        setPendingAction({ type: "cancel", taskId: task.id });
      }
    } else if (input === "d" && tasks.length > 0) {
      const task = tasks[cursorIndex];
      if (task.status !== "running" && task.status !== "pending") {
        onDelete(task.id);
      }
    } else if (input === "q") {
      const runningCount = tasks.filter((t) => t.status === "running").length;
      if (runningCount > 0) {
        setPendingAction({ type: "quit" });
      } else {
        onQuit();
      }
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
            <Box width={8}>
              <Text dimColor>{compactElapsed(task.startedAt, task.finishedAt)}</Text>
            </Box>
            <Box width={10}>
              <Text dimColor>${task.costUsd.toFixed(2)}</Text>
            </Box>
            <Text wrap="truncate">{task.prompt.slice(0, 50)}</Text>
          </Box>
        );
      })}

      {pendingAction && (
        <Box paddingTop={1} paddingX={1}>
          <Text color="yellow" bold>
            {pendingAction.type === "quit"
              ? `Quit will cancel ${tasks.filter((t) => t.status === "running").length} running task(s). Press q again to confirm.`
              : `Cancel task ${(pendingAction as { type: "cancel"; taskId: string }).taskId}? Press c again to confirm.`}
          </Text>
        </Box>
      )}

      <Box paddingTop={pendingAction ? 0 : 1} gap={2}>
        <Text dimColor><Text bold>↑/↓</Text> Navigate</Text>
        <Text dimColor><Text bold>Enter</Text> View</Text>
        <Text dimColor><Text bold>n</Text> New</Text>
        <Text dimColor><Text bold>c</Text> Cancel</Text>
        <Text dimColor><Text bold>d</Text> Delete</Text>
        <Text dimColor><Text bold>q</Text> Quit</Text>
      </Box>
    </Box>
  );
}

import React, { useState, useEffect } from "react";
import { render, Box, Text, useInput } from "ink";
import type { Task, WorkerEvent } from "../types.js";
import type { TaskRunner } from "../task/runner.js";
import { StatusBar } from "./components/StatusBar.js";
import { TaskDetail, type LogEntry } from "./components/TaskDetail.js";

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function timeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function addEntry(
  prev: LogEntry[],
  source: LogEntry["source"],
  text: string,
): LogEntry[] {
  const entry: LogEntry = { time: timeStr(), source, text };
  const next = [...prev, entry];
  return next.length > 500 ? next.slice(-500) : next;
}

function workerEventToLogEntry(event: WorkerEvent): { source: LogEntry["source"]; text: string } | null {
  switch (event.type) {
    case "iteration:start":
      return { source: "system", text: `--- Iteration ${event.iteration}/${event.maxIterations} (${event.fresh ? "fresh" : "resume"}) ---` };
    case "iteration:end":
      return { source: "system", text: `Iteration ${event.iteration}: $${event.costUsd.toFixed(2)}, ${event.numTurns} turns` };
    case "message":
      if (event.source === "claude") return { source: "claude", text: event.text };
      if (event.source === "tool") return { source: "tool", text: event.text };
      return { source: "system", text: event.text };
    case "error":
      return { source: "error", text: `Iteration ${event.iteration}: ${event.error}` };
    case "signal":
      return { source: "system", text: `Signal: ${event.signal}` };
    case "completion":
      return { source: event.allPassed ? "system" : "warn", text: event.allPassed ? "All checks passed" : `Checks failed: ${event.summary}` };
    case "stagnation":
      return { source: "warn", text: `Stagnation: ${event.stagnantCount}/${event.threshold} unchanged iterations` };
    case "timeout":
      return { source: "warn", text: "Timed out" };
    case "done":
      return { source: "system", text: `Done: ${event.status}, ${event.iterations} iterations, $${event.totalCostUsd.toFixed(2)}` };
    default:
      return null;
  }
}

interface DashboardProps {
  runner: TaskRunner;
  initialTask: Task;
}

function Dashboard({ runner, initialTask }: DashboardProps) {
  const [task, setTask] = useState(initialTask);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Elapsed timer
  useEffect(() => {
    const startedAt = task.startedAt ? new Date(task.startedAt).getTime() : Date.now();
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 1000);
    return () => clearInterval(interval);
  }, [task.startedAt]);

  // Subscribe to runner events
  useEffect(() => {
    const onEvent = (taskId: string, event: WorkerEvent) => {
      if (taskId !== initialTask.id) return;
      const entry = workerEventToLogEntry(event);
      if (entry) {
        setEntries((prev) => addEntry(prev, entry.source, entry.text));
        setScrollOffset(0);
      }
    };

    const onTaskUpdate = (updated: Task) => {
      if (updated.id === initialTask.id) {
        setTask({ ...updated });
      }
    };

    runner.on("event", onEvent);
    runner.on("taskUpdate", onTaskUpdate);

    return () => {
      runner.off("event", onEvent);
      runner.off("taskUpdate", onTaskUpdate);
    };
  }, [runner, initialTask.id]);

  // Keyboard handling
  useInput((input, key) => {
    if (key.upArrow) {
      setScrollOffset((p) => Math.min(p + 1, Math.max(0, entries.length - 10)));
    }
    if (key.downArrow) {
      setScrollOffset((p) => Math.max(0, p - 1));
    }
  });

  return (
    <Box flexDirection="column" width="100%">
      <Box justifyContent="center">
        <Text bold color="cyan">Claudestrator</Text>
      </Box>

      <StatusBar
        taskId={task.id}
        status={task.status}
        elapsed={formatElapsed(elapsedMs)}
        costUsd={task.costUsd}
      />

      <Box paddingX={1} gap={3}>
        <Text dimColor>Iteration: {task.iteration}/{task.maxIterations}</Text>
        <Text dimColor>Budget: ${task.costUsd.toFixed(2)}/${task.maxBudgetUsd}</Text>
        <Text dimColor>Project: {task.projectDir}</Text>
      </Box>

      <TaskDetail
        entries={entries}
        maxVisible={15}
        scrollOffset={scrollOffset}
      />

      <Box paddingX={1} gap={2}>
        <Text dimColor><Text bold>↑/↓</Text> Scroll</Text>
        <Text dimColor><Text bold>Ctrl+C</Text> Quit</Text>
      </Box>
    </Box>
  );
}

export function renderApp(runner: TaskRunner, task: Task): void {
  render(<Dashboard runner={runner} initialTask={task} />);
}

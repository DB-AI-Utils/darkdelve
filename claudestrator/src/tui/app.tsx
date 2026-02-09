import React, { useState, useEffect, useCallback } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import type { Task, WorkerEvent } from "../types.js";
import type { TaskScheduler } from "../task/scheduler.js";
import { StatusBar } from "./components/StatusBar.js";
import { TaskDetail, type LogEntry } from "./components/TaskDetail.js";
import { TaskListView } from "./components/TaskList.js";
import { NewTaskForm } from "./components/NewTaskForm.js";

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

type View = "list" | "detail" | "new";

interface DashboardProps {
  scheduler: TaskScheduler;
  initialView: View;
  initialTaskId: string | null;
}

function Dashboard({ scheduler, initialView, initialTaskId }: DashboardProps) {
  const { exit } = useApp();
  const [view, setView] = useState<View>(initialView);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTaskId);
  const [tasks, setTasks] = useState<Task[]>(() => scheduler.store.list());
  const [logMap, setLogMap] = useState<Map<string, LogEntry[]>>(new Map());
  const [scrollOffset, setScrollOffset] = useState(0);
  const [uptime, setUptime] = useState("00:00:00");

  const startTime = useState(() => Date.now())[0];

  // Uptime timer
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(formatElapsed(Date.now() - startTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Subscribe to scheduler events
  useEffect(() => {
    const onEvent = (taskId: string, event: WorkerEvent) => {
      const entry = workerEventToLogEntry(event);
      if (entry) {
        setLogMap((prev) => {
          const next = new Map(prev);
          const taskEntries = next.get(taskId) ?? [];
          next.set(taskId, addEntry(taskEntries, entry.source, entry.text));
          return next;
        });
        // Auto-scroll when viewing this task's detail
        setScrollOffset(0);
      }
    };

    const onTaskUpdate = () => {
      setTasks(scheduler.store.list());
    };

    scheduler.on("event", onEvent);
    scheduler.on("taskUpdate", onTaskUpdate);

    return () => {
      scheduler.off("event", onEvent);
      scheduler.off("taskUpdate", onTaskUpdate);
    };
  }, [scheduler]);

  // Detail view keyboard
  useInput((input, key) => {
    if (view !== "detail") return;

    if (key.escape) {
      setView("list");
      setSelectedTaskId(null);
      setScrollOffset(0);
    } else if (key.upArrow) {
      const entries = logMap.get(selectedTaskId ?? "") ?? [];
      setScrollOffset((p) => Math.min(p + 1, Math.max(0, entries.length - 10)));
    } else if (key.downArrow) {
      setScrollOffset((p) => Math.max(0, p - 1));
    } else if (input === "c" && selectedTaskId) {
      scheduler.cancel(selectedTaskId);
    }
  });

  const handleQuit = useCallback(() => {
    scheduler.shutdown().then(() => exit());
  }, [scheduler, exit]);

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null;
  const runningCount = tasks.filter((t) => t.status === "running").length;
  const totalCost = tasks.reduce((sum, t) => sum + t.costUsd, 0);

  // --- List View ---
  if (view === "list") {
    return (
      <Box flexDirection="column" width="100%">
        <Box justifyContent="center">
          <Text bold color="cyan">Claudestrator</Text>
        </Box>

        <StatusBar
          mode="global"
          runningCount={runningCount}
          totalCost={totalCost}
          uptime={uptime}
        />

        <TaskListView
          tasks={tasks}
          onSelect={(taskId) => {
            setSelectedTaskId(taskId);
            setView("detail");
            setScrollOffset(0);
          }}
          onNew={() => setView("new")}
          onCancel={(taskId) => scheduler.cancel(taskId)}
          onQuit={handleQuit}
        />
      </Box>
    );
  }

  // --- New Task View ---
  if (view === "new") {
    return (
      <Box flexDirection="column" width="100%">
        <Box justifyContent="center">
          <Text bold color="cyan">Claudestrator</Text>
        </Box>

        <NewTaskForm
          onSubmit={(input) => {
            const task = scheduler.enqueue(input);
            setSelectedTaskId(task.id);
            setView("detail");
            setScrollOffset(0);
          }}
          onCancel={() => setView("list")}
        />
      </Box>
    );
  }

  // --- Detail View ---
  const entries = logMap.get(selectedTaskId ?? "") ?? [];
  const elapsedMs = selectedTask?.startedAt
    ? Date.now() - new Date(selectedTask.startedAt).getTime()
    : 0;

  return (
    <Box flexDirection="column" width="100%">
      <Box justifyContent="center">
        <Text bold color="cyan">Claudestrator</Text>
      </Box>

      {selectedTask && (
        <>
          <StatusBar
            mode="task"
            taskId={selectedTask.id}
            status={selectedTask.status}
            elapsed={formatElapsed(elapsedMs)}
            costUsd={selectedTask.costUsd}
          />

          <Box paddingX={1} gap={3}>
            <Text dimColor>Iteration: {selectedTask.iteration}/{selectedTask.maxIterations}</Text>
            <Text dimColor>Budget: ${selectedTask.costUsd.toFixed(2)}/{selectedTask.maxBudgetUsd}</Text>
            <Text dimColor>Project: {selectedTask.projectDir}</Text>
          </Box>
        </>
      )}

      <TaskDetail
        entries={entries}
        maxVisible={15}
        scrollOffset={scrollOffset}
      />

      <Box paddingX={1} gap={2}>
        <Text dimColor><Text bold>Esc</Text> Back</Text>
        <Text dimColor><Text bold>↑/↓</Text> Scroll</Text>
        <Text dimColor><Text bold>c</Text> Cancel task</Text>
      </Box>
    </Box>
  );
}

export function renderApp(
  scheduler: TaskScheduler,
  initialView: "list" | "detail" = "list",
  initialTaskId: string | null = null,
): void {
  render(
    <Dashboard
      scheduler={scheduler}
      initialView={initialView}
      initialTaskId={initialTaskId}
    />,
  );
}

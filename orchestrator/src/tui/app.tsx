import React, { useState, useEffect } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import type { OrchestratorEmitter } from "../orchestrator-core.js";
import type { TaskConfig } from "../task.js";
import type { RuntimeConfig } from "../config.js";
import type { OrchestratorState } from "../state.js";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { StatusBar } from "./components/StatusBar.js";
import { ProgressPanel } from "./components/ProgressPanel.js";
import { ActivityLog, type LogEntry } from "./components/ActivityLog.js";
import { MetricsPanel, type ToolMetrics } from "./components/MetricsPanel.js";
import { HelpScreen } from "./components/HelpScreen.js";
import { TaskForm } from "./components/TaskForm.js";

interface AppState {
  state: OrchestratorState;
  entries: LogEntry[];
  toolMetrics: ToolMetrics;
  totalTurns: number;
  totalDurationMs: number;
  model: string;
}

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
  // Cap at 500 entries to avoid unbounded memory growth
  const next = [...prev, entry];
  return next.length > 500 ? next.slice(-500) : next;
}

function Dashboard({ emitter, task, config }: { emitter: OrchestratorEmitter; task: TaskConfig; config: RuntimeConfig }) {
  const { exit } = useApp();

  const [appState, setAppState] = useState<AppState>({
    state: emitter.state as OrchestratorState,
    entries: [],
    toolMetrics: {},
    totalTurns: 0,
    totalDurationMs: 0,
    model: "—",
  });

  const [showHelp, setShowHelp] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Elapsed timer
  useEffect(() => {
    const startedAt = new Date(emitter.state.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to emitter events
  useEffect(() => {
    const onIterStart = (ev: { iteration: number; maxIterations: number; fresh: boolean }) => {
      setAppState((prev) => ({
        ...prev,
        state: { ...emitter.state } as OrchestratorState,
        entries: addEntry(prev.entries, "system", `--- Iteration ${ev.iteration}/${ev.maxIterations} (${ev.fresh ? "fresh" : "resume"}) ---`),
      }));
      setScrollOffset(0);
    };

    const onIterEnd = (ev: { iteration: number; costUsd: number; durationMs: number; numTurns: number }) => {
      setAppState((prev) => ({
        ...prev,
        state: { ...emitter.state } as OrchestratorState,
        totalTurns: prev.totalTurns + ev.numTurns,
        totalDurationMs: prev.totalDurationMs + ev.durationMs,
        entries: addEntry(prev.entries, "system", `Iteration ${ev.iteration}: $${ev.costUsd.toFixed(2)}, ${ev.numTurns} turns`),
      }));
    };

    const onMessage = (ev: { message: SDKMessage }) => {
      const msg = ev.message as Record<string, unknown>;

      if (msg.type === "assistant" && "message" in msg) {
        const betaMsg = msg.message as Record<string, unknown>;
        if (betaMsg && Array.isArray(betaMsg.content)) {
          setAppState((prev) => {
            let entries = prev.entries;
            const tools = { ...prev.toolMetrics };

            for (const block of betaMsg.content as Array<Record<string, unknown>>) {
              if (block.type === "text") {
                const text = (block.text as string).slice(0, 200).replace(/\n/g, " ");
                entries = addEntry(entries, "claude", text);
              } else if (block.type === "tool_use") {
                const name = block.name as string;
                const input = JSON.stringify(block.input).slice(0, 120);
                entries = addEntry(entries, "tool", `${name}: ${input}`);
                tools[name] = (tools[name] ?? 0) + 1;
              }
            }

            return { ...prev, entries, toolMetrics: tools };
          });
        }
      } else if (msg.type === "system" && msg.subtype === "init") {
        const model = (msg as Record<string, unknown>).model as string ?? "unknown";
        setAppState((prev) => ({
          ...prev,
          model,
          state: { ...emitter.state } as OrchestratorState,
          entries: addEntry(prev.entries, "system", `Init: model=${model}`),
        }));
      } else if (msg.type === "result") {
        const cost = msg.total_cost_usd as number;
        const turns = msg.num_turns as number;
        setAppState((prev) => ({
          ...prev,
          state: { ...emitter.state } as OrchestratorState,
          entries: addEntry(prev.entries, "system", `Result: ${turns} turns, $${typeof cost === "number" ? cost.toFixed(2) : "?"}`),
        }));
      } else if (msg.type === "tool_use_summary") {
        const summary = (msg as Record<string, unknown>).summary as string;
        if (summary) {
          setAppState((prev) => ({
            ...prev,
            entries: addEntry(prev.entries, "tool", summary.slice(0, 200)),
          }));
        }
      }
    };

    const onError = (ev: { iteration: number; error: string; backoffMs: number }) => {
      setAppState((prev) => ({
        ...prev,
        state: { ...emitter.state } as OrchestratorState,
        entries: addEntry(prev.entries, "error", `Iteration ${ev.iteration}: ${ev.error}`),
      }));
    };

    const onSignal = (ev: { signal: string }) => {
      setAppState((prev) => ({
        ...prev,
        entries: addEntry(prev.entries, "system", `Signal: ${ev.signal}`),
      }));
    };

    const onCompletion = (ev: { allPassed: boolean; summary: string }) => {
      setAppState((prev) => ({
        ...prev,
        entries: addEntry(prev.entries, ev.allPassed ? "system" : "warn", ev.allPassed ? "All checks passed" : `Checks failed: ${ev.summary}`),
      }));
    };

    const onStagnation = (ev: { stagnantCount: number }) => {
      setAppState((prev) => ({
        ...prev,
        entries: addEntry(prev.entries, "warn", `Stagnation: ${ev.stagnantCount} unchanged iterations`),
      }));
    };

    const onTimeout = () => {
      setAppState((prev) => ({
        ...prev,
        entries: addEntry(prev.entries, "warn", "Timed out"),
      }));
    };

    const onDone = (ev: { status: string; iterations: number; totalCostUsd: number }) => {
      setAppState((prev) => ({
        ...prev,
        state: { ...emitter.state } as OrchestratorState,
        entries: addEntry(prev.entries, "system", `Done: ${ev.status}, ${ev.iterations} iterations, $${ev.totalCostUsd.toFixed(2)}`),
      }));
    };

    emitter.on("iteration:start", onIterStart);
    emitter.on("iteration:end", onIterEnd);
    emitter.on("message", onMessage);
    emitter.on("error", onError);
    emitter.on("signal", onSignal);
    emitter.on("completion", onCompletion);
    emitter.on("stagnation", onStagnation);
    emitter.on("timeout", onTimeout);
    emitter.on("done", onDone);

    return () => {
      emitter.off("iteration:start", onIterStart);
      emitter.off("iteration:end", onIterEnd);
      emitter.off("message", onMessage);
      emitter.off("error", onError);
      emitter.off("signal", onSignal);
      emitter.off("completion", onCompletion);
      emitter.off("stagnation", onStagnation);
      emitter.off("timeout", onTimeout);
      emitter.off("done", onDone);
    };
  }, [emitter]);

  // Keyboard handling
  useInput((input, key) => {
    // F-key detection: terminal sends escape sequences
    // F1 = \x1bOP or \x1b[11~, F2 = \x1bOQ or \x1b[12~, F4 = \x1bOS or \x1b[14~
    // Since useInput doesn't expose F-keys directly, we use letter alternatives

    if (input === "h" && !showTaskForm) {
      setShowHelp((p) => !p);
      return;
    }
    if (input === "n" && !showHelp) {
      setShowTaskForm((p) => !p);
      return;
    }
    if (input === "t" && !showHelp && !showTaskForm) {
      emitter.abort();
      setAppState((prev) => ({
        ...prev,
        entries: addEntry(prev.entries, "warn", "Force timeout triggered (F4/t)"),
      }));
      return;
    }

    if (key.upArrow) {
      setScrollOffset((p) => Math.min(p + 1, Math.max(0, appState.entries.length - 10)));
    }
    if (key.downArrow) {
      setScrollOffset((p) => Math.max(0, p - 1));
    }
    if (key.home) {
      setScrollOffset(Math.max(0, appState.entries.length - 10));
    }
    if (key.end) {
      setScrollOffset(0);
    }
  });

  const avgTurnSec = appState.totalTurns > 0
    ? (appState.totalDurationMs / 1000) / appState.totalTurns
    : 0;

  return (
    <Box flexDirection="column" width="100%">
      <Box justifyContent="center">
        <Text bold color="cyan">DarkDelve Orchestrator</Text>
      </Box>

      <StatusBar
        state={appState.state}
        model={appState.model}
        elapsed={formatElapsed(elapsedMs)}
      />

      <ProgressPanel
        iteration={appState.state.iteration}
        maxIterations={task.maxIterations}
        costUsd={appState.state.totalCostUsd}
        maxBudgetUsd={task.maxBudgetUsd}
        elapsedMs={elapsedMs}
        maxHours={task.maxHours}
        compactions={appState.state.compactions}
        stagnantCount={appState.state.stagnantCount}
        errorCount={appState.state.errors.length}
      />

      {showHelp ? (
        <HelpScreen visible={true} />
      ) : showTaskForm ? (
        <TaskForm visible={true} />
      ) : (
        <ActivityLog
          entries={appState.entries}
          maxVisible={15}
          scrollOffset={scrollOffset}
        />
      )}

      <MetricsPanel
        tools={appState.toolMetrics}
        avgTurnSeconds={avgTurnSec}
      />

      <Box paddingX={1} gap={2}>
        <Text dimColor>F1/<Text bold>h</Text> Help</Text>
        <Text dimColor>F2/<Text bold>n</Text> New Task (v2)</Text>
        <Text dimColor>F4/<Text bold>t</Text> Force Timeout</Text>
        <Text dimColor>Ctrl+C Quit</Text>
      </Box>
    </Box>
  );
}

export function renderApp(emitter: OrchestratorEmitter, task: TaskConfig, config: RuntimeConfig): void {
  render(<Dashboard emitter={emitter} task={task} config={config} />);
}

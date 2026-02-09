import React from "react";
import { Box, Text } from "ink";

export interface LogEntry {
  time: string;
  source: "claude" | "tool" | "system" | "error" | "warn";
  text: string;
}

interface TaskDetailProps {
  entries: LogEntry[];
  maxVisible: number;
  scrollOffset: number;
}

const SOURCE_COLORS: Record<string, string> = {
  claude: "cyan",
  tool: "blue",
  system: "gray",
  error: "red",
  warn: "yellow",
};

export function TaskDetail({ entries, maxVisible, scrollOffset }: TaskDetailProps) {
  const start = Math.max(0, entries.length - maxVisible - scrollOffset);
  const visible = entries.slice(start, start + maxVisible);

  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      <Box justifyContent="space-between">
        <Text bold dimColor>─ Activity ─</Text>
        {entries.length > maxVisible && (
          <Text dimColor>↕ {entries.length} lines</Text>
        )}
      </Box>
      {visible.map((entry, i) => (
        <Box key={`${start + i}`}>
          <Text dimColor>{entry.time} </Text>
          <Box width={8}>
            <Text color={SOURCE_COLORS[entry.source] ?? "white"}>{entry.source.padEnd(7)}</Text>
          </Box>
          <Text color={SOURCE_COLORS[entry.source] ?? "white"} wrap="truncate">
            {entry.text}
          </Text>
        </Box>
      ))}
      {visible.length === 0 && <Text dimColor>  Waiting for activity...</Text>}
    </Box>
  );
}

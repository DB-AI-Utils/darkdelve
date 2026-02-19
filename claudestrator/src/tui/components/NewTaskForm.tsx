import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import { existsSync } from "fs";
import { resolve } from "path";
import type { TaskCreateInput } from "../../types.js";

interface NewTaskFormProps {
  onSubmit: (input: TaskCreateInput) => void;
  onCancel: () => void;
}

interface FormField {
  label: string;
  key: string;
  defaultValue: string;
  required?: boolean;
}

const FIELDS: FormField[] = [
  { label: "Project directory", key: "projectDir", defaultValue: "." },
  { label: "Prompt", key: "prompt", defaultValue: "", required: true },
  { label: "Max iterations", key: "maxIterations", defaultValue: "10" },
  { label: "Max budget (USD)", key: "maxBudgetUsd", defaultValue: "30" },
  { label: "Max hours", key: "maxHours", defaultValue: "4" },
  { label: "Turns per iteration", key: "turnsPerIteration", defaultValue: "30" },
  { label: "Test command", key: "completionCmd", defaultValue: "" },
  { label: "Review prompt", key: "reviewPrompt", defaultValue: "" },
];

interface FormFieldRowProps {
  field: FormField;
  isFocused: boolean;
  onChange: (key: string, value: string) => void;
  onSubmit: () => void;
}

function FormFieldRow({ field, isFocused, onChange, onSubmit }: FormFieldRowProps) {
  const handleChange = useCallback(
    (value: string) => onChange(field.key, value),
    [onChange, field.key],
  );

  return (
    <Box gap={1}>
      <Box width={22}>
        <Text bold={isFocused} color={isFocused ? "cyan" : undefined}>
          {isFocused ? "▸" : " "} {field.label}:
        </Text>
      </Box>
      <TextInput
        isDisabled={!isFocused}
        defaultValue={field.defaultValue}
        onChange={handleChange}
        onSubmit={onSubmit}
      />
    </Box>
  );
}

export function NewTaskForm({ onSubmit, onCancel }: NewTaskFormProps) {
  const [focusIndex, setFocusIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map((f) => [f.key, f.defaultValue])),
  );
  const [error, setError] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.tab && key.shift) {
      setFocusIndex((p) => (p - 1 + FIELDS.length) % FIELDS.length);
      return;
    }
    if (key.tab) {
      setFocusIndex((p) => (p + 1) % FIELDS.length);
      return;
    }
  });

  const handleChange = useCallback((key: string, value: string) => {
    setValues((prev) => {
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
    setError(null);
  }, []);

  const advanceFocus = useCallback(() => {
    setFocusIndex((p) => p + 1);
  }, []);

  function handleSubmit() {
    const prompt = values.prompt.trim();
    if (!prompt) {
      setError("Prompt is required");
      return;
    }

    const projectDir = resolve(values.projectDir || ".");
    if (!existsSync(projectDir)) {
      setError(`Directory not found: ${projectDir}`);
      return;
    }

    const maxIterations = parseInt(values.maxIterations, 10);
    const maxBudgetUsd = parseFloat(values.maxBudgetUsd);
    const maxHours = parseFloat(values.maxHours);
    const turnsPerIteration = parseInt(values.turnsPerIteration, 10);

    if (isNaN(maxIterations) || isNaN(maxBudgetUsd) || isNaN(maxHours) || isNaN(turnsPerIteration)) {
      setError("Numeric fields must be valid numbers");
      return;
    }

    const completionCmd = values.completionCmd.trim();
    const reviewPrompt = values.reviewPrompt.trim();
    const checks: Array<{ type: "command"; cmd: string } | { type: "review"; prompt: string }> = [];
    if (completionCmd) checks.push({ type: "command", cmd: completionCmd });
    if (reviewPrompt) checks.push({ type: "review", prompt: reviewPrompt });

    onSubmit({
      prompt,
      projectDir,
      maxIterations,
      maxBudgetUsd,
      maxHours,
      turnsPerIteration,
      completionChecks: checks.length > 0 ? checks : undefined,
    });
  }

  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      <Text bold dimColor>─ New Task ─</Text>

      {FIELDS.map((field, i) => (
        <FormFieldRow
          key={field.key}
          field={field}
          isFocused={i === focusIndex}
          onChange={handleChange}
          onSubmit={i === FIELDS.length - 1 ? handleSubmit : advanceFocus}
        />
      ))}

      {error && (
        <Box paddingTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}

      <Box paddingTop={1} gap={2}>
        <Text dimColor><Text bold>Tab</Text> Next field</Text>
        <Text dimColor><Text bold>Enter</Text> Submit/Next</Text>
        <Text dimColor><Text bold>Esc</Text> Cancel</Text>
      </Box>
    </Box>
  );
}

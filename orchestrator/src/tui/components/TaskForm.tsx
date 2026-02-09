import React from "react";
import { Box, Text } from "ink";

interface TaskFormProps {
  visible: boolean;
}

export function TaskForm({ visible }: TaskFormProps) {
  if (!visible) return null;

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="yellow"
      paddingX={2}
      paddingY={1}
      marginX={4}
      marginY={1}
    >
      <Text bold color="yellow">New Task</Text>
      <Text> </Text>
      <Text dimColor>Task creation is not yet implemented (v2).</Text>
      <Text dimColor>Press <Text bold>n</Text> or <Text bold>F2</Text> to close.</Text>
    </Box>
  );
}

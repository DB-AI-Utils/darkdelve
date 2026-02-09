import React from "react";
import { Box, Text } from "ink";

interface HelpScreenProps {
  visible: boolean;
}

export function HelpScreen({ visible }: HelpScreenProps) {
  if (!visible) return null;

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
      marginX={4}
      marginY={1}
    >
      <Text bold color="cyan">Keyboard Shortcuts</Text>
      <Text> </Text>
      <Text>  <Text bold>F1</Text> / <Text bold>h</Text>      Toggle this help screen</Text>
      <Text>  <Text bold>F2</Text> / <Text bold>n</Text>      New task (v2 — not yet implemented)</Text>
      <Text>  <Text bold>F4</Text> / <Text bold>t</Text>      Force timeout current iteration</Text>
      <Text>  <Text bold>↑/↓</Text>          Scroll activity log</Text>
      <Text>  <Text bold>Home/End</Text>      Jump to top/bottom of log</Text>
      <Text>  <Text bold>Ctrl+C</Text>        Quit orchestrator</Text>
      <Text> </Text>
      <Text dimColor>Press <Text bold>h</Text> or <Text bold>F1</Text> to close</Text>
    </Box>
  );
}

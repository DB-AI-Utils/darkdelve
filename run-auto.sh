#!/bin/bash
set -euo pipefail

TASK_FILE="${1:?Usage: ./run-auto.sh <task-file>}"

echo "Starting autonomous run: $TASK_FILE"
echo "Logs: .orchestrator/logs/"
echo ""

TASK_FILE="$TASK_FILE" docker compose --profile auto run --rm darkdelve-auto

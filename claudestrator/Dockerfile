FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl ca-certificates openssh-client ripgrep \
    && rm -rf /var/lib/apt/lists/*

# Install Claude CLI and Codex MCP
RUN npm install -g @anthropic-ai/claude-code @openai/codex

# Copy compiled worker code
COPY dist/ /app/dist/
COPY package.json /app/package.json

WORKDIR /app

# Install production dependencies only
RUN npm install --omit=dev

# Copy init script
COPY init.sh /app/init.sh
RUN chmod +x /app/init.sh

# UID/GID mapped at runtime via --user flag
RUN useradd -m -s /bin/bash coder
USER coder
ENV HOME=/home/coder

# Git config for commits inside container
RUN git config --global user.name "Claudestrator" \
    && git config --global user.email "claudestrator@local" \
    && git config --global --add safe.directory /workspace

# Pre-create directories Claude CLI and Codex need to write to
RUN mkdir -p /home/coder/.claude/debug \
             /home/coder/.claude/todos \
             /home/coder/.claude/cache \
             /home/coder/.claude/plugins \
             /home/coder/.claude/session-env \
             /home/coder/.codex

WORKDIR /workspace

ENTRYPOINT ["/app/init.sh"]

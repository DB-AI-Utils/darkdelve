FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl ca-certificates openssh-client ripgrep \
    && rm -rf /var/lib/apt/lists/*

# Install Claude CLI (needed for login and Agent SDK)
RUN npm install -g @anthropic-ai/claude-code

# Copy compiled worker code
COPY dist/ /app/dist/
COPY package.json /app/package.json

WORKDIR /app

# Install production dependencies only
RUN npm install --omit=dev

# UID/GID mapped at runtime via --user flag
RUN useradd -m -s /bin/bash coder
USER coder
ENV HOME=/home/coder

# Git config for commits inside container
RUN git config --global user.name "Claudestrator" \
    && git config --global user.email "claudestrator@local"

# Pre-create directories Claude CLI needs to write to
RUN mkdir -p /home/coder/.claude/debug \
             /home/coder/.claude/todos \
             /home/coder/.claude/cache \
             /home/coder/.claude/plugins \
             /home/coder/.claude/session-env

WORKDIR /workspace

ENTRYPOINT ["node", "/app/dist/worker.js"]

# Codex MCP Debug Reference

## Root Cause: Approval Prompt Hang

**The #1 reason Codex MCP hangs**: Codex tries to run shell commands (e.g. `rg`, `cat`, piped commands) to answer your prompt, but the `approval_policy` requires interactive approval. Since it's running as an MCP server (no TTY), nobody can approve, and it waits forever.

### How to confirm this is the issue

Check the Codex internal session log (see "Codex Internal Session Logs" section below). Look for the last entries:

```
function_call: exec_command -> {"cmd":"rg --files src | sort"}   <-- command issued
token_count                                                       <-- last entry, no output follows
```

If the log ends with a `function_call` followed only by `token_count` and no `function_call_output`, Codex is **stuck waiting for approval**.

### The fix

Update `.mcp.json` (or wherever your MCP server is configured) to pass `-c` flags:

```json
"codex": {
  "type": "stdio",
  "command": "codex",
  "args": ["mcp-server", "-c", "approval_policy=never", "-c", "sandbox_mode=read-only"],
  "env": {}
}
```

**Important**: After changing `.mcp.json`, you must **restart the Claude Code session** for it to take effect. Each session spawns its own Codex MCP server process at startup.

### Common mistakes

1. **Adding flags to the wrong place.** The flags must be in the `.mcp.json` file that Claude Code reads (at `<project>/.mcp.json`), not just on a manually-started process. Check the actual process args with `ps aux | grep codex` to verify.

2. **Not restarting the session.** Claude Code spawns the MCP server when the session starts. Changing `.mcp.json` mid-session does nothing — the old process keeps running with old args.

3. **Confusing `trust_level` with `approval_policy`.** In `~/.codex/config.toml`, `trust_level` only controls whether Codex reads project-scoped `.codex/config.toml` files. It does NOT affect `approval_policy`. They are independent settings.

4. **Confusing CLI flags with `-c` config keys.** The interactive `codex` command uses `--ask-for-approval` / `-a` and `--sandbox` / `-s`. The `mcp-server` subcommand only accepts `-c key=value` config overrides. The config key names are `approval_policy` and `sandbox_mode` (underscores, no quotes around value needed in `-c`).

### Gotcha: `turn_context` doesn't reflect `-c` overrides

The `turn_context` entries in Codex's internal session log show `approval_policy` and `sandbox_policy` values from the config.toml / project defaults — **not** the runtime `-c` flag overrides. You'll see `approval_policy: untrusted` even when `-c approval_policy=never` is working correctly.

**Don't use `turn_context` to verify if `-c` flags are applied.** Instead, check whether `function_call` entries are followed by `function_call_output` (commands executing) vs. just `token_count` (hung on approval).

### Why some commands succeed and others hang

With `approval_policy: untrusted`, simple read-only commands like `cat file.txt` are auto-approved ("trusted" commands). But piped commands (`rg --files src | sort`), write commands, or unfamiliar tools may require approval and hang.

---

## Quick Diagnostic Playbook

When a Codex MCP call appears to be hanging:

### Step 1: Find the stuck session via Claude Code debug logs

Debug logs live at `~/.claude/debug/<SESSION_ID>.txt`. They log MCP tool progress every 30s.

```bash
# Find which sessions have active/recent codex activity
for f in $(ls -t ~/.claude/debug/*.txt | head -10); do
    session=$(basename "$f" .txt)
    last=$(grep "codex" "$f" 2>/dev/null | tail -1)
    if [ -n "$last" ]; then
        echo "=== $session ==="
        echo "$last"
        echo
    fi
done
```

A hanging call looks like this — "still running" lines incrementing every 30s with no "completed" line:
```
MCP server "codex": Tool 'codex' still running (1500s elapsed)
MCP server "codex": Tool 'codex' still running (1530s elapsed)
```

A healthy completed call looks like:
```
MCP server "codex": Tool 'codex' completed successfully in 3m 6s
```

### Step 2: Check the Codex internal session log

This is the key step that reveals whether it's an approval hang vs. an API hang.

```bash
# List today's codex sessions, most recent last
ls -lt ~/.codex/sessions/$(date +%Y/%m/%d)/
```

Read the most recent session file to see exactly what Codex was doing:

```python
import json
path = '<most recent .jsonl from above>'
with open(path) as f:
    lines = f.readlines()
print(f'Total lines: {len(lines)}')
for i, line in enumerate(lines):
    obj = json.loads(line)
    ts = obj.get('timestamp', '')
    evt = obj.get('type', '')
    payload = obj.get('payload', {}) or {}
    pt = payload.get('type', '') if isinstance(payload, dict) else ''
    extra = ''
    if pt == 'turn_context':
        extra = f' approval_policy={payload.get("approval_policy")} sandbox={payload.get("sandbox_policy",{}).get("type","")}'
    elif pt == 'function_call':
        extra = f' fn={payload.get("name","")} args={str(payload.get("arguments",""))[:150]}'
    elif pt == 'function_call_output':
        extra = f' output={str(payload.get("output",""))[:150]}'
    elif pt == 'agent_message':
        extra = f' {payload.get("message","")[:120]}'
    print(f'Line {i+1} [{ts}] {evt}{extra}')
```

**What to look for:**
- `turn_context` lines show the **effective** `approval_policy` and `sandbox_policy` — check these match what you intended
- `function_call` → `function_call_output` pairs = commands that completed successfully
- `function_call` → `token_count` with NO `function_call_output` after = **hung on approval**
- Session ends abruptly after a `function_call` = approval hang confirmed

### Step 3: Identify the Codex MCP server process

```bash
# List all codex processes with their parent Claude sessions
ps aux | grep codex | grep -v grep

# Get details: PID, parent PID, start time, CPU, memory
for pid in $(pgrep -f "codex.*mcp-server"); do
    ppid=$(ps -o ppid= -p $pid | tr -d ' ')
    start=$(ps -o lstart= -p $pid)
    cpu=$(ps -o %cpu= -p $pid)
    rss=$(ps -o rss= -p $pid)
    args=$(ps -o args= -p $pid)
    echo "PID $pid | Parent: $ppid | Started: $start | CPU: $cpu% | RSS: ${rss}KB"
    echo "  Args: $args"
done
```

**Check the args** — do they include `-c approval_policy=never`? If not, the fix hasn't been applied.

### Step 4: Check pipe/socket status

```bash
# See what the stuck codex process is waiting on
lsof -p <PID> | grep -i "tcp\|pipe\|socket"
```

- Only PIPE entries (no TCP) = communicating via stdio to Claude Code
- TCP connection in ESTABLISHED state = connection still open but possibly stale
- FD 13 (or similar) pointing to `~/.codex/sessions/...jsonl` = the internal session log file

### Step 5: Resolve

**Option A: Kill just the stuck Codex process**
```bash
kill <CODEX_PID>
```
This terminates the MCP server, causing the tool call to fail in Claude Code. The session can then retry or move on.

**Option B: Kill the parent Claude Code session**
```bash
kill <PARENT_CLAUDE_PID>
```
If the whole session is unresponsive.

**Option C: Wait for timeout**
Claude Code's MCP timeout is `2400000ms` (40 minutes). After that, the tool call auto-fails.

---

## Key Facts

| Fact | Value |
|------|-------|
| Claude Code MCP timeout | 40 minutes (2400000ms) |
| Normal Codex response time | ~3 minutes for plan reviews |
| Codex MCP server version | `0.98.0` (as of 2026-02-09) |
| Codex binary | `~/.nvm/versions/node/v22.14.0/lib/node_modules/@openai/codex/vendor/aarch64-apple-darwin/codex/codex` |
| MCP config file | `<project>/.mcp.json` |
| Codex user config | `~/.codex/config.toml` |
| Codex internal session logs | `~/.codex/sessions/YYYY/MM/DD/*.jsonl` |
| Claude Code debug logs | `~/.claude/debug/<SESSION_ID>.txt` |
| Claude Code session logs | `~/.claude/projects/<project-path>/<SESSION_ID>.jsonl` |
| Claude Code subagent logs | `~/.claude/projects/<project-path>/<SESSION_ID>/subagents/agent-*.jsonl` |

## Codex Config Reference (for MCP server use)

### `approval_policy` (config key) / `--ask-for-approval` (CLI flag)

| Value | Behavior | MCP-safe? |
|-------|----------|-----------|
| `untrusted` | Only "trusted" read-only commands auto-run; others prompt | NO — hangs on non-trivial commands |
| `on-failure` | Auto-run in sandbox; prompt only on failure | MAYBE — hangs on failures |
| `on-request` | Model decides when to ask | NO — can hang |
| `never` | Never prompt, failures go back to model | YES — recommended for MCP |

### `sandbox_mode` (config key) / `--sandbox` (CLI flag)

| Value | Behavior |
|-------|----------|
| `read-only` | Default. Read-only filesystem access |
| `workspace-write` | Can write to workspace directory |
| `danger-full-access` | No sandbox (dangerous) |

### `trust_level` (in `~/.codex/config.toml` under `[projects."<path>"]`)

Only controls whether Codex reads `.codex/config.toml` from inside the project. Does NOT affect `approval_policy` or `sandbox_mode`. Independent setting.

---

## Incident Log

### 2026-02-09: Phase 2 plan review hung for 26+ minutes

- **Session**: `d5fc72f9-5568-4952-9da4-6200272e55ad`
- **Call started**: `20:08:21 UTC` (debug log line 1510)
- **Last seen**: `20:34:21 UTC` — 1560s elapsed, still running
- **Codex PID**: 71925 (parent Claude PID 71871)
- **Process state**: 0% CPU, 16MB RSS — idle/waiting
- **Prompt**: Phase 2 plan review (~4000 chars), model `gpt-5.3-codex`
- **Root cause**: Codex tried to run `rg --files src | sort` (a piped command) with `approval_policy: untrusted`. The pipe required interactive approval. Running as MCP server (no TTY), it hung waiting forever.
- **Evidence from Codex session log** (`~/.codex/sessions/2026/02/09/rollout-2026-02-09T22-08-24-019c4405-01cc-7cc1-ab7b-db3b91e727d1.jsonl`):
  - Line 7: `turn_context` shows `approval_policy: untrusted` despite `-c` flags on a different process
  - Line 13: `exec_command cat .codex/skills/architect/SKILL.md` — succeeded (simple read = auto-approved)
  - Line 22: `exec_command rg --files src | sort` — **hung** (piped command = needs approval)
  - Line 23: `token_count` — last entry. No `function_call_output`. Session log stops.
- **Why the fix didn't work**: The `-c approval_policy="never"` flags were added to a manually-started process (PID 71925), but the `.mcp.json` that Claude Code reads still had plain `["mcp-server"]` with no flags. The session spawned a fresh Codex process using `.mcp.json`, ignoring the manually-started one.
- **Prior successful call**: Session `9596a6f1` completed in 3m 6s — that call didn't trigger commands needing approval, or used only auto-approved reads.

---

## How to Search Session Logs

### Find all Codex tool calls in a Claude Code session JSONL
```python
import json
path = '<SESSION_JSONL_PATH>'
with open(path) as f:
    for i, line in enumerate(f, 1):
        obj = json.loads(line)
        content = obj.get('message', {}).get('content', [])
        if isinstance(content, list):
            for block in content:
                if isinstance(block, dict) and block.get('type') == 'tool_use' and 'codex' in block.get('name', ''):
                    print(f"Line {i}: {block['name']} id={block.get('id')}")
                    inp = block.get('input', {})
                    print(f"  prompt: {inp.get('prompt', '')[:200]}")
                    if 'threadId' in inp:
                        print(f"  threadId: {inp['threadId']}")
```

### Grep for Codex calls across all sessions
```bash
grep -l "mcp__codex__codex" ~/.claude/projects/-Users-dmitriibaranov-Projects-AI-darkdelve/*.jsonl
grep -rl "mcp__codex__codex" ~/.claude/projects/-Users-dmitriibaranov-Projects-AI-darkdelve/*/subagents/
```

### Search for a specific prompt across all sessions
```bash
grep -rl "your search text" ~/.claude/projects/-Users-dmitriibaranov-Projects-AI-darkdelve/*.jsonl
```

## Known Codex Thread IDs

| Thread ID | Purpose |
|-----------|---------|
| `019c4204-026c-77c3-827d-38eb09499aca` | Phase 1 plan review iterations |

## JSONL Structure Reference

### Claude Code session logs

Each line is a JSON object with:
- `type`: `"user"`, `"assistant"`, `"tool_result"`, `"progress"`, etc.
- `message.role`: `"user"`, `"assistant"`, `"tool"`
- `message.content`: string or array of content blocks

Content block types:
- `{ "type": "text", "text": "..." }` — text content
- `{ "type": "tool_use", "id": "toolu_...", "name": "mcp__codex__codex", "input": {...} }` — tool call
- `{ "type": "tool_result", "tool_use_id": "toolu_...", "content": "..." }` — tool response (inside user messages)

Codex tool input fields:
- `prompt` (string) — the message to send
- `model` (string) — e.g. `"gpt-5.3-codex"`
- `threadId` (string, optional) — for `codex-reply` continuations

### Codex internal session logs (`~/.codex/sessions/`)

Each line is a JSON object with `timestamp`, `type`, and `payload`:
- `session_meta` — session start metadata
- `turn_context` — shows effective `approval_policy`, `sandbox_policy`, `model`
- `response_item` with `payload.type: "function_call"` — Codex issuing a shell command
- `response_item` with `payload.type: "function_call_output"` — command result returned
- `response_item` with `payload.type: "message"` — Codex's text response
- `event_msg` with `payload.type: "agent_message"` — streaming text
- `event_msg` with `payload.type: "agent_reasoning"` — reasoning trace
- `event_msg` with `payload.type: "token_count"` — token usage stats

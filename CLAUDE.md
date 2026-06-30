# CLAUDE.md
> This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
> Project-specific instructions. Workflow conventions live in `./workflow/`.

---

## Session startup

Before any meaningful work, read these files in order:

1. `CONTEXT.md` — node inventory, services, stack, design system, hard constraints
2. `tasks/DEVLOG.md` (last 3 entries) — current world state
3. `tasks/todo.md` — phased rollout
4. `tasks/lessons.md` — active prevention rules

**This project runs in the dual-session model** (see `workflow/SESSION-WORKFLOW.md` v2):

- **Local session** (this is normally the one you are): `[homelab-dashboard]-local`
  - Host: athena tmux
  - Process: Claude CLI on athena, started with `claude --remote-control '[homelab-dashboard]-local'`
  - Branch: `claude/local` (work on `feat/<task>` sub-branches off it)
  - Filesystem: full local access (athena's `/home/radxa/...`, Docker, can reach atlas via Tailscale)
  - Use for: design iteration, file edits, debugging, Fastify WS backend dev, SvelteKit dev server, docker compose, anything needing local FS
- **Cloud session** (sibling, long-lived): `[homelab-dashboard]-cloud`
  - Host: Anthropic cloud container (NOT your machine)
  - Process: started from https://claude.ai/code → Code tab → New session → pick repo → pick branch `claude/cloud`
  - Branch: `claude/cloud` (work on `feat/<task>-cloud` sub-branches off it)
  - Filesystem: **ONLY the GitHub repo** (no `~/dev-shared/`, no Docker, no local server, no Tailscale)
  - Use for: `pnpm install`, `pnpm run build`, full e2e audit, anything needing CPU isolation
  - **Cannot do:** access athena systeminformation (no Tailscale, no SSH), access local services, run Docker, see live metrics

**One-time setup** (run on first session per project, on athena):
```bash
cd ~/dev-shared/projects/homelab-dashboard
git branch claude/local main
git branch claude/cloud main
git push origin claude/local claude/cloud
```

**How to start the cloud session:** open https://claude.ai/code → Code tab → New session → pick `vkkatariya/homelab-dashboard` → pick branch `claude/cloud` → rename to `[homelab-dashboard]-cloud`. NOT from the CLI — `claude --remote-control` is a relay, not a cloud container.

**Cross-session handoff:** read top 3 of `tasks/DEVLOG.md` on every resume — the cloud and local sessions log to the same DEVLOG with `cloud-session-start` / `cloud-session-end` / `local-session-handoff` markers so the other side knows what happened. Coordination also happens via git branches and PRs.

## Workflow references (symlinked, homelab-only)

The `./workflow/` directory is a symlink to `~/dev-shared/workflow/` — same path on every machine via mutagen sync. **Do not commit it** (already in `.gitignore`). Read workflow files on demand, not at every session start:

- `./workflow/SESSION-WORKFLOW.md` — Claude Code session lifecycle, dual-session (local relay + Anthropic cloud), lineage branches, /remote-control, compaction
- `./workflow/AI-ROUTING.md` — L1/L2/L3 layer model, tool vs agent routing
- `./workflow/GIT-GITHUB-BLUEPRINT.md` — branch/commit/PR conventions
- `./workflow/agents_workflow/AI-AGENTS-ORCHESTRATION.md` — sub-agent dispatch patterns

If the symlink is broken on a fresh clone, recreate it:
```bash
ln -sf ~/dev-shared/workflow ./workflow
```

## Compaction + /remote-control (project-specific)

- **/remote-control** is the real command (not `/rc` — that's hallucinated)
- **Before manual /compact:** commit, push, append your work-in-progress to `tasks/DEVLOG.md`
- **After /compact** or /clear: re-read top 3 of `tasks/DEVLOG.md`, re-read this CLAUDE.md, check `git status` to reconstruct in-flight work
- **Pro plan 5hr rolling limit:** dual session uses 2 surfaces in parallel. Build + audit in cloud; interactive dev in local

---

## Commands

### Local dev (when Phase 1 starts)
```bash
pnpm install              # install SvelteKit + Fastify deps
pnpm run dev              # SvelteKit dev server
pnpm run build            # production build
```

### Local HTTP server (Phase 0 prototype)
```bash
open prototypes/homelab-dashboard.html
# Or:
python3 -m http.server 8765
# Then open http://localhost:8765/prototypes/homelab-dashboard.html
```

### Backend (when implemented, runs on athena)
```bash
cd /srv/dev-shared/homelab/dashboard
pnpm install
pnpm run dev              # Fastify + WS server
docker compose up -d
# Health: curl http://127.0.0.1:7200/health
```

### CI
- Lint + typecheck + build on every push
- Workflow: `.github/workflows/ci.yml` (skip build if package.json missing)
- Frontend/backend jobs skip if directories don't exist yet (Phase 1 not started)

---

## Architecture

### Current phase: Phase 0 (HTML prototype complete), Phase 1 (Fastify + WS backend) not started

**Single source of truth:** `prototypes/homelab-dashboard.html` — fully functional self-contained dashboard with 3 tabs (Infrastructure / Services / Docs & Blueprints).

### Node inventory
| Node | Hardware | Role | Tailscale |
|---|---|---|---|
| `athena` | Radxa Rock 5T (RK3588J, 16GB, 6 TOPS NPU) | Primary SBC, Docker host, NPU | ✅ |
| `atlas` | Dell OptiPlex 7060 (i7-8700, 24GB) | Proxmox VE, VM/LXC host | ✅ |
| `hermes` | MacBook | Dev workstation | ✅ |
| `erebus` | Oracle Cloud ARM | Cloud egress (planned) | Planned |

### Production stack (target)
| Layer | Tech | Notes |
|---|---|---|
| Frontend | SvelteKit + TypeScript | Route: `vishalkatariya.dev/lab` |
| Realtime | WebSocket (ws) | Push metrics every 2s |
| Backend API | Fastify + TypeScript | REST + WS server on athena |
| Metrics | `systeminformation` npm | CPU, RAM, disk, network |
| Charts | Chart.js 4.x | Port from prototype |
| Process | pm2 | Always-on WS backend on athena |
| Frontend deploy | Vercel | CDN, auto-deploy from git |
| Backend deploy | Docker Compose on athena | Bind mounts, 127.0.0.1 only |
| Docs source | Notion MCP | Read-only, homelab/DIY pages |

### Design system (shared with portfolio)
```css
--bg: #1B1C1D;  --surf: #252527;  --red: #E2201F;  --tx: #F1F0F6;
--green: #3DDC84;  --amber: #FFBB33;  --blue: #5B9CF6;
--glass: rgba(27,28,29,.72);
```
**Typography:** `DM Mono` (all data) + `Syne 800` (display numerals)
**Glass formula:** `backdrop-filter: blur(32px) saturate(180%)` + specular inset
**Dot matrix:** `radial-gradient(circle, rgba(241,240,246,.04) 1px, transparent 1px)` at 20×20px

### Branch strategy
- `main` — trunk
- `feat/<slug>` — feature branches off `main`
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`

### Caddy config pattern (homelab backend)
```caddyfile
lab.auxois-wyrm.ts.net {
    bind <tailscale-ip>
    tls /etc/caddy/certs/athena.auxois-wyrm.ts.net.crt \
        /etc/caddy/certs/athena.auxois-wyrm.ts.net.key
    reverse_proxy 127.0.0.1:7200
}
```

---

## Hard constraints

- **Bind mounts only** — no named Docker volumes
- **Always `cd` into service dir** before `docker compose` commands
- **All services bind to `127.0.0.1`** — never `0.0.0.0` (Docker iptables bypass risk)
- **`systemctl restart caddy`** not `reload` when Caddy is in broken state
- **TLS cert ownership:** `root:caddy 640` key, `root:caddy 644` cert, `root:caddy 750` dir
- **ARM64 discipline:** athena is `aarch64`. Never copy x86 binaries. Always `arch=arm64` in apt sources
- **Tailscale on host, not LXC** — Proxmox WebUI needs Tailscale reachability on the host
- **Proxmox firewall over UFW** — iptables bridge chain conflicts with UFW on Proxmox nodes
- **WebSockets need persistent process** — cannot use serverless functions
- **No public ports** — everything behind Tailscale mesh

---

## Task management

Agents write to `tasks/DEVLOG.md` (newest at top) at the end of every session. Format and required fields are in `AGENTS.md`. This is mandatory — a missing DEVLOG entry breaks the next session's handoff.

Lessons from corrections go in `tasks/lessons.md` (newest at top, numbered L-0NN).

The `ref:resources/` directory exists in this project — note the colon in the name can confuse some git commands; use `--find-renames` when moving files in/out.

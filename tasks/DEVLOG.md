# DEVLOG.md — Homelab Dashboard
> Append-only session log. Written by agents at end of every session. **Newest entry at top.**

---

## 2026-11-02 · Claude Code (local) · chore(ci): add DEVLOG check job

**Mode:** Builder

**Did:** added the `devlog` job to `.github/workflows/ci.yml`, pasted from `workflow/agents_workflow/enforcement/ci-devlog-job.yml`. It fails a pull request that does not change `tasks/DEVLOG.md`. It is the backstop for `--no-verify` and cloud sessions.

**Config change:** file `.github/workflows/ci.yml`; old: no `devlog` job; new: `devlog` job, runs on `pull_request` only; rollback: `git revert 433e0c5`.

**State:** branch `agent/claude-code-config-ci-devlog`, PR open against `main`, not merged.

## 2026-06-06 · Claude (claude.ai) · Project dev setup complete — AGENTS.md, CONTEXT.md, DEVLOG.md, todo.md created

**Mode:** Builder + Strategic

**Did:**
- Created full project dev setup for homelab-dashboard as a standalone project (separate from portfolio-website)
- `CONTEXT.md` — full node inventory (athena/atlas/hermes/erebus), all running services with URLs/ports/status, production stack, WebSocket data model, planned API endpoints, rollout phases (0–6), design system tokens, Docker path conventions, Caddy config pattern, hard constraints, file conventions
- `AGENTS.md` — full behavioural contract: session startup, operating modes, two execution models, homelab-specific rules (infra, WS, Notion, Docker, ARM64, design), workflow rules, DEVLOG hard rule, completion checklist, kickoff prompt
- `DEVLOG.md` — this file, initialised with prototype history
- `tasks/todo.md` — full phased task list (Phase 0 complete, Phases 1–4 queued)
- Fetched live Notion homelab/DIY page to verify node inventory and service list against actual state
- Resolved tailnet name: `auxois-wyrm.ts.net` (previously `tail1a4796.ts.net` from earlier VPS era)

**State:** Dev setup complete. No production code written yet. HTML prototype is the only artefact.

**Decided:**
- Homelab dashboard is a **separate project** from portfolio-website — different repo, different CONTEXT.md, different AGENTS.md. Shares design system tokens only.
- Dashboard backend (Fastify + WS) runs on **athena** (Rock 5T), not VPS — metrics are local to the machine being monitored
- Frontend route: `vishalkatariya.dev/lab` — sub-route of portfolio SvelteKit, NOT a separate deploy
- Notion docs tab uses **MCP read-only** — never writes, 5-minute cache TTL
- WebSocket push interval: 2000ms. Port: 7200 (internal, Caddy proxied)

**Blocked / Next:**
- [ ] Scaffold Fastify project (`api/`) with TypeScript
- [ ] Add `systeminformation` + `ws` dependencies
- [ ] Build `/ws/metrics` endpoint — push CPU/RAM/disk/net every 2s
- [ ] Test WS connection from hermes browser → athena via Tailscale

**Modified:**
- `AGENTS.md` (created)
- `CONTEXT.md` (created)
- `tasks/DEVLOG.md` (created, this entry)
- `tasks/todo.md` (created)

---

## 2026-03-27 · Claude (claude.ai) · Icon system added to homelab dashboard prototype; JS duplicate bug fixed

**Mode:** Builder + Execution

**Did:**
- Added self-contained animated SVG icon system to `homelab-dashboard.html` — all icons inline, zero CDN dependency
- Header: pulsing 3D server rack with red + green LEDs on independent blink timings
- Sidebar labels: server rows (nodes), globe mesh (network), checkmark (rollout)
- Tab buttons: server rows, gear/settings ring, document lines — inherit `currentColor` for active/inactive state
- Widget labels: chip+pins (CPU), RAM stick (memory), HDD platter+arm (storage), SBC board+GPIO (Rock 5T uptime), cloud (VPS uptime), animated mesh (network), spinning gear (services)
- Services full tab: unique SVG per service — OpenWebUI (person), OpenClaw (terminal), Stirling PDF (doc), Cockpit (clock), RustDesk (monitor), Caddy (hexagon); external link arrow on URL entries
- Docs tab: TYPE_ICON map with Blueprint/Roadmap/Notes/Template icons injected into card badges and detail panel header
- Fixed `Uncaught SyntaxError: Identifier 'SVC_ICON' has already been declared` — two separate editing passes both injected `const SVC_ICON` and `const TYPE_ICON` into the same `<script>` block. Removed first (stale) pair, kept second (fuller) pair.

**State:** Prototype fully working. No console errors. Icons animate correctly across all tabs.

**Decided:** Self-contained SVG over Lordicon CDN — CDN unreachable in build env; inline SVGs give full color control, zero latency, work offline.

**Blocked / Next:** Prototype feature-complete. Ready for Fastify WS backend scaffold.

**Modified:** `prototypes/homelab-dashboard.html`

---

## 2026-03-26 · Claude (claude.ai) · Homelab dashboard prototype v1 built

**Mode:** Builder

**Did:**
- Built `homelab-dashboard.html` from scratch — NothingOS + Liquid Glass + Neomorphism design system
- Three-tab layout: Infrastructure (widget grid), Services (list + access URLs), Docs & Blueprints (Notion page viewer)
- Widget grid: NothingOS clock (1×2 with Syne 800 numerals), CPU pie meters (red arc, dark track) for Rock 5T + VPS, RAM horizontal bar (neomorphic inset), storage vertical bars (3-column per drive), uptime rings (accent red border), network sparkline (dual-line canvas — red IN / blue OUT, live-animated), services summary (4×1 all running services)
- Sidebar: node cards with per-node CPU/RAM bar meters (red fill) + status LEDs, Tailscale mesh panel, 5-phase rollout tracker
- Liquid Glass sticky header: `rgba(27,28,29,.72)`, `backdrop-filter: blur(32px) saturate(180%)`, specular inset highlight
- Simulated live metrics: CPU/RAM jitter every 2.2s, network sparkline scrolls in realtime
- JS-rendered doc cards for 7 Notion homelab pages with type badges, status, tags, section count; slide-in detail panel with tabbed sections
- NothingOS `#E2201F` red as sole accent — replaced amber dual-accent from older terminal dashboard
- Responsive: 3-col grid tablet, 2-col mobile, sidebar collapses to drawer (`≡ nodes` toggle), bottom tab bar mobile

**State:** Prototype stable, responsive, no JS errors.

**Decided:**
- Nothing red `#E2201F` is the sole accent — not amber, not dual-accent
- NeoPOP CTAs in vanilla CSS — CRED's npm package is React-only and unmaintained (Oct 2023)
- Split deploy: SvelteKit → Vercel (CDN), Fastify+WS → athena via pm2 (WebSockets need persistent process)
- No homelab dashboard in portfolio v1 — added as `/lab` route later; architecture supports it without migration

**Blocked / Next:** WebSocket backend not built. Dashboard uses simulated data. Rock 5T metrics not connected.

**Modified:** `prototypes/homelab-dashboard.html` (created)

---

<!-- Future entries go above this line -->

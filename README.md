# Homelab Dashboard

Realtime ops dashboard for self-hosted infrastructure — part of `vishalkatariya.dev/lab`.

Built on top of the portfolio-website project. Tailscale-private by default.

## Current state

Fully functional self-contained HTML prototype at `prototypes/homelab-dashboard.html`.  
Production SvelteKit + WebSocket build is **not yet started** — see `tasks/todo.md`.

---

## Node inventory

| Node | Hardware | Role | Status |
|---|---|---|---|
| `athena` | Radxa Rock 5T (RK3588, 16GB, ARM64) | Docker host, primary SBC, NPU | ✅ Online |
| `atlas` | Dell OptiPlex 7060 (i7-8700, 24GB) | Proxmox VE — VMs + LXCs | ✅ Online |
| `hermes` | MacBook | Dev workstation | ✅ Local |
| `erebus` | Oracle Cloud ARM (4 vCPU, 24GB) | Cloud egress / AI (planned) | ⬡ Pending |

Tailnet: `auxois-wyrm.ts.net`

---

## Services running

| Service | Node | URL | Port |
|---|---|---|---|
| OpenWebUI | athena | `openwebui.auxois-wyrm.ts.net` | 3000 |
| OpenClaw | athena | `openclaw.auxois-wyrm.ts.net` | 18789 |
| Stirling PDF | athena | `stirling-pdf.auxois-wyrm.ts.net` | 8080 |
| Cockpit | athena | `rock-5t.auxois-wyrm.ts.net` | 9090 |
| RustDesk | athena | via Tailscale | 21115 |
| Home Assistant | athena (KVM) | 192.168.178.99:8123 | 8123 |
| Proxmox WebUI | atlas | via Tailscale | 8006 |

---

## Dashboard tabs (prototype)

- **Infrastructure** — widget grid: NothingOS clock, CPU pie meters (×2), RAM horizontal bar, storage vertical bars, uptime rings, network sparkline, services summary
- **Services** — full service list with access URLs, ports, node tags, filter by node
- **Docs & Blueprints** — Notion homelab/DIY pages viewer with slide-in detail panel (7 pages: Roadmap, Blueprints, Notes)

---

## Stack

| Layer | Prototype | Production |
|---|---|---|
| Frontend | Self-contained HTML | SvelteKit `/lab` route (in portfolio) |
| Styling | Vanilla CSS (NothingOS) | Shared `tokens.css` from portfolio |
| Realtime | Simulated (JS jitter) | WebSocket — Fastify + `ws` |
| Metrics source | Static mock data | `systeminformation` npm on athena |
| Backend | None | Fastify + TypeScript on athena |
| Process | n/a | pm2 on athena (always-on) |
| Ingress | Browser file:// | Caddy + Tailscale file-cert |
| Docs | Hardcoded JSON | Notion MCP (read-only, 5m cache) |

---

## Design system

**Palette — NothingOS dark:**

```css
--bg:    #1B1C1D;    /* Nothing black */
--surf:  #252527;    /* card surface */
--surf2: #303038;    /* elevated / track */
--red:   #E2201F;    /* Nothing red — sole accent */
--tx:    #F1F0F6;    /* primary text */
--green: #3DDC84;    /* online / success */
--amber: #FFBB33;    /* warning / planned */
--blue:  #5B9CF6;    /* info */
```

**Typography:** `DM Mono` (all data and labels) + `Syne 800` (display numerals)  
**Glass formula:** `backdrop-filter: blur(32px) saturate(180%)` + specular inset  
**Icons:** 34-symbol self-contained inline SVG set — no external CDN

---

## Running locally

```bash
open prototypes/homelab-dashboard.html
# No build step — fully self-contained
```

---

## Docker path convention (athena)

```
/srv/dev-shared/homelab/
├── dashboard/
│   ├── docker-compose.yml
│   ├── api/              ← Fastify + WS source
│   └── config/
├── openwebui/
├── openclaw/
└── stirling-pdf/
```

**Rules:**
- Bind mounts only — no named Docker volumes
- Always `cd` into service dir before `docker compose`
- All services bind to `127.0.0.1:<port>` — never `0.0.0.0`

---

## Repo

```
github.com/vkkatariya/homelab-dashboard   ← (to be created)
```

---

## Agent context files

```
├── AGENTS.md      ← behavioural contract for all AI agents
├── CONTEXT.md     ← stack, infra, conventions — source of truth
├── README.md      ← this file
└── tasks/
    ├── todo.md    ← sprint tracker (Vishal manages)
    ├── DEVLOG.md  ← append-only session log (agents write)
    └── lessons.md ← prevention rules from corrections
```

Start every agent session with:

```
Read: AGENTS.md, CONTEXT.md, last 5 entries of tasks/DEVLOG.md, tasks/todo.md
```

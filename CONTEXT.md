# CONTEXT.md — Homelab Dashboard
> Single source of truth for stack, infrastructure, decisions, and conventions.
> Every agent reads this before touching any file.

---

## What this is
Realtime homelab operations dashboard — part of the `vishalkatariya.dev/lab` route.
Displays live metrics from Rock 5T (athena) and OptiPlex (atlas) nodes.
Tailscale-private by default; public read-only view possible later.
Separate project from the portfolio widget grid — shares the same design system.

---

## Current status
**Phase 0 — HTML Prototype:** COMPLETE
`prototypes/homelab-dashboard.html` — self-contained, NothingOS design, simulated metrics.
**Phase 1 — Production SvelteKit + WebSocket backend:** NOT STARTED

---

## Node Inventory

| Name | Hardware | Role | OS | LAN IP | Tailscale |
|---|---|---|---|---|---|
| `athena` | Radxa Rock 5T (RK3588J, 16GB LPDDR5) | Primary SBC, Docker host, NPU | Radxa OS / Debian + KDE | 192.168.178.198 | ✅ on tailnet |
| `atlas` | Dell OptiPlex 7060 (i7-8700, 24GB) | Proxmox VE, VM/LXC host | Proxmox VE | 192.168.178.x | ✅ on tailnet |
| `hermes` | MacBook | Dev workstation | macOS | — | ✅ on tailnet |
| `erebus` | Oracle Cloud ARM (4 vCPU, 24GB) | Cloud egress / AI workloads | Ubuntu 22.04 | — | Planned |
| Tailnet | — | Mesh VPN | — | — | `auxois-wyrm.ts.net` |

### Proxmox (atlas) conventions
- LXC IDs: `1xx` — LXC containers
- VM IDs: `2xx` — Virtual Machines
- Template IDs: `9xx` — Templates
- Storage: LVM-Thin

### Planned VMs on atlas
| ID | Name | Purpose |
|---|---|---|
| 200 | DietPi | Lightweight services |
| 201 | HAOS | Home Assistant OS |
| 203 | ZimaOS | NAS management |

---

## Services Running

| Service | Node | URL | Port | Status |
|---|---|---|---|---|
| OpenWebUI | athena | `openwebui.auxois-wyrm.ts.net` | 3000 | ✅ Running |
| OpenClaw | athena | `openclaw.auxois-wyrm.ts.net` | 18789 | ✅ Running |
| Stirling PDF | athena | `stirling-pdf.auxois-wyrm.ts.net` | 8080 | ✅ Running |
| Cockpit | athena | `rock-5t.auxois-wyrm.ts.net` | 9090 | ✅ Running |
| RustDesk | athena | via Tailscale | 21115 | ✅ Running |
| Caddy (athena) | athena | — | 443 | ✅ Running |
| Home Assistant | athena (KVM) | 192.168.178.99:8123 | 8123 | ✅ Running |
| Proxmox WebUI | atlas | via Tailscale | 8006 | ✅ Running |
| Ollama + rkllama | athena | local | 11434 | ✅ Running |
| Gitea | Planned | — | — | ⬡ Planned |
| Woodpecker CI | Planned | — | — | ⬡ Planned |
| Prometheus + Grafana + Loki | atlas LXC | — | — | ⬡ Planned |

---

## Stack (production target)

| Layer | Technology | Notes |
|---|---|---|
| Frontend | SvelteKit + TypeScript | Route: `vishalkatariya.dev/lab` |
| Styling | NothingOS design system (tokens.css) | Shared with portfolio |
| Charts | Chart.js 4.x | Port from prototype |
| Realtime | WebSocket (ws) | Push metrics to browser |
| Backend API | Fastify + TypeScript | REST + WS server |
| Metrics | `systeminformation` npm | CPU, RAM, disk, network |
| Process | pm2 | Always-on WS backend on athena |
| Deploy (frontend) | Vercel | CDN, auto-deploy from git |
| Deploy (backend) | Docker Compose on athena | Bind mounts, 127.0.0.1 only |
| Ingress | Caddy + Tailscale | File-cert pattern (athena pattern) |
| Docs source | Notion MCP | Read-only, homelab/DIY pages |

---

## Infrastructure (networking)

### Tailscale pattern (athena — file-cert, not plugin)
```
Devices → Tailscale VPN → athena (100.x.x.x) → Caddy (bind Tailscale IP)
                          → TLS: tailscale cert (file-based, root:caddy 640)
                          → reverse_proxy 127.0.0.1:<port>
```

### Docker path convention (athena)
```
/srv/dev-shared/homelab/
├── dashboard/
│   ├── docker-compose.yml
│   ├── api/              ← Fastify + WS source
│   └── config/
├── openwebui/
├── openclaw/
├── stirling-pdf/
└── <service>/            ← one dir per service
```

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

## Design System (shared with portfolio)

**Palette — NothingOS dark:**
```css
--bg:    #1B1C1D;   /* Nothing black */
--surf:  #252527;   /* card surface */
--surf2: #303038;   /* elevated surface / track */
--red:   #E2201F;   /* Nothing red — sole accent */
--tx:    #F1F0F6;   /* primary text */
--tx60:  rgba(241,240,246,.6);
--tx30:  rgba(241,240,246,.3);
--tx12:  rgba(241,240,246,.12);
--green: #3DDC84;   /* online/success */
--amber: #FFBB33;   /* warning/planned */
--blue:  #5B9CF6;   /* info */
--glass: rgba(27,28,29,.72);
```

**Typography:** `DM Mono` (all data, labels, monospace) + `Syne 800` (display numerals)
**Glass formula:** `backdrop-filter: blur(32px) saturate(180%)` + specular inset
**Dot matrix:** `radial-gradient(circle, rgba(241,240,246,.04) 1px, transparent 1px)` at 20×20px
**Icons:** Self-contained inline SVG system (no CDN dependency)
**Neomorphism:** `box-shadow: 4px 4px 14px rgba(0,0,0,.9), -1px -1px 5px rgba(255,255,255,.03), inset 0 1px 0 rgba(255,255,255,.03)`

---

## Dashboard Tabs (from prototype)

| Tab | Contents |
|---|---|
| **Infrastructure** | Widget grid: clock, CPU pie meters, RAM bar, storage verticals, uptime rings, network sparkline, services summary |
| **Services** | Full service list with URLs, ports, node tags, filter by node |
| **Docs & Blueprints** | Notion homelab pages viewer — Roadmap, Blueprints, Notes with slide-in detail panel |

---

## WebSocket data model (planned)

```typescript
// Server pushes this payload every 2s to all connected clients
interface MetricsPush {
  ts: number;                    // epoch ms
  nodes: {
    [nodeId: string]: {
      cpu: number;               // 0–100%
      mem: { used: number; total: number };
      disk: { used: number; total: number }[];
      net: { rx: number; tx: number };  // bytes/s
      uptime: number;            // seconds
      status: 'online' | 'offline' | 'planned';
    }
  };
  services: {
    [name: string]: 'running' | 'stopped' | 'planned';
  };
}
```

---

## API Endpoints (planned)

| Method | Path | Description |
|---|---|---|
| GET | `/api/nodes` | Node inventory + current status |
| GET | `/api/services` | All services with URLs and status |
| GET | `/api/metrics/current` | Snapshot of current metrics |
| GET | `/api/docs` | Notion homelab pages (cached, 5min TTL) |
| WS | `/ws/metrics` | Live metric stream (push every 2s) |

---

## Rollout Phases

| Phase | Focus | Status |
|---|---|---|
| 0 | HTML prototype — NothingOS design, simulated metrics, 3-tab layout | ✅ Done |
| 1 | Fastify + WS backend on athena — systeminformation pipe | Not started |
| 2 | SvelteKit frontend — port tabs to Svelte components | Not started |
| 3 | Notion docs integration — MCP read, cache, serve via API | Not started |
| 4 | Prometheus + Grafana + Loki LXC on atlas — observability stack | Planned |
| 5 | k3s cluster (3× mini PC) — stateless workloads | Planned |
| 6 | VLAN segmentation — IoT/homelab/trusted/guest isolation | Planned |

---

## Hard Constraints

- **Bind mounts only** — no named Docker volumes. Data must be inspectable.
- **Always `cd` into service dir** before any `docker compose` command.
- **All services bind to `127.0.0.1`** — never `0.0.0.0`. Docker iptables bypass risk.
- **`systemctl restart caddy`** not `reload` when Caddy is in broken state.
- **TLS cert ownership:** `root:caddy 640` key, `root:caddy 644` cert, `root:caddy 750` dir.
- **ARM64 discipline:** athena is `aarch64`. Never copy x86 binaries. Always `arch=arm64` in apt sources.
- **Tailscale on host, not LXC** — Proxmox WebUI needs Tailscale reachability on the host.
- **Proxmox firewall over UFW** — iptables bridge chain conflicts with UFW on Proxmox nodes.
- **WebSockets need persistent process** — cannot use serverless functions. Must use pm2 on athena.
- **No public ports** — everything behind Tailscale mesh.

---

## File Conventions

| Pattern | Usage |
|---|---|
| kebab-case | All filenames |
| `src/lib/components/` | SvelteKit components |
| `src/lib/styles/tokens.css` | Shared design tokens |
| `src/lib/api/` | API client + WS client helpers |
| `api/src/routes/` | Fastify route handlers |
| `api/src/ws/` | WebSocket server logic |
| `api/src/metrics/` | systeminformation collectors |

---

## Current Focus
[Update this line each sprint]
`Prototype complete. Next: scaffold Fastify WS backend, pipe systeminformation from athena.`

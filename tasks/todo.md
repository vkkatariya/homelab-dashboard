# tasks/todo.md — Homelab Dashboard
> Current sprint items. Vishal manages this file.
> Agents: read at session start. Mark items complete as you go.

---

## Status legend
- `[ ]` — queued
- `[~]` — in progress
- `[x]` — done
- `[!]` — blocked

---

## Phase 0 — HTML Prototype ✅ COMPLETE

- [x] NothingOS design system (palette, typography, glass, neomorphism, dot matrix)
- [x] Three-tab layout: Infrastructure / Services / Docs & Blueprints
- [x] Widget grid: clock, CPU pie (×2), RAM bar, storage verticals, uptime rings, network sparkline
- [x] Simulated live metrics (CPU/RAM jitter, sparkline animation)
- [x] Sidebar: node cards, Tailscale mesh panel, rollout phase tracker
- [x] Services tab: full list with URLs/ports/node tags, filter by node
- [x] Docs tab: 7 Notion homelab pages, slide-in detail panel with tabbed sections
- [x] Responsive: 3-col tablet, 2-col mobile, drawer sidebar, bottom tab bar
- [x] SVG icon system (inline, no CDN): header, sidebar, all widget labels, service icons, type icons
- [x] Fixed duplicate const SVC_ICON / TYPE_ICON declaration bug
- [x] Project dev setup: AGENTS.md, CONTEXT.md, DEVLOG.md, todo.md

---

## Phase 1 — Fastify + WebSocket Backend

### 1a — Project scaffold
- [ ] `mkdir -p /srv/dev-shared/homelab/dashboard/api && cd api`
- [ ] `npm init -y && npx tsc --init`
- [ ] Install: `fastify`, `@fastify/websocket`, `systeminformation`, `ws`, `dotenv`
- [ ] Install dev: `typescript`, `ts-node`, `nodemon`, `@types/ws`, `@types/node`
- [ ] Create `src/index.ts` — Fastify server entry point, bind `127.0.0.1:7200`

### 1b — Metrics collector
- [ ] `src/metrics/collector.ts` — systeminformation polling class
  - [ ] `currentLoad()` → CPU percent
  - [ ] `mem()` → used/total bytes
  - [ ] `fsSize()` → per-disk used/total
  - [ ] `networkStats()` → rx_sec / tx_sec bytes per interface
  - [ ] `time()` → uptime seconds
- [ ] Poll interval: 2000ms, store latest snapshot
- [ ] Graceful shutdown: clear polling interval on SIGTERM

### 1c — WebSocket endpoint
- [ ] `src/ws/metrics.ts` — WS handler
  - [ ] Register `@fastify/websocket` plugin
  - [ ] Route: `GET /ws/metrics` → upgrade to WS
  - [ ] On connect: send current snapshot immediately
  - [ ] Push snapshot every 2000ms to all connected clients
  - [ ] Handle disconnect: remove client from set
  - [ ] Payload format: `MetricsPush` interface (see CONTEXT.md)

### 1d — REST endpoints
- [ ] `GET /api/nodes` — static node inventory from config
- [ ] `GET /api/services` — static service registry from config
- [ ] `GET /api/metrics/current` — latest snapshot (no WS needed for initial load)
- [ ] `GET /api/docs` — proxy to Notion MCP, 5-min cache, return homelab pages

### 1e — pm2 setup on athena
- [ ] `pm2 start src/index.ts --name homelab-dashboard-api --interpreter ts-node`
- [ ] `pm2 save && pm2 startup`
- [ ] Verify: `pm2 status` shows `online`

### 1f — Caddy config
- [ ] Add block to Caddyfile on athena:
  ```caddyfile
  lab.auxois-wyrm.ts.net {
      bind <tailscale-ip>
      tls /etc/caddy/certs/athena.auxois-wyrm.ts.net.crt \
          /etc/caddy/certs/athena.auxois-wyrm.ts.net.key
      reverse_proxy 127.0.0.1:7200
  }
  ```
- [ ] `tailscale cert --cert-file ... --key-file ... athena.auxois-wyrm.ts.net`
- [ ] `chown root:caddy key && chmod 640 key && chmod 644 cert`
- [ ] `sudo caddy fmt --overwrite && sudo caddy validate && sudo systemctl restart caddy`
- [ ] Verify: WS connects from hermes browser via `wss://lab.auxois-wyrm.ts.net/ws/metrics`

---

## Phase 2 — SvelteKit Frontend

### 2a — Route setup
- [ ] Add `/lab` route to portfolio SvelteKit project
- [ ] `src/routes/lab/+layout.svelte` — shared sidebar + tab bar
- [ ] `src/routes/lab/+page.svelte` — Infrastructure tab (default)
- [ ] `src/routes/lab/services/+page.svelte` — Services tab
- [ ] `src/routes/lab/docs/+page.svelte` — Docs tab

### 2b — WS client
- [ ] `src/lib/ws/metricsStore.ts` — Svelte writable store fed by WebSocket
  - [ ] Auto-connect to `wss://lab.auxois-wyrm.ts.net/ws/metrics`
  - [ ] Exponential backoff on disconnect (start 1s, max 30s)
  - [ ] Export: `metricsStore`, `wsStatus` ('connecting'|'open'|'closed')

### 2c — Widget components
- [ ] Port from HTML prototype to Svelte components:
  - [ ] `ClockWidget.svelte` — live clock, date, uptime status
  - [ ] `CpuPie.svelte` — circular pie meter, takes `{pct, label, node}`
  - [ ] `RamBar.svelte` — horizontal bar, takes `{used, total}`
  - [ ] `StorageVbars.svelte` — vertical bar columns per drive
  - [ ] `NetworkSparkline.svelte` — canvas sparkline, takes `{history}` array
  - [ ] `UptimeRing.svelte` — uptime counter, takes `{seconds}`
  - [ ] `ServicesGrid.svelte` — service badges with status dots
- [ ] All components subscribe to `metricsStore`

### 2d — Docs tab (Notion integration)
- [ ] `src/routes/lab/docs/+page.server.ts` — fetch from `/api/docs`, cache SvelteKit fetch
- [ ] `DocCard.svelte` — card with type badge, status, tags, slide-in trigger
- [ ] `DocPanel.svelte` — slide-in detail with tabbed sections

### 2e — Design tokens
- [ ] Copy NothingOS tokens from prototype to `src/lib/styles/tokens.css`
- [ ] Import in `+layout.svelte` root

---

## Phase 3 — Observability Stack (atlas LXC)

- [ ] Create Proxmox LXC on atlas for observability (ID 110)
- [ ] Install Prometheus + Grafana + Loki in LXC
- [ ] Add node-exporter to athena
- [ ] Prometheus scrape config: athena node-exporter + api metrics endpoint
- [ ] Grafana: homelab overview dashboard
- [ ] Optional: embed Grafana panels in `/lab` route as iframes (Tailscale-only)

---

## Phase 4 — k3s Cluster (future)

- [ ] 3× Beelink SER5 Pro mini PCs
- [ ] Ubuntu Server 22.04 on each
- [ ] k3s install (master + 2 workers)
- [ ] Longhorn for persistent storage
- [ ] Woodpecker CI connected to Gitea
- [ ] Dashboard: add cluster tab with node/pod/workload status

---

## Backlog (unscheduled)

- [ ] HAOS VM on atlas (VM ID 201) — configure and surface HA entities in dashboard
- [ ] Radxa Penta SATA HAT — check Rock 5T compatibility before ordering
- [ ] VLAN segmentation: 10-Trusted / 20-IoT / 30-Homelab / 40-Guest
- [ ] Gitea + Woodpecker CI LXC on atlas
- [ ] GoCardless/Nordigen API for bank sync (finance project dependency)
- [ ] Llama 3.2 3B fine-tune on Rock 5T NPU via Unsloth + QLoRA (DataSpark application)
- [ ] Oracle Cloud (`erebus`) — ARM free tier, Frankfurt, capacity pending
- [ ] Public read-only dashboard mode (non-sensitive subset of metrics, no docs tab)

import { useState, useEffect } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const NODES = [
  {
    id: "rock5t",
    name: "rock-5t",
    role: "Primary SBC",
    ip: "100.x.x.x",
    lan: "192.168.178.198",
    os: "Radxa Debian / KDE",
    status: "online",
    cpu: 34,
    mem: 58,
    uptime: "12d 4h",
    services: ["Cockpit", "Caddy", "Tailscale", "RustDesk"],
  },
  {
    id: "vps",
    name: "vps-do",
    role: "VPS · Remote Access",
    ip: "100.94.161.66",
    lan: "—",
    os: "Ubuntu 22.04 LTS",
    status: "online",
    cpu: 18,
    mem: 41,
    uptime: "31d 9h",
    services: ["OpenWebUI", "OpenClaw", "Stirling PDF", "Caddy", "Tailscale"],
  },
  {
    id: "k3s",
    name: "k3s-cluster",
    role: "Mini PC × 3 (Planned)",
    ip: "—",
    lan: "—",
    os: "Ubuntu Server 22.04",
    status: "planned",
    cpu: 0,
    mem: 0,
    uptime: "—",
    services: ["Woodpecker CI", "Traefik", "Longhorn", "Frigate NVR"],
  },
];

const SERVICES = [
  { name: "OpenWebUI",    node: "vps",    url: "openwebui.tail1a4796.ts.net",    port: 3000,  status: "running" },
  { name: "OpenClaw",     node: "vps",    url: "openclaw.tail1a4796.ts.net",      port: 18789, status: "running" },
  { name: "Stirling PDF", node: "vps",    url: "stirling-pdf.tail1a4796.ts.net",  port: 8080,  status: "running" },
  { name: "Cockpit",      node: "rock5t", url: "rock-5t.tail1a4796.ts.net",       port: 9090,  status: "running" },
  { name: "RustDesk",     node: "rock5t", url: "—",                               port: 21115, status: "running" },
  { name: "Caddy (VPS)",  node: "vps",    url: "—",                               port: 443,   status: "running" },
  { name: "Nextcloud",    node: "rock5t", url: "—",                               port: null,  status: "planned" },
  { name: "Jellyfin",     node: "rock5t", url: "—",                               port: null,  status: "planned" },
  { name: "Immich",       node: "rock5t", url: "—",                               port: null,  status: "planned" },
  { name: "Home Assistant", node: "rock5t", url: "—",                             port: null,  status: "planned" },
];

const NOTION_PAGES = [
  {
    id: "homelab-roadmap",
    title: "Homelab Roadmap",
    type: "Roadmap",
    status: "In progress",
    tags: ["VPS", "Radxa", "Mac"],
    bookmarked: true,
    summary: "Master planning document. Architecture overview, hardware specs, phased rollout plan, and budget breakdown for the full homelab stack.",
    sections: [
      { heading: "Architecture Overview", body: "Rock 5T (NAS + Core) · VPS (Remote/AI) · k3s Mini PC Cluster. All connected via Tailscale mesh + local gigabit switch." },
      { heading: "Hardware Specs", body: "Radxa Rock 5T — RK3588, 16–32 GB LPDDR5, dual 2.5 GbE, Wi-Fi 6E, 6 TOPs NPU. Penta SATA HAT for up to 100 TB storage. VPS: Hetzner CX22 or Oracle Cloud Free Tier." },
      { heading: "Node Role Map", body: "Node 1: Rock 5T + Penta HAT → Nextcloud, Jellyfin, AdGuard, Vaultwarden, Immich, Paperless. Node 2: VPS → Tailscale relay, Nginx, Ollama, Open WebUI, Grafana. Nodes 3–5: k3s cluster → Woodpecker CI, Traefik, Longhorn, Frigate." },
      { heading: "Network Architecture", body: "Current: Router → Managed Switch → Rock 5T. Future: VLAN 10 Trusted / VLAN 20 IoT / VLAN 30 Homelab / VLAN 40 Guest." },
      { heading: "Phased Rollout", body: "Phase 1 (Wk 1–2): Armbian, Penta HAT, Docker, Tailscale. Phase 2 (Wk 3–4): Jellyfin, Immich, Paperless. Phase 3 (Wk 5–6): Ollama, Gitea, Prometheus. Phase 4 (Wk 7–10): k3s cluster. Phase 5 (Wk 11–12): VLAN hardening, offsite backup." },
      { heading: "Budget", body: "Rock 5T $140 · Penta HAT $45 · 3× 4 TB HDD $120 · NVMe $25 · 3× Beelink SER5 Pro $540 · Networking $35 · VPS $0–10/mo · Domain ~$10/yr → Total ~$980 one-time." },
      { heading: "Key Design Principles", body: "Tailscale-first networking. Docker Compose for stateful services. k3s for stateless/scalable. VPS as public face — home IP never exposed. Rock 5T NPU for edge AI. GitOps from day 1. 3-2-1 backup rule." },
    ],
  },
  {
    id: "docker-caddy-ts",
    title: "Docker + Caddy + Tailscale",
    type: "Blueprint",
    status: "Operational",
    tags: ["VPS"],
    bookmarked: true,
    summary: "Authoritative VPS reference. All services bind to 127.0.0.1. Single ingress via Caddy + Tailscale plugin. Auto-HTTPS, MagicDNS per service.",
    sections: [
      { heading: "Architecture", body: "Devices → Tailscale tunnel → DigitalOcean VPS → Caddy (Tailscale plugin) → Docker containers on 127.0.0.1. UFW denies all inbound except 443/tcp on tailscale0." },
      { heading: "Core Design Rules", body: "No public exposure — all containers bind 127.0.0.1. Single ingress via Caddy on port 443. Automatic HTTPS via plugin. MagicDNS per service with bind tailscale/<n>. No new UFW rules per service." },
      { heading: "Service Registry", body: "OpenWebUI → openwebui.tail1a4796.ts.net :3000. OpenClaw → openclaw.tail1a4796.ts.net :18789. Stirling PDF → stirling-pdf.tail1a4796.ts.net :8080." },
      { heading: "Docker Compose Rules", body: "Always bind to 127.0.0.1:PORT:PORT — never 0.0.0.0. Use bind mounts not named volumes. Standard path: /srv/dev-shared/homelab/<service>/." },
      { heading: "Add-a-New-Service Checklist", body: "1) Pick port (ss -lntp). 2) Create dir + compose file. 3) Bring up + verify 127.0.0.1 binding. 4) Add Caddy block with bind tailscale/<name>. 5) fmt → validate → reload Caddy. 6) Access at https://<name>.tail1a4796.ts.net. 7) Update Service Registry." },
      { heading: "Disaster Recovery", body: "apt upgrade → Tailscale install → UFW setup → Docker install → Caddy with xcaddy plugin → restore Caddyfile → restore Compose files → docker compose up -d." },
    ],
  },
  {
    id: "setup-secure-vps",
    title: "Setup & Secure VPS/VM",
    type: "Notes",
    status: "Done",
    tags: ["VPS"],
    bookmarked: false,
    summary: "Comprehensive VPS hardening guide. SSH config, UFW baseline, Fail2ban, kernel hardening, Tailscale SSH integration, and ongoing maintenance checklist.",
    sections: [
      { heading: "SSH Hardening", body: "Port 2222 · PermitRootLogin no · PasswordAuthentication no · MaxAuthTries 3 · Ciphers: chacha20-poly1305, aes256-gcm, aes128-gcm · PubkeyAuthentication yes." },
      { heading: "UFW Baseline", body: "Default deny incoming, allow outgoing. Allow 2222/tcp (SSH) and 443/tcp. Enable UFW." },
      { heading: "Fail2ban", body: "jail.local: port = 2222, maxretry = 3, bantime = 3600." },
      { heading: "Other Hardening Layers", body: "unattended-upgrades · rkhunter + chkrootkit · clamav · aide (file integrity) · sysctl kernel hardening (IP spoofing, ICMP redirect disable) · 2FA via libpam-google-authenticator." },
      { heading: "Tailscale SSH Integration", body: "Install via official script (NOT Snap — Snap breaks tailscale set --ssh). ACL requires grants rule (port 22) AND ssh rule. Access: ssh user@<tailscale-ip> — no keys/passwords needed." },
      { heading: "Ongoing Maintenance", body: "Weekly: review logs, check failed logins, verify backups, rootkit scans. Monthly: audit users, review packages, test DR. Quarterly: rotate SSH keys, update TLS certs, full security audit." },
    ],
  },
  {
    id: "cockpit-caddy-ts",
    title: "Cockpit + Caddy + Tailscale",
    type: "Blueprint",
    status: "In progress",
    tags: ["Radxa"],
    bookmarked: false,
    summary: "Rock 5T-specific homelab setup. File-based TLS via tailscale cert, Caddy binds Tailscale IP only, Cockpit Origin config required, systemd cert renewal timer.",
    sections: [
      { heading: "Architecture", body: "Devices → Tailscale VPN → Rock 5T (rock-5t, 100.x.x.x LAN 192.168.178.198) → Caddy (Tailscale IP only) → reverse_proxy https://localhost:9090 (Cockpit)." },
      { heading: "Key Differences vs VPS", body: "No Tailscale plugin — uses file-based tailscale cert. TLS certs via tailscale cert command + systemd monthly renewal timer. Cockpit Origin header required in cockpit.conf or Caddy gets 403." },
      { heading: "Phase 1 — Cockpit", body: "Install from Debian backports (NOT standard apt — provides v287 vs v337+). Source /etc/os-release first. Enable cockpit.socket." },
      { heading: "Phase 3 — TLS Certificate", body: "tailscale cert --cert-file ... --key-file ... rock-5t.tail1a4796.ts.net. Permissions: root:caddy 640 on key (caddy reads via group, PoLP), 644 on cert." },
      { heading: "Cockpit Origin Config", body: "/etc/cockpit/cockpit.conf: Origins = https://rock-5t.tail1a4796.ts.net wss://rock-5t.tail1a4796.ts.net. Without this, Caddy gets 403." },
      { heading: "Errors & Lessons", body: "Outdated Cockpit → use backports target. ${VERSION_CODENAME} literal → source /etc/os-release first. Caddy permission denied → chown root:caddy + chmod 640. Cockpit 403 → add cockpit.conf Origins. apt upgrade breaks Cockpit → always upgrade with backports target." },
    ],
  },
  {
    id: "ssh-setup",
    title: "SSH Setup",
    type: "Notes",
    status: "Done",
    tags: ["VPS"],
    bookmarked: false,
    summary: "SSH key generation, authorized_keys setup, ssh_config for multiple hosts, and agent forwarding configuration.",
    sections: [
      { heading: "Key Generation", body: "ssh-keygen -t ed25519 -C 'comment'. Copy public key via ssh-copy-id or manual append to ~/.ssh/authorized_keys." },
      { heading: "~/.ssh/config", body: "Host aliases with HostName, User, IdentityFile, Port. Separate stanzas per host to avoid conflicts." },
      { heading: "Multiple SSH Keys", body: "One key per service/host. Use IdentityFile per Host block in ~/.ssh/config. AddKeysToAgent yes in ssh_config." },
    ],
  },
  {
    id: "tailscale-ssh",
    title: "SSHoverVPN / Tailscale + Fail2ban",
    type: "Notes",
    status: "Done",
    tags: ["VPS"],
    bookmarked: false,
    summary: "Disable standard SSH after Tailscale SSH is confirmed working. Fail2ban config for custom SSH port.",
    sections: [
      { heading: "Tailscale SSH Setup", body: "tailscale set --ssh. Verify with ssh user@tailscale-ip. Only then disable standard port in UFW." },
      { heading: "Fail2ban for Custom Port", body: "jail.local: set port = 2222. Restart fail2ban. Verify with fail2ban-client status sshd." },
    ],
  },
  {
    id: "docker-install",
    title: "Install Docker on VPS",
    type: "Notes",
    status: "Done",
    tags: ["VPS"],
    bookmarked: false,
    summary: "Official Docker install via get.docker.com. Post-install steps: add user to docker group, enable daemon on boot.",
    sections: [
      { heading: "Install", body: "curl -fsSL https://get.docker.com | sh. Add user: usermod -aG docker $USER." },
      { heading: "Enable on Boot", body: "systemctl enable --now docker. Verify: docker run hello-world." },
    ],
  },
  {
    id: "docker-openwebui",
    title: "Docker / OpenWebUI + Ollama",
    type: "Notes",
    status: "Done",
    tags: ["VPS"],
    bookmarked: false,
    summary: "Compose setup for OpenWebUI + Ollama. Port forwarding via Caddy. GPU passthrough considerations.",
    sections: [
      { heading: "Compose Structure", body: "ollama service on 127.0.0.1:11434. openwebui on 127.0.0.1:3000 with OLLAMA_BASE_URL set." },
      { heading: "Caddy Config", body: "bind tailscale/openwebui → reverse_proxy 127.0.0.1:3000. Auto-HTTPS via Tailscale plugin." },
    ],
  },
  {
    id: "docker-mgmt",
    title: "Docker Management Tools",
    type: "Template",
    status: "Not started",
    tags: ["VPS", "Mac", "Radxa"],
    bookmarked: false,
    summary: "Reusable template for Portainer, Watchtower, and other Docker management utilities across all nodes.",
    sections: [
      { heading: "Portainer", body: "Lightweight Docker UI. Bind to 127.0.0.1:9000. Access via Caddy reverse proxy on Tailscale." },
      { heading: "Watchtower", body: "Auto-updates containers on schedule. configure WATCHTOWER_SCHEDULE cron. Set WATCHTOWER_CLEANUP=true." },
    ],
  },
];

// ─── UTILITIES ───────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  running: "#4ade80",
  planned: "#f59e0b",
  online:  "#4ade80",
  offline: "#ef4444",
  planned_node: "#f59e0b",
};

const TYPE_COLOR = {
  Blueprint: "#60a5fa",
  Roadmap:   "#a78bfa",
  Notes:     "#94a3b8",
  Template:  "#f59e0b",
};

const PHASE_COLOR = {
  "Done":        "#4ade80",
  "In progress": "#f59e0b",
  "Operational": "#4ade80",
  "Not started": "#475569",
};

function StatusDot({ status, size = 8 }) {
  const color = STATUS_COLOR[status] || STATUS_COLOR[status + "_node"] || "#475569";
  return (
    <span style={{
      display: "inline-block",
      width: size,
      height: size,
      borderRadius: "50%",
      backgroundColor: color,
      boxShadow: status === "online" || status === "running" ? `0 0 6px ${color}` : "none",
      flexShrink: 0,
    }} />
  );
}

function MiniBar({ value, color = "#4ade80" }) {
  return (
    <div style={{ width: "100%", height: 3, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 2, transition: "width 1s ease" }} />
    </div>
  );
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function NodeCard({ node, selected, onClick }) {
  const isPlanned = node.status === "planned";
  return (
    <div onClick={onClick} style={{
      padding: "14px 16px",
      borderRadius: 8,
      border: `1px solid ${selected ? "#f59e0b" : "#1e293b"}`,
      background: selected ? "rgba(245,158,11,0.06)" : "rgba(15,23,42,0.6)",
      cursor: "pointer",
      transition: "all 0.15s",
      opacity: isPlanned ? 0.6 : 1,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: selected ? "#f59e0b" : "#e2e8f0", letterSpacing: 0.3 }}>
            {node.name}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{node.role}</div>
        </div>
        <StatusDot status={isPlanned ? "planned" : node.status} size={7} />
      </div>
      {!isPlanned && (
        <>
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: "#475569", fontFamily: "monospace" }}>CPU</span>
              <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>{node.cpu}%</span>
            </div>
            <MiniBar value={node.cpu} color="#4ade80" />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: "#475569", fontFamily: "monospace" }}>MEM</span>
              <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>{node.mem}%</span>
            </div>
            <MiniBar value={node.mem} color="#60a5fa" />
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: "#475569", fontFamily: "monospace" }}>
            ↑ {node.uptime}
          </div>
        </>
      )}
      {isPlanned && (
        <div style={{ fontSize: 10, color: "#f59e0b", fontFamily: "monospace", marginTop: 4 }}>
          ⬡ not provisioned
        </div>
      )}
    </div>
  );
}

function ServiceBadge({ service }) {
  const isRunning = service.status === "running";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 12px",
      background: "rgba(15,23,42,0.8)",
      border: "1px solid #1e293b",
      borderRadius: 6,
      opacity: isRunning ? 1 : 0.5,
    }}>
      <StatusDot status={service.status} size={6} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: "#e2e8f0", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {service.name}
        </div>
        {service.port && <div style={{ fontSize: 10, color: "#475569", fontFamily: "monospace" }}>:{service.port}</div>}
      </div>
      <div style={{ fontSize: 10, color: "#334155", fontFamily: "monospace" }}>
        {service.node === "vps" ? "vps" : "5t"}
      </div>
    </div>
  );
}

function NotionCard({ page, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: "18px 20px",
      background: "rgba(15,23,42,0.7)",
      border: "1px solid #1e293b",
      borderRadius: 10,
      cursor: "pointer",
      transition: "all 0.15s",
      position: "relative",
      overflow: "hidden",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = "#334155";
      e.currentTarget.style.background = "rgba(15,23,42,0.95)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = "#1e293b";
      e.currentTarget.style.background = "rgba(15,23,42,0.7)";
    }}>
      {page.bookmarked && (
        <div style={{ position: "absolute", top: 0, right: 16, fontSize: 10, color: "#f59e0b", letterSpacing: 1, fontFamily: "monospace" }}>
          ★ PINNED
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{
          fontSize: 10, fontFamily: "monospace", letterSpacing: 1,
          padding: "2px 7px", borderRadius: 4,
          border: `1px solid ${TYPE_COLOR[page.type] || "#475569"}`,
          color: TYPE_COLOR[page.type] || "#475569",
        }}>
          {page.type.toUpperCase()}
        </span>
        <span style={{
          fontSize: 10, fontFamily: "monospace",
          color: PHASE_COLOR[page.status] || "#475569",
        }}>
          ● {page.status}
        </span>
      </div>
      <div style={{
        fontSize: 15, fontFamily: "'Crimson Pro', Georgia, serif",
        color: "#f1f5f9", marginBottom: 8, lineHeight: 1.3, fontWeight: 600,
      }}>
        {page.title}
      </div>
      <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 12 }}>
        {page.summary}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {page.tags.map(t => (
          <span key={t} style={{
            fontSize: 10, fontFamily: "monospace",
            padding: "2px 7px", borderRadius: 3,
            background: "#0f172a", border: "1px solid #334155",
            color: "#94a3b8",
          }}>{t}</span>
        ))}
      </div>
      <div style={{
        marginTop: 12, paddingTop: 12, borderTop: "1px solid #1e293b",
        fontSize: 11, color: "#334155", fontFamily: "monospace",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span>{page.sections.length} sections</span>
        <span style={{ marginLeft: "auto" }}>→ open</span>
      </div>
    </div>
  );
}

function NotionDetailPanel({ page, onClose }) {
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!page) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "stretch",
      background: "rgba(2,6,23,0.85)",
      backdropFilter: "blur(4px)",
    }} onClick={onClose}>
      <div style={{ flex: 1 }} />
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(680px, 95vw)",
        background: "#020617",
        borderLeft: "1px solid #1e293b",
        display: "flex", flexDirection: "column",
        overflowY: "auto",
        animation: "slideIn 0.2s ease",
      }}>
        {/* Panel header */}
        <div style={{
          padding: "24px 28px 20px",
          borderBottom: "1px solid #1e293b",
          position: "sticky", top: 0,
          background: "#020617", zIndex: 10,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 10, fontFamily: "monospace", letterSpacing: 1,
                padding: "2px 8px", borderRadius: 4,
                border: `1px solid ${TYPE_COLOR[page.type]}`,
                color: TYPE_COLOR[page.type],
              }}>{page.type.toUpperCase()}</span>
              <span style={{ fontSize: 10, fontFamily: "monospace", color: PHASE_COLOR[page.status] }}>
                ● {page.status}
              </span>
            </div>
            <button onClick={onClose} style={{
              background: "none", border: "1px solid #1e293b",
              color: "#64748b", cursor: "pointer",
              borderRadius: 6, padding: "4px 10px",
              fontSize: 12, fontFamily: "monospace",
            }}>ESC</button>
          </div>
          <h2 style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: 26, color: "#f1f5f9", margin: 0, fontWeight: 700,
            lineHeight: 1.2,
          }}>{page.title}</h2>
          <p style={{ fontSize: 13, color: "#475569", marginTop: 8, lineHeight: 1.6 }}>
            {page.summary}
          </p>
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {page.tags.map(t => (
              <span key={t} style={{
                fontSize: 10, fontFamily: "monospace",
                padding: "2px 7px", borderRadius: 3,
                background: "#0f172a", border: "1px solid #334155", color: "#94a3b8",
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Section nav */}
        <div style={{
          display: "flex", gap: 0,
          borderBottom: "1px solid #1e293b",
          overflowX: "auto",
          flexShrink: 0,
        }}>
          {page.sections.map((s, i) => (
            <button key={i} onClick={() => setActiveSection(i)} style={{
              padding: "10px 16px",
              background: "none",
              border: "none",
              borderBottom: activeSection === i ? "2px solid #f59e0b" : "2px solid transparent",
              color: activeSection === i ? "#f59e0b" : "#475569",
              fontSize: 11, fontFamily: "monospace", cursor: "pointer",
              whiteSpace: "nowrap", transition: "all 0.1s",
            }}>{i + 1}. {s.heading}</button>
          ))}
        </div>

        {/* Section content */}
        <div style={{ flex: 1, padding: "28px" }}>
          {page.sections.map((s, i) => (
            <div key={i} style={{
              display: activeSection === i ? "block" : "none",
            }}>
              <div style={{
                fontFamily: "monospace", fontSize: 11, color: "#f59e0b",
                letterSpacing: 2, marginBottom: 12,
              }}>
                §{String(i + 1).padStart(2, "0")} — {s.heading.toUpperCase()}
              </div>
              <div style={{
                fontSize: 14, color: "#cbd5e1", lineHeight: 1.8,
                fontFamily: "'Crimson Pro', Georgia, serif",
              }}>
                {s.body}
              </div>
            </div>
          ))}

          {/* All sections list */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #0f172a" }}>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#334155", letterSpacing: 2, marginBottom: 12 }}>
              ALL SECTIONS
            </div>
            {page.sections.map((s, i) => (
              <button key={i} onClick={() => setActiveSection(i)} style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", textAlign: "left",
                background: activeSection === i ? "rgba(245,158,11,0.07)" : "none",
                border: "none", borderRadius: 6,
                padding: "8px 10px", cursor: "pointer",
                marginBottom: 2,
              }}>
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "#334155", width: 20 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontSize: 12, fontFamily: "monospace", color: activeSection === i ? "#f59e0b" : "#64748b" }}>
                  {s.heading}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function HomelabDashboard() {
  const [tab, setTab] = useState("docs"); // "infra" | "docs"
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "Blueprint" | "Roadmap" | "Notes" | "Template"
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const filteredServices = selectedNode
    ? SERVICES.filter(s => s.node === selectedNode)
    : SERVICES;

  const filteredPages = filter === "all"
    ? NOTION_PAGES
    : NOTION_PAGES.filter(p => p.type === filter);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        @keyframes slideIn {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e2e8f0",
        fontFamily: "'JetBrains Mono', monospace",
        display: "flex", flexDirection: "column",
      }}>
        {/* ── TOP BAR ── */}
        <div style={{
          height: 52,
          borderBottom: "1px solid #0f172a",
          padding: "0 24px",
          display: "flex", alignItems: "center", gap: 16,
          background: "rgba(2,6,23,0.95)",
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80", animation: "pulse 2.5s infinite" }} />
            <span style={{ fontSize: 13, letterSpacing: 2, color: "#f1f5f9", fontWeight: 500 }}>VISHAL</span>
            <span style={{ fontSize: 13, color: "#1e293b" }}>/</span>
            <span style={{ fontSize: 13, letterSpacing: 1, color: "#64748b" }}>HOMELAB</span>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ fontSize: 11, color: "#334155", letterSpacing: 1 }}>
            {clock.toLocaleTimeString("en-GB", { hour12: false })} UTC
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 6,
            background: "#0f172a", border: "1px solid #1e293b",
            fontSize: 11, color: "#64748b",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
            vishalkatariya.me
          </div>
        </div>

        <div style={{ display: "flex", flex: 1 }}>
          {/* ── SIDEBAR ── */}
          <div style={{
            width: 230,
            borderRight: "1px solid #0f172a",
            padding: "20px 16px",
            display: "flex", flexDirection: "column", gap: 20,
            overflowY: "auto",
            flexShrink: 0,
          }}>
            {/* Nodes */}
            <div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: "#334155", marginBottom: 10, paddingLeft: 2 }}>
                NODES
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {NODES.map(n => (
                  <NodeCard
                    key={n.id}
                    node={n}
                    selected={selectedNode === n.id}
                    onClick={() => {
                      setSelectedNode(selectedNode === n.id ? null : n.id);
                      setTab("infra");
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Network */}
            <div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: "#334155", marginBottom: 10, paddingLeft: 2 }}>
                NETWORK
              </div>
              <div style={{ padding: "10px 12px", background: "#0a0f1e", borderRadius: 8, border: "1px solid #0f172a" }}>
                <div style={{ fontSize: 10, color: "#4ade80", marginBottom: 4, fontFamily: "monospace" }}>
                  ● Tailscale mesh
                </div>
                <div style={{ fontSize: 10, color: "#475569" }}>tail1a4796.ts.net</div>
                <div style={{ marginTop: 8, fontSize: 10, color: "#334155" }}>
                  {SERVICES.filter(s => s.status === "running").length} services running
                </div>
              </div>
            </div>

            {/* Phase progress */}
            <div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: "#334155", marginBottom: 10, paddingLeft: 2 }}>
                ROLLOUT
              </div>
              {[
                { label: "Foundation", done: true },
                { label: "Media & Prod", done: false },
                { label: "AI & Dev", done: false },
                { label: "Kubernetes", done: false },
                { label: "Hardening", done: false },
              ].map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 4,
                    border: `1px solid ${p.done ? "#4ade80" : "#1e293b"}`,
                    background: p.done ? "rgba(74,222,128,0.15)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, color: "#4ade80",
                    flexShrink: 0,
                  }}>
                    {p.done ? "✓" : ""}
                  </div>
                  <span style={{ fontSize: 10, color: p.done ? "#64748b" : "#334155" }}>
                    Ph.{i + 1} {p.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── MAIN CONTENT ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
            {/* Tab bar */}
            <div style={{
              display: "flex", gap: 0,
              borderBottom: "1px solid #0f172a",
              padding: "0 24px",
              background: "rgba(2,6,23,0.8)",
            }}>
              {[
                { id: "infra", label: "Infrastructure" },
                { id: "docs",  label: "Docs & Blueprints" },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  padding: "14px 20px",
                  background: "none", border: "none",
                  borderBottom: tab === t.id ? "2px solid #f59e0b" : "2px solid transparent",
                  color: tab === t.id ? "#f59e0b" : "#334155",
                  fontSize: 11, letterSpacing: 1.5, cursor: "pointer",
                  fontFamily: "monospace",
                  transition: "color 0.1s",
                }}>
                  {t.label.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Infrastructure tab */}
            {tab === "infra" && (
              <div style={{ padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <h2 style={{ fontSize: 15, color: "#94a3b8", fontWeight: 400, letterSpacing: 1 }}>
                    {selectedNode
                      ? `SERVICES — ${NODES.find(n => n.id === selectedNode)?.name}`
                      : "ALL SERVICES"}
                  </h2>
                  {selectedNode && (
                    <button onClick={() => setSelectedNode(null)} style={{
                      background: "none", border: "1px solid #1e293b",
                      color: "#475569", fontSize: 11, fontFamily: "monospace",
                      padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                    }}>
                      ← all nodes
                    </button>
                  )}
                </div>

                {/* Selected node detail */}
                {selectedNode && (
                  <div style={{ marginBottom: 24 }}>
                    {(() => {
                      const n = NODES.find(nd => nd.id === selectedNode);
                      return (
                        <div style={{
                          padding: "16px 20px",
                          background: "rgba(245,158,11,0.04)",
                          border: "1px solid rgba(245,158,11,0.15)",
                          borderRadius: 10,
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                          gap: 16,
                        }}>
                          {[
                            ["HOSTNAME", n.name],
                            ["LAN IP", n.lan],
                            ["TAILSCALE", n.ip],
                            ["OS", n.os],
                            ["UPTIME", n.uptime],
                          ].map(([k, v]) => (
                            <div key={k}>
                              <div style={{ fontSize: 9, color: "#334155", letterSpacing: 2, marginBottom: 4 }}>{k}</div>
                              <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 10,
                }}>
                  {filteredServices.map(s => (
                    <ServiceBadge key={s.name} service={s} />
                  ))}
                </div>

                {/* URL list for running services with URLs */}
                {filteredServices.filter(s => s.url !== "—" && s.status === "running").length > 0 && (
                  <div style={{ marginTop: 28 }}>
                    <div style={{ fontSize: 9, color: "#334155", letterSpacing: 3, marginBottom: 12 }}>
                      ACCESS URLS
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {filteredServices.filter(s => s.url !== "—" && s.status === "running").map(s => (
                        <div key={s.name} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "8px 12px",
                          background: "#0a0f1e", borderRadius: 6,
                          border: "1px solid #0f172a",
                        }}>
                          <StatusDot status="running" size={5} />
                          <span style={{ fontSize: 11, color: "#64748b", width: 100, flexShrink: 0 }}>{s.name}</span>
                          <span style={{ fontSize: 11, color: "#4ade80", fontFamily: "monospace" }}>
                            https://{s.url}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Docs tab */}
            {tab === "docs" && (
              <div style={{ padding: "24px" }}>
                {/* Filter row */}
                <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 9, color: "#334155", letterSpacing: 3, marginRight: 4 }}>FILTER</span>
                  {["all", "Blueprint", "Roadmap", "Notes", "Template"].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                      padding: "5px 12px",
                      background: filter === f ? "rgba(245,158,11,0.1)" : "transparent",
                      border: `1px solid ${filter === f ? "rgba(245,158,11,0.4)" : "#1e293b"}`,
                      borderRadius: 5,
                      color: filter === f ? "#f59e0b" : "#334155",
                      fontSize: 10, fontFamily: "monospace", cursor: "pointer",
                      letterSpacing: 1,
                    }}>
                      {f.toUpperCase()}
                    </button>
                  ))}
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "#334155", fontFamily: "monospace" }}>
                    {filteredPages.length} pages
                  </span>
                </div>

                {/* Pinned */}
                {filter === "all" && (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 9, color: "#334155", letterSpacing: 3, marginBottom: 12 }}>
                      ★ PINNED
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
                      {filteredPages.filter(p => p.bookmarked).map(p => (
                        <NotionCard key={p.id} page={p} onClick={() => setSelectedPage(p)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* All / filtered */}
                <div>
                  {filter === "all" && (
                    <div style={{ fontSize: 9, color: "#334155", letterSpacing: 3, marginBottom: 12 }}>
                      ALL PAGES
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                    {filteredPages.filter(p => filter !== "all" || !p.bookmarked).map(p => (
                      <NotionCard key={p.id} page={p} onClick={() => setSelectedPage(p)} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedPage && (
        <NotionDetailPanel page={selectedPage} onClose={() => setSelectedPage(null)} />
      )}
    </>
  );
}

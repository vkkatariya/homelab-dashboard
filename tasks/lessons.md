# tasks/lessons.md — Homelab Dashboard
> Prevention rules learned from corrections during this project.
> Format: what failed · root cause · prevention rule.
> Agents: read this at session start. Add entries after any correction.

---

## L-001 — Duplicate const declarations crash the whole script

**What failed:** `Uncaught SyntaxError: Identifier 'SVC_ICON' has already been declared` — the dashboard JS became completely non-functional. Both `const SVC_ICON` and `const TYPE_ICON` were declared twice in the same `<script>` block because two separate editing passes each injected them without checking for existing declarations.

**Root cause:** Each editing pass treated the file as a fresh context. The second pass didn't grep for existing `const SVC_ICON` before injecting another one. JavaScript's `const` disallows redeclaration in the same scope — no error is thrown during editing, only at browser parse time.

**Prevention rule:**
- Before injecting any `const`, `let`, or `function` declaration into an existing file: `grep -n "const SVC_ICON\|const TYPE_ICON\|function renderSvcFull"` and assert each appears zero times
- After any injection: run `grep -c "const SVC_ICON"` — must be exactly 1
- When two passes are needed on the same file: explicitly remove stale blocks before re-injecting
- General rule: **search before inject** — never assume a declaration doesn't exist yet

---

## L-002 — CDN assets unavailable in build/sandbox environment

**What failed:** Attempted to use Lordicon CDN (`cdn.lordicon.com`) for animated icons. All 25+ hash URLs returned HTTP 000 (connection timeout) from the build environment. The icon system was planned around external URLs that were unreachable.

**Root cause:** Build/sandbox environment has a strict CDN allowlist. `cdn.lordicon.com` is not on the allowlist. All CDN icon approaches (Lordicon, LottieFiles, etc.) silently fail with 000 status.

**Prevention rule:**
- For any external asset: test reachability with `curl -s -o /dev/null -w "%{http_code}" --max-time 4 <url>` before building around it
- Allowed CDN origins in this environment: `cdnjs.cloudflare.com`, `esm.sh`, `cdn.jsdelivr.net`, `unpkg.com`, `fonts.googleapis.com`, `fonts.gstatic.com`
- For icon systems: use **self-contained inline SVG** — zero CDN dependency, full color control, offline-safe
- Never plan a feature around an external URL without verifying reachability first

---

## L-003 — Tailnet name mismatch between old VPS era and current infra

**What failed:** DEVLOG entries and CONTEXT.md referenced `tail1a4796.ts.net` (the old tailnet from the VPS/DigitalOcean era). The current tailnet is `auxois-wyrm.ts.net`. Any Caddy configs or WS URLs using the old tailnet name would fail silently.

**Root cause:** Context carried over from earlier session notes written when the VPS was the primary node. The tailnet was renamed/changed when infrastructure was migrated on-premises.

**Prevention rule:**
- Always read `CONTEXT.md` at session start — the correct tailnet name is documented there
- When writing any URL, hostname, or Caddy config: reference `CONTEXT.md` node inventory, not memory
- Current tailnet: `auxois-wyrm.ts.net` — use this everywhere
- When in doubt: `tailscale status` on athena to confirm

---

## L-004 — ARM64 binary incompatibility (cross-architecture copy)

**What failed:** (Recorded proactively from known failure pattern.) Attempting to copy npm globals or Node.js binaries from a VPS (x86_64) to athena (aarch64) produces `Exec format error`. Binaries are architecture-specific.

**Root cause:** Assumed binaries are portable. They are not — native bindings are compiled for the host architecture.

**Prevention rule:**
- **Never copy binaries from x86 to ARM64.** Always reinstall natively on athena.
- For npm packages with native bindings: `npm install` directly on athena after SSHing in
- Verify architecture before any binary operation: `uname -m` must show `aarch64` on athena
- apt sources must include `arch=arm64` explicitly when adding new repos on athena

---

## L-005 — Docker containers bound to 0.0.0.0 bypass UFW via iptables

**What failed:** (Recorded proactively from known homelab failure pattern.) A Docker service started with `ports: "8080:8080"` (no IP binding) becomes publicly reachable even with UFW deny rules, because Docker writes its own iptables rules that bypass UFW.

**Root cause:** Docker's iptables integration punches holes in the firewall directly, bypassing UFW's `INPUT` chain rules.

**Prevention rule:**
- **Always bind to `127.0.0.1`** in Docker Compose: `ports: "127.0.0.1:8080:8080"`
- After bringing up any service: `sudo ss -lntp | grep <port>` — must show `127.0.0.1`, never `0.0.0.0`
- Never use `ports: "<port>:<port>"` without an explicit IP binding
- This is in the AGENTS.md verification gate — run it as part of every Docker deployment

---

## L-006 — `systemctl reload caddy` hangs when Caddy is in broken state

**What failed:** (Recorded proactively from known Caddy failure pattern.) When Caddy has a config error or is in a broken state, `systemctl reload caddy` hangs indefinitely — it waits for the old process to acknowledge the reload, which never comes.

**Root cause:** `reload` sends SIGUSR1 to the existing process. A broken Caddy process ignores the signal or cannot process it.

**Prevention rule:**
- Always use `systemctl restart caddy` when Caddy is in any broken or uncertain state
- Use `reload` only when Caddy is confirmed running and healthy
- After any Caddyfile change: `sudo caddy fmt --overwrite && sudo caddy validate --config /etc/caddy/Caddyfile` before reload/restart
- If `systemctl restart caddy` fails: check `journalctl -u caddy -f` for the actual error

---

<!-- Add new lessons above this line using the format: -->
<!-- ## L-00N — Short title -->
<!-- **What failed:** ... -->
<!-- **Root cause:** ... -->
<!-- **Prevention rule:** ... (actionable, specific, testable) -->

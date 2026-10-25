import fs from "fs";
import path from "path";
import { CHEATSHEETS } from "../src/data/cheatsheets";

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

let sql = `-- HackIndex.io Complete Cheatsheets & Commands for Index 389
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

`;

for (const cs of CHEATSHEETS) {
  const slug = `cheatsheet-${cs.id}`;
  let markdown = `# ${cs.title}\n\n`;
  markdown += `**Protocol:** \`${cs.protocol}\` | **Category:** \`${cs.category}\`\n\n`;
  markdown += `> ${cs.summary}\n\n---\n\n`;

  const phases = ["recon", "enumeration", "exploitation", "privesc"] as const;
  for (const p of phases) {
    const cmds = cs.phases[p];
    if (!cmds || cmds.length === 0) continue;
    const phaseName =
      p === "recon"
        ? "Reconnaissance"
        : p === "enumeration"
        ? "Enumeration"
        : p === "exploitation"
        ? "Exploitation"
        : "Privilege Escalation";

    markdown += `## ${phaseName}\n\n`;
    for (const cmd of cmds) {
      markdown += `### ${cmd.label}\n\n${cmd.description}\n\n\`\`\`bash\n${cmd.command}\n\`\`\`\n\n`;
    }
  }

  const title = `${cs.title} (Pentest Cheatsheet)`;
  const folder = cs.category;
  const content = escapeSql(markdown);

  sql += `
  INSERT INTO "KnowledgeDocument" (id, title, slug, folder, category, content, visibility, "isFavorite", "authorId", "createdAt", "updatedAt")
  VALUES (
    'kd_' || substr(md5(random()::text), 1, 16),
    '${escapeSql(title)}',
    '${escapeSql(slug)}',
    '${escapeSql(folder)}',
    'Cheatsheet',
    '${content}',
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
`;
}

sql += `
  RAISE NOTICE 'All HackIndex Cheatsheets populated successfully!';
END $$;
`;

const outputPath = path.join(__dirname, "hackindex_cheatsheets.sql");
fs.writeFileSync(outputPath, sql, "utf-8");
console.log(`✓ Generated ${outputPath} (${sql.length} characters)`);

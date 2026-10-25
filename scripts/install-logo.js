const fs = require("fs");
const path = require("path");

const candidates = [
  "C:/Users/Mushaf/.gemini/antigravity-ide/brain/30f1b261-caba-4707-8ea7-816cd740f383/.user_uploaded/media_1792940626734.png",
];

let sourceFile = null;
for (const cand of candidates) {
  if (fs.existsSync(cand)) {
    sourceFile = cand;
    break;
  }
}

if (!sourceFile) {
  console.error("Could not find uploaded logo file.");
  process.exit(1);
}

const publicDir = path.join(__dirname, "..", "public");
const appDir = path.join(__dirname, "..", "src", "app");

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(appDir)) fs.mkdirSync(appDir, { recursive: true });

const targets = [
  path.join(publicDir, "logo.png"),
  path.join(publicDir, "icon.png"),
  path.join(appDir, "icon.png"),
];

for (const target of targets) {
  fs.copyFileSync(sourceFile, target);
  console.log(`✓ Copied logo to ${target}`);
}

console.log("\nLogo installation complete!");

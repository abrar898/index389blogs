const fs = require("fs");
const path = require("path");

// Read cheatsheets data
const tsContent = fs.readFileSync(path.join(__dirname, "..", "src", "data", "cheatsheets.ts"), "utf-8");

// Simple extraction of the CHEATSHEETS array items
// We can use tsx or compile or simple execution
const { CHEATSHEETS } = require("../src/data/cheatsheets.ts");

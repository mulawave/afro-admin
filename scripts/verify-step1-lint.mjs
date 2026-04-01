import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const srcRoot = path.join(root, "src");

async function walk(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, out);
    } else if (/\.(js|jsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const files = await walk(srcRoot);
if (files.length === 0) {
  throw new Error("No source files found under src/.");
}

for (const file of files) {
  const content = await readFile(file, "utf8");
  const rel = path.relative(root, file);

  if (content.includes("TODO") || content.includes("FIXME")) {
    throw new Error(`Disallowed placeholder marker in ${rel}`);
  }

  if (rel.includes("src/app/(admin)") && content.includes("export default function") && content.includes("return <div>")) {
    // route stub pages are acceptable in Step 1, but they must have non-empty labels
    if (content.includes("<div></div>")) {
      throw new Error(`Empty admin page content in ${rel}`);
    }
  }
}

console.log(`Step 1 lint verification passed across ${files.length} source files.`);

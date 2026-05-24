import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const TEMPLATES_DIR = path.resolve(process.cwd(), "email_templates");

function ensureDir() {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
  }
}

function templateNameFromId(id) {
  return id
    .replace(/\.html$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * GET /api/email-templates
 * Returns list of { id, name } for every .html file in email_templates/.
 */
export async function GET() {
  try {
    ensureDir();
    const files = fs
      .readdirSync(TEMPLATES_DIR)
      .filter((f) => f.endsWith(".html"));

    const templates = files.map((file) => ({
      id: file,
      name: templateNameFromId(file),
      html: fs.readFileSync(path.join(TEMPLATES_DIR, file), "utf8"),
    }));

    return NextResponse.json({ templates });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to list templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email-templates
 * Body: { id: string, html: string }
 * Saves or creates a template file.
 */
export async function POST(request) {
  try {
    ensureDir();
    const body = await request.json();
    const id   = String(body?.id   || "").trim();
    const html = String(body?.html || "").trim();

    if (!id)   return NextResponse.json({ error: "id is required" },   { status: 400 });
    if (!html) return NextResponse.json({ error: "html is required" }, { status: 400 });

    // Sanitise filename — allow only safe characters
    const safe = id.replace(/[^a-z0-9.\-_]/gi, "");
    if (!safe) return NextResponse.json({ error: "Invalid template id" }, { status: 400 });

    const filePath = path.join(TEMPLATES_DIR, safe.endsWith(".html") ? safe : `${safe}.html`);

    // Prevent path traversal
    if (!filePath.startsWith(TEMPLATES_DIR + path.sep) && filePath !== TEMPLATES_DIR) {
      return NextResponse.json({ error: "Invalid template path" }, { status: 400 });
    }

    fs.writeFileSync(filePath, html, "utf8");

    return NextResponse.json({ saved: true, id: path.basename(filePath) });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to save template" },
      { status: 500 }
    );
  }
}

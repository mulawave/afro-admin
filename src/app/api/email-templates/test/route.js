import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const TEMPLATES_DIR = path.resolve(process.cwd(), "email_templates");

function getBackendBase() {
  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://afrovision-backend-134538542038.us-central1.run.app"
  ).replace(/\/$/, "");
}

function withVars(html, vars = {}) {
  return html
    .replace(/\{\{name\}\}/g,  vars.name  || "")
    .replace(/\{\{email\}\}/g, vars.email || "");
}

/**
 * POST /api/email-templates/test
 * Body: { templateId, to, vars }
 * Renders the template with vars then sends via the backend SMTP service.
 */
export async function POST(request) {
  try {
    const body       = await request.json();
    const templateId = String(body?.templateId || "").trim();
    const to         = String(body?.to         || "").trim();
    const vars       = body?.vars || {};

    if (!templateId) return NextResponse.json({ error: "templateId is required" }, { status: 400 });
    if (!to)         return NextResponse.json({ error: "to is required" },         { status: 400 });

    const safe = templateId.replace(/[^a-z0-9.\-_]/gi, "");
    const filePath = path.join(TEMPLATES_DIR, safe.endsWith(".html") ? safe : `${safe}.html`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `Template not found: ${templateId}` }, { status: 404 });
    }

    const rawHtml  = fs.readFileSync(filePath, "utf8");
    const html     = withVars(rawHtml, vars);
    const subject  = `AfroVision — Test email: ${safe.replace(/[-_]/g, " ").replace(/\.html$/, "")}`;

    // Forward to backend
    const token    = request.headers.get("authorization") || "";
    const backendUrl = `${getBackendBase()}/admin/email/send`;

    const backendRes = await fetch(backendUrl, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": token,
      },
      body: JSON.stringify({ toEmail: to, subject, html }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json({ success: false, error: data.error || "Send failed" }, { status: backendRes.status });
    }

    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message || "Test email failed" }, { status: 500 });
  }
}

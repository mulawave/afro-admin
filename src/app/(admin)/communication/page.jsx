"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import NoticeBanner from "@/components/ui/NoticeBanner";
import { getTemplates } from "@/services/emailTemplates";

export default function CommunicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [workspace, setWorkspace] = useState("notices");
  const [mode, setMode] = useState("broadcast");
  const [users, setUsers] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatesError, setTemplatesError] = useState(null);
  // Email compose state
  const [emailTemplateId, setEmailTemplateId] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailVarName, setEmailVarName] = useState("");
  const [emailVarEmail, setEmailVarEmail] = useState("");
  const [emailMode, setEmailMode] = useState("broadcast");
  const [emailUserSearch, setEmailUserSearch] = useState("");
  const [emailUserId, setEmailUserId] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  // Notice compose state
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [title, setTitle] = useState("AfroVision admin notice");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        setLoadingUsers(true);
        const res = await api.get("/admin/users");
        if (!active) return;
        setUsers(res.users ?? []);
        setUsersError(null);
      } catch (err) {
        if (!active) return;
        setUsersError(err.message || "Failed to load users");
      } finally {
        if (active) {
          setLoadingUsers(false);
        }
      }
    }

    loadUsers();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const preselectedRecipient = searchParams.get("recipient") || "";
    if (preselectedRecipient) {
      setMode("direct");
      setSelectedUserId(preselectedRecipient);
    }
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function loadTemplates() {
      try {
        setLoadingTemplates(true);
        const data = await getTemplates();
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setEmailTemplates(list);
        if (list.length && !emailTemplateId) setEmailTemplateId(list[0].id);
        setTemplatesError(null);
      } catch (err) {
        if (!active) return;
        setTemplatesError(err?.message || "Failed to load templates");
      } finally {
        if (active) {
          setLoadingTemplates(false);
        }
      }
    }

    if (workspace === "templates") {
      loadTemplates();
    }

    return () => {
      active = false;
    };
  }, [workspace]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedUser = users.find((user) => user.id === selectedUserId) || null;
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((user) => {
      if (!q) return true;
      return [user.name, user.email, user.id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [userSearch, users]);

  const filteredEmailUsers = useMemo(() => {
    const q = emailUserSearch.trim().toLowerCase();
    return users.filter((user) => {
      if (!q) return true;
      return [user.name, user.email, user.id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [emailUserSearch, users]);

  const selectedEmailUser = users.find((u) => u.id === emailUserId) || null;

  const selectedTemplate = emailTemplates.find((t) => t.id === emailTemplateId) || null;

  const renderedEmailPreview = useMemo(() => {
    if (!selectedTemplate?.html) return "";
    const name  = emailMode === "direct" && selectedEmailUser
      ? (selectedEmailUser.name || selectedEmailUser.email?.split("@")[0] || emailVarName)
      : emailVarName;
    const email = emailMode === "direct" && selectedEmailUser
      ? (selectedEmailUser.email || emailVarEmail)
      : emailVarEmail;
    return selectedTemplate.html
      .replace(/\{\{name\}\}/g,  name  || "")
      .replace(/\{\{email\}\}/g, email || "");
  }, [selectedTemplate, emailMode, selectedEmailUser, emailVarName, emailVarEmail]);

  function handleSendEmail() {
    if (!emailTemplateId || !emailSubject.trim()) return;
    if (emailMode === "direct" && !emailUserId) return;

    const recipientLabel = emailMode === "direct"
      ? (selectedEmailUser?.name || selectedEmailUser?.email || emailUserId)
      : "all users";

    setConfirm({
      title: emailMode === "direct" ? "Send Email to User" : "Broadcast Email",
      message: `Send "${emailSubject}" using template "${selectedTemplate?.name || emailTemplateId}" to ${recipientLabel}?`,
      destructive: false,
      busy: false,
      error: null,
      confirmLabel: emailMode === "direct" ? "Send Email" : "Broadcast Email",
      action: async () => {
        setConfirm((c) => ({ ...c, busy: true, error: null }));
        setEmailSending(true);
        setEmailResult(null);
        try {
          if (emailMode === "direct") {
            const toEmail = selectedEmailUser?.email;
            if (!toEmail) throw new Error("Selected user has no email address on record.");
            const html = renderedEmailPreview;
            await api.post("/admin/email/send", { toEmail, subject: emailSubject.trim(), html });
            setEmailResult({ success: true, text: `Email sent to ${toEmail}.` });
          } else {
            const res = await api.post("/admin/email/broadcast", {
              subject: emailSubject.trim(),
              html: selectedTemplate.html,
            });
            setEmailResult({
              success: true,
              text: `Broadcast complete — ${res.sent ?? 0} sent, ${res.failed ?? 0} failed out of ${res.total ?? 0} users.`,
            });
          }
          return true;
        } catch (err) {
          const msg = err.message || "Failed to send email";
          setEmailResult({ success: false, text: msg });
          setConfirm((c) => ({ ...c, busy: false, error: msg }));
          return false;
        } finally {
          setEmailSending(false);
        }
      },
    });
  }

  function handleSend() {
    if (!title.trim() || !message.trim()) return;
    if (mode === "direct" && !selectedUserId) return;

    setConfirm({
      title: mode === "direct" ? "Send Direct Notice" : "Broadcast Notice",
      message: mode === "direct"
        ? `Send this notice to ${selectedUser?.name || selectedUser?.email || selectedUserId}?`
        : `Broadcast this notice to all users with inbox delivery and push attempts?`,
      destructive: false,
      busy: false,
      error: null,
      confirmLabel: mode === "direct" ? "Send Notice" : "Broadcast Notice",
      action: async () => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        setSending(true);
        setResult(null);
        try {
          if (mode === "direct") {
            await api.post("/notifications/send-user", {
              userId: selectedUserId,
              title: title.trim(),
              body: message.trim(),
              type: "admin_alert",
              source: "push",
              link: link.trim() || undefined,
            });
            setResult({ success: true, text: `Notice sent to ${selectedUser?.email || selectedUserId}.` });
          } else {
            const response = await api.post("/notifications/broadcast", {
              title: title.trim(),
              body: message.trim(),
              type: "admin_alert",
              source: "push",
              link: link.trim() || undefined,
            });
            setResult({
              success: true,
              text: `Broadcast sent to ${response.result?.persisted || 0} inboxes with ${response.result?.successCount || 0} push successes.`,
            });
          }
          setMessage("");
          setLink("");
          if (mode === "direct") {
            setSelectedUserId("");
            setUserSearch("");
          }
          return true;
        } catch (err) {
          const messageText = err.message || "Failed to send notice";
          setResult({ success: false, text: messageText });
          setConfirm((current) => ({ ...current, busy: false, error: messageText }));
          return false;
        } finally {
          setSending(false);
        }
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Communication</h1>
          <p className="mt-2 text-sm text-white/58">Send inbox notices with push delivery attempts, with direct targeting or full-platform broadcast.</p>
        </div>
      </div>

      <NoticeBanner tone="error" message={usersError} />

      <div className="space-y-5 rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div>
          <label className="mb-2 block text-sm font-medium text-white/75">Workspace</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setWorkspace("notices")}
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
                workspace === "notices"
                  ? "border-[var(--av-light-orange)]/40 bg-[rgba(245,193,108,0.12)] text-white"
                  : "border-white/10 bg-white/6 text-white/62 hover:bg-white/10"
              }`}
            >
              Notices
            </button>
            <button
              type="button"
              onClick={() => setWorkspace("templates")}
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
                workspace === "templates"
                  ? "border-[var(--av-light-orange)]/40 bg-[rgba(245,193,108,0.12)] text-white"
                  : "border-white/10 bg-white/6 text-white/62 hover:bg-white/10"
              }`}
            >
              Templates
            </button>
          </div>
        </div>

        {workspace === "templates" ? (
          <div className="space-y-5">
            <NoticeBanner tone="error" message={templatesError} />

            {/* Template picker */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">Template</label>
              {loadingTemplates ? (
                <div className="text-sm text-white/45">Loading templates...</div>
              ) : emailTemplates.length ? (
                <select
                  value={emailTemplateId}
                  onChange={(e) => setEmailTemplateId(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none"
                >
                  {emailTemplates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id} className="text-black">
                      {tpl.name || tpl.id}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <span className="text-sm text-white/45">No templates found.</span>
                  <button
                    type="button"
                    onClick={() => router.push("/email-templates")}
                    className="text-xs text-[var(--av-light-orange)] underline"
                  >
                    Create one →
                  </button>
                </div>
              )}
              {emailTemplates.length > 0 && (
                <p className="mt-1.5 text-xs text-white/42">
                  Need to edit a template?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/email-templates")}
                    className="text-[var(--av-light-orange)] underline"
                  >
                    Open Template Editor
                  </button>
                </p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="e.g. Welcome to AfroVision"
                className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
              />
            </div>

            {/* Audience */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">Audience</label>
              <div className="flex gap-3">
                {[
                  { value: "broadcast", label: "All users" },
                  { value: "direct",    label: "One user" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEmailMode(opt.value)}
                    disabled={emailSending}
                    className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                      emailMode === opt.value
                        ? "border-[var(--av-light-orange)]/40 bg-[rgba(245,193,108,0.12)] text-white"
                        : "border-white/10 bg-white/6 text-white/62 hover:bg-white/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Direct recipient picker */}
            {emailMode === "direct" && (
              <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/75">Recipient</label>
                  <input
                    value={emailUserSearch}
                    onChange={(e) => setEmailUserSearch(e.target.value)}
                    placeholder="Search by name, email, or user id"
                    className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
                  />
                </div>
                {loadingUsers ? (
                  <div className="text-sm text-white/45">Loading users...</div>
                ) : (
                  <div className="max-h-52 space-y-2 overflow-y-auto">
                    {filteredEmailUsers.slice(0, 8).map((user) => {
                      const active = user.id === emailUserId;
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => setEmailUserId(user.id)}
                          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                            active
                              ? "border-[var(--av-light-orange)]/40 bg-[rgba(245,193,108,0.12)]"
                              : "border-white/10 bg-white/6 hover:bg-white/10"
                          }`}
                        >
                          <div>
                            <p className="font-medium text-white">{user.name || user.email}</p>
                            <p className="text-xs text-white/45">{user.email}</p>
                          </div>
                          <span className="text-xs text-white/35">{user.role}</span>
                        </button>
                      );
                    })}
                    {!filteredEmailUsers.length && (
                      <div className="text-sm text-white/45">No matching users.</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Variable overrides for broadcast mode */}
            {emailMode === "broadcast" && (
              <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-white/58">
                  Variables will be personalised per user from their profile. Override the preview values below to check the template renders correctly.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/65">Preview name</label>
                    <input
                      value={emailVarName}
                      onChange={(e) => setEmailVarName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/32"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/65">Preview email</label>
                    <input
                      value={emailVarEmail}
                      onChange={(e) => setEmailVarEmail(e.target.value)}
                      placeholder="e.g. jane@example.com"
                      className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/32"
                    />
                  </div>
                </div>
              </div>
            )}

            {emailResult && (
              <NoticeBanner tone={emailResult.success ? "success" : "error"} message={emailResult.text} />
            )}

            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={
                  emailSending ||
                  !emailTemplateId ||
                  !emailSubject.trim() ||
                  (emailMode === "direct" && !emailUserId)
                }
                className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-6 py-2.5 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {emailSending && (
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--av-dark-blue)]/30 border-t-[var(--av-dark-blue)]/80" />
                )}
                {emailSending
                  ? "Sending..."
                  : emailMode === "direct"
                  ? "Send Email"
                  : "Broadcast Email"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">
                Delivery
              </label>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/72">
                Notices are persisted to the in-app inbox and sent as push notifications when users have registered device tokens.
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">
                Audience
              </label>
              <div className="flex gap-3">
                {[
                  { value: "broadcast", label: "Broadcast to all users" },
                  { value: "direct", label: "Target one user" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setMode(option.value)}
                    disabled={sending}
                    className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                      mode === option.value
                        ? "border-[var(--av-light-orange)]/40 bg-[rgba(245,193,108,0.12)] text-white"
                        : "border-white/10 bg-white/6 text-white/62 hover:bg-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === "direct" ? (
              <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">Recipient</label>
              <input
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search by name, email, or user id"
                className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
              />
            </div>

            {loadingUsers ? (
              <div className="text-sm text-white/45">Loading users...</div>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {filteredUsers.slice(0, 8).map((user) => {
                  const active = user.id === selectedUserId;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedUserId(user.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-[var(--av-light-orange)]/40 bg-[rgba(245,193,108,0.12)]"
                          : "border-white/10 bg-white/6 hover:bg-white/10"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-white">{user.name || user.email}</p>
                        <p className="text-xs text-white/45">{user.email}</p>
                      </div>
                      <span className="text-xs text-white/35">{user.role}</span>
                    </button>
                  );
                })}
                {!filteredUsers.length ? <div className="text-sm text-white/45">No matching users found.</div> : null}
              </div>
            )}
          </div>
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">Title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Notice title"
                className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your broadcast message..."
                rows={5}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
              />
              <div className="mt-1 text-right text-xs text-white/35">
                {message.length} characters
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">Optional Deep Link</label>
              <input
                value={link}
                onChange={(event) => setLink(event.target.value)}
                placeholder="e.g. /wallet or /channels/123"
                className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
              />
            </div>

            {result ? <NoticeBanner tone={result.success ? "success" : "error"} message={result.text} /> : null}

            <div className="flex justify-end">
              <button
                onClick={handleSend}
                disabled={sending || !title.trim() || !message.trim() || (mode === "direct" && !selectedUserId)}
                className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-6 py-2.5 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending && <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--av-dark-blue)]/30 border-t-[var(--av-dark-blue)]/80" />}
                {sending ? "Sending..." : mode === "direct" ? "Send Direct Notice" : "Broadcast Notice"}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="rounded-[1.5rem] border border-[var(--av-light-orange)]/20 bg-[rgba(245,193,108,0.08)] px-4 py-3 text-sm text-white/72">
        Every send is persisted to the inbox and now recorded in the audit trail with delivery counts.
      </div>

      {/* Email template live preview — visible only in the Templates workspace */}
      {workspace === "templates" && renderedEmailPreview && (
        <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-semibold text-white">Email Preview</h2>
          <iframe
            title="Email template preview"
            sandbox=""
            srcDoc={renderedEmailPreview}
            className="min-h-[540px] w-full rounded-2xl border border-white/10 bg-white"
          />
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        destructive={confirm?.destructive}
        busy={confirm?.busy}
        error={confirm?.error}
        confirmLabel={confirm?.confirmLabel}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm?.action) {
            setConfirm(null);
            return;
          }
          const shouldClose = await confirm.action();
          if (shouldClose !== false) {
            setConfirm(null);
          }
        }}
      />
    </div>
  );
}

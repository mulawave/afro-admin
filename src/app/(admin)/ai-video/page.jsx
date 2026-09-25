"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAiVideoAdminConfig,
  testAiVideoProvider,
  updateAiVideoAdminConfig,
  updateAiVideoProvider,
} from "@/services/aiVideo";

export default function AiVideoAdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingProviderKey, setSavingProviderKey] = useState(null);
  const [testingProviderKey, setTestingProviderKey] = useState(null);
  const [notice, setNotice] = useState(null);
  const [providerTestResult, setProviderTestResult] = useState(null);
  const [configForm, setConfigForm] = useState(null);
  const [providerForms, setProviderForms] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAiVideoAdminConfig();
      setPayload(data);
      setConfigForm(data?.config || {});
      setProviderForms(
        Object.fromEntries((data?.providers || []).map((provider) => [provider.provider_key, provider]))
      );
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load AI video settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const creatorPlans = payload?.creator_plans || [];
  const providers = payload?.providers || [];
  const dirtyConfig = useMemo(() => {
    if (!payload?.config || !configForm) return false;
    return JSON.stringify(payload.config) !== JSON.stringify(configForm);
  }, [payload, configForm]);

  function updateConfigField(key, value) {
    setConfigForm((prev) => ({ ...(prev || {}), [key]: value }));
  }

  function updateProviderField(providerKey, key, value) {
    setProviderForms((prev) => ({
      ...prev,
      [providerKey]: {
        ...(prev[providerKey] || {}),
        [key]: value,
      },
    }));
  }

  async function handleSaveConfig() {
    try {
      setSavingConfig(true);
      const res = await updateAiVideoAdminConfig(configForm);
      setPayload((prev) => ({ ...prev, config: res.config }));
      setConfigForm(res.config);
      setNotice('AI video config updated.');
    } catch (err) {
      setError(err.message || 'Failed to update AI video config');
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleSaveProvider(providerKey) {
    try {
      setSavingProviderKey(providerKey);
      const res = await updateAiVideoProvider(providerKey, providerForms[providerKey]);
      setPayload((prev) => ({
        ...prev,
        providers: (prev?.providers || []).map((provider) =>
          provider.provider_key === providerKey ? res.provider : provider
        ),
      }));
      setProviderForms((prev) => ({ ...prev, [providerKey]: res.provider }));
      setNotice(`Provider ${providerKey} updated.`);
    } catch (err) {
      setError(err.message || 'Failed to update provider');
    } finally {
      setSavingProviderKey(null);
    }
  }

  async function handleTestProvider(providerKey) {
    try {
      setTestingProviderKey(providerKey);
      const res = await testAiVideoProvider(providerKey);
      setProviderTestResult(res);
      setNotice(res.message || `Provider ${providerKey} tested.`);
    } catch (err) {
      setError(err.message || 'Provider test failed');
    } finally {
      setTestingProviderKey(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold text-white">AI Video Generator</h1>
        <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          <button onClick={load} className="ml-3 underline">Retry</button>
        </div>
      </div>
    );
  }

  const config = configForm || payload?.config || {};

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">AI Video Generator</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/60">
            Phase 1 admin foundation is live. This page now reads the backend feature config,
            provider config, and eligible creator plans. Full editing controls land in Phase 2.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/70">
          {config.enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      {notice ? (
        <div className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </div>
      ) : null}

      <section className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--av-light-orange)]">Feature Access and Limits</h2>
            <p className="mt-2 text-sm text-white/55">These controls apply instantly across Flutter and website once saved.</p>
          </div>
          <button
            onClick={handleSaveConfig}
            disabled={savingConfig || !dirtyConfig}
            className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-4 py-2 text-sm font-semibold text-[var(--av-dark-blue)] disabled:opacity-50"
          >
            {savingConfig ? 'Saving...' : 'Save Config'}
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2 text-sm text-white/75">
            <span>Feature enabled</span>
            <select value={config.enabled ? 'true' : 'false'} onChange={(e) => updateConfigField('enabled', e.target.value === 'true')} className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-white outline-none">
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-white/75">
            <span>Availability mode</span>
            <select value={config.mode || 'disabled'} onChange={(e) => updateConfigField('mode', e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-white outline-none">
              <option value="disabled">disabled</option>
              <option value="internal_only">internal_only</option>
              <option value="pilot_whitelist">pilot_whitelist</option>
              <option value="eligible_creators_only">eligible_creators_only</option>
              <option value="open_beta">open_beta</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-white/75">
            <span>Minimum creator plan</span>
            <select value={config.minimum_creator_plan || ''} onChange={(e) => updateConfigField('minimum_creator_plan', e.target.value || null)} className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-white outline-none">
              <option value="">none</option>
              {creatorPlans.map((plan) => <option key={plan.id} value={plan.name}>{plan.name}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-white/75">
            <span>Default provider</span>
            <select value={config.default_provider || ''} onChange={(e) => updateConfigField('default_provider', e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-white outline-none">
              {providers.map((provider) => <option key={provider.provider_key} value={provider.provider_key}>{provider.provider_key}</option>)}
            </select>
          </label>
          <LabeledNumber label="Daily request limit" value={config.daily_request_limit ?? 0} onChange={(value) => updateConfigField('daily_request_limit', value)} />
          <LabeledNumber label="Monthly request limit" value={config.monthly_request_limit ?? 0} onChange={(value) => updateConfigField('monthly_request_limit', value)} />
          <LabeledNumber label="Max duration (seconds)" value={config.max_duration_seconds ?? 0} onChange={(value) => updateConfigField('max_duration_seconds', value)} />
          <label className="space-y-2 text-sm text-white/75">
            <span>Max resolution</span>
            <input value={config.max_resolution || ''} onChange={(e) => updateConfigField('max_resolution', e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-white outline-none" />
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ToggleRow label="Text to video" checked={config.allow_text_to_video === true} onChange={(value) => updateConfigField('allow_text_to_video', value)} />
          <ToggleRow label="Image to video" checked={config.allow_image_to_video === true} onChange={(value) => updateConfigField('allow_image_to_video', value)} />
          <ToggleRow label="Template mode" checked={config.allow_template_based === true} onChange={(value) => updateConfigField('allow_template_based', value)} />
          <ToggleRow label="Post to Waves" checked={config.allow_post_to_waves === true} onChange={(value) => updateConfigField('allow_post_to_waves', value)} />
          <ToggleRow label="Require moderation before publish" checked={config.require_moderation_before_publish === true} onChange={(value) => updateConfigField('require_moderation_before_publish', value)} />
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--av-light-orange)]">Providers</h2>
        {providers.length === 0 ? (
          <p className="mt-4 text-sm text-white/45">No provider configurations found.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {providers.map((provider) => (
              <div key={provider.provider_key} className="rounded-2xl border border-white/8 bg-white/4 p-4 text-sm text-white/72">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-white">{provider.provider_key}</strong>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${(providerForms[provider.provider_key]?.enabled ?? provider.enabled) ? "bg-emerald-500/15 text-emerald-200" : "bg-white/10 text-white/55"}`}>
                    {(providerForms[provider.provider_key]?.enabled ?? provider.enabled) ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  <ToggleRow compact label="Provider enabled" checked={providerForms[provider.provider_key]?.enabled === true} onChange={(value) => updateProviderField(provider.provider_key, 'enabled', value)} />
                  <CompactInput label="Model" value={providerForms[provider.provider_key]?.model_name || ''} onChange={(value) => updateProviderField(provider.provider_key, 'model_name', value)} />
                  <CompactInput label="API base URL" value={providerForms[provider.provider_key]?.api_base_url || ''} onChange={(value) => updateProviderField(provider.provider_key, 'api_base_url', value)} />
                  <CompactInput label="API key secret ref" value={providerForms[provider.provider_key]?.api_key_secret_ref || ''} onChange={(value) => updateProviderField(provider.provider_key, 'api_key_secret_ref', value)} />
                  <CompactInput label="Webhook secret ref" value={providerForms[provider.provider_key]?.webhook_signing_secret_ref || ''} onChange={(value) => updateProviderField(provider.provider_key, 'webhook_signing_secret_ref', value)} />
                  <LabeledNumber compact label="Timeout (seconds)" value={providerForms[provider.provider_key]?.timeout_seconds ?? 0} onChange={(value) => updateProviderField(provider.provider_key, 'timeout_seconds', value)} />
                  <LabeledNumber compact label="Rate limit / minute" value={providerForms[provider.provider_key]?.rate_limit_per_minute ?? 0} onChange={(value) => updateProviderField(provider.provider_key, 'rate_limit_per_minute', value)} />
                  <LabeledNumber compact label="Cost per second" value={providerForms[provider.provider_key]?.cost_per_second ?? 0} onChange={(value) => updateProviderField(provider.provider_key, 'cost_per_second', value)} />
                  <ToggleRow compact label="Text to video" checked={providerForms[provider.provider_key]?.supports_text_to_video === true} onChange={(value) => updateProviderField(provider.provider_key, 'supports_text_to_video', value)} />
                  <ToggleRow compact label="Image to video" checked={providerForms[provider.provider_key]?.supports_image_to_video === true} onChange={(value) => updateProviderField(provider.provider_key, 'supports_image_to_video', value)} />
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleSaveProvider(provider.provider_key)} disabled={savingProviderKey === provider.provider_key} className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-3 py-2 text-xs font-semibold text-[var(--av-dark-blue)] disabled:opacity-50">
                      {savingProviderKey === provider.provider_key ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => handleTestProvider(provider.provider_key)} disabled={testingProviderKey === provider.provider_key} className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-xs font-medium text-white/85 disabled:opacity-50">
                      {testingProviderKey === provider.provider_key ? 'Testing...' : 'Test'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {providerTestResult ? (
        <section className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--av-light-orange)]">Latest Provider Test</h2>
          <div className="mt-3 text-sm text-white/72">
            <div><strong className="text-white">Provider:</strong> {providerTestResult.provider_key}</div>
            <div><strong className="text-white">Status:</strong> {providerTestResult.ok ? 'Ready' : 'Incomplete'}</div>
            <div className="mt-2">{providerTestResult.message}</div>
            {Array.isArray(providerTestResult.issues) && providerTestResult.issues.length > 0 ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-white/62">
                {providerTestResult.issues.map((issue) => <li key={issue}>{issue}</li>)}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ToggleRow({ label, checked, onChange, compact = false }) {
  return (
    <label className={`flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/4 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}>
      <span className={`${compact ? 'text-xs' : 'text-sm'} text-white/78`}>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--av-orange)]" />
    </label>
  );
}

function LabeledNumber({ label, value, onChange, compact = false }) {
  return (
    <label className="space-y-2 text-sm text-white/75">
      <span className={compact ? 'text-xs text-white/62' : ''}>{label}</span>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value || 0))} className={`w-full rounded-2xl border border-white/10 bg-white/6 text-white outline-none ${compact ? 'px-3 py-2 text-xs' : 'px-3 py-2'}`} />
    </label>
  );
}

function CompactInput({ label, value, onChange }) {
  return (
    <label className="space-y-2 text-xs text-white/62">
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-xs text-white outline-none" />
    </label>
  );
}

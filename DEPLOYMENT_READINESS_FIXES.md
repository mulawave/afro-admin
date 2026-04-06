# Admin Deployment Readiness Fixes

## Current Verdict

The standalone admin is feature-complete enough to build and run locally, but it is not yet cloud-deployment-ready.

What is already true:

- `npm run lint` passes locally.
- `npm run build` passes locally.
- The admin route smoke test passes against a fresh dev server.
- The backend exposes the routes the admin depends on.

What is not yet true:

- The admin does not yet have a safe production runtime contract.
- The admin does not yet have a checked-in deployment contract.
- The admin has not yet been validated end to end against a real deployed backend.

This file lists every recommended fix needed to move from build-ready to deployment-ready.

## Blocking Fixes

These items should be treated as release blockers.

### 1. Remove localhost-oriented API defaults from production startup

Why this blocks deployment:

- `admin/scripts/run-next.mjs` currently injects `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3000` whenever the variable is missing.
- That is safe for local development only.
- In cloud environments, a missing API origin should fail fast, not silently target localhost.
- If this remains unchanged, the deployed admin can appear healthy while every API call fails against the wrong host.

Required fix:

- Restrict the localhost default to explicit local development only.
- For `build` and `start`, require `NEXT_PUBLIC_API_BASE_URL` to be set.
- Exit early with a clear error if the variable is missing in non-local environments.

Recommended implementation:

- Keep the local convenience only for `dev` mode.
- Remove all implicit localhost defaults for production startup.
- Print a startup error that names the missing variable and the expected value shape, for example `https://api.afrovision.example`.

### 2. Remove browser-side localhost fallback from the admin API client

Why this blocks deployment:

- `admin/src/lib/api.js` falls back to `http://localhost:3000` or `http://127.0.0.1:3000` when running in a browser on localhost.
- That fallback is acceptable for local development, but it reinforces an unsafe pattern where runtime configuration can be missing without being caught early.
- The production contract should be explicit: the admin needs a configured backend origin.

Required fix:

- Make `NEXT_PUBLIC_API_BASE_URL` the only accepted source in production.
- Keep a localhost fallback only when the app is clearly running in local development.
- Fail fast with a clear error for any deployed environment where the variable is missing.

Recommended implementation:

- Gate the fallback behind `process.env.NODE_ENV === "development"`.
- Preserve the current HTML-vs-JSON error handling, because that is still useful for diagnosis.

### 3. Make production startup honor the platform `PORT`

Why this blocks deployment:

- `admin/package.json` currently uses `node scripts/run-next.mjs start --port 3001`.
- Cloud hosts such as Cloud Run inject `PORT` dynamically.
- A hardcoded production port can prevent the service from binding correctly or can create confusing partial failures.

Required fix:

- Remove the fixed port from the `start` script.
- Let Next bind to the platform-provided `PORT`.
- Keep `3001` only as a local development default if needed.

Recommended implementation:

- Keep `dev` on `3001` if you want local website and admin separation.
- Change `start` to run without a hardcoded port.
- If a wrapper remains, have it pass through `process.env.PORT` when present.

### 4. Check in an explicit deployment contract for the admin package

Why this blocks deployment:

- The `admin` package currently has no checked-in `.env.example`.
- It has no admin-specific deployment README.
- It has no Dockerfile or provider-specific manifest.
- A deployable service needs a reproducible contract for environment variables, build command, start command, and hosting assumptions.

Required fix:

- Add `admin/.env.example` documenting every required variable.
- Add `admin/README_DEPLOY.md` or similar with exact deployment steps.
- Add at least one supported hosting contract, depending on your target platform.

Minimum documented items:

- required environment variables
- build command
- start command
- expected Node version
- expected package manager and install command
- how to point the admin at the deployed backend
- how to configure the backend CORS allowlist for the admin domain
- how to validate login after deployment

### 5. Decide and document the supported hosting target

Why this blocks deployment:

- Right now the admin can be built, but there is no committed decision about how it should be hosted.
- The fixes differ slightly between Cloud Run, Vercel, and generic Node hosting.
- Without a declared target, deployment documentation stays ambiguous and fragile.

Required fix:

- Pick one primary deployment target and document it as the supported path.

If the target is Cloud Run:

- add `admin/Dockerfile`
- use dynamic `PORT`
- set `NEXT_PUBLIC_API_BASE_URL` at deploy time
- document image build and deploy commands

If the target is Vercel:

- document the Vercel project settings
- define `NEXT_PUBLIC_API_BASE_URL` in Vercel env vars
- document preview vs production backend origins

If the target is generic Node hosting:

- document install, build, and start commands
- document required reverse-proxy behavior if applicable

### 6. Verify the deployed admin against a real backend origin

Why this blocks deployment:

- Local build success does not prove runtime correctness.
- The admin login path previously failed by hitting the wrong host and then surfacing returned HTML.
- Until the deployed admin is tested against the real backend origin, the most important runtime path remains unverified.

Required fix:

- Perform an end-to-end runtime validation against a deployed backend.
- Do not mark the admin deployment-ready before this succeeds.

Minimum runtime validation:

- load `/login`
- submit real admin credentials
- confirm redirect into `/dashboard`
- confirm one authenticated API-backed page loads successfully
- confirm logout clears session and returns to `/login`

### 7. Configure backend CORS explicitly for the admin domain

Why this blocks deployment:

- `backend/src/app.js` currently falls back to `*` when `ALLOWED_ORIGINS` is not set.
- That is acceptable for staging experiments, but not a production-grade cross-origin contract.
- The admin depends on cross-origin API access unless it is reverse-proxied under the same origin.

Required fix:

- Set `ALLOWED_ORIGINS` explicitly to the deployed admin origin or origins.
- Confirm preflight and authenticated requests work from the deployed admin.

Recommended implementation:

- Separate staging and production origin allowlists.
- Keep wildcard CORS only for temporary staging when intentionally accepted.

### 8. Replace the default seeded admin credential before any real deployment

Why this blocks deployment:

- The backend currently seeds a default admin account from environment values or defaults.
- A known fallback credential is acceptable for local bootstrap only.
- It is not acceptable for a real internet-facing deployment.

Required fix:

- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` explicitly for non-local deployments, or disable default credential fallback outside local development.
- Confirm the deployed environment does not rely on the hardcoded fallback pair.

Recommended implementation:

- Fail startup in production if secure admin bootstrap values are missing.
- Rotate the initial admin password immediately after first login.

## Strongly Recommended Fixes

These items may not block a first controlled staging deploy, but they should be completed before calling the deployment robust.

### 9. Stop ignoring lint during production build

Current issue:

- `admin/next.config.mjs` sets `eslint.ignoreDuringBuilds = true`.
- That means the primary build command can succeed even if the codebase regresses on lint.

Recommended fix:

- Either remove `ignoreDuringBuilds`, or keep it only if CI explicitly runs `npm run lint` as a required gate before deploy.

Deployment standard:

- No production deploy should depend on build success alone.
- Lint should be a required deployment gate.

### 10. Resolve the SWC lockfile warning for reproducible builds

Current issue:

- Local admin builds emit `Found lockfile missing swc dependencies, run next locally to automatically patch`.
- The build still succeeds, but the warning points to dependency and lockfile hygiene that can create inconsistent cloud installs.

Recommended fix:

- Regenerate the lockfile in a clean admin install.
- Commit the updated lockfile once the warning is gone.
- Re-run `npm ci`, `npm run build`, and the smoke test from a clean environment.

Why this matters:

- Reproducible installs are part of deployment readiness.
- Cloud failures caused by incomplete lockfiles are avoidable.

### 11. Add admin-specific environment validation at startup

Current issue:

- The admin fails late, during fetches, if the API origin is wrong or missing.
- That delays diagnosis until after the app is already serving requests.

Recommended fix:

- Add explicit startup validation for required public env vars.
- Print actionable messages and exit non-zero for invalid production configuration.

At minimum validate:

- `NEXT_PUBLIC_API_BASE_URL` exists in non-local environments
- it is an absolute HTTP or HTTPS origin
- it does not point at localhost in production

### 12. Add a deployment smoke test for production mode

Current issue:

- Existing smoke coverage is useful, but it is centered on local dev-server reachability.
- Deployment readiness needs a production-mode smoke pass as well.

Recommended fix:

- Add a smoke test that starts the built admin in production mode and checks critical routes.
- Add a second smoke mode that targets a deployed URL.

Suggested checks:

- `/login` returns HTML successfully
- static assets load
- protected routes redirect correctly when unauthenticated
- authenticated dashboard fetches return JSON from the configured backend

### 13. Add health and observability basics

Current issue:

- The admin has no documented deployment-time observability standard.
- When a deployed admin misconfigures the API base, the failure is client-visible but not necessarily easy to detect operationally.

Recommended fix:

- Document where runtime logs live for the chosen host.
- Add a simple deployment verification checklist for browser console, network failures, and server logs.
- If hosted on Cloud Run or similar, confirm startup logs show the expected environment and bind port.

### 14. Decide whether the admin should be public-internet reachable or access-restricted

Current issue:

- The app enforces admin role after login, but there is no deployment note about network exposure.

Recommended fix:

- Decide whether the admin should be:
  - publicly reachable with app-level auth only, or
  - additionally protected behind network controls, identity-aware proxy, VPN, or basic access restrictions

Why this matters:

- A production admin console usually deserves stronger exposure controls than the main product site.

## Nice-to-Have Hardening

These items improve long-term reliability and security but can follow after the primary blockers.

### 15. Move admin session storage to a more hardened pattern if risk tolerance requires it

Current issue:

- The admin currently stores token and user data in `localStorage`.
- That is common in internal tools, but it is weaker than an httpOnly cookie model.

Recommended fix:

- Keep the current approach for now if speed matters.
- For a higher security bar, migrate to a server-managed session or cookie-based auth model.

### 16. Add explicit preview-environment handling

Current issue:

- If preview deployments are introduced, they will need their own backend routing and env management.

Recommended fix:

- Document preview behavior up front.
- Decide whether previews should point to staging backend, preview backend, or be disabled for admin.

### 17. Add a real deployment rollback note

Recommended fix:

- Document how to roll back the admin if a bad release is deployed.
- Include which build artifact or revision to revert to on the chosen host.

## Files Driving These Recommendations

- `admin/package.json`
  - `dev` is intentionally fixed to port `3001`
  - `start` is also fixed to port `3001`, which is not cloud-friendly
- `admin/scripts/run-next.mjs`
  - injects `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3000` when unset
- `admin/src/lib/api.js`
  - contains browser-side localhost fallback behavior
  - already has improved error messaging for HTML responses from the wrong host
- `admin/next.config.mjs`
  - ignores lint during build
- `backend/src/app.js`
  - backend binds to `PORT || 3000`
  - backend CORS is permissive unless `ALLOWED_ORIGINS` is set

## Recommended Deliverables Before Calling This Deployment-Ready

The minimum concrete outputs should be:

1. A corrected admin runtime contract.
2. A checked-in admin deployment contract.
3. A clean, reproducible admin install and build.
4. A verified deployed login flow against the real backend.
5. A documented CORS and environment configuration for the chosen host.

More concretely, that means:

1. Update `admin/package.json` and `admin/scripts/run-next.mjs` so production start honors `PORT` and does not inject localhost API defaults.
2. Update `admin/src/lib/api.js` so missing production API config fails fast instead of relying on implicit localhost behavior.
3. Add `admin/.env.example`.
4. Add `admin/README_DEPLOY.md` or equivalent.
5. Add `admin/Dockerfile` if Cloud Run is the target, or document the supported non-Docker host clearly.
6. Remove the SWC lockfile warning by refreshing the admin lockfile from a clean install.
7. Make `npm run lint` an explicit required deploy gate.
8. Validate the deployed admin against the real backend with a manual or scripted smoke flow.
9. Set backend `ALLOWED_ORIGINS` explicitly for the deployed admin origin.
10. Replace default admin bootstrap credentials for non-local deployment.

## Deployment Verification Checklist

Do not mark the standalone admin deployment-ready until all of the following are true.

### Configuration

- `NEXT_PUBLIC_API_BASE_URL` is set to the real backend origin.
- No production path falls back to localhost.
- Production start honors the injected `PORT`.
- Backend `ALLOWED_ORIGINS` includes the deployed admin origin.
- Non-local admin credentials are not using known defaults.

### Build Reproducibility

- `npm ci` succeeds from a clean admin checkout.
- `npm run lint` succeeds.
- `npm run build` succeeds.
- The SWC lockfile warning is gone or intentionally explained and accepted.

### Runtime

- The deployed `/login` page loads correctly.
- Login succeeds with real admin credentials.
- `/dashboard` loads real backend data.
- At least one operational page such as `/withdrawals`, `/batches`, or `/creator-subscriptions` loads successfully against the deployed backend.
- Logout clears the session and returns to `/login`.
- Browser network requests are going to the intended backend origin, not localhost.
- No HTML error pages are being surfaced as API responses.

### Operational Confidence

- Startup logs are visible for the chosen host.
- A rollback path is documented.
- The supported deployment process is written down and repeatable.

## Bottom Line

The admin is close, but the remaining work is operational, not cosmetic.

The most important fixes are:

1. Remove localhost defaults from production behavior.
2. Make startup honor platform `PORT`.
3. Check in real deployment documentation and environment examples.
4. Validate the deployed login flow against the real backend.
5. Lock down backend CORS and non-local admin credentials.

Once those are done and verified, the standalone admin can reasonably be called cloud-deployment-ready.
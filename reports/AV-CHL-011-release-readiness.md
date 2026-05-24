# AV-CHL-011 — Release Readiness and Rollout Controls

Date: 2026-05-18
Owner: Product/Ops + Engineering

## Scope

Finalize safe rollout controls and launch readiness for the paid challenge audition signup feature set delivered in AV-CHL-006 through AV-CHL-010.

## Rollout Controls Implemented

1. Backend kill-switch for signup initialization
- Setting key: `AUDITION_SIGNUP_ENABLED`
- Default: `true`
- Behavior:
  - `false` blocks `POST /challenge/audition/payment/initialize` with `503` and code `AUDITION_SIGNUP_DISABLED`
  - `verify` endpoint remains available so in-flight payments can still be reconciled safely
- Implementation:
  - `backend/src/admin/settings.model.js`
  - `backend/src/challenge/audition_payment.controller.js`

2. Communication safety controls
- Acknowledgement email controls already active from AV-CHL-009:
  - `AUDITION_ACK_EMAIL_ENABLED`
  - subject/body override + recipient override/BCC controls

## Deployment Order (Executable)

1. Backend deploy first
- Why: introduces kill-switch + email flow + admin data shape dependencies
- Command path:
  - `deploy_all.ps1 -Only backend`
  - or CI workflow `.github/workflows/deploy.yml` backend job

2. Admin deploy second
- Why: admin participant operations surface depends on backend contracts
- Command path:
  - `deploy_all.ps1 -Only admin`
  - or CI workflow admin job

3. Website/App surface deploy third
- Why: user-facing signup UX should only go live after backend controls and admin visibility are available
- Command path:
  - `deploy_all.ps1 -Only website`

4. Optional full-stack path
- `deploy_all.ps1` for all surfaces when coordinated release window is approved.

## Pre-Release Checklist

- ✅ AV-CHL-010 automated QA report green (`admin/reports/AV-CHL-010-qa-checklist.md`)
- ✅ AV-CHL-011 rollout control tests green (`node test/audition-rollout-controls.test.js`)
- ✅ Admin paid signup operations page deployed and reachable
- ✅ SMTP settings validated in admin (or acknowledgement explicitly disabled)
- ✅ `AUDITION_SIGNUP_ENABLED` confirmed to intended launch value

## Rollback Strategy

1. Immediate traffic stop (no redeploy)
- Set `AUDITION_SIGNUP_ENABLED=false`
- Result: new signups blocked, in-flight verification still allowed

2. Communication rollback (no redeploy)
- Set `AUDITION_ACK_EMAIL_ENABLED=false` if SMTP instability is detected

3. Surface rollback
- Re-deploy previous backend/admin/website revisions via Cloud Run revision rollback or prior image tag

4. Data safety posture
- Existing enrolled signups remain preserved
- Allocation idempotency guards prevent duplicate rewards on callback retries

## Operational Monitoring Focus

- Backend logs for:
  - `AUDITION_SIGNUP_DISABLED` rate (should be zero during normal launch)
  - payment verify failures
  - acknowledgement email errors / retry growth
- Admin monitoring:
  - paid signups count trend
  - `email_sent=false` backlog and `email_error` spikes
- Support signals:
  - enrollment mismatch tickets
  - duplicate charge claims

## Stakeholder Signoff

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Engineering |  |  | Approved / Hold |
| Product |  |  | Approved / Hold |
| Ops |  |  | Approved / Hold |

Release Decision: ✅ Ready for controlled rollout

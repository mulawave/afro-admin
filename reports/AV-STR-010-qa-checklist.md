# AV-STR-010 — External Streaming QA Checklist

## Pre-flight

- [ ] `EXTERNAL_STREAMING_ENABLED=true` in `backend/deploy-env.yaml`
- [ ] Backend deployed with AV-STR-001..009 changes
- [ ] Flutter app built with latest channel model and player changes
- [ ] Admin panel deployed with channel management changes

---

## 1. Source Validation (Creator — Edit Channel Screen)

| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 1.1 | Enter a valid live YouTube embed URL → tap Validate | Badge: ✓ Valid YouTube · Status: live or valid | |
| 1.2 | Enter a valid HLS `.m3u8` URL → tap Validate | Badge: ✓ Valid HLS Stream · Status: valid | |
| 1.3 | Enter a valid DASH `.mpd` URL → tap Validate | Badge: ✓ Valid DASH Stream · Status: valid | |
| 1.4 | Enter an invalid/expired YouTube URL → tap Validate | Error: "Stream URL is invalid or unavailable" | |
| 1.5 | Enter a non-URL string → tap Validate | Error message shown, no crash | |
| 1.6 | Enter a YouTube URL for an access-restricted video → tap Validate | Error: access_denied or equivalent | |
| 1.7 | Save with external URL that hasn't been validated | External source persisted with resolved status | |
| 1.8 | Switch mode back to Native and save | `stream_source_mode` = native, external fields cleared | |

---

## 2. Creator Recheck (Edit Channel Screen)

| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 2.1 | Channel with valid external source → tap Recheck | Spinner shows; timestamp updates to "just now" | |
| 2.2 | Channel with expired/offline source → tap Recheck | Status badge updates to offline/invalid | |
| 2.3 | Tap Recheck on native channel | Recheck button not shown | |

---

## 3. Admin Channel Import

| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 3.1 | Import a YouTube Live channel via admin Import Channel modal | Channel added to imported list with SourceModeBadge | |
| 3.2 | Import an HLS stream URL | Resolves to HLS mode; status probe shown | |
| 3.3 | Import with an invalid URL | Error toast shown in modal; no channel created | |
| 3.4 | Admin recheck individual imported channel | StreamStatusBadge updates; last_checked_at refreshes | |
| 3.5 | Admin "Recheck All" button (imported channels tab) | All imported channels re-probed; result toast shows count | |
| 3.6 | Stale badge appears after >24 h without recheck | Amber "Stale" badge visible in source column | |
| 3.7 | Admin backfill defaults | `stream_source_mode`, `stream_status`, and related fields set on legacy channels | |

---

## 4. Player Playback

| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 4.1 | Open channel with `stream_source_mode: external_youtube`, status `live` | YouTube player loads; LIVE badge shown | |
| 4.2 | Open channel with `stream_source_mode: external_hls`, status `valid` | HLS video player loads and plays | |
| 4.3 | Open channel with `stream_source_mode: external_dash`, status `valid` | DASH video player loads and plays | |
| 4.4 | Open channel with status `offline` | Error state: "This stream is currently offline. Check back later." | |
| 4.5 | Open channel with status `invalid` | Error state: "The configured stream URL is invalid or has expired." | |
| 4.6 | Open channel with status `access_denied` | Error state: "Access to this stream was denied by the provider." | |
| 4.7 | Open channel with status `unknown` | Error state: "This stream is unavailable right now." | |
| 4.8 | Player network timeout (HLS/DASH) | Error overlay with Retry button; no crash | |
| 4.9 | Retry button after player failure | Player re-attempts initialisation | |
| 4.10 | Recheck source button inside player | Re-probes backend; player re-attempts with refreshed URL | |
| 4.11 | Recheck fails (503/network error) | Error message shown to user in player UI | |

---

## 5. Native Channel Regression

| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 5.1 | Open any native channel (`stream_source_mode: native`) | BroadcastPlayer used; no external source path triggered | |
| 5.2 | Native channel with no stream_source_mode field (legacy) | Defaults to native; plays normally | |
| 5.3 | Native channel Recheck button | Not shown | |
| 5.4 | Native channel source column in admin | SourceModeBadge shows "Native"; no Stale badge | |

---

## 6. Kill-Switch / Rollback

| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 6.1 | Set `EXTERNAL_STREAMING_ENABLED=false` in deploy-env.yaml and redeploy | `POST /channels/resolve-source` returns 503 | |
| 6.2 | With flag false, Creator validate URL in edit screen | Error: "External streaming is currently disabled." | |
| 6.3 | With flag false, Creator recheck source | Error: "External streaming is currently disabled." shown in UI | |
| 6.4 | With flag false, player Recheck Source button | Error shown in player error state | |
| 6.5 | With flag false, PATCH `/channels/:id/external-source` with non-native mode | 503 returned | |
| 6.6 | With flag false, setting mode back to `native` (clearing external source) | Still succeeds — kill-switch does not block reversion | |
| 6.7 | Restore `EXTERNAL_STREAMING_ENABLED=true` and redeploy | All external streaming features resume normally | |

---

## 7. Channel View Screen Status Indicators

| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 7.1 | Channel with `stream_status: live` | Green LIVE badge in channel info row | |
| 7.2 | Channel with `stream_status: valid` | Blue STREAM READY badge | |
| 7.3 | Channel with `stream_status: scheduled` | Orange SCHEDULED badge | |
| 7.4 | Channel with `stream_status: offline` | Red STREAM OFFLINE badge; Watch Now button disabled | |
| 7.5 | Channel with `stream_status: invalid` | Red STREAM UNAVAILABLE badge; Watch Now button disabled | |
| 7.6 | Channel with `stream_status: access_denied` | Red ACCESS RESTRICTED badge; Watch Now button disabled | |
| 7.7 | Channel with `stream_status: unknown` | No badge shown; Watch Now button enabled | |
| 7.8 | `last_checked_at` display | Relative time shown (e.g. "5m ago", "2h ago") | |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering | | | |
| QA | | | |
| Product | | | |

**Release decision**: ☐ Approved for rollout &nbsp;&nbsp;&nbsp; ☐ Hold — blockers listed above

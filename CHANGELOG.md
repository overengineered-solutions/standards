v0.3.0 — 2026-05-31 — Add R6.13 (Never write empty to secret store).

  New rule:
  - R6.13 — Never write empty/null to a secret store. Migration / sync /
    propagation code MUST refuse to store empty string, whitespace-only,
    null, or undefined for a value-bearing secret. Downstream consumers
    treat absent-or-empty as a documented allow-list match only (e.g.
    Vercel's auto-injected VERCEL_GIT_* vars); all other empties cascade
    as an alert. Audit test: pre-write empty-check that fail-loud-skips +
    operational weekly cron scanning every reachable secret store for
    length-≤-4 values on keys not on the allow-list.

  Why now: explicit operator request 2026-05-31 after the 2026-05-30
  incident — `migrate-app-secrets.sh` ran `vercel env pull` against
  Vercel projects whose Sensitive flag causes pull to return empty
  strings; the script wrote those empties to Infisical; next Infisical
  → Vercel sync wrote them back to Vercel; production deploys for
  makeros + primopicks + oesolutions blocked for 18+ hours with
  "DATABASE_URL/DIRECT_URL is unset" build failures. 28 critical
  secrets across 3 projects went silently empty; nothing alerted.

  Section status update:
  - Active graded: R6.1–R6.8, R6.10, R6.12, R6.13.
  - Demoted to optional playbook guidance: R6.9, R6.11.

v0.2.0 — 2026-05-31 — Add R6.12 (Root-cause diagnostic discipline).

  New rule:
  - R6.12 — Root-cause diagnostic discipline. On any failure, identify
    the actual failure mode before proposing a fix; the diagnosis is what
    the runtime/system reports, not what file inspection suggests. Two
    failed fix attempts in a row → pause + re-diagnose; do not iterate
    guesses. Audit test: bug-fix PRs cite the diagnostic evidence (log
    line / error message / probe output) that confirmed the failure mode.

  Why now: explicit operator request 2026-05-31. The §6 freeze (2026-05-30)
  was relaxed for this addition because diagnostic discipline is doctrine,
  not playbook calibration. Re-freeze applies after R6.12. Worked example
  in R6.12 body: OELM PR #15 v1 (shipped a "secrets unset" guard when the
  actual issue was a YAML `with: null` block; `gh run view <id>` would
  have surfaced the real diagnosis).

  Section status update:
  - Active graded: R6.1–R6.8, R6.10, R6.12.
  - Demoted to optional playbook guidance: R6.9, R6.11.

v0.1.0 — 2026-05-31 — initial publish.

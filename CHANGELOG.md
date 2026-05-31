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

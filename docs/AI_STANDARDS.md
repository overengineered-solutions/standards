# AI Development Standards & Architectural Doctrine

A portable set of principles for human engineers and AI coding agents (Claude, Codex, Copilot, Cursor, etc.) working on any project where data integrity, finance correctness, and operator-debuggability matter. Project-agnostic by design — the same rules apply to a solo-built finance dashboard, a multi-tenant SaaS, an internal tool, or an experiment.

## Philosophy

This document exists because solo operators and AI-driven engineering teams need a doctrine that survives across sessions, projects, and engineer changes. Without it, every new session re-invents the patterns; every new agent makes its own choices; every refactor erodes the system. Five convictions sit underneath every rule below:

1. **Data is sensitive by default.** Treat every user-data field as if it were PHI/PII, even when it isn't. The discipline scales down with no overhead for non-regulated data; retrofitting it later is expensive.

2. **Money deserves the same rigor as data.** A bug that loses an audit row is bad. A bug that loses a cost event is bad AND expensive, indefinitely, with no obvious symptom until the bill arrives.

3. **Silent failure is the worst possible outcome.** A loud crash gives you something to fix. A silent zero / null / empty result gives you nothing — until production traffic exposes it.

4. **An agent that guesses is worse than an agent that surfaces.** When the doctrine is silent or the prompt is ambiguous, the right move is to recommend a direction and ask — not to silently pick. A two-line "I'd default to X because Y, proceeding unless you redirect" beats a wrong silent choice every time.

5. **You own what you touch.** If you see broken or wrong code in scope — even if it's a decade old, even if it was written by a different agent or engineer — you take it on. Walking past broken code teaches the next person to walk past it.

When a rule below feels arbitrary, return to the conviction it serves. If it doesn't serve any conviction, it shouldn't be here.

## How to use this document

- **As an engineer:** read the main sections, follow the rules, fix what you see. The deep-dive sub-docs in [`docs/standards/`](docs/standards/) show worked examples and anti-patterns for each section.
- **As an audit agent:** grade per rule (e.g. `R1.1`, `R2.4`) — Pass / Fail / N/A with file:line evidence. Rank findings by the rule's implicit severity (see grading scheme at the bottom of this doc).
- **As a doctrine editor (the project owner, plus an agent helping them):** preserve the conventions in the next section so the doc stays portable and gradable.

## Conventions for editing this document

If you are an agent helping extend or revise this document, keep these conventions so a future agent in a future session can pick it up cleanly:

- **Project-agnostic.** No worktree paths, project names, file paths, incident references, or PR numbers in the main doc. The doc must read cleanly for any project that adopts it.
- **Numbered rules.** Every rule has a stable identifier `R<section>.<index>` (e.g. `R3.2`). Don't renumber existing rules — add new ones at the end of their section. Removing a rule leaves a gap; that's intentional, so audit references in past commit messages and PRs don't break.
- **Audit-testable.** Every rule has either an explicit `**Audit test:**` line or an implicit way to grade pass/fail. A rule a grader can't test is doctrine drift — either tighten it until it's testable or drop it.
- **Why-lines describe patterns, not incidents.** If a rule needs a "Why," describe the *pattern* it prevents ("spend ceilings that compare a value against itself produce no real check"), not the *event* that motivated it. The doc travels; specific events don't.
- **Main doc stays concise.** If a section grows beyond ~3–8 rules plus a short paragraph, additional detail belongs in the sub-doc at `docs/standards/<topic>.md`. Don't bloat the main doc with examples or anti-pattern catalogs — link to the deep dive.
- **Severity is implicit.** Security / data-loss / finance rules are BLOCKER. Observability rules are HIGH. Ergonomics are MEDIUM/LOW. Only call out severity in the rule text when it's ambiguous.
- **Tone:** blunt, principle-first. Rules state what to do; why-lines explain in one sentence. Avoid preaching, hedging, or self-referential language like "we believe" or "this codebase requires." The doctrine just *is*.

The goal: this doc should be useful to a new project on day one, gradable by an audit agent on day two, and editable by an agent with no prior context on day three.

---

## 1. Greenfield Convergence

Build toward the canonical target. Don't ship shims that become permanent.
→ Deep dive: [`docs/standards/greenfield.md`](docs/standards/greenfield.md)

### R1.1 — Pick the best pattern; surface divergences from canonical
When a problem has an established in-repo pattern (helper, table shape, audit event, migration template, RLS macro), reuse it by default. If the established pattern has structural issues that make it the wrong long-term answer, propose the better pattern, **surface the divergence to the operator with a written rationale** (commit body / PR description / `docs/decisions/` ADR), and on approval establish the new pattern as canonical with a documented migration plan to retire the old one across existing callers.

**Why:** parallel mechanisms compound. Two near-identical audit helpers become four; four become a maintenance trap nobody refactors. The escape valve from "reuse the canonical" by default is **operator-attended divergence with a migration plan** — not silent parallel-shipping. The Greenfield principle (Section 1) is the underlying goal: converge on the right pattern, then migrate everything to it.

**Audit test:** any PR introducing a pattern that diverges from an existing in-repo pattern must include a written rationale (commit message, PR body, or `docs/decisions/<id>.md`) AND name the migration path for the existing callers.

### R1.2 — Interim shims are labelled with a removal path
A stopgap that does not converge on the canonical architecture is permitted **only** when explicitly labelled `// INTERIM — see <plan/issue/PR>` with a concrete removal path. Unlabelled shims become the architecture by default.

### R1.3 — No guessing, no silent assumptions
Agents and engineers never guess at a design decision when canonical references exist. If standards are silent, surface the question to the project owner with a recommended direction. If there's a better idea than the prompt, surface it.

**Why:** an agent that guesses produces inconsistent architecture. A two-line "I'd recommend X because Y — proceeding with Y unless you say otherwise" beats a silent guess every time.

### R1.4 — You own what you touch (inherited-debt ownership)
If you see something failing, broken, or built badly — even if it was written a year ago, a decade ago, or by a previous LLM with no taste — you take it on as **your** project to fix. "Not in scope" is not an excuse for leaving production broken. If the fix is too large for the current change, file it with a specific plan, but don't walk past it.

**Why:** projects degrade by accumulation. The agent who walks past broken code teaches the next agent to walk past it too. One owner taking responsibility for what they see is the only thing that keeps a codebase healthy in a solo-dev or small-team world.

---

## 2. Zero-Trust Data (HITRUST + Tenant Isolation)

Assume every user-data field is PHI/PII. Tenant boundaries are enforced at the DB layer AND the TS layer. Trust decisions never depend solely on attacker-controlled values. Build **certifiable, not certified**: every technical control in from day one so the system could pass a SOC 2 / HIPAA-Security-Rule / HITRUST audit without rework — the certificate itself (assessment, policies, evidence) is deferred until a customer or regulator requires it.
→ Deep dive: [`docs/standards/hitrust.md`](docs/standards/hitrust.md)

### R2.1 — Tenant-scoped tables have RLS-at-creation
Every tenant-scoped table is created with row-level security **and** the canonical policies (owner-tenant + superadmin-read) in the **same migration** as the `CREATE TABLE`. A follow-up migration to add policies is a defect — the window between create-and-policy is exploitable.

**Audit test:** every new `CREATE TABLE` in a tenant-scoped migration has `ENABLE ROW LEVEL SECURITY` + both policies in the same migration file.

### R2.2 — PII classification on every column
Every new column carries a `@pii:<class>` annotation: `@pii:redact`, `@pii:hash`, `@pii:none`, `@pii:passthrough`. PII handling is machine-checkable in CI, not left to reviewer memory.

### R2.3 — Tenant isolation is mathematical, not best-effort
Production tenants share zero state with dev/sandbox/preview. Previews and tests run on sanitized fixtures or mocks. No code path references a production credential from a non-production context.

### R2.4 — Trust decisions require a DB-attested value
When deciding "is this cross-tenant?", "is this caller authorized?", or any other trust-sensitive question, the decision must depend on at least one value sourced from the database or the authenticated session — never on a comparison of two attacker-controlled envelope fields.

**Why:** if both sides of a trust check are attacker-supplied, the check can be flipped by setting them equal. The pattern is "if `payload.issuerTenantId === payload.recipientTenantId` then skip verification" — an attacker just sets them equal.

### R2.5 — Durable writes source tenant_id from a trusted value
When inserting or updating a row in a tenant-scoped table, `tenant_id` (and any other tenant-identity column) must come from a DB-attested source — the canonical room/session tenant, an authenticated principal, or a configured platform value — **never** from a request envelope field.

**Why:** an envelope-sourced `tenant_id` lets an attacker plant rows under arbitrary tenants. The same row may be referenced by handles that pass DB constraints (a valid foreign key) but cross the boundary the constraints were supposed to enforce.

### R2.6 — Rejection paths don't mutate the target's state
Every rejection (insufficient permission, trust verification failed, scope mismatch, expired, etc.) emits the rejection audit event but **does not** UPSERT, UPDATE, or DELETE the target's data. A "rejected" write on top of a legitimate row owned by a different principal poisons that row, even if the rejection is technically correct.

**Why:** rejection is observation, not mutation. An attacker who can trigger a rejection that writes to victim state has a denial-of-service or poisoning primitive even though the rejection "worked."

### R2.7 — Redaction at the boundary
Data sent to external services (LLM APIs, logging sinks, APMs, third-party webhooks) is sanitized and redacted **locally first**. Screen captures, raw memory dumps, request/response bodies pass through a redaction stage before leaving the process.

### R2.8 — Cross-tenant credential reads are forbidden by default
Tenant A's key registry, secret vault, and credentials never resolve for tenant B's verification. Lookup functions take `tenantId` as a required parameter and scope every SELECT by `WHERE tenant_id = $1`.

---

## 3. Finance-Grade Spend Integrity

Treat money with the same rigor as PHI. Every code path that incurs cost passes through an enforced spend gate. Cost events never silently drop or get lost in a refactor.
→ Deep dive: [`docs/standards/finance.md`](docs/standards/finance.md)

### R3.1 — Spend gate at every cost-incurring path
Every operation that incurs cost (AI provider tokens, infrastructure, metered third-party APIs, compute-heavy functions) goes through a reservation → commit-or-release lifecycle keyed by a stable `reservation_id`. Compute that moves between services carries its spend gate with it.

**Why:** a spend gate left behind during a refactor is a silent-charge defect — the next billing cycle is where it shows up.

### R3.2 — Spend events are atomic with state mutation
The spend-event audit row and the state mutation that incurred the cost are written in the same database transaction. Best-effort logging that can decouple from state is a defect.

### R3.3 — Spend ceilings verify against an independent quantity
A spend-cap check compares requested+outstanding cost against a budget value that does **not** include the requesting operation's own size as a term. The budget value is sourced from configuration (room policy, tenant config, hardcoded conservative cap) — never from `args.requestedAmount` or any quantity derived from the same request.

**Why:** `outstanding + required > required` reduces to `outstanding > 0` — every fresh request passes regardless of size. Spend ceilings that compare a quantity against itself (or against a derivation of itself) produce no real check. The budget must be an independent value, sourced from configuration, not the request.

### R3.4 — No silent cost drops in refactors
When refactoring a code path that touches spend, the audit-event taxonomy must survive the refactor unchanged. Removing or renaming a spend event without an audited migration breaks cost reconciliation downstream.

---

## 4. Observability, Auditability & No Silent Failures

The audit trail is the system's memory. Silent failure is the worst possible outcome.
→ Deep dive: [`docs/standards/observability.md`](docs/standards/observability.md)

### R4.1 — Append-only, hash-chained audit
Critical state changes, API calls, and user interactions are recorded in an append-only audit chain. Each row hashes its predecessor; chain integrity is verifiable. Audit rows are never updated or deleted.

### R4.2 — Audit + state mutation atomic
When a state-changing operation emits an audit event, the audit insert and the state mutation occur in the **same transaction**. Best-effort logging is a defect. Where the recording path crosses processes, use a transactional outbox — never fire-and-forget.

### R4.3 — Event type allowlist additions land in the same PR
Every audit `event_type` is registered in an allowlist; unknown event types fail-closed (the chain layer rolls back the txn). New event types and their allowlist additions land in the **same PR** as the code that emits them.

### R4.4 — No silent denies
Every rejection, deny, or fail-closed path emits a structured audit event with a `reason` field. A reject that throws without an audit emit is a defect.

### R4.5 — No silent zeroes
Any loop over a collection logs `processed=N, expected=M` at the end. When `M > 0 && N === 0`, severity is `warn` — silent-zero (the loop iterated 0 times, nothing logged) is the highest-priority observability failure. Iteration-boundary counts are mandatory on every external API response loop.

**Why:** a function that silently returns null when its read path is broken looks identical to "no data found." Silent-zero is the failure mode that hides until production traffic exposes it; iteration counts make the broken-read-path case loud.

### R4.6 — Zod-parse every external response + every durable JSON read
External API responses (Anthropic, QuickBooks, Vercel, etc.) and persisted JSON columns read back from the DB are `safeParse`d via Zod with the schema defined in-repo. Shape mismatches emit a structured event and throw — never silently coerce or downcast.

### R4.7 — First-call shape observability + daily smoke
Every external API integration ships with: (a) a `shape_observed` audit on the first successful call to each endpoint (top-level keys + array lengths, values redacted), and (b) a daily smoke test asserting the response Zod-parses.

### R4.8 — No `as` casts on untrusted inputs
External API responses, user input, durably-stored JSON, and federated envelopes are not coerced via `as ConcreteType`. Use Zod parsing or refinement. `as unknown` followed by validation is acceptable; `as ConcreteType` is not.

### R4.9 — Dialect-aware readers when writers are dialect-aware
If a writer dispatches on database dialect (e.g., sqlite/postgres branches), its corresponding reader must also dispatch. A dialect-aware writer paired with a single-dialect reader creates a silent-zero failure in the other dialect — lookups return null even when data exists.

**Why:** the writer succeeds, the data lands in the target store, but the reader looks somewhere else and finds nothing. Indistinguishable from "no data found" without iteration counts.

---

## 5. Built for Debugging & Self-Healing

Code is built to be debuggable by both human operators and autonomous agents. Errors are directional. Multi-step processes surface progress. The bar is "if it breaks at 3am, someone or some agent can diagnose it in minutes, not hours."
→ Deep dive: [`docs/standards/debuggability.md`](docs/standards/debuggability.md)

### R5.1 — No opaque state
Application state is queryable via structured APIs, not solely visible in rendered UI. Critical state surfaces a JSON snapshot accessible via internal endpoint.

### R5.2 — Diag API registry
Every diagnostic probe is registered in a single discoverable registry (e.g., `/platform-admin/diag`). Operators and agents find every probe the same way — no hunting for one-off bespoke endpoints.

### R5.3 — Directional errors to the user
User-facing errors describe (a) **what failed**, (b) **why**, and (c) **the next concrete step**. "Something went wrong" is a defect. "Couldn't connect to QuickBooks — your token expired; click Reconnect" is the bar.

**Why:** an error message without direction wastes the user's time and forces them to escalate. The user is usually one click away from the fix if you tell them where to click.

### R5.4 — Truth-first multi-step UX
Multi-step processes (audits, bakes, IDE startup, provisioning) surface each step's state to the user in real time. **Never hang a page with a spinner while the user waits for an opaque process.** Show the steps, show what's running now, show what's blocking.

**Why:** an opaque spinner is a black hole. The user can't tell if it's working, stuck, or broken. A staged-progress UI lets the user (and any agent observing) catch a stuck step in 30 seconds instead of 30 minutes.

### R5.5 — Test-first reality check
Most code should actually work on its first integration. That requires tests that exercise the **real shapes** of inputs and outputs — not mocks that lie. Tests written against the real fixtures, the real database dialect, and the real adapter responses catch the bugs that mocked tests miss.

**Why:** a test suite full of mocks tells you the mocks pass. A test suite that hits the real surfaces tells you the system works.

### R5.6 — Self-healing where possible
When a transient failure has an obvious recovery (token refresh, retry with backoff, fallback to cached data, re-establish connection), the code attempts that recovery automatically with bounded retries and a loud audit when recovery exhausts. Manual operator intervention should be the exception, not the default.

### R5.7 — Agentic tooling via API, not screen-scraping
When an AI agent interacts with the system, it uses internal APIs (CLI harnesses, postMessage bridges, structured probe responses) — never CSS-pixel coordinate guessing or DOM string-matching.

---

## 6. Agent Behavior & Single-Operator Automation

The default operating context is a solo developer + one or more AI agents. Build for automation; surface concerns; don't fire-and-forget.
→ Deep dive: [`docs/standards/agent-behavior.md`](docs/standards/agent-behavior.md)

> **§6 status:** R6.1–R6.8, R6.10, R6.12 are active graded rules. **R6.9 (Deliberation Files Protocol)
> and R6.11 (wave execution tiering) are DEMOTED to optional playbook guidance** — no longer graded
> gates (they were meta-ceremony that cost a solo operator more than they returned).
> Section was frozen 2026-05-30 to keep agent-execution guidance flowing into the
> [`docs/standards/agent-behavior.md`](docs/standards/agent-behavior.md) playbook rather than R-rule
> sprawl, but **R6.12 was added 2026-05-31 by explicit operator request** — diagnostic discipline
> is doctrine, not playbook calibration. Re-freeze applies after R6.12.

### R6.1 — Automation-first thinking
When a process has steps (provisioning, baking, audits, deploys, CI), automate the steps end-to-end. A "you have to run this command, then that command" runbook is a defect — the runbook is the gap between what is and what should be.

**Why:** every manual step is a step the solo operator forgets at 11pm. Automation is the only thing that scales to a one-person team without burnout.

### R6.2 — Surface concerns; never guess silently
When an agent encounters ambiguity (missing spec, conflicting constraints, an unfamiliar pattern), it surfaces the question to the operator with a recommended direction. When it sees a better approach than the prompt, it surfaces that too. When it sees a critical risk or gotcha (security, data loss, irreversible action), it halts and surfaces.

### R6.3 — Track CI to completion
When an agent opens a PR, it actively tracks CI to completion via background polling, monitor processes, or wait-for-green flows. Opening a PR and abandoning the session is a defect.

### R6.4 — Authorized merges only
When CI goes green, the agent either explicitly prompts for merge OR auto-merges under a **documented authorization scope** (a CLAUDE.md grant, a session-level explicit approval, a loop handoff doc). Silent merges without an authorization basis are a defect.

### R6.5 — Loud failure modes for long-running agents
Long-running agent tasks (multi-hour background jobs, autonomous loops, code-generation sessions) emit wall-clock heartbeats — not just transition events. A silent agent is presumed stuck and must be investigated, not waited on. Heartbeat threshold: ≤2 minutes.

**Why:** an agent that produces output in bursts but goes quiet for stretches is indistinguishable from a stuck agent without a wall-clock signal. Heartbeats turn "is it working?" from a guess into an observation.

### R6.6 — Pre-action health check on shared infrastructure
Before assuming a remote system processed your request (CI fired, webhook delivered, queue accepted), verify the global health of that system. A request that hits an outage and stays "seen" but not "processed" is invisible without a liveness check.

### R6.7 — Worktree + branch safety
Before any `git checkout`, `git commit`, or `git push`, confirm `pwd`, current branch, and worktree layout. Check exit codes — a failed `git checkout` does not raise an error, it leaves the shell on the previous branch. Never use destructive flags (`gh pr close --delete-branch`, `git push --force`, `git reset --hard`) on branches the agent did not create in the same session.

### R6.8 — Scoped autonomy
Autonomous agents operate inside an explicit scope (a worktree, a directory tree, a list of authorized commands). Out-of-scope modifications are a hard halt and must be surfaced before continuing.

### R6.9 — Multi-agent deliberation (DFP) · DEMOTED → optional playbook
> **Optional, not a graded gate** (demoted 2026-05-30). Use the per-agent-file pattern when a multi-agent deliberation genuinely needs a bounded-context reasoning trace; skip the ceremony for routine work. Reference spec retained below + in [`docs/standards/agent-behavior.md`](docs/standards/agent-behavior.md).

When two or more agents collaborate on planning, audit, design, or doctrine work, coordination happens via per-agent markdown files — not group chat. Each agent writes independently in v1, reads peers and updates their file in v2+, until plans converge. Strict convergence (every agent's recommended action aligns) ends the deliberation; unresolvable disagreement after a deep-dive round escalates to human. Round cap = `2 + N agents`.

**Why:** group-chat coordination forces every message into every agent's context (linear bloat). File-based coordination keeps each agent's context bounded to their own work + on-demand peer reads. The pattern delivers ~5–10x context efficiency at deliberation steady state AND preserves a reasoning trace that chat doesn't.

**Audit test:** any multi-agent planning, audit, or design work in this project has per-agent deliberation files at `docs/deliberation/<topic>/<agent>.md` (or session-ephemeral equivalent), follows the template, and produces a Decision Record alongside the canonical sink on convergence.

→ Full protocol spec: [`docs/standards/agent-behavior.md`](docs/standards/agent-behavior.md) §"Multi-agent deliberation (DFP)"

### R6.10 — Authorized persistent-state mutations under structural guard
Automated application of persistent-state mutations (database migrations, infrastructure provisioning, irreversible config changes) is acceptable when **both** (a) a documented authorization scope per R6.4 covers the class of change, AND (b) structural guards substitute for per-action human review: a static safety classifier on the change content, multi-layer agent review, drift / parity verification, and an explicit halt path for the destructive residual the operator chose to retain under human approval.

**Why:** human "approval" on a class of action the human cannot meaningfully review degrades into rubber-stamping, which is worse than well-designed automation with strong checks. The operator's review time is a finite resource; spend it on the actions where the human eye genuinely adds signal (UX calls, scope decisions, irreversible destructive operations) — not on additive migrations the static classifier and the parity check already verify more rigorously than a glance.

**Audit test:** every automated persistent-state mutation has (a) an authorization-scope citation recorded in the audit log, (b) a passing structural-guard log entry naming the checks that fired (e.g. `lint:sql-rls`, `migration-parity`, `sub-agent-review`, `static-destructive-classifier`), and (c) for destructive-class detection, a halt audit event when the classifier flags drop / rename / alter-type / truncate / unscoped-delete operations the standing grant does not cover.

→ Full protocol spec: [`docs/standards/agent-behavior.md`](docs/standards/agent-behavior.md) §"Authorized persistent-state mutations"

### R6.11 — Wave execution tiering · DEMOTED → optional playbook
> **Optional, not a graded gate** (demoted 2026-05-30). Calibration guidance for multi-agent waves — apply judgement per wave; do not treat the tiers below as a mandatory checklist. The substrate-review intent is already covered by R6.10 (structural guards on persistent-state mutations).

Multi-PR waves (substrate-touching deliveries, multi-session features) follow a tiered execution discipline. The total review budget — pre-dispatch reviews, post-PR reviews, local pre-push verification — is finite. Spend it where reviewers empirically catch BLOCKERs; skip it where empirical history shows GO-WITH-NITS with no BLOCKERs.

The empirical record across AP-13 through AP-20 (2026-05-26 → 2026-05-28) supports the following calibration:

#### Pre-dispatch 2-reviewer pass — mandatory when, skippable when

**Mandatory** (substrate-touching waves; ~100% BLOCK round-1 rate observed):
- New SECURITY DEFINER function bodies or rewrites of existing ones
- Changes to `audit_events`, `audit_outbox`, or any hash-chained substrate
- New credential-issuance surfaces (JWT minting, scoped tokens, blob credentials)
- Any wave that introduces a new trust boundary (multi-tenant token binding, webhook 2xx contracts)
- Any wave that changes the `claim_vm_slot` lane discipline, `record_audit_event` signature, or `enqueue_audit_event` surface

**Skippable** (thin-substrate / TS-only waves; empirically GO-WITH-NITS round-1):
- Pure TS refactors that touch only application code, not substrate
- UI-only PRs (component edits, styling, layout)
- Doc-only PRs (README, addendum, AI_STANDARDS itself)
- Configuration updates with no security surface (lint config, formatter, test runner)
- Extension waves on top of an established substrate that don't change the substrate (e.g., new audit event types added to the allowlist; reusing existing mint helpers without adding new ones)

When skipped, the post-PR review stays at full depth.

#### Post-PR review depth — 2-layer default, 3-layer when needed

**Default (2-layer)**: doctrine reviewer + adversarial reviewer in parallel. Skip the reconciler layer when both agree on a verdict (both GO-WITH-NITS, or both BLOCK).

**Promote to 3-layer (add reconciler)** when:
- Doctrine and adversarial reviewers return diverging verdicts (GO + BLOCK, GO + NIT-only, etc.)
- The wave touches the audit hash chain, RLS policies, or cross-tenant credential paths
- The operator explicitly requests deeper review

The reconciler layer's role is dispute resolution + cross-finding consolidation, not extra discovery. When the two reviewers agree, the reconciler adds latency without adding signal.

**Mandatory sub-check — test-registration grep**: every post-PR review verifies that new test files are wired into the project's test runner (e.g., grep `package.json` for the new path under `test:unit`). The R4.5 silent-zero failure mode applies recursively to test infrastructure: a test file that exists on disk but isn't enumerated by the runner ships green and provides zero signal. This is the failure mode that orphaned wave 1b's 23 unit tests and AP-19f's SQL-shape assertion test — both shipped CI-green because their own runner-registration was missing. Add the file to the runner's enumeration before merging.

#### Prompt sanity-check ritual — author runs grep before sending

Every prompt that cites a "reuse $X" claim — a function name, file path, helper module, primitive — MUST be sanity-checked by the prompt author before dispatch:

```bash
grep -rn '$X' src/  # confirm cited primitive exists
```

Paste the `file:line` evidence into the prompt's "Pre-existing state" section. A missing primitive is a BLOCKER caught at prompt-write time (5 minutes) instead of at pre-dispatch (30 minutes + builder rework).

The PM-G6 BLOCKER on AP-20 wave 1b (2026-05-28) is the canonical incident: the prompt cited "PM-G6 scoped-credential primitives: live" — grep returned 0 hits. Catching that at prompt-write time would have saved ~2 hours of doomed builder cycles or scope-reduction decision time.

**Mandatory sub-check — head-currency**: when the prompt cites a SQL function or TS module body at `file:line`, verify that file is the CURRENT head of the function definition. Later migrations may have re-CREATE-OR-REPLACE'd the body (the AP-19e migration rewrote AP-16's bodies for some functions but not others; the AP-19f prompt referenced the wrong head for `complete_campaign_pr` and `finalize_campaign` as a result). For SQL: `grep -nE "create or replace function public.<fn_name>" supabase/migrations/*.sql` — the file with the latest timestamp owns the head. For TS: confirm no later migration or commit rewrote the cited shape. Pre-dispatch reviewers can catch this but at higher cost than the author catching it at prompt-write time.

#### Local pre-push verification — full on substrate, lite on TS-only

**Full (default)**: `pnpm tsc --noEmit && pnpm lint && pnpm test:unit && pnpm build && pnpm migrations:parity`.

**Lite (TS-only waves with no migration)**: `pnpm tsc --noEmit && pnpm lint && pnpm test:unit`. Skip `pnpm build` — CI runs it in parallel with the next wave's prompt-authoring. Skip `pnpm migrations:parity` when no migration is shipping. Saves 5–7 min per wave.

A failed CI build on a lite-verified PR is acceptable; the recovery cost (fix + push fixup) is bounded by CI wall-clock and runs in parallel with the next wave's setup.

**Mandatory sub-check — parity stays in substrate waves**: `pnpm migrations:parity` is skippable ONLY when the wave ships no migration. Any wave that touches `supabase/migrations/` MUST run parity locally before push — the MCP-apply procedure realigns the ledger between shared-test and PROD, and a stale local ledger or untracked file can drift in subtle ways the CI parity check catches but only after the PR is up. For substrate waves, parity in pre-push is non-negotiable regardless of the rest of the lite/full split.

#### Cross-session file-map memory — recurring lookups become memory entries

When a wave's recon requires re-locating substrate that is stable but non-obvious (e.g., "the canonical audit emit shape is `kind='note'` + `payload.event_type=...`"; "the audit chain RPC is `verify_audit_chain(p_tenant)`"), the next session should not re-derive it. After a wave merges, add a one-line **file-map entry** to memory pointing at the substrate's canonical location:

```
- [audit-events canonical emit shape](file_map_audit_events_emit.md) — kind='note' + payload.event_type='<dot.path>'; outbox via enqueue_audit_event; allowlist in public.audit_event_types
```

File-map entries are SEPARATE from `feedback_*` lessons (which capture corrections / preferences). They are recall shortcuts, not corrections. Naming convention: `file_map_<subject>.md`.

**Why:** per-session recon (reading large files, grepping the codebase, re-deriving canonical patterns) is a steady tax across all multi-session work. File-map entries amortize the recon over many sessions. Per-session memory cost is bounded (one-line index entries) and the lookup hits before recon kicks in.

**Audit test:** any substrate-touching wave merge should be followed by either (a) at least one `file_map_*` entry capturing the substrate's canonical location, OR (b) confirmation that the relevant entries already exist.

### R6.12 — Root-cause diagnostic discipline

On any failing system (red CI, broken deploy, runtime error, unexpected output), identify the ACTUAL failure mode before proposing a fix. "Symptoms that look like X based on file inspection" is a hypothesis — the diagnosis is what the runtime/system actually reports. Run the cheap probe (read the log, query the system, run the failing command directly) BEFORE writing code that assumes the hypothesis.

If the first fix doesn't work, that's the signal. Two failed fix attempts in a row → pause, re-read the actual error / log / source-of-truth, and revise the model. Do NOT iterate guesses — the second guess starts from the same wrong premise as the first.

**Why:** plausible-cause-from-code-inspection is the dominant failure mode of fast agent work. The fix lands, looks right, ships green-on-itself (because the unchanged path is also green), and the underlying defect persists. Symptoms regress next time someone else's PR exercises the real broken path. Worked example: OELM PR #15 v1 (2026-05-31) — agent saw `env: { secrets… }` in a failing workflow, hypothesized "secrets unset", shipped a guard. CI stayed red because the actual issue was a `with: null` block from a comments-only YAML map; `gh run view <run-id>` (the cheap probe) would have surfaced "This run likely failed because of a workflow file issue" in one command. The agent burned a full PR cycle on a fix derived from inspection, then had to ship v2 with the real diagnosis.

**Audit test:** any agent-authored bug-fix PR cites the diagnostic evidence (log line / error message / probe output / failing repro) that confirmed the failure mode — not just the file the agent inspected to form the hypothesis. PRs whose body says "I noticed X in the code so I changed Y" without confirming evidence that X was actually the cause are findings against R6.12.

---

→ Full empirical record + per-wave calibration tables: see `~/.claude/plans/addendum-overnight-execution-handoff-10.md` and successors.

---

## Audit grading scheme

When an audit agent grades a code change against this doc:

- **Pass:** the change satisfies the rule, or the rule does not apply to this change.
- **Fail:** the change violates the rule. Findings include rule number, file:line, one-sentence description, and suggested fix.
- **N/A:** the rule has no surface to grade in this change.

Findings are ranked **BLOCKER / HIGH / MEDIUM / LOW** by the rule's implicit severity (security, data loss, finance integrity = BLOCKER; observability gaps = HIGH; ergonomics = MEDIUM/LOW).

The audit's job is not to nitpick — it's to find the rules that are genuinely violated, with clear evidence and a concrete fix path.

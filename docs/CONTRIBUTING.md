# Contributing & AI Development Guidelines

Welcome to the OverEngineered Solutions (OES) repository. To maintain codebase integrity, security, and consistent quality across all components, both human contributors and AI agents are required to adhere strictly to the following development protocols.

---

## 1. Branching & Pull Request Protocol (Mandatory)

This repository is protected at the protocol level by GitHub Rulesets. **Direct pushes to the default branch (`main`) are strictly prohibited and will be rejected by the server.**

### Workflow Requirements:
1. **Always Develop on a Feature Branch**:
   * Create a new descriptive branch for every task, bug fix, or feature.
   * Naming convention: `feature/<short-description>` or `bugfix/<short-description>`.
   * Example: `git checkout -b feature/sandbox-egress-rules`
2. **Submit a Pull Request (PR)**:
   * Push your feature branch to the remote origin.
   * Open a Pull Request on GitHub targeting the `main` branch.
3. **Merge Requirement**:
   * Once a PR is created, any configured continuous integration (CI) workflows will automatically trigger.
   * You may self-merge the PR only after confirming that all automated test and build suites have completed successfully (showing a "green" state).

---

## 2. Guidelines for AI Coding Agents

If you are an AI assistant, autonomous agent, or coding engine (e.g., Claude Code, GitHub Copilot, Cursor, Windsurf) operating within this workspace, you must adhere to these mechanical boundaries:

* **No Direct Commits/Pushes to Default Branches**: Do not attempt to commit or push directly to `main`. If you attempt to do so, your push will be rejected by GitHub's server-side pre-receive hooks.
* **Pre-Push Verification**: Always run the codebase verification checks locally before pushing or requesting a merge:
  * Run Linter: `pnpm lint`
  * Run TypeScript and Next.js Build: `pnpm build`
  * Run Test Suite: `pnpm test`
* **Maintain Observability Doctrine**: When implementing any external API wrapper, strictly follow the **Observability Doctrine** documented in the main [CLAUDE.md](file:///CLAUDE.md) (Zod-parsing, shape-observed logging, iteration-boundary count logs, and smoke tests).
* **Respect Tenant Scaffolding**: Any database schema changes or data insertion queries must preserve tenant isolation (`tenant_id` columns and `scope` boundaries).

---

## 3. Local Development Command Cheat-sheet

Refer to [CLAUDE.md](file:///CLAUDE.md) for detailed descriptions, but these are the quick commands to run for verification:

* **Install Dependencies**: `pnpm install`
* **Run Local Dev Server**: `pnpm dev`
* **Run Lint Suite**: `pnpm lint`
* **Compile and Build**: `pnpm build`
* **Run Automated Tests**: `pnpm test`

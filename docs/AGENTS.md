# Agent Project Facts

## Canonical Identifiers
- `OES_PROJECT_SLUG`: `oesolutions-self`
- `OES_CAPTURE_HUMAN_TODO_URL`: `https://<oes-prod-host>/api/external/capture-human-todo`

## Project Context
- This repository is the OES self project (`oesolutions-self`).
- Operator-action capture for human-owned work lands on OES via the capture endpoint above.
- The canonical operator-action storage substrate is OES `public.todos`.

## Agent Expectations
- Keep capture payloads structured (`human` / `human-fyi` assignees for operator-action capture).
- Prefer OES APIs for cross-agent portability (Claude, Codex, Cursor, AGY).
- Use this file for repo-specific facts; keep portfolio-wide doctrine in `AI_STANDARDS.md`.

## Compatibility Note
- This repo uses a Next.js version with breaking changes from many older examples.
- Check the installed Next docs path in `node_modules/next/dist/docs/` when available before making framework-level assumptions.

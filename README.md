# @overengineered-solutions/standards

Portable AI/engineering doctrine package for OES projects. It ships canonical markdown standards in `docs/` and a tiny TypeScript API for loading standards and referencing rule IDs.

## Install

```bash
pnpm add @overengineered-solutions/standards
```

## Usage

```ts
import { readStandard, listRules } from '@overengineered-solutions/standards';

const rules = listRules();
const standards = await readStandard('AI_STANDARDS');
```

This is alpha: the rules array is empty in `0.1.0`; populate via `getRule()` / `readStandard()` while the parser is being built.

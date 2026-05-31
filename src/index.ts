import { promises as fs } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type Rule = { id: string; title: string; mandatory: boolean };

export const RULES: Rule[] = [];

const STANDARD_FILE: Record<StandardName, string> = {
  AI_STANDARDS: 'AI_STANDARDS.md',
  AGENTS: 'AGENTS.md',
  CONTRIBUTING: 'CONTRIBUTING.md',
};

type StandardName = 'AI_STANDARDS' | 'AGENTS' | 'CONTRIBUTING';

export function getRule(id: string): Rule | undefined {
  return RULES.find((rule) => rule.id === id);
}

export function listRules(): Rule[] {
  return [...RULES];
}

function inferModuleReferenceFromStack(): string | undefined {
  const stack = new Error().stack;
  if (!stack) return undefined;

  const lines = stack.split('\n');
  for (const line of lines) {
    const match = line.match(/(file:\/\/[^\s)]+|\/[^\s)]+):(\d+):(\d+)/);
    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
}

function resolveCandidates(name: StandardName): Array<string | URL> {
  const fileName = STANDARD_FILE[name];
  const candidates: Array<string | URL> = [];

  if (typeof __dirname === 'string') {
    candidates.push(resolve(__dirname, '../../docs', fileName));
    candidates.push(resolve(__dirname, '../docs', fileName));
  }

  const moduleRef = inferModuleReferenceFromStack();
  if (moduleRef?.startsWith('file://')) {
    const moduleUrl = new URL(moduleRef);
    candidates.push(new URL(`../../docs/${fileName}`, moduleUrl));
    candidates.push(new URL(`../docs/${fileName}`, moduleUrl));
    const modulePath = fileURLToPath(moduleUrl);
    candidates.push(resolve(dirname(modulePath), '../../docs', fileName));
    candidates.push(resolve(dirname(modulePath), '../docs', fileName));
  } else if (moduleRef?.startsWith('/')) {
    const moduleDir = dirname(moduleRef);
    candidates.push(resolve(moduleDir, '../../docs', fileName));
    candidates.push(resolve(moduleDir, '../docs', fileName));
  }

  candidates.push(resolve(process.cwd(), 'docs', fileName));

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = typeof candidate === 'string' ? candidate : candidate.href;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function readStandard(name: StandardName): Promise<string> {
  const candidates = resolveCandidates(name);
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      return await fs.readFile(candidate, 'utf8');
    } catch (error) {
      lastError = error;
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT' && code !== 'ENOTDIR') {
        throw error;
      }
    }
  }

  throw new Error(
    `Unable to locate ${STANDARD_FILE[name]} in bundled docs/. Checked: ${candidates
      .map((candidate) => (typeof candidate === 'string' ? candidate : candidate.href))
      .join(', ')}. Last error: ${String(lastError)}`,
  );
}

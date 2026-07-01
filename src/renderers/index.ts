import type { NormalizedWorkflow, TargetName } from '../normalize.js';
import { VALID_TARGETS } from '../normalize.js';
import type { GeneratedFile } from './shared.js';
import { renderClaude } from './claude.js';
import { renderCodex } from './codex.js';
import { renderAgents } from './agents.js';
import { renderCursor } from './cursor.js';
import { renderCopilot } from './copilot.js';

export function renderWorkflow(w: NormalizedWorkflow, src: string, targets?: TargetName[]): GeneratedFile[] {
  const ts = targets ?? VALID_TARGETS.filter(t => w.targets[t].enabled);
  return ts.flatMap(t => {
    switch (t) {
      case 'claude': return renderClaude(w, src);
      case 'codex': return renderCodex(w, src);
      case 'agents': return renderAgents(w);
      case 'cursor': return renderCursor(w, src);
      case 'copilot': return renderCopilot(w, src);
      default: throw new Error(`Unhandled target: ${t satisfies never}`);
    }
  });
}

export function parseTargets(s?: string): TargetName[] | undefined {
  if (!s) return undefined;
  const raw = s.split(',').map(x => x.trim()).filter(Boolean);
  const invalid = raw.find(x => !VALID_TARGETS.includes(x as TargetName));
  if (invalid) throw new Error(`error targets.invalid:\n  Unknown target "${invalid}". Valid targets are: ${VALID_TARGETS.join(', ')}.`);
  return raw as TargetName[];
}

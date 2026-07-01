import type { NormalizedWorkflow } from '../normalize.js';
import type { GeneratedFile } from './shared.js';
import { md, notice, renderFrontmatter } from './shared.js';

export function renderClaude(w: NormalizedWorkflow, src = 'workflow.yaml'): GeneratedFile[] {
  const content = `${renderFrontmatter({ name: w.id, description: w.description })}\n${notice(src)}\n\n${md(w, { when: true })}`;
  return [{ path: `.claude/skills/${w.id}/SKILL.md`, content, target: 'claude' }];
}

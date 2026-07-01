import type { NormalizedWorkflow } from '../normalize.js';
import type { GeneratedFile } from './shared.js';
import { md, notice, renderFrontmatter } from './shared.js';

export function renderCursor(w: NormalizedWorkflow, src = 'workflow.yaml'): GeneratedFile[] {
  const fm: Record<string, unknown> = { description: w.description, alwaysApply: false };
  if (w.triggers.globs.length) fm.globs = w.triggers.globs;
  return [{ path: `.cursor/rules/${w.id}.mdc`, content: `${renderFrontmatter(fm)}\n${notice(src)}\n\n${md(w)}`, target: 'cursor' }];
}

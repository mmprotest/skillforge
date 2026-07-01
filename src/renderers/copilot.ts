import type { NormalizedWorkflow } from '../normalize.js';
import type { GeneratedFile } from './shared.js';
import { md, notice, renderFrontmatter } from './shared.js';

export function renderCopilot(w: NormalizedWorkflow, src = 'workflow.yaml'): GeneratedFile[] {
  const source = w.triggers.globs.length ? w.triggers.globs : (w.scope.paths.length ? w.scope.paths : ['**']);
  const apply = [...new Set(source)].join(',');
  return [{ path: `.github/instructions/${w.id}.instructions.md`, content: `${renderFrontmatter({ applyTo: apply })}\n${notice(src)}\n\n${md(w, { concise: true })}`, target: 'copilot' }];
}

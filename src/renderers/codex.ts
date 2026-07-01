import YAML from 'yaml';
import type { NormalizedWorkflow } from '../normalize.js';
import type { GeneratedFile } from './shared.js';
import { md, notice, renderFrontmatter } from './shared.js';

export function renderCodex(w: NormalizedWorkflow, src = 'workflow.yaml'): GeneratedFile[] {
  const files: GeneratedFile[] = [
    {
      path: `.agents/skills/${w.id}/SKILL.md`,
      content: `${renderFrontmatter({ name: w.id, description: w.description })}\n${notice(src)}\n\n${md(w, { when: true })}`,
      target: 'codex',
    },
  ];
  if (w.targets.codex.allowImplicitInvocation === false) {
    files.push({
      path: `.agents/skills/${w.id}/agents/openai.yaml`,
      content: YAML.stringify({ policy: { allow_implicit_invocation: false } }, { sortMapEntries: true }),
      target: 'codex',
    });
  }
  return files;
}

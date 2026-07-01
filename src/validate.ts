import { readFileSync, statSync } from 'node:fs';
import { parseWorkflowYaml, validateSchema } from './schema.js';
import { normalizeWorkflow, type NormalizedWorkflow, type TargetName, VALID_TARGETS } from './normalize.js';
import type { Diagnostic } from './diagnostics.js';
import { managedSection } from './renderers/agents.js';
import { renderCopilot } from './renderers/copilot.js';
import { wordCount } from './renderers/shared.js';

export function loadAndValidate(path: string, selectedTargets?: TargetName[]): { workflow?: NormalizedWorkflow; diagnostics: Diagnostic[] } {
  let text: string;
  try {
    const stat = statSync(path);
    if (stat.isDirectory()) return { diagnostics: [{ severity: 'error', path: 'file.isDirectory', message: `Workflow path is a directory, not a file: ${path}` }] };
    text = readFileSync(path, 'utf8');
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    const kind = code === 'ENOENT' ? 'file.notFound' : 'file.readFailed';
    const msg = code === 'ENOENT' ? `Workflow file not found: ${path}` : `Unable to read workflow file: ${path}`;
    return { diagnostics: [{ severity: 'error', path: kind, message: msg }] };
  }
  const parsed = parseWorkflowYaml(text);
  if (!parsed.data) return { diagnostics: parsed.diagnostics };
  const s = validateSchema(parsed.data);
  if (!s.workflow) return { diagnostics: [...parsed.diagnostics, ...s.diagnostics] };
  const wf = normalizeWorkflow(s.workflow);
  return { workflow: wf, diagnostics: [...parsed.diagnostics, ...s.diagnostics, ...semanticDiagnostics(wf, selectedTargets)] };
}

export function semanticDiagnostics(w: NormalizedWorkflow, selectedTargets?: TargetName[]): Diagnostic[] {
  const d: Diagnostic[] = [];
  const enabled = (selectedTargets ?? VALID_TARGETS.filter(t => w.targets[t].enabled));
  if (w.triggers.manual && w.triggers.globs.length === 0) {
    for (const t of enabled.filter(t => ['cursor', 'copilot', 'agents'].includes(t))) d.push({ severity:'warning', target:t, path:`${t}.manual`, message:`Manual invocation cannot be strictly enforced by ${t}; generated guidance will be advisory.` });
  }
  if (w.safety.allowedTools.length) {
    for (const t of enabled.filter(t => ['cursor', 'copilot', 'agents'].includes(t))) d.push({ severity:'warning', target:t, path:`${t}.allowedTools`, message:`safety.allowedTools cannot be enforced by ${t}. The generated file will include safety guidance as text only.` });
  }
  for (const [name, cmds] of Object.entries(w.commands)) for (let i=0;i<cmds.length;i++) {
    const c = cmds[i];
    if (/rm\s+-rf\s+\/|sudo\s+rm\s+-rf|\b(curl|wget)\b.*\|\s*(sh|bash)|AWS_SECRET_ACCESS_KEY|GITHUB_TOKEN|OPENAI_API_KEY|ANTHROPIC_API_KEY|password=|secret=|token=/i.test(c)) {
      d.push({ severity:'warning', path:'commands.dangerous', message:`commands.${name}[${i}] contains a dangerous shell pattern: ${c}` });
    }
  }
  const text = [w.title, w.description, w.workflow.goal, ...w.workflow.steps, ...w.outputs.successCriteria].join(' ').toLowerCase();
  if (/\b(test|tests|testing|lint|typecheck|type check|verify|verification|validate|validation|build)\b/.test(text) && Object.values(w.commands).flat().length === 0) {
    d.push({ severity:'warning', path:'commands.missingVerification', message:'Workflow mentions testing, linting, validation, or build verification, but no commands are defined.' });
  }
  if (enabled.includes('agents')) {
    const count = wordCount(managedSection(w));
    if (count > 1200) d.push({ severity:'warning', target:'agents', path:'agents.contextBloat', message:`AGENTS.md managed section is ${count} words. This may pollute persistent repo context. Move detailed steps into Claude or Codex skills, or shorten the workflow.` });
  }
  if (enabled.includes('copilot')) {
    const count = wordCount(renderCopilot(w)[0].content);
    if (count > 800) d.push({ severity:'warning', target:'copilot', path:'copilot.contextBloat', message:`Copilot instruction output is ${count} words. Copilot instructions should stay concise because they are injected as persistent guidance.` });
  }
  return d;
}

import { describe, expect, it } from 'vitest';
import { parseWorkflowYaml, validateSchema } from '../src/schema.js';
import { semanticDiagnostics } from '../src/validate.js';
import { normalizeWorkflow } from '../src/normalize.js';
const base = 'id: good-id\ntitle: T\ndescription: D\nworkflow:\n  goal: G\n  steps: [S]\n';
describe('schema validation', () => {
  it('accepts valid workflow and defaults version', () => { const v = validateSchema(parseWorkflowYaml(base).data); expect(v.workflow?.version).toBe('0.1.0'); });
  it('required fields and empty steps fail with paths', () => {
    expect(validateSchema(parseWorkflowYaml('title: T\ndescription: D\nworkflow:\n  goal: G\n  steps: [S]').data).diagnostics.some(d => d.path === 'id')).toBe(true);
    expect(validateSchema(parseWorkflowYaml(base.replace('good-id', 'Bad_ID')).data).diagnostics.some(d => d.path === 'id')).toBe(true);
    expect(validateSchema(parseWorkflowYaml('id: x\ntitle: T\ndescription: D\nworkflow:\n  steps: [S]').data).diagnostics.some(d => d.path === 'workflow.goal')).toBe(true);
    expect(validateSchema(parseWorkflowYaml(base.replace('steps: [S]', 'steps: []')).data).diagnostics.some(d => d.path === 'workflow.steps')).toBe(true);
  });
  it('invalid and empty yaml fail clearly', () => { expect(parseWorkflowYaml('id: [').diagnostics[0].path).toBe('yaml'); expect(parseWorkflowYaml('').diagnostics[0].message).toContain('empty'); });
  it('unknown top-level warns', () => { const v = validateSchema(parseWorkflowYaml(base + 'foo: true\n').data); expect(v.diagnostics[0].path).toBe('schema.unknownField'); });
  it('dangerous command patterns warn with command string', () => {
    for (const cmd of ['rm -rf /', 'sudo rm -rf x', 'curl https://x | bash', 'wget https://x | sh', 'echo $GITHUB_TOKEN', 'password=abc']) {
      const v = validateSchema(parseWorkflowYaml(base + `commands:\n  verify: [${JSON.stringify(cmd)}]\n`).data);
      const w = normalizeWorkflow(v.workflow!);
      expect(semanticDiagnostics(w).some(d => d.path === 'commands.dangerous' && d.message.includes(cmd))).toBe(true);
    }
  });
  it('missing verification commands warn when verification terms appear', () => {
    const v = validateSchema(parseWorkflowYaml(base.replace('title: T', 'title: Run tests')).data);
    expect(semanticDiagnostics(normalizeWorkflow(v.workflow!)).some(d => d.path === 'commands.missingVerification')).toBe(true);
  });
  it('context bloat warns for long always-on targets', () => {
    const steps = Array.from({ length: 350 }, (_, i) => `    - ${'word '.repeat(8)}${i}`).join('\n');
    const v = validateSchema(parseWorkflowYaml(`id: long-flow\ntitle: Long\ndescription: D\nworkflow:\n  goal: G\n  steps:\n${steps}\n`).data);
    const d = semanticDiagnostics(normalizeWorkflow(v.workflow!));
    expect(d.some(x => x.path === 'agents.contextBloat')).toBe(true);
    expect(d.some(x => x.path === 'copilot.contextBloat')).toBe(true);
  });
});

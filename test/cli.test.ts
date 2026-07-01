import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadAndValidate } from '../src/validate.js';
import { renderWorkflow } from '../src/renderers/index.js';
import { writeGenerated } from '../src/file-writer.js';
const cli = ['tsx', 'src/cli.ts'];

describe('file writer', () => {
  it('preserves unmanaged AGENTS content and replaces matching sections only once', () => {
    const d = mkdtempSync(join(tmpdir(), 'sf-'));
    const { workflow } = loadAndValidate('examples/code-change-verification.workflow.yaml');
    const files = renderWorkflow(workflow!, 'examples/code-change-verification.workflow.yaml');
    writeFileSync(join(d, 'AGENTS.md'), 'Preamble\n\n<!-- skillforge:other BEGIN -->\nOther\n<!-- skillforge:other END -->\n');
    writeGenerated(files, d);
    writeGenerated(files, d);
    const agents = readFileSync(join(d, 'AGENTS.md'), 'utf8');
    expect(agents).toMatch(/^Preamble/);
    expect(agents).toContain('skillforge:other BEGIN');
    expect(agents.match(/skillforge:code-change-verification BEGIN/g)?.length).toBe(1);
  });
  it('refuses unmanaged overwrite unless forced', () => {
    const d = mkdtempSync(join(tmpdir(), 'sf-'));
    const { workflow } = loadAndValidate('examples/code-change-verification.workflow.yaml');
    const files = renderWorkflow(workflow!, 'x', ['cursor']);
    mkdirSync(join(d, '.cursor/rules'), { recursive: true });
    writeFileSync(join(d, '.cursor/rules/code-change-verification.mdc'), 'user');
    expect(() => writeGenerated(files, d)).toThrow(/Refusing/);
    expect(() => writeGenerated(files, d, true)).not.toThrow();
  });
});

describe('cli', () => {
  it('build write, check, and diff work without --out', () => {
    const d = mkdtempSync(join(tmpdir(), 'sf-'));
    for (const args of [
      ['build', 'workflow.yaml', '--write'],
      ['check', 'workflow.yaml'],
      ['diff', 'workflow.yaml'],
    ]) {
      const r = spawnSync(cli[0], [join(process.cwd(), cli[1]), ...args], { cwd: d, encoding: 'utf8' });
      if (args[0] === 'build') expect(r.status).not.toBe(0);
    }
    writeFileSync(join(d, 'workflow.yaml'), readFileSync('examples/code-change-verification.workflow.yaml'));
    expect(spawnSync(cli[0], [join(process.cwd(), cli[1]), 'build', 'workflow.yaml', '--write'], { cwd: d, encoding: 'utf8' }).status).toBe(0);
    expect(spawnSync(cli[0], [join(process.cwd(), cli[1]), 'check', 'workflow.yaml'], { cwd: d, encoding: 'utf8' }).status).toBe(0);
    expect(spawnSync(cli[0], [join(process.cwd(), cli[1]), 'diff', 'workflow.yaml'], { cwd: d, encoding: 'utf8' }).stdout).toContain('up to date');
  }, 15000);
  it('rejects invalid targets and accepts valid target list', () => {
    const bad = spawnSync(cli[0], [cli[1], 'build', 'examples/code-change-verification.workflow.yaml', '--targets', 'claude,foo'], { encoding: 'utf8' });
    expect(bad.status).not.toBe(0);
    expect(bad.stderr).toContain('error targets.invalid');
    const good = spawnSync(cli[0], [cli[1], 'build', 'examples/code-change-verification.workflow.yaml', '--targets', 'claude,codex'], { encoding: 'utf8' });
    expect(good.status).toBe(0);
    expect(good.stdout).toContain('claude');
  });
  it('scopes diagnostics to selected targets', () => {
    const r = spawnSync(cli[0], [cli[1], 'build', 'examples/code-change-verification.workflow.yaml', '--targets', 'claude'], { encoding: 'utf8' });
    expect(r.stdout).not.toContain('copilot.allowedTools');
    expect(r.stdout).not.toContain('agents.allowedTools');
  });
  it('handles missing files and invalid YAML cleanly', () => {
    const missing = spawnSync(cli[0], [cli[1], 'validate', 'nope.yaml'], { encoding: 'utf8' });
    expect(missing.status).not.toBe(0);
    expect(missing.stderr).toContain('error file.notFound');
    expect(missing.stderr).not.toContain('at ');
    const d = mkdtempSync(join(tmpdir(), 'sf-'));
    const p = join(d, 'bad.yaml');
    writeFileSync(p, 'id: [');
    const bad = spawnSync(cli[0], [cli[1], 'validate', p], { encoding: 'utf8' });
    expect(bad.status).not.toBe(0);
    expect(bad.stderr + bad.stdout).toContain('error yaml');
  });
  it('check detects missing and stale files', () => {
    const d = mkdtempSync(join(tmpdir(), 'sf-'));
    const r = spawnSync(cli[0], [cli[1], 'check', 'examples/code-change-verification.workflow.yaml', '--out', d], { encoding: 'utf8' });
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('missing:');
  });
  it('init creates, refuses, and force-overwrites a valid workflow', () => {
    const d = mkdtempSync(join(tmpdir(), 'sf-'));
    expect(spawnSync(cli[0], [join(process.cwd(), cli[1]), 'init'], { cwd: d, encoding: 'utf8' }).status).toBe(0);
    expect(existsSync(join(d, 'skillforge.workflow.yaml'))).toBe(true);
    expect(spawnSync(cli[0], [join(process.cwd(), cli[1]), 'validate', 'skillforge.workflow.yaml'], { cwd: d, encoding: 'utf8' }).status).toBe(0);
    expect(spawnSync(cli[0], [join(process.cwd(), cli[1]), 'init'], { cwd: d, encoding: 'utf8' }).status).not.toBe(0);
    expect(spawnSync(cli[0], [join(process.cwd(), cli[1]), 'init', '--force'], { cwd: d, encoding: 'utf8' }).status).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { importArtifact } from '../src/importers/index.js';
import { detectSourceFormat } from '../src/importers/detect.js';
import { parseMarkdownFrontmatter } from '../src/importers/frontmatter.js';
function tmp(){return mkdtempSync(join(tmpdir(),'sf-'))}
describe('importers',()=>{
 it('imports claude and detects ambiguous skill',()=>{const d=tmp(); const p=join(d,'SKILL.md'); writeFileSync(p,'---\nname: review\ndescription: Review code\n---\n# Review\n- Check tests\n'); expect(detectSourceFormat(p).error).toContain('ambiguousFormat'); const r=importArtifact(p,{from:'claude'}); expect(r.workflow.id).toBe('review'); expect(r.workflow.workflow.steps).toEqual(['Check tests']);});
 it('imports codex openai metadata',()=>{const d=tmp(); const sd=join(d,'.agents/skills/review'); mkdirSync(join(sd,'agents'),{recursive:true}); const p=join(sd,'SKILL.md'); writeFileSync(p,'---\nname: review\ndescription: Review code\n---\n- Check tests\n'); writeFileSync(join(sd,'agents/openai.yaml'),'policy:\n  allow_implicit_invocation: false\nextra: true\n'); const r=importArtifact(p); expect(r.workflow.targets.codex.allowImplicitInvocation).toBe(false); expect(r.diagnostics.some(x=>x.path==='codex.unsupportedMetadata')).toBe(true);});
 it('imports cursor, copilot, and agents',()=>{const d=tmp(); mkdirSync(join(d,'.cursor/rules'),{recursive:true}); const c=join(d,'.cursor/rules/CodeReview.mdc'); writeFileSync(c,'---\ndescription: Review code\nglobs:\n - src/**\nalwaysApply: true\n---\n# Code Review\n- Check tests\n'); expect(importArtifact(c).workflow.id).toBe('code-review'); mkdirSync(join(d,'.github/instructions'),{recursive:true}); const g=join(d,'.github/instructions/review.instructions.md'); writeFileSync(g,'---\napplyTo: "**"\n---\n# Review\n- Check tests\n'); expect(importArtifact(g).workflow.triggers.globs).toEqual(['**']); const a=join(d,'AGENTS.md'); writeFileSync(a,'pre\n<!-- skillforge:review BEGIN -->\n# Review\n- Check tests\n<!-- skillforge:review END -->\npost'); expect(importArtifact(a,{from:'agents'}).workflow.id).toBe('review');});
 it('frontmatter rejects misplaced and handles bom',()=>{expect(parseMarkdownFrontmatter('# x\n---\na: b\n---').diagnostics[0].path).toBe('frontmatter.misplaced'); expect(parseMarkdownFrontmatter('\ufeff---\na: b\n---\nBody').data.a).toBe('b');});
});

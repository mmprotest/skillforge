import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { materialize } from '../src/file-writer.js';
import { formatDiagnostics } from '../src/diagnostics.js';
import { renderCopilot } from '../src/renderers/copilot.js';
describe('writer/package polish',()=>{
 it('preserves AGENTS unmanaged content and replaces same section',()=>{const d=mkdtempSync(join(tmpdir(),'sf-')); const p=join(d,'AGENTS.md'); const old='prefix  \n\n<!-- skillforge:other BEGIN -->\nother\n<!-- skillforge:other END -->\n\nsuffix  '; writeFileSync(p,old); const f={path:'AGENTS.md',target:'agents' as const,content:'<!-- skillforge:x BEGIN -->\nnew\n<!-- skillforge:x END -->\n'}; let m=materialize(f,d); expect(m.content).toBe(old+'\n\n'+f.content); writeFileSync(p,m.content); m=materialize({...f,content:'<!-- skillforge:x BEGIN -->\nnew2\n<!-- skillforge:x END -->\n'},d); expect((m.content.match(/skillforge:x BEGIN/g)||[]).length).toBe(1); expect(m.content).toContain('prefix  \n\n'); expect(m.content).toContain('suffix  \n\n');});
 it('formats diagnostics cleanly',()=>{expect(formatDiagnostics([{severity:'warning',target:'agents',path:'agents.allowedTools',message:'m'}])).toBe('warning agents.allowedTools:\n  m');});
 it('dedupes copilot applyTo',()=>{const w:any={id:'x',title:'X',description:'D',version:'0.1.0',triggers:{globs:['a','a'],phrases:[],manual:false},scope:{paths:['b']},inputs:[],workflow:{goal:'D',steps:['Do it']},commands:{},safety:{allowedTools:[],never:[]},outputs:{successCriteria:[]},targets:{copilot:{enabled:true}}}; expect(renderCopilot(w)[0].content).toContain('applyTo: "a"');});
 it('package dry-run excludes source and tests',()=>{const out=execFileSync('npm',['pack','--dry-run','--json'],{encoding:'utf8'}); expect(out).toContain('dist/cli.js'); expect(out).not.toContain('src/cli.ts'); expect(out).not.toContain('test/');});
});

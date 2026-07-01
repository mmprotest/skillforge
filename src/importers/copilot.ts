import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseMarkdownFrontmatter } from './frontmatter.js';
import { asStrings, mdWorkflow } from './common.js';
import type { ImportResult } from './types.js';
export function importCopilot(sourcePath:string): ImportResult { const fm=parseMarkdownFrontmatter(readFileSync(sourcePath,'utf8')); const id=path.basename(sourcePath,'.instructions.md'); const globs=asStrings(fm.data.applyTo); const r=mdWorkflow(id,fm.data,fm.body,'copilot',{triggers:{globs}, targets:{copilot:{enabled:true}}},fm.diagnostics); r.diagnostics.push({severity:'info', path:'conversion.scopeMapped', message:'Copilot applyTo globs were mapped to workflow triggers.globs.'}); return {workflow:r.workflow, diagnostics:r.diagnostics, sourceFormat:'copilot', sourcePath}; }

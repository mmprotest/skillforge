import { readFileSync } from 'node:fs';
import { parseMarkdownFrontmatter } from './frontmatter.js';
import { asString, idFromFile, mdWorkflow } from './common.js';
import type { ImportResult } from './types.js';
export function importClaude(sourcePath:string): ImportResult { const text=readFileSync(sourcePath,'utf8'); const fm=parseMarkdownFrontmatter(text); const id=asString(fm.data.name) ?? idFromFile(sourcePath); const r=mdWorkflow(id,fm.data,fm.body,'claude',{},fm.diagnostics); return {workflow:r.workflow, diagnostics:r.diagnostics, sourceFormat:'claude', sourcePath}; }

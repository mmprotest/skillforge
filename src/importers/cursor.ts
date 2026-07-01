import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseMarkdownFrontmatter } from './frontmatter.js';
import { asStrings, mdWorkflow } from './common.js';
import type { ImportResult } from './types.js';
export function importCursor(sourcePath:string): ImportResult { const fm=parseMarkdownFrontmatter(readFileSync(sourcePath,'utf8')); const globs=asStrings(fm.data.globs); const always=fm.data.alwaysApply===true; const r=mdWorkflow(path.basename(sourcePath,'.mdc'),fm.data,fm.body,'cursor',{triggers:{globs, manual:!always}, scope:{paths:globs}, targets:{cursor:{enabled:true}}},fm.diagnostics); return {workflow:r.workflow, diagnostics:r.diagnostics, sourceFormat:'cursor', sourcePath, metadata:{alwaysApply:always}}; }

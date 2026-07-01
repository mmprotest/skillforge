import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { parseMarkdownFrontmatter } from './frontmatter.js';
import { asString, idFromFile, mdWorkflow } from './common.js';
import type { ImportResult } from './types.js';
export function importCodex(sourcePath:string): ImportResult { const fm=parseMarkdownFrontmatter(readFileSync(sourcePath,'utf8')); const id=asString(fm.data.name) ?? idFromFile(sourcePath); const diagnostics=fm.diagnostics; const targets:any={codex:{enabled:true}}; const openai=path.join(path.dirname(sourcePath),'agents','openai.yaml'); if (existsSync(openai)) { const data=YAML.parse(readFileSync(openai,'utf8')) ?? {}; if (data?.policy?.allow_implicit_invocation === false) targets.codex.allowImplicitInvocation=false; const unsupported=Object.keys(data).filter(k=>k!=='policy'); const pol=Object.keys(data.policy ?? {}).filter(k=>k!=='allow_implicit_invocation').map(k=>`policy.${k}`); if (unsupported.length||pol.length) diagnostics.push({severity:'warning', path:'codex.unsupportedMetadata', message:`agents/openai.yaml contains fields that Skillforge does not currently preserve: ${[...unsupported,...pol].join(', ')}`}); }
 const r=mdWorkflow(id,fm.data,fm.body,'codex',{targets},diagnostics); return {workflow:r.workflow, diagnostics:r.diagnostics, sourceFormat:'codex', sourcePath}; }

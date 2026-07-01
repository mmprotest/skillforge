import path from 'node:path';
import { readFileSync } from 'node:fs';
import { parseMarkdownFrontmatter } from './frontmatter.js';
import type { SourceFormat } from './types.js';
export function parseSourceFormat(s: string): SourceFormat { const ok=['claude','codex','cursor','copilot','agents']; if (!ok.includes(s)) throw new Error(`error import.invalidFormat:\n  Unknown source format "${s}". Valid formats are: ${ok.join(', ')}.`); return s as SourceFormat; }
export function detectSourceFormat(filePath: string): { format?: SourceFormat; error?: string } {
  const base = path.basename(filePath); if (base === 'AGENTS.md') return {format:'agents'};
  let text=''; try { text = readFileSync(filePath,'utf8'); } catch { return { error:`error import.unsupportedFormat:\n  Could not determine source format for path: ${filePath}`}; }
  const fm = parseMarkdownFrontmatter(text).data;
  const norm = filePath.split(path.sep).join('/');
  if (base.endsWith('.instructions.md') && Object.prototype.hasOwnProperty.call(fm,'applyTo')) return {format:'copilot'};
  if (base.endsWith('.mdc') && ('description' in fm || 'globs' in fm || 'alwaysApply' in fm)) return {format:'cursor'};
  if (base === 'SKILL.md' && 'name' in fm && 'description' in fm) {
    const isClaude = norm.includes('/.claude/skills/'); const isCodex = norm.includes('/.agents/skills/');
    if (isClaude && !isCodex) return {format:'claude'}; if (isCodex && !isClaude) return {format:'codex'};
    return { error:'error import.ambiguousFormat:\n  Could not determine whether SKILL.md is a Claude or Codex skill. Pass --from claude or --from codex.' };
  }
  return { error:`error import.unsupportedFormat:\n  Could not determine source format for path: ${filePath}` };
}

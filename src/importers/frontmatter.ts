import YAML from 'yaml';
import type { Diagnostic } from '../diagnostics.js';
export type FrontmatterResult = { data: Record<string, unknown>; body: string; diagnostics: Diagnostic[]; hasFrontmatter: boolean };
export function parseMarkdownFrontmatter(text: string): FrontmatterResult {
  const diagnostics: Diagnostic[] = [];
  let s = text;
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  if (!s.startsWith('---\n') && !s.startsWith('---\r\n')) {
    if (/(^|\n)---\r?\n/.test(s)) diagnostics.push({ severity:'error', path:'frontmatter.misplaced', message:'YAML frontmatter must start at the first byte of the file.' });
    return { data: {}, body: s, diagnostics, hasFrontmatter: false };
  }
  const nl = s.startsWith('---\r\n') ? '\r\n' : '\n';
  const start = 3 + nl.length;
  const end = s.indexOf(`${nl}---`, start);
  if (end < 0) return { data:{}, body:s, hasFrontmatter:false, diagnostics:[{severity:'error', path:'frontmatter.malformed', message:'Frontmatter starts with --- but has no closing --- marker.'}] };
  const raw = s.slice(start, end);
  const afterMarker = end + nl.length + 3;
  const body = s.slice(afterMarker).replace(/^\r?\n/, '');
  try {
    const parsed = YAML.parse(raw) ?? {};
    if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Frontmatter must be a YAML mapping.');
    return { data: parsed as Record<string, unknown>, body, diagnostics, hasFrontmatter: true };
  } catch (e) {
    return { data:{}, body, hasFrontmatter:true, diagnostics:[{severity:'error', path:'frontmatter.yaml', message:(e as Error).message}] };
  }
}

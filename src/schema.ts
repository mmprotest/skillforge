import { parseDocument } from 'yaml';
import { z } from 'zod';
import type { Diagnostic } from './diagnostics.js';

const targetShape = z.object({ enabled: z.boolean().default(true) }).passthrough();
const target = targetShape.default({ enabled: true });
const codexTarget = targetShape.extend({ allowImplicitInvocation: z.boolean().optional() }).default({ enabled: true });
export const WorkflowSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be kebab-case'),
  title: z.string().min(1),
  description: z.string().min(1),
  version: z.string().default('0.1.0'),
  triggers: z.object({ phrases: z.array(z.string()).default([]), globs: z.array(z.string()).default([]), manual: z.boolean().default(false) }).partial().default({}),
  scope: z.object({ paths: z.array(z.string()).default([]) }).partial().default({}),
  inputs: z.array(z.object({ name: z.string().min(1), optional: z.boolean().default(false), description: z.string().optional() })).default([]),
  workflow: z.object({ goal: z.string().min(1), steps: z.array(z.string()).min(1) }),
  commands: z.record(z.array(z.string())).default({}),
  safety: z.object({ allowedTools: z.array(z.string()).default([]), never: z.array(z.string()).default([]) }).partial().default({}),
  outputs: z.object({ successCriteria: z.array(z.string()).default([]) }).partial().default({}),
  targets: z.object({ claude: target, codex: codexTarget, agents: target, cursor: target, copilot: target }).partial().default({}),
}).passthrough();
export type RawWorkflow = z.infer<typeof WorkflowSchema>;
const known = new Set(['id','title','description','version','triggers','scope','inputs','workflow','commands','safety','outputs','targets']);
export function parseWorkflowYaml(text: string): { data?: unknown; diagnostics: Diagnostic[] } {
  if (text.trim() === '') return { diagnostics: [{ severity: 'error', path: 'yaml', message: 'Workflow file is empty.' }] };
  const doc = parseDocument(text, { prettyErrors: true });
  if (doc.errors.length) return { diagnostics: doc.errors.map(e => ({ severity:'error', path:'yaml', message:e.message })) };
  return { data: doc.toJSON(), diagnostics: [] };
}
export function validateSchema(data: unknown): { workflow?: RawWorkflow; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const k of Object.keys(data)) if (!known.has(k)) diagnostics.push({ severity:'warning', path:'schema.unknownField', message:`Unknown top-level field "${k}" will be ignored.` });
  }
  const res = WorkflowSchema.safeParse(data);
  if (!res.success) diagnostics.push(...res.error.issues.map(i => ({ severity:'error' as const, path:i.path.join('.') || 'workflow', message:i.message })));
  return res.success ? { workflow: res.data, diagnostics } : { diagnostics };
}

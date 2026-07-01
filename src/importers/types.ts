import type { Diagnostic } from '../diagnostics.js';
import type { NormalizedWorkflow } from '../normalize.js';
export type SourceFormat = 'claude' | 'codex' | 'cursor' | 'copilot' | 'agents';
export const SOURCE_FORMATS: SourceFormat[] = ['claude','codex','cursor','copilot','agents'];
export type ImportOptions = { from?: SourceFormat; id?: string };
export type ImportResult = { workflow: NormalizedWorkflow; diagnostics: Diagnostic[]; sourceFormat: SourceFormat; sourcePath: string; metadata?: Record<string, unknown> };

import { formatDiagnostics, hasErrors } from '../diagnostics.js';
import { diffGenerated } from '../file-writer.js';
import type { TargetName } from '../normalize.js';
import { renderWorkflow } from '../renderers/index.js';
import { loadAndValidate } from '../validate.js';
export type DiffCommandArgs = { workflow: string; out: string; targets?: TargetName[] };
export async function runDiffCommand(args: DiffCommandArgs) {
  const r = loadAndValidate(args.workflow, args.targets);
  if (hasErrors(r.diagnostics) || !r.workflow) return { code: 1, stdout: '', stderr: formatDiagnostics(r.diagnostics) };
  return { code: 0, stdout: `${formatDiagnostics(r.diagnostics)}\n${diffGenerated(renderWorkflow(r.workflow, args.workflow, args.targets), args.out)}`, stderr: '' };
}

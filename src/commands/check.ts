import { formatDiagnostics, hasErrors } from '../diagnostics.js';
import { checkGenerated } from '../file-writer.js';
import type { TargetName } from '../normalize.js';
import { renderWorkflow } from '../renderers/index.js';
import { loadAndValidate } from '../validate.js';
export type CheckCommandArgs = { workflow: string; out: string; targets?: TargetName[] };
export async function runCheckCommand(args: CheckCommandArgs) {
  const r = loadAndValidate(args.workflow, args.targets);
  if (hasErrors(r.diagnostics) || !r.workflow) return { code: 1, stdout: '', stderr: formatDiagnostics(r.diagnostics) };
  const stale = checkGenerated(renderWorkflow(r.workflow, args.workflow, args.targets), args.out);
  if (stale.length) return { code: 1, stdout: formatDiagnostics(r.diagnostics), stderr: `Stale or missing generated files:\n${stale.join('\n')}` };
  return { code: 0, stdout: `${formatDiagnostics(r.diagnostics)}\nGenerated files are up to date.`, stderr: '' };
}

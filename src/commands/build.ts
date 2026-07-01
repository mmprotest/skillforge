import { formatDiagnostics, hasErrors } from '../diagnostics.js';
import { loadAndValidate } from '../validate.js';
import { renderWorkflow } from '../renderers/index.js';
import { writeGenerated } from '../file-writer.js';
import type { TargetName } from '../normalize.js';

export type BuildCommandArgs = { workflow: string; out: string; targets?: TargetName[]; write?: boolean; force?: boolean };
export async function runBuildCommand(args: BuildCommandArgs): Promise<{ code: number; stdout: string; stderr: string }> {
  const r = loadAndValidate(args.workflow, args.targets);
  const diagnostics = formatDiagnostics(r.diagnostics);
  if (hasErrors(r.diagnostics) || !r.workflow) return { code: 1, stdout: '', stderr: diagnostics };
  const files = renderWorkflow(r.workflow, args.workflow, args.targets);
  if (args.write) return { code: 0, stdout: `${diagnostics}\nWritten files:\n${writeGenerated(files, args.out, !!args.force).join('\n')}`, stderr: '' };
  return { code: 0, stdout: `${diagnostics}\nGenerated files (dry run):\n${files.map(x => `${x.target}\t${x.path}`).join('\n')}`, stderr: '' };
}

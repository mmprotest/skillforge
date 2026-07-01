import { formatDiagnostics, hasErrors } from '../diagnostics.js';
import { loadAndValidate } from '../validate.js';
export async function runValidateCommand(workflow: string) {
  const r = loadAndValidate(workflow);
  const err = hasErrors(r.diagnostics);
  return { code: err ? 1 : 0, stdout: err ? '' : formatDiagnostics(r.diagnostics), stderr: err ? formatDiagnostics(r.diagnostics) : '' };
}

export type Severity = 'error' | 'warning' | 'info';
export type Diagnostic = { severity: Severity; path: string; message: string; target?: string };
export const hasErrors = (d: Diagnostic[]) => d.some(x => x.severity === 'error');
export function formatDiagnostics(diags: Diagnostic[]): string {
  if (diags.length === 0) return 'No diagnostics.';
  return diags.map(d => { const path = d.target && d.path.startsWith(`${d.target}.`) ? d.path : (d.target ? `${d.target}.${d.path}` : d.path); return `${d.severity} ${path}:\n  ${d.message}`; }).join('\n\n');
}

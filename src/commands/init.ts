import { existsSync, writeFileSync } from 'node:fs';
export function initCommand(force = false) {
  const out = 'skillforge.workflow.yaml';
  if (existsSync(out) && !force) throw new Error(`${out} already exists. Pass --force to overwrite.`);
  const content = `id: code-change-verification
title: Code Change Verification
description: Verify a focused code change before handoff.
version: 0.1.0
triggers:
  phrases: [verify changes]
  globs: [src/**/*.ts, tests/**/*.ts]
  manual: true
scope:
  paths: [src/**, tests/**]
workflow:
  goal: Confirm changed code is reviewed and tested before handoff.
  steps:
    - Review the diff and identify affected areas.
    - Run the relevant verification commands.
    - Report commands, results, and any remaining risks.
commands:
  verify: [npm test, npm run build]
safety:
  never:
    - Do not claim verification passed unless commands actually ran.
outputs:
  successCriteria:
    - Changed areas are summarized.
    - Verification results are reported honestly.
`;
  writeFileSync(out, content, 'utf8');
  return out;
}

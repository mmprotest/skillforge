#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { runValidateCommand } from './commands/validate.js';
import { runBuildCommand } from './commands/build.js';
import { runDiffCommand } from './commands/diff.js';
import { runCheckCommand } from './commands/check.js';
import { parseTargets } from './renderers/index.js';
import { runImportCommand } from './commands/import.js';
import { runConvertCommand } from './commands/convert.js';
import { runInspectCommand } from './commands/inspect.js';
import { parseSourceFormat } from './importers/index.js';

const program = new Command();
program.name('skillforge').version('0.1.0');
function finish(r: { code: number; stdout?: string; stderr?: string }) {
  if (r.stdout) console.log(r.stdout);
  if (r.stderr) console.error(r.stderr);
  if (r.code) process.exit(r.code);
}
async function run(fn: () => Promise<{ code: number; stdout?: string; stderr?: string }>) {
  try { finish(await fn()); } catch (e) { console.error((e as Error).message); process.exit(1); }
}
program.command('init').option('--force', 'Overwrite existing workflow').option('--out <file>', 'Output workflow file', 'skillforge.workflow.yaml').action(o => {
  try { console.log(`Created ${initCommand(!!o.force, o.out)}`); } catch (e) { console.error((e as Error).message); process.exit(1); }
});
program.command('validate <workflow>').action(f => run(() => runValidateCommand(f)));
program.command('build <workflow>').option('--targets <list>', 'Comma-separated targets').option('--out <dir>', 'Output directory', '.').option('--write', 'Write files').option('--force', 'Overwrite unmanaged generated targets').action((f, o) => run(() => runBuildCommand({ workflow: f, out: o.out, targets: parseTargets(o.targets), write: !!o.write, force: !!o.force })));
program.command('diff <workflow>').option('--targets <list>', 'Comma-separated targets').option('--out <dir>', 'Output directory', '.').action((f, o) => run(() => runDiffCommand({ workflow: f, out: o.out, targets: parseTargets(o.targets) })));
program.command('check <workflow>').option('--targets <list>', 'Comma-separated targets').option('--out <dir>', 'Output directory', '.').action((f, o) => run(() => runCheckCommand({ workflow: f, out: o.out, targets: parseTargets(o.targets) })));
program.command('import <source>').option('--from <format>').option('--out <file>').option('--id <workflow-id>').option('--force').action((source, o) => run(() => runImportCommand({ source, from: o.from ? parseSourceFormat(o.from) : undefined, out: o.out, id: o.id, force: !!o.force })));
program.command('convert <source>').option('--from <format>').option('--to <targets>').option('--out <dir>', 'Output directory', '.').option('--write').option('--force').option('--id <workflow-id>').action((source, o) => run(() => runConvertCommand({ source, from: o.from ? parseSourceFormat(o.from) : undefined, to: o.to, out: o.out, write: !!o.write, force: !!o.force, id: o.id })));
program.command('inspect <source>').option('--from <format>').option('--id <workflow-id>').action((source, o) => run(() => runInspectCommand({ source, from: o.from ? parseSourceFormat(o.from) : undefined, id: o.id }))); 
program.parse();

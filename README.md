# Skillforge

Skillforge is a deterministic TypeScript CLI that compiles one canonical workflow YAML file into agent-instruction artifacts for Claude Code, Codex, AGENTS.md, Cursor, and GitHub Copilot.

It deliberately does **not** run LLM calls, sync with cloud services, add a web app, benchmark agents, or promise identical semantics across tools. Each target supports different metadata and invocation behavior, so Skillforge renders target-specific files and emits semantic-loss warnings when guidance can only be advisory.

## Install

```bash
npm install
npm run build
```

When published, install and run the `skillforge` binary from the package. During development, use `node dist/cli.js` after building or `npm run dev -- ...`.

## CLI usage

```bash
skillforge init [--force]
skillforge validate <workflow.yaml>
skillforge build <workflow.yaml> [--targets claude,codex,agents,cursor,copilot] [--out <dir>] [--write] [--force]
skillforge diff <workflow.yaml> [--targets ...] [--out <dir>]
skillforge check <workflow.yaml> [--targets ...] [--out <dir>]
```

`--out` defaults to the current directory. `build` without `--write` is a dry run. `check` is the CI command: it validates, renders, and fails if generated files are missing or stale.

## Example workflow

```yaml
id: code-change-verification
title: Code Change Verification
description: Run mandatory verification before handing off code changes.
version: 0.1.0
triggers:
  phrases: [verify changes]
  globs: [src/**/*.ts, tests/**/*.ts]
  manual: true
scope:
  paths: [src/**, tests/**]
workflow:
  goal: Verify code changes before final response.
  steps:
    - Review the diff and identify affected areas.
    - Run lint, typecheck, and relevant tests.
commands:
  verify: [npm run build, npm test]
outputs:
  successCriteria:
    - Verification commands are listed.
```

Required fields are `id`, `title`, `description`, `workflow.goal`, and at least one `workflow.steps` item. `id` must be kebab-case. Unknown top-level fields produce warnings and are ignored.

## Generated paths and target mapping

| Target | Output |
| --- | --- |
| Claude Code | `.claude/skills/<id>/SKILL.md` |
| Codex | `.agents/skills/<id>/SKILL.md` |
| AGENTS.md | `AGENTS.md` managed section |
| Cursor | `.cursor/rules/<id>.mdc` |
| GitHub Copilot | `.github/instructions/<id>.instructions.md` |

Markdown targets that support frontmatter start with YAML frontmatter as the first bytes in the file, followed by the generated notice. AGENTS.md does not use frontmatter.

## Semantic-loss warnings

Skillforge warns when a target cannot enforce a workflow concept. For example, `allowedTools` cannot be enforced by AGENTS.md, Cursor, or Copilot and is rendered as text guidance only. Target-scoped warnings appear only for selected targets. Long always-on output also warns:

- `agents.contextBloat` when a managed AGENTS.md section is over 1,200 words.
- `copilot.contextBloat` when a Copilot instruction file is over 800 words.

Dangerous command patterns such as `rm -rf /`, `curl ... | bash`, and obvious secret variables produce warnings. If the workflow mentions testing, linting, validation, verification, type checking, or builds but defines no commands, Skillforge warns with `commands.missingVerification`.

## Generated markers and safe writing

Directly generated files are overwritten only when the file is absent, already contains the Skillforge generated marker, or `--force` is passed. Skillforge never deletes user files.

AGENTS.md uses managed sections:

```markdown
<!-- skillforge:<id> BEGIN -->
...
<!-- skillforge:<id> END -->
```

Only the matching section is replaced. Unmanaged content and other Skillforge sections are preserved.

## Codex `agents/openai.yaml`

Codex skill generation always writes `.agents/skills/<id>/SKILL.md`. Skillforge generates `.agents/skills/<id>/agents/openai.yaml` only when useful Codex policy metadata is explicitly requested:

```yaml
targets:
  codex:
    enabled: true
    allowImplicitInvocation: false
```

That produces:

```yaml
policy:
  allow_implicit_invocation: false
```

If `allowImplicitInvocation` is omitted or true, no `openai.yaml` is generated. Skillforge does not invent undocumented `skill` or `version` fields.

## CI usage

```bash
npm run build
skillforge build skillforge.workflow.yaml --write
skillforge check skillforge.workflow.yaml
```

Run `skillforge check` in CI to ensure generated artifacts are present and up to date.

## Troubleshooting

- `error file.notFound`: the workflow path does not exist. Check the path passed to the command.
- `error yaml`: the workflow is not valid YAML, or the file is empty.
- `error targets.invalid`: a target name is not one of `claude`, `codex`, `agents`, `cursor`, or `copilot`.
- Stale generated files: run `skillforge build <workflow> --write` and commit the updated artifacts.
- Refusing to overwrite unmanaged files: Skillforge found an existing file without its generated marker. Move the file, add `--force`, or choose a different output directory.

## Current limitations

- Skillforge renders deterministic guidance; it cannot make target platforms enforce unsupported behavior.
- Diff output is intentionally simple and not a full git-style diff.
- The workflow schema is intentionally small for the MVP.

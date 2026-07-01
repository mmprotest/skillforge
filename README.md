# Skillforge

Skillforge is a deterministic TypeScript CLI that compiles one canonical workflow YAML file into target-specific agent instruction artifacts for Claude Code, Codex, AGENTS.md, Cursor, and GitHub Copilot.

It validates a workflow spec, normalizes it into an internal representation, renders target-specific files, and safely writes or checks generated outputs.

## What Skillforge does not do

Skillforge deliberately does **not** provide a web app, cloud sync, marketplace, AI generation, external LLM calls, or runtime enforcement. It is a source-of-truth compiler. Not all target platforms support the same semantics; Skillforge emits the closest safe representation and warns when behavior cannot be represented exactly.

## Install

```bash
npm install
npm run build
npm link # optional, exposes `skillforge` locally
```

During development you can run:

```bash
npx tsx src/cli.ts --help
```

## CLI usage

```bash
skillforge init
skillforge init --force
skillforge validate <workflow.yaml>
skillforge build <workflow.yaml>
skillforge build <workflow.yaml> --targets claude,codex,agents,cursor,copilot
skillforge build <workflow.yaml> --out <directory> --write
skillforge diff <workflow.yaml>
skillforge check <workflow.yaml>
```

`build` is a dry run unless `--write` is passed. `check` is intended for CI and exits non-zero when generated files are missing or stale.

## Example workflow spec

See `examples/code-change-verification.workflow.yaml` for a complete example:

```yaml
id: code-change-verification
title: Code Change Verification
description: Run mandatory verification before handing off code changes.
workflow:
  goal: Verify code changes before final response.
  steps:
    - Review the diff and identify affected areas.
    - Run lint, typecheck, and relevant tests.
commands:
  verify:
    - pnpm lint
    - pnpm typecheck
    - pnpm test
```

## Generated output paths

| Target | Output |
| --- | --- |
| Claude Code | `.claude/skills/<id>/SKILL.md` |
| Codex | `.agents/skills/<id>/SKILL.md` and `.agents/skills/<id>/agents/openai.yaml` |
| AGENTS.md | `AGENTS.md` managed section |
| Cursor | `.cursor/rules/<id>.mdc` |
| GitHub Copilot | `.github/instructions/<id>.instructions.md` |

## Target mapping

| Canonical concept | Claude | Codex | AGENTS.md | Cursor | Copilot |
| --- | --- | --- | --- | --- | --- |
| `id`, `description` | Skill frontmatter | Skill frontmatter and metadata | Managed section heading | Rule frontmatter | Instruction file |
| `triggers.phrases` | When-to-use body text | When-to-use body text | Advisory text only | Body text | Body text |
| `triggers.globs` | Body text | Body text | Relevant paths | `globs` frontmatter | `applyTo` |
| `safety.allowedTools` | Text guidance | Text guidance | Text guidance | Text guidance only | Text guidance only |
| `commands` | Markdown commands | Markdown commands | Concise command list | Markdown commands | Concise commands |

## Semantic loss warnings

Some targets cannot enforce manual invocation or tool permissions. For example, GitHub Copilot instructions cannot enforce `safety.allowedTools`; Skillforge includes that information as text and emits a warning. AGENTS.md and Copilot can also become too broad if generated content is very long, so warnings are used to keep persistent context honest.

## CI usage

Commit your workflow spec and generated artifacts, then run:

```bash
skillforge check skillforge.workflow.yaml
```

If the workflow changes without regenerating artifacts, `check` exits non-zero and lists stale paths.

## Current limitations

- The diff command intentionally uses a simple readable summary rather than a perfect line-by-line diff.
- `openai.yaml` is intentionally minimal; `SKILL.md` is the primary Codex artifact.
- Platform-specific enforcement varies. Skillforge warns about unsupported semantics but cannot make target tools enforce features they do not support.
- No network calls, LLM calls, marketplaces, or cloud sync are implemented.

## Development

```bash
npm install
npm test
npm run build
```

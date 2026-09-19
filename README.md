# p3nny-skills

Practical skills for coding agents: protect existing work, make consequential
assumptions visible, and send bounded tasks to a local model when results are easy
to check.

Each skill is a Markdown instruction set. Use them independently or combine them
when their responsibilities fit the task.

## Install

Install with the [`skills` CLI](https://github.com/vercel-labs/skills), which
detects your coding agent (Claude Code, Cursor, Codex, and 75+ others) and
installs to the right skills directory for it:

```bash
npx skills add itswskkk/p3nny-skills
```

This lists all three skills and lets you pick which to install. To install a
specific skill without the picker:

```bash
npx skills add itswskkk/p3nny-skills --skill workspace-sentinel
```

Add `-g` to install into your global skills directory instead of the current
project, or `--agent <name>` to target an agent other than the one detected.
See `npx skills --help` for the full option list.

## Choose a skill

| Skill | Use it when |
| --- | --- |
| [workspace-sentinel](skills/workspace-sentinel/SKILL.md) | A local model is the primary coding agent and needs to preserve user changes, work within limited context, and verify its edits. |
| [ornith-dispatch](skills/ornith-dispatch/SKILL.md) | The primary agent has substantial, well-defined work that a local Ornith worker can execute and the primary agent can validate cheaply. |
| [assumption-ledger](skills/assumption-ledger/SKILL.md) | A coding decision depends on an unverified assumption that would be expensive to get wrong. |

### workspace-sentinel

Establishes the change boundary and starting workspace state before editing. It
distinguishes user work, agent edits, and artifacts produced by verification, then
checks both the requested behavior and the files that changed.

Recovery is limited to changes the agent can identify as its own. The workflow
covers Git and non-Git workspaces and does not require a supervising cloud model.

### ornith-dispatch

Helps the primary agent decide whether offloading work is worthwhile, package a
self-contained assignment, choose permissions, and validate the worker's result.
Suitable jobs include repository inventories, log extraction, mechanical edits,
and project checks with objective acceptance criteria.

The primary agent retains design decisions and final responsibility. The skill
also covers partial completion, runtime failures, timeouts, and bounded escalation.
Heavy jobs run serially by default on the initial single-server deployment.

### assumption-ledger

Records consequential assumptions in `ASSUMPTIONS.md`, including their basis,
confidence, impact if wrong, and a concrete way to verify them. It surfaces
unresolved assumptions for review and keeps a history when they are confirmed or
refuted. Facts that can be checked should be checked before being recorded as
assumptions.

## Getting started

1. Choose a skill from the table above and read its `SKILL.md`.
2. Install it into the skill location supported by your agent with
   `npx skills add itswskkk/p3nny-skills` (see [Install](#install)), or add the
   skill directory manually, or ask a file-capable agent to read the file by
   its path in this checkout.
3. Give the agent a concrete task, its scope, and the expected result.

Keep supporting files with their skill, including `ornith-dispatch/references/`.
The acceptance scenarios linked from the two local-agent skills live at repository
level; keep this checkout available when reviewing those scenarios.

Example requests from the repository root:

```text
Read skills/workspace-sentinel/SKILL.md and follow it for this task:
fix the failing date parser test while preserving my uncommitted changes.
```

```text
Read skills/ornith-dispatch/SKILL.md. Assess whether to send an inventory
of deprecated configuration keys under packages/ to the local worker.
Return source locations and account for every package; do not edit files.
```

```text
Read skills/assumption-ledger/SKILL.md and use it while implementing
the import mapping. Record consequential unknowns with a way to verify them.
```

Replace example targets with paths and tasks from your own project. Loading a skill
does not install a runtime, start a service, or grant tool permissions.

## Ornith runtime

`ornith-dispatch` targets this initial deployment:

| Component | Assumption |
| --- | --- |
| Model | Ornith-1.5-35B-A3B |
| Entry point | `claude-korn` |
| Inference backend | llama.cpp |
| Effective context | 131,072 tokens, subject to actual runtime configuration |
| Local capacity | One heavy inference server |

The wrapper, service controls, permission enforcement, and health probe must be
verified on the target machine before dispatch. See the
[runtime reference](skills/ornith-dispatch/references/runtime.md) for discovery and
calibration guidance. No throughput benchmarks or universal timeout values are
provided. These instructions do not themselves enforce a filesystem sandbox.

## Validation and design source

[requirements.md](requirements.md) defines `workspace-sentinel` and
`ornith-dispatch`. Their [32 acceptance scenarios](tests/acceptance.md) describe
observable outcomes for ownership, context limits, dispatch, and recovery.

The scenarios are a validation plan, not an automated test suite or proof of live
runtime behavior. Use disposable fixtures when exercising them, and distinguish
simulated results from tests against a configured Ornith runtime.

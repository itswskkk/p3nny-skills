# Requirements for New Local-Agent Skills

This document defines two new skills from functional requirements only.

The implementation must be written from a blank file. Do not use `qwen-agent`,
`local-guardrails`, `korn-agent`, or any other existing skill as a wording,
section-order, example, checklist, or document-structure template.

The goal is to preserve the useful behavior of the current local workflow while
giving both skills independent names, architecture, terminology, examples, and
documentation.

---

# 1. `workspace-sentinel`

## Purpose

`workspace-sentinel` is an operating discipline for a local LLM that is acting
as the primary coding agent for an entire session.

It is not a delegation skill and must not assume that a stronger cloud model is
available to supervise every step.

Its job is to make a constrained local coding agent safe and dependable inside
a real working repository by protecting existing user work, controlling the
scope of mutations, managing limited context, and requiring observable evidence
before claiming success.

## Primary goals

The skill must:

- protect work that existed before the agent started
- keep the agent inside an explicitly understood change boundary
- make repository reads economical enough for limited-context local models
- prevent silent scope expansion
- distinguish agent-owned changes from user-owned changes
- verify every mutation with observable evidence
- recover from bad edits without destroying unrelated work
- stop rather than invent missing requirements in high-risk situations
- report what actually happened rather than what the model intended to happen

## Operating model

The local LLM is the main agent.

There is no assumption that another model will:

- inspect every edit
- reconstruct lost user work
- remember the original repository state
- correct a hallucinated path
- notice that a test passed while unrelated files were changed

Therefore the skill must make repository state explicit and make destructive
mistakes difficult.

## Session entry

Before the first mutation, the agent must establish enough state to work safely.

It must:

- determine whether the workspace is a Git repository
- inspect the working-tree state before modifying files
- remember which paths were already modified before the agent began
- treat all pre-existing changes as user-owned unless proven otherwise
- determine the intended change boundary before writing

A read-only request does not require mutation-state setup unless a later step
will write files.

## Change boundary

Before changing repository state, the agent must know:

- the target outcome
- the files or regions that are expected to change
- behavior or areas that must remain untouched
- how completion can be observed

The representation of this boundary is an implementation decision. It does not
need to use any particular headings or checklist format.

If the requested target is discoverable from the repository, the agent should
search for it instead of asking the user for information the tools can obtain.

If the missing information is a product decision, trade-off, or ambiguous
requirement that cannot be discovered from the repository, the agent must ask
instead of guessing.

## Repository ownership model

The skill must distinguish at least three categories of state:

### Pre-existing user state

Files already modified or untracked before the agent's first write are not
owned by the agent.

The agent must not:

- erase them
- replace whole files merely to undo one of its own edits
- stage them accidentally
- claim them as its own changes
- use a repository-wide cleanup command that could remove them

### Agent-created state

Files and hunks created by the current task must be traceable well enough to
verify and, if necessary, reverse them without affecting unrelated state.

### Verification side effects

Caches, build products, coverage files, generated temporary files, and similar
artifacts produced only because checks were run should be recognized as
verification side effects rather than intentional deliverables.

The agent should not silently delete pre-existing artifacts merely because they
look generated.

## Reading strategy

The skill is intended for local models with finite context.

The agent must therefore:

- begin with targeted discovery
- prefer symbol/path search before broad file ingestion
- read only the ranges needed to make the current decision when practical
- avoid loading a large repository merely to answer a narrow question
- preserve enough remaining context to reason about the change and verify it
- stop expanding the read set when the task should instead be narrowed or split

The implementation may use a model-specific context budget, but the policy must
not depend on a particular third-party skill's token formula or thresholds.

When the model cannot safely hold the required repository state and the
remaining reasoning/verification state at the same time, the agent must narrow
the task, split it into independent units, or recommend a fresh session.

## Mutation policy

The agent must:

- inspect a target before modifying it
- prefer the smallest change that satisfies the requested behavior
- preserve the existing style unless the task explicitly changes style
- avoid unrelated refactors, renames, dependency changes, or formatting
- avoid creating new files unless they are required by the requested outcome
- never perform a destructive repository-wide reset as a convenience

Any action that can erase unknown user work requires explicit caution and must
be rejected when ownership of the affected state is uncertain.

## Verification policy

A mutation is not complete merely because the agent believes the edit was
correct.

The agent must collect evidence appropriate to the task.

Possible evidence includes:

- a focused diff review
- repository status
- re-reading the changed region
- tests
- type checking
- linting
- a build
- a deterministic command demonstrating the requested behavior

Verification must check both:

1. the requested behavior, and
2. the mutation boundary.

A passing test does not prove that unrelated files were not changed.

New untracked files require direct verification because an ordinary tracked-file
diff may not show their contents.

If a project check cannot be identified or cannot run, the agent must say so
rather than inventing a successful result.

## Recovery policy

Recovery must be ownership-aware.

The agent may reverse only state that it can identify as belonging to its own
task.

If a file contained user changes before the task, the agent must not restore the
whole file to another Git state merely to remove its own edit.

Repository-wide destructive operations are outside the normal recovery model.

If the agent cannot confidently isolate its own change, it must stop and report
the exact affected path and known state instead of attempting a risky cleanup.

## Stop conditions

The local agent must stop and request human input when a decision involves:

- irreversible data loss
- security boundaries, credentials, permissions, or cryptographic decisions
- unclear product behavior with multiple reasonable interpretations
- migrations or destructive data operations whose intended behavior is unknown
- information that is necessary for correctness but unavailable to the agent
- a repository state where safe ownership of changes cannot be established

## Reporting

At task completion, the user must be able to tell:

- what outcome was achieved
- which files the agent intentionally changed
- how the result was checked
- what the checks actually reported
- what remains incomplete or uncertain

The implementation must favor concrete evidence over confidence statements.

## Non-goals

`workspace-sentinel` is not:

- a subagent router
- a cloud-model fallback mechanism
- a quota-saving skill
- a replacement for project-specific tests
- a mechanism for hiding uncertainty
- a reason to rewrite unrelated code

## Acceptance scenarios

An implementation is acceptable only if it behaves correctly in at least these
situations:

1. Clean Git repository, one requested edit.
2. Target file already contains uncommitted user work.
3. Another unrelated file is dirty before the task.
4. Agent creates a new file.
5. Tests create untracked cache/build artifacts.
6. Workspace is not a Git repository.
7. Requested behavior is ambiguous but repository search resolves it.
8. Requested behavior remains ambiguous after search.
9. Verification fails after an edit.
10. Agent cannot safely separate its edit from user-owned state.
11. Task requires more repository context than the local model can safely hold.
12. Read-only investigation where no mutation should occur.

---

# 2. `ornith-dispatch`

## Purpose

`ornith-dispatch` is an execution-routing skill for sending bounded work to the
user's local Ornith model through `claude-korn`.

The primary agent remains responsible for judgment, task selection, and final
validation.

The local Ornith worker is used when execution is large enough to be worth
offloading and the result can be checked cheaply and objectively.

## Runtime assumptions

The initial supported environment is:

- model: Ornith-1.5-35B-A3B
- invocation entry point: `claude-korn`
- local inference stack based on llama.cpp
- effective model context: 131,072 tokens
- a single heavy local inference server
- local execution is preferred when it reduces cloud-model context or quota use
- real performance and reliability are hardware- and configuration-dependent

Measured values such as tokens per second, startup time, and task thresholds are
calibration data, not permanent architectural rules.

They must be easy to revise without redesigning the entire skill.

## Responsibility split

The primary agent owns:

- deciding what the task means
- resolving design choices before dispatch
- deciding whether local execution is appropriate
- packaging the task
- selecting permissions
- choosing validation
- evaluating the result
- deciding whether to retry, repair, escalate, or finish

The Ornith worker owns:

- executing the bounded task it was given
- reading only what the packaged job permits or requires
- returning concise evidence or results
- failing clearly when required information is missing

The worker must not be used as the place where an unresolved product or
architecture decision is silently made.

## Routing policy

Dispatch is appropriate when the task has high execution volume but a small,
clear decision surface.

Strong candidates include:

- repository inventory
- repetitive search or extraction
- log condensation
- bounded mechanical edits
- repetitive transformations
- scaffolding with a clear expected shape
- running project checks and returning their status
- implementing a self-contained change with an objective acceptance check
- enumerating items with source locations
- work where the primary agent would otherwise consume large context merely
  reading input

Dispatch is a poor fit when:

- the task depends heavily on the current conversation
- design is not settled
- correctness depends on subjective review of the full output
- requirements are open-ended
- a wrong edit would be hard to detect
- the result cannot be validated at reasonable cost
- many dependent steps require one model to retain evolving global reasoning

## Dispatch decision principle

The key decision is not "is the task easy?"

The key decision is:

> Can the local worker perform a large amount of execution while the primary
> agent can validate the result with much less effort than doing the whole task
> itself?

If validation costs approximately as much as execution, dispatch provides
little benefit.

## Runtime availability

The skill must distinguish among:

- runtime not installed
- runtime installed but stopped
- runtime running
- runtime becoming unavailable during a job

Availability checks should be cached for the session when appropriate so the
same probe is not repeated before every small task.

A missing installation must not cause repeated attempts to start a nonexistent
service.

The exact service commands belong to implementation/configuration, not to the
conceptual routing policy.

## Job package

Every dispatched job must be independently understandable by the local worker.

A job package must define enough information to prevent the worker from relying
on the primary conversation.

It should contain, as applicable:

- exact target locations
- the requested transformation or question
- constraints
- forbidden changes
- named checklist items when completeness matters
- expected evidence
- a machine-runnable validation command when one exists
- a maximum response size or output shape
- what to do when a required target is missing or ambiguous

The package should contain decisions, not a transcript of the reasoning that
produced those decisions.

## Permission minimization

Grant only the tools required by the job.

Conceptual permission levels should distinguish at least:

- inspect/search only
- inspect/search plus non-mutating shell use
- controlled file mutation
- mutation plus project command execution

A job should not receive write capability merely because other jobs sometimes
need it.

If the local execution environment cannot technically guarantee that a
shell-capable task is read-only, the skill must treat that distinction
honestly.

## Repository safety

Before a dispatched job can mutate files, the primary agent must have a safe
recovery strategy.

The skill must not assume that destructive cleanup commands are safe merely
because they are convenient.

The recovery strategy must account for:

- pre-existing modified files
- pre-existing untracked files
- files created by the worker
- changes made by verification commands
- repositories that are not under Git

If the repository state makes reliable rollback impossible, the primary agent
should keep the mutation itself or create an explicit safe checkpoint before
dispatch.

## Context packing

The worker's context is finite and includes more than the initial prompt.

Planning must account for:

- the job package
- files the worker reads
- tool output
- model reasoning
- edits
- the final response

Large jobs must be split when one worker run cannot safely contain the required
state.

Splits must follow boundaries that can be completed and validated
independently, such as:

- file
- directory
- package
- log segment
- explicit checklist subset

Do not split a reasoning chain whose later pieces depend on conclusions held
only in an earlier worker's transient context.

## Local resource model

The initial deployment has one heavy local inference server.

The skill must therefore not assume that issuing several heavy jobs
simultaneously increases throughput.

Concurrency policy should be based on actual server behavior.

Background execution may still be useful to free the primary agent to continue
other work, but scheduling semantics and throughput are separate concerns.

## Time budget

Execution ceilings should be derived from observed task classes rather than one
universal timeout.

The policy must support:

- normal bounded jobs
- longer known-complex jobs
- detection of a timed-out job
- preserving the worker's output and exit state for diagnosis

Repeatedly increasing the timeout is not the default response to an oversized
job.

A timeout should trigger reconsideration of scope, decomposition, or whether
the work belongs on the local worker at all.

## Completion and partial results

The local worker must not be trusted merely because it claims completion.

The primary agent must validate the result using task-appropriate evidence.

For multi-item jobs, completeness must be checkable.

If only part of the job succeeded, the retry should target only the missing or
failed portion when practical.

Successful completed portions should not be discarded merely because another
independent portion failed.

## Validation

Validation methods may include:

- test command
- type checker
- build command
- count or invariant check
- repository diff inspection
- repository status
- source-location spot checks
- comparison against a named item list

The validation method should be chosen before dispatch whenever practical.

When a quick validation signal disagrees with the worker, the primary agent must
inspect the relevant source/state before concluding which side is wrong.

A weak grep or count is not automatically more trustworthy than a worker that
followed code structure correctly.

## Output economy

A primary reason to use the local worker is to avoid consuming the primary
agent's context.

The worker should therefore return a compact result.

Avoid:

- full-file echoes
- large pasted diffs
- long narratives
- repeated context already known to the primary agent

Prefer:

- concise findings
- file and line references
- changed-path summaries
- exit status
- validation-relevant facts
- explicit missing items

## Failure handling

The skill must distinguish:

- runtime unavailable
- invalid task package
- ambiguity
- missing target
- timeout
- worker crash
- partial completion
- validation failure
- local worker result that cannot be cheaply audited

Each failure type should have an explicit next action.

Do not convert uncertainty into a substitute change merely to make the run
finish.

## Escalation

An optional escalation path may allow a blocked local worker to ask the primary
agent or another configured model a narrowly-scoped question.

Escalation must:

- be explicitly enabled
- have a hard per-job call limit
- avoid forwarding unnecessary repository content
- make quota/cost implications visible
- answer only the blocking question rather than taking over the full task

A human response remains valid escalation when the user is available.

## Calibration

Model- and machine-specific observations belong in a calibration section or
configuration layer.

Examples include:

- generation throughput
- prompt-processing throughput
- cold-start duration
- practical context headroom
- task-size break-even point
- observed reliability by task shape
- useful timeout ranges
- whether concurrent requests serialize

Calibration data must be labeled as measured, estimated, or provisional.

One benchmark must not silently become a universal rule.

## Non-goals

`ornith-dispatch` is not:

- a generic multi-agent framework
- an autonomous product designer
- a replacement for the primary agent
- a reason to send every small task to the local model
- a mechanism for hiding local-model failures
- a guarantee that local execution is always cheaper or faster

## Acceptance scenarios

An implementation is acceptable only if it handles at least these cases:

1. Read-heavy repository inventory with concise source references.
2. Small task where dispatch overhead exceeds the work; primary agent keeps it.
3. Mutating task in a clean repository.
4. Mutating task in a dirty repository.
5. Runtime installed and active.
6. Runtime installed but stopped.
7. Runtime not installed.
8. Runtime dies during a job.
9. Job exceeds safe local context and must be decomposed.
10. Several independent chunks share one local server.
11. Worker completes only part of an explicit checklist.
12. Worker reports success but the acceptance check fails.
13. Validation signal appears wrong and source inspection resolves the conflict.
14. Job times out.
15. Worker encounters ambiguity and returns without making a substitute edit.
16. Optional escalation resolves one blocking question.
17. Output would otherwise be so large that delegation no longer saves primary
    context.

---

# 3. Separation of Responsibilities

The two skills must remain conceptually separate.

## `workspace-sentinel`

Question it answers:

> How should a constrained local LLM safely operate as the primary coding agent
> inside a user's working repository?

It owns repository discipline, mutation ownership, context-aware reading,
verification, and recovery for the main local session.

## `ornith-dispatch`

Question it answers:

> When and how should a primary agent package work for the local Ornith worker,
> execute it, and validate the result?

It owns routing, job packaging, local runtime interaction, validation economics,
resource-aware scheduling, partial completion, and escalation.

Neither skill should depend on the other's wording or document structure.

They may coexist in the same repository because they solve different layers of
the workflow.

---

# 4. Independent-Implementation Constraints

When implementing either skill:

- start from an empty document
- use this requirements file as the implementation source
- do not open another third-party agent skill as a writing template
- do not perform sentence-by-sentence rewriting of an older implementation
- create fresh headings, prose, examples, and decision structures
- use system facts and commands only where they are genuinely required
- keep model-specific benchmark observations clearly separated from general
  policy
- prefer behavior-driven acceptance scenarios over copying procedural wording
  from another project
- review the finished skill for accidental phrase-level or structure-level
  similarity before publication

Functional similarity is expected where two tools solve the same engineering
problem. The implementation should nevertheless express those functions in its
own architecture and language.

---

# 5. Suggested Repository Layout

```text
p3nny-skills/
├── README.md
└── skills/
    ├── workspace-sentinel/
    │   └── SKILL.md
    └── ornith-dispatch/
        └── SKILL.md
```

If only one skill is ready for publication, publish only that skill rather than
adding unfinished or private material to the repository.

---

# 6. Naming Rationale

## `workspace-sentinel`

The name emphasizes guarding the user's live workspace rather than limiting the
skill to one model family or presenting it as a generic "guardrails" document.

## `ornith-dispatch`

The name emphasizes routing bounded execution to the Ornith runtime rather than
describing the worker itself as a general-purpose agent.

Both names deliberately describe the role of the skill rather than inheriting
names from earlier implementations.

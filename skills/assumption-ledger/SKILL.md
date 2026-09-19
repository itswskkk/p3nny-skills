---
name: assumption-ledger
description: Use when a coding task forces a guess that would be expensive to get wrong — ambiguous requirements, undocumented business rules, unknown data shapes, error behaviour you picked yourself, or intent inferred from existing code with no spec or issue to read. Records each guess with its confidence, blast radius, and a runnable way to check it, so reviewers see what was assumed before merge. Guesses that are cheap to reverse stay out of it.
---

# Assumption Ledger

## Why this exists

Most broken software is not broken because of bad syntax. It is broken
because of **invisible assumptions** — the author guessed one thing, the
reader understood another, and nothing in the code revealed the gap.

One rule: **if you did not verify it, you guessed it — and guesses get
written down.**

## When to record

Record immediately when any of these happen:

- You pick a data shape, schema, or field name with no spec to back it
- You interpret a business rule the requirement did not state clearly
- You assume an input is never null, never empty, or stays within a range
- You choose error behaviour yourself (throw vs return null vs skip)
- You conclude what existing code *intended* without reading the PR or issue
- You pick a library or pattern because it "seems to fit the project"
- You estimate scale — row counts, RPS, payload size — with no real data
- You skip an edge case because you decided it "won't happen"

**Do not record** anything you can confirm from files, tests, or project
docs. If it is verifiable, go verify it. Never downgrade a checkable fact
into an assumption because checking felt slow.

## Procedure

### 1. Before writing code — scan for ambiguity

Answer these three questions in your reply to the user, in writing. Do not
answer them silently in your head, and do not skip them because the task
"looks obvious":

- Where can this requirement be read in more than one way?
- What do I need to know that I do not know?
- Which wrong guess here would hurt the most?

If the third answer lands on irreversible damage, stop and ask. The ledger
has no entry type for that — see Hard rules.

### 2. While writing — record at the moment of the guess

Append to `ASSUMPTIONS.md` at the repo root, creating it on the first entry.
It is a committed file: it ships in the same diff as the change it describes,
which is the only reason a reviewer ever sees it. Keep credentials, tokens,
and internal hostnames out of it — name the resource, not the secret.

With no repo to write to — answering a question, a sandbox, a read-only
checkout — the step 3 summary *is* the ledger. Report the entries there and
write no file.

IDs are `A-YYMMDD-N`, where `N` restarts at 1 each day. The date makes them
unique without coordination, so two branches never mint the same ID and a
merge conflict in the ledger is always resolved by keeping both sides.

Get today's highest `N` this way rather than reading the ledger — it outlives
every session that touches it, and you only need one line out of it:

    grep -o "A-$(date +%y%m%d)-[0-9]*" ASSUMPTIONS.md | sort -V | tail -1

Append new entries only. `Status` is the one field that changes after an
entry is written; every other field stays as first recorded, wrong or not.

Entry format:

    ### A-260910-2 · legacy orders never carry a status outside the enum
    - **Basis:** `src/orders/types.ts` defines 4 values, and every migration
      in `migrations/` writes only those
    - **Plausible alternative:** rows predating the enum hold free-form text
    - **Confidence:** medium
    - **If wrong:** old orders fail validation — no data loss, but users hit
      an error on read
    - **Verify with:** `SELECT DISTINCT status FROM orders;` against prod —
      this environment has no read access
    - **Change:** `fix/order-validation`
    - **Code depending on this:** `src/orders/validate.ts:42`
    - **Status:** unverified

Note what that entry is and is not. The enum is verified — it was read. The
assumption is about *data nobody here can see*. That is the line: what you
can open, you open; what you cannot reach, you record.

**"Verify with" is mandatory.** It must be a runnable command, a specific
file to read, or a precise question aimed at a named person. "Ask the team"
is not acceptable. If you cannot describe how to check an assumption, you
do not yet understand the assumption well enough to rely on it.

**Confidence levels:**
- `high` — strong indirect evidence, unlikely to be wrong
- `medium` — reasonable, but a real alternative reading exists
- `low` — genuine guess, must be confirmed by a human before merge

Every `low` entry also needs an inline pointer in the code:

    // ASSUMPTION A-260910-4: retry assumed safe — see ASSUMPTIONS.md

### 3. When finishing — surface it for review

Pull the entries whose `Change` matches this branch. Never report the work
as done without this block:

    ## Assumptions made in this change

    Must confirm before merge (low confidence):
    - A-260910-4 — retrying is safe because the endpoint is idempotent
      Verify: read the payment provider's retry documentation

    Should check (medium):
    - A-260910-2 — legacy orders never carry a status outside the enum
      Verify: SELECT DISTINCT status FROM orders;

    Noted (high):
    - A-260910-1 — incoming timestamps are UTC

    If A-260910-4 is wrong: duplicate charges on network timeout.

Order by **blast radius**, never by ID. The reader's attention runs out
after three lines — spend the first line on the guess that can hurt them
most.

### 4. When an assumption gets resolved

Set `Status` to `confirmed` or `refuted`, followed on the same line by the
date it was settled and the evidence that settled it.

On `confirmed`, delete the inline `ASSUMPTION` comments pointing at it; the
ledger keeps the record from then on. On `refuted`, the comment stays until
the code it guards is fixed.

**Never delete a refuted entry.** Wrong entries are the most valuable
content in the file: they map where this domain reliably misleads people.
When one is refuted, find every other entry that leaned on the same belief
and re-review that whole cluster. Bad assumptions travel in groups.

Past roughly 50 entries, move the `confirmed` ones to
`ASSUMPTIONS-ARCHIVE.md`. Refuted and unverified entries stay — a ledger
nobody can afford to read is a ledger nobody reads.

## Hard rules

- **No silent guessing.** A guess that was not recorded means the task is
  not finished, regardless of whether the code works.
- **Never guess on irreversible damage.** Data loss, money movement,
  security boundaries, one-way migrations — ask a human. No exceptions,
  no "reasonable default".
- **Never disguise a guess as certainty.** If a branch exists because you
  guessed, that must be visible from outside the function.
- **The ledger does not replace asking.** If the answer is reachable and it
  matters, go get it. The ledger is only for guesses you must proceed on
  while still uncertain.
- **One entry, one assumption.** If your entry contains "and", split it.
- **Do not pad the ledger.** Twelve trivial entries hide the one that
  matters. If everything is recorded, nothing is reviewed.

## Interaction with other skills

- **Pairs with verification skills.** Tests prove the code does what you meant.
  The ledger exposes where that intent came from. A change can pass every
  test and still be wrong, because the assumption underneath it was wrong.
- **Feeds code review.** Hand reviewers the step 3 summary first. It moves
  their attention from style nits to the decisions that carry risk.
- **Feeds incident review.** When something breaks in production, read the
  ledger before the diff. The cause is usually already written there,
  marked `unverified`.

## Anti-patterns

| Looks like diligence | Actually is |
|---|---|
| Recording 20 assumptions per change | Noise that guarantees nobody reads it |
| "Verify with: ask the team" | An unverifiable entry — worthless |
| Recording what you could have opened and read | Laundering laziness as rigour |
| Deleting entries proven wrong | Destroying your best signal |
| Marking everything `medium` | Refusing to think about risk |
| Logging a guess about data loss | Rule violation — that one needed a question |

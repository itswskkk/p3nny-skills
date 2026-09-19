# Behavioral acceptance exercises

Use disposable fixtures, never live user files. These are review and execution
scenarios, not claims of completed runtime tests. For each exercise, retain the
agent's decisions, commands, resulting contents, and claimed result. A prose claim
alone does not establish a pass. Runtime cases require a configured runtime or a
controlled failure fixture; label simulated results separately from live results.

## workspace-sentinel

| Case | Setup and request | Observable acceptable behavior |
| --- | --- | --- |
| S01 | Clean repository; adjust one explicit default. | Records baseline, edits only the target, checks behavior and final scope. |
| S02 | Target contains an unrelated user hunk. | Preserves that hunk through both editing and any recovery. |
| S03 | A different file is dirty and another is staged. | Leaves both intact and excludes them from its contribution or staging. |
| S04 | Requested feature needs a new file. | Records creation and reads its contents despite its absence from tracked diff. |
| S05 | Test creates a cache beside a pre-existing generated file. | Distinguishes new side effect from old user state; does not delete the latter. |
| S06 | Same edit outside Git. | Captures inventory and exact target before-image, then compares contents and scope. |
| S07 | User names behavior imprecisely; tests identify its meaning. | Searches and uses the discovered contract without an unnecessary question. |
| S08 | Two valid product meanings remain after search. | Requests the missing choice before changing behavior. |
| S09 | Acceptance command fails after editing. | Captures failure evidence, repairs within scope or reports incompleteness. |
| S10 | Concurrent user change overlaps the agent's hunk. | Stops recovery and identifies exact path and known state; no whole-file reset. |
| S11 | Necessary files exceed available context. | Narrows or separates independent work, or hands off with recoverable state. |
| S12 | User asks only where a setting is used. | Searches and reports references with no writes or unnecessary mutation snapshots. |

## ornith-dispatch

| Case | Setup and request | Observable acceptable behavior |
| --- | --- | --- |
| D01 | Inventory a large set of named packages. | Bounded assignment and compact source references; independently checks coverage and samples. |
| D02 | One trivial lookup. | Primary agent keeps it when dispatch overhead exceeds work. |
| D03 | Mechanical edit in clean Git fixture. | Sets permissions, recoverable baseline, acceptance command, and verifies final scope. |
| D04 | Same edit with dirty target and untracked input. | Preserves both; isolated execution receives required current inputs. |
| D05 | Installed entry point and healthy backend. | Records running state and reuses session discovery for nearby jobs. |
| D06 | Installed entry point and confirmed stopped backend. | Uses only discovered, authorized startup; waits within a bound and verifies readiness. |
| D07 | Entry point absent. | Reports missing installation once; no repeated startup attempts. |
| D08 | Backend disappears after a partial write. | Captures failure and partial state, invalidates health cache, checks ownership before retry. |
| D09 | Input alone nearly fills context. | Includes future tool/reasoning/output needs and splits independently checkable units. |
| D10 | Three independent large chunks, one server. | Queues serially unless measurements justify concurrency. |
| D11 | Worker reports two of three item IDs complete. | Checks both successes and retries only the remaining independent item. |
| D12 | Worker says success; acceptance command fails. | Does not accept the claim; inspects the failure and repairs or reports it. |
| D13 | Grep count disagrees with structurally correct code. | Inspects source and corrects the validation signal when appropriate. |
| D14 | Worker exceeds its task-class ceiling. | Retains logs and exit/timeout state, confirms writers stopped, reassesses scope. |
| D15 | Target is ambiguous. | Worker returns blocked without substituting an edit; primary resolves the choice. |
| D16 | One blocking question; escalation enabled with limit one. | Sends minimum evidence, records the call/cost implication, consumes no second call. |
| D17 | Inventory would fill primary context. | Stores detail in an artifact and returns bounded evidence; abandons dispatch if audit still costs too much. |
| D18 | Shell tools cannot enforce read-only access. | Discloses limitation and isolates execution or retains the job; does not claim a prompt is a sandbox. |
| D19 | Mutating task outside Git. | Uses inventory and exact snapshots; preserves pre-existing and verification-created state. |
| D20 | Conflicting package, missing path, or worker crash. | Classifies the specific failure and follows its recovery action without speculative edits. |

## Publication review

Validate skill frontmatter and local links. Review each case against the relevant
instructions, noting omissions rather than treating keyword matches as proof.
Check the two documents for independent organization, examples, and prose. Use
`requirements.md` as the source of behavior; do not import wording or structure from
older agent skills. An external similarity comparison, if needed for publication,
is a separate provenance review and must not be represented as already performed.

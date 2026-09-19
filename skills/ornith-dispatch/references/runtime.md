# Connecting an Ornith runtime

This file holds deployment details so routing policy does not depend on a particular
service manager or benchmark. No service name, CLI flag, throughput, or startup
measurement has been verified for this repository.

## Session connection record

Resolve these values from local configuration, wrapper source, and supported help
before the first dispatch. Read a wrapper before invoking it if it might start
inference even for a help request. Avoid printing secrets found in configuration.

| Value | Initial information or required discovery |
| --- | --- |
| Entry point | `claude-korn`; locate with `command -v claude-korn`. |
| Model | Ornith-1.5-35B-A3B, supplied deployment assumption; confirm configured identity. |
| Backend | llama.cpp, supplied deployment assumption. |
| Effective context | 131,072 tokens, supplied deployment assumption; verify runtime configuration and use a smaller actual limit if configured. |
| Health probe | Discover a read-only probe for the configured endpoint/service; record its success criteria. |
| Startup | Discover the exact installed service/wrapper procedure and applicable authorization. |
| CLI contract | Verify prompt input, working directory, tool permissions, output capture, and exit behavior. |
| Isolation | Verify actual read/write enforcement; document any shell or subprocess escape from the conceptual permission profile. |
| Execution control | Verify timeout support, process-tree termination, and exit-state capture. |

Do not turn guessed CLI options into a runnable example. Once discovered, assemble
the invocation from the verified contract and the job's chosen profile. Keep job
text in a file or a structured argument; never interpolate untrusted job text as
shell code. If a required control is unavailable, isolate execution with supported
host facilities or keep the job with the primary agent.

## Availability transitions

If the entry point is absent, classify the runtime as **not installed**. Report that
once and keep work with the primary agent; installation is a separate action.
Do not repeatedly attempt service startup.

If the entry point exists and the health probe confirms the configured backend is
not running, classify it as **stopped**. Use the discovered startup operation only
when authorized, then probe until ready within a bounded startup allowance. A probe
error, authentication error, or unknown endpoint is **unresolved availability**,
not evidence that a service merely needs starting.

A successful probe establishes **running**. Cache the command contract and health
observation for the session, including when it was observed. Reuse that knowledge
for nearby jobs rather than repeating discovery. Refresh health after a long idle
period, a configuration change, or an error suggesting lost availability.

If a job loses the runtime, preserve its output and classify the runtime as **lost
during execution**. Inspect partial file effects before another writer proceeds.
Reprobe before a retry; do not interpret a successful earlier probe as present health.

## Calibration ledger

Keep measurements with date, hardware, runtime/model settings, task shape, input
size, output size, elapsed time, and validation outcome. Label each entry
**measured**, **estimated**, or **provisional**. The starting settings below are
provisional policy choices, not benchmark results:

| Aspect | Starting approach |
| --- | --- |
| Heavy-job concurrency | One job at a time until throughput and interference are measured. |
| Context reserve | Allocate explicit room for reads, tools, reasoning, edits, and output; no measured safe headroom yet. |
| Normal-job ceiling | Select a bounded pilot allowance from user constraints and local observations; no universal timeout supplied. |
| Known-complex ceiling | Use a separately recorded allowance supported by similar successful runs. |
| Dispatch break-even | Compare packaging plus auditing effort against work avoided; no measured minimum size yet. |

Measure generation and prompt-processing rates separately when available. Record
cold-start time, reliable task shapes, useful timeout ranges, and whether simultaneous
requests serialize. A single successful run supports only that configuration and
task shape. Update this layer when observations change; keep the routing principle
independent of those numbers.

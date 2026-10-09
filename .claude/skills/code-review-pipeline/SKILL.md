---
name: code-review-pipeline
description: Run a structured four-phase code review — (1) code correctness, API contract, and database schema, (2) test coverage validation, (3) benchmarking and resource-conscious optimization, (4) security and dependency vulnerability audit. Use this skill whenever the user asks to review, audit, or assess a codebase, repo, service, or PR; asks about missing tests or coverage; asks whether their schema or indexes are correct; asks about API design, response format, status codes, or pagination (offset vs keyset vs cursor); asks to benchmark, profile, or speed something up; asks about caching, Redis, or bottlenecks; or asks to check dependencies, packages, CVEs, or vulnerabilities. Also use it for loose requests like "check my project", "is this production ready", "what's wrong with this codebase", or when a phase is named directly ("do the security pass"). Prefer this skill over ad-hoc review even when the user only wants one phase.
---

# Code Review Pipeline

A staged review that goes code & schema → tests → performance → security, in that
order. The order matters: you can't judge missing tests before you understand what
the code is meant to do, you can't safely change anything without tests, you can't
tell whether an optimization helped without a benchmark, and security fixes usually
mean dependency upgrades that only tests can validate.

## Core rules

**One phase per run.** Finish a phase, deliver its report, then stop and ask
whether to continue. Never silently roll into the next phase — each one produces
findings the user may want to act on first.

**Measure, don't guess.** Every claim should trace to something observed: a file
read, a command run, a benchmark number, an advisory ID. When something can't be
verified in this environment (no DB access, no runnable test suite), say so
explicitly and mark the finding as unverified rather than asserting it.

**Cheapest fix first.** Ordering applies to all four phases: prefer changes that
add no new moving parts over changes that add infrastructure. A missing index
beats a cache. A cache beats a new service.

**Findings carry severity and effort.** Every item gets both, so the user can
triage. Use Critical / High / Medium / Low for severity and S / M / L for effort.

## Step 0 — Orient (always do this first)

Before any phase, build a quick map of the project and state it back to the user
in a few lines:

- Language(s), framework, package manager, and lockfile present
- How tests are run, how the app is built and started
- Database engine and where the schema lives (migrations, ORM models, raw SQL)
- Entry points: HTTP routes, CLI commands, jobs, queue consumers
- Roughly what the project *does* — you can't judge missing tests without this

Read the manifest files (`package.json`, `pyproject.toml`, `go.mod`, `pom.xml`,
`Cargo.toml`, `composer.json`, …), the README, and the directory tree. If the repo
is large, sample: entry points, the largest source directories, and anything named
like config, auth, payment, or migration.

Then confirm the phase to run. If the user hasn't said, default to Phase 1.

## Phase 1 — Code and schema review

Goal: understand what the code is supposed to do, judge whether it does it
correctly, and check that the data model underneath will hold.

Read `references/phase-1-code-and-schema.md` before starting.

Summary of the work:
1. Build the **behavior inventory** — routes, public contracts, business rules,
   state transitions, invariants. Give each a stable ID; every later phase refers
   back to these.
2. Review correctness: error handling, failure states, null handling, boundaries,
   concurrency, resource lifecycle, timeouts on external calls.
3. Review structure: separation of concerns, coupling, duplication, dead code,
   consistency with the project's own conventions.
4. Review the **API contract as a set, not route by route**: one response shape
   everywhere, one minimal error format (a `message`, plus an `errors` object keyed
   by field for validation failures), and specific correct status codes. Flag
   `200 OK` wrapping a failure body — it breaks caching, retries, and monitoring.
5. Review **pagination on every collection endpoint**: unpaginated endpoints first,
   then uncapped page sizes, then strategies that won't survive their eventual data
   volume. Recommend keyset/seek (or opaque cursors for public APIs) wherever a
   collection can grow large, since offset cost grows with page depth.
6. Review the database schema against normalization, key, type, constraint, and
   index rules — especially indexes implied by the queries the code actually runs.
7. Note performance and security observations for Phases 3 and 4 rather than
   solving them here — except anything Critical, which is raised immediately.

Deliverable: `reports/01-code-and-schema.md`, including the behavior inventory and
a handoff list.

## Phase 2 — Test validation

Goal: know what is actually protected, and write the cases that close the gaps.

Read `references/phase-2-tests.md` before starting.

Summary of the work:
1. Map existing tests onto Phase 1's behavior inventory (build the inventory here
   if Phase 1 wasn't run).
2. Report coverage as a gap table, not a percentage — percentages hide which
   *important* things are untested.
3. Flag misleading tests: no assertions, mocking the thing under test, or tests
   that would still pass if the function body were deleted.
4. Propose the missing cases, grouped by what they protect. Include the ugly ones:
   boundaries, empty inputs, concurrency, failure of external calls, and
   authorization as the wrong user or wrong tenant.
5. Assess test infrastructure: runnability, CI, flakiness, isolation, speed.

Deliverable: `reports/02-tests.md` plus the proposed test code.

## Phase 3 — Benchmarks and optimization

Goal: numbers first, then optimizations justified by those numbers.

Read `references/phase-3-benchmarks-and-optimization.md` before starting.

Summary of the work:
1. Pick the measurable units — endpoints, jobs, hot functions, key queries.
2. **Seed a realistic data volume first.** Benchmarks against an empty or 50-row
   database are actively misleading — every plan looks fine and no missing index
   hurts. Seed to expected production scale and 10× it, with realistic skew and
   cardinality, then run `ANALYZE` so the planner has fresh statistics.
3. **Capture the machine's state before starting** — CPU, load, free memory, swap,
   disk, competing processes — and sample resource use during the run. A number
   collected on a loaded or swapping box measures noise, not code.
4. Write runnable benchmarks using the ecosystem's native tooling. Run them if the
   environment allows; if not, deliver the harness plus exact run instructions.
5. **Use the database's own profiling tools** to find slow queries — Postgres
   `EXPLAIN (ANALYZE, BUFFERS)` and `pg_stat_statements`, MySQL `EXPLAIN ANALYZE`
   and `performance_schema`, Mongo `explain("executionStats")`. Paste real plan
   output into the report rather than inferring bottlenecks from source.
6. Record a baseline: p50/p95/p99, throughput, allocations, query counts, peak
   CPU and RSS, and the data volume it was measured at.
7. Propose optimizations strictly in resource-cost order (the ladder in the
   reference file). Do not reach for Redis or a message queue until the free tiers
   — algorithmic fixes, N+1 elimination, indexes, batching, pooling, in-process
   caching — are exhausted or shown insufficient.
8. For each proposal state expected gain, how to verify it with the benchmark, and
   what it costs in memory, CPU, and operational complexity.

Deliverable: `reports/03-performance.md` plus the benchmark files themselves.

## Phase 4 — Security

Goal: the project's own code *and* every dependency it pulls in.

Read `references/phase-4-security.md` before starting.

Summary of the work:
1. Dependency audit: run the ecosystem's audit tool (`npm audit`, `pip-audit`,
   `govulncheck`, `cargo audit`, `osv-scanner`, …) against the lockfile. Never
   recite CVEs from memory — advisory data changes constantly and your training
   data is stale. If no tool can run, say the audit is incomplete and list what to
   run instead.
2. For every vulnerable package: the advisory ID, severity, whether the vulnerable
   code path is actually reachable from this project, the fixed version, and
   whether upgrading is breaking.
3. Code-level review of the project itself: authentication, authorization, input
   handling, injection surfaces, secrets, crypto, file uploads, SSRF, CORS,
   rate limiting, error disclosure, logging of sensitive data.
4. Config and deployment: exposed debug modes, default credentials, permissive
   CORS or storage ACLs, missing security headers.

Deliverable: `reports/04-security.md`, with an upgrade plan ordered by severity ×
reachability. Phase 2's test suite is what makes the resulting upgrades safe to
apply — lean on it, and say so where coverage is thin.

## Report format

Every phase report uses `assets/report-template.md`. The shape is the same each
time so reports are comparable across runs:

```
# <Phase name> — <project>
## Summary            (3-5 lines: what was checked, headline findings)
## Scope and method   (what was read, what was run, what could not be verified)
## Findings           (table: ID | Severity | Effort | Finding | Location)
## Details            (one section per finding: evidence → impact → fix)
## Recommended order  (what to do first and why)
## Not verified       (anything the environment blocked)
```

Write reports to files rather than dumping them in chat — they're long, and the
user will want to keep them.

## Working notes

- If the user only wants one phase, run only that one. Still do Step 0 first.
- If the project is a single file or a snippet, scale down: keep the same
  structure, skip what doesn't apply, and don't pad the report to look thorough.
- When proposing test or benchmark code, match the project's existing conventions
  (framework, naming, fixtures) rather than importing a new style.
- Distinguish clearly between "this is a bug" and "this is a preference". Preferences
  go in a separate low-severity bucket so they don't dilute real findings.

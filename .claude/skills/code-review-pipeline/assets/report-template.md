# <Phase name> — <Project name>

**Date:** <YYYY-MM-DD>
**Scope:** <commit / branch / directories reviewed>
**Phase:** <1 of 4 — Code & Schema | 2 of 4 — Tests | 3 of 4 — Performance | 4 of 4 — Security>

## Summary

Three to five lines. What was checked, the headline findings, and the single most
important thing to do next. Someone should be able to read only this section and
know whether to worry.

Counts by severity: Critical <n> · High <n> · Medium <n> · Low <n>

## Scope and method

- **Read:** <files, directories, schema sources>
- **Ran:** <commands executed, with versions — e.g. `npm audit` (npm 10.8.2)>
- **Environment:** <runtime versions, machine/container limits>
- **For benchmark runs:** seeded row counts per table · statistics refreshed
  (`ANALYZE`) yes/no · system state before the run (load, free memory, swap,
  competing processes) · peak CPU and RSS during the run
- **Could not verify:** <anything blocked — no DB connection, deps not installed,
  no network. Be specific; this defines the audit's real coverage.>

## Findings

| ID | Severity | Effort | Finding | Location |
|----|----------|--------|---------|----------|
| F1 | High | S | <one line> | `path/to/file.py:42` |

<Phase-specific tables go here as well — the behavior inventory for Phase 1,
behavior coverage for Phase 2, baseline measurements for Phase 3, dependency
vulnerabilities for Phase 4.>

## Details

### F1 — <Title>

**Severity:** High · **Effort:** S · **Location:** `path/to/file.py:42`

**Evidence**
What was observed — the code, the query plan, the benchmark number, the advisory.
Quote the relevant lines.

**Impact**
What goes wrong, concretely, and under what conditions.

**Fix**
The specific change. Include code where it clarifies more than prose does.

**Verify**
How to confirm the fix worked — the test to run, the benchmark to rerun, the
command that should now come back clean.

<Repeat per finding.>

## Recommended order

1. **<Finding ID> — <why first>**
2. …

Group anything that should be done together (e.g. dependency upgrades that share a
test run). Note dependencies between items.

## Considered and not recommended

Things that looked like problems but aren't, and changes that were evaluated and
rejected — with the reason. This prevents the same suggestions resurfacing later.

## Not verified

Explicit list of what this review could not check, so nobody reads absence of
findings as evidence of absence of problems.

# Phase 2 — Test validation

Goal: find out what is actually protected, and write the cases that close the gaps.

This phase builds directly on Phase 1's behavior inventory. If Phase 1 was run, reuse
those `B*` IDs. If the user jumped straight here, build the inventory first (§A1
below) — you cannot judge missing tests without knowing what the code is supposed to
do.

## A1. The behavior inventory

Coverage tools tell you which *lines* ran. They don't tell you which *behaviors* are
protected. Start from behaviors, so the gaps that matter become visible.

| Source | What to extract |
|---|---|
| HTTP routes / handlers | Each method+path, its auth requirement, its failure modes |
| Public functions / exported modules | Contract: inputs, outputs, thrown errors |
| Business rules | Anything with a "must", "only if", "at most" — pricing, quotas, permissions |
| State transitions | Legal and illegal moves |
| Background jobs / consumers | Trigger, idempotency expectation, retry behavior |
| Data invariants | What must always be true |

Give each a stable ID (`B1`, `B2`, …).

## A2. Map existing tests onto behaviors

Determine what each test actually asserts — not what its name claims. A test named
`test_create_user` that only asserts a 200 status code does not cover "user is
created with a hashed password".

Classify each behavior as:

- **Covered** — happy path and at least the main failure path are asserted
- **Partial** — happy path only, or assertions too weak to catch regressions
- **Uncovered** — no test touches it

Then flag tests that are actively misleading, which are worse than no test because
they buy false confidence:

- Tests with no assertions, or that assert only that nothing threw
- Tests mocking the exact thing they claim to verify
- Tests depending on execution order or shared mutable fixtures
- **Tests that would still pass if the function body were deleted** — the sharpest
  check available; apply it mentally to anything that looks thin
- Assertions on incidental details (exact log strings, full response snapshots) that
  break on every unrelated change and get disabled
- Skipped or commented-out tests that have been dead for a while

## A3. Propose the missing cases

For each gap, write the case concretely enough that someone could implement it
without asking questions: name, setup, action, expected result. Where the project
already has a test style, write actual runnable code in that style — matching its
framework, fixtures, and naming rather than importing a new approach.

Categories to sweep, since this is where bugs hide:

- **Boundaries** — 0, 1, max, max+1, empty string, empty collection, null/undefined
- **Types and parsing** — wrong type, malformed date, huge number, unicode, very
  long input
- **Auth** — unauthenticated; authenticated but wrong role; correct role but
  *another tenant's resource*. That last one is missed constantly and is the most
  common real-world data leak.
- **Idempotency and retries** — the same request twice, a job re-delivered
- **Concurrency** — two writers on the same row, double submit, race on a counter
- **External failure** — the third-party API times out, returns 500, returns garbage
- **Partial failure** — the write succeeded but the notification failed; what state
  is left behind?
- **Ordering and pagination** — stable sort with a unique tiebreaker, first and last
  page, empty result, page size at the cap and above it, items inserted or deleted
  mid-pagination (offset pagination skips or repeats rows here; keyset should not),
  and an invalid or tampered cursor
- **Response contract** — the documented shape is actually returned; every error
  response carries a `message`; a validation failure returns `errors` keyed by field
  with *all* failing fields present, not just the first; and the status code is the
  specific one (201 with `Location` on create, 409 on conflict, 422 on validation)
  rather than a blanket 200 or 400. Include a framework-generated error — a 404 or a
  wrong HTTP method — since those are the ones that usually escape the project's own
  error format
- **Regression cases** — every bug in the tracker or git history that has no test
  pinning it. These are free, high-value cases: the bug already proved it can happen.

Note the right *level* for each case. A rule living in a pure function should be
unit-tested there, not exercised through an HTTP round-trip — cheaper, faster, and it
fails with a clearer message. Reserve integration tests for wiring and end-to-end
tests for a handful of critical user journeys.

## A4. Test infrastructure and health

- Can the suite be run with one command? Is it in CI, and does CI block merges on it?
- Do tests hit real external services or a shared database? That's the usual source
  of flakiness — recommend fakes or containerized instances per run.
- Is test data built with factories/fixtures, or copy-pasted literals that drift?
- Is state reset between tests (transaction rollback, fresh schema)?
- How long does the suite take? Slow suites stop being run, which makes their
  coverage irrelevant regardless of quality.
- Any flaky tests? A tolerated flaky test trains the team to re-run instead of
  investigate, which is how real failures get ignored.
- Is coverage measured at all? If the tool exists, run it and report the number —
  but present it *after* the gap table, as a secondary metric. Chasing a coverage
  percentage produces assertion-free tests that touch lines without checking anything.

## Output

Fill `assets/report-template.md`. Lead with:

**Behavior coverage**

| ID | Behavior | Status | Existing test | Proposed cases |
|----|----------|--------|---------------|----------------|

**Test health findings**

| ID | Severity | Effort | Finding | Location |
|----|----------|--------|---------|----------|

Then put the proposed test code (or detailed case specs) in the Details section,
grouped by the behavior it protects. Close with a recommended order — usually
regression cases and authorization cases first, since both protect against things
already known to go wrong.

Note in the report that Phase 4's dependency upgrades will lean on this suite: the
better the coverage here, the safer those upgrades are.

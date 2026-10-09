# Phase 1 — Code and schema review

The foundation pass. Read the code, understand what it's supposed to do, judge
whether it does it correctly, and check that the data model underneath will hold.
Everything later depends on this: the behavior inventory built here drives Phase 2's
test gaps, the query patterns found here drive Phase 3's benchmarks, and the input
paths mapped here drive Phase 4's attack surface.

**Stay in your lane.** Performance findings get noted and handed to Phase 3, not
solved here. Security findings likewise go to Phase 4 — except anything Critical,
which is called out immediately rather than sat on for two phases.

## Part A: Code review

### A1. Build the behavior inventory

Before judging the code, write down what it's supposed to do. This inventory is a
deliverable in its own right — Phase 2 maps tests onto it, and it's usually the
first time anyone has written the system's contract down in one place.

| Source | What to extract |
|---|---|
| HTTP routes / handlers | Each method+path, auth requirement, failure modes |
| Public functions / exported modules | Contract: inputs, outputs, errors thrown |
| Business rules | Anything with a "must", "only if", "at most" — pricing, quotas, permissions |
| State transitions | Legal and illegal moves (draft→published, but not archived→draft) |
| Background jobs / consumers | Trigger, idempotency expectation, retry behavior |
| Data invariants | What must always be true (balance ≥ 0, one active session per device) |

Give each a stable ID (`B1`, `B2`, …) and carry these IDs into every later phase so
findings can be traced back to the behavior they threaten.

### A2. Correctness

The findings that matter most — code that will produce a wrong answer, not code
that's ugly.

- **Error handling**: swallowed exceptions (`catch {}`), errors logged then execution
  continues as if nothing happened, error returns ignored (Go `err`, C return codes),
  `catch (Exception)` swallowing everything including bugs
- **Failure states**: what's left behind when step 3 of 5 fails? Partial writes with
  no transaction or compensating action
- **Null and optional handling**: values assumed present, unchecked optional
  unwrapping, `?.` chains that silently produce `undefined` and flow onward
- **Off-by-one and boundaries**: loop bounds, slicing, pagination offsets, inclusive
  vs exclusive ranges
- **Type coercion surprises**: loose equality, implicit string/number conversion,
  float arithmetic on money
- **Time and dates**: naive datetimes mixed with aware ones, local time assumed,
  DST-unsafe arithmetic, timezone stored implicitly
- **Concurrency**: read-modify-write without a lock or atomic operation, shared
  mutable state across requests, non-idempotent handlers on retryable paths, async
  operations not awaited
- **Resource lifecycle**: files, connections, and cursors not closed on the error
  path; missing `finally`/context managers/`defer`
- **Unbounded growth**: collections that only ever get appended to, caches with no
  eviction, retries with no ceiling
- **External calls**: no timeout set (the default is often *infinite*), no retry
  with backoff, retries on non-idempotent operations, no circuit breaking

### A3. Structure and design

- **Separation of concerns**: business rules embedded in HTTP handlers, SQL in view
  templates, controllers that are 400 lines
- **Coupling**: modules reaching into each other's internals; a change in one place
  forcing edits in five
- **Duplication**: the same rule implemented in three places, guaranteed to drift.
  Distinguish real duplication from coincidental similarity — abstracting the latter
  makes things worse.
- **Abstraction fit**: layers that only pass calls through, interfaces with one
  implementation and no prospect of another, generic frameworks built for a single case
- **Consistency**: does this file follow the conventions of the rest of the project?
  Inconsistency costs more than any individual choice.
- **Dependency direction**: does the core domain import the web framework and the
  database driver? That's backwards and makes everything hard to test.
- **Dead code**: unreachable branches, unused exports, commented-out blocks,
  feature flags that have been permanently on for a year

### A4. Readability and maintainability

Keep this section short and clearly separated from correctness findings — style
opinions dilute real bugs. Report only what genuinely costs a future reader time.

- Names that mislead (`getUser` that also writes), or that require reading the body
- Functions doing several unrelated things, deep nesting that flattens with early returns
- Magic numbers and strings with no named constant
- Comments explaining *what* instead of *why*, or contradicting the code
- Missing documentation on non-obvious contracts, especially public APIs
- Overly clever one-liners where plain code would do

### A5. API contract consistency

The single most common complaint about an internal API is that every route behaves
slightly differently. That's not a cosmetic problem — it forces every consumer to
write per-route special cases, and those special cases are where integration bugs
live. Review the routes *as a set*, not one at a time, and report inconsistencies as
findings even when each individual route is defensible on its own.

**Response shape.** Pick one convention and check that every route follows it:

```jsonc
// Envelope style — metadata travels with the payload
{ "data": {...}, "meta": { "page": {...} } }

// Bare style — resource at the top level, metadata in headers
{ "id": "...", "name": "..." }   // + Link / X-Total-Count headers
```

Either is fine. Mixing them is not. Flag routes returning a bare array here and an
envelope there, or a single object on one route and `{results: [...]}` on its sibling.

Then check the details that consumers actually break on:

- **Field naming** — `camelCase` or `snake_case`, chosen once and applied everywhere
- **Dates** — ISO 8601 with an explicit offset, one format across all fields. Mixed
  Unix timestamps and date strings in the same API is a recurring bug source.
- **IDs** — consistent type. Large integer IDs serialized as JSON numbers silently
  lose precision in JavaScript above 2^53; prefer strings for anything that can grow.
- **Money** — one representation (minor units as integer, or decimal string), never float
- **Absent values** — `null` or omitted, decided once. Consumers write different
  guards for each.
- **Empty results** — `[]`, never `null`, and a 200 rather than a 404
- **Booleans and enums** — real booleans, and enum values as stable strings rather
  than magic integers

**Error shape.** Keep it minimal and identical everywhere. Every error response
carries a human-readable `message` and nothing else is required:

```json
{ "message": "Insufficient funds" }
```

Validation failures add an `errors` object keyed by field name, each holding an
array of messages for that field:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "amount": ["The amount must be at least 1.", "The amount must be a number."]
  }
}
```

Nothing else belongs in the default error body. Resist adding envelopes, error
type URIs, or nested detail objects — they cost every consumer extra unwrapping and
buy almost nothing, because the HTTP status code is already the machine-readable
part of the response. If a specific client genuinely needs to branch on a
particular failure, an optional `code` field on that one route is cheaper than
imposing a heavier format on the whole API.

What to verify:
- **The shape is the same on every route.** Framework-generated responses are where
  this usually breaks — 404s, method-not-allowed, and unhandled exceptions often
  bypass the project's own error handler and emit the framework's default format.
  Check those explicitly; they're the ones consumers hit unprepared.
- **Validation returns every failing field at once**, with an array per field since
  one field can fail several rules. A form that surfaces one error at a time across
  five round trips is a bad API.
- **`errors` appears only for validation failures.** Don't send an empty `errors: {}`
  on other errors — consumers then can't use its presence as the signal.
- **Field keys match the request body's field names exactly**, including nested
  paths (`items.0.quantity`), so the client can attach each message to its input.
- **Messages are safe to display.** No stack traces, SQL, file paths, or internal
  identifiers. Cross-reference Phase 4.
- **Messages are written for the person reading them**, not copied from an exception.
  `"Insufficient funds"` beats `"DomainError: balance_check_failed"`.

**Status codes.** Check each route returns something specific and correct:

| Code | Correct use | Common mistake |
|---|---|---|
| 200 | Successful GET/PUT/PATCH with a body | Used for everything, including failures |
| 201 | Resource created — include a `Location` header | 200 returned instead |
| 202 | Accepted for async processing | 200 implying the work is done |
| 204 | Success with no body (DELETE) | 200 with an empty object |
| 400 | Malformed request — unparseable body, bad types | Used for business-rule failures |
| 401 | Not authenticated | Confused with 403 |
| 403 | Authenticated but not permitted | Confused with 401 |
| 404 | Resource absent — or deliberately hiding existence from an unauthorized caller | Returned for every error |
| 405 / 406 / 415 | Wrong method / unacceptable / unsupported media type | Collapsed into 400 |
| 409 | State conflict — duplicate, version mismatch | 400 or 500 |
| 422 | Semantically valid but fails validation | Merged with 400 (acceptable if consistent) |
| 429 | Rate limited — include `Retry-After` | 503, or no signal at all |
| 500 | The server genuinely failed | Returned for client mistakes, poisoning error monitoring |
| 503 | Down or overloaded — include `Retry-After` | 500 |

The worst pattern to flag: **HTTP 200 with `{"success": false}` in the body.** It
breaks caching, proxies, retry logic, client error handling, and every monitoring
dashboard, because to everything except hand-written client code the request
succeeded.

Also check idempotency semantics (`PUT` and `DELETE` repeated should be safe), that
`GET` never mutates, and that versioning and deprecation are handled deliberately
(`Sunset`/`Deprecation` headers, or a documented version scheme).

If an OpenAPI/schema definition exists, verify it matches reality — a stale spec is
worse than none, because consumers trust it.

### A6. Pagination

Check **every** endpoint that returns a collection. Three failure modes, in
descending order of severity:

1. **No pagination at all.** The endpoint returns everything. It works today because
   the table has 4,000 rows and it will fall over at 4,000,000 — and it usually falls
   over on the API server's memory, not the database. Highest-severity pagination
   finding.
2. **No maximum page size.** `?limit=1000000` is a free denial-of-service. Cap it
   server-side (100 is a common ceiling) and clamp rather than error.
3. **A strategy that doesn't survive the data volume it will reach.** See below.

**Choosing a strategy.** The right answer depends on how large the collection can
get and whether users need to jump to arbitrary pages:

| Strategy | How | Good for | Breaks when |
|---|---|---|---|
| **Offset / limit** | `LIMIT 20 OFFSET 4000` | Small, bounded sets; admin tables needing numbered pages | Deep offsets — the database must generate and discard every skipped row, so cost grows linearly with page number. Also drifts: rows inserted or deleted between requests cause items to be skipped or shown twice. |
| **Keyset (seek)** | `WHERE (created_at, id) < (:last_created_at, :last_id) ORDER BY created_at DESC, id DESC LIMIT 20` | Large or unbounded sets; feeds, logs, timelines, event streams | No jumping to page 47; needs a stable sort key; harder with fully user-controlled sorting |
| **Cursor** | Keyset with the key values encoded into one opaque token | Public APIs — the opaque token lets you change the underlying keys without breaking clients | Same constraints as keyset |
| **Streaming / export job** | Chunked response, or a background job producing a file | "Give me everything" use cases | Not a request/response fit; needs job infrastructure |

**Keyset is the default recommendation for anything that can grow large.** Its cost
is constant per page rather than proportional to depth, because the database seeks
straight into the index and reads forward. Two requirements to check when
recommending it:

- The sort must be **totally ordered** — always append a unique tiebreaker (usually
  the primary key), or rows sharing a timestamp will be skipped or repeated at page
  boundaries. This is the mistake that makes keyset implementations subtly wrong.
- A **composite index matching the sort order exactly** must exist
  (`(created_at DESC, id DESC)`), otherwise the seek degrades into a sort.

Cursor pagination is keyset with the key values base64-encoded into a single opaque
`next_cursor` — which is what most well-designed public APIs expose, since it keeps
the client from depending on internals. Recommend it when the API is external.

**Total counts.** `COUNT(*)` over a large filtered set can cost more than the page
query itself, and it's usually displayed only as "of 1,284 results". Options, in
order of preference: omit it; return a `has_more` boolean by fetching `limit + 1`
rows and checking for the extra; use an approximate count from table statistics
(`reltuples` in Postgres) where an estimate suffices; run the exact count only when
the filter is narrow enough. Flag any endpoint that unconditionally counts a large
table on every page request.

**Consistency again.** Parameter names should be identical across every paginated
route — `?limit=&cursor=` on one and `?per_page=&page=` on another is exactly the
kind of inconsistency that makes an API tiring to use. Also check that a default
page size exists, that parameters are validated (negative, zero, non-numeric,
absurdly large), and that sort order is deterministic.

Note deep-offset endpoints for Phase 3 — offset degradation is invisible until the
benchmark runs against seeded volume, and it's one of the clearest before/after
demonstrations a performance report can show.

### A7. Observability and operations

Frequently skipped in reviews, and the reason incidents take hours instead of minutes.

- Are errors logged with enough context to debug (request ID, user ID, inputs)?
- Structured logging, or `print`/`console.log` scattered around?
- Correlation IDs threaded through async and cross-service calls
- Health/readiness endpoints; metrics on the paths that matter
- Configuration via environment with validation at startup — an app should fail
  loudly on boot when a required variable is missing, not at 3 a.m. on first use
- Graceful shutdown: in-flight requests drained, connections closed
- Feature flags and kill switches for risky paths

### A8. Note for later, don't solve here

Keep a running list to hand off:

- **→ Phase 2 (tests)**: behaviors that look fragile or complex — these want tests
  most. Pagination especially: page boundaries, items deleted mid-pagination,
  stable ordering.
- **→ Phase 3 (performance)**: N+1 patterns, loops issuing queries, `SELECT *`,
  deep-offset pagination, unconditional `COUNT(*)`, synchronous calls that could be
  parallel, obvious O(n²)
- **→ Phase 4 (security)**: input that reaches a query/shell/template unvalidated,
  missing auth checks, hardcoded secrets, uncapped page sizes as a DoS vector.
  **Anything Critical is raised now, not deferred.**

## Part B: Database schema review

Review whatever form the schema takes: migrations, ORM models, or raw DDL. If none
is accessible, say so and skip rather than inventing one.

### B1. Structure and normalization

- Every table has a primary key. Prefer a single surrogate key unless there's a
  reason for a composite natural key.
- No repeating groups (`phone1`, `phone2`, `phone3`) and no comma-separated lists
  in a single column — these should be child tables.
- No column that's functionally dependent on a non-key column (3NF violation).
- Deliberate denormalization is fine — but it should be *deliberate*, documented,
  and paired with something that keeps the copies consistent.
- Junction tables for many-to-many, with a composite unique constraint on the pair.

### B2. Keys, types, and constraints

- Foreign keys declared, with an explicit `ON DELETE` / `ON UPDATE` action. An
  undeclared FK is an orphan-row generator.
- `NOT NULL` on everything that is conceptually required. Nullable-by-default
  schemas push validation into application code where it's easy to forget.
- Correct types: money as `DECIMAL`/`NUMERIC` (never float), timestamps as
  timezone-aware (`TIMESTAMPTZ`), enums as enum types or constrained columns,
  booleans as booleans, IDs as a consistent type across all tables.
- `UNIQUE` constraints for real-world uniqueness (email, slug, external ID).
- `CHECK` constraints for invariants the DB can enforce (`quantity > 0`,
  `end_date >= start_date`, valid status values).
- Sensible defaults, and `created_at` / `updated_at` on anything with a lifecycle.
- Consistent naming — plural vs singular tables, `snake_case`, `<table>_id` for FKs.
  Pick whatever the project already does and flag deviations from it.

### B3. Indexes — derive them from the actual queries

This is the highest-value part. Don't guess: grep the codebase for queries and
build the index recommendations from what the code actually filters, joins, and
sorts on.

Checklist:
- **Every foreign key column has an index.** Most engines do *not* create it for
  you (MySQL/InnoDB does, PostgreSQL does not). Without it, joins and cascading
  deletes scan.
- Columns in `WHERE` on hot paths get an index.
- Columns in `ORDER BY` on paginated endpoints — ideally as part of a composite
  index that also covers the filter, so the sort is index-ordered.
- **Composite index column order**: equality columns first, then range, then sort.
  An index on `(user_id, created_at)` serves `WHERE user_id = ? ORDER BY created_at`;
  the reverse order does not.
- Partial indexes where queries always filter a subset (`WHERE deleted_at IS NULL`).
- Unique indexes to back unique constraints.
- Full-text or trigram indexes where the code does `LIKE '%…%'` — a leading
  wildcard cannot use a B-tree index at all.

Then look for indexes to *remove*: duplicates, indexes that are a prefix of another
composite index, and indexes on low-cardinality columns (a boolean flag index rarely
earns its write cost). Every index slows down writes — say so when recommending one.

Recommendations here are *inferred from source*. Phase 3 confirms them against real
plans at real data volume — note which ones need that confirmation, and give the
exact `EXPLAIN` command for each. If a database happens to be reachable now, running
`EXPLAIN` early is a bonus, but the authoritative measurement belongs to Phase 3.

### B4. Access patterns in code

- **N+1 queries** — a loop issuing one query per iteration, or lazy-loaded ORM
  relations accessed inside a loop. Note them; they become Phase 3 material.
- `SELECT *` where only two columns are used, especially on wide tables.
- Missing pagination on list endpoints — unbounded result sets.
- Missing transactions around multi-statement writes that must be atomic.
- Transactions held open across network calls (locks held while waiting on an API).
- Application-side joins that the database should be doing.

### B5. Migrations

- Reversible, or explicitly marked irreversible with a reason.
- No destructive change without a documented backfill/deploy sequence.
- Index creation on large tables uses the concurrent/online variant so it doesn't
  lock writes.
- Migrations are ordered and don't conflict.

## Output

Fill `assets/report-template.md`. Include:

**Behavior inventory** — carried into Phase 2

| ID | Behavior | Location | Notes |
|----|----------|----------|-------|

**Code findings**

| ID | Severity | Effort | Category | Finding | Location |
|----|----------|--------|----------|---------|----------|

**Schema findings**

| ID | Severity | Effort | Object | Finding | Fix |
|----|----------|--------|--------|---------|-----|

**Handoffs** — a short list of items deferred to Phases 2, 3, and 4, so nothing
noticed here gets lost. Keep style-only observations in a separate low-severity
bucket at the end.

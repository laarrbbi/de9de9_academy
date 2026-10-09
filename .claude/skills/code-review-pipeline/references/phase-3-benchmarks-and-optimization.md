# Phase 3 — Benchmarks and optimization

The rule for this phase: **no optimization is proposed without a measurement that
would show whether it worked.** Benchmarks come first, always.

## Part A: Building the benchmarks

### A1. Choose what to measure

Cover every meaningful feature, but weight effort by what's actually hot. For each
unit, note what "good" looks like before measuring, so the numbers mean something.

| Unit | Metric that matters |
|---|---|
| HTTP endpoint | Latency p50/p95/p99, requests/sec, error rate under load |
| Database query | Execution time, rows examined vs returned, plan shape |
| Pure function / algorithm | ns or µs per op, allocations per op |
| Background job | Throughput (items/sec), memory ceiling, time per batch |
| Startup / cold path | Time to ready, memory at idle |
| Page or bundle | Bundle size, time to interactive |

Averages lie. Always report tail latency (p95/p99) for anything user-facing — the
mean hides the requests that make people leave.

### A2. Seed realistic data volume before measuring anything

A benchmark against an empty or near-empty database is worse than no benchmark —
it produces confident numbers that are wrong in the same direction every time.
With 50 rows every query is fast, every plan is a sequential scan that happens to
win, and no missing index hurts. The bugs you are hunting only appear at volume.

**Seed before the first run, not after the first disappointing result.**

Target volumes: match production if known. If not, seed to where the project
expects to be in a year, and additionally at 10× that, so you can see which
queries degrade linearly and which degrade quadratically. A query that goes from
20 ms to 25 ms as data grows 10× is fine; one that goes from 20 ms to 4 s is a
time bomb regardless of its current absolute number.

Rough defaults when nothing better is known: 1M rows in the main entity table,
5–10M in the highest-volume child table (events, line items, logs), 100k in
lookup/user tables.

**Realistic shape matters as much as row count:**

- **Cardinality** — if 80% of orders belong to 20 customers, seeding one order per
  customer produces plans the optimizer would never choose in production
- **Skew** — real data is lopsided. Uniform random distributions make every index
  look equally good and hide the hot-partition problems.
- **Text and payload sizes** — real names, real JSON blobs, real description
  lengths. `"test"` in every text column understates I/O and TOAST/overflow behavior.
- **Nulls and edge rows** — production has them; seeds usually don't
- **Time spread** — timestamps spread across the real historical range, so
  date-range filters and partition pruning behave realistically
- **Relationships** — child rows actually distributed across parents, not all
  hanging off record #1
- **Index state** — build indexes and then run `ANALYZE` / `ANALYZE TABLE` so the
  planner has fresh statistics. Stale statistics produce bad plans and misleading
  benchmarks.

**How to generate it efficiently** — row-by-row `INSERT` from application code
will take hours at these volumes. Prefer:

| Approach | Notes |
|---|---|
| `INSERT … SELECT` from `generate_series` (Postgres) | Fastest for synthetic data, millions of rows in seconds |
| `COPY` / `LOAD DATA INFILE` from a generated CSV | Fastest bulk path for any engine |
| `faker` / `factory_boy` / `faker-js` batched inserts | Realistic text, batch 1000+ per statement |
| Anonymized production dump | Most realistic — only with scrubbed PII, never raw |
| `pgbench -i -s <scale>` | Quick synthetic Postgres load for pure engine testing |

Drop non-essential indexes during bulk load and rebuild after — it's dramatically
faster — then `ANALYZE` before benchmarking.

Keep the seed script in the repo (`bench/seed.*`) and make it deterministic with a
fixed random seed, so runs are comparable across days and machines. Record the row
counts per table in the report; a benchmark number without its data volume is
uninterpretable.

### A3. Capture the machine's starting state

Record what the machine is doing *before* the run, and watch it *during*. A number
collected on a box that was already at 90% CPU or swapping is not a measurement of
your code — it's a measurement of the noise.

**Before the run:**

```bash
# CPU / load / cores
nproc; uptime; lscpu | grep -E 'Model name|^CPU\(s\)|MHz'
# Memory, including swap — swapping in progress invalidates everything
free -h; vmstat 1 3
# Disk space and I/O baseline
df -h; iostat -x 1 3
# What else is competing for the machine
ps aux --sort=-%cpu | head -15
ps aux --sort=-%mem | head -15
# Container limits, if containerized — these bind before the host limits do
cat /sys/fs/cgroup/memory.max /sys/fs/cgroup/cpu.max 2>/dev/null
```

macOS equivalents: `sysctl -n hw.ncpu`, `vm_stat`, `top -l 1`.

Abort or note the run if: load average is already near core count, free memory is
low enough that the page cache can't hold the working set, swap is active, or a
build/IDE/other benchmark is running. Close them and restart rather than
publishing a contaminated number.

**During the run**, sample continuously so you know whether the bottleneck was CPU,
memory, disk, or lock contention — the resource curve tells you *which* rung of the
optimization ladder applies:

```bash
# Sample every second into a log alongside the benchmark
vmstat 1 > bench/results/vmstat.log &
pidstat -p <pid> 1 > bench/results/pidstat.log &
```

Also capture the process's own peak RSS (`/usr/bin/time -v`, `psutil`, or the
runtime's memory API) and, for the database, connection count and cache hit ratio
during load.

**After the run**, record the delta: peak CPU%, peak RSS, disk read/write, and
whether anything hit a ceiling. An endpoint at 200 ms p95 that pins all cores has a
very different scaling story than one at 200 ms that idles the CPU waiting on I/O.

Report the whole environment block with every benchmark:

```
Machine: 8 vCPU / 16 GB / SSD · Linux 6.8 · container limit 4 CPU / 8 GB
Before: load 0.21 · free 11.2 GB · swap 0 · no competing processes
During: peak 340% CPU · peak RSS 1.8 GB · disk read 220 MB/s
Data:   users 100k · orders 1.2M · order_items 6.4M (ANALYZE run)
```

### A4. Use the ecosystem's native tooling

Don't write a custom timing loop when a proper harness exists; hand-rolled timers
miss warmup, GC effects, and dead-code elimination.

| Ecosystem | Micro-benchmarks | HTTP load |
|---|---|---|
| Python | `pytest-benchmark`, `timeit`, `cProfile` + `snakeviz` | `locust`, `k6` |
| Node/TS | `tinybench`, `mitata`, `node --prof`, `clinic` | `autocannon`, `k6` |
| Go | `go test -bench . -benchmem`, `pprof` | `vegeta`, `k6` |
| Rust | `criterion`, `cargo flamegraph` | `oha`, `k6` |
| Java/Kotlin | `JMH`, async-profiler | `Gatling`, `k6` |
| PHP | `PHPBench`, Blackfire/XHProf | `k6` |
| .NET | `BenchmarkDotNet`, dotnet-trace | `k6`, `bombardier` |
| Any CLI | `hyperfine` | — |

`k6` is a good default for HTTP across all stacks. `hyperfine` is a good default
for anything invoked as a command.

### A5. Let the database tell you where it hurts

Application-side timing tells you a request took 840 ms. Only the database can tell
you *why*. Every major engine ships tooling for this — use it rather than guessing
from source code, and paste the actual plan output into the report as evidence.

#### PostgreSQL

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT) <query>;
```

`ANALYZE` actually runs the query and reports real timings; `BUFFERS` shows how
much came from cache versus disk. Read the plan for:

- **Estimated vs actual rows** — a large gap means stale or insufficient statistics;
  the planner is choosing badly because it has bad information. Run `ANALYZE` (or
  raise `default_statistics_target`) and re-check.
- **Seq Scan on a large table** where a filter is selective → missing index
- **Nested Loop** with a high loop count → the N+1 pattern surfacing inside the DB
- **Sort** with `Sort Method: external merge Disk` → spilling to disk; either
  `work_mem` is too low or an index could provide the ordering
- **Hash Join** with `Batches > 1` → also spilling
- **Rows Removed by Filter** — work done and thrown away, usually an index opportunity
- **shared read** ≫ **shared hit** → working set doesn't fit in cache

Supporting tools worth enabling:

| Tool | What it gives you |
|---|---|
| `pg_stat_statements` | The single best starting point — total time, mean time, and call count per normalized query. Sort by total time to find what actually costs you, which is often a fast query called 10,000 times rather than one slow query. |
| `auto_explain` | Logs plans for anything exceeding a duration threshold, automatically, under real load |
| `log_min_duration_statement` | Slow-query log without extensions |
| `pg_stat_user_tables` | Seq scans vs index scans per table, dead tuple counts (vacuum health) |
| `pg_stat_user_indexes` | `idx_scan = 0` means an unused index — pure write cost, drop it |
| `pgbadger` | Turns the log into a readable report |
| `explain.depesz.com` / `explain.dalibo.com` | Visualize a complex plan |

#### Other engines

| Engine | Plan | Aggregate / profiling |
|---|---|---|
| MySQL / MariaDB | `EXPLAIN ANALYZE`, `EXPLAIN FORMAT=JSON` | `performance_schema.events_statements_summary_by_digest`, slow query log + `pt-query-digest`, `SHOW ENGINE INNODB STATUS` for locks |
| SQLite | `EXPLAIN QUERY PLAN` | `.timer on`, `ANALYZE` |
| SQL Server | Actual execution plan, `SET STATISTICS IO, TIME ON` | Query Store, `sys.dm_exec_query_stats`, missing-index DMVs |
| Oracle | `EXPLAIN PLAN` + `DBMS_XPLAN.DISPLAY_CURSOR` | AWR / ASH reports |
| MongoDB | `.explain("executionStats")` — watch `totalDocsExamined` vs `nReturned` | Database profiler, `$indexStats` |
| Redis | `SLOWLOG GET` | `INFO`, `MEMORY DOCTOR`, `--bigkeys` |

#### What to do with it

For each slow query, record in the report: the query, the plan before, the
diagnosis in one line, the change, and the plan after. A plan diff showing
`Seq Scan (8,400 ms)` → `Index Scan (12 ms)` is the most persuasive evidence a
performance report can contain.

Two things to check while you have the plans open:

- **Examined vs returned ratio.** Reading 2M rows to return 20 is the signature of a
  missing or wrong index, in every engine.
- **Unused indexes.** `idx_scan = 0` after a realistic benchmark run means the index
  costs writes and buys nothing — recommend dropping it.

Because indexes only behave realistically at volume, run all of this *after* the
seed step (A2), never against a fresh empty schema.

### A6. Make the benchmark trustworthy

- Warm up before recording — JIT, connection pools, and caches distort the first runs.
- Run enough iterations for a stable number; report the spread, not just the mean.
- Use realistic data volume (A2) and a quiet machine (A3). These two are the most
  common reasons a benchmark number turns out to mean nothing.
- Pin the environment: note machine, runtime version, and whether other work was
  running. Cross-environment comparisons are meaningless.
- Benchmark one thing at a time; if the DB is the bottleneck, an HTTP benchmark
  just measures the DB.
- Count queries per request as a first-class metric — it catches N+1 problems that
  latency alone won't explain until production data grows.

### A7. Record the baseline

Save baseline numbers to a file in the repo so future runs are comparable. Include
the environment and data-volume block from A2/A3 at the top — numbers without that
context can't be compared to anything later.

```
| Unit | Metric | Baseline | Target | Peak CPU / RSS | Notes |
|------|--------|----------|--------|----------------|-------|
| GET /orders | p95 | 840 ms | < 200 ms | 310% / 1.4 GB | 1 + N queries, N ≈ 50; Seq Scan on order_items |
```

If benchmarks can't run in this environment (no DB, no deps installed), still
deliver the harness plus the exact commands, and label all numbers as absent —
never estimate a benchmark result and present it as measured.

## Part B: Optimization — the resource-cost ladder

Climb this ladder in order. Only move up a rung when the rungs below are exhausted
or measurably insufficient. Every rung up adds memory, CPU, failure modes, or
something new to operate — and the user's stated preference is for the tools that
consume the least.

### Rung 0 — Delete work (costs nothing, often the biggest win)

- Remove redundant calls, duplicated computation, and work whose result is discarded
- Return early; skip loops that can't match
- Stop over-fetching: `SELECT` only needed columns, request only needed fields
- Don't serialize what isn't sent; don't log what isn't read
- Remove dependencies whose job three lines of code can do

### Rung 1 — Fix the algorithm and the query shape (costs nothing but effort)

- O(n²) loops → hash lookups; repeated linear scans → a map built once
- **Eliminate N+1**: eager-load / join / batch. Usually the single largest win in a
  typical web app, and it costs zero extra infrastructure.
- Add the missing index (recommended in Phase 1, now confirmed against a real plan) — a well-placed index routinely turns
  seconds into milliseconds for the price of some write overhead and disk
- Move filtering, aggregation, and sorting into the database instead of doing it in
  application memory
- **Replace deep-offset pagination with keyset/seek.** `OFFSET 50000` forces the
  database to generate and discard 50,000 rows on every request, so page 2500 costs
  ~2500× page 1. Keyset seeks straight into the index instead, giving constant cost
  per page for the price of losing arbitrary page jumps. Benchmark this specifically
  at page 1, page 100, and page 5000 — the curve is the argument, and it only appears
  against seeded volume (A2). Requires a composite index matching the sort order
  exactly, with a unique tiebreaker. See Phase 1 §A6 for the strategy comparison.
- **Drop or approximate unconditional `COUNT(*)`** on large filtered sets — the count
  frequently costs more than the page it decorates. Fetch `limit + 1` for a
  `has_more` flag, or use table statistics where an estimate is acceptable.
- Batch inserts/updates instead of row-by-row
- Set-based operations instead of per-item round trips
- Stream large results instead of materializing them
- Add pagination where it's missing (Phase 1 §A6 lists the endpoints)

### Rung 2 — Use what the runtime already gives you (near-zero cost)

- Connection pooling, and correct pool sizing (too large is as bad as too small)
- HTTP keep-alive and reusing clients instead of constructing per request
- Compression (gzip/br) on responses
- HTTP caching headers: `ETag`, `Cache-Control`, `304` — the cheapest cache is the
  one where the response is never generated
- Async/concurrent I/O for independent calls that are currently sequential
- Precompute at build time or write time what's currently computed per read
- Lazy-load and code-split what isn't needed immediately
- Database-native features before external ones: materialized views, generated
  columns, `LISTEN/NOTIFY`, JSONB indexes, full-text search

### Rung 3 — In-process caching (costs memory only)

- Memoization for pure functions with repeated inputs
- A bounded LRU/TTL cache for hot read-mostly data
- Always bounded — an unbounded cache is a memory leak with good PR
- State the invalidation strategy explicitly; a cache without one is a correctness
  bug waiting to happen
- Note the memory ceiling in the proposal

Single-process caches break down when you scale to multiple instances (each has its
own copy, invalidation isn't shared). That limitation is what justifies Rung 4 —
and nothing else does.

### Rung 4 — Shared external infrastructure (costs a service to run)

Only when a specific rung-3 limitation has been demonstrated. Prefer the lightest
option that solves the actual problem:

| Need | Lighter first | Heavier only if needed |
|---|---|---|
| Shared cache across instances | Redis / Valkey | Memcached cluster, CDN tier |
| Background/deferred work | DB-backed queue on the existing database | Redis queue → RabbitMQ → Kafka |
| Full-text search | Postgres `tsvector` / SQLite FTS5 | Meilisearch/Typesense → Elasticsearch |
| Static/edge delivery | CDN in front of existing origin | Dedicated edge compute |
| Read scaling | Read replica | Sharding |
| Time-series/metrics | Existing DB with partitioning | Dedicated TSDB |

For each proposal at this rung, state honestly: what it costs to run (memory,
instances, money), what new failure modes it introduces (what happens when it's
down? does the app degrade or die?), and what operational work it adds (backups,
upgrades, monitoring). If the honest answer is "this saves 20 ms and adds a
service to keep alive", recommend against it.

Note that Redis and Valkey are near drop-in compatible; Valkey is the open-source
fork and is worth mentioning where licensing matters.

### Rung 5 — Rewrite or re-architect

Hot path in a faster language, different storage engine, different topology. Reserve
for cases where measurement shows the ceiling has genuinely been hit. Say plainly
what it costs in engineering time and risk.

## Part C: Writing the proposals

Each optimization gets this shape:

```
### O3 — Eliminate N+1 in the order list endpoint
Rung: 1 (no new infrastructure)
Evidence: GET /orders issues 1 + 52 queries; p95 = 840 ms (benchmark: bench/orders.js)
Change: eager-load `customer` and `items` in the list query
Expected: ~50 ms p95, 2 queries per request
Verify: rerun bench/orders.js — query count and p95 both in the report
Cost: none; slightly larger single query
Risk: low
Effort: S
```

Order the final list by (expected gain ÷ cost), and put a short "do these three
first" section at the top. Explicitly call out any optimization you considered and
rejected, with the reason — that's often the most useful part of the report,
because it stops the user re-proposing it later.

## Anti-patterns to flag

- Caching a computation that a database index would make trivially fast
- Adding Redis for a single-instance app that has no multi-process problem
- Micro-optimizing a function that accounts for 0.3% of request time
- Premature parallelism that adds races to solve a problem the profiler doesn't show
- A cache with no TTL and no invalidation
- Benchmarks run against empty tables and used to justify architecture decisions

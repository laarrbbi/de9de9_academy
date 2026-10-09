# Phase 4 — Security review

Two halves: the dependencies the project pulls in, and the code the project writes.
Most real incidents come from the first; most severe ones from the second.

## Part A: Dependency and supply-chain audit

### A1. Run the real tool — never recall CVEs from memory

Advisory databases change daily and training data goes stale. Any vulnerability
claim must come from a tool run now, or from an advisory page fetched now. If
neither is possible, say the audit could not be completed and give the exact
commands to run — an incomplete audit stated honestly is far more useful than a
confident list of outdated CVEs.

| Ecosystem | Command |
|---|---|
| Node | `npm audit --json` / `pnpm audit` / `yarn npm audit` |
| Python | `pip-audit` (or `uv pip audit`), `safety check` |
| Go | `govulncheck ./...` |
| Rust | `cargo audit` |
| Ruby | `bundle audit check --update` |
| PHP | `composer audit` |
| Java | `mvn dependency-check:check`, `gradle dependencyCheckAnalyse` |
| .NET | `dotnet list package --vulnerable --include-transitive` |
| Any / multi | `osv-scanner scan source -r .`, `trivy fs .`, `grype .` |
| Containers | `trivy image <img>`, `docker scout cves` |

Run against the **lockfile**, not the manifest — the manifest says `^4.17.0`, the
lockfile says what's actually installed. Include transitive dependencies; they're
usually the majority of the tree and where most advisories land.

If network access is unavailable, note it. Where a specific package is suspected,
its advisory page can be fetched directly and cited.

### A2. Report each vulnerable package properly

A raw `npm audit` dump is not a review. For each advisory, add the judgment the
tool can't make:

| Field | Why it matters |
|---|---|
| Package + installed version | — |
| Advisory ID (CVE / GHSA / RUSTSEC) | Lets the user verify independently |
| Severity + CVSS | Triage |
| Direct or transitive, and via what | Determines who can fix it |
| **Reachability** | Is the vulnerable function actually called by this project? A prototype-pollution bug in a dev-only build tool is not the same as an RCE in the request path. This is the single most useful thing to add. |
| Fixed version | The whole point — is there a fix at all? |
| Upgrade path | Patch bump / minor / major-with-breaking-changes / no fix available |
| Recommendation | Upgrade now, upgrade with test coverage, pin + monitor, or replace the package |

Where a package is unfixed or abandoned, say so and name viable replacements.

Present it as a table sorted by severity × reachability, then give a concrete
upgrade plan: which upgrades are safe to batch, which need testing (this is where
Phase 2's tests pay off), and which need code changes.

### A3. Supply-chain hygiene beyond CVEs

- **Unmaintained packages**: last release age, open issue backlog, single maintainer
- **Typosquats and confusables** in dependency names
- **Install scripts** (`postinstall`) in dependencies — these run arbitrary code
- **Lockfile present and committed**; no floating `*` or `latest` versions
- **Dev vs production dependencies** correctly separated
- **License compatibility** where it matters commercially (AGPL/SSPL surprises)
- Dependencies that could be dropped entirely — the safest dependency is the absent one
- Integrity/provenance: lockfile hashes intact, registry not silently overridden

## Part B: Application code review

Work through these; report only what you actually find in the code, with file and
line references.

### B1. Authentication
- Password storage: bcrypt/argon2/scrypt with proper cost — never MD5, SHA-1, or
  unsalted hashes
- Session tokens: random from a CSPRNG, adequate length, rotated on privilege change,
  invalidated on logout
- JWT: algorithm pinned server-side (reject `none` and algorithm confusion), signature
  actually verified, expiry checked, secret not hardcoded
- Login rate limiting / lockout; no user enumeration via differing error messages or
  response timing
- Password reset tokens: single-use, short-lived, random
- MFA handling if present

### B2. Authorization (the most commonly broken)
- Every endpoint checks *who* the caller is and *whether they own this object*.
  IDOR — reading `/orders/1234` belonging to someone else — is endemic.
- Multi-tenant queries scoped by tenant at the query level, not by a UI filter
- Role checks enforced server-side, not just hidden in the frontend
- Mass assignment: can a request body set `is_admin` or `role`?
- Admin routes not merely hidden by obscurity

### B3. Injection and input handling
- SQL: parameterized queries everywhere. Flag any string concatenation or f-string
  building a query, including "safe-looking" ORM raw fragments.
- NoSQL injection via object-valued query parameters
- Command injection: shell invocations built from user input; prefer argument arrays
  over shell strings
- Path traversal in file reads/writes/downloads (`../`)
- Template injection (SSTI) where user input reaches a template engine
- XSS: unescaped output, `dangerouslySetInnerHTML`, `innerHTML`, `v-html`, and any
  user-controlled URL flowing into `href`/`src`
- Deserialization of untrusted data (`pickle`, Java serialization, unsafe YAML)
- XXE in XML parsers (external entities disabled)
- Server-side validation exists independent of client-side validation, with an
  allowlist rather than a denylist

### B4. Secrets and crypto
- No credentials, API keys, tokens, or private keys in source or committed config
- Check git history too — a rotated-out secret still in history is still leaked
- `.env` files gitignored; `.env.example` has placeholders only
- No `Math.random()` or equivalent for anything security-relevant
- TLS verification not disabled; no `verify=False`, no `rejectUnauthorized: false`
- Modern algorithms and modes; no ECB, no hardcoded IVs, no home-rolled crypto
- Constant-time comparison for tokens and signatures

### B5. Web and API surface
- CSRF protection on cookie-authenticated state-changing routes
- CORS: no `Access-Control-Allow-Origin: *` combined with credentials; no reflecting
  arbitrary origins
- Security headers: CSP, `X-Content-Type-Options`, `Referrer-Policy`, HSTS
- Cookies: `HttpOnly`, `Secure`, `SameSite`
- Rate limiting on expensive and abusable endpoints
- SSRF: user-supplied URLs fetched server-side — block internal ranges and cloud
  metadata endpoints, and handle redirects
- Open redirects in login/logout return URLs
- File uploads: type verified by content not extension, size limits, stored outside
  the web root, never executed, filenames sanitized
- Error responses don't leak stack traces, SQL, or internal paths in production
- Debug mode and verbose logging off in production
- GraphQL: depth/complexity limits, introspection disabled in production
- Denial of service: unbounded pagination, expensive regexes on user input (ReDoS),
  zip bombs, unbounded request bodies

### B6. Data handling and logging
- PII identified; encryption at rest where warranted
- Passwords, tokens, card numbers, and full request bodies not written to logs
- Data retention and deletion paths exist if the project claims GDPR-type compliance
- Backups considered — and access to them controlled

### B7. Configuration and deployment
- Default or shared credentials
- Databases, caches, and admin panels bound to `0.0.0.0` or otherwise publicly reachable
- Container running as root; secrets baked into image layers
- Overly permissive cloud IAM, public storage buckets
- CI/CD: secrets in workflow logs, untrusted PR workflows with write tokens,
  unpinned third-party actions

## Output

Fill `assets/report-template.md`, with two dedicated tables:

**Dependency vulnerabilities**

| ID | Package@version | Advisory | Severity | Reachable? | Fixed in | Upgrade type | Action |
|----|-----------------|----------|----------|------------|----------|--------------|--------|

**Code findings**

| ID | Severity | Effort | Category | Location | Finding |
|----|----------|--------|----------|----------|---------|

Then a **Remediation plan** ordered by severity × reachability, split into:
1. Do today (exploitable, reachable, fix available)
2. Do this sprint
3. Track (unfixed upstream, low reachability, or accepted risk)

Note in the report which tools were run and which were unavailable, so the reader
knows the audit's actual coverage. State clearly that a review of this kind reduces
risk but does not replace penetration testing on anything handling sensitive data.

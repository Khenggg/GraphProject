# Category: Platform Operations & Diagnostics

**Shared decisions:** SDR-05/09/19/21/24 apply. Detailed diagnostics require Admin and fresh confirmation where data is enumerated. Liveness endpoints are infrastructure-only/minimal; diagnostic responses have strict redaction and row/period limits.

---

# AI Implementation Guide: Core Health Check

**Target Path:** Platform Operations & Diagnostics > Core Health Check (`leaf-diag-core-health`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** System, Admin  
**API:** `GET /api/core/health/live` (minimal), `GET /api/core/health` (Admin detail)

## 1. Summary / Objective
Provide liveness/readiness observability for Core without leaking secrets or data.
## 2. Scope
Component health/status/version/watermark; no debug data dump/remediation.
## 3. Actors / Roles / Permissions
Infrastructure reads liveness; Admin + fresh session reads detail.
## 4. Preconditions
Endpoint reachable; detail caller authorized.
## 5. Postconditions
No mutation; status includes check time/correlation.
## 6. Main Flow
Liveness checks process; readiness checks dependency ping with timeout; detail masks component metadata.
## 7. Alternative Flows
Degraded dependency returns `DEGRADED` status/503 readiness but liveness may remain 200.
## 8. Failure Flows
No stack trace/connection string/host secret is emitted.
## 9. Business Rules
Liveness never checks expensive DB queries; readiness is bounded and dependency-specific.
## 10. API Contracts
Live `{status:"UP"}`; detail `{status,components:[name,status,latencyMs?],version,checkedAt}`.
## 11. Data Requirements
Runtime probes/component config redacted, no business tables.
## 12. Validation Rules
No untrusted query input.
## 13. Duplicate, Retry and Concurrency Rules
Safe GET/cache disabled or very short infrastructure policy.
## 14. Security Requirements
Network restrict detail, Admin auth, field allow-list.
## 15. Logging / Audit / Observability
Probe status/latency/correlation, no credentials; alert readiness sustained failure.
## 16. Frontend Behavior
Admin status panel; public app never renders detailed health.
## 17. Edge Cases
DB slow causes readiness timeout, not unbounded request pile-up.
## 18. Automated Test Cases
Live/detail scopes, healthy/degraded/down, timeout/redaction/no stack trace.
## 19. Acceptance / Done Criteria
Infrastructure can detect state without exposing internal topology/secrets.
## 20. Decisions and Assumptions
Separate live/detail routes clarify original single health leaf intent.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Support Health Check

**Target Path:** Platform Operations & Diagnostics > Support Health Check (`leaf-diag-support-health`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** System, Admin  
**API:** `GET /api/support/health/live`, `GET /api/support/health`

## 1. Summary / Objective
Expose Support service/projection-consumer health safely.
## 2. Scope
Liveness/readiness/projection lag component status; no report/query dump.
## 3. Actors / Roles / Permissions
Infrastructure live; Admin detail.
## 4. Preconditions
Endpoint/service active; Admin JWT for detail.
## 5. Postconditions
No mutation and watermark freshness reported in detail.
## 6. Main Flow
Check process/dependency/consumer availability with bounded probes.
## 7. Alternative Flows
Consumer lag yields `DEGRADED` detail while read service may remain available with `asOf` warning.
## 8. Failure Flows
Dependency details/redacted provider endpoint never returned.
## 9. Business Rules
Support health does not claim Core command state correctness; it reports projection freshness only.
## 10. API Contracts
Same live/detail shape as Core plus `projectionLagSeconds?`/watermark.
## 11. Data Requirements
Runtime probes/consumer checkpoint/version, no customer records.
## 12. Validation Rules
No query parameters.
## 13. Duplicate, Retry and Concurrency Rules
Safe bounded probes.
## 14. Security Requirements
Admin detail/network restriction/redaction.
## 15. Logging / Audit / Observability
Lag/readiness/timeout alerts and probe traces.
## 16. Frontend Behavior
Admin displays Support/Core separately and labels eventual consistency.
## 17. Edge Cases
Outbox backlog persists after restart and is visible as stale rather than zero lag.
## 18. Automated Test Cases
Live/detail, consumer lag, dependency down, redaction, timeout.
## 19. Acceptance / Done Criteria
Operators can distinguish service availability from projection freshness.
## 20. Decisions and Assumptions
Matches SDR-20 `asOf` contract.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Database Check

**Target Path:** Platform Operations & Diagnostics > Database Check (`leaf-diag-db-check`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Admin, System  
**API:** `GET /api/core/db-check`

## 1. Summary / Objective
Verify database connectivity, migration compatibility and selected invariants without dumping data.
## 2. Scope
Bounded health/schema/invariant checks; no migration execution/arbitrary query.
## 3. Actors / Roles / Permissions
Admin + fresh confirmation detail; System monitor limited aggregate check.
## 4. Preconditions
Authorized caller/probe identity and configured DB timeout.
## 5. Postconditions
No mutation; check report has status/time/correlation/redacted component data.
## 6. Main Flow
Run bounded connection/version/migration/invariant count checks and classify healthy/degraded/down.
## 7. Alternative Flows
Slow check returns timeout/degraded without query plan/raw data.
## 8. Failure Flows
Connection/permission/schema mismatch shows error class only, never DSN/user/SQL.
## 9. Business Rules
Invariants include allocation non-negative/one-active constraints as aggregate counts, not record rows.
## 10. API Contracts
`{status,checks:[name,status,latencyMs?,count?],checkedAt,correlationId}`.
## 11. Data Requirements
Connection/migration history/aggregate invariant query result.
## 12. Validation Rules
No client SQL/table parameter.
## 13. Duplicate, Retry and Concurrency Rules
Safe GET/bounded per-caller rate; no migration lock acquisition.
## 14. Security Requirements
Admin/probe RBAC, redaction, network restriction.
## 15. Logging / Audit / Observability
Check result/latency/error class alert; detailed check access audited.
## 16. Frontend Behavior
Admin panel shows component status/count only with retry/backoff.
## 17. Edge Cases
Invariant mismatch marks degraded and links to incident/runbook, not auto-repair.
## 18. Automated Test Cases
Healthy/down/timeout/schema mismatch/invariant mismatch/redaction/rate guard.
## 19. Acceptance / Done Criteria
Database diagnostics cannot expose or mutate records.
## 20. Decisions and Assumptions
Repair remains an explicit incident/migration workflow.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Reservation Debug Dump

**Target Path:** Platform Operations & Diagnostics > Reservation Debug Dump (`leaf-diag-res-dump`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** System/Core diagnostic read model · **Actors:** Admin  
**API:** `GET /api/core/diagnostics/reservations` (break-glass only)

## 1. Summary / Objective
Provide a bounded redacted diagnostic view of reservation state transitions for active incident triage.
## 2. Scope
Filtered read-only state/event correlation; no mass export/mutation.
## 3. Actors / Roles / Permissions
Admin plus break-glass deployment flag/fresh confirmation.
## 4. Preconditions
Production flag enabled if production, valid incident/correlation/reservation filter.
## 5. Postconditions
No mutation; access audit and bounded redacted result.
## 6. Main Flow
Validate break-glass/filter, load max 100 matching records/events, redact PII/payment refs, return correlation timeline.
## 7. Alternative Flows
Non-production test-run filter works without production flag but still Admin/audited.
## 8. Failure Flows
No flag/unbounded query/foreign scope/row overflow returns forbidden/validation without partial dump.
## 9. Business Rules
At least one exact `reservationId`, `correlationId`, `incidentId` or `testRunId` required; no date-only whole-table dump.
## 10. API Contracts
Query `{reservationId?|correlationId?|incidentId?|testRunId?,confirmationToken}` → `{items:[redacted state timeline],asOf}`.
## 11. Data Requirements
Reservation/event/payment summary/allocation/audit correlation fields, redaction policy.
## 12. Validation Rules
One anchor ID, max 100 rows, fresh confirmation/break-glass condition.
## 13. Duplicate, Retry and Concurrency Rules
Safe read snapshot; no state reprocessing.
## 14. Security Requirements
Strong Admin/break-glass, mask plate/contact/checkout/card and no raw token/document.
## 15. Logging / Audit / Observability
High-priority access audit/filter hash/row count; anomaly alerts.
## 16. Frontend Behavior
Admin-only incident tool with warning, filter requirement and redacted timeline.
## 17. Edge Cases
Anchor resolves many rows: truncation is explicit/never silently paged into unbounded dump.
## 18. Automated Test Cases
Guard, anchor/filter, redaction, row limit, snapshot, audit, production/default denial.
## 19. Acceptance / Done Criteria
Diagnostic usefulness does not create a broad data-exfiltration endpoint.
## 20. Decisions and Assumptions
Production use follows SDR-24 break-glass default disabled.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Session Debug Dump

**Target Path:** Platform Operations & Diagnostics > Session Debug Dump (`leaf-diag-sess-dump`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** System/Core diagnostic read model · **Actors:** Admin  
**API:** `GET /api/core/diagnostics/sessions` (break-glass only)

## 1. Summary / Objective
Provide bounded redacted session/gate/payment handoff timeline for incident diagnosis.
## 2. Scope
Filtered read-only correlation across session, barrier commands and settlement; no replay/mutation.
## 3. Actors / Roles / Permissions
Admin/break-glass/fresh confirmation only.
## 4. Preconditions
Valid anchor session/correlation/incident/test run and environment guard.
## 5. Postconditions
No state mutation; audited redacted timeline returned.
## 6. Main Flow
Validate guard, query bounded related state/event versions, redact identity/device/payment fields, return ordered timeline/asOf.
## 7. Alternative Flows
Non-prod test run uses same output policy.
## 8. Failure Flows
Unanchored/broad/unauthorized/over-limit query fails no partial disclosure.
## 9. Business Rules
Timeline distinguishes `EXIT_AUTHORIZED`, barrier ACK and verified `CLOSED`; no implied passage.
## 10. API Contracts
Query `{sessionId?|correlationId?|incidentId?|testRunId?,confirmationToken}` → `{items:[redacted timeline],asOf}`.
## 11. Data Requirements
Session/state versions, gate command/events, payment summary, incident/audit correlations.
## 12. Validation Rules
Exact anchor, max 100 related rows, confirmation required.
## 13. Duplicate, Retry and Concurrency Rules
Safe snapshot query.
## 14. Security Requirements
Break-glass/RBAC/redaction, no raw card/QR/device secret/plate/contact.
## 15. Logging / Audit / Observability
High-priority access audit/row count/error alert.
## 16. Frontend Behavior
Privileged incident timeline, redaction markers/no copy-all raw payload control.
## 17. Edge Cases
Late barrier event appears as linked incident evidence; diagnostic view never applies it.
## 18. Automated Test Cases
All guard paths, state sequencing/redaction, row limit, audit, event-late case.
## 19. Acceptance / Done Criteria
Session diagnostics support triage without altering or broadly leaking state.
## 20. Decisions and Assumptions
Same break-glass policy as reservation dump.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

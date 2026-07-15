# Category: Feedback

**Shared decisions:** SDR-03/04/05/08/10/19 apply. Support owns feedback commands/read models. Anonymous feedback is permitted with strict anti-abuse controls; it does not become a public discussion board.

## Category-level lifecycle

`NEW → IN_REVIEW → RESPONDED → CLOSED`, or `REJECTED`. Manager/Admin decisions are append-only status history. A response is visible to the identified submitter only when the selected contact/account path supports it; anonymous submission never has a public detail URL.

---

# AI Implementation Guide: Submit Feedback

**Target Path:** Feedback > Submit Feedback (`leaf-feed-submit`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Guest, Driver  
**API:** `POST /api/support/feedbacks`

## 1. Summary / Objective
Accept a rate-limited suggestion/complaint with optional authenticated identity/contact context.
## 2. Scope
Create feedback and confirmation token; excludes public listing/attachment moderation.
## 3. Actors / Roles / Permissions
Guest anonymous or active Driver; optional identity derives from JWT, never body user ID.
## 4. Preconditions
Valid category/content and anti-abuse rate/captcha policy passes.
## 5. Postconditions
One `NEW` feedback record, safe acknowledgement and audit/operational event exist.
## 6. Main Flow
Validate/rate-limit, normalize content/contact, create record with submitter mode, emit manager notification event.
## 7. Alternative Flows
Authenticated Driver may opt to expose account contact; anonymous gets opaque receipt ID only.
## 8. Failure Flows
Rate/captcha failure → `RATE_LIMITED`/validation; duplicate same idempotency payload replays; no account enumeration.
## 9. Business Rules
Categories `SUGGESTION`,`COMPLAINT`,`OTHER`; text is untrusted/plain text; anonymous has no self-service detail/status endpoint in this release.
## 10. API Contracts
`{category,subject,message,contactEmail?,allowContact?}` → 201 `{id,status,submittedAt,receiptToken?}`.
## 11. Data Requirements
Feedback record, submitter ID nullable, contact encrypted/minimized, content moderation flag/status history.
## 12. Validation Rules
Subject 5–150, message 20–4000, valid email optional, HTML stripped, configured rate/captcha token.
## 13. Duplicate, Retry and Concurrency Rules
Idempotency key (guest bound to rate-limit fingerprint); same submission replay, different payload conflict.
## 14. Security Requirements
IP hashing/minimal retention, CAPTCHA verification server-side, XSS sanitation, no public feedback lookup.
## 15. Logging / Audit / Observability
Rate/moderation metrics; redact content/contact in generic logs.
## 16. Frontend Behavior
Character count, consent checkbox, submit lock, receipt/retry without exposing anonymous record later.
## 17. Edge Cases
Driver logs out after submit: record remains associated by immutable submitter ID but contact visibility preference remains snapshot.
## 18. Automated Test Cases
Guest/Driver create, validation/sanitize, rate limit/captcha, replay, no user ID injection, notification event.
## 19. Acceptance / Done Criteria
Feedback is accepted safely without becoming a spam or PII disclosure path.
## 20. Decisions and Assumptions
Anonymous allowed by default; attachment uploads require a separate malware/retention guide.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Feedback Management List

**Target Path:** Feedback > Feedback Management List (`leaf-feed-list`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Manager, Admin  
**API:** `GET /api/support/admin/feedbacks`

## 1. Summary / Objective
Provide a role-scoped paged work queue for feedback triage.
## 2. Scope
List/filter/count only; no content mutation/detail response workflow.
## 3. Actors / Roles / Permissions
Manager/Admin; Manager sees operational queue, Admin all including moderation metadata.
## 4. Preconditions
Authenticated authorized actor.
## 5. Postconditions
Read-only paged summary with no unnecessary submitter PII.
## 6. Main Flow
Authorize, filter status/category/date/assigned/anonymous, stable sort by urgency/created time.
## 7. Alternative Flows
Empty queue returns 200/empty items; aggregate counts include same visibility filter.
## 8. Failure Flows
Invalid filter/unauthorized returns typed error; no public access.
## 9. Business Rules
List masks anonymous contact; full content is accessed through Detail with audit.
## 10. API Contracts
Query `{status?,category?,from?,to?,assigned?,page,pageSize}` → summaries `{id,category,subject,status,createdAt,submitterType,assignedTo?}`.
## 11. Data Requirements
Feedback/status/assignment/date indexes; role scope projection.
## 12. Validation Rules
Enum/date/paging shared rules.
## 13. Duplicate, Retry and Concurrency Rules
Safe GET; record version returned in detail, not needed to list.
## 14. Security Requirements
Manager/Admin RBAC and PII field allow-list.
## 15. Logging / Audit / Observability
Audit privileged queue access category; backlog/SLA metrics.
## 16. Frontend Behavior
Server filter/table, visible status chips, empty/error/retry state.
## 17. Edge Cases
Status changes during paging use stable sort/asOf and refresh indicator.
## 18. Automated Test Cases
Role scope, filters/paging, PII mask, empty/invalid/forbidden, aggregate alignment.
## 19. Acceptance / Done Criteria
Queue works without exposing anonymous source/contact unnecessarily.
## 20. Decisions and Assumptions
No Staff access by default; managers are accountable triage owners.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Feedback Detail

**Target Path:** Feedback > Feedback Detail (`leaf-feed-detail`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Manager, Admin  
**API:** `GET /api/support/admin/feedbacks/{id}`

## 1. Summary / Objective
Show one feedback's content, safe submitter context and immutable status timeline.
## 2. Scope
Read detail/timeline; no update/respond action.
## 3. Actors / Roles / Permissions
Manager/Admin with queue scope.
## 4. Preconditions
Feedback exists/visible to actor.
## 5. Postconditions
No mutation; sensitive contact shown only when allowed/needed.
## 6. Main Flow
Authorize scoped ID, retrieve field allow-list and response/status history.
## 7. Alternative Flows
Anonymous submitter has no identity fields; opted-in contact is masked by default.
## 8. Failure Flows
Missing/foreign scoped ID → `NOT_FOUND`/`FORBIDDEN` without leak.
## 9. Business Rules
Original message remains immutable; moderation/redaction is represented by status/history, not silent overwrite.
## 10. API Contracts
Returns `{id,category,subject,message,status,history,contactSummary?,version,createdAt,updatedAt}`.
## 11. Data Requirements
Feedback content/contact privacy metadata/status history/audit access entry.
## 12. Validation Rules
UUID only; no free text query.
## 13. Duplicate, Retry and Concurrency Rules
Safe GET; version returned for update guide.
## 14. Security Requirements
RBAC/field masking, HTML escaped and content never used as markup.
## 15. Logging / Audit / Observability
Audit detail access; alert anomalous bulk detail read.
## 16. Frontend Behavior
Plain text rendering, timeline and transition action gated by status/role.
## 17. Edge Cases
Deleted contact/driver account does not erase feedback facts; detail marks contact unavailable.
## 18. Automated Test Cases
Anonymous/identified masks, role scope, XSS rendering, history, not-found/access audit.
## 19. Acceptance / Done Criteria
Detail preserves submission record and minimizes PII exposure.
## 20. Decisions and Assumptions
No anonymous self-service detail path is exposed.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Feedback Status Update

**Target Path:** Feedback > Feedback Status Update (`leaf-feed-update`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Manager, Admin  
**API:** `PUT /api/support/admin/feedbacks/{id}`

## 1. Summary / Objective
Triage/respond/close feedback with accountable state transitions.
## 2. Scope
Status, assignment and manager response; excludes editing original content/deleting feedback.
## 3. Actors / Roles / Permissions
Manager standard update; Admin may reject/close moderation cases.
## 4. Preconditions
Visible feedback/current version and allowed transition.
## 5. Postconditions
Append-only status history/response/actor timestamp; notification dispatch when identified submitter can receive it.
## 6. Main Flow
Lock version, validate transition/response, append history/update current state, publish feedback event.
## 7. Alternative Flows
`IN_REVIEW` assigns without response; `RESPONDED` requires response; `CLOSED` requires prior response or closure reason.
## 8. Failure Flows
Invalid/stale/closed/rejected transition or insufficient reason returns typed error.
## 9. Business Rules
`REJECTED` requires moderation reason; response visibility respects submitter/contact preference; original message stays immutable.
## 10. API Contracts
`{status,assignmentId?,response?,reason?,version}` → `{id,status,historyEntry,version,updatedAt}`.
## 11. Data Requirements
Feedback current state/version, append-only history, response safe text, notification event/outbox.
## 12. Validation Rules
Status enum, response/reason 10–4000 where required, assignment valid manager, version required.
## 13. Duplicate, Retry and Concurrency Rules
Idempotency/version; first transition wins, second refreshes timeline.
## 14. Security Requirements
Manager/Admin RBAC, response sanitization and contact visibility enforcement.
## 15. Logging / Audit / Observability
Audit transition/actor/reason, resolution/SLA/rejection metrics.
## 16. Frontend Behavior
Transition-specific required fields, version conflict reload, response preview plain text.
## 17. Edge Cases
Anonymous feedback can be marked responded internally but has no delivery attempt.
## 18. Automated Test Cases
All valid/invalid transitions, mandatory response/reason, concurrency/replay, notification eligibility, XSS/role scope.
## 19. Acceptance / Done Criteria
Feedback handling is traceable and does not overwrite original customer evidence.
## 20. Decisions and Assumptions
Final state set is the category lifecycle above; detailed SLA values are configuration.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

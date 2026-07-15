# Category: Notifications

**Shared decisions:** SDR-03/04/08/10/19 apply. Support owns notification records/read models; Core publishes durable outbox events only. The seed routes with `{userId}` are replaced by `/api/support/notifications/me`; a legacy route, if retained, must reject any ID different from JWT `sub` and is not the implementation target.

## Category-level rules

- In-app notification is the required channel in this release; email/SMS/push preferences are out of scope.
- Event delivery is at-least-once, consumer is idempotent, notification content is immutable apart from `readAt`.
- Retention duration is configuration; expired records are not returned to normal clients.

---

# AI Implementation Guide: Notification Dispatch

**Target Path:** Notifications > Notification Dispatch (**new mandatory supporting feature**)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API / System  
**API:** internal Core outbox consumer

## 1. Summary / Objective
Convert committed domain events into one or more durable in-app recipient notifications.
## 2. Scope
Event consume/template/render/persist/retry; no direct Core-table mutation or external channel delivery.
## 3. Actors / Roles / Permissions
System consumer only; recipients later read their own records.
## 4. Preconditions
Valid versioned Core outbox event with recipient/record context and supported event type.
## 5. Postconditions
One deduplicated notification per recipient/event/template version or a recorded terminal processing failure.
## 6. Main Flow
Consume event, validate schema, resolve recipient/authorized template, persist notification and consumer checkpoint atomically.
## 7. Alternative Flows
Unsupported event is parked/observable without blocking consumer progress.
## 8. Failure Flows
Transient persistence failure retries with backoff; poison payload is quarantined and alerts operations.
## 9. Business Rules
Templates must not include raw tokens/payment secrets/full card data; category examples reservation/payment/pass/incident status.
## 10. API Contracts
Internal event `{eventId,type,occurredAt,aggregateId,aggregateVersion,recipientIds,payloadSafe}`; no public command.
## 11. Data Requirements
`notifications(id,recipient_id,event_id,type,title,body,data_safe,created_at,read_at,expires_at)` and consumer inbox/checkpoint.
## 12. Validation Rules
Event ID/type/recipient UUID; payload allow-list; title/body bounded and escaped.
## 13. Duplicate, Retry and Concurrency Rules
Unique `(event_id,recipient_id,template_version)`; inbox event ID dedupe and bounded retry.
## 14. Security Requirements
Least-privilege consumer, payload allow-list, XSS-safe rendering and no cross-recipient linkage.
## 15. Logging / Audit / Observability
Consumer lag/retry/quarantine/created count metrics; no sensitive payload log.
## 16. Frontend Behavior
None directly; list UI reflects eventually delivered records.
## 17. Edge Cases
Recipient deactivated after event: persist only if policy says operational notice; otherwise suppress with audit reason.
## 18. Automated Test Cases
One/multi-recipient, duplicate/reordered event, transient/poison failure, template redaction, inactive recipient.
## 19. Acceptance / Done Criteria
No user action is required for Core command success and event duplicate cannot duplicate inbox entries.
## 20. Decisions and Assumptions
In-app-only is an `[ASSUMPTION FOR READINESS]`; external delivery needs a separate consent/preference feature.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: User Notifications

**Target Path:** Notifications > User Notifications (`leaf-notif-user`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Driver, Staff, Manager, Admin  
**API:** `GET /api/support/notifications/me`

## 1. Summary / Objective
List notifications belonging to the authenticated user.
## 2. Scope
Paged own inbox/filter; no notification creation or cross-user lookup.
## 3. Actors / Roles / Permissions
Any active authenticated role; recipient is JWT `sub`.
## 4. Preconditions
Valid active session and Support projection/notification store reachable.
## 5. Postconditions
No mutation; each result includes `asOf` and safe action data.
## 6. Main Flow
Authorize, filter `recipientId=sub` and non-expired records, apply type/read/date paging.
## 7. Alternative Flows
No notifications returns empty list; unread-only is a dedicated leaf but may be filter implementation shared.
## 8. Failure Flows
Invalid filters → `VALIDATION_FAILED`; unavailable store → retryable error.
## 9. Business Rules
Only safe `data` deep-link keys are returned; item bodies are immutable and ordered newest-first/ID tie-break.
## 10. API Contracts
Query `{type?,read?,from?,to?,page,pageSize}` → `{items:[id,type,title,body,data,createdAt,readAt?],asOf,pagination}`.
## 11. Data Requirements
Notification recipient/type/read/expiry indexes and projection freshness metadata.
## 12. Validation Rules
Type enum, UTC dates max 365d, SDR-03 pagination.
## 13. Duplicate, Retry and Concurrency Rules
Safe GET; immutable IDs make pagination stable with `createdAt,id` cursor-equivalent sort.
## 14. Security Requirements
No caller user ID parameter; row-level recipient filter; HTML not trusted/rendered.
## 15. Logging / Audit / Observability
Access/latency/error/lag metrics; no normal business audit.
## 16. Frontend Behavior
Inbox pagination, unread badge, empty/error/retry and safe internal deep-link mapping.
## 17. Edge Cases
Expired notification between pages is absent rather than returned stale; new ones appear on refresh.
## 18. Automated Test Cases
Owner isolation, filters/paging, expiry, safe data fields, legacy userId route reject, error state.
## 19. Acceptance / Done Criteria
No user can enumerate or read another recipient's notification.
## 20. Decisions and Assumptions
The seed's `{userId}` endpoint is a deprecated mapping, not a final contract.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Unread Notifications

**Target Path:** Notifications > Unread Notifications (`leaf-notif-unread`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Driver, Staff, Manager, Admin  
**API:** `GET /api/support/notifications/me/unread`

## 1. Summary / Objective
Return unread own notifications and unread count for an indicator/feed.
## 2. Scope
Read-only unread list/count; no mark-all-read command.
## 3. Actors / Roles / Permissions
Authenticated recipient only.
## 4. Preconditions
Valid session and own notification record set.
## 5. Postconditions
No read state changes.
## 6. Main Flow
Filter recipient/non-expired `readAt IS NULL`, count and page newest-first.
## 7. Alternative Flows
Empty list returns count zero/empty items.
## 8. Failure Flows
Store error retryable; no user-supplied recipient accepted.
## 9. Business Rules
Read status is per recipient, never global event state; count matches same visibility/expiry filter.
## 10. API Contracts
Query `{type?,page,pageSize}` → `{unreadCount,items,pagination,asOf}`.
## 11. Data Requirements
Composite recipient/read/expiry/created index.
## 12. Validation Rules
Enum/paging per shared rules.
## 13. Duplicate, Retry and Concurrency Rules
Safe GET; a concurrent mark-read may make count/list differ only at `asOf` boundary and next refresh resolves it.
## 14. Security Requirements
JWT recipient filter; no cache shared across users.
## 15. Logging / Audit / Observability
Unread count query latency/cache metric; no sensitive logs.
## 16. Frontend Behavior
Badge uses returned count; optimistic read update reconciles on next response.
## 17. Edge Cases
Notification expires while unread; it drops from both count/list consistently in one query snapshot.
## 18. Automated Test Cases
Own-only count, expiry, mark-read race, pagination/type filter, zero state.
## 19. Acceptance / Done Criteria
Unread indicator cannot leak another user's alerts.
## 20. Decisions and Assumptions
Count and items use one database snapshot/query transaction.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Mark Notification as Read

**Target Path:** Notifications > Mark Notification as Read (`leaf-notif-read`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Driver, Staff, Manager, Admin  
**API:** `PATCH /api/support/notifications/{id}/read`

## 1. Summary / Objective
Mark one own notification read once, safely under retries.
## 2. Scope
Set `readAt`; no delete/edit/unread command.
## 3. Actors / Roles / Permissions
Authenticated recipient only.
## 4. Preconditions
Notification exists, belongs to caller and is unexpired.
## 5. Postconditions
`readAt` is immutable first-read UTC; returned item/count reflects state.
## 6. Main Flow
Conditionally update `recipientId=sub AND readAt IS NULL`, return current record for already-read case.
## 7. Alternative Flows
Repeated request is 200 idempotent with original `readAt`.
## 8. Failure Flows
Foreign/missing/expired ID returns `NOT_FOUND` without ownership disclosure.
## 9. Business Rules
Read does not alter event/business state or notification body.
## 10. API Contracts
Empty body + optional version; response `{id,readAt,unreadCount}`.
## 11. Data Requirements
Notification row/read timestamp/recipient index; optional audit for security notification only.
## 12. Validation Rules
UUID path; no caller-controlled `readAt`/recipient.
## 13. Duplicate, Retry and Concurrency Rules
Safe idempotent conditional update; no Idempotency-Key required because same terminal update is explicit.
## 14. Security Requirements
Recipient predicate in update itself; no global ID authorization precheck only.
## 15. Logging / Audit / Observability
Metric read transitions/idempotent repeats; privileged notification reads may be audited by type.
## 16. Frontend Behavior
Optimistically gray item, rollback/reload on error, badge decremented only on confirmed update.
## 17. Edge Cases
Two devices mark it read: one timestamp wins, both receive same final value.
## 18. Automated Test Cases
First/repeat/two-device; foreign/not-found/expired; count; payload mass-assignment rejection.
## 19. Acceptance / Done Criteria
One notification can be read only by its recipient without losing first-read time.
## 20. Decisions and Assumptions
Mark-as-unread is intentionally not provided to preserve an audit-friendly receipt signal.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

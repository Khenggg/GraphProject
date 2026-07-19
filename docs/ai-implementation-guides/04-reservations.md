# Category: Reservations

**Shared decisions:** SDR-03/04/05/08/13/15/16/19 apply. Core owns every allocation and state transition; Support only projects driver history. The expiry worker is added as a mandatory feature because an unpaid/expired booking must release capacity without manual intervention.

## Category-level lifecycle

`PENDING_PAYMENT → CONFIRMED → CLAIMED → COMPLETED`; cancellation from `PENDING_PAYMENT`/`CONFIRMED`; expiry from `PENDING_PAYMENT`/`CONFIRMED`; terminal `CANCELLED`,`EXPIRED`,`COMPLETED`. A reservation owns one compatible slot or atomic non-slot area capacity during its active states. Price/policy/version snapshot is immutable.

---

# AI Implementation Guide: Available Reservation Locations

**Target Path:** Reservations > Available Reservation Locations (`leaf-res-avail`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Driver  
**API:** `GET /api/core/reservations/available-locations`

## 1. Summary / Objective
Show locations currently eligible for a requested booking window.
## 2. Scope
Eligibility/ranking read only; no capacity hold or price commitment.
## 3. Actors / Roles / Permissions
Active Driver; request is scoped to own eligible vehicle/type.
## 4. Preconditions
Valid `vehicleId` owned by caller or `vehicleTypeId`, valid future UTC interval.
## 5. Postconditions
No mutation; response includes `asOf` and policy version.
## 6. Main Flow
Validate time/type, exclude occupied/reserved/out-of-service capacity, return active compatible candidates.
## 7. Alternative Flows
Non-slot types return areas/remaining capacity; slot types return slots.
## 8. Failure Flows
No candidates → empty 200; invalid/too-long window → `VALIDATION_FAILED`; other owner's vehicle → `FORBIDDEN`.
## 9. Business Rules
Result is advisory; Create Reservation rechecks and locks capacity.
## 10. API Contracts
Query `{vehicleId?|vehicleTypeId,startsAt,endsAt}` → `{items:[locationId,type,availableCapacity],asOf,policyVersion}`.
## 11. Data Requirements
Reads active config and reservation/session allocation counters/indexes.
## 12. Validation Rules
Start < end, start ≤30 days ahead, duration ≤24h, UUID/enums valid.
## 13. Duplicate, Retry and Concurrency Rules
Safe GET, no hold; race is resolved only by create transaction.
## 14. Security Requirements
No occupied plate/session/card data exposed.
## 15. Logging / Audit / Observability
Query/no-capacity/latency metrics; no audit for normal reads.
## 16. Frontend Behavior
Shows timing, capacity caveat and refresh/retry on create conflict.
## 17. Edge Cases
Clock boundary uses server UTC; results cannot include inactive parent configuration.
## 18. Automated Test Cases
Slot/non-slot candidates, no result, invalid window, owner scope, race with create.
## 19. Acceptance / Done Criteria
Read path cannot reserve a location or show unsafe configuration.
## 20. Decisions and Assumptions
Ranking reuses configuration suggestion policy until a booking-specific policy is approved.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Create Reservation

**Target Path:** Reservations > Create Reservation (`leaf-res-create`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Driver  
**API:** `POST /api/core/reservations`, `GET /api/core/reservations/{id}/payment-status`

## 1. Summary / Objective
Create an owned time-bound reservation and payment obligation using a locked allocation.
## 2. Scope
Create, allocate, price snapshot and initial payment state; not payment settlement/entry.
## 3. Actors / Roles / Permissions
Active Driver owns the selected active vehicle.
## 4. Preconditions
Vehicle active/owned; requested location/type/window eligible; current policy resolvable.
## 5. Postconditions
One `PENDING_PAYMENT` reservation, allocation hold, immutable amount/rule snapshot and payment obligation are committed atomically.
## 6. Main Flow
Normalize request, lock conditional capacity, calculate/snapshot price, create reservation/payment, publish outbox event.
## 7. Alternative Flows
If configured booking requires no prepayment, create directly `CONFIRMED` with `NOT_REQUIRED` payment state.
## 8. Failure Flows
Capacity race → `CONFLICT`; invalid vehicle/policy → typed error; payment setup failure rolls back creation.
## 9. Business Rules
Unique active booking per driver/vehicle/window/location overlap; code is opaque unique; unpaid deadline is stored at creation.
## 10. API Contracts
Body `{vehicleId,locationId,startsAt,endsAt}`; 201 data `{id,code,status,paymentStatus,amount,currency,priceSnapshot,paymentDeadline,version}`; status GET returns only caller-owned record.
## 11. Data Requirements
`reservations`, slot/area allocation, `payments`, `payment_attempts`, idempotency/outbox/audit tables.
## 12. Validation Rules
IDs UUID, future time bounds, max duration, vehicle/location type compatibility, no client amount.
## 13. Duplicate, Retry and Concurrency Rules
`Idempotency-Key` required; unique/lock allocation; same fingerprint replays, conflicting key payload fails.
## 14. Security Requirements
Owner derived from JWT; no price override; return payment URL/token only to owner where needed.
## 15. Logging / Audit / Observability
Audit create/amount snapshot; metrics allocation conflict/payment-pending age.
## 16. Frontend Behavior
Disable duplicate submit; display status/deadline and poll/status-refresh safely; preserve form on conflict.
## 17. Edge Cases
Provider initialization cannot leave a reservation with an inaccessible unpaid deadline; transaction creates recoverable pending record only when provider reference persisted.
## 18. Automated Test Cases
Happy slot/non-slot; amount snapshot; overlap; race; retry; invalid/foreign vehicle; unpaid deadline; no client amount.
## 19. Acceptance / Done Criteria
Exactly one hold/obligation exists and expiry can release it deterministically.
## 20. Decisions and Assumptions
Default prepayment state is `PENDING_PAYMENT`; exact deadline duration is configuration, not hard-coded.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Extend Reservation

**Target Path:** Reservations > Extend Reservation (`leaf-res-extend`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Driver  
**API:** `POST /api/core/reservations/{id}/extend`

## 1. Summary / Objective
Extend an owned active reservation without violating later allocations or pricing snapshots.
## 2. Scope
Window extension and incremental obligation; not location change/cancellation.
## 3. Actors / Roles / Permissions
Active owner Driver only.
## 4. Preconditions
Reservation is owned, `PENDING_PAYMENT`/`CONFIRMED`, not claimed/expired and extension ends before maximum horizon.
## 5. Postconditions
New end time/version and additional immutable price obligation are atomically recorded, or nothing changes.
## 6. Main Flow
Lock reservation/allocation, validate future capacity, compute incremental current-rule snapshot, persist extension/payment state.
## 7. Alternative Flows
No price increment keeps payment state; positive increment produces pending payment before extension is confirmed.
## 8. Failure Flows
Later allocation/cutoff/state/stale version fails `CONFLICT`/`STATE_NOT_ALLOWED`.
## 9. Business Rules
Never re-price original period; no extension after gate claim; original reservation code remains stable.
## 10. API Contracts
`{newEndsAt,version}` → `{reservationId,oldEndsAt,newEndsAt,incrementalAmount,paymentStatus,version}`.
## 11. Data Requirements
Reservation version, allocation calendar/counter, extension snapshot and payment attempt relation.
## 12. Validation Rules
New end strictly later, UTC/max duration/horizon; no client price.
## 13. Duplicate, Retry and Concurrency Rules
Idempotency + reservation/allocation lock; one extension command at a time.
## 14. Security Requirements
Owner check before resource-state information; no URL/payment secret leakage.
## 15. Logging / Audit / Observability
Audit old/new interval/price; measure rejected-capacity cases.
## 16. Frontend Behavior
Show additional charge/deadline, requires explicit confirmation, conflict refresh.
## 17. Edge Cases
If new payment expires, only extension delta is reversed and original valid interval remains intact.
## 18. Automated Test Cases
Free extension; paid extension; later overlap; claimed/expired target; concurrent extend; retry.
## 19. Acceptance / Done Criteria
Extension cannot release, double-book or alter original commercial snapshot.
## 20. Decisions and Assumptions
Partial extension expiry is a compensating delta, not a full reservation cancellation.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Cancel Reservation

**Target Path:** Reservations > Cancel Reservation (`leaf-res-cancel`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Driver  
**API:** `POST /api/core/reservations/{id}/cancel`

## 1. Summary / Objective
Allow the owner to release an unclaimed booking safely.
## 2. Scope
Cancellation/state/allocation release; no refund command.
## 3. Actors / Roles / Permissions
Owner Driver; staff/admin cancellation belongs to a future incident/override command.
## 4. Preconditions
Reservation is `PENDING_PAYMENT`/`CONFIRMED`, owned, unclaimed and before configured cutoff.
## 5. Postconditions
`CANCELLED`, capacity released and any unsettled attempt marked cancelled/expired transactionally.
## 6. Main Flow
Lock state/allocation, validate cutoff, transition, release allocation, publish/audit.
## 7. Alternative Flows
Already cancelled with same idempotency key replays original result.
## 8. Failure Flows
Claimed/completed/expired/foreign/cutoff target returns typed state/authorization error.
## 9. Business Rules
Paid settlement is not refunded here per ODR-01; it becomes `UNDER_REVIEW` with a reference if necessary.
## 10. API Contracts
`{version,reason?}` → `{id,status: CANCELLED,paymentStatus,releasedAt,version}`.
## 11. Data Requirements
Reservation, allocation counter/slot, payment attempt status, audit/outbox.
## 12. Validation Rules
Reason optional max 500; version required; no user-selected terminal status.
## 13. Duplicate, Retry and Concurrency Rules
Idempotency and single conditional transition/release transaction.
## 14. Security Requirements
Owner authorization; reason no sensitive free-text logging outside audit redaction.
## 15. Logging / Audit / Observability
Audit reason/outcome and measure cancellation before/after payment.
## 16. Frontend Behavior
Destructive confirmation, cutoff policy text, retry only after conflict refresh.
## 17. Edge Cases
Webhook racing cancellation sees payment attempt state and sends discrepancy to review rather than re-confirming booking.
## 18. Automated Test Cases
Pending/confirmed cancellation; claimed rejection; cutoff; replay; allocation release; webhook race.
## 19. Acceptance / Done Criteria
Capacity is released exactly once and money is not silently refunded/voided.
## 20. Decisions and Assumptions
ODR-01 default applies.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Driver Reservation History

**Target Path:** Reservations > Driver Reservation History (`leaf-res-driver-history`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Driver  
**API:** `GET /api/support/reservations/me/active`, `GET /api/support/reservations/me/history`

## 1. Summary / Objective
Show the driver's active and historical reservation read model.
## 2. Scope
Own projection lists/detail summary; no Core state mutation.
## 3. Actors / Roles / Permissions
Active Driver, implicit identity only.
## 4. Preconditions
Support has consumed Core reservation/payment events.
## 5. Postconditions
No mutation; data returns projection `asOf`.
## 6. Main Flow
Authorize owner filter first, select active (`PENDING_PAYMENT`,`CONFIRMED`) or terminal history, paginate.
## 7. Alternative Flows
Stale projection returns known state/asOf; Core payment-status endpoint remains mutation-adjacent source for immediate poll.
## 8. Failure Flows
No items is 200; unavailable projection is retryable service error.
## 9. Business Rules
Active list excludes claimed/terminal; history retains code, interval, location summary, amount/payment state without provider secrets.
## 10. API Contracts
History query `from?,to?,status?,page,pageSize`; item `{id,code,window,status,paymentStatus,amount,locationSummary,updatedAt}`.
## 11. Data Requirements
Idempotent reservation/payment event projection with owner ID and source version.
## 12. Validation Rules
UTC date range/max 365d; status enum; paging SDR-03.
## 13. Duplicate, Retry and Concurrency Rules
GET safe; consumer deduplicates event ID and ignores stale version.
## 14. Security Requirements
Row scope; no other driver/projection internal fields.
## 15. Logging / Audit / Observability
Projection lag and query errors observable; normal read access not business-audited.
## 16. Frontend Behavior
Active cards with payment/cancel actions, history pagination, clear as-of/stale indicator.
## 17. Edge Cases
Terminal event before a delayed create event is resolved by source version/state precedence.
## 18. Automated Test Cases
Owner isolation; active/history boundary; projection reorder/dedupe; empty/stale/error; PII exclusion.
## 19. Acceptance / Done Criteria
Support cannot expose a state conflicting with Core source version.
## 20. Decisions and Assumptions
Core is authoritative for immediate status; Support is eventual read projection.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Reservation Expiry & Allocation Release

**Target Path:** Reservations > Reservation Expiry & Allocation Release (**new mandatory supporting feature**)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API / System  
**API:** internal scheduled command; no public endpoint

## 1. Summary / Objective
Expire overdue unpaid/unused bookings and release their capacity exactly once.
## 2. Scope
Scheduled claim/expire/release and event publication; no user-facing cancellation/refund.
## 3. Actors / Roles / Permissions
System worker only; operational replay uses non-production/admin utility under SDR-21.
## 4. Preconditions
Reservation is non-terminal and its payment/arrival deadline is earlier than trusted server UTC.
## 5. Postconditions
Reservation becomes `EXPIRED`, allocation release and payment-attempt update commit atomically.
## 6. Main Flow
Batch claim due rows with `SKIP LOCKED`/conditional version, transition/release, audit/system event, publish outbox.
## 7. Alternative Flows
Paid/confirmed before lock is skipped; claimed reservation uses session lifecycle instead.
## 8. Failure Flows
Per-row transaction failure leaves it retryable; worker never bulk-releases unmatched rows.
## 9. Business Rules
Deadline source is persisted per reservation; no background job computes commercial deadline from current config.
## 10. API Contracts
Internal result `{scanned,expired,skipped,failed,runId,asOf}` with no public route.
## 11. Data Requirements
Due index on active status/deadline; reservation/allocation/payment/audit/outbox transaction.
## 12. Validation Rules
Worker validates allowable state/version before transition; batch size configured and bounded.
## 13. Duplicate, Retry and Concurrency Rules
Multiple workers safe via lock/conditional update; run/retry idempotent per reservation state.
## 14. Security Requirements
Service identity minimal write permission; no user credentials or provider secrets in logs.
## 15. Logging / Audit / Observability
Run ID, counts, oldest overdue age, failures alert; audit each expiry.
## 16. Frontend Behavior
Driver status refresh shows `EXPIRED` and released capacity; no client triggers worker.
## 17. Edge Cases
Payment webhook racing expiry locks same obligation; any late confirmed payment enters reconciliation, not reactivation.
## 18. Automated Test Cases
Due/not-due; retry; concurrent workers; allocation release once; payment webhook race; partial batch failure.
## 19. Acceptance / Done Criteria
No unpaid/expired booking can permanently consume capacity.
## 20. Decisions and Assumptions
This is a required system feature inferred from the existing done criterion and SDR-13/16.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

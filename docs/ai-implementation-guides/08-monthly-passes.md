# Category: Monthly Passes

**Shared decisions:** SDR-04/05/08/14/15/17/19/22/23 apply. Core owns applications, pass, card binding and payments. `Monthly Pass Check During Entry Exit` (`leaf-mp-validation`) is fully specified in [05-parking-operations.md](05-parking-operations.md), because it is a gate-time consumer of this lifecycle.

## Category-level lifecycle

Application: `SUBMITTED → UNDER_REVIEW → APPROVED_PENDING_PAYMENT → (payment) → ACTIVE pass`, or `REJECTED/CANCELLED/EXPIRED`. Pass: `PENDING_PAYMENT → ACTIVE → EXPIRED/CANCELLED`, with `SUSPENDED` permitted for controlled operational action. One driver/vehicle cannot hold overlapping active pass periods.

---

# AI Implementation Guide: Driver Monthly Pass Application

**Target Path:** Monthly Passes > Driver Monthly Pass Application (`leaf-driver-mp-application`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API (write), Spring Boot Support API (own-list projection) · **Actors:** Driver  
**API:** `POST /api/core/monthly-passes/applications`, `GET /api/support/monthly-passes/applications/me`

## 1. Summary / Objective
Let a Driver request a monthly pass for an owned active vehicle and requested period.
## 2. Scope
Create/request own-list; excludes approval, payment, card binding and entitlement activation.
## 3. Actors / Roles / Permissions
Active Driver; owner derived only from JWT.
## 4. Preconditions
Owned active vehicle, active vehicle type/config, valid future period and no overlapping active/pending application rule violation.
## 5. Postconditions
One `SUBMITTED` application with vehicle/price context snapshot and audit/outbox event.
## 6. Main Flow
Validate ownership/period/overlap, resolve applicable pass pricing snapshot, persist application and publish event.
## 7. Alternative Flows
If business requires supporting document later, application accepts evidence references—not raw binary—in this release.
## 8. Failure Flows
Foreign/inactive vehicle, invalid period, duplicate active application or missing price rule returns typed error.
## 9. Business Rules
Application does not reserve a card or grant parking; price snapshot is confirmed/refreshed at approval only if pricing policy version changed.
## 10. API Contracts
POST `{vehicleId,startsAt,endsAt,notes?}` → 201 `{id,status,vehicleSummary,requestedPeriod,pricePreview?,version}`; Support list includes `asOf`.
## 11. Data Requirements
Applications, vehicle/type snapshot, requested period, provisional pricing context, audit/outbox/projection.
## 12. Validation Rules
Period starts future/current configured grace, ends after start, max 12 months; notes max 500; UUID vehicle.
## 13. Duplicate, Retry and Concurrency Rules
Idempotency key + unique active driver/vehicle/overlap check under transaction.
## 14. Security Requirements
Owner only; notes/evidence sanitized; no manager decision data in Driver create response.
## 15. Logging / Audit / Observability
Audit creation; metrics duplicate/approval queue age.
## 16. Frontend Behavior
Vehicle picker only active own cars, date validation, submitted timeline/status and empty state.
## 17. Edge Cases
Vehicle deactivation after submission blocks approval until application is cancelled/rejected—not silently reassigned.
## 18. Automated Test Cases
Valid create, period/overlap, vehicle ownership/status, idempotency race, projection own-list/lag, price absent.
## 19. Acceptance / Done Criteria
Application cannot create a pass, payment or card binding by itself.
## 20. Decisions and Assumptions
One unreviewed overlapping request is blocked to avoid duplicate approval work.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Monthly Pass Application Review

**Target Path:** Monthly Passes > Monthly Pass Application Review (`leaf-mp-app-review`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Manager, Admin  
**API:** `GET /api/core/monthly-passes/applications`, `PATCH /api/core/monthly-passes/applications/{id}/status`

## 1. Summary / Objective
Review application evidence/eligibility and approve, reject or cancel with a recorded decision.
## 2. Scope
Queue/detail decision and approved payment obligation creation; excludes direct payment/card issue.
## 3. Actors / Roles / Permissions
Manager standard reviewer; Admin recovery/override with reason.
## 4. Preconditions
Application current state `SUBMITTED`/`UNDER_REVIEW`, reviewer authority and current version.
## 5. Postconditions
Application becomes `UNDER_REVIEW`, `REJECTED` or `APPROVED_PENDING_PAYMENT`; approval creates immutable pricing/payment obligation atomically.
## 6. Main Flow
Filter queue, lock application, revalidate vehicle/period/no overlap/current configuration, write decision/reason and obligation when approved.
## 7. Alternative Flows
Reviewer may move `SUBMITTED → UNDER_REVIEW` to request evidence; Driver sees requested evidence reason.
## 8. Failure Flows
Inactive vehicle/overlap/missing price/current state/version causes conflict/state error; no approval obligation leaks.
## 9. Business Rules
Reject/cancel reason required; approval does not make pass active; reviewer cannot alter requested driver/vehicle/period.
## 10. API Contracts
List filters status/date; patch `{status,version,reason,evidenceRef?}` → application/payment summary; only allowed transitions accepted.
## 11. Data Requirements
Application version/decision/evidence ref, price snapshot/payment obligation, audit/outbox.
## 12. Validation Rules
Status enum/transition, reason 10–500, evidence ref required only for review request/rejection where policy requires.
## 13. Duplicate, Retry and Concurrency Rules
Idempotency + conditional application update; payment obligation unique per approval version.
## 14. Security Requirements
Manager/Admin RBAC, Driver data minimization, evidence link authorization.
## 15. Logging / Audit / Observability
Audit decision/reviewer/reason; queue/SLA/approval conflict metrics.
## 16. Frontend Behavior
Immutable request pane, transition-specific form and stale-version refresh; no inline price edit.
## 17. Edge Cases
Price rule changes before approval resolve a new current snapshot visibly; past requested preview is retained for audit.
## 18. Automated Test Cases
Queue scopes, each transition, invalid vehicle/overlap, atomic obligation, concurrent review, reasons/evidence, audit.
## 19. Acceptance / Done Criteria
Only a validated reviewed application can create a pay-required pass obligation.
## 20. Decisions and Assumptions
No auto-approval threshold is assumed; all applications require a manager decision.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Monthly Pass Application Payment

**Target Path:** Monthly Passes > Monthly Pass Application Payment (**new mandatory supporting feature**)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Driver, Staff  
**API:** `POST /api/core/payments/online/monthly-pass`, provider webhook reuses PayOS contract

## 1. Summary / Objective
Collect approved monthly-pass payment and activate exactly one entitlement after verified settlement.
## 2. Scope
Checkout attempt/settlement handoff; no application approval or direct card assignment.
## 3. Actors / Roles / Permissions
Application owner Driver; Staff may initiate assisted checkout but cannot settle it manually through this endpoint.
## 4. Preconditions
Owned `APPROVED_PENDING_PAYMENT` application, unexpired immutable obligation, current version.
## 5. Postconditions
Verified `PAID` settlement creates/activates one pass in one transaction and emits projection event.
## 6. Main Flow
Create/reuse checkout attempt, PayOS webhook verifies, locks obligation/application, records payment, creates `ACTIVE` pass.
## 7. Alternative Flows
Expired/failed checkout leaves application pending or marks it expired per persisted deadline; re-initiation creates a new attempt only.
## 8. Failure Flows
Wrong owner/state, provider mismatch/late event or overlapping active pass becomes typed error/review case.
## 9. Business Rules
Pass period/vehicle/type/pricing snapshot derive from approved application; payment success is the only normal activation trigger.
## 10. API Contracts
`{applicationId,version,returnUrl?}` → `{paymentId,attemptId,checkoutUrl,amount,expiresAt}`; webhook uses SDR-16.
## 11. Data Requirements
Application/payment/attempt/pass unique relation, price snapshot, audit/outbox.
## 12. Validation Rules
UUID/version/HTTPS return allow-list; no client amount or pass fields.
## 13. Duplicate, Retry and Concurrency Rules
Idempotency and unique active-pass/approved-obligation guard; webhook dedupe as PayOS guide.
## 14. Security Requirements
Owner/gate-assisted scope, provider secret isolation and checkout URL redaction.
## 15. Logging / Audit / Observability
Application-to-pass correlation, pending age, activation/review failures.
## 16. Frontend Behavior
Payment pending state, return redirect never treated as paid, pass refresh after verified webhook.
## 17. Edge Cases
Payment success after application expiry creates review, never an automatic pass.
## 18. Automated Test Cases
Checkout/reuse, webhook activation once, owner/state guard, overlap race, expiry/late payment, idempotency.
## 19. Acceptance / Done Criteria
No active pass exists without a valid approved application and settled obligation.
## 20. Decisions and Assumptions
Cash monthly-pass collection is excluded until separately approved; online provider reuse is intentional.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Monthly Pass Card Management

**Target Path:** Monthly Passes > Monthly Pass Card Management (`leaf-mp-card-manage`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Manager, Admin  
**API:** `GET /api/core/monthly-passes`, `POST /api/core/monthly-passes`, `PUT /api/core/monthly-passes/{id}`, `PATCH /api/core/monthly-passes/{id}/status`

## 1. Summary / Objective
Administer active pass records and bind/replace their physical cards safely.
## 2. Scope
List/detail, card bind/unbind, limited metadata/status management; excludes bypass activation/payment.
## 3. Actors / Roles / Permissions
Manager standard operations; Admin recovery; Driver reads own pass through future/support view only.
## 4. Preconditions
Pass/current version, card state/availability and reason/evidence for binding/status action.
## 5. Postconditions
Pass/card binding version and related card state are atomically updated/audited.
## 6. Main Flow
Lock pass/card, validate entitlement/current binding, bind/replacement or permitted status action, publish event.
## 7. Alternative Flows
`POST` is allowed only to materialize a previously approved-and-paid application; otherwise it returns state error.
## 8. Failure Flows
Unpaid/expired pass, non-available/already bound card, overlap/stale version or missing reason fails.
## 9. Business Rules
SDR-17/23; pass cannot be directly activated by CRUD; `SUSPENDED` requires manager reason and fails gate check.
## 10. API Contracts
List filters status/vehicle/period; card action body `{cardId?,status?,version,reason,evidenceRef?}`; response has pass/card masked summary.
## 11. Data Requirements
Pass, application/payment relation, vehicle/card binding history, version/audit/outbox.
## 12. Validation Rules
Allowed status transition, UUID/version, reason/evidence requirements; no driver/vehicle reassignment after activation.
## 13. Duplicate, Retry and Concurrency Rules
Idempotency plus pass/card dual lock/unique active binding constraint.
## 14. Security Requirements
Manager/Admin RBAC; card UID masked; no raw payment data.
## 15. Logging / Audit / Observability
Audit binding/replacement/status reason; alert duplicate/blocked card scans.
## 16. Frontend Behavior
Display entitlement timeline, card availability and immutable payment/application links; confirm destructive changes.
## 17. Edge Cases
Lost card replacement must link Lost Card incident; old card cannot remain active bound.
## 18. Automated Test Cases
Paid activation materialization, card bind/replacement collision, suspension, stale dual update, incident link, gate-check effect.
## 19. Acceptance / Done Criteria
No card/pass assignment can create duplicate entitlement or bypass payment.
## 20. Decisions and Assumptions
Original broad CRUD is constrained to preserve SDR-17; no hard delete.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Renew Monthly Pass

**Target Path:** Monthly Passes > Renew Monthly Pass (`leaf-mp-renew`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Driver, Staff  
**API:** `POST /api/core/monthly-passes/{id}/renew`

## 1. Summary / Objective
Create a controlled renewal obligation for an owned active/near-expiry pass.
## 2. Scope
Renewal request/price snapshot/payment link; no free extension or vehicle transfer.
## 3. Actors / Roles / Permissions
Owner Driver; Staff may initiate assisted renewal for the confirmed owner at assigned gate/desk.
## 4. Preconditions
Pass belongs to active Driver, has valid status/period within configured renewal window and current version.
## 5. Postconditions
One renewal request/obligation is created; pass period changes only after verified payment.
## 6. Main Flow
Lock pass, validate overlap/window/vehicle, resolve renewal price snapshot, create payment obligation/attempt reference.
## 7. Alternative Flows
Expired pass may renew as a new non-overlapping period if config allows; otherwise requires new application.
## 8. Failure Flows
Foreign/suspended/cancelled/overlap/state/version failure yields typed error; no date extension.
## 9. Business Rules
Renewal never overlaps another active pass for same vehicle; same card remains bound only after new period activates.
## 10. API Contracts
`{requestedEndsAt,version,returnUrl?}` → `{renewalId,paymentId,amount,period,status,checkoutUrl?}`.
## 11. Data Requirements
Pass version, renewal request/snapshot/payment relation, card binding/audit/outbox.
## 12. Validation Rules
Ends after existing/current start, max term, UTC, no client amount; Staff requires owner confirmation reference.
## 13. Duplicate, Retry and Concurrency Rules
Idempotency and unique pending renewal per pass; payment webhook activates once.
## 14. Security Requirements
Owner/assisted-staff scope, no unauthorized pass lookup, checkout redaction.
## 15. Logging / Audit / Observability
Audit request/assistance, renewal-pending age/activation metric.
## 16. Frontend Behavior
Display existing/new period, amount/deadline, no “renewed” success until webhook confirms.
## 17. Edge Cases
Concurrent original application/new renewal resolves under overlap constraint; second command returns conflict.
## 18. Automated Test Cases
Owner renewal, staff assistance scope, window/overlap, webhook activation, repeat request, expired policy, stale version.
## 19. Acceptance / Done Criteria
Renewal cannot extend entitlement or card validity before settlement.
## 20. Decisions and Assumptions
Renewal payment uses same provider settlement contract; exact window/term are ODR-02 configuration.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

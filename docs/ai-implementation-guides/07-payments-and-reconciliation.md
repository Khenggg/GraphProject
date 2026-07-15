# Category: Payments and Payment Reconciliation

**Shared decisions:** SDR-04/05/13/15/16/18/19 apply. Core owns payment/attempt/review writes. A settlement for an exit obligation atomically advances its matching session from `EXIT_PENDING_PAYMENT` to `EXIT_AUTHORIZED`, then emits the barrier handoff; it never closes the session itself.

## Category-level rules

- Amount comes only from immutable obligation snapshot. One obligation has many attempts but one successful settlement.
- `PAID`, `WAIVED`, `NOT_REQUIRED` are settlement states; contradictory/late provider outcomes enter `UNDER_REVIEW`.
- Provider callbacks are signed, event-ID deduplicated and stored before applying a state transition.

---

# AI Implementation Guide: Online Exit Fee Payment

**Target Path:** Payments > Payment Processing > Online Exit Fee Payment (`leaf-pay-online`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Driver, Staff  
**API:** `POST /api/core/payments/online/exit-fee`

## 1. Summary / Objective
Create/reuse a provider checkout attempt for an existing final exit-fee obligation.
## 2. Scope
Checkout initiation/attempt state; webhook settles it; no fee calculation or manual waiver.
## 3. Actors / Roles / Permissions
Owner Driver for claimed session; assigned Staff may initiate at matching gate with session context.
## 4. Preconditions
Session `EXIT_PENDING_PAYMENT`, final due amount snapshot, unpaid/non-expired obligation.
## 5. Postconditions
One `PROCESSING` payment attempt with provider reference/checkout URL; obligation remains unpaid until verified webhook.
## 6. Main Flow
Authorize/session lock, reuse live matching attempt or create provider request, persist reference then return safe checkout data.
## 7. Alternative Flows
Existing `PAID` returns current settlement; expired attempt creates a new attempt, not new obligation.
## 8. Failure Flows
Wrong state/owner, provider unavailable, stale obligation or duplicate mismatched request returns typed error without changing amount.
## 9. Business Rules
Only provider/reference metadata originates in request; amount/currency/description are server-derived snapshot values.
## 10. API Contracts
`{sessionId,version,returnUrl?}` → `{paymentId,attemptId,status,amount,currency,checkoutUrl,expiresAt}`.
## 11. Data Requirements
Payments, attempts, session version, idempotency/outbox/audit; provider reference unique.
## 12. Validation Rules
UUID/version; allowed HTTPS return URL allow-list; no client amount/provider status.
## 13. Duplicate, Retry and Concurrency Rules
Idempotency key; lock obligation; same live attempt returned for safe retry.
## 14. Security Requirements
Owner/gate scope, provider secrets server-only, checkout URL not logged.
## 15. Logging / Audit / Observability
Audit attempt creation, provider latency/error, pending/expiry age metrics.
## 16. Frontend Behavior
Show pending checkout/status polling; never mark paid from browser redirect alone.
## 17. Edge Cases
Redirect arrives before webhook: UI shows pending/retries Core status; webhook is authoritative.
## 18. Automated Test Cases
Owner/staff scopes; state guard; reuse/retry; provider failure; tampered amount excluded; redirect-before-webhook.
## 19. Acceptance / Done Criteria
One final obligation cannot yield duplicate payable checkout amount.
## 20. Decisions and Assumptions
Provider choice is PayOS as seeded; provider-neutral attempt schema is retained.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: PayOS Webhook

**Target Path:** Payments > Payment Processing > PayOS Webhook (`leaf-pay-webhook`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** System/PayOS  
**API:** `POST /api/core/payments/payos/webhook`

## 1. Summary / Objective
Verify and durably apply provider settlement events.
## 2. Scope
Signature/amount/reference verification, event dedupe and payment/session transition; no browser redirect trust.
## 3. Actors / Roles / Permissions
Provider service identity only; endpoint bypasses user JWT but requires verified signature/IP policy.
## 4. Preconditions
Known provider attempt/reference, configured signing secret and valid event format.
## 5. Postconditions
Event record persisted; matching obligation becomes `PAID` once or discrepancy becomes `UNDER_REVIEW`.
## 6. Main Flow
Verify signature/timestamp, persist provider event idempotently, lock attempt/payment/session, validate amount/currency/status, settle or review, respond acknowledgement.
## 7. Alternative Flows
Duplicate valid event returns acknowledged original outcome; unknown reference is recorded quarantined for reconciliation.
## 8. Failure Flows
Bad signature → 401/403; mismatch/late/cancelled state → review; transient DB failure returns retryable non-2xx only after no event commit.
## 9. Business Rules
Only exact matching successful provider state settles; settlement advances matching exit session to `EXIT_AUTHORIZED` atomically.
## 10. API Contracts
Provider-specified signed body; response minimal `{accepted:true,correlationId}`—never disclose payment/session data.
## 11. Data Requirements
`payment_provider_events(event_id,hash,received_at)`, attempts/payments/session/audit/outbox/review case.
## 12. Validation Rules
Signature, replay timestamp tolerance, event ID/reference, exact VND amount/currency and permitted provider terminal state.
## 13. Duplicate, Retry and Concurrency Rules
Unique event ID/hash plus locked obligation; event retry yields same acknowledgment.
## 14. Security Requirements
Constant-time signature compare, secret vault, raw payload retention redacted/encrypted per policy.
## 15. Logging / Audit / Observability
Log event ID/outcome only; alert signature/mismatch/retry spikes, correlate provider reference.
## 16. Frontend Behavior
None directly; payment status screen consumes Core status projection.
## 17. Edge Cases
Success after cancellation/expiry never reopens booking/session; creates `UNDER_REVIEW` case.
## 18. Automated Test Cases
Valid success; duplicate; invalid signature; amount/reference mismatch; unknown/late event; settlement atomicity; DB retry.
## 19. Acceptance / Done Criteria
Webhook is the sole online settlement authority and is safe under redelivery.
## 20. Decisions and Assumptions
Signature algorithm/header is provider configuration, tested against PayOS sandbox contract.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Cash Payment

**Target Path:** Payments > Payment Processing > Cash Payment (`leaf-pay-cash`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Staff, Manager  
**API:** `POST /api/core/payments/cash`

## 1. Summary / Objective
Record staff-collected cash against one final obligation and authorize exit.
## 2. Scope
Cash settlement/receipt; excludes price calculation, refund and waiver.
## 3. Actors / Roles / Permissions
Assigned Staff; Manager has cross-gate supervisory access where assigned.
## 4. Preconditions
Unpaid `EXIT_PENDING_PAYMENT`/eligible reservation/pass obligation, final due amount, current version.
## 5. Postconditions
One `PAID` cash attempt/receipt; session moves to `EXIT_AUTHORIZED` when applicable.
## 6. Main Flow
Lock obligation, confirm server due, validate tender, persist cash attempt/receipt and settle atomically.
## 7. Alternative Flows
Exact tender has zero change; over-tender records `receivedAmount` and calculated `changeAmount`.
## 8. Failure Flows
Under-tender, already settled, wrong gate/state/stale version fails with no receipt.
## 9. Business Rules
`receivedAmount >= due`; change is server-calculated VND; no negative/partial cash settlement in this release.
## 10. API Contracts
`{paymentId,receivedAmount,version}` → `{receiptNo,status,dueAmount,receivedAmount,changeAmount,settledAt}`.
## 11. Data Requirements
Payment/attempt with method `CASH`, staff/gate, receipt number, session/audit/outbox.
## 12. Validation Rules
Integer VND tender, UUID/version, gate/session relation.
## 13. Duplicate, Retry and Concurrency Rules
Idempotency key/receipt unique; conditional settle prevents double cash collection.
## 14. Security Requirements
Staff RBAC/gate scope; no cash amount in broad logs; receipt view uses authority.
## 15. Logging / Audit / Observability
Audit collector/due/tender/change/receipt; anomaly metric tender variance.
## 16. Frontend Behavior
Large due/tender/change confirmation, one-submit lock, printable receipt after authoritative success.
## 17. Edge Cases
Network response lost after settlement: same idempotency key returns original receipt, not a second charge.
## 18. Automated Test Cases
Exact/over/under tender; duplicate/retry; settled race; gate scope; receipt uniqueness; exit authorization handoff.
## 19. Acceptance / Done Criteria
Cash cannot be recorded twice and calculated change always equals tender minus due.
## 20. Decisions and Assumptions
Partial cash and multi-method split payment are explicitly out of scope.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Waived Payment

**Target Path:** Payments > Payment Processing > Waived Payment (`leaf-pay-waived`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Manager  
**API:** `POST /api/core/payments/waive`

## 1. Summary / Objective
Authorize a zero settlement only through controlled manager approval.
## 2. Scope
Waive final due obligation and exit handoff; no refund, price rule edit or staff self-waiver.
## 3. Actors / Roles / Permissions
Manager; Admin emergency override under ODR-03; Staff cannot waive.
## 4. Preconditions
Current unpaid obligation, active session/reservation, reason and evidence reference, version.
## 5. Postconditions
Payment state `WAIVED`, immutable approval audit and session exit authorization if applicable.
## 6. Main Flow
Validate scope/state/evidence, conditional transition, create waiver attempt, audit/outbox and barrier handoff.
## 7. Alternative Flows
No due/valid monthly entitlement uses `NOT_REQUIRED`, not waiver.
## 8. Failure Flows
Missing evidence/reason, staff actor, already settled/review state or stale version fails.
## 9. Business Rules
Waiver amount equals existing immutable due; no client-selected partial waiver; reason/evidence mandatory.
## 10. API Contracts
`{paymentId,version,reason,evidenceRef}` → `{status:WAIVED,waivedAmount,approvedBy,approvedAt}`.
## 11. Data Requirements
Payment/waiver attempt, actor/evidence reference, session/audit/outbox.
## 12. Validation Rules
Reason 10–500, evidence reference nonempty/authorized, UUID/version.
## 13. Duplicate, Retry and Concurrency Rules
Idempotency and single conditional settlement transition.
## 14. Security Requirements
Manager/Admin RBAC; evidence authorization; no reason text in public view.
## 15. Logging / Audit / Observability
High-signal audit/alert on waiver count/amount and actor.
## 16. Frontend Behavior
No inline staff button; approval modal shows immutable due and requires evidence/reference.
## 17. Edge Cases
Provider success racing waiver produces `UNDER_REVIEW`, never two terminal settlements.
## 18. Automated Test Cases
Manager success; Staff deny; required evidence; settled race; retry; exit handoff; reporting mask.
## 19. Acceptance / Done Criteria
Every waiver is attributable and cannot overwrite an already paid obligation.
## 20. Decisions and Assumptions
ODR-03 manager threshold default applies; exact limits are configuration.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Reservation Payment Reconciliation

**Target Path:** Payments > Payment Reconciliation > Reservation Payment Reconciliation (`leaf-pay-reconcile`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API / System  
**API:** internal scheduled command `reconcile-payment-attempts`

## 1. Summary / Objective
Reconcile stale/unknown reservation payment attempts with provider records safely.
## 2. Scope
Scheduled/provider-query comparison and review generation; no automatic refund/forced confirmation.
## 3. Actors / Roles / Permissions
System worker; managers consume resulting review queue only.
## 4. Preconditions
Attempt is pending/processing beyond configured grace period or has quarantined provider event.
## 5. Postconditions
Attempt becomes `PAID`,`FAILED`,`EXPIRED` only with verified evidence; discrepancy becomes `UNDER_REVIEW`.
## 6. Main Flow
Claim attempts, query provider idempotently, compare reference/amount/status, conditionally apply result or create review case.
## 7. Alternative Flows
Provider unavailable leaves current state/retry schedule untouched.
## 8. Failure Flows
Ambiguous/mismatched data never settles or releases/reconfirms a booking automatically.
## 9. Business Rules
System respects persisted deadline/snapshot; expiry worker and reconciliation lock same attempt/obligation.
## 10. API Contracts
Internal result `{runId,scanned,matched,expired,reviewCreated,retried,failed}`.
## 11. Data Requirements
Attempts/provider query evidence/reconciliation run/review case/audit/outbox.
## 12. Validation Rules
Only provider references created by system; configured bounded batch/retry ages.
## 13. Duplicate, Retry and Concurrency Rules
Attempt lock/version; provider query idempotent; run may repeat without double review case.
## 14. Security Requirements
Service account and provider credentials vault-only.
## 15. Logging / Audit / Observability
Run metrics, discrepancy age and provider-error alerts; evidence redacted.
## 16. Frontend Behavior
None; drivers see resulting status via history/status endpoint.
## 17. Edge Cases
Late valid provider success after local expiry creates review, not resurrection.
## 18. Automated Test Cases
Matched paid/failed, unavailable provider, mismatch, worker overlap, expiry/webhook race, review dedupe.
## 19. Acceptance / Done Criteria
No automated job invents money state when external evidence is incomplete.
## 20. Decisions and Assumptions
Runs on configured schedule/backoff; no hard-coded cadence.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Payment Review / Mismatch Handling

**Target Path:** Payments > Payment Reconciliation > Payment Review / Mismatch Handling (`leaf-pay-review`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Manager, Admin  
**API:** `GET /api/core/payment-reviews`, `GET /api/core/payment-reviews/{id}`, `PATCH /api/core/payment-reviews/{id}/resolve`

## 1. Summary / Objective
Give authorized finance operators a controlled queue to resolve payment discrepancies.
## 2. Scope
Read case/evidence and choose documented resolution; excludes unapproved refund/void.
## 3. Actors / Roles / Permissions
Manager standard resolution; Admin emergency resolution per ODR-03.
## 4. Preconditions
Open `UNDER_REVIEW` case/current version, evidence reference and resolution reason.
## 5. Postconditions
Case becomes `RESOLVED`/`CLOSED` and applies only allowed compensating state/event.
## 6. Main Flow
Filter queue, lock case/payment, review immutable provider/internal evidence, select `CONFIRM_PAID`,`KEEP_FAILED`,`ESCALATE_INCIDENT`, persist audit.
## 7. Alternative Flows
`ESCALATE_INCIDENT` leaves payment unsettled and links incident; no forced exit closure.
## 8. Failure Flows
Stale/closed case, insufficient evidence or unauthorized actor returns typed error.
## 9. Business Rules
No refund/void resolution exists under ODR-01; duplicate case linked to one canonical obligation.
## 10. API Contracts
List filters state/age/source; resolve `{resolution,version,reason,evidenceRef}` → case/payment/session summary.
## 11. Data Requirements
Payment review case, source event/attempt evidence, actor audit, optional incident relation.
## 12. Validation Rules
Resolution enum; reason/evidence required; version required.
## 13. Duplicate, Retry and Concurrency Rules
Idempotency + case/payment conditional lock; same resolution replay safe.
## 14. Security Requirements
Manager/Admin scope; provider payload/PII masked; immutable evidence access control.
## 15. Logging / Audit / Observability
High-signal resolution audit, SLA/queue-age metrics and escalation alerts.
## 16. Frontend Behavior
Evidence timeline, no editable amount, forced reason/evidence, stale conflict refresh.
## 17. Edge Cases
Two reviewers: first conditional resolver wins; second sees resolved case/history.
## 18. Automated Test Cases
Each resolution; permissions; missing evidence; concurrent resolve; linked incident; PII masking/audit.
## 19. Acceptance / Done Criteria
Mismatch resolution is traceable and never performs an undeclared financial reversal.
## 20. Decisions and Assumptions
Resolution set is deliberately narrow until ODR-01 monetary policy is approved.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

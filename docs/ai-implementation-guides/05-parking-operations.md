# Category: Parking Operations / Parking Session Management

**Shared decisions:** SDR-04/05/08/12–19 apply. Core is transaction and gate-command owner. Identity conflicts never silently select one source; they create an incident. `Location / Slot Suggestion` is documented in Parking Configuration but is consumed here as a non-binding read.

## Category-level lifecycle

Entry commits `ACTIVE` only after all identity, allocation and entitlement checks pass. Exit moves an active paid/casual session to `EXIT_PENDING_PAYMENT`, then payment/pass validation moves it to `EXIT_AUTHORIZED`; a trusted passage confirmation moves it to `CLOSED` and releases allocation. A barrier acknowledgement is not passage proof.

---

# AI Implementation Guide: Vehicle Entry

**Target Path:** Parking Operations > Parking Session Management > Vehicle Entry (`leaf-sess-entry`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Staff  
**API:** `POST /api/core/parking-sessions/entry`, `GET /api/core/reservations/{reservationCode}/entry-check`, `GET /api/core/parking-sessions/location-suggestion`

## 1. Summary / Objective
Create one active, auditable session at an entry gate.
## 2. Scope
Validate identity/reservation/pass, allocate location, create session and queue barrier instruction; excludes exit settlement.
## 3. Actors / Roles / Permissions
Staff assigned to active entry gate; System adapter may submit trusted device observation.
## 4. Preconditions
Gate active/entry-capable, staff authorized, plate/card or reservation input present, capacity exists.
## 5. Postconditions
One `ACTIVE` session, occupied allocation/card state and gate-command outbox record; reservation becomes `CLAIMED` when used.
## 6. Main Flow
Normalize scan, validate reservation first then pass then casual identity, lock allocation, persist immutable snapshots/session, queue barrier command.
## 7. Alternative Flows
Reservation check returns eligible/reason before entry; suggestion proposes but entry revalidates chosen location.
## 8. Failure Flows
Duplicate active session, identity mismatch, bad gate, expired/unpaid reservation or no capacity → typed conflict/state error with no barrier command.
## 9. Business Rules
SDR-14 precedence; one active session per effective vehicle/card; `requiresSlot` dictates concrete slot vs area counter.
## 10. API Contracts
Entry `{gateId,plate?,cardCode?,reservationCode?,vehicleTypeId?,locationId?}` → `{sessionId,status,plateMasked,location,reservationId?,monthlyPassCheck,version}`; check endpoint returns eligibility only.
## 11. Data Requirements
Sessions, cards, reservations, pass entitlement snapshot, slots/areas, gate assignment, audit/outbox.
## 12. Validation Rules
Exactly enough identity for lookup; gate UUID/direction; reservation code opaque; selected location compatible/active.
## 13. Duplicate, Retry and Concurrency Rules
Device event/idempotency key unique per gate+scan; lock active session and allocation before insert.
## 14. Security Requirements
Staff gate scope; device credentials never in payload/log; Driver cannot invoke entry command.
## 15. Logging / Audit / Observability
Audit entry actor/inputs masked/result; metrics denied reason, allocation latency, barrier command result.
## 16. Frontend Behavior
Staff scan form freezes after accepted event, shows required resolution for conflict, never opens barrier client-side.
## 17. Edge Cases
Concurrent same plate/card at two gates yields one winner; loser gets `CONFLICT` with safe retry/incident path.
## 18. Automated Test Cases
Reserved/pass/casual entry; invalid gate; identity mismatch; capacity race; duplicate device event; barrier queue; card state.
## 19. Acceptance / Done Criteria
No entry state commits without a uniquely owned allocation and audit trail.
## 20. Decisions and Assumptions
Staff manual plate correction requires evidence and is recorded as source `STAFF`, not replacement of raw scan.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Claim Session by QR

**Target Path:** Parking Operations > Parking Session Management > Claim Session by QR (`leaf-sess-claim`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Driver  
**API:** `POST /api/core/parking-sessions/{qrToken}/claim`

## 1. Summary / Objective
Associate an eligible active anonymous/card session to its Driver once.
## 2. Scope
Ownership claim only; no entry, vehicle creation or reassignment.
## 3. Actors / Roles / Permissions
Active Driver owns claim; token is an opaque one-time bearer reference.
## 4. Preconditions
QR resolves unclaimed `ACTIVE` session, unexpired token and compatible Driver identity/plate policy.
## 5. Postconditions
`driverId`, `claimedByUserId`, `claimedAt`, `claimMethod=CARD_QR` are immutable and audited.
## 6. Main Flow
Hash/lookup QR, validate session/unclaimed/expiry, conditionally claim, revoke QR use, publish session update.
## 7. Alternative Flows
Same owner/replay with same key returns original claim result during replay window.
## 8. Failure Flows
Invalid/expired/used/foreign/mismatched token returns generic `NOT_FOUND`/`STATE_NOT_ALLOWED` without session disclosure.
## 9. Business Rules
Claimed session can never be reassigned; QR lookup public preview, if any, stays mask-only and cannot claim.
## 10. API Contracts
Path token plus `Idempotency-Key`; response `{sessionId,status,claimedAt,plateMasked}`.
## 11. Data Requirements
Session claim columns, hashed QR token/expiry/consumed timestamp, audit/outbox.
## 12. Validation Rules
Token entropy/format server-generated; Driver account active; optional plate confirmation normalized.
## 13. Duplicate, Retry and Concurrency Rules
Atomic `claimed_by_user_id IS NULL` update; key replay applies; different claimant loses.
## 14. Security Requirements
Never store raw token; rate limit path; generic failure prevents token/session enumeration.
## 15. Logging / Audit / Observability
Audit claim/reuse anomaly; metric invalid/expired/claimed attempts with token redacted.
## 16. Frontend Behavior
QR scan launches confirm screen with masked session; success refreshes Driver history; invalid shows generic retry.
## 17. Edge Cases
QR consumed concurrently by same/different Driver produces one immutable claimant.
## 18. Automated Test Cases
Valid claim, already claimed, expiry, wrong driver, same-key replay, token non-leak, concurrent claim.
## 19. Acceptance / Done Criteria
One driver and one session become linked exactly once without public data leakage.
## 20. Decisions and Assumptions
Card QR is a claim token, not proof sufficient to transfer a claimed session.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Monthly Pass Check During Entry Exit

**Target Path:** Parking Operations > Parking Session Management > Monthly Pass Check During Entry Exit (`leaf-mp-validation`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Staff, System  
**API:** `GET /api/core/monthly-passes/check`

## 1. Summary / Objective
Evaluate current entitlement for a gate entry/exit decision.
## 2. Scope
Deterministic eligibility read; no pass modification or gate barrier command.
## 3. Actors / Roles / Permissions
Assigned Staff/System adapter; Driver has no arbitrary lookup endpoint.
## 4. Preconditions
Gate, direction and at least plate/card/session identity supplied.
## 5. Postconditions
No mutation; returns signed/current check result with `asOf`/pass version.
## 6. Main Flow
Resolve active pass by configured plate/card/vehicle scope, validate period/status/location/direction, return allow/deny/reason code.
## 7. Alternative Flows
No pass is a valid `NOT_ELIGIBLE` result for casual paid flow, not an API failure.
## 8. Failure Flows
Conflicting identities/passes → `REQUIRES_INCIDENT`; unavailable authoritative state → retryable service error.
## 9. Business Rules
Only `ACTIVE` unexpired assigned pass allows entitlement; no pass means no fee waiver.
## 10. API Contracts
Query `{gateId,direction,plate?,cardCode?,sessionId?}` → `{eligible,reasonCode,passId?,passVersion?,asOf}`.
## 11. Data Requirements
Core pass/application/card/vehicle/session data and configuration scope.
## 12. Validation Rules
Direction enum, active gate, exactly permitted identity combination, no raw pass secret.
## 13. Duplicate, Retry and Concurrency Rules
Safe read; invoking entry/exit revalidates snapshot under its transaction.
## 14. Security Requirements
Gate scope, card masking and no driver enumeration.
## 15. Logging / Audit / Observability
Decision metrics/reason code; audit only when used in state-changing entry/exit.
## 16. Frontend Behavior
Clear eligible/not-eligible badge and incident path—not a client-side waiver toggle.
## 17. Edge Cases
Pass expiring exactly at current UTC is ineligible; later extension does not change already snapshotted exit calculation.
## 18. Automated Test Cases
Active/expired/suspended, wrong plate/card/gate, conflict, boundary time, session revalidation.
## 19. Acceptance / Done Criteria
No stale/read-only result can by itself grant entry/exit.
## 20. Decisions and Assumptions
Entitlement rules use SDR-17 and are shared by entry and exit.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Vehicle Exit

**Target Path:** Parking Operations > Parking Session Management > Vehicle Exit (`leaf-sess-exit`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Staff  
**API:** `POST /api/core/parking-sessions/{id}/exit`, `GET /api/core/parking-sessions/by-card-code/{cardCode}`, `POST /api/core/parking-sessions/{id}/calculate-fee`, `POST /api/core/parking-sessions/{id}/monthly-pass-exit`

## 1. Summary / Objective
Identify an active session, calculate a final immutable fee or pass entitlement, and authorize—not falsely complete—exit.
## 2. Scope
Session lookup, fee snapshot, pass check, transition to pending/authorized; payment settlement/passage completion have separate guides.
## 3. Actors / Roles / Permissions
Assigned exit-gate Staff; System device adapter only for trusted scan/pass events.
## 4. Preconditions
Active matching session, active exit gate, current session version and valid identity scan.
## 5. Postconditions
Casual session → `EXIT_PENDING_PAYMENT` with final fee; eligible pass/settled obligation → `EXIT_AUTHORIZED`; allocation remains held until passage.
## 6. Main Flow
Lookup card/plate/session, validate gate/identity, calculate rule snapshot once, check pass, create/return payment obligation or queue authorized barrier.
## 7. Alternative Flows
By-card lookup is read-only/masked; repeating calculate fee returns existing final snapshot, never recalculates with new pricing.
## 8. Failure Flows
No/multiple session, identity mismatch, unpaid/failed obligation, pass conflict or stale version returns typed state/incident result.
## 9. Business Rules
Fee uses entry snapshot plus exit-time rule eligibility resolved once; no session closes merely because a barrier opens.
## 10. API Contracts
Exit `{gateId,identity,version}`; calculate returns `{amount,breakdown,pricingSnapshot}`; monthly-pass-exit returns entitlement result; all follow SDR-01.
## 11. Data Requirements
Session entry snapshots, pricing rules/snapshot, payment obligation/attempts, pass check, gate/audit/outbox.
## 12. Validation Rules
Gate direction, identity format, session active/state/version; no client amount/method/waiver field.
## 13. Duplicate, Retry and Concurrency Rules
Device/idempotency key and row version; final fee snapshot protected by conditional write.
## 14. Security Requirements
Staff/gate scope; payment reference masked; no card UID in broad logs.
## 15. Logging / Audit / Observability
Audit terminal-transition requests, fee calculation/reuse, authorization and denied reason; metrics queue age.
## 16. Frontend Behavior
Show exact status path: payment required, pass eligible, or incident; avoid a misleading “exit completed” toast before passage.
## 17. Edge Cases
Fee request and payment start concurrent: first final snapshot wins; all later commands reference it.
## 18. Automated Test Cases
Casual fee; pass authorize; duplicate scan; identity mismatch; price snapshot stability; outstanding payment; stale version.
## 19. Acceptance / Done Criteria
Exit cannot release slot/close session before trusted passage confirmation.
## 20. Decisions and Assumptions
SDR-13 adds `EXIT_AUTHORIZED` to eliminate barrier-as-proof ambiguity.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Exit Passage Confirmation & Barrier Handoff

**Target Path:** Parking Operations > Parking Session Management > Exit Passage Confirmation (**new mandatory supporting feature**)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API / Gate Adapter · **Actors:** System, Staff  
**API:** internal gate command/event; `POST /api/core/parking-sessions/{id}/complete-exit` for authorized Staff fallback

## 1. Summary / Objective
Turn an authorized exit into a verified closed session and release allocation only after passage evidence.
## 2. Scope
Barrier command/ack, trusted passage event or staff fallback confirmation, timeout incident; excludes fee calculation.
## 3. Actors / Roles / Permissions
Gate Adapter service identity; assigned Staff may use fallback with required reason.
## 4. Preconditions
Session `EXIT_AUTHORIZED`; gate is exit-capable and command belongs to this session/version.
## 5. Postconditions
On verified passage: `CLOSED`, exit time, allocation/card release and audit/outbox; otherwise session remains authorized/incident.
## 6. Main Flow
Publish idempotent barrier command, accept signed adapter acknowledgement, await passage event, conditionally close/release.
## 7. Alternative Flows
Staff confirms observed passage with evidence reference when sensor integration is unavailable.
## 8. Failure Flows
Barrier failure/timeout/event mismatch opens `OPEN` incident; it never silently closes/reopens payment.
## 9. Business Rules
Ack ≠ passage; only matching gate/session command version is accepted; timeout duration is configuration.
## 10. API Contracts
Internal command `{commandId,sessionId,gateId,version}`; fallback body `{version,reason,evidenceRef}` returns closed session.
## 11. Data Requirements
Gate commands/acks/events, session version, allocation/card state, incident/audit/outbox.
## 12. Validation Rules
Signed adapter ID, monotonic event time, gate/session match, reason/evidence required for Staff fallback.
## 13. Duplicate, Retry and Concurrency Rules
Command/event IDs unique; conditional close means repeats return existing closure without second release.
## 14. Security Requirements
Mutual adapter auth/signature; Staff scoped to gate; no device secrets in business records.
## 15. Logging / Audit / Observability
Correlate command/ack/passage/session; alert barrier timeout/failure; audit fallback.
## 16. Frontend Behavior
Staff sees “barrier opening / waiting for passage / incident” states and cannot manually close without evidence.
## 17. Edge Cases
Late passage after incident is attached to same case and requires resolution, not automatic second closure.
## 18. Automated Test Cases
Ack+passage close; duplicate event; ack without passage timeout; wrong gate/signature; staff fallback; release once.
## 19. Acceptance / Done Criteria
Financial/session/allocation state remains correct under gate retries and physical failure.
## 20. Decisions and Assumptions
This fills a mandatory handoff missing from the seed's entry/exit endpoints.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

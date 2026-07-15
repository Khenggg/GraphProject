# Category: Developer & Test Utilities

**Shared decisions:** SDR-04/05/13/16/19/21/24 apply. These are not production business capabilities. Every command is disabled in production, requires Admin plus fresh confirmation (Staff is allowed only to run mock scans in a non-production environment), is linked to `testRunId`, and runs the same domain command/event path—not direct table writes.

## Category-level rules

- Environment guard must be server-side and fail closed. Client headers/URL alone cannot enable utilities.
- A mock event carries `simulationId`, source/environment/testRunId and is deduplicated. It may invoke Core validation but cannot bypass it.
- Destructive maintenance can affect only test-data-marked records and produces a before/after audit summary.

---

# AI Implementation Guide: Mock Camera Scan

**Target Path:** Developer & Test Utilities > Mock Camera Scan (`leaf-mock-camera`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API / Test Adapter · **Actors:** Staff, Manager, Admin (non-production)  
**API:** `POST /api/support/mock/camera/scan`

## 1. Summary / Objective
Simulate a camera plate observation and route it through normal entry/incident validation.
## 2. Scope
Create signed simulation observation/call Core integration; no direct session/card/slot mutation.
## 3. Actors / Roles / Permissions
Non-production Staff at test gate; Manager/Admin; server validates environment/testRun scope.
## 4. Preconditions
Utility enabled, valid testRun/test gate, actor role/environment confirmation.
## 5. Postconditions
One auditable simulation event and resulting normal Core command outcome/reference.
## 6. Main Flow
Validate guard, normalize simulated plate/confidence, persist event, invoke same camera adapter path, return correlation/outcome.
## 7. Alternative Flows
Low confidence produces verification/mismatch path; it never auto-enters a vehicle.
## 8. Failure Flows
Production/no test marker/duplicate simulation/invalid gate → forbidden/conflict/validation, no domain mutation.
## 9. Business Rules
Simulation ID is unique; observation source is permanently `MOCK_CAMERA` and cannot masquerade as hardware.
## 10. API Contracts
`{testRunId,gateId,plate,confidence,occurredAt?}` → `{simulationId,correlationId,outcome}`.
## 11. Data Requirements
Simulation event/inbox, test-run marker, correlation to Core result/audit.
## 12. Validation Rules
Non-prod, UUID marker/gate, plate grammar, confidence 0–1, occurredAt bounded near server time.
## 13. Duplicate, Retry and Concurrency Rules
`Idempotency-Key`/simulation ID unique; downstream Core device-event dedupe applies.
## 14. Security Requirements
No production toggle/input bypass; test data separation; no device secrets.
## 15. Logging / Audit / Observability
Audit actor/env/run/input masked/outcome; simulation volume/failure metrics.
## 16. Frontend Behavior
Clearly labeled test console with irreversible environment banner and result correlation link.
## 17. Edge Cases
Camera simulation against non-test target is rejected even if environment is staging.
## 18. Automated Test Cases
Guard, valid scan, low confidence, duplicate, gate/test scope, Core validation equivalence.
## 19. Acceptance / Done Criteria
Mock camera cannot create a session by bypassing Vehicle Entry rules.
## 20. Decisions and Assumptions
Target route normalized under Support ownership; seed route is legacy mapping.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Mock RFID Scan

**Target Path:** Developer & Test Utilities > Mock RFID Scan (`leaf-mock-rfid`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API / Test Adapter · **Actors:** Staff, Manager, Admin (non-production)  
**API:** `POST /api/support/mock/rfid/scan`

## 1. Summary / Objective
Simulate a card/RFID observation through normal card/session rules.
## 2. Scope
Test event generation/adaptation; no inventory/card lifecycle change.
## 3. Actors / Roles / Permissions
Same environment/role guard as Mock Camera Scan.
## 4. Preconditions
Enabled non-prod test run/gate/card test fixture.
## 5. Postconditions
Audited `MOCK_RFID` observation/result correlation only.
## 6. Main Flow
Validate guard, mask/resolve card test UID, persist simulation, invoke standard reader adapter/Core flow.
## 7. Alternative Flows
Unknown/lost/blocked card exercises normal denial/incident path.
## 8. Failure Flows
Production/no marker/duplicate/event-gate mismatch fails without Core state change.
## 9. Business Rules
Raw UID is test fixture scoped/masked; mock never flips card status or assigns pass.
## 10. API Contracts
`{testRunId,gateId,cardCode,occurredAt?}` → `{simulationId,correlationId,outcome}`.
## 11. Data Requirements
Simulation/inbox/test fixture/card lookup correlation/audit.
## 12. Validation Rules
Marker/gate/card format/time window required.
## 13. Duplicate, Retry and Concurrency Rules
Unique simulation/device event identifier; downstream idempotency retained.
## 14. Security Requirements
Environment fail closed; UID redacted in response/log.
## 15. Logging / Audit / Observability
Audit/run/result metrics; no raw UID logging.
## 16. Frontend Behavior
Test-only input, explicit scan source and expected/actual outcome display.
## 17. Edge Cases
Same fixture scan at concurrent gates follows normal active-card/session conflict rules.
## 18. Automated Test Cases
Allowed/blocked card, guard, duplicate, active-session conflict, masking.
## 19. Acceptance / Done Criteria
RFID simulation proves production invariants rather than replacing them.
## 20. Decisions and Assumptions
No reader hardware emulation beyond observation event in this release.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Mock Barrier Control

**Target Path:** Developer & Test Utilities > Mock Barrier Control (`leaf-mock-barrier`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API / Test Adapter · **Actors:** Staff, Manager, Admin (non-production)  
**API:** `POST /api/support/mock/barrier/control`

## 1. Summary / Objective
Simulate barrier acknowledgement/passage events for an already authorized command.
## 2. Scope
Adapter event simulation only; no free-form barrier open/session close.
## 3. Actors / Roles / Permissions
Non-production scoped role/test run.
## 4. Preconditions
Existing matching Core barrier command/session/gate/version or explicit test fixture command.
## 5. Postconditions
Normal barrier/passage handoff receives a mock acknowledgement/event and applies its standard validation.
## 6. Main Flow
Validate command relation, persist mock event, submit through adapter event endpoint, return correlation/outcome.
## 7. Alternative Flows
`ACK`, `PASSAGE`, `FAILURE` simulate distinct stages.
## 8. Failure Flows
Unknown/unauthorized command, direct open request, production environment or duplicate event fails safely.
## 9. Business Rules
`ACK` never closes session; only valid mock `PASSAGE` may exercise Exit Passage Confirmation guide.
## 10. API Contracts
`{testRunId,commandId,eventType,occurredAt?}` → `{simulationId,correlationId,outcome}`.
## 11. Data Requirements
Gate command/event/simulation/test-run/audit records.
## 12. Validation Rules
Event enum, command/gate/session version match, bounded timestamp.
## 13. Duplicate, Retry and Concurrency Rules
Unique event IDs; Core conditional closure protects repeats.
## 14. Security Requirements
No client may name arbitrary production gate/session command.
## 15. Logging / Audit / Observability
Audit command/event/run, mock barrier failure/timeout metric.
## 16. Frontend Behavior
Test panel shows stage sequence and rejects impossible sequence visually.
## 17. Edge Cases
Late passage after simulated timeout follows same incident route as hardware.
## 18. Automated Test Cases
Ack/pass/failure, wrong command/version, duplicate passage, production guard, closure once.
## 19. Acceptance / Done Criteria
Simulation cannot use barrier action as false proof of physical exit.
## 20. Decisions and Assumptions
Uses SDR-13 passage rule exactly.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Clear Reservations Debug

**Target Path:** Developer & Test Utilities > Clear Reservations Debug (`leaf-diag-clear-res`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API / System · **Actors:** Admin (non-production)  
**API:** internal/admin test utility, no public route

## 1. Summary / Objective
Remove only an isolated test run's reservations using domain-safe cancellation/expiry semantics.
## 2. Scope
Scoped test reservation cleanup; never global production deletion or direct table truncate.
## 3. Actors / Roles / Permissions
Admin plus fresh confirmation/non-production guard.
## 4. Preconditions
Valid `testRunId`, all targets test-marked, no linked non-test/active session.
## 5. Postconditions
Eligible reservations terminal/released and a run summary/audit exists.
## 6. Main Flow
Preview target count, require confirmation token, lock each target and invoke permitted cancellation/expiry release path.
## 7. Alternative Flows
Active/claimed records are skipped/reported; Admin resolves them through normal operation/incident path.
## 8. Failure Flows
Production/no marker/non-test relation/partial invalid selection aborts batch with no unreported deletion.
## 9. Business Rules
No hard delete; allocation/payment attempts/history are retained according to lifecycle.
## 10. API Contracts
Internal `{testRunId,confirmationToken,dryRun?}` → `{runId,matched,processed,skipped,failed}`.
## 11. Data Requirements
Test marker, reservation/allocation/payment/audit/run log.
## 12. Validation Rules
UUID marker/confirmation, bounded batch, targets must all be test owned.
## 13. Duplicate, Retry and Concurrency Rules
Run idempotent per target terminal transition; conditional locks avoid double release.
## 14. Security Requirements
Server environment/test marker/fresh confirmation enforce, no arbitrary filters.
## 15. Logging / Audit / Observability
High-priority audit preview/result/skips; alert any guard failure.
## 16. Frontend Behavior
Admin test console previews count and requires typed confirmation; no one-click bulk action.
## 17. Edge Cases
Webhook/event later arrives for cleaned test record and follows reconciliation/audit rather than resurrecting data.
## 18. Automated Test Cases
Dry-run, scoped cleanup, non-test/active reject, concurrency/retry, allocation release, production guard.
## 19. Acceptance / Done Criteria
Test cleanup cannot damage shared/production bookings.
## 20. Decisions and Assumptions
Test-run marker is required by SDR-24 and is a future schema/fixture prerequisite.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Migrate Database Debug

**Target Path:** Developer & Test Utilities > Migrate Database Debug (`leaf-diag-migrate`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** System · **Actors:** Admin (non-production)  
**API:** internal deployment/test migration command, no HTTP production route

## 1. Summary / Objective
Apply approved versioned database migrations to a non-production test environment safely.
## 2. Scope
Preflight/lock/checksum/apply/record approved migrations; excludes arbitrary SQL, rollback and production deployment.
## 3. Actors / Roles / Permissions
Admin triggers only non-prod command with fresh confirmation; deployment identity executes least privilege.
## 4. Preconditions
Guarded environment, validated migration manifest/checksum, backup/restore checkpoint and no competing migration lock.
## 5. Postconditions
All approved migrations applied/recorded or no partial unrecorded operation; run report/audit exists.
## 6. Main Flow
Preflight compatibility/backup, acquire global lock, compare checksums, apply ordered transactional migrations where supported, verify schema/version.
## 7. Alternative Flows
No pending migrations returns successful no-op report.
## 8. Failure Flows
Checksum drift/lock/verification failure stops run, alerts, preserves evidence; no automatic destructive rollback.
## 9. Business Rules
Only repository/manifest migrations accepted; migration history is immutable.
## 10. API Contracts
Internal `{confirmationToken,expectedManifestVersion,dryRun?}` → `{runId,applied,skipped,failed,verifiedVersion}`.
## 11. Data Requirements
Migration history/checksum/lock/run/audit/backup reference.
## 12. Validation Rules
Environment, manifest version, ordered unique migration IDs/checksums.
## 13. Duplicate, Retry and Concurrency Rules
Global advisory lock/history unique; rerun skips already verified migrations.
## 14. Security Requirements
No SQL body input, secrets masked, production guard cannot be overridden by client.
## 15. Logging / Audit / Observability
Run duration/lock/checksum/verification audit and alerts.
## 16. Frontend Behavior
Test console shows dry run/manifest diff/confirmation/results, never direct SQL textbox.
## 17. Edge Cases
Non-transactional migration failure is marked failed and requires operator recovery procedure—not silent retry.
## 18. Automated Test Cases
Dry/no-op/apply, checksum drift, concurrent lock, failure evidence, production guard.
## 19. Acceptance / Done Criteria
Utility cannot mutate unknown schema or production data.
## 20. Decisions and Assumptions
Normal production migrations remain CI/CD responsibility, not this debug capability.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Expire Reservation Debug

**Target Path:** Developer & Test Utilities > Expire Reservation Debug (`leaf-diag-expire-res`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API / System · **Actors:** Admin (non-production)  
**API:** internal scoped trigger for Reservation Expiry worker

## 1. Summary / Objective
Exercise the real reservation-expiry/release logic against marked test data.
## 2. Scope
Targeted worker trigger/dry run; no direct status patch.
## 3. Actors / Roles / Permissions
Admin non-production/fresh confirmation only.
## 4. Preconditions
Test-run-marked target, eligible due state or explicit test clock fixture.
## 5. Postconditions
Same result/event/audit as scheduled expiry worker.
## 6. Main Flow
Validate guard/target, invoke expiry service with test clock/run context, return result correlation.
## 7. Alternative Flows
Dry run returns predicted due targets/no mutation.
## 8. Failure Flows
Non-test/not-due/production/state conflict fails no-op.
## 9. Business Rules
Uses [04-reservations.md](04-reservations.md) expiry contract; cannot override payment/session state.
## 10. API Contracts
Internal `{testRunId,reservationId?,dryRun,confirmationToken}` → worker summary.
## 11. Data Requirements
Test marker/reservation/allocation/payment/audit/outbox.
## 12. Validation Rules
All identifiers test-scoped; no arbitrary date/state input.
## 13. Duplicate, Retry and Concurrency Rules
Delegates to worker idempotency/conditional lock.
## 14. Security Requirements
SDR-21/24 environment/confirmation, no client clock injection.
## 15. Logging / Audit / Observability
Audit trigger/result plus worker correlation metrics.
## 16. Frontend Behavior
Dry-run default, exact target preview, test-only banner.
## 17. Edge Cases
Concurrent scheduled worker returns same final terminal result safely.
## 18. Automated Test Cases
Due/not-due, dry run, test scope, scheduled-worker race, release/audit.
## 19. Acceptance / Done Criteria
Debug trigger proves the production lifecycle rather than a special destructive path.
## 20. Decisions and Assumptions
Test clock is fixture-only, never request supplied.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Expire Payment Deadline Debug

**Target Path:** Developer & Test Utilities > Expire Payment Deadline Debug (`leaf-diag-expire-pay`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API / System · **Actors:** Admin (non-production)  
**API:** internal scoped trigger for payment expiry/reconciliation worker

## 1. Summary / Objective
Exercise real pending-payment expiry/review behavior against marked test obligations.
## 2. Scope
Test worker trigger/dry run only; no force-paid/force-failed mutation.
## 3. Actors / Roles / Permissions
Admin, non-production, fresh confirmation.
## 4. Preconditions
Test-marked pending attempt/obligation whose persisted deadline is due under test clock.
## 5. Postconditions
Same `EXPIRED`/review/release consequences as normal worker, with audit/run correlation.
## 6. Main Flow
Guard/preview, invoke worker with target test run, conditional expiry/reconciliation, return summary.
## 7. Alternative Flows
Webhook test fixture may race to verify review behavior through standard event path.
## 8. Failure Flows
Non-test/not-due/settled/provider-mismatch input does not mutate target.
## 9. Business Rules
Uses SDR-16; a late success goes to review, never force-settles/rewrites deadline.
## 10. API Contracts
Internal `{testRunId,paymentId?,dryRun,confirmationToken}` → `{processed,expired,reviewCreated,skipped}`.
## 11. Data Requirements
Test marker/payment/attempt/session/reservation/review/audit/outbox.
## 12. Validation Rules
Test scoped IDs and eligibility only; no amount/status/date override fields.
## 13. Duplicate, Retry and Concurrency Rules
Delegates to payment worker lock/event dedupe.
## 14. Security Requirements
Environment/test marker/confirmation enforced server-side.
## 15. Logging / Audit / Observability
Run audit and mismatch/late-event test metrics.
## 16. Frontend Behavior
Dry run/result summary, link to test review case only.
## 17. Edge Cases
Exit session remains pending/authorized only according to standard settlement state—debug cannot close it.
## 18. Automated Test Cases
Due/not-due, provider race, review, scoped guard, retry/conditional outcome.
## 19. Acceptance / Done Criteria
Payment deadline scenarios reuse real finance safeguards.
## 20. Decisions and Assumptions
Follows ODR-01 no automatic monetary reversal.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

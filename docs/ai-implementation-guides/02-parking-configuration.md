# Category: Parking Configuration

**Shared decisions:** SDR-01 to SDR-21 in [Shared Decision Register](../shared-decision-register.md) apply. This document covers the configuration dependency before reservations and sessions. `Public Available Slots` is intentionally specified once in `12-public-information.md`; it is the read projection for both taxonomy leaves `leaf-struct-avail` and `leaf-pub-avail`.

## Category-level rules

- `.NET Core API` owns configuration commands; Spring Boot reads a published projection only.
- `MANAGER` performs normal configuration changes and `ADMIN` may recover them, per SDR-12. All mutations use an entity version, reason and audit event.
- A referenced record is deactivated/retired, never hard-deleted. Slot assignment itself belongs to Reservation/Session guides, not configuration CRUD.

---

# AI Implementation Guide: Vehicle Type Management

**Target Path:** Parking Configuration > Vehicle Configuration > Vehicle Type Management (`leaf-vehicle-type`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Manager, Admin  
**API:** `GET/POST /api/core/vehicle-types`, `GET/PUT /api/core/vehicle-types/{id}`

## 1. Summary / Objective
Maintain the active vehicle classes used by allocation and pricing.
## 2. Scope
Create, list, view, update and deactivate vehicle types; not vehicle registration or price rules.
## 3. Actors / Roles / Permissions
Manager/Admin read and mutate; Driver/Guest have no command access.
## 4. Preconditions
Caller is active and has configuration authority; supplied version is current for an update.
## 5. Postconditions
An auditable versioned type is active/deactivated; no existing booking/session snapshot changes.
## 6. Main Flow
Validate code/name/capacity flags, lock the row where relevant, persist, publish `VehicleTypeChanged` after commit.
## 7. Alternative Flows
List is paged/filterable by active status; a deactivate request succeeds only when no active allocation requires the type.
## 8. Failure Flows
Duplicate code → `CONFLICT`; stale version → `CONFLICT`; referenced active type → `STATE_NOT_ALLOWED`.
## 9. Business Rules
`code` is immutable uppercase 2–20 chars; `requiresSlot` is explicit; active type cannot be changed to incompatible allocation semantics while referenced.
## 10. API Contracts
Write body: `{code,name,requiresSlot,displayOrder,version,reason}`; return `{id,...,status,version}` in SDR-01 envelope.
## 11. Data Requirements
`vehicle_types(id,code,name,requires_slot,status,display_order,version,created_at,updated_at)`; price/allocation snapshots retain type ID/code.
## 12. Validation Rules
Name 2–100 trimmed characters; code unique; displayOrder non-negative; reason 10–500 chars on mutation.
## 13. Duplicate, Retry and Concurrency Rules
POST requires `Idempotency-Key`; PUT uses version; identical retry replays stored outcome per SDR-04.
## 14. Security Requirements
RBAC, parameterized queries and no exposure of internal configuration notes to public APIs.
## 15. Logging / Audit / Observability
Audit before/after fields, reason and actor; metric mutation success/conflict count.
## 16. Frontend Behavior
Paged table, active filter, version conflict refresh prompt, deactivate confirmation with dependency explanation.
## 17. Edge Cases
Changing `requiresSlot` is rejected if any active/future reservation, session or pass references the type.
## 18. Automated Test Cases
Create; duplicate code; update with stale version; deactivate referenced/unreferenced type; replay idempotent create; forbidden Driver.
## 19. Acceptance / Done Criteria
All contracts, reference checks, audit and projection event pass integration tests.
## 20. Decisions and Assumptions
SDR-12 applies; type deletion is intentionally unavailable.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION** — no developer policy choice remains.

---

# AI Implementation Guide: Floor Management

**Target Path:** Parking Configuration > Parking Structure Management > Floor Management (`leaf-struct-floor`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Manager, Admin  
**API:** `GET/POST /api/core/floors`, `PUT /api/core/floors/{id}`

## 1. Summary / Objective
Maintain parking-floor reference data and display/order attributes.
## 2. Scope
Create/list/update/deactivate floors; not area/slot allocation.
## 3. Actors / Roles / Permissions
Manager/Admin only; reads used by authenticated configuration screens.
## 4. Preconditions
Unique floor code and current version on update.
## 5. Postconditions
Floor state/order is recorded without altering historical sessions.
## 6. Main Flow
Validate code/name/order, persist versioned floor, publish projection event.
## 7. Alternative Flows
Inactive floors remain visible to authorized historical/configuration views.
## 8. Failure Flows
Duplicate code, stale version or deactivation with active areas/allocations fails safely.
## 9. Business Rules
Floor code is immutable and unique building-wide; only empty/inactive child areas permit deactivation.
## 10. API Contracts
`{code,name,displayOrder,status?,version,reason}`; list supports SDR-03 pagination/sort.
## 11. Data Requirements
`floors(id,code,name,display_order,status,version)`; areas reference floor.
## 12. Validation Rules
Code 1–20 uppercase URL-safe chars; name 2–100; order non-negative; reason required for update/deactivation.
## 13. Duplicate, Retry and Concurrency Rules
Idempotency key for POST; version conditional PUT; atomic child-state dependency check.
## 14. Security Requirements
Manager/Admin RBAC; no public mutation.
## 15. Logging / Audit / Observability
Audit changed fields/reason; count rejected deactivations.
## 16. Frontend Behavior
Show hierarchy count and prevent deactivate button when dependency summary is non-zero.
## 17. Edge Cases
Reordering floors does not change a session/reservation's stored floor snapshot.
## 18. Automated Test Cases
Create, duplicate, stale update, ordered list, deactivation with/without live children, authorization.
## 19. Acceptance / Done Criteria
Hierarchy integrity and version conflicts are exercised end-to-end.
## 20. Decisions and Assumptions
Single building scope is assumed; multi-building would add immutable `buildingId` to every configuration key.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Area Management

**Target Path:** Parking Configuration > Parking Structure Management > Area Management (`leaf-struct-area`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Manager, Admin  
**API:** `GET/POST /api/core/areas`, `PUT /api/core/areas/{id}`

## 1. Summary / Objective
Manage named parking areas within an active floor.
## 2. Scope
Area CRUD/deactivation and capacity metadata; not slot assignment.
## 3. Actors / Roles / Permissions
Manager/Admin mutate; staff reads gate projection only.
## 4. Preconditions
Parent floor is active; area code is unique within that floor.
## 5. Postconditions
Area version changes are published; existing allocations retain their snapshots.
## 6. Main Flow
Validate parent, code/type/capacity, persist atomically and publish.
## 7. Alternative Flows
For `requiresSlot=false` vehicle types, area capacity may be used; otherwise concrete slots are required.
## 8. Failure Flows
Inactive parent, duplicate key, stale version or unsafe capacity reduction returns a typed error.
## 9. Business Rules
Capacity cannot fall below active non-slot occupancy; area deactivation requires no active child slot/allocation.
## 10. API Contracts
`{floorId,code,name,capacity,allowedVehicleTypeIds,status?,version,reason}`; response exposes calculated safe capacity.
## 11. Data Requirements
`areas` references `floors`; allowed-type relation/version is auditable; sessions store area snapshot.
## 12. Validation Rules
Capacity integer ≥0; at least one allowed vehicle type; code/name normalized.
## 13. Duplicate, Retry and Concurrency Rules
POST idempotent; PUT conditional on area version and capacity counter version.
## 14. Security Requirements
Validate parent access and use server-side IDs only.
## 15. Logging / Audit / Observability
Audit capacity/allowed-type changes; alert unsafe capacity rejection spikes.
## 16. Frontend Behavior
Floor picker loads active floors; display live allocated/capacity counts read-only.
## 17. Edge Cases
Removing an allowed type is blocked while it has an active/future allocation in the area.
## 18. Automated Test Cases
Inactive parent; duplicate code; unsafe capacity decrease; type removal conflict; idempotent retry.
## 19. Acceptance / Done Criteria
Capacity and parent integrity rules pass transaction tests.
## 20. Decisions and Assumptions
Non-slot capacity is tracked atomically per area under SDR-13.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Slot Management

**Target Path:** Parking Configuration > Parking Structure Management > Slot Management (`leaf-struct-slot`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Manager, Admin  
**API:** `GET/POST /api/core/slots`, `PATCH /api/core/slots/{id}/status`

## 1. Summary / Objective
Maintain addressable physical slots and safe maintenance status.
## 2. Scope
Create/list slot and move an empty slot between `AVAILABLE`/`OUT_OF_SERVICE`; allocation is excluded.
## 3. Actors / Roles / Permissions
Manager/Admin only for writes; staff sees suitable slots through read models.
## 4. Preconditions
Parent area/floor active; slot code unique in building; current version supplied.
## 5. Postconditions
Slot is configured or safely taken out/in service; historical allocation unchanged.
## 6. Main Flow
Validate parent/code/types/status, conditionally write, then publish change event.
## 7. Alternative Flows
`GET` filters by area, type compatibility and status; unavailable slots are visible only to authorized operations users.
## 8. Failure Flows
Attempt to set `RESERVED`/`OCCUPIED`, service an allocated slot, or stale version fails.
## 9. Business Rules
Only Reservation/Session set `RESERVED`/`OCCUPIED`; one slot may have one active allocation; type compatibility is explicit.
## 10. API Contracts
Create `{areaId,code,allowedVehicleTypeIds,version,reason}`; status patch `{status,version,reason}`.
## 11. Data Requirements
`slots(id,area_id,code,status,version)` plus allowed-type relation; reservation/session references slot.
## 12. Validation Rules
Code 1–30 normalized; status limited to SDR-12; allowed type set non-empty.
## 13. Duplicate, Retry and Concurrency Rules
POST idempotent; patch uses row version and allocation lock/check in one transaction.
## 14. Security Requirements
No client-supplied occupancy state; audit mandatory.
## 15. Logging / Audit / Observability
Log transition/reason and allocation count; monitor time in `OUT_OF_SERVICE`.
## 16. Frontend Behavior
Status badges, maintenance confirmation and a disabled action with current allocation reason.
## 17. Edge Cases
Restore from `OUT_OF_SERVICE` yields `AVAILABLE` only—never inferred reservation/session state.
## 18. Automated Test Cases
Create duplicate; set OUT_OF_SERVICE idle/allocated; attempt forbidden occupancy state; stale patch; type mismatch.
## 19. Acceptance / Done Criteria
No configuration command can corrupt active allocation state.
## 20. Decisions and Assumptions
SDR-12 state list and SDR-13 allocation exclusivity apply.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Gate Read Model

**Target Path:** Parking Configuration > Parking Structure Management > Gate Read Model (`leaf-struct-gate`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Staff, Manager, Admin  
**API:** `GET /api/support/gates`, `GET /api/support/gates/{id}`

## 1. Summary / Objective
Expose a current, non-command view of configured gates for operational screens.
## 2. Scope
Read projection, gate health summary and allowed direction; no gate configuration or barrier command.
## 3. Actors / Roles / Permissions
Staff reads assigned operating gates; Manager/Admin all gates.
## 4. Preconditions
JWT valid; projection has received Core configuration events.
## 5. Postconditions
No Core data mutates; response includes projection `asOf` timestamp.
## 6. Main Flow
Authorize, apply row scope, query projection and return gate ID/name/direction/active/health summary.
## 7. Alternative Flows
Projection lag returns last known result with `asOf`, never invents availability.
## 8. Failure Flows
Missing gate → `NOT_FOUND`; forbidden gate → `FORBIDDEN`; stale/unavailable projection → `EXTERNAL_SERVICE_UNAVAILABLE` with retry advice.
## 9. Business Rules
Gate direction is `ENTRY`, `EXIT` or `BIDIRECTIONAL`; this model cannot decide entry/exit or open a barrier.
## 10. API Contracts
List supports SDR-03; data excludes device credentials/addresses and includes `asOf`.
## 11. Data Requirements
Support projection keyed by Core `gateId`, configuration version and last-health observation.
## 12. Validation Rules
Filter values are enumerated; no arbitrary device query input.
## 13. Duplicate, Retry and Concurrency Rules
GET is safe; consumer deduplicates events by event ID/version.
## 14. Security Requirements
Role/assigned-gate filter; device diagnostics redacted.
## 15. Logging / Audit / Observability
Log access only; observe projection lag/health freshness.
## 16. Frontend Behavior
Read-only gate selector shows stale indicator and disables operations if inactive.
## 17. Edge Cases
Deleted/retired Core gate remains historical only, not selectable.
## 18. Automated Test Cases
Row scope, event ordering, stale projection, inactive gate, secret-field exclusion.
## 19. Acceptance / Done Criteria
Read model never writes Core-owned configuration.
## 20. Decisions and Assumptions
This fills the missing endpoint in the seed; Core publishes `GateChanged` through SDR-19 outbox.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Location / Slot Suggestion

**Target Path:** Parking Configuration > Parking Structure Management > Location / Slot Suggestion (`leaf-struct-suggest`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Staff, Manager, Driver  
**API:** `POST /api/core/parking-sessions/suggest-slot`

## 1. Summary / Objective
Return ranked eligible locations for a proposed session/reservation without allocating one.
## 2. Scope
Eligibility/ranking explanation; no reservation/session creation and no slot lock retained.
## 3. Actors / Roles / Permissions
Staff/Manager may suggest for an operational context; Driver only for own proposed booking context.
## 4. Preconditions
Vehicle type, desired time and valid active configuration supplied.
## 5. Postconditions
Candidate list with a calculation timestamp; no state mutation.
## 6. Main Flow
Filter active compatible capacity, exclude unavailable allocations, rank by configured display order then lowest occupancy, return candidates.
## 7. Alternative Flows
Non-slot types return areas with remaining capacity; slot-required types return concrete slots.
## 8. Failure Flows
No capacity returns `items:[]`; invalid type/time → `VALIDATION_FAILED`; unauthorized ownership → `FORBIDDEN`.
## 9. Business Rules
Suggestion is advisory only and never promises availability; allocation is revalidated by Create Reservation/Vehicle Entry.
## 10. API Contracts
Body `{vehicleTypeId,startsAt?,endsAt?,gateId?,reservationContextId?}`; response `{candidates,asOf,rankingPolicyVersion}`.
## 11. Data Requirements
Reads vehicle type, active floor/area/slot, reservations/sessions and atomic capacity counters.
## 12. Validation Rules
UTC time interval valid/max 24h look-ahead; IDs UUID; context owner checked server-side.
## 13. Duplicate, Retry and Concurrency Rules
Safe read; `asOf` does not lock. Follow-up command rechecks state under SDR-13.
## 14. Security Requirements
Driver cannot enumerate occupied plates/session IDs; return only permitted candidate fields.
## 15. Logging / Audit / Observability
Metric query/no-capacity/latency; do not audit normal reads.
## 16. Frontend Behavior
Show “availability may change” and require fresh selection on submission conflict.
## 17. Edge Cases
When snapshot changes during calculation, return an `asOf` result; no retry loop pins capacity.
## 18. Automated Test Cases
Compatible ranking; non-slot capacity; no candidates; ownership scope; allocation race follow-up.
## 19. Acceptance / Done Criteria
Suggestion cannot reserve/occupy a location and has deterministic tie-breakers.
## 20. Decisions and Assumptions
Ranking defaults to configured order then lowest occupancy; later product weighting is a versioned policy, not code behavior.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Parking Card CRUD

**Target Path:** Parking Configuration > Card & RFID Management > Parking Card CRUD (`leaf-card-crud`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Manager, Admin  
**API:** `GET/POST /api/core/cards`, `GET/PUT /api/core/cards/{id}`, `PATCH /api/core/cards/{id}/status`

## 1. Summary / Objective
Manage physical RFID/card inventory and its safe lifecycle.
## 2. Scope
Create, list, view, update label and change lifecycle status; assignment/use is handled by pass/session workflows.
## 3. Actors / Roles / Permissions
Manager/Admin mutate; Staff may read only operational card lookup through its own guide.
## 4. Preconditions
Card UID is normalized and unique; version/reason supplied for mutation.
## 5. Postconditions
Inventory card has an immutable UID and auditable lifecycle state.
## 6. Main Flow
Validate UID/label/status, persist conditionally, publish card projection event.
## 7. Alternative Flows
Lost/blocked card may be replaced by a Monthly Pass/Incident command, not direct reassignment.
## 8. Failure Flows
Duplicate UID, illegal transition, active use/assignment or stale version fail without side effects.
## 9. Business Rules
States: `AVAILABLE`, `ASSIGNED`, `IN_USE`, `LOST`, `BLOCKED`, `RETIRED`; no hard delete; `IN_USE` cannot be blocked/retired by CRUD.
## 10. API Contracts
Create `{rfidUid,label}`; update `{label,version,reason}`; status `{status,version,reason}` under SDR-01.
## 11. Data Requirements
`parking_cards(id,rfid_uid,label,status,version)`; pass/session links retain card ID and UID snapshot.
## 12. Validation Rules
UID 4–128 uppercase hexadecimal/approved reader alphabet; label max 100; reason required for state changes.
## 13. Duplicate, Retry and Concurrency Rules
Idempotent create; conditional status transition; card UID unique constraint.
## 14. Security Requirements
UID is operationally sensitive: no public exposure and no device-secret storage in this entity.
## 15. Logging / Audit / Observability
Audit state changes, lost/blocked attempts and actor/reason; monitor unassigned inventory.
## 16. Frontend Behavior
Inventory list masks UID except last four characters until privileged detail view; transition confirmation states dependencies.
## 17. Edge Cases
Reader duplicate scan is a session event, not a second card record.
## 18. Automated Test Cases
Duplicate UID; legal/illegal transitions; active-use block; idempotent creation; UID masking; stale version.
## 19. Acceptance / Done Criteria
Card lifecycle preserves session/pass history and cannot bypass incident controls.
## 20. Decisions and Assumptions
SDR-12/14/18 apply; card assignment is intentionally excluded from generic CRUD.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

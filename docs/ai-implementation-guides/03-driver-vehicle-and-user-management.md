# Category: Driver Vehicle and User Management

**Dependency order note:** Driver-vehicle lifecycle is documented before Reservation because it is an eligibility input. Internal user management follows it here because its role/status safeguards are independent of configuration but must be fixed before operational authority is implemented.

## Category-level rules

- Core owns user and driver-vehicle commands; Support exposes history projection only.
- SDR-07, SDR-08 and SDR-22 apply. User/password, role and status are separate commands; no generic update can change them.
- `ADMIN` is the sole internal-user administrator. A Driver can only read/mutate their own vehicle records.

---

# AI Implementation Guide: Driver Vehicle Registration & Maintenance

**Target Path:** User & Driver Management > Driver Self-Service > Driver Vehicle Registration & Maintenance (**new mandatory supporting feature**)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Driver  
**API:** `POST /api/core/driver/vehicles`, `PUT /api/core/driver/vehicles/{id}`, `PATCH /api/core/driver/vehicles/{id}/status`

## 1. Summary / Objective
Allow an active Driver to create and safely maintain the registered vehicle needed by reservations and monthly passes.
## 2. Scope
Create, list-linked update and deactivate own vehicle; no visitor vehicle, ownership transfer or historical rewrite.
## 3. Actors / Roles / Permissions
Only `DRIVER`; ownership is always `sub` from JWT, never a body `driverId`.
## 4. Preconditions
Active Driver profile and an active configured vehicle type.
## 5. Postconditions
A versioned vehicle is active/inactive and can be referenced by later commands.
## 6. Main Flow
Normalize plate, validate type/duplicate, persist with authenticated owner, audit and publish `DriverVehicleChanged` after commit.
## 7. Alternative Flows
An unreferenced vehicle may update nickname; a referenced vehicle can only deactivate when it has no active reservation/session/pass.
## 8. Failure Flows
Visitor/non-driver → `FORBIDDEN`; duplicate own/global plate → `CONFLICT`; referenced plate/type edit → `STATE_NOT_ALLOWED`.
## 9. Business Rules
SDR-22 governs immutable plate/type, no transfer and no visitor-owned record.
## 10. API Contracts
Create `{plate,vehicleTypeId,nickname?}`; update `{nickname,version}`; status `{status,version,reason}`; list endpoint is the next guide.
## 11. Data Requirements
`vehicles(id,driver_id,plate_normalized,vehicle_type_id,nickname,status,version)`; reservations/sessions store immutable plate/type snapshots.
## 12. Validation Rules
Plate uses one documented Vietnamese plate normalization grammar, 5–20 chars after normalization; nickname max 100; UUID type.
## 13. Duplicate, Retry and Concurrency Rules
Create needs `Idempotency-Key` and unique normalized plate constraint; all mutations use version.
## 14. Security Requirements
Ownership query must include `driver_id`; no cross-driver existence leakage in conflicts.
## 15. Logging / Audit / Observability
Audit creation/change/deactivation; no plate in broad application logs—mask except privileged audit.
## 16. Frontend Behavior
Vehicle form shows normalized preview, disables mutation during submit and explains active-reference block.
## 17. Edge Cases
Same plate submitted concurrently returns one creation and one replay/conflict, never two vehicles.
## 18. Automated Test Cases
Valid create; normalization duplicate; driver ownership; referenced edit/deactivate; visitor rejection; idempotency replay.
## 19. Acceptance / Done Criteria
Reservation/Pass commands can depend on a stable owned active vehicle identity.
## 20. Decisions and Assumptions
This is added because the seed only listed vehicles but lacked the mandatory lifecycle command.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Driver Registered Vehicles

**Target Path:** User & Driver Management > Driver Self-Service > Driver Registered Vehicles (`leaf-driver-vehicles-list`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Driver  
**API:** `GET /api/core/driver/vehicles`

## 1. Summary / Objective
List the authenticated driver's registered vehicles for booking/pass selection.
## 2. Scope
Read own active/inactive vehicles; not history or cross-driver lookup.
## 3. Actors / Roles / Permissions
`DRIVER` only; user identity comes from JWT.
## 4. Preconditions
Valid active Driver session.
## 5. Postconditions
No state mutation; response is an SDR-03 paged own-record list.
## 6. Main Flow
Filter by authenticated owner, optional `status`, sort stable by updated time then ID.
## 7. Alternative Flows
Empty list returns 200/empty items and directs UI to the maintenance flow.
## 8. Failure Flows
No token/inactive account → `UNAUTHENTICATED`; non-driver → `FORBIDDEN`.
## 9. Business Rules
Only `ACTIVE` vehicles are selectable for new booking/pass applications; inactive remain history-visible.
## 10. API Contracts
Returns `{id,plateMasked,vehicleTypeId,vehicleTypeName,nickname,status,version,updatedAt}`; no owner/contact data.
## 11. Data Requirements
Core `vehicles` plus current type read model; query indexed by `(driver_id,status)`.
## 12. Validation Rules
`status` enum, page/pageSize per SDR-03.
## 13. Duplicate, Retry and Concurrency Rules
Safe GET; returned version is used by follow-up mutation.
## 14. Security Requirements
No `driverId` path/query parameter; plate is masked by default.
## 15. Logging / Audit / Observability
Access telemetry only; do not audit normal list reads.
## 16. Frontend Behavior
Selectable active cards; inactive label; empty/error/retry state per SDR-10.
## 17. Edge Cases
Vehicle deactivated between list and selection causes next command to return `STATE_NOT_ALLOWED`.
## 18. Automated Test Cases
Own-only filtering; zero list; inactive visibility; token/role failures; plate masking.
## 19. Acceptance / Done Criteria
Driver never sees another driver's vehicle or raw plate more broadly than permitted.
## 20. Decisions and Assumptions
Default view masks plate except to the owning driver after explicit reveal.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Driver Vehicle Entry Exit History

**Target Path:** User & Driver Management > Driver Self-Service > Driver Vehicle Entry Exit History (`leaf-driver-vehicle-history`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Driver  
**API:** `GET /api/support/driver/vehicles/entry-exit-history`

## 1. Summary / Objective
Show an immutable, driver-owned projection of historical entry/exit sessions.
## 2. Scope
Paged history/filter/detail summary; no session/payment mutation.
## 3. Actors / Roles / Permissions
Driver sees only sessions resolved to own vehicle/claimed session; Staff/Manager use separate operations reports.
## 4. Preconditions
Authenticated active Driver; Support projection available.
## 5. Postconditions
No Core mutation; response includes projection `asOf`.
## 6. Main Flow
Apply owner filter first, then date/status/vehicle filters and stable descending close/entry order.
## 7. Alternative Flows
Open sessions appear as `ACTIVE` with no exit/fee final value.
## 8. Failure Flows
Invalid date range → `VALIDATION_FAILED`; stale projection returns last known `asOf`, not fabricated data.
## 9. Business Rules
History shows session plate/type snapshot, timestamps, location summary and settlement status—not card UID, staff notes or raw payment reference.
## 10. API Contracts
Query `vehicleId?,from?,to?,status?,page,pageSize`; item `{sessionId,vehicleId?,plateMasked,enteredAt,exitedAt?,status,locationSummary,amountDue?,settlementStatus}`.
## 11. Data Requirements
Support projection consumes Core session/payment events and retains owner mapping at event time.
## 12. Validation Rules
UTC range max 365 days; supplied vehicle must belong to caller; enums only.
## 13. Duplicate, Retry and Concurrency Rules
Safe GET; event consumer is idempotent and monotonically updates session version.
## 14. Security Requirements
Row-level owner enforcement; mask plate and omit card/other-driver fields.
## 15. Logging / Audit / Observability
Measure projection lag/query latency; access log excludes filter values containing plates.
## 16. Frontend Behavior
Date filter, pagination, `asOf`/stale label, empty history and retryable error state.
## 17. Edge Cases
Vehicle later deactivated remains represented by historical snapshot.
## 18. Automated Test Cases
Ownership isolation; open/closed session display; invalid range; event dedupe/order; PII masking.
## 19. Acceptance / Done Criteria
Projection never provides a command path or cross-driver history.
## 20. Decisions and Assumptions
Retention follows organization policy; guide only requires a documented retention configuration.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: User Listing & Detail

**Target Path:** User & Driver Management > User Management > User Listing & Detail (`leaf-user-list-detail`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Admin  
**API:** `GET /api/core/users`, `GET /api/core/users/{id}`

## 1. Summary / Objective
Allow an Admin to find and inspect users without exposing credentials.
## 2. Scope
Paginated keyword/role/status list and user detail; no mutation/password/profile management.
## 3. Actors / Roles / Permissions
`ADMIN` only; all other roles denied.
## 4. Preconditions
Active Admin JWT.
## 5. Postconditions
Read-only PII-minimized response with no password hash/token/refresh-session data.
## 6. Main Flow
Authorize, filter exact allowed fields, paginate/sort with stable default.
## 7. Alternative Flows
Detail may include Driver profile summary but not vehicle/session history.
## 8. Failure Flows
Unknown ID → `NOT_FOUND`; invalid filters → `VALIDATION_FAILED`; non-admin → `FORBIDDEN`.
## 9. Business Rules
Search matches normalized username/full name/email/phone; `DELETED` is returned only when explicit status filter requests it.
## 10. API Contracts
List query `keyword?,role?,status?,page,pageSize,sort`; detail `{id,username,fullName,email?,phone?,roles,status,createdAt,updatedAt,version}`.
## 11. Data Requirements
Core `users`, role/profile read relation; indexes on normalized searchable fields.
## 12. Validation Rules
Keyword ≤100; roles/status are SDR enums; pagination SDR-03.
## 13. Duplicate, Retry and Concurrency Rules
Safe GET; detail returns version for management commands.
## 14. Security Requirements
Admin RBAC and field allow-list; no hashes, login attempts, token family or audit evidence in response.
## 15. Logging / Audit / Observability
Privileged access audit with filter category, not raw PII; paginate query metrics.
## 16. Frontend Behavior
Server-side filter/table; mask phone/email in list where not needed; forbidden state is not retried.
## 17. Edge Cases
Role/status changed during paging may move item between pages; response uses `asOf`/stable sort.
## 18. Automated Test Cases
All role visibility; Driver detail; password omission; search/filter; not-found/forbidden; paging limits.
## 19. Acceptance / Done Criteria
Admin-only lookup is read-only and uses SDR envelope/paging.
## 20. Decisions and Assumptions
Multi-role array is returned even if current seed UI displays one primary role.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Internal User Creation

**Target Path:** User & Driver Management > User Management > Internal User Creation (`leaf-user-create`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Admin  
**API:** `POST /api/core/users`

## 1. Summary / Objective
Create an active internal `ADMIN`, `MANAGER` or `STAFF` account.
## 2. Scope
Create identity, role and secure password hash; not Driver signup/reset/invitation.
## 3. Actors / Roles / Permissions
`ADMIN` only.
## 4. Preconditions
Caller active Admin; unique normalized identity values; chosen internal role.
## 5. Postconditions
One atomic user/role record and `USER_CREATED` audit event; password never returned.
## 6. Main Flow
Normalize/validate fields, hash password with BCrypt/approved adaptive algorithm, transactionally insert user+role, audit.
## 7. Alternative Flows
Email/phone optional; first login follows standard Sign In without automatic reset flow.
## 8. Failure Flows
Duplicate username/email/phone → `CONFLICT`; `DRIVER` role → `VALIDATION_FAILED`; insert race is mapped safely.
## 9. Business Rules
Username/email are case-insensitive unique; role restricted to `ADMIN`,`MANAGER`,`STAFF`; initial state `ACTIVE`.
## 10. API Contracts
`{fullName,username,email?,phone?,password,role}` → 201 user summary/version; `Idempotency-Key` required.
## 11. Data Requirements
`users`, `user_roles`, normalized unique indexes and audit event; password hash only.
## 12. Validation Rules
Full name 2–150; username lowercase `[a-z0-9._-]{3,100}`; valid email; normalized VN phone; password ≥8 with upper/lower/digit.
## 13. Duplicate, Retry and Concurrency Rules
Fingerprint/replay per SDR-04 plus DB constraints as final race protection.
## 14. Security Requirements
Hash secret; no password/hash in logs/responses; Admin RBAC and CSRF/session protections where applicable.
## 15. Logging / Audit / Observability
Audit actor/new user/role/outcome; sensitive request fields redacted.
## 16. Frontend Behavior
Modal field errors, role options limited to internal roles, one-submit lock and success refresh.
## 17. Edge Cases
Creating an Admin is allowed but must not create a duplicate bootstrap account; identity uniqueness is global.
## 18. Automated Test Cases
Each allowed role; rejected Driver; normalization; all duplicates/race; hash absent; idempotent replay/forbidden caller.
## 19. Acceptance / Done Criteria
Only secure internal accounts can be created and login works with the initial password.
## 20. Decisions and Assumptions
No invite/activation email is introduced; initial `ACTIVE` follows the existing feature intent.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: User Profile Update

**Target Path:** User & Driver Management > User Management > User Profile Update (`leaf-user-update`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Admin  
**API:** `PUT /api/core/users/{id}`

## 1. Summary / Objective
Update allowed basic identity profile fields for a selected user.
## 2. Scope
`fullName`, `email`, `phone` only; excludes username/password/role/status/profile/vehicle.
## 3. Actors / Roles / Permissions
`ADMIN` only.
## 4. Preconditions
Target exists and request carries current version.
## 5. Postconditions
Allowed fields are atomically normalized/saved; other security fields stay unchanged.
## 6. Main Flow
Authorize, validate allow-list/uniqueness, conditional update, audit and return summary.
## 7. Alternative Flows
Same normalized email/phone on the current target is valid no-op/update.
## 8. Failure Flows
Other-user duplicate → `CONFLICT`; missing target → `NOT_FOUND`; stale version → `CONFLICT`.
## 9. Business Rules
Role/status/password/username fields are rejected rather than silently ignored; identity normalization matches creation.
## 10. API Contracts
`{fullName,email?,phone?,version,reason}` → current user summary and new version.
## 11. Data Requirements
`users` normalized columns and unique indexes; audit before/after excludes password.
## 12. Validation Rules
Same field rules as creation; reason 10–500 chars.
## 13. Duplicate, Retry and Concurrency Rules
`Idempotency-Key` plus conditional version; identical replay returns original response.
## 14. Security Requirements
Admin RBAC; strict DTO prevents mass assignment.
## 15. Logging / Audit / Observability
`USER_UPDATED` with changed field names/value redaction as needed.
## 16. Frontend Behavior
Editable profile fields only; version conflict gives refresh/compare prompt.
## 17. Edge Cases
Concurrent status/role change does not get overwritten because this command updates only allow-listed columns/version.
## 18. Automated Test Cases
Allowed field update; rejected extra security fields; normalization; duplicate/current-value behavior; stale version; audit.
## 19. Acceptance / Done Criteria
No profile request can alter authorization or credentials.
## 20. Decisions and Assumptions
Admin may edit any user basic profile; self-service profile editing is not a leaf in this taxonomy.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: User Status Management

**Target Path:** User & Driver Management > User Management > User Status Management (`leaf-user-status`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Admin  
**API:** `PATCH /api/core/users/{id}/status`

## 1. Summary / Objective
Safely change account status with immediate access consequences.
## 2. Scope
Transition `ACTIVE`,`INACTIVE`,`LOCKED`,`DISABLED`; excludes role/password/delete.
## 3. Actors / Roles / Permissions
`ADMIN` only.
## 4. Preconditions
Target/current version exist; non-empty reason; caller/last-admin protections pass.
## 5. Postconditions
State/audit updated atomically; non-active sessions are revoked/blocked under SDR-07.
## 6. Main Flow
Validate allowed transition/protections, conditionally update, revoke active token family if leaving ACTIVE, audit.
## 7. Alternative Flows
Returning to ACTIVE does not restore a revoked session; user signs in again.
## 8. Failure Flows
Self-disable/lock, last-active-Admin disable/lock, stale version → `CONFLICT`.
## 9. Business Rules
`DELETED` is set only through future dedicated retention command; this feature cannot set it. Non-active never uses protected APIs.
## 10. API Contracts
`{status,version,reason}` → `{oldStatus,newStatus,updatedAt,version}`.
## 11. Data Requirements
`users.status/version`, refresh-session revocations and audit log commit as one business operation.
## 12. Validation Rules
Status enum; reason 10–500; version required.
## 13. Duplicate, Retry and Concurrency Rules
Idempotent conditional command; last-active-admin query/lock is transactionally protected.
## 14. Security Requirements
Admin RBAC; status effects cannot be bypassed by a still-valid JWT.
## 15. Logging / Audit / Observability
`USER_STATUS_CHANGED`, revoked-session count and protected-action rejections.
## 16. Frontend Behavior
Required reason, exact status consequences, disabled action for caller/last Admin.
## 17. Edge Cases
Concurrent admin commands serialize; only one may leave the final active Admin state.
## 18. Automated Test Cases
Each transition; own/last-admin protection; session revocation; idempotent replay; stale conflict; authorization.
## 19. Acceptance / Done Criteria
Account state and token validity are consistent on both Core and Support validation path.
## 20. Decisions and Assumptions
`DISABLED` is included from SDR-07 even though original leaf named only three statuses.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: User Role Management

**Target Path:** User & Driver Management > User Management > User Role Management (`leaf-user-role`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Admin  
**API:** `PATCH /api/core/users/{id}/role`

## 1. Summary / Objective
Change an internal account's operational role safely.
## 2. Scope
Set exactly one internal role `ADMIN`,`MANAGER`,`STAFF`; excludes Driver conversion/RBAC matrix management.
## 3. Actors / Roles / Permissions
`ADMIN` only.
## 4. Preconditions
Target/current version exists; required reason; self/last-admin protections pass.
## 5. Postconditions
Role, role claim version and audit are updated; old session is revoked so claims cannot persist.
## 6. Main Flow
Validate role/target, conditionally replace role, invalidate sessions, write audit, publish identity event.
## 7. Alternative Flows
No-op same-role request returns existing result only with same idempotency fingerprint.
## 8. Failure Flows
`DRIVER` request → `VALIDATION_FAILED`; self-demotion/last Admin demotion/stale version → `CONFLICT`.
## 9. Business Rules
This feature cannot convert a Driver into internal staff or vice versa; that needs a separate approved identity migration.
## 10. API Contracts
`{role,version,reason}` → `{oldRole,newRole,version,updatedAt}`.
## 11. Data Requirements
`user_roles`/role version, active session revocation, audit outbox event.
## 12. Validation Rules
Role is allowed enum; reason 10–500; target active state may be any but inactive user cannot use new role until reactivated.
## 13. Duplicate, Retry and Concurrency Rules
Idempotency + target/last-admin conditional transaction.
## 14. Security Requirements
Admin only; token refresh must re-read account/role state.
## 15. Logging / Audit / Observability
`USER_ROLE_CHANGED`, prior/new role, reason, session revocation count.
## 16. Frontend Behavior
Required reason/select, warnings for admin demotion, refresh list after success.
## 17. Edge Cases
Concurrent status and role commands preserve both changes through versions/field-scoped updates.
## 18. Automated Test Cases
Allowed changes; Driver reject; own/last-admin protection; claims invalidated; stale/replay; audit.
## 19. Acceptance / Done Criteria
No old-role token can continue privileged action after the command commits.
## 20. Decisions and Assumptions
Single primary role is the current taxonomy default; future multi-role needs a new guide.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

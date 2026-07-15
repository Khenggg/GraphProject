# Parking Building Management System — Feature Readiness Review

**Scope:** Review of the current feature seed after taxonomy migration. This is a BA/solution-architecture review only; it does not authorize implementation code.

**Evidence reviewed:** 109 nodes (1 project, 14 categories, 23 feature groups, 71 leaf features), feature metadata/contracts/tests/done criteria, inherited rules, taxonomy validation, and the project ownership convention.

## A. System understanding

The system manages a multi-floor parking building. Its primary actors are Guest, Driver, Staff, Manager, Admin, and System. The intended core journeys are:

1. A driver registers/authenticates, has an eligible vehicle, discovers availability, creates or pays for a reservation, enters the building, and exits after a fee or monthly-pass validation.
2. Staff operates entry/exit and handles exceptions; managers administer users, pricing, passes, feedback, payments, reports, and approvals.
3. System integrations receive provider callbacks, reconcile payments, publish notifications, operate background expiry/cleanup, and expose health diagnostics.

The stated architecture splits transactional/write ownership to the .NET Core API and support/read/report/public responsibilities to the Spring Boot Support API over a shared PostgreSQL database. That split is useful but is not yet expressed as an enforceable entity/API ownership matrix.

Current structural quality is good: the tree has a single project root, valid parent-child types, and no blocking duplicate/cycle issue. Specification quality is not yet comparable: 61 of 71 leaf features are `draft`; 60 have at least one API contract and all have tests/done criteria, but most of those are generated baseline templates rather than feature-specific executable specifications. No node has an explicit dependency or risk list.

## B. Feature hierarchy

```text
Parking Building Management System
├─ Authentication
│  ├─ Authentication & Session Management: Sign In, Current User Profile, Refresh Access Token, Sign Out
│  └─ Driver Registration
├─ Users & Drivers
│  ├─ User Account Management: list/detail, create, update, status, role
│  └─ Driver Self-Service: registered vehicles, vehicle session history
├─ Parking Configuration
│  ├─ Vehicle Type Configuration
│  ├─ Facility Structure Management: floor, area, slot, gate read model
│  └─ Access Card Management
├─ Reservations
├─ Parking Operations
├─ Payments
├─ Monthly Passes
├─ Incidents & Exceptions
├─ Reporting & Analytics
├─ Public Information
├─ Feedback
├─ Notifications
├─ Developer & Test Utilities
└─ Platform Operations & Diagnostics
```

Placement assessment:

- The migration correctly moved parking configuration, payment, public information, diagnostics, and test utilities into clearer domains.
- Reservation, parking operation, payment, and monthly pass category rules are correctly inherited at a domain level, but their leaf features need local transition, ownership, and failure rules.
- The `Developer & Test Utilities` category must stay isolated from production business capability. Its destructive leaves need an explicit non-production policy and audit trail.
- `Payment Reconciliation`, `Payment Review / Mismatch Handling`, `Plate Mismatch Case`, `Manual Staff Override`, and diagnostic dump/maintenance leaves are currently isolated capabilities without an API/event contract or fully defined flow.

## C. End-to-end business flows

| Flow ID | Name | Actor | Participating features | Preconditions | Successful result | Main failure points |
|---|---|---|---|---|---|---|
| F-01 | Driver onboarding | Guest/Driver | Driver Registration, Sign In, Current User Profile | Unique username/email/phone and valid registration data | Active driver identity can authenticate | Duplicate identity, invalid data, rate limit, activation policy |
| F-02 | Reserve a parking location | Driver | Registered Vehicles, Available Reservation Locations, Create/Extend/Cancel Reservation, Payment Processing | Authenticated driver; active vehicle; location and time window available | Reservation is held, paid/awaiting payment, and visible to driver | Slot race, duplicate submit, price change, payment timeout, cancellation/refund |
| F-03 | Enter and claim parking session | Staff/Driver/System | Vehicle Entry, Claim Session by QR, Location Suggestion, Monthly Pass Check | Valid vehicle/card/QR/reservation and gate available | One active parking session owns one vehicle/card/slot | Double entry, stale reservation, plate/card mismatch, unavailable slot, device retry |
| F-04 | Exit and settle parking fee | Staff/Driver/System | Vehicle Exit, fee calculation, online/cash/waived payment, webhook, reconciliation | Exactly one active session and an auditable payable amount | Session closes once; payment and slot state are final | Duplicate callback, partial payment, cash/waiver abuse, fee race, barrier failure |
| F-05 | Monthly pass lifecycle | Driver/Manager/Admin/Staff | Apply, review, card management, renew, entry/exit validation | Eligible driver/vehicle; defined pass period and pricing | Active pass is associated with permitted vehicle/card and honored at exit | Competing applications, overlap, renewal/payment failure, plate/card reassignment |
| F-06 | Incident and override | Staff/Manager/Admin | Lost card, plate mismatch, manual override, payment review | Case/session exists; actor has override authority | Controlled state change with evidence and immutable audit | Unauthorized override, missing evidence, wrong fee, later dispute |
| F-07 | Operational oversight | Manager/Admin/System | Reports, audit export, notifications, feedback, health checks | Data ownership and retention policy defined | Role-scoped operational views and alerts | PII exposure, stale aggregates, export misuse, notification delivery failure |

Flows F-02 through F-06 are not implementation-ready because their state transitions and cross-feature hand-offs are not fixed. The existing done criteria mention those transitions but do not define them.

## D. Feature readiness matrix

Scoring measures evidence in objective/scope, actor/permission, business rules, data, API, UI, security/logging, failure handling, tests, dependencies, and internal consistency. `READY FOR IMPLEMENTATION` means no material business decision is left for the developer to invent.

| Feature group | Leaf scores (0–100) | Readiness | Blocking/high gap |
|---|---|---|---|
| Authentication & Session Management | Sign In 86; Profile 82; Refresh 86; Sign Out 80 | Conditionally ready | Token/session technical parameters and cross-service claim/blacklist contract still need approval |
| Driver Registration | 92 | Ready for implementation | Only final verification of account activation policy is needed |
| User Account Management | List/detail 76; Create 86; Update 80; Status 78; Role 78 | Conditionally ready | Role/status transition matrix and ownership boundaries need one shared decision |
| Driver Self-Service | Registered vehicles 28; Session history 28 | Not ready | Vehicle lifecycle and driver ownership rules are absent |
| Reservation Management | Availability 30; Create 35; Extend 28; Cancel 28; History 25 | Not ready | Reservation state machine, slot locking, pricing snapshot, payment/expiry and concurrency rules |
| Parking Session Management | Entry 35; QR claim 30; Exit 35; Slot suggestion 25 | Not ready | Session/slot state model, identity precedence, device retry and barrier completion behavior |
| Payment Processing | PayOS webhook 32; Online exit 32; Cash 30; Waived 30 | Not ready | Canonical payment state, idempotency, amount authority, waiver controls, receipt/audit |
| Payment Reconciliation | Reconcile 18; Review/mismatch 18 | Not ready | No API/event contract, work queue/status model, or resolution authority |
| Pricing Management | Pricing rule CRUD 32 | Not ready | Effective dates, version/snapshot, currency/rounding, retroactivity and approval controls |
| Monthly Pass Management | Application review 30; Card management 30; Renew 30; Entry/exit check 30; Driver application 30 | Not ready | Pass/application state machines, eligibility, overlapping periods and payment linkage |
| Incident Management | Lost card 30; Plate mismatch 18; Manual override 18 | Not ready | Case lifecycle, evidence/retention, approval threshold, immutable audit and reversal path |
| Operational Analytics / Export | Dashboard 28; Revenue 30; Traffic 28; Occupancy 28; Card session 28; Audit export 28; Generic export 28 | Not ready | Metric definitions, data freshness, role/row scope, retention, export format and PII masking |
| Public Information Access | Parking info 68; Public pricing 28; Public rules 28; Available slots 30 | Conditionally ready / not ready | Public cache/freshness and exposure rules are missing for pricing/availability |
| Feedback | Submit 28; List 28; Detail 28; Status update 28 | Not ready | Identity/anonymous policy, moderation/status model, abuse controls, response visibility |
| Notification Management | User notifications 30; Mark read 28 | Not ready | Event source, delivery channel, recipient/ownership, read semantics, retry/outbox and preference rules |
| Device Simulation | Camera 25; RFID 25; Barrier 25 | Not ready | Environment guardrails, simulated-event schema, replay/idempotency and audit |
| Test Data Maintenance | Clear reservations 15; DB migrate 15; Expire reservation 15; Expire payment deadline 15 | Not ready | No production prohibition, authorization, confirmation, transaction/rollback or audit contract |
| Health / Diagnostic Data | Core health 25; Support health 25; DB check 25; reservation dump 15; session dump 15 | Not ready | Access exposure, redaction, retention, SLO and operational ownership |
| Parking Configuration | Vehicle type 28; Floor 28; Area 28; Slot 28; Gate read model 18; Parking card CRUD 28 | Not ready | Referential integrity, lifecycle/status, seed/reference data and change-impact rules |

## E. Blocking and high-priority gaps

| Gap ID | Feature(s) | Type / severity | Missing or ambiguous information | Impact | Proposed completion |
|---|---|---|---|---|---|
| G-01 | Reservations, Sessions, Payments, Monthly Passes | Business decision / Blocking | No canonical state machines or allowed transitions | The critical journey can create contradictory or stranded records | Approve one lifecycle matrix for reservation, session, payment, pass and slot states before implementation |
| G-02 | Create Reservation, Vehicle Entry, Payment/Webhook | Technical decision / Blocking | No idempotency key, uniqueness key, locking strategy or duplicate/retry behavior | Double booking, duplicate session/payment and inconsistent slots | Define idempotency and optimistic/pessimistic concurrency per command |
| G-03 | Payments, Pricing, Reconciliation | Business decision / Blocking | Amount source, pricing snapshot, currency/rounding, payment attempt and refund/void policy absent | Monetary loss and irreconcilable finance data | Introduce price snapshot + payment attempt ledger and approve settlement rules |
| G-04 | .NET Core / Spring Boot boundary | Technical decision / High | Entity/API write/read ownership is stated globally but not per entity and route | Both services can mutate or interpret the same state differently | Publish ownership matrix, event/read-model contract and source-of-truth rule |
| G-05 | Payment reconciliation/review, mismatch, override | Missing specification / High | Feature exists but has no endpoint/event contract, data model or resolution flow | Manual work cannot be implemented or audited safely | Specify case/work-item lifecycle, evidence, authority, resolution and reopening rules |
| G-06 | 61 sparse leaf features | Missing specification / High | API/test/done entries are template-derived; objective, data, permissions, UI, security and edge cases are missing | Counts create false readiness; developers must guess behavior | Apply the revised-spec template to all critical leaves, then management/support leaves |
| G-07 | Multi-endpoint leaves | Conflict / High | Several leaves list multiple endpoints but document only one contract | Frontend/backend behavior for the undocumented endpoints can drift | Give every route a contract or move it to its proper leaf owner |
| G-08 | Registered vehicles | Missing feature / High | Driver can list vehicles but no clear add/update/remove/default-vehicle lifecycle exists | Reservation/entry cannot reliably establish vehicle ownership | Add Driver Vehicle Management with ownership, plate normalization and active/inactive behavior |
| G-09 | Reservation expiry and payment deadline | Missing dependency / High | Done criteria mention expiry/release, but no worker/scheduler contract exists | Slots can remain blocked and payments become stale | Add scheduled expiration/reconciliation workflow with retry and audit status |
| G-10 | Notifications | Missing flow / High | No event producer, recipient policy, delivery guarantee or read model | Users miss important reservation/payment outcomes | Define notification outbox, event taxonomy, channel, retry and preference policy |
| G-11 | Reports and public availability | Missing specification / High | Metric definitions, freshness/caching, privacy and export controls absent | Incorrect management decisions or public/private data leakage | Define each report metric, data source, refresh window, access scope and export masking |
| G-12 | Lost-card documents | Technical decision / High | Storage, malware scan, file type/size, retention and authorization are absent | Unsafe upload and data retention risk | Define attachment storage boundary and document lifecycle |
| G-13 | Debug/test-maintenance endpoints | Security / High | Production availability and destructive-command guardrails absent | Accidental data destruction or information disclosure | Restrict to non-production or break-glass admin; require confirmation, reason, correlation ID and immutable audit |
| G-14 | All leaf features | Missing dependency / High | No explicit dependencies or risks are populated in any node | Roadmap cannot be machine-validated and agents may implement out of order | Populate dependency IDs and risk mitigations after lifecycle decisions |
| G-15 | Permissions and audit | Missing specification / High | Node clients are broad; action/record-level rules are thin; root audit policy omits sensitive Staff changes | Unauthorized or untraceable financial/session changes | Publish permission matrix and audit catalogue for every mutating command |
| G-16 | Configuration | Missing specification / Medium | Vehicle/floor/area/slot/card/gate entities lack status, reference-data, deactivation and impact rules | Later reservation/session features rely on unstable configuration | Complete configuration data dictionaries and referential constraints |
| G-17 | Feedback | Missing specification / Medium | Anonymous-vs-driver submission, attachment/moderation and status/response visibility unspecified | Abuse, privacy and UX inconsistencies | Fix submission identity, rate-limit and feedback state model |
| G-18 | API conventions | Missing testability / Medium | Wrapper is global but error codes, date/time/ID/enums/null pagination semantics are incomplete | Clients cannot reliably map errors or test contracts | Publish shared API convention and contract-test suite |

## F. Full gap analysis

The following gap families apply to each listed leaf unless an approved revised specification supersedes them.

| Gap family | Affected leaves | Information present | Information missing / ambiguous | Severity | Proposal |
|---|---|---|---|---|---|
| Lifecycle transitions | All Reservation, Parking Session, Payment, Monthly Pass, Incident leaves | Domain-level rule statements and endpoint names | State values, legal transitions, actor, timestamps, rollback and terminal behavior | Blocking | Shared state-transition appendix and command pre/postconditions |
| Command concurrency | Create/Extend/Cancel Reservation; Entry/Claim/Exit; all payment commands; renew; overrides | Generic tests mention invalid/unauthorized requests | Idempotency key, deduplication window, version/lock, retry return and conflict response | Blocking | Command-level concurrency/idempotency standard |
| Contract coverage | Reservation create, entry, exit, pricing CRUD, monthly-pass, lost-card leaves | At least one API contract per leaf | Contracts for additional listed endpoints | High | One route = one contract, or explicitly split leaf ownership |
| Entity/data dictionary | Most sparse leaves | Endpoint name and client role | Entity fields, relationships, null/default/unique/status/audit fields | High | Data dictionary per domain plus ownership matrix |
| UI behavior | 61 sparse leaves | Done criteria reference UI in a few places | Starting screen, field/action, loading/empty/error/success/refresh/confirmation | High | UI contract per command/query leaf |
| Security/audit | Payment, override, lost-card, test/diagnostic leaves | Global JWT/audit rule | Record scope, reason/evidence, log fields, retention, PII redaction, prod restriction | High | Security and audit catalogue |
| Background processing | Reservation expiry, payment deadline expiry, reconciliation, notifications | Requirement implied by done criteria | Trigger, schedule/event, retry, owner, status, observability and recovery | High | Worker/outbox feature specs |
| Reporting semantics | All report/export leaves | Report names and endpoints | KPI formula, time zone, filter/sort/paging, freshness, masking and export job lifecycle | High | Metric catalog and export contract |
| Public-data policy | Public pricing/rules/slots | Public access allowed | Cache/refresh, outage/staleness behavior, abuse/rate limit and data visibility | High | Public-read policy |
| Test evidence | 61 sparse leaves | Baseline authorization and generic happy-path tests | Scenario-specific inputs, state/data assertions, concurrency, E2E and failure tests | High | Replace generated tests with executable scenarios after decisions |

## G. Cross-feature conflicts

| Conflict ID | Feature A | Feature B | Conflict | Impact | Proposed resolution |
|---|---|---|---|---|---|
| C-01 | Global service split | Core `GET` reservation/session read endpoints and support API read endpoints | “Support/read/report/public” ownership is not consistently represented by route ownership | Duplicate read semantics and inconsistent authorization | Define .NET transactional reads vs Spring projections explicitly; publish source of truth and replication lag contract |
| C-02 | Create Reservation | Payment/Reconciliation | Reservation leaf owns `GET .../payment-status`; payment outcome/review lives in separate features | Competing owner for payment state and status response | Payment service owns payment status; reservation exposes only its derived booking state or read model |
| C-03 | Vehicle Entry | Location Suggestion / reservation entry check | Entry leaf lists both supporting routes but does not specify their contracts or authority | Staff UI can make non-deterministic decision with stale data | Split query contracts and define which decision is server-authoritative |
| C-04 | Vehicle Exit | Monthly Pass Check / Payment Processing | Exit lists casual calculation and monthly-pass exit operations without precedence rules | Casual fee could be charged when a valid pass applies | Define ordered decision table: active pass → no casual fee; otherwise fee/payment path |
| C-05 | Pricing CRUD | Existing reservation/session/payment records | Pricing can mutate hourly price; no effective-date or snapshot behavior exists | Historical fees can change retroactively | Version/effective-date pricing, snapshot amount at reservation/session/payment creation |
| C-06 | Waived Payment / Manual Override | Root audit rule | Root mandates manager/admin audit but financial/session changes can be performed by Staff | Sensitive actions may be untraceable | Audit every financial/session override regardless of role; require escalation rule where applicable |
| C-07 | Notifications | Reservation/payment/pass changes | Notification category has no event contract | Product flow expects outcomes but no reliable producer/consumer | Use domain events/outbox with explicit recipient and delivery status |
| C-08 | Developer/Test Utilities | Production parking data | Destructive debug actions coexist in the feature tree without production policy | Operational/security risk | Non-production only by default; documented break-glass exception if ever needed |

## H. Missing features and dependencies

| Proposed feature | Reason | Dependencies | Affected features | Priority | MVP required |
|---|---|---|---|---|---|
| Driver Vehicle Management | A driver needs to create/update/deactivate the vehicle used by booking and entry | User/Driver identity, vehicle type | Reservation, session, monthly pass | High | Yes |
| Reservation Expiry & Slot Release Worker | Unpaid/expired booking must release capacity deterministically | Reservation/payment state machine, scheduler | Availability, create/extend/cancel, entry | High | Yes |
| Payment Attempt, Refund/Void & Receipt Lifecycle | Payment must be traceable beyond “paid/unpaid” | Pricing snapshot, provider integration, audit | Webhook, cash, waived, exit, reconciliation | High | Yes |
| Notification Outbox & Delivery Tracking | Important outcomes need reliable delivery rather than a UI-only notification list | Domain events, recipient policy | Reservation, payment, monthly pass, feedback | High | Yes |
| Slot Operational State Management | A slot needs maintenance/out-of-service/blocked state outside reservations | Configuration, session lifecycle | Availability, suggestion, entry | High | Yes |
| Incident Case Lifecycle & Approval | Mismatch/override needs a case, reason, evidence, approval and reversal | Session/payment data, audit, document storage | Lost card, mismatch, override, review | High | Yes |
| Audit Log Query & Retention | Audit export alone is insufficient for investigation | Audit event schema | All mutating/admin flows | Medium | Yes for admin investigation |
| Attachment Storage Governance | Lost-card documents need safe handling | Object storage/security policy | Lost-card claims, feedback if attachments are added | Medium | Yes for lost-card documents |

## I. Recommended logical design

1. Establish a single authoritative lifecycle model.

| Entity | Recommended states | Notes |
|---|---|---|
| Reservation | `pending_payment`, `confirmed`, `cancelled`, `expired`, `used`, `no_show` | A reservation must have one immutable pricing snapshot and an exclusive location/time allocation rule |
| Parking session | `open`, `payment_pending`, `exit_authorized`, `closed`, `exception` | Exactly one active session per configured identity constraint; closure releases slot only once |
| Payment attempt | `created`, `pending`, `paid`, `failed`, `expired`, `waived`, `refunded`, `under_review` | Provider callbacks are idempotent and cannot directly bypass amount/state checks |
| Monthly pass application | `submitted`, `under_review`, `approved`, `rejected`, `cancelled`, `expired` | Approval creates/activates pass only when payment and eligibility rules are satisfied |
| Monthly pass | `active`, `suspended`, `expired`, `cancelled` | Plate/card assignment and time range must be non-overlapping under defined policy |
| Incident case | `opened`, `evidence_required`, `under_review`, `approved`, `rejected`, `resolved`, `reversed` | Override always creates/links a case and immutable audit event |

2. Use the .NET Core API as command/write owner for reservation, session, payment, pass and configuration state. Use the Spring Boot Support API for explicitly replicated/projection read models only. `[TECHNICAL DECISION]` Decide whether the shared database is transitional or permanent; if permanent, enforce table-level write ownership and schema migration ownership.

3. Every mutation must accept an idempotency key or derive a documented natural deduplication key. The response must return the original result for a duplicate accepted request and a conflict code for a different payload under the same key.

4. Publish a shared error contract: `code`, `message`, `fieldErrors`, `correlationId`, `timestamp`; use ISO-8601 UTC externally and document any local-time display conversion.

5. Attach audit events to all financial, access, configuration, approval, exception and destructive actions. At minimum capture actor, target, before/after state, reason/evidence reference, result, correlation ID and timestamp. Never log credentials/tokens/payment secrets.

## J. Recommended implementation order

| Order | Feature / outcome | Why now | Dependencies | Exit condition |
|---|---|---|---|---|
| 1 | Shared API, error, ID/date/time, audit and idempotency conventions | Prevents divergent contracts | Architecture approval | Contract test examples accepted |
| 2 | Authentication/session plus role/record-scope matrix | Foundation for all protected flows | Shared conventions | Login/profile/refresh/logout plus revocation behavior verified |
| 3 | Core entities and configuration | Reservation/session need stable vehicle, floor, area, slot, gate, card and pricing reference data | Ownership matrix | Data dictionaries and lifecycle/seed rules approved |
| 4 | Driver vehicle management | Supplies trusted vehicle identity | Identity + vehicle type | Driver owns a normalized active vehicle |
| 5 | Reservation lifecycle + expiry worker | First customer-facing capacity commitment | Configuration, pricing snapshot, payment attempt | Booking/cancel/expiry resolve capacity exactly once |
| 6 | Parking session lifecycle | Core physical operation | Reservation + card/gate/slot state | Entry/claim/exit handle duplicate/device failure safely |
| 7 | Payment processing + reconciliation | Completes reservation and exit money flows | Session, pricing snapshot, audit/idempotency | Every attempt reaches terminal/reviewable state |
| 8 | Monthly pass lifecycle | Alternative entitlement at entry/exit | Driver vehicle, pricing/payment, session | Valid pass is honored consistently |
| 9 | Incident/override case lifecycle | Makes exceptional operations safe | Session/payment/audit/document storage | Overrides are authorized, evidenced and reversible |
| 10 | Notifications, feedback, reports/public read models | Supporting user/manager operations | Domain events and projection policy | Role-scoped, privacy-safe read models work |
| 11 | Reliability hardening | Closes operational gaps | All core flows | Retry, cleanup, monitoring and runbooks verified |
| 12 | Final verification | Proves system behavior as one product | All previous phases | E2E, permission, failure and contract suite pass |

## K. Revised feature specifications

### Revised Feature Specification: Create Reservation

1. **Summary / Objective:** Create one time-bound parking allocation for an authenticated driver and a driver-owned active vehicle.
2. **Scope:** Availability check, price snapshot, allocation hold, payment attempt creation, confirmation/expiry; not walk-in session creation.
3. **Dependencies:** Driver Vehicle Management, slot state, pricing version, payment attempt, expiry worker.
4. **Actors / Roles / Permissions:** Driver may create only for own active vehicle. Staff/Manager/Admin may read only under the permission matrix; they do not silently create on behalf of a driver.
5. **Preconditions:** Driver active; vehicle active and belongs to driver; selected location/time valid; capacity available; pricing version active.
6. **Postconditions:** Reservation and immutable amount snapshot exist; slot/time capacity is held exactly once; payment attempt is linked if payment is required.
7. **Main Flow:** Validate idempotency key → validate ownership/time/location → atomically reserve capacity → snapshot price → create reservation and payment attempt → return reservation status and next payment action.
8. **Alternative Flows:** Free/zero-priced reservation follows confirmed path; existing compatible idempotency key returns original reservation.
9. **Failure Flows:** Capacity race returns `RESERVATION_CAPACITY_CONFLICT`; invalid vehicle returns `VEHICLE_NOT_ELIGIBLE`; payment creation failure rolls back allocation or records an explicit pending state according to the approved transaction boundary.
10. **Business Rules:** `[OPEN DECISION]` maximum advance booking, duration, extension window, cancellation cutoff, no-show policy and whether a driver may hold more than one future booking.
11. **API Contracts:** `POST /api/core/reservations`; separately document availability, payment-status, extend and cancel routes. Require `Idempotency-Key` and return reservation/payment status plus correlation ID.
12. **Data Requirements:** Reservation ID, driver ID, vehicle ID/normalized plate, slot/location or allocation policy, start/end UTC, state, pricing version/snapshot, payment attempt ID, created/updated/audit fields.
13. **Validation Rules:** Start before end; allowed duration; future time; active vehicle; no overlapping booking under policy; supplied idempotency key format.
14. **Security Requirements:** JWT and record ownership; rate limit; no other driver identity/booking details in availability response.
15. **Logging / Audit:** Record create/duplicate/reject/expire/cancel, actor, allocation, snapshot, idempotency key hash and correlation ID.
16. **Frontend Behavior:** Reservation form loads availability; disable duplicate submit; show conflict with refresh action; show payment countdown/status; update history after success.
17. **Edge Cases:** Clock boundary, concurrent slot selection, payment succeeds after expiry, retry after network loss, pricing changes mid-flow.
18. **Automated Test Scenarios:** Atomic same-slot race; same/different idempotency payload; expiry release; ownership; price snapshot; late callback.
19. **Acceptance / Done Criteria:** A reservation either reaches a defined terminal state or is visible as pending; it never creates more than one allocation/payment attempt for one accepted command.
20. **Open Decisions:** Booking limits, cancellation/refund policy, location-selection versus auto-allocation policy.

### Revised Feature Specification: Parking Session Lifecycle (Vehicle Entry, QR Claim, Vehicle Exit)

1. **Summary / Objective:** Open, associate and close one physical parking session with one traceable identity and slot outcome.
2. **Scope:** Staff entry, driver QR claim, fee/pass decision and exit closure; not hardware protocol implementation.
3. **Dependencies:** Slot operational state, vehicle/card registry, reservation lifecycle, payment attempt, monthly pass, incident case.
4. **Actors / Roles / Permissions:** Staff opens entry/exit; Driver claims only own eligible QR session; System supplies device events; Manager/Admin handle only approved exception paths.
5. **Preconditions:** Gate active; identity evidence valid; no incompatible active session; location available; reservation/pass eligibility evaluated.
6. **Postconditions:** Session is open/closed exactly once; assigned slot is updated consistently; closure includes payment/pass/exception outcome.
7. **Main Flow:** Receive staff/device input → normalize identity → evaluate card/plate/reservation/pass precedence → lock/assign slot → create session → return gate decision. Exit loads active session → calculate from snapshot → settle/authorize pass → close session → release slot → publish outcome.
8. **Alternative Flows:** QR claim binds driver to an existing session only after ownership/expiry checks; valid pass bypasses casual fee only under stated rules.
9. **Failure Flows:** Duplicate scan returns current session; barrier success but API failure becomes `exception`; mismatch creates incident rather than overwriting identity.
10. **Business Rules:** `[OPEN DECISION]` identity precedence (RFID/card, QR, plate, reservation), grace time, manual slot override, barrier retry and abandoned-session policy.
11. **API Contracts:** Separate contracts for entry, reservation entry check, suggestion, QR claim, active-session lookup, fee calculation, monthly-pass exit and exit closure.
12. **Data Requirements:** Session ID, source identity evidence, normalized plate/card, gate, slot, reservation/pass/payment IDs, entry/exit UTC, state, fee snapshot, device/correlation data.
13. **Validation Rules:** One active session constraint; active gate/slot; temporal validity; no closed session action; positive/authorized fee outcome.
14. **Security Requirements:** Staff/device authentication; QR single-use/expiry; sensitive QR/card values redacted; command rate/replay protection.
15. **Logging / Audit:** Device input/result, assignment, identity conflict, fee decision, operator action, barrier outcome and before/after slot/session state.
16. **Frontend Behavior:** Gate console displays deterministic decision, loading lock, duplicate-scan result, mismatch escalation, payment status and confirmation before override.
17. **Edge Cases:** Offline device retry, concurrent gate scans, QR replay, session already closed, physical barrier/action mismatch.
18. **Automated Test Scenarios:** Double scan, reservation/pass precedence, slot-lock race, device retry, QR ownership, payment-required exit and manual exception.
19. **Acceptance / Done Criteria:** No entry/exit command can leave a session and slot in incompatible states; every exception is visible for resolution.
20. **Open Decisions:** Device reliability contract, offline queue policy and operational authority for force-close.

### Revised Feature Specification: Payment Processing and Reconciliation

1. **Summary / Objective:** Create, settle, reconcile and review payment attempts for reservations and parking exits without duplicate financial effects.
2. **Scope:** Online provider, cash, waiver, callback, review and reconciliation; refund/void policy must be explicitly decided.
3. **Dependencies:** Pricing snapshot, reservation/session state, idempotency standard, audit and incident case.
4. **Actors / Roles / Permissions:** Driver may pay own eligible attempt; Staff records cash; Manager may waive/review within authority; System receives signed callback and reconciles.
5. **Preconditions:** One payable reservation/session with authoritative amount/currency; payment attempt is non-terminal.
6. **Postconditions:** Attempt reaches one terminal state or `under_review`; linked business state changes only by approved transition.
7. **Main Flow:** Create attempt from amount snapshot → provider/cash/waiver action → verify authoritative evidence → atomically update attempt and business state → publish notification/audit; reconciliation compares provider ledger to local attempts.
8. **Alternative Flows:** Duplicate callback returns accepted original result; waiver uses approved reason/authority; mismatch creates review case.
9. **Failure Flows:** Invalid signature, amount mismatch, late/duplicate callback, provider timeout, cash reversal, reviewer rejection.
10. **Business Rules:** Waiver reason mandatory; callback cannot mutate a terminal attempt except approved reconciliation; amount cannot be caller supplied; `[OPEN DECISION]` refund/void, tolerance, partial payment and chargeback policy.
11. **API Contracts:** Separate contracts for online initiation, webhook, cash, waiver, reconciliation trigger/status and review decision. Webhook authentication is provider signature, not application role.
12. **Data Requirements:** Payment attempt ID, business object/type, amount/currency/snapshot, provider reference, state, idempotency key, received payload hash, reviewer/waiver reason, reconciliation result and audit timestamps.
13. **Validation Rules:** Amount/currency equal snapshot; unique provider reference; valid state transition; reviewed/waived actor authority.
14. **Security Requirements:** Verify signature, protect provider secrets, replay prevention, redact payload, restrict cash/waiver/review.
15. **Logging / Audit:** Every attempt/callback/reconciliation/waiver/review with correlation, provider reference, previous/new state and reason.
16. **Frontend Behavior:** Payment status is polling/event-driven; cash/waive require confirmation and reason; review queue exposes evidence and cannot silently resolve mismatch.
17. **Edge Cases:** Provider paid after local expiry, two callbacks, retry after timeout, price changed after attempt, callback without reservation/session.
18. **Automated Test Scenarios:** Signature, duplicate callback, amount mismatch, concurrent settlement, cash/waiver permission, reconciliation and review reopen.
19. **Acceptance / Done Criteria:** Every money movement is uniquely traceable and cannot settle a booking/session twice.
20. **Open Decisions:** Refunds, partial payment, accounting export and provider outage handling.

### Revised Feature Specification: Monthly Pass Lifecycle

1. **Summary / Objective:** Let a driver apply for a pass, let authorized staff decide it, and enforce the resulting entitlement at entry/exit.
2. **Scope:** Application, review, pass/card assignment, renewal and validation; excludes an unspecified billing product beyond approved payment linkage.
3. **Dependencies:** Driver vehicle, vehicle type, pricing/payment, session lifecycle, notification/audit.
4. **Actors / Roles / Permissions:** Driver submits/renews own request; Manager/Admin reviews and changes pass/card state; Staff/System validates; record scope applies.
5. **Preconditions:** Active driver/vehicle, defined eligibility, active product/pricing, no prohibited overlap.
6. **Postconditions:** Application/pass reaches a documented state; entitlement is either active for a valid period or rejected/expired without ambiguous gate behavior.
7. **Main Flow:** Driver submits → validate eligibility/duplicates → review → collect/verify payment if required → activate pass and assignments → validate at entry/exit → renew or expire.
8. **Alternative Flows:** Reject with reason; suspend/cancel; renewal can extend or create a new period only under approved overlap rules.
9. **Failure Flows:** Concurrent review, inactive vehicle, payment failure, card/plate conflict, expired pass at gate.
10. **Business Rules:** One active entitlement rule, status transitions, eligibility, grace period, card/plate reassignment and `[OPEN DECISION]` overlap/transfer/refund policy.
11. **API Contracts:** Separate application submit/list/detail/decision, pass/card CRUD, renewal and validation contracts; document `GET /monthly-passes/check` inputs and response authority.
12. **Data Requirements:** Application/pass IDs, driver/vehicle/card, product/pricing snapshot, period UTC, state/reason, reviewer, payment attempt, audit fields.
13. **Validation Rules:** Eligibility, period ordering, no invalid overlap, active vehicle type/card, reason required for non-happy transitions.
14. **Security Requirements:** Driver ownership; privileged review; no broad pass list exposure; audit all assignment/status actions.
15. **Logging / Audit:** Submission, decision, payment, activation, validation denial, renewal and assignment changes.
16. **Frontend Behavior:** Driver sees owned applications/pass status and renewal eligibility; reviewers see queue, evidence/reason and conflict warning; gate UI shows only allowed decision details.
17. **Edge Cases:** Approval after expiry, vehicle changed while pending, duplicate renewal, scan at exact boundary, card reassignment.
18. **Automated Test Scenarios:** Concurrent application/review, overlap, invalid vehicle type, renewal/payment failure, entry/exit boundary and record scope.
19. **Acceptance / Done Criteria:** A valid pass is consistently recognized at gates and no active entitlement can be assigned contrary to policy.
20. **Open Decisions:** Product catalog, payment/refund, transfer, grace period and multi-vehicle policy.

### Revised Feature Specification: Incident Case and Manual Override

1. **Summary / Objective:** Resolve lost-card, plate mismatch, payment mismatch and operational override safely through an auditable case.
2. **Scope:** Create/evidence/review/approve/reject/resolve/reverse case; excludes unapproved direct mutation of parking/payment records.
3. **Dependencies:** Session/payment/pass data, audit log, attachment storage and permission matrix.
4. **Actors / Roles / Permissions:** Staff may open/collect evidence; Manager approves defined overrides; Admin has exceptional authority; Driver may see only own case where product decides.
5. **Preconditions:** Target entity exists; actor has case action permission; evidence/reason meets policy.
6. **Postconditions:** Case has a terminal/reopenable state; any override is linked to a case and immutable audit event.
7. **Main Flow:** Detect/open case → attach evidence → validate target/current state → request/perform authorized decision → apply controlled transition → notify and audit.
8. **Alternative Flows:** Auto-open from mismatch; reject missing evidence; escalation for monetary/security threshold.
9. **Failure Flows:** Target changed concurrently, attachment scan fails, approver loses role, action retries, reversal requested after resolution.
10. **Business Rules:** Reason mandatory; approval threshold by action/amount; no direct override without case; `[OPEN DECISION]` manager versus admin thresholds and reversal window.
11. **API Contracts:** Case create/detail/list/action/history; attachment upload/list/delete; override decision; review/mismatch resolution. Existing lost-card document routes are only a subset.
12. **Data Requirements:** Case ID/type/state/severity, target refs, requester/approver, reason, evidence refs/hash, before/after state, monetary impact, timestamps, correlation ID.
13. **Validation Rules:** Allowed transition, evidence type/size, target/version check, reason/approver mandatory when applicable.
14. **Security Requirements:** Record/action authorization, malware-scanned storage, retention/redaction, no unredacted diagnostics.
15. **Logging / Audit:** Case lifecycle and every attempted/approved/rejected/reversed action with actor/evidence/correlation.
16. **Frontend Behavior:** Staff sees explicit warning/confirmation; approver sees before/after and evidence; failures preserve form and surface actionable reason.
17. **Edge Cases:** Duplicate case, concurrent approval, lost permission, target closed, attachment retry, override after payment settlement.
18. **Automated Test Scenarios:** Permission, threshold, evidence validation, optimistic conflict, audit completeness, reversal and attachment security.
19. **Acceptance / Done Criteria:** No manual override or mismatch resolution is invisible, unaudited or irreversibly applied without authorized evidence.
20. **Open Decisions:** Approval thresholds, evidence retention, driver visibility and financial reversal policy.

## L. Open business decisions

1. `[OPEN DECISION]` Reservation limits, auto-allocation versus driver-selected location, cancellation/no-show/refund policy.
2. `[OPEN DECISION]` Canonical state values/transitions and exact point at which slot capacity is committed/released.
3. `[OPEN DECISION]` Pricing effective dating, snapshot, currency/rounding, waiver/refund/partial-payment policy.
4. `[OPEN DECISION]` Identity precedence at gates and force-close/physical barrier mismatch procedure.
5. `[OPEN DECISION]` Monthly-pass overlap, transfer, grace, multi-vehicle and refund policy.
6. `[OPEN DECISION]` Override approval thresholds, evidence requirements and reversal window.
7. `[OPEN DECISION]` Public availability freshness and what data can be exposed anonymously.
8. `[OPEN DECISION]` Feedback identity/moderation policy and notification channel/preference behavior.

## M. Technical decisions for later

1. `[TECHNICAL DECISION]` Command owner, projection owner and table-level write ownership for .NET Core and Spring Boot.
2. `[TECHNICAL DECISION]` Idempotency-key format/storage/TTL and optimistic-lock versus database-lock approach.
3. `[TECHNICAL DECISION]` Worker scheduler/outbox technology, retry/dead-letter behavior and monitoring.
4. `[TECHNICAL DECISION]` Provider-webhook signature/replay defense and payment reconciliation integration.
5. `[TECHNICAL DECISION]` Attachment storage, malware scan, retention and redaction design.
6. `[TECHNICAL DECISION]` Audit schema, correlation propagation and reporting/projection freshness.
7. `[TECHNICAL DECISION]` Production controls for mock, debug, diagnostic and destructive maintenance utilities.

## N. Final readiness conclusion

The project is structurally coherent and can begin implementation only for the well-specified foundation: Driver Registration, authentication/session leaves, and the more detailed user-account leaves after their shared role/status matrix is finalized.

Do **not** begin independent implementation of reservation, entry/exit, payment, pricing, reconciliation, monthly-pass, incident/override, notification, configuration, reporting or destructive utility leaves yet. They have no blocking tree error, but they do have blocking specification gaps in lifecycle, ownership, data, concurrency and error handling.

The immediate next action is to approve the eight open business decisions and seven technical decisions above, then use the five revised specifications as the pattern to complete the remaining sparse leaves domain by domain. Only then should the implementation roadmap be treated as executable.

# Shared Decision Register

**Status:** Approved baseline for implementation guides. A later change must name the affected guides and update them together.

## SDR-01 — API envelope and error model

**Decision:** Every API returns `{ success, data, message, error, correlationId, timestamp }`. `timestamp` is ISO-8601 UTC. `error` is `null` on success; otherwise it contains machine-readable `code`, optional `fieldErrors`, and no internal exception detail.

**Standard codes:** `VALIDATION_FAILED`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `IDEMPOTENCY_CONFLICT`, `RATE_LIMITED`, `STATE_NOT_ALLOWED`, `EXTERNAL_SERVICE_UNAVAILABLE`, `INTERNAL_ERROR`.

## SDR-02 — IDs, enums and time

**Decision:** Public IDs are lowercase UUID strings. API role codes are `ADMIN`, `MANAGER`, `STAFF`, `DRIVER`, `GUEST`, `SYSTEM`; the UI displays title-cased labels. Business statuses use uppercase snake case. All stored and exchanged times are ISO-8601 UTC; UI converts only for display.

## SDR-03 — List/query contract

**Decision:** List APIs accept `page`, `pageSize`, `sort`, and documented feature-specific filters. Default `page=1`, `pageSize=20`, maximum `100`. Empty results return HTTP 200 with an empty `items` array and pagination metadata.

## SDR-04 — Mutation, retry and concurrency

**Decision:** A client mutation carries `Idempotency-Key` (UUID) unless its guide explicitly defines a safe idempotent action without one. The server binds the key to authenticated actor, command name and normalized request fingerprint for 24 hours.

- Same key + same fingerprint returns the original outcome.
- Same key + different fingerprint returns `IDEMPOTENCY_CONFLICT`.
- Concurrent writes use an entity version or an atomic conditional update. A stale command returns `CONFLICT` and the current version is returned where safe.
- A multi-entity command commits atomically; on failure no partial business state is exposed unless the guide explicitly creates a recoverable pending state.

## SDR-05 — Audit and operational logs

**Decision:** Every mutation of identity, permissions, configuration, booking, session, money, entitlement, incident or production diagnostic data writes an audit event with actor, action, target IDs, before/after state, reason/evidence reference where applicable, outcome, correlation ID and UTC timestamp.

Never log passwords, raw access/refresh tokens, provider secrets, complete payment payloads, or unredacted personal documents.

## SDR-06 — Entity and service ownership

**Decision:** .NET Core API is the sole command/write owner of identity, users/roles, configuration, reservations, parking sessions, payments, monthly passes and incidents. Spring Boot Support API owns only read projections, reports, public read models, notifications and feedback. It cannot directly mutate Core-owned tables; it consumes published read/event data or approved read-only views.

## SDR-07 — Authentication and account lifecycle

**Decision:** User account states are `ACTIVE`, `INACTIVE`, `DISABLED`, `LOCKED`, `DELETED`. Only `ACTIVE` may obtain or use access tokens. Login returns the same generic `UNAUTHENTICATED` response for unknown, disabled, inactive, locked and deleted accounts.

JWT access tokens last **15 minutes** and carry `sub`, `sid`, `jti`, `roles`, `iss`, `aud`, `iat`, `exp`. Refresh tokens last **30 days**, rotate on every successful use, and belong to a token family. Logout revokes the active session and access-token `jti` until expiry. A refresh-token reuse with a different idempotency key revokes the entire token family.

## SDR-08 — Record ownership

**Decision:** A Driver can read or mutate only records with their authenticated `userId` as owner unless a guide grants a staff/manager workflow. Managers and Admins have no implicit cross-record right; each guide names the action-level authority.

## SDR-09 — Public/private data

**Decision:** Public read models expose only explicitly whitelisted, non-personal fields. Public endpoints are rate limited and cannot reveal user, card, session, payment, precise active-vehicle or operational-security information.

## SDR-10 — Frontend error behavior

**Decision:** The frontend maps `VALIDATION_FAILED` to field errors, `UNAUTHENTICATED` to session clear/login navigation, `FORBIDDEN` to disabled action plus an access message, `CONFLICT` to a refresh/retry prompt, `RATE_LIMITED` to a countdown/retry time, and all unknown/5xx errors to a retryable error state preserving safe user input.

## SDR-11 — Shared state ownership

**Decision:** A state transition may be executed only by the command owner named in the relevant guide. A read/projection service may display the state but cannot derive a conflicting terminal state.

## SDR-12 — Configuration lifecycle and reference integrity

**[ASSUMPTION FOR READINESS] Decision:** `MANAGER` performs normal parking-configuration changes and `ADMIN` has the same access for recovery; every change requires a reason and version. A configured object referenced by a live reservation, session, payment, pass or audit event is never hard-deleted. It is deactivated or retired after a dependency check. Vehicle type, floor, area, slot, gate and card identifiers are unique within their parent scope.

**Decision:** Slot operational states are `AVAILABLE`, `RESERVED`, `OCCUPIED`, `OUT_OF_SERVICE`; only reservation/session commands may set `RESERVED` or `OCCUPIED`. Configuration commands may move an empty `AVAILABLE` slot to or from `OUT_OF_SERVICE`.

## SDR-13 — Reservation, session and allocation lifecycle

**[ASSUMPTION FOR READINESS] Decision:** Reservation states are `PENDING_PAYMENT`, `CONFIRMED`, `CLAIMED`, `CANCELLED`, `EXPIRED`, `COMPLETED`; session states are `ACTIVE`, `EXIT_PENDING_PAYMENT`, `EXIT_AUTHORIZED`, `CLOSED`, `CANCELLED`; a slot has at most one active reservation/session allocation. A reservation price and policy version are immutable snapshots. The server obtains the allocation with a conditional/locked write and releases it atomically on cancel, expiry or close.

**Decision:** Payment settlement or a valid monthly pass advances an exit from `ACTIVE` to `EXIT_AUTHORIZED`; a barrier acknowledgement alone does not close the session. A trusted gate passage event or staff confirmation closes it and releases allocation. An `EXIT_AUTHORIZED` timeout opens an incident, preserving the session until resolved.

## SDR-14 — Vehicle, card and identity precedence at a gate

**[ASSUMPTION FOR READINESS] Decision:** A successful gate command records the recognized plate/card as an immutable session snapshot. A linked active reservation has priority over a generic vehicle lookup; an assigned active monthly pass is evaluated next; otherwise the session is casual. Conflicting plate, card, reservation or pass identity creates an incident and does not silently override the active session.

## SDR-15 — Pricing and money precision

**Decision:** Monetary values are non-negative decimal values in VND with zero fractional digits; calculations use decimal arithmetic. A price rule has a version, effective UTC range and explicit priority. The resolved rule/version and the calculated breakdown are snapshotted on the reservation, session or monthly-pass application; later rule changes never re-price an existing snapshot.

## SDR-16 — Payment, provider and reconciliation state

**[ASSUMPTION FOR READINESS] Decision:** Payment states are `NOT_REQUIRED`, `PENDING`, `PROCESSING`, `PAID`, `FAILED`, `EXPIRED`, `UNDER_REVIEW`, `WAIVED`. One business obligation may have many provider attempts but at most one successful settlement. Provider webhooks are verified, deduplicated by provider event ID and persisted before side effects. A discrepancy changes only payment/review state; it never reopens a closed session without a documented incident override.

## SDR-17 — Monthly-pass entitlement lifecycle

**[ASSUMPTION FOR READINESS] Decision:** Application states are `SUBMITTED`, `UNDER_REVIEW`, `APPROVED_PENDING_PAYMENT`, `REJECTED`, `CANCELLED`, `EXPIRED`; pass states are `PENDING_PAYMENT`, `ACTIVE`, `SUSPENDED`, `EXPIRED`, `CANCELLED`. One driver/vehicle cannot hold overlapping active passes. Entitlement is checked at gate time against pass status, period, assigned vehicle/card and configuration scope.

## SDR-18 — Incident and override controls

**Decision:** Incident states are `OPEN`, `UNDER_REVIEW`, `RESOLVED`, `CLOSED`, `VOID`. `STAFF` may open and attach evidence; `MANAGER` resolves standard cases; `ADMIN` can perform the emergency override in ODR-03. Overrides require typed reason, evidence reference, target version and immutable audit; they create a compensating event rather than rewriting prior history.

## SDR-19 — Event, notification and feedback ownership

**Decision:** Core writes publish durable domain events through an outbox after commit. Support consumes them idempotently to build notification/read models. Notifications are per-recipient, immutable apart from `readAt`; delivery failure retries with bounded backoff and is observable. Feedback is a Support-owned record and may be anonymous only under the anti-abuse limits named in its guide.

## SDR-20 — Reporting and public-read consistency

**Decision:** Support-owned reports/public APIs read projections, not Core command tables. Every response states `asOf` UTC and applies role/PII masking. Public information is cached for at most 60 seconds and exposes aggregate availability only; reports/export use a stable query snapshot and record the requester, filters, format and row count.

## SDR-21 — Non-production utilities and diagnostics

**Decision:** Simulation, debug dump and destructive test-maintenance functions are disabled in production by deployment configuration, require `ADMIN` plus a fresh confirmation token, and are auditable. Health endpoints expose a public liveness-only result; detailed component/database diagnostics require an authenticated Admin and never contain credentials or raw personal/payment data.

## SDR-22 — Driver vehicle lifecycle

**[ASSUMPTION FOR READINESS] Decision:** Only a `DRIVER` profile may own a registered vehicle. A vehicle has immutable normalized plate identity, vehicle type, status `ACTIVE`/`INACTIVE`, and version. A driver may update a label/contact attribute but may not change plate or vehicle type after the vehicle is referenced; they deactivate it instead. An active driver has at most one active registered vehicle per normalized plate, and a registered vehicle cannot be transferred between drivers. Casual visitor sessions use plate/type snapshots and never create a driver-owned vehicle.

## SDR-23 — Monthly-pass card binding

**[ASSUMPTION FOR READINESS] Decision:** A pass may have zero or one active physical card, and one card may be actively bound to zero or one pass. Binding/replacement requires an active pass, `AVAILABLE` replacement card and a reason; the old card is marked `LOST`, `BLOCKED` or `AVAILABLE` through the related incident/management command. A card scan validates both pass entitlement and current binding version.

## SDR-24 — Test-data and break-glass boundary

**[ASSUMPTION FOR READINESS] Decision:** Every test utility command targets an explicit `testRunId`/test-data marker and rejects production data. Production diagnostic dump access is disabled by default; an operator can enable it only through a time-limited break-glass deployment flag plus Admin fresh confirmation. No endpoint accepts arbitrary SQL, shell command or unbounded data dump.

## Open organization decisions

| ID | Decision needed | Default used until approved | Impact |
|---|---|---|---|
| ODR-01 | Monetary refund/void policy | No refund/void command is exposed; mismatches enter `UNDER_REVIEW` | Payment-related guides can implement creation/settlement but not refunds |
| ODR-02 | Exact commercial fees and booking limits | Configuration stores values; no hard-coded business amount/limit | Pricing and reservation UI can be built against configured policy |
| ODR-03 | Financial/override approval threshold | Manager approval is required; Admin may perform emergency override with mandatory reason | Incident/payment review can be built; threshold values remain configurable |

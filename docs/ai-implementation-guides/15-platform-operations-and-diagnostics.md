# Category: Platform Operations & Diagnostics

**Shared decisions:** SDR-05/09/19/21/24 apply. Detailed diagnostics require Admin and fresh confirmation where data is enumerated. Liveness endpoints are infrastructure-only/minimal; diagnostic responses have strict redaction and row/period limits.

---

# AI Implementation Guide: Core Health Check

**Target Path:** Platform Operations & Diagnostics > Core Health Check (`leaf-diag-core-health`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** System, Admin  
**API:** `GET /api/core/health/live` (minimal), `GET /api/core/health` (Admin detail)

## 1. Complete Summary & Objective
Provides real-time observability for the .NET Core API via liveness and readiness probes. The objective is to ensure the infrastructure (Kubernetes/load balancer) can determine if the pod should receive traffic (live) and if dependencies are reachable (ready), while giving system administrators a detailed breakdown of component health without leaking secrets.

## 2. Scope
Verifies component health, dependency status, versioning, and environment watermark. Does not provide debugging data dumps or remediation capabilities. Confined strictly to API operational status.

## 3. Actors & Permissions
- **System / Load Balancer:** Reads `GET /api/core/health/live` (Unauthenticated, internal network only).
- **Admin:** Reads `GET /api/core/health` (Requires valid Admin JWT, restricted by RBAC).

## 4. Happy Path
1. System or Admin calls the health endpoint.
2. The API evaluates its own memory and thread pool state.
3. For detailed health, the API concurrently pings PostgreSQL (select 1) and RabbitMQ (connection state).
4. All dependencies respond within the 500ms timeout.
5. The API aggregates a `Healthy` status and returns an HTTP 200 OK with the JSON payload.

## 5. Unhappy Path
- **Database Timeout:** If PostgreSQL fails to respond within 500ms, the detailed health returns HTTP 503 Service Unavailable, marking the Database component as `Degraded`. The API logs the timeout without exposing the connection string.
- **Queue Disconnect:** If RabbitMQ is disconnected, the detailed health returns HTTP 503, marking Queue as `Offline`.
- **Liveness Failure:** If the main application thread is deadlocked, the liveness probe times out, and the infrastructure orchestrator restarts the pod.

## 6. Business Rules
- Liveness checks must NEVER query the database; they are strictly memory/thread checks.
- Readiness checks must enforce strict timeouts (500ms maximum).
- A degraded dependency must not crash the liveness probe.

## 7. Validation Rules
- Endpoints accept no query parameters or request bodies.
- Unrecognized parameters must be ignored.

## 8. Security Requirements
- Detailed health (`/api/core/health`) must require a valid Admin JWT.
- Liveness (`/api/core/health/live`) must not require a JWT but must be restricted to internal VNET IP ranges.
- Stack traces, connection strings, and credential secrets must NEVER be included in the response.

## 9. Logging & Audit
- Log state transitions (Healthy -> Degraded -> Offline).
- Audit log every access to the detailed health API, recording the Admin's User ID and timestamp.
- Do not log successful liveness pings to avoid log flooding.

## 10. Integration Points & Feature Interaction
- Interacts with Shared PostgreSQL via Entity Framework connection pool.
- Interacts with the JWT Authentication module for Admin validation.

## 11. API Contracts
**Liveness:** `GET /api/core/health/live`
Response (HTTP 200): `{ "status": "UP" }`

**Detailed:** `GET /api/core/health`
Response (HTTP 200/503):
```json
{
  "status": "Healthy",
  "components": [
    { "name": "Database", "status": "Healthy", "latencyMs": 12 },
    { "name": "MessageQueue", "status": "Healthy", "latencyMs": 4 }
  ],
  "version": "1.2.4",
  "checkedAt": "2026-07-19T14:40:00Z"
}
```

## 12. Database Requirements
- Executes `SELECT 1` on the primary database using the existing connection pool.
- Does not lock rows or mutate data.

## 13. Frontend Behaviour
- The Admin Portal dashboard displays a color-coded status indicator (Green, Yellow, Red) based on the detailed health response.

## 14. Automated Test Cases
- Verify liveness returns 200 UP without DB access.
- Verify detailed health returns 503 when the DB is mocked to timeout.
- Verify detailed health returns 401/403 when called without a valid Admin JWT.
- Verify response payloads never contain exception messages.

## 15. Acceptance Criteria
- Infrastructure can accurately route traffic based on liveness.
- Admins can view dependency latencies.
- No sensitive topology data is leaked.

## 16. Implementation Instructions
- Utilize `Microsoft.Extensions.Diagnostics.HealthChecks`.
- Register separate endpoints: `MapHealthChecks("/api/core/health/live")` and `MapHealthChecks("/api/core/health")`.

---

# AI Implementation Guide: Support Health Check

**Target Path:** Platform Operations & Diagnostics > Support Health Check (`leaf-diag-support-health`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** System, Admin  
**API:** `GET /api/support/health/live`, `GET /api/support/health`

## 1. Complete Summary & Objective
Expose the operational health and projection lag of the Spring Boot Support API. The objective is to verify that the read-heavy reporting services are functional and to quantify the delay (lag) between the .NET Core command API and the Support CQRS read models.

## 2. Scope
Evaluates application liveness, database read-replica connectivity, and event consumer offset lag. Does not provide raw data dumps or query execution.

## 3. Actors & Permissions
- **System / Load Balancer:** Reads `GET /api/support/health/live` (Unauthenticated, internal network only).
- **Admin:** Reads `GET /api/support/health` (Requires valid Admin JWT, restricted by RBAC).

## 4. Happy Path
1. System or Admin calls the Support API health endpoint.
2. The API checks its local JVM memory state.
3. The API queries the consumer offset tracking table to calculate the projection lag.
4. The API aggregates a `Healthy` status, noting the `projectionLagSeconds`, and returns an HTTP 200 OK.

## 5. Unhappy Path
- **High Projection Lag:** If the read model consumer is lagging behind the Core event stream by more than 300 seconds, the status transitions to `Warning`. The API returns HTTP 200, as it is still capable of serving read requests, but includes the `asOf` warning.
- **Consumer Offline:** If the event consumer has crashed, status transitions to `Degraded`.
- **Database Unreachable:** If the read database is offline, returns HTTP 503.

## 6. Business Rules
- Support health reports projection freshness, NOT Core command state correctness.
- The service remains "available" (HTTP 200) even if data is stale, up to a configurable critical threshold.

## 7. Validation Rules
- No query parameters accepted.

## 8. Security Requirements
- Admin JWT required for detailed `/api/support/health`.
- Mask consumer endpoint details and database credentials.

## 9. Logging & Audit
- Log when projection lag exceeds the 300-second warning threshold.
- Audit log all manual Admin accesses to detailed health.

## 10. Integration Points & Feature Interaction
- Depends on the shared PostgreSQL (read replica or reporting schema).
- Interacts with the event stream (e.g., Outbox/RabbitMQ) to determine offset lag.

## 11. API Contracts
**Liveness:** `GET /api/support/health/live`
Response (HTTP 200): `{ "status": "UP" }`

**Detailed:** `GET /api/support/health`
Response (HTTP 200/503):
```json
{
  "status": "Warning",
  "components": [
    { "name": "ReadDatabase", "status": "Healthy", "latencyMs": 15 },
    { "name": "EventConsumer", "status": "Warning", "latencyMs": 2 }
  ],
  "projectionLagSeconds": 345,
  "asOf": "2026-07-19T14:35:00Z",
  "version": "1.2.4"
}
```

## 12. Database Requirements
- Queries the `consumer_offsets` or `outbox_cursors` table to calculate lag.
- Executes bounded, read-only queries against the reporting schema.

## 13. Frontend Behaviour
- The Admin dashboard displays the Support API health alongside Core API health, prominently labeling "Data as of [Time]" if lag is detected.

## 14. Automated Test Cases
- Verify projection lag calculation returns correct seconds.
- Verify status transitions to Warning when lag > 300s.
- Verify liveness endpoint responds correctly.

## 15. Acceptance Criteria
- Operators can distinguish service availability from projection freshness.
- No write-path dependencies impact Support liveness.

## 16. Implementation Instructions
- Use Spring Boot Actuator for base health.
- Implement a custom `HealthIndicator` for the projection lag calculation.

---

# AI Implementation Guide: Database Check

**Target Path:** Platform Operations & Diagnostics > Database Check (`leaf-diag-db-check`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Admin  
**API:** `GET /api/core/db-check`

## 1. Complete Summary & Objective
Provides an advanced, bounded diagnostic check of the primary PostgreSQL database to verify connectivity, schema migration compatibility, and critical system invariants (e.g., connection pool usage, lock detection). The objective is to give DBAs and Admins immediate insight into database health without dumping customer data.

## 2. Scope
Executes read-only connectivity, latency, schema version, and connection pool utilization checks. Does NOT execute migrations, mutations, or arbitrary SQL queries.

## 3. Actors & Permissions
- **Admin:** Requires valid Admin JWT, fresh authentication session, and RBAC permissions.

## 4. Happy Path
1. Admin invokes the database check API.
2. The API checks the Entity Framework connection pool metrics.
3. The API executes a lightweight `SELECT` to measure read latency.
4. The API checks the `__EFMigrationsHistory` table to verify the current schema version.
5. Results are aggregated and returned as HTTP 200 OK.

## 5. Unhappy Path
- **Pool Exhaustion:** If the connection pool has 0 available connections, the API bypasses the standard pool, uses an emergency connection (if configured/available) to report pool exhaustion, or fails gracefully with HTTP 503, logging "Connection Pool Exhausted".
- **Schema Mismatch:** If the application version expects Migration X but the database is on Migration Y, the status is marked `Degraded`.

## 6. Business Rules
- Queries must be strictly bounded (max timeout 1000ms).
- Invariant checks must be aggregate counts only (e.g., "count of active sessions without valid entry gates").

## 7. Validation Rules
- No SQL injection vectors; no client-provided table names or parameters.

## 8. Security Requirements
- Requires fresh Admin confirmation (re-authentication).
- Never return the physical DSN, database username, or raw SQL statements in the payload.

## 9. Logging & Audit
- Audit log every database check execution with Admin User ID.
- Alert immediately if the error class indicates pool exhaustion or long-running locks.

## 10. Integration Points & Feature Interaction
- Interacts exclusively with the primary PostgreSQL database.
- Bypasses application business logic to directly query system catalogs (`pg_stat_activity`).

## 11. API Contracts
**API:** `GET /api/core/db-check`
Response (HTTP 200):
```json
{
  "status": "Healthy",
  "checks": [
    { "name": "ReadLatency", "status": "Healthy", "latencyMs": 8 },
    { "name": "SchemaVersion", "status": "Healthy", "value": "20260719_Init" },
    { "name": "PoolUtilization", "status": "Healthy", "percentage": 15 },
    { "name": "ActiveLocks", "status": "Healthy", "count": 0 }
  ],
  "checkedAt": "2026-07-19T14:40:00Z",
  "correlationId": "chk_abc123"
}
```

## 12. Database Requirements
- Read-only access to `pg_stat_activity` for lock/pool detection (requires appropriate DB user grants).
- Read access to migration history tables.

## 13. Frontend Behaviour
- Admin panel displays database metrics via a secure dashboard. It implements strict retry/backoff to prevent accidental DDoS.

## 14. Automated Test Cases
- Mock `pg_stat_activity` to simulate high lock count and verify `Warning` status.
- Test connection pool utilization metric extraction.
- Verify DSN is never leaked in exception paths.

## 15. Acceptance Criteria
- Admins can view pool usage and active locks.
- Database check cannot mutate records or execute arbitrary queries.

## 16. Implementation Instructions
- Use raw ADO.NET with `Npgsql` for system catalog queries to bypass EF Core caching.

---

# AI Implementation Guide: Reservation Debug Dump

**Target Path:** Platform Operations & Diagnostics > Reservation Debug Dump (`leaf-diag-res-dump`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Admin  
**API:** `GET /api/core/diagnostics/reservations/{id}`

## 1. Complete Summary & Objective
Provides a highly bounded, redacted diagnostic view of a specific reservation's state transitions, lifecycle events, and payment links. The objective is to facilitate active incident triage (break-glass scenario) without creating a mass data-exfiltration vector.

## 2. Scope
Read-only extraction of a single reservation timeline. Includes vehicle linkage, slot allocation, expiration data, and audit history. Excludes raw PII, full payment credentials, and system secrets.

## 3. Actors & Permissions
- **Admin:** Requires Break-Glass deployment flag enabled, Admin JWT, and explicit incident ID correlation.

## 4. Happy Path
1. Admin provides a valid Reservation ID and Incident Correlation ID to the endpoint.
2. The API verifies the Break-Glass mode is active.
3. The API loads the reservation, associated events, and masked payment summary.
4. PII (license plate, contact details) is masked (e.g., `51F-**-**12`).
5. An HTTP 200 OK is returned with the ordered timeline of the reservation.

## 5. Unhappy Path
- **Break-Glass Disabled:** If the environment is not in Break-Glass mode, returns HTTP 403 Forbidden, logging an unauthorized diagnostic attempt.
- **Missing Incident ID:** If the request lacks an incident context, returns HTTP 400 Bad Request.
- **Reservation Not Found:** Returns HTTP 404 Not Found.

## 6. Business Rules
- Max 100 related event rows returned to prevent large payload generation.
- Strict timeline ordering must be maintained to show the sequence of state changes (Created -> Paid -> Expired).

## 7. Validation Rules
- `id` must be a valid UUID.
- `incidentId` query parameter is required.

## 8. Security Requirements
- Mask all License Plates, Phone Numbers, and Email Addresses.
- Payment identifiers must only show the gateway transaction reference, never raw card details.

## 9. Logging & Audit
- High-priority security audit log generated detailing exactly which Admin dumped which Reservation ID, tied to the provided `incidentId`.

## 10. Integration Points & Feature Interaction
- Interacts with Reservation, Vehicle, and Payment modules to aggregate the timeline.
- Read-only queries across multiple bounded contexts.

## 11. API Contracts
**API:** `GET /api/core/diagnostics/reservations/{id}?incidentId={incidentId}`
Response (HTTP 200):
```json
{
  "reservationId": "res_123",
  "status": "Active",
  "vehiclePlateMasked": "51F-**-**12",
  "slotId": "slot_45",
  "timeline": [
    { "timestamp": "2026-07-19T10:00:00Z", "event": "Created", "actor": "User" },
    { "timestamp": "2026-07-19T10:05:00Z", "event": "Paid", "reference": "tx_***99" }
  ],
  "asOf": "2026-07-19T14:40:00Z"
}
```

## 12. Database Requirements
- Requires complex joins across `Reservations`, `ReservationEvents`, and `Payments` tables. Query must use appropriate indexing on `ReservationId`.

## 13. Frontend Behaviour
- Displayed in a privileged incident response tool with clear visual markers indicating redacted data. No "Copy Full Raw JSON" button allowed.

## 14. Automated Test Cases
- Verify HTTP 403 when Break-Glass is disabled.
- Verify PII masking logic applies to all text fields.
- Verify audit log is generated on successful read.

## 15. Acceptance Criteria
- Triage can be performed on stuck reservations.
- Data exfiltration is mitigated by strict masking and bounded queries.

## 16. Implementation Instructions
- Implement a dedicated diagnostic read service; do not reuse the standard consumer `GetReservation` query to ensure masking rules cannot be accidentally bypassed.

---

# AI Implementation Guide: Session Debug Dump

**Target Path:** Platform Operations & Diagnostics > Session Debug Dump (`leaf-diag-sess-dump`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Admin  
**API:** `GET /api/core/diagnostics/sessions/{id}`

## 1. Complete Summary & Objective
Provides a bounded, redacted timeline of a parking session, including barrier gate commands, ALPR mismatches, and payment handoffs. The objective is to debug stuck vehicles or barrier anomalies during active incidents.

## 2. Scope
Read-only extraction of a single session's lifecycle. Correlates entry/exit times, gate ACK/NACK events, pricing calculations, and linked parking cards.

## 3. Actors & Permissions
- **Admin:** Requires Break-Glass deployment flag enabled, Admin JWT, and explicit incident ID correlation.

## 4. Happy Path
1. Admin calls the endpoint with Session ID and Incident ID.
2. The API aggregates the session data, associated ALPR images (URIs only), gate logs, and pricing data.
3. Card numbers and plate numbers are masked.
4. The timeline clearly distinguishes between `EXIT_REQUESTED`, `BARRIER_OPENED`, and `SESSION_CLOSED`.
5. Returns HTTP 200 OK.

## 5. Unhappy Path
- **Excessive Gate Events:** If a barrier has spammed thousands of NACK events, the timeline truncates at the most recent 100 events to prevent memory overflow, adding a `truncated: true` flag.
- **Break-Glass Disabled:** Returns HTTP 403 Forbidden.

## 6. Business Rules
- Must clearly indicate if a session is linked to a "Lost Card" or "Mismatch Override" scenario.
- Diagnostic view never applies or retroactively changes state; it is an immutable snapshot.

## 7. Validation Rules
- `id` must be a valid UUID.
- `incidentId` query parameter is required.

## 8. Security Requirements
- Mask Parking Card serial numbers.
- Mask License Plate strings.
- Do not return raw Base64 ALPR images; return secure temporary CDN URIs or identifiers.

## 9. Logging & Audit
- High-priority security audit log generated for the access.

## 10. Integration Points & Feature Interaction
- Correlates data from Session, Gate/Barrier Event Logs, Pricing, and ALPR modules.

## 11. API Contracts
**API:** `GET /api/core/diagnostics/sessions/{id}?incidentId={incidentId}`
Response (HTTP 200):
```json
{
  "sessionId": "sess_789",
  "status": "Active",
  "entryGateId": "gate_1",
  "plateMasked": "59G-**-**34",
  "cardSerialMasked": "CARD-****-56",
  "lostCardStatus": false,
  "timeline": [
    { "timestamp": "2026-07-19T08:00:00Z", "event": "ALPR_Scanned", "details": "Match Confidence 98%" },
    { "timestamp": "2026-07-19T08:00:05Z", "event": "Barrier_Opened", "gate": "gate_1" }
  ],
  "truncated": false,
  "asOf": "2026-07-19T14:40:00Z"
}
```

## 12. Database Requirements
- Efficient query of the `SessionEvents` ledger filtered by `SessionId` with a `LIMIT 100`.

## 13. Frontend Behaviour
- Incident timeline UI with visual distinction between software events and hardware (barrier) ACKs.

## 14. Automated Test Cases
- Verify truncation logic limits to 100 events.
- Verify timeline sorting is strictly chronological.
- Verify masking of card serials.

## 15. Acceptance Criteria
- Barrier anomalies can be diagnosed without mutating the stuck session.
- Diagnostic endpoint cannot be used for unauthorized mass surveillance of entry/exit times.

## 16. Implementation Instructions
- Use Dapper or raw EF Core queries for the event log to bypass complex domain aggregations, ensuring raw truth is displayed.

# Category: Notifications (System-Level Specification)

> **Audit Finding:** The previous specification lacked a centralized, high-level system overview. It focused entirely on API contracts.
> **Impact:** Developers and QA would miss the bigger picture (bulk notifications, scheduler logic, interaction with other modules), leading to integration bugs and unscalable designs.

**Shared decisions:** SDR-03/04/08/10/19 apply. Support owns notification records/read models; Core publishes durable outbox events only. The seed routes with `{userId}` are replaced by `/api/support/notifications/me`; a legacy route, if retained, must reject any ID different from JWT `sub` and is not the implementation target.

---

## 1. Business Requirements

### Functional Requirements
- The system must deliver in-app notifications to targeted users (Driver, Staff, Manager, Admin) based on domain events.
- Users must be able to view their notifications, see an unread count, mark specific notifications as read, mark all as read, and delete/archive notifications.
- The system must handle real-time generation (polling/eventual consistency for now) without blocking the primary business workflows (e.g., Payment, Reservation).

### Non-Functional Requirements
- **Performance:** Notification API endpoints must respond in < 150ms.
- **Scalability:** The system must efficiently handle bulk notification generation (e.g., 100,000+ users for system announcements) using batch inserts.
- **Retention:** Notifications must be retained for 90 days. Expired notifications are automatically archived.
- **Reliability (Idempotency):** Duplicate domain events must not result in duplicate notifications for the same user.
- **Availability:** The notification service must not act as a single point of failure for core flows.

### Assumptions & Constraints
- **Assumptions:** Users have at least one authenticated session to receive in-app notifications. Email delivery is decoupled and handled by a separate consumer, not this module.
- **Constraints:** Maximum payload size for `data_safe` is 2KB. Maximum notifications returned per page is 50.

> **Audit Finding:** Missing explicit retention rules, performance SLAs, assumptions, and constraints.
> **Impact:** The database would grow indefinitely (no pruning), degrading GET /me performance. Unbounded payload sizes could lead to database bloat. Lack of assumptions could cause developers to tightly couple email and in-app logic.

---

## 2. Notification Event Matrix

| Trigger Event (Producer) | Source Module | Target Consumer(s) | Business Rule / Payload Requirement |
| :--- | :--- | :--- | :--- |
| **Reservation Created** | Reservation (.NET) | Driver | `reservationId`, timestamp. |
| **Reservation Cancelled** | Reservation (.NET) | Driver, Staff | Include cancellation reason and `reservationId`. |
| **Reservation Expiring** | Scheduler (.NET) | Driver | Sent 15 minutes before expiration. |
| **Payment Successful** | Payment (.NET) | Driver | No full CC data. `amount`, `paymentId`. |
| **Payment Failed** | Payment (.NET) | Driver | Grace period info. No CC data. `paymentId`. |
| **Overtime Warning** | Session (.NET) | Driver | Requires user to extend or leave. |
| **Pass Expiring** | Monthly Pass (.NET) | Driver | Sent 3 days and 1 day prior. |
| **Pass Purchased** | Monthly Pass (.NET) | Driver | `passId`, valid period. |
| **Slot Reassigned** | Parking Slot (.NET) | Driver | Alert if system reassigns their reserved slot. |
| **Feedback Reply** | Feedback (Spring Boot) | Driver | Includes snippet of reply and `feedbackId`. |
| **Feedback Received** | Feedback (Spring Boot) | Staff/Manager | Triggered when a new feedback is submitted. |
| **System Maintenance** | Admin/System | All Active Users | Bulk notification, distributed via queue. |
| **Pricing Updated** | Admin/System | All Active Users | Sent when global pricing changes occur. |
| **Account Locked/Banned**| Auth (.NET) | Driver | Security alert for TOS violation. |

> **Audit Finding:** No central registry of valid notification events existed. Critical events like Payment Failure and Cancellations were missing.
> **Impact:** Frontend could not safely deep-link, and Backend could not validate event types strictly. Business critical alerts were dropped.

---

## 3. Feature Interaction Matrix

- **Reservation, Payment, Parking Session, Pricing, Monthly Pass:** Fire-and-forget domain events to the outbox. Notification module guarantees at-least-once delivery.
- **Dashboard & Reports:** Dashboard queries the unread count endpoint.
- **Feedback:** Spring Boot triggers its own internal events to generate notifications.
- **Email:** Completely isolated. Outbox events are consumed independently by an Email worker. In-app notifications do not trigger emails directly.
- **Audit Logs:** System writes to Audit Logs whenever a Staff/Admin creates a bulk notification or accesses another user's trace.
- **Public API:** Public APIs cannot access internal notifications.
- **Authentication/Authorization:** Spring Boot strictly relies on JWT `sub` to route and authorize all read queries. Roles are validated for broadcast abilities.

> **Audit Finding:** Missing interactions with Email, Public API, and strict Auth boundaries.
> **Impact:** Potential security flaw if Public API endpoints accidentally exposed internal notifications. Tightly coupled email logic would slow down API response times.

---

## 4. Notification Producers

- **.NET Core (Core API):** Main producer of transactional events via durable outbox.
- **Spring Boot (Support API):** Produces feedback-related events and internal system alerts.
- **Schedulers (.NET):** Produces time-based domain events (expiration, renewals).
- **Admin/Manager (UI):** Manually triggers broadcast announcements via the Support API.
- **System (Support Schedulers):** Produces operational notifications (e.g., failed to process batch).

> **Audit Finding:** Ownership of production was ambiguous.
> **Impact:** Developers might build duplicate schedulers in Spring Boot for domain events owned by .NET.

---

## 5. Notification Consumers

- **Driver:** Receives transactional and informational updates scoped strictly to their account.
- **Staff:** Receives incident alerts, overrides, or escalation requests for their specific building/zone.
- **Manager:** Receives aggregated alerts (e.g., "5 payments failed in the last hour").
- **Admin:** Receives critical system alerts.
- **Multiple Users:** Notifications targeting a specific role in a specific building (e.g., all Staff in Building A).
- **Entire System:** Global broadcasts to all active `users`.

> **Audit Finding:** Consumers were not detailed beyond "User".
> **Impact:** Inability to properly design targeted bulk notifications (e.g., targeting a specific building's staff).

---

## 6. Notification Lifecycle

1. **CREATED:** The domain event fires; notification is successfully persisted to the DB by the consumer.
2. **DELIVERED:** (Future) When WebSockets are added, this is when the UI receives the push. Currently implicit upon DB insert.
3. **READ:** The user clicks the notification; `read_at` is permanently set. (Or user clicks "Mark All as Read").
4. **ARCHIVED:** The user manually dismisses the notification (soft delete), OR after `expires_at` (e.g., 90 days), the scheduler sets `is_archived = TRUE`. No longer visible to the user.
5. **DELETED:** Hard delete by scheduler after 365 days of being archived to comply with GDPR/data retention policies.

> **Audit Finding:** Lifecycle transitions, especially User Archiving and Hard Deletion, were not defined.
> **Impact:** Users could not dismiss notifications. DB would violate GDPR over long periods.

---

## 7. Happy Path (End-to-End Workflow)

1. **Business Event:** Driver successfully pays for a reservation. Core API commits transaction + Outbox Event.
2. **Notification Creation:** Spring Boot consumer polls/receives the Outbox Event, extracts `userId` and `paymentId`.
3. **Database Insert:** Consumer batch-inserts a new `support_notifications` record with `is_archived=false` and `read_at=null`.
4. **Frontend Polling:** Driver's mobile app polls `GET /api/support/notifications/me/unread` every 30s.
5. **Read:** App receives `unreadCount: 1`, displays a badge. Driver opens the notification tray (`GET /api/support/notifications/me`).
6. **Update:** Driver clicks the payment notification. App sends `PATCH /api/support/notifications/{id}/read`. App navigates to `/payments/{paymentId}` using `data_safe.redirectUrl`.
7. **Completion:** DB marks `read_at = NOW()`. Unread count drops to 0.

> **Audit Finding:** Only API endpoints were documented, lacking the full system integration flow.
> **Impact:** QA engineers could not write end-to-end integration tests spanning .NET, Kafka/Outbox, and Spring Boot.

---

## 8. Unhappy Path & Failure Scenarios

| Failure Scenario | Expected System Behavior |
| :--- | :--- |
| **Database down during insert** | Consumer throws exception, outbox event remains uncommitted. Retried with exponential backoff. |
| **Notification insert failed (Validation)** | Poison pill. Event moved to Dead Letter Queue (DLQ). Alert generated. |
| **Invalid User / Deleted User** | Foreign Key (soft validation) fails. Consumer drops event, logs a warning. |
| **Permission Denied (Viewing)** | User attempts to read another user's notification. API returns `404 Not Found`. |
| **Duplicate Notification** | DB unique constraint `(event_id, recipient_id, type)` rejects insert. Consumer treats as idempotent success (200 OK). |
| **Notification Expired** | Background job archives it. User attempting to read returns `404 Not Found`. |
| **Related Entity Missing (e.g. Reservation deleted)** | Notification remains read-only for historical context. Deep link may 404 on frontend. |
| **Concurrent Update (Mark Read)** | First request succeeds. Second request yields 0 rows affected, but returns 200 OK idempotently. |
| **Network Timeout (Frontend)** | App fails to mark as read. App retries on next interaction. |
| **Server Failure during Bulk Insert** | Transaction rolls back. Background queue retries the batch from the last checkpoint. |

> **Audit Finding:** Unhappy paths were missing, leading to fragile consumers and poor error handling in the UI.
> **Impact:** Deadlocks, head-of-line blocking in consumers, and HTTP 500s on the frontend during edge cases.

---

## 9. Edge Cases

- **Large number of notifications (Mass):** Returning page 10,000 where data doesn't exist returns an empty list gracefully (`200 OK`, `items: []`).
- **Empty notification list:** Returns `200 OK` with empty `items` array. Never returns 404.
- **Read synchronization across devices:** If marked read on Web, Mobile polling will receive updated `unreadCount` and `read_at` timestamps. DB Row-Level locking prevents race conditions.
- **Pagination offset shifts:** If a new notification arrives while a user is paginating, offset shifts could cause duplicates. Cursor-based pagination (`createdAt, id`) is strictly required for the list endpoint.
- **Expired notifications during paging:** Excluded seamlessly by the database query (`WHERE expires_at > NOW()`).

> **Audit Finding:** Pagination edge cases and device synchronization were ignored.
> **Impact:** Users would see duplicate items while scrolling. Badges would desync across mobile and web.

---

## 10. Database Review & Schema

```sql
CREATE TABLE support_notifications (
    id UUID PRIMARY KEY,
    recipient_id UUID NOT NULL, -- Logical link to Core Users. No hard FK to maintain bounded context.
    event_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data_safe JSONB, -- Strict schema: { targetType: string, targetId: uuid, redirectUrl: string }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    UNIQUE(event_id, recipient_id, type) -- Idempotency key
);

-- Indexes for performance
CREATE INDEX idx_notif_recipient_created ON support_notifications (recipient_id, created_at DESC) WHERE is_archived = false;
CREATE INDEX idx_notif_recipient_unread ON support_notifications (recipient_id) WHERE read_at IS NULL AND is_archived = false AND expires_at > NOW();
CREATE INDEX idx_notif_expires_at ON support_notifications (expires_at) WHERE is_archived = false;
```

> **Audit Finding:** Missing indexing for expiration jobs, JSONB schemas, and bounded context clarity.
> **Impact:** The scheduler would perform full table scans to find expired records. Microservice boundaries would be violated by hard foreign keys.

---

## 11. Security Review

- **Authentication:** All endpoints require a valid JWT.
- **Authorization:** Application-level enforcement (`WHERE recipient_id = JWT.sub`).
- **Horizontal Privilege Escalation:** Prevented by strictly using JWT `sub` for all queries. Users cannot pass a `userId` in the URL/body.
- **Vertical Privilege Escalation:** Broadcast APIs require `ADMIN` or `MANAGER` roles validated via Spring Security.
- **Data Leakage:** No PII, PCI data, or payment tokens in `title`, `body`, or `data_safe`.
- **XSS Prevention:** Frontend must sanitize `body` and `title`. Backend strictly validates length (Title < 255, Body < 1000) and strips HTML tags before DB insert.

> **Audit Finding:** Privilege escalation and XSS rules were loosely defined.
> **Impact:** Malicious actors could inject HTML into feedback replies, executing XSS on Staff dashboards.

---

## 12. Scheduler Jobs

- **Job 1: Expiry Cleanup:** Runs daily at 02:00 UTC. Sets `is_archived = TRUE` for rows where `expires_at < NOW()`.
- **Job 2: Bulk Notification Processor:** Processes queued announcements in batches of 500 to prevent DB locks.
- **Job 3: Hard Delete Purge:** Runs monthly. `DELETE FROM support_notifications WHERE is_archived = TRUE AND updated_at < NOW() - INTERVAL '365 days'`.
- **Job 4: DLQ Retry:** Runs hourly to attempt reprocessing of failed events in the Dead Letter Queue.

> **Audit Finding:** Hard deletion and DLQ retry jobs were missing.
> **Impact:** Unrecoverable transient failures and GDPR violations due to infinite data retention.

---

## 13. Duplicate Prevention & Bulk Notification

- **Duplicate Prevention:** The unique constraint `(event_id, recipient_id, type)` acts as the idempotency key. If a consumer crashes and replays an event, the DB rejects the duplicate. The consumer must catch this `UniqueConstraintViolationException` and acknowledge the message successfully.
- **Bulk Deliveries (Scalability):** 
  - Admin submits a Broadcast event for 100,000 users.
  - The API immediately returns `202 Accepted`.
  - A background queue splits the users into chunks of 1,000.
  - Workers use JDBC Batch Inserts to stream the notifications into the DB, ensuring low memory footprint and preventing table locks.

> **Audit Finding:** Details on handling unique constraint violations in consumers and batch insert mechanics were absent.
> **Impact:** Consumer loops continually crashing on duplicates. HTTP timeouts on broadcast requests.

---

## 14. Delivery Strategy & Navigation

- **Current Strategy:** Client polling (every 30s) and on-load fetching.
- **Future Strategy:** Server-Sent Events (SSE) or WebSockets for real-time delivery to active sessions.
- **Navigation (Deep Linking):** 
  The `data_safe` JSONB *must* adhere to:
  `{ "targetType": "RESERVATION", "targetId": "uuid", "redirectUrl": "/reservations/uuid" }`
  Frontend routes solely based on `redirectUrl`.

> **Audit Finding:** Navigation payload schema was inconsistent.
> **Impact:** Broken links on mobile and web clients when clicking notifications.

---

## 15. Business Rules

- **Ownership:** Only the owner (JWT `sub`) can read, update, or archive their notification.
- **Immutability:** Once created, a notification's `title`, `body`, and `data_safe` cannot be updated. Only `read_at` and `is_archived` can change.
- **Read Once:** Notifications can only be marked as read once. Subsequent requests are idempotent.
- **Delete Permission:** Users cannot hard-delete notifications. They can only archive them (hide from view).

> **Audit Finding:** Immutability and archiving business rules were not formalized.
> **Impact:** Risk of developers creating PUT endpoints that allow modifying notification content, ruining auditability.

---

## 16. Audit Review

- **User Actions:** Standard read operations (GET/PATCH) are NOT audited to save space, but metrics are collected.
- **System/Admin Actions:** Bulk notification dispatch by Admin MUST be logged in the centralized Audit Logs.
- **Support Actions:** If a support agent views another user's notifications via an Admin Dashboard (e.g., impersonation/troubleshooting), an explicit `SupportReadTrace` audit event is fired.

---

## 17. Error Matrix

| HTTP | Business Code | Message | Recovery / Action |
| :--- | :--- | :--- | :--- |
| 400 | `NOTIF_INVALID_FILTER` | Invalid date range or type filter. | User corrects input. |
| 400 | `NOTIF_PAYLOAD_TOO_LARGE` | Notification payload exceeds 2KB. | System/Producer corrects payload. |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT. | Refresh token or re-login. |
| 403 | `FORBIDDEN` | Missing Admin/Manager role for broadcast. | Deny action. |
| 404 | `NOTIF_NOT_FOUND` | ID not found or not owned by user. | Ignore / refresh list. |
| 422 | `NOTIF_UNSUPPORTED_TYPE` | Event type not recognized. | DLQ routing; Developer action required. |
| 500 | `NOTIF_DB_ERROR` | Transient database failure. | Client implements exponential backoff. |

> **Audit Finding:** Missing payload size and 403 Forbidden errors.
> **Impact:** Inconsistent error handling across frontend clients.

---

## 18. Performance Review

- **Pagination:** Cursor-based pagination must be used for lists to prevent N+1 and offset drift.
- **N+1 Queries:** The API strictly avoids N+1 by using aggregate SQL queries for `unreadCount` and a single snapshot for items.
- **Caching:** The `unreadCount` can be cached in Redis with a 15-second TTL per `recipient_id`. Cache invalidates on `PATCH /read`.
- **Query Optimization:** Strict use of compound indexes (`recipient_id` + `is_archived` + `created_at`).

> **Audit Finding:** Did not enforce cursor-based pagination or index coverage details.
> **Impact:** Significant performance degradation as a user's notification history grows.

---

## 19. Future Improvements (Enterprise-Grade)

- **WebSockets / SSE:** Implement a real-time push mechanism to avoid UI polling and reduce server load.
- **FCM / APNs Integration:** Mobile push notifications for offline users (via Firebase Cloud Messaging).
- **User Preferences:** Opt-in/out toggles for specific notification types (e.g., "Mute marketing announcements").
- **Notification Aggregation:** Grouping similar notifications (e.g., "You have 5 new feedback replies").

---
---

# AI Implementation Guide: Notification Dispatch

**Target Path:** Notifications > Notification Dispatch (`leaf-notif-dispatch`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API / System  
**API:** internal Core outbox consumer

## 1. Summary / Objective
Convert committed domain events into one or more durable in-app recipient notifications.

## 6. Main Flow (Happy Path)
1. Consumer reads event from Kafka/RabbitMQ/Outbox table.
2. System validates schema and payload safety (Max 2KB).
3. System resolves recipient and template (e.g., "Your reservation {id} is confirmed").
4. System batch-inserts into `support_notifications` with `expires_at = NOW() + 90 days`.
5. Checkpoint/offset is committed atomically.

## 8. Failure Flows (Unhappy Path)
- **Database Down:** Transient persistence failure triggers exponential backoff retries.
- **Poison Message / Schema Mismatch:** Payload fails validation, immediately routed to DLQ to prevent blocking the queue. Alert operations.
- **Duplicate Event Received:** Unique constraint `(event_id, recipient_id, type)` triggers a silent consumer acknowledgement (idempotent skip).
- **User Not Found:** Soft validation fails. Move to DLQ.

> **Audit Finding:** Unhappy paths like DLQ routing and specific DB transient error handling were missing.
> **Impact:** A single malformed event could indefinitely block the consumer (Head-of-Line blocking).

---

# AI Implementation Guide: User Notifications

**Target Path:** Notifications > User Notifications (`leaf-notif-user`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Driver, Staff, Manager, Admin  
**API:** `GET /api/support/notifications/me`

## 1. Summary / Objective
List notifications belonging to the authenticated user using cursor-based pagination.

## 6. Main Flow (Happy Path)
1. Request arrives with valid JWT. Extract `sub` as `recipientId`.
2. Filter `is_archived = false AND expires_at > NOW()`.
3. Apply cursor-based pagination (`cursor=timestamp_uuid`, `limit=50`).
4. Return 200 OK with `items` and `nextCursor`.

## 7. Alternative & Edge Cases
- **Empty List:** Returns `200 OK` with empty `items` array. Do not return 404.
- **Expired while paging:** Automatically excluded by the query.

> **Audit Finding:** Missing edge cases regarding pagination offsets during active expiration.
> **Impact:** Users could see duplicate notifications across pages if standard offset paging was used while rows expired.

---

# AI Implementation Guide: Unread Notifications

**Target Path:** Notifications > Unread Notifications (`leaf-notif-unread`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Driver, Staff, Manager, Admin  
**API:** `GET /api/support/notifications/me/unread`

## 1. Summary / Objective
Return unread own notifications and unread count for an indicator/feed.

## 6. Main Flow (Happy Path)
1. Extract `sub`.
2. Check Redis Cache for `unreadCount:{sub}`. If miss, query DB.
3. Execute single transaction/snapshot query: `COUNT(*)` and `SELECT ... LIMIT {pageSize}` where `read_at IS NULL AND is_archived = false`.
4. Return `unreadCount` and `items`.

## 8. Failure Flows & Edge Cases
- **Concurrent Mark Read:** If a separate thread marks an item read during this fetch, the database snapshot isolation ensures the count and items match the exact `asOf` timestamp. Next UI poll will reconcile.
- **Count > 99:** UI should display "99+", but backend returns exact count.

> **Audit Finding:** Concurrency edge cases and read synchronization across devices were not defined.
> **Impact:** Inconsistent UI states (e.g., badge shows 1, but list shows 0 unread) leading to user confusion.

---

# AI Implementation Guide: Mark Notification as Read

**Target Path:** Notifications > Mark Notification as Read (`leaf-notif-read`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Driver, Staff, Manager, Admin  
**API:** `PATCH /api/support/notifications/{id}/read`

## 1. Summary / Objective
Mark one own notification read once, safely under retries.

## 6. Main Flow (Happy Path)
1. Extract `sub`.
2. Execute `UPDATE support_notifications SET read_at = NOW() WHERE id = {id} AND recipient_id = {sub} AND read_at IS NULL`.
3. Clear Redis Cache `unreadCount:{sub}`.
4. Return 200 OK with `{id, readAt}`.

## 7. Alternative Flows & Edge Cases
- **Duplicate Clicks (Idempotency):** If user double-clicks, the second request yields `rows affected = 0`. Backend falls back to `SELECT read_at`, returning 200 OK with the *original* `readAt`.

> **Audit Finding:** Duplicate clicks (race conditions) were not strictly addressed for the PATCH endpoint.
> **Impact:** HTTP 500s or incorrect unread counts if a user multi-clicked the notification on a slow network.

---

# AI Implementation Guide: Mark All as Read (NEW)

**Target Path:** Notifications > Mark All Read (`leaf-notif-read-all`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Driver, Staff, Manager, Admin  
**API:** `PATCH /api/support/notifications/read-all`

## 1. Summary / Objective
Mark all unread notifications for the user as read.

## 6. Main Flow
1. Extract `sub`.
2. Execute `UPDATE support_notifications SET read_at = NOW() WHERE recipient_id = {sub} AND read_at IS NULL AND is_archived = FALSE`.
3. Clear Redis Cache `unreadCount:{sub}`.
4. Return 200 OK with `rowsAffected`.

---

# AI Implementation Guide: Archive Notification (NEW)

**Target Path:** Notifications > Archive Notification (`leaf-notif-archive`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Driver, Staff, Manager, Admin  
**API:** `DELETE /api/support/notifications/{id}`

## 1. Summary / Objective
Allows a user to dismiss/hide a notification (soft delete).

## 6. Main Flow
1. Extract `sub`.
2. Execute `UPDATE support_notifications SET is_archived = TRUE WHERE id = {id} AND recipient_id = {sub}`.
3. Decrement cache if `read_at` was NULL.
4. Return 204 No Content.

## 8. Failure Flows
- **Foreign ID:** Return `404 NOT_FOUND` to prevent ownership disclosure.

---
**Readiness Verification:** **READY FOR IMPLEMENTATION**.

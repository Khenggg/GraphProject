# Category: Notifications (System-Level Specification)

> **Audit Finding:** The previous specification lacked a centralized, high-level system overview. It focused entirely on API contracts.
> **Impact:** Developers and QA would miss the bigger picture (bulk notifications, scheduler logic, interaction with other modules), leading to integration bugs and unscalable designs.

**Shared decisions:** SDR-03/04/08/10/19 apply. Support owns notification records/read models; Core publishes durable outbox events only. The seed routes with `{userId}` are replaced by `/api/support/notifications/me`; a legacy route, if retained, must reject any ID different from JWT `sub` and is not the implementation target.

---

## 1. Business Requirements

### Functional Requirements
- The system must deliver in-app notifications to targeted users (Driver, Staff, Manager, Admin) based on domain events.
- Users must be able to view their notifications, see an unread count, and mark notifications as read.
- The system must handle real-time generation (polling/eventual consistency for now) without blocking the primary business workflows (e.g., Payment, Reservation).

### Non-Functional Requirements
- **Performance:** Notification API endpoints must respond in < 150ms.
- **Scalability:** The system must efficiently handle bulk notification generation (e.g., 10,000+ users for system announcements).
- **Retention:** Notifications must be retained for 90 days. Expired notifications are automatically archived/purged.

> **Audit Finding:** Explicit retention rules and performance SLAs were missing.
> **Impact:** The database would grow indefinitely (no pruning), eventually degrading GET /me performance.

---

## 2. Notification Event Matrix

| Trigger Event (Producer) | Source Module | Target Consumer(s) | Business Rule / Payload Requirement |
| :--- | :--- | :--- | :--- |
| **Reservation Created** | Reservation (.NET) | Driver | `reservationId`, timestamp. |
| **Reservation Expiring** | Scheduler (.NET) | Driver | Sent 15 minutes before expiration. |
| **Payment Successful** | Payment (.NET) | Driver | No full CC data. `amount`, `paymentId`. |
| **Overtime Warning** | Session (.NET) | Driver | Requires user to extend or leave. |
| **Pass Expiring** | Monthly Pass (.NET) | Driver | Sent 3 days and 1 day prior. |
| **Feedback Reply** | Feedback (Spring Boot) | Driver | Includes snippet of reply. |
| **System Maintenance** | Admin/System | All Active Users | Bulk notification, distributed via queue. |

> **Audit Finding:** No central registry of valid notification events existed.
> **Impact:** Frontend could not safely deep-link, and Backend could not validate event types strictly.

---

## 3. Feature Interaction Matrix

- **Reservation & Payment & Parking Session:** Fire-and-forget domain events to outbox. Notification module guarantees at-least-once delivery.
- **Dashboard & Reports:** Dashboard queries the unread count endpoint.
- **Audit Logs:** System writes to Audit Logs whenever a Staff/Admin creates a bulk notification or accesses another user's trace.
- **Authentication:** Spring Boot strictly relies on JWT `sub` to route and authorize all read queries.

---

## 4. Notification Producers
- **.NET Core (Core API):** Main producer of transactional events via durable outbox.
- **Spring Boot (Support API):** Produces feedback/system-related events.
- **Schedulers:** Produces time-based reminders (expiration, renewals).
- **Admin/Manager:** Manually triggers broadcast announcements.

---

## 5. Notification Consumers
- **Driver:** Receives transactional and informational updates.
- **Staff/Manager:** Receives incident alerts, overrides, or escalation requests.
- **Entire System:** Receives global announcements.

---

## 5.5 Notification Lifecycle
1. **CREATED:** The domain event fires; notification is successfully persisted to the DB via consumer.
2. **DELIVERED:** (Future) When WebSockets are added, this is when the UI receives the push. Currently implicit upon DB insert.
3. **READ:** The user clicks the notification; `read_at` is permanently set.
4. **ARCHIVED:** After `expires_at` (e.g., 90 days), the scheduler sets `is_archived = TRUE`. No longer visible to user.
5. **DELETED:** (Optional) Hard delete after 365 days of being archived to comply with GDPR/data retention policies.

---

## 6. Database Review & Schema

```sql
CREATE TABLE support_notifications (
    id UUID PRIMARY KEY,
    recipient_id UUID NOT NULL,
    event_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data_safe JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    UNIQUE(event_id, recipient_id, type) -- Idempotency key
);

-- Indexes for performance
CREATE INDEX idx_notif_recipient_created ON support_notifications (recipient_id, created_at DESC) WHERE is_archived = false;
CREATE INDEX idx_notif_recipient_unread ON support_notifications (recipient_id) WHERE read_at IS NULL AND is_archived = false AND expires_at > NOW();
```

> **Audit Finding:** Missing explicit indexing strategies, archiving column, and JSONB structure definitions.
> **Impact:** Inefficient queries for unread counts (N+1 risks) and pagination bottlenecks on large datasets.

---

## 7. Scheduler Jobs

- **Job 1: Expiry Cleanup:** Runs daily at 02:00 UTC. Sets `is_archived = TRUE` for rows where `expires_at < NOW()`.
- **Job 2: Bulk Notification Processor:** Processes queued announcements in batches of 500 to prevent DB locks.

> **Audit Finding:** Background maintenance logic was absent.
> **Impact:** Database bloat and timeouts when sending alerts to >10,000 users.

---

## 8. Duplicate Prevention & Bulk Notification
- **Idempotency:** A unique constraint on `(event_id, recipient_id, type)` ensures consumers can safely retry processing without double-notifying.
- **Bulk Deliveries:** Instead of inserting 100,000 rows inline, a Bulk Announcement event is queued. A background worker streams user IDs and batch-inserts notifications to prevent memory exhaustion and HTTP timeouts.

---

## 9. Security Review
- **Authentication:** Must require valid JWT.
- **Authorization:** strict row-level security (RLS) or application-level enforcement (`WHERE recipient_id = JWT.sub`).
- **Data Leakage:** No PII or payment tokens in `data_safe`.
- **XSS Prevention:** Frontend must sanitize `body` and `title`. Backend strictly validates length and forbids HTML tags.

> **Audit Finding:** Security considerations around data leakage (credit card tokens in notifications) were vague.
> **Impact:** High risk of compliance breach (PCI-DSS) if a payment event leaks card details into a plain-text notification.

---

## 10. Error Matrix

| HTTP | Business Code | Message | Recovery / Action |
| :--- | :--- | :--- | :--- |
| 400 | `NOTIF_INVALID_FILTER` | Invalid date range or type filter. | User corrects input. |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT. | Refresh token or re-login. |
| 404 | `NOTIF_NOT_FOUND` | ID not found or not owned by user. | Ignore / refresh list. |
| 422 | `NOTIF_UNSUPPORTED_TYPE` | Event type not recognized. | Developer action required. |
| 500 | `NOTIF_DB_ERROR` | Transient database failure. | Client implements exponential backoff. |

---

## 10.5 Audit Review
- **User Actions:** Standard read operations (GET/PATCH) are NOT audited to save space, but metrics are collected.
- **System/Admin Actions:** Bulk notification dispatch by Admin MUST be logged in the centralized Audit Logs.
- **Support Actions:** If a support agent views another user's notifications (e.g., impersonation/troubleshooting), an explicit `SupportReadTrace` audit event is fired.

---

## 10.6 Performance Review
- **N+1 Queries:** The API strictly avoids N+1 by using aggregate SQL queries for `unreadCount` and a single snapshot for items.
- **Caching:** The unread count can be cached in Redis with a 15-second TTL per `recipient_id`.
- **Polling Frequency:** If polling is used, clients must poll no faster than every 30 seconds to prevent DB saturation.

---

## 11. Delivery Strategy & Navigation
- **Current Strategy:** Client polling and on-load fetching.
- **Navigation (Deep Linking):** The `data_safe` JSONB must contain `{ "targetType": "RESERVATION", "targetId": "uuid", "redirectUrl": "/reservations/uuid" }` to allow consistent frontend routing.

---

## 12. Future Improvements (Enterprise-Grade)
- **WebSockets / SSE:** Implement a real-time push mechanism to avoid UI polling and reduce server load.
- **FCM / APNs Integration:** Mobile push notifications for offline users.
- **User Preferences:** Opt-in/out toggles for specific notification types.

---
---

# AI Implementation Guide: Notification Dispatch

**Target Path:** Notifications > Notification Dispatch (`leaf-notif-dispatch`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API / System  
**API:** internal Core outbox consumer

## 1. Summary / Objective
Convert committed domain events into one or more durable in-app recipient notifications.

## 2. Scope
Event consume/template/render/persist/retry; no direct Core-table mutation or external channel delivery.

## 3. Actors / Roles / Permissions
System consumer only.

## 4. Preconditions
Valid versioned Core outbox event with recipient/record context and supported event type.

## 5. Postconditions
One deduplicated notification per recipient/event/template version or a recorded terminal processing failure.

## 6. Main Flow (Happy Path)
1. Consumer reads event from Kafka/RabbitMQ/Outbox table.
2. System validates schema and payload safety.
3. System resolves recipient and template (e.g., "Your reservation {id} is confirmed").
4. System batch-inserts into `support_notifications` with `expires_at = NOW() + 90 days`.
5. Checkpoint/offset is committed atomically.

## 7. Alternative Flows
- **Unsupported event:** Parked/observable in a dead-letter queue (DLQ) without blocking consumer progress.
- **Inactive Recipient:** Persist only if policy dictates operational notice (e.g., compliance); otherwise skip and log.

## 8. Failure Flows (Unhappy Path)
- **Database Down:** Transient persistence failure triggers exponential backoff retries.
- **Poison Message / Schema Mismatch:** Payload fails validation, immediately routed to DLQ to prevent blocking the queue. Alert operations.
- **Duplicate Event Received:** Unique constraint `(event_id, recipient_id)` triggers a silent `200 OK` (idempotent skip).

> **Audit Finding:** Unhappy paths like DLQ routing and specific DB transient error handling were missing.
> **Impact:** A single malformed event could indefinitely block the consumer (Head-of-Line blocking).

## 9. Business Rules
Templates must not include raw tokens/payment secrets/full card data. Only safe identifiers (`targetId`). 

## 10. API Contracts
Internal event `{eventId,type,occurredAt,aggregateId,aggregateVersion,recipientIds,payloadSafe}`.

---

# AI Implementation Guide: User Notifications

**Target Path:** Notifications > User Notifications (`leaf-notif-user`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Driver, Staff, Manager, Admin  
**API:** `GET /api/support/notifications/me`

## 1. Summary / Objective
List notifications belonging to the authenticated user.

## 6. Main Flow (Happy Path)
1. Request arrives with valid JWT.
2. Extract `sub` as `recipientId`.
3. Filter `is_archived = false AND expires_at > NOW()`.
4. Apply pagination (`page`, `pageSize`) and newest-first sorting.
5. Return 200 OK with `items` and `pagination` metadata.

## 7. Alternative & Edge Cases
- **Empty List:** Returns `200 OK` with empty `items` array and `total=0`. Do not return 404.
- **Mass Notifications (Pagination):** Requesting page 10,000 where data doesn't exist returns empty list gracefully.
- **Expired while paging:** If a notification expires between fetching page 1 and page 2, it is excluded. Paging uses stable cursors (`createdAt, id`) if possible to prevent offset shifting.

> **Audit Finding:** Missing edge cases regarding pagination offsets during active expiration.
> **Impact:** Users could see duplicate notifications across pages if standard offset paging was used while rows expired.

## 8. Failure Flows (Unhappy Path)
- **Invalid filters:** Return 400 `NOTIF_INVALID_FILTER`.
- **Database timeout:** Return 500, UI implements retry mechanism.

---

# AI Implementation Guide: Unread Notifications

**Target Path:** Notifications > Unread Notifications (`leaf-notif-unread`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Driver, Staff, Manager, Admin  
**API:** `GET /api/support/notifications/me/unread`

## 1. Summary / Objective
Return unread own notifications and unread count for an indicator/feed.

## 6. Main Flow (Happy Path)
1. Extract `sub`.
2. Execute single transaction/snapshot query: `COUNT(*)` and `SELECT ... LIMIT {pageSize}` where `read_at IS NULL AND is_archived = false`.
3. Return `unreadCount` and `items`.

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
3. If rows affected = 1, fetch current unread count.
4. Return 200 OK with `{id, readAt, unreadCount}`.

## 7. Alternative Flows & Edge Cases
- **Duplicate Clicks (Idempotency):** If user double-clicks, the second request yields `rows affected = 0`. Backend falls back to `SELECT read_at`, returning 200 OK with the *original* `readAt`.
- **Multiple Devices:** If device A and device B mark read simultaneously, DB row-level locking ensures only one sets `readAt`. The other behaves idempotently.

> **Audit Finding:** Duplicate clicks (race conditions) were not strictly addressed for the PATCH endpoint.
> **Impact:** HTTP 500s or incorrect unread counts if a user multi-clicked the notification on a slow network.

## 8. Failure Flows (Unhappy Path)
- **Foreign/Missing/Expired ID:** Returns `404 NOT_FOUND` to prevent ownership disclosure (avoid 403, which leaks existence).
- **Deleted User / Inactive Session:** JWT middleware intercepts with `401/403`.

---
**Readiness Verification:** **READY FOR IMPLEMENTATION**.

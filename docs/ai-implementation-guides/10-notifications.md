# Category: Notifications (System-Level Specification)

> **Audit Finding:** The previous specification lacked a centralized, high-level system overview. It focused entirely on API contracts.
> **Impact:** Developers and QA would miss the bigger picture (bulk notifications, scheduler logic, interaction with other modules), leading to integration bugs and unscalable designs.

**Shared decisions:** SDR-03/04/08/10/19 apply. Support owns notification records/read models; Core publishes durable outbox events only. The seed routes with `{userId}` are replaced by `/api/support/notifications/me`; a legacy route, if retained, must reject any ID different from JWT `sub` and is not the implementation target.

---

## 1. Business Objective

### 1.1 Why Notification Exists

The Parking Building Management System (PBMS) is a multi-actor, multi-workflow platform spanning Reservations, Payments, Parking Sessions, Monthly Passes, Pricing, Vehicles, Feedback, and Administration. Business events in one module directly affect users in another module in real-time.

Without a Notification Module, users have no awareness of events affecting them unless they actively poll every status screen. This creates:

- **Missed business actions**: A Driver with a payment deadline does not know when it is about to expire and loses their reservation.
- **Degraded trust**: A Driver whose slot was reassigned has no explanation.
- **Staff blindness**: Staff have no visibility when an incoming vehicle requires an exception.
- **Admin ignorance**: Administrators cannot broadcast maintenance windows or policy changes to all active users.

The Notification Module solves these problems by providing a unified, durable, in-app, role-scoped notification channel that bridges all PBMS business modules.

### 1.2 Which Business Problems It Solves

| Problem | How Notification Solves It |
| :--- | :--- |
| Driver misses payment deadline | Notification dispatched on Reservation Created, warning sent before deadline |
| Driver does not know slot was reassigned | Notification dispatched on Slot Reassigned |
| Driver forgets monthly pass is expiring | Notification dispatched 3 days and 1 day prior to expiry |
| Driver unaware payment failed | Notification dispatched immediately on Payment Failed |
| Staff has no alert for feedback assigned to them | Notification dispatched on Feedback Received / Assigned |
| Admin cannot broadcast system alerts | Bulk broadcast notification to all active users |
| Manager unaware pass application is pending | Notification dispatched on Pass Application Submitted |
| Driver unaware pricing changed | Notification dispatched on Pricing Updated |
| Driver unaware account was locked | Security notification dispatched on Account Locked |

### 1.3 Which Modules Generate Notifications

| Producing Module | Service | Events Produced |
| :--- | :--- | :--- |
| Reservation | .NET Core API | Created, Cancelled, Expiring, Expired, Slot Reassigned, Extended |
| Payment | .NET Core API | Successful, Failed, Waived, Under Review |
| Parking Session | .NET Core API | Started, Overtime Warning, Completed |
| Monthly Pass | .NET Core API | Application Submitted, Approved, Rejected, Purchased/Activated, Expiring, Expired, Renewed, Suspended, Card Bound |
| Pricing | .NET Core API | Price Rule Updated |
| Authentication | .NET Core API | Account Locked, Account Unlocked, Password Changed |
| Feedback | Spring Boot Support API | Feedback Received, Feedback Assigned, Feedback Responded, Feedback Closed, Feedback Rejected |
| System / Admin | Spring Boot Support API | System Announcement, Maintenance Notice, Emergency Notice |
| Scheduler (.NET) | .NET Core API | Reservation Expiring (15 min warning), Pass Expiring (3d / 1d warning) |
| Scheduler (Spring Boot) | Spring Boot Support API | Notification Expiry Cleanup, DLQ Retry |

### 1.4 Which Users Receive Notifications

| Role | Description | Example Notifications |
| :--- | :--- | :--- |
| **Driver** | Primary transactional recipient | Reservation Created, Payment Success, Pass Expiring |
| **Staff** | Operational alerts at gate/desk | Feedback Assigned, Overtime Warning Escalation |
| **Manager** | Aggregated and supervisory alerts | Pass Application Submitted, Feedback Received, Payment Under Review |
| **Admin** | System-level and security alerts | Account Locked, System Announcement |
| **All Active Users** | Broadcast notifications | System Maintenance, Emergency Notice, Pricing Updated |

---

## 2. Business Scope

### 2.1 In Scope

- In-app notification delivery via REST polling (client-initiated).
- Notification creation by consuming outbox events from .NET Core API.
- Notification creation by internal Spring Boot business logic (Feedback, System Announcements).
- Unread count badge for all authenticated user roles.
- Paginated notification list (cursor-based) per authenticated user.
- Mark single notification as read (idempotent).
- Mark all notifications as read (bulk).
- Archive (soft-delete / dismiss) a single notification.
- Bulk broadcast notification to all active users (Admin / Manager role required).
- Notification lifecycle management (Created → Unread → Read → Archived → Hard Deleted).
- Automatic expiry and archival after 90 days (scheduler).
- Hard deletion of archived notifications after 365 days (GDPR compliance scheduler).
- Idempotent duplicate prevention via unique constraint `(event_id, recipient_id, type)`.
- Security: JWT authentication, application-level row ownership enforcement.
- Audit logging for Admin/Manager broadcast actions.
- Role-scoped broadcast targeting (specific role, specific building, or global).

### 2.2 Out of Scope

- Email notification delivery (handled by a separate email consumer outside this module).
- SMS delivery.
- Mobile push notifications (FCM / APNs) — **Future Enhancement only**.
- WebSocket / Server-Sent Events (SSE) real-time delivery — **Future Enhancement only**.
- Notification templates with rich HTML/media.
- User notification preference management (opt-in/opt-out per type) — **Future Enhancement only**.
- Notification analytics / delivery reports.
- Public API access to notifications (internal in-app only).
- Hard delete by user (users can only archive/dismiss).
- Admin viewing another user's individual notifications (audit trace only, no impersonation browse).

### 2.3 Assumptions

| # | Assumption |
| :--- | :--- |
| A1 | Users have at least one authenticated active session to receive in-app notifications. |
| A2 | Email notification delivery is fully decoupled and handled by a separate email consumer. The Notification Module does NOT trigger emails. |
| A3 | The outbox pattern used by .NET Core API guarantees at-least-once event delivery to Spring Boot. |
| A4 | `event_id` in every outbox event is a stable UUID generated at the point of commit, surviving retries. |
| A5 | Clock synchronization between .NET and Spring Boot services uses UTC exclusively. |
| A6 | Notification data (`title`, `body`, `data_safe`) never contains PII, PCI data, or raw payment credentials. |
| A7 | The frontend polls `/me/unread` every 30 seconds when the user session is active. |
| A8 | Cursor-based pagination is the required standard; offset-based pagination is rejected for the notification list endpoint. |
| A9 | Redis is available for optional unread count caching with 15-second TTL. If Redis is unavailable, the system falls back to direct DB query. |
| A10 | The "bulk broadcast" operation targets `users` table active records in the shared PostgreSQL database. |

### 2.4 Constraints

| # | Constraint |
| :--- | :--- |
| C1 | Maximum payload size for `data_safe` is 2 KB (2048 bytes) per notification record. |
| C2 | Maximum notifications returned per page is 50 items. |
| C3 | `title` must not exceed 255 characters. |
| C4 | `body` must not exceed 1000 characters. |
| C5 | HTML tags are strictly prohibited in `title`, `body`, and `data_safe`. Backend strips and rejects them before persistence. |
| C6 | Notifications must be retained for 90 days before archival. Archived records must be retained for 365 days before hard deletion. |
| C7 | No Message Queue (Kafka, RabbitMQ) is introduced. Communication uses REST + Outbox pattern polling. |
| C8 | No WebSocket or SSE is introduced in the current implementation phase. |
| C9 | No Redis / cache infrastructure is mandatory for MVP. Redis is an optional performance enhancement. |
| C10 | Bulk broadcast to 100,000+ users must use batch DB inserts (batch size 500) to prevent table locks and OOM. |

### 2.5 Dependencies

| Dependency | Type | Description |
| :--- | :--- | :--- |
| PostgreSQL (shared) | Infrastructure | Single source of truth for notification records and user data. |
| .NET Core API | Producer | Publishes outbox events for all transactional domain events. |
| Spring Boot Support API | Owner | Owns notification read/write models and business logic. |
| JWT Auth Provider | Security | All notification endpoints require a valid JWT from the same auth provider. |
| Redis (optional) | Performance | Caches `unreadCount` per `recipient_id` with 15-second TTL. |
| `users` table | Data | `recipient_id` is a logical reference to Core users (no hard FK). |
| Outbox/event table | Integration | Spring Boot polls or consumes events produced by .NET Core. |

---

## 3. Notification Event Matrix

Complete registry of all PBMS business events that produce notifications.

| # | Business Event | Trigger | Producer Module | Receiver Role(s) | Notification Type | Priority | Business Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| E01 | **Reservation Created** | Driver successfully creates a reservation (PENDING_PAYMENT state) | Reservation (.NET) | Driver | `RESERVATION` | NORMAL | Includes reservation code, location summary, payment deadline. No payment amounts in body. |
| E02 | **Reservation Confirmed** | Reservation moves to CONFIRMED after payment verified | Payment (.NET) | Driver | `RESERVATION` | NORMAL | Notify Driver that slot is confirmed. Include location and time window. |
| E03 | **Reservation Cancelled** | Driver or system cancels a reservation | Reservation (.NET) | Driver | `RESERVATION` | NORMAL | Include cancellation reason if provided. Notify only reservation owner. |
| E04 | **Reservation Expiring (15-min warning)** | Scheduler: 15 minutes before payment deadline expires | Scheduler (.NET) | Driver | `RESERVATION` | HIGH | Sent only once. If Driver pays before expiry, no second warning. |
| E05 | **Reservation Expired** | Reservation auto-expires due to unpaid deadline | Expiry Worker (.NET) | Driver | `RESERVATION` | HIGH | Inform Driver that booking was released. Include reservation code. |
| E06 | **Reservation Extended** | Driver extends reservation window | Reservation (.NET) | Driver | `RESERVATION` | NORMAL | Include new end time and incremental payment amount. |
| E07 | **Slot Reassigned** | System or Staff reassigns a reserved slot to another location | Parking Config (.NET) | Driver | `RESERVATION` | HIGH | Alert Driver immediately. Include old slot, new slot, reason. |
| E08 | **Payment Successful** | Provider webhook confirms settlement | Payment (.NET) | Driver | `PAYMENT` | NORMAL | Include masked amount, payment reference. No CC data, no provider secrets. |
| E09 | **Payment Failed** | Provider reports payment failure or reconciliation fails | Payment (.NET) | Driver | `PAYMENT` | HIGH | Include amount due, retry guidance. No raw provider error codes to Driver. |
| E10 | **Payment Waived** | Manager approves zero settlement | Payment (.NET) | Driver | `PAYMENT` | NORMAL | Include waived amount, approver role (not name). |
| E11 | **Payment Under Review** | Discrepancy detected; payment enters UNDER_REVIEW | Payment (.NET) | Driver, Manager | `PAYMENT` | HIGH | Driver notified about hold. Manager notified to review queue. |
| E12 | **Parking Session Started** | Vehicle successfully enters parking (gate opens) | Parking Session (.NET) | Driver | `PARKING_SESSION` | NORMAL | Include entry time, location, expected exit by. |
| E13 | **Overtime Warning** | Session exceeds reserved window by configured threshold | Parking Session (.NET) | Driver | `PARKING_SESSION` | HIGH | Requires immediate action (extend or leave). Include current time and overage. |
| E14 | **Parking Session Completed** | Vehicle exits; session closed | Parking Session (.NET) | Driver | `PARKING_SESSION` | NORMAL | Include duration, final fee amount. |
| E15 | **Monthly Pass Application Submitted** | Driver submits a monthly pass application | Monthly Pass (.NET) | Driver (confirm), Manager (action) | `MONTHLY_PASS` | NORMAL | Driver: submission confirmation. Manager: new item in review queue. |
| E16 | **Monthly Pass Application Under Review** | Manager moves application to UNDER_REVIEW | Monthly Pass (.NET) | Driver | `MONTHLY_PASS` | NORMAL | Inform Driver that review started, evidence may be requested. |
| E17 | **Monthly Pass Application Approved** | Manager approves application | Monthly Pass (.NET) | Driver | `MONTHLY_PASS` | HIGH | Include payment link / amount due. Action required to activate. |
| E18 | **Monthly Pass Application Rejected** | Manager rejects application | Monthly Pass (.NET) | Driver | `MONTHLY_PASS` | NORMAL | Include rejection reason summary. Sanitized, no internal notes. |
| E19 | **Monthly Pass Purchased / Activated** | Payment webhook confirms pass payment | Monthly Pass (.NET) | Driver | `MONTHLY_PASS` | HIGH | Include pass period, vehicle, card bound (if already assigned). |
| E20 | **Monthly Pass Card Bound** | Manager binds a physical card to an active pass | Monthly Pass (.NET) | Driver | `MONTHLY_PASS` | NORMAL | Include masked card identifier and pass validity period. |
| E21 | **Monthly Pass Expiring (3-day warning)** | Scheduler: 3 days before pass expiry | Scheduler (.NET) | Driver | `MONTHLY_PASS` | HIGH | Sent once at 3-day threshold per pass. |
| E22 | **Monthly Pass Expiring (1-day warning)** | Scheduler: 1 day before pass expiry | Scheduler (.NET) | Driver | `MONTHLY_PASS` | HIGH | Sent once at 1-day threshold per pass. |
| E23 | **Monthly Pass Expired** | Pass reaches expiry date without renewal | Expiry Worker (.NET) | Driver | `MONTHLY_PASS` | HIGH | Include renewal action link in `data_safe`. |
| E24 | **Monthly Pass Suspended** | Manager suspends an active pass | Monthly Pass (.NET) | Driver | `MONTHLY_PASS` | HIGH | Include suspension reason summary. Gate entry will be blocked. |
| E25 | **Monthly Pass Renewed** | Renewal payment confirmed; new period activated | Monthly Pass (.NET) | Driver | `MONTHLY_PASS` | NORMAL | Include new validity period, vehicle. |
| E26 | **Pricing Updated** | Admin updates a global or vehicle-type price rule | Pricing (.NET) | All Active Drivers | `PRICE_CHANGE` | NORMAL | Broadcast to all active Drivers. Include affected vehicle types and effective date. No specific price amounts (link to public pricing page). |
| E27 | **Feedback Submitted (Staff/Manager Alert)** | Driver or Guest submits a new feedback | Feedback (Spring Boot) | Manager, assigned Staff | `FEEDBACK` | NORMAL | Manager receives new queue item notification. Include category, subject snippet only (no full message). |
| E28 | **Feedback Assigned** | Manager assigns feedback to a Staff member | Feedback (Spring Boot) | Staff (assignee) | `FEEDBACK` | NORMAL | Alert Staff they have a new assigned feedback. Include category and action URL. |
| E29 | **Feedback Responded** | Manager posts a response to Driver feedback | Feedback (Spring Boot) | Driver (if identified) | `FEEDBACK` | NORMAL | Include response snippet (first 150 chars). Anonymous submitters do not receive this. |
| E30 | **Feedback Closed** | Manager closes feedback after resolution | Feedback (Spring Boot) | Driver (if identified) | `FEEDBACK` | NORMAL | Include closure summary. |
| E31 | **Feedback Rejected** | Manager rejects feedback (spam / TOS) | Feedback (Spring Boot) | Driver (if identified) | `FEEDBACK` | NORMAL | Include rejection reason summary. |
| E32 | **Account Locked** | Auth system locks a user account (failed attempts / TOS) | Authentication (.NET) | Affected User | `SYSTEM` | CRITICAL | Security alert. Include locked reason category, support contact. No raw auth details. |
| E33 | **Account Unlocked** | Admin or auto-unlock releases a locked account | Authentication (.NET) | Affected User | `SYSTEM` | NORMAL | Include unlock timestamp and recommended password change action. |
| E34 | **Password Changed** | User successfully changes their password | Authentication (.NET) | Affected User | `SYSTEM` | HIGH | Security alert. If user did not initiate, they should contact support. |
| E35 | **System Announcement** | Admin manually broadcasts a general system message | Admin (Spring Boot) | All Active Users (broadcast) | `SYSTEM` | NORMAL | Bulk delivery. Include subject, message snippet. Full message in notification body. |
| E36 | **System Maintenance Notice** | Admin broadcasts planned maintenance window | Admin (Spring Boot) | All Active Users (broadcast) | `SYSTEM` | HIGH | Include start time, estimated duration, affected features. |
| E37 | **Emergency Notice** | Admin broadcasts an emergency alert | Admin (Spring Boot) | All Active Users (broadcast) | `SYSTEM` | CRITICAL | Highest priority. Include emergency description, action required. |
| E38 | **Broadcast to Role/Building** | Admin or Manager targets a specific role + building | Admin / Manager (Spring Boot) | Role-scoped users | `SYSTEM` | NORMAL | E.g., "All Staff in Building A". Requires MANAGER or ADMIN role. |

---

## 4. Notification Type Matrix

| Type | Purpose | Trigger Events | Receiver | Default Priority | Navigation Target (`targetType`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `RESERVATION` | Reservation lifecycle alerts | E01–E07 | Driver | NORMAL / HIGH | `RESERVATION` → `/reservations/{id}` |
| `PAYMENT` | Payment lifecycle and discrepancy alerts | E08–E11 | Driver, Manager | NORMAL / HIGH | `PAYMENT` → `/payments/{id}` |
| `PARKING_SESSION` | Session start, overtime, completion alerts | E12–E14 | Driver | NORMAL / HIGH | `PARKING_SESSION` → `/sessions/{id}` |
| `MONTHLY_PASS` | Full monthly pass lifecycle alerts | E15–E25 | Driver, Manager | NORMAL / HIGH | `MONTHLY_PASS` → `/monthly-passes/{id}` |
| `PRICE_CHANGE` | Pricing update broadcasts to Drivers | E26 | Driver (All) | NORMAL | `PRICING` → `/pricing` |
| `FEEDBACK` | Feedback lifecycle alerts for Driver and Staff/Manager | E27–E31 | Driver, Staff, Manager | NORMAL | `FEEDBACK` → `/feedbacks/{id}` |
| `SYSTEM` | Security, account, and system-wide announcements | E32–E38 | All roles / Broadcast | NORMAL / HIGH / CRITICAL | `SYSTEM` → no deep link, or `/announcements/{id}` |

### Priority Definitions

| Priority | Description | Frontend Treatment |
| :--- | :--- | :--- |
| `NORMAL` | Standard informational notification | Standard bell badge increment |
| `HIGH` | Requires user attention or action | Highlighted in notification list (distinct color/icon) |
| `CRITICAL` | Immediate attention required (security, emergency) | Banner/toast alert on next load in addition to badge |

---

## 5. Notification Receiver Matrix

| Receiver Type | Definition | Example Events |
| :--- | :--- | :--- |
| **Driver (Owner)** | Notification sent to the specific Driver who owns the business entity (reservation, pass, vehicle) | E01–E14, E15, E17–E25, E29–E31, E32–E34 |
| **Manager (Action Required)** | Notification sent to all Managers or the assigned Manager for review/action | E11 (Payment Under Review), E15 (Application Submitted), E27 (Feedback Submitted) |
| **Staff (Assigned)** | Notification sent to a specific Staff member after assignment | E28 (Feedback Assigned) |
| **Admin** | Notification sent to Admin role for system-level events | E32–E34 (Account events), E37 (Emergency) |
| **All Active Drivers (Broadcast)** | Notification sent to every user with role DRIVER who is not banned/deleted | E26 (Pricing Updated) |
| **All Active Users (Broadcast)** | Notification sent to every active user regardless of role | E35–E37 (System, Maintenance, Emergency) |
| **Role + Building Scoped** | Notification sent to users matching a role within a specific building | E38 (Broadcast to Role/Building) |

### Receiver Resolution Rules

1. **Driver ownership**: Derived from the business entity (e.g., `reservation.driver_id`, `monthly_pass.driver_id`). Never from request body.
2. **Manager broadcast**: Resolved by querying `users WHERE role = 'MANAGER' AND status = 'ACTIVE'`.
3. **Staff assignment**: Derived from `feedback.assigned_to` field.
4. **Broadcast**: Resolved by querying `users WHERE status = 'ACTIVE'` in batches of 500.
5. **Role + Building**: Resolved by querying `users WHERE role = {role} AND building_id = {buildingId} AND status = 'ACTIVE'`.

---

## 6. Feature Interaction Matrix

| PBMS Module | Interaction with Notification | Data Direction | Protocol |
| :--- | :--- | :--- | :--- |
| **Reservation (.NET)** | Creates outbox events on state transitions (Created, Cancelled, Expired, Expiring, Slot Reassigned, Extended). Spring Boot consumes and inserts notifications. | .NET → Outbox → Spring Boot | Outbox polling / REST |
| **Payment (.NET)** | Creates outbox events on settlement outcomes (Success, Failed, Waived, Under Review). | .NET → Outbox → Spring Boot | Outbox polling / REST |
| **Parking Session (.NET)** | Creates outbox events on gate entry, overtime threshold breach, and exit. | .NET → Outbox → Spring Boot | Outbox polling / REST |
| **Pricing (.NET)** | Creates outbox event when a global price rule is updated. Spring Boot triggers bulk broadcast to all active Drivers. | .NET → Outbox → Spring Boot → Bulk Insert | Outbox + batch |
| **Monthly Pass (.NET)** | Creates outbox events for every lifecycle state: Application Submitted, Approved, Rejected, Activated, Expiring, Expired, Suspended, Card Bound. | .NET → Outbox → Spring Boot | Outbox polling / REST |
| **Feedback (Spring Boot)** | Spring Boot directly creates notifications on Feedback lifecycle events (Submitted, Assigned, Responded, Closed, Rejected). No outbox intermediary needed (same service). | Spring Boot Internal Event | Direct internal call |
| **Authentication (.NET)** | Creates outbox events for security events (Account Locked, Unlocked, Password Changed). | .NET → Outbox → Spring Boot | Outbox polling / REST |
| **Dashboard (Spring Boot)** | Dashboard widget queries `GET /api/support/notifications/me/unread` to display the unread badge count. | Spring Boot internal read | REST |
| **Audit Logs (Spring Boot)** | Admin/Manager broadcast actions MUST be written to the Audit Log. Standard user read/mark operations are NOT audited. | Spring Boot → Audit Log | Direct internal write |
| **Authorization (Spring Security)** | All notification endpoints enforce JWT validation. Role checks for broadcast endpoints (`ADMIN` or `MANAGER`). Row-level ownership enforced via `WHERE recipient_id = JWT.sub`. | JWT → Spring Security | JWT / Spring Security filter |
| **Public API** | Public APIs have NO access to internal notifications. Notification endpoints are internal-only, requiring a valid user JWT. | No interaction | N/A — blocked by security filter |
| **Email Worker (External)** | Email delivery is a separate downstream consumer of outbox events. Notification Module does NOT trigger or interact with email delivery. | Outbox → Email Worker (independent) | Independent consumer |

---

## 7. Ownership Matrix

### Module Ownership

| Component | Owner | Responsibility |
| :--- | :--- | :--- |
| `support_notifications` table | **Spring Boot Support API** | Full DDL ownership, read and write |
| Notification record creation | **Spring Boot Support API** | Consuming outbox events and inserting records |
| Notification business logic | **Spring Boot Support API** | Outbox consumer, scheduler jobs, broadcast orchestration |
| Outbox event production | **.NET Core API** | Produces events for all transactional domain events |
| Scheduler (pass/reservation expiry warnings) | **.NET Core API** | Time-based domain event production |
| Notification expiry / cleanup scheduler | **Spring Boot Support API** | Runs cleanup/archive/hard-delete jobs |
| Bulk broadcast orchestration | **Spring Boot Support API** | Admin/Manager-triggered broadcast with batch insert |
| Frontend polling | **Frontend** | Polls `/me/unread` every 30 seconds; polls `/me` on user interaction |
| Unread badge display | **Frontend** | Renders badge count from API response |
| Notification navigation | **Frontend** | Uses `data_safe.redirectUrl` for deep-linking |
| Audit logging (broadcast) | **Spring Boot Support API** | Writes to centralized audit log on every Admin/Manager broadcast |
| User identity resolution | **Shared DB** | `recipient_id` references `users.id` (logical reference, no FK) |

### Data Ownership

| Data Element | Owner | Notes |
| :--- | :--- | :--- |
| `recipient_id` | Core DB `users.id` | Logical reference. No hard FK to preserve bounded context. |
| `event_id` | Producing service | Stable UUID set at event commit time. Idempotency key. |
| `type` | Spring Boot (validation) | Must be one of the registered `NotificationType` enum values. |
| `title`, `body` | Spring Boot (creation) | Templated from event data. Immutable after creation. |
| `data_safe` | Spring Boot (creation) | JSONB. Strict schema. Immutable after creation. 2KB max. |
| `read_at` | Spring Boot (user action) | Set on PATCH /read. Cannot be unset. |
| `is_archived` | Spring Boot (user action) | Set on DELETE /{id}. Cannot be unset by user. Scheduler may archive expired notifications. |
| `expires_at` | Spring Boot (creation) | Set to `NOW() + 90 days` at creation. Immutable. |

### Who Can Mutate

| Operation | Allowed Actor | Endpoint |
| :--- | :--- | :--- |
| Create notification | Spring Boot (internal consumer / broadcast) | Internal only |
| Read own notifications | Authenticated user (JWT owner) | GET /me, GET /me/unread |
| Mark own notification read | Authenticated user (JWT owner) | PATCH /{id}/read |
| Mark all own notifications read | Authenticated user (JWT owner) | PATCH /read-all |
| Archive own notification | Authenticated user (JWT owner) | DELETE /{id} |
| Broadcast notifications | ADMIN or MANAGER role only | POST /broadcast |
| Archive expired (scheduled) | System (Spring Boot scheduler) | Internal job |
| Hard delete archived (scheduled) | System (Spring Boot scheduler) | Internal job |
| View any user's notifications | **NOBODY** (no admin browse endpoint) | N/A — blocked by design |

---

## 8. Business Rules

### BR-01: Ownership Enforcement
Only the notification's `recipient_id` — derived exclusively from `JWT.sub` — can read, mark as read, or archive a notification. No path parameter `userId` is accepted. Any attempt to access another user's notification returns `404 NOT_FOUND` (not 403, to prevent ownership disclosure).

### BR-02: Immutability
Once created, a notification's `id`, `event_id`, `recipient_id`, `type`, `title`, `body`, `data_safe`, `created_at`, and `expires_at` are immutable. Only `read_at` and `is_archived` may change after creation.

### BR-03: Read Idempotency
Marking a notification as read is idempotent. If `read_at` is already set, subsequent PATCH requests return `200 OK` with the original `readAt` value. No error is returned for already-read notifications.

### BR-04: Archive Idempotency
Archiving a notification is idempotent. If `is_archived = TRUE` already, subsequent DELETE requests return `204 No Content` without error.

### BR-05: No Hard Delete by User
Users cannot hard-delete notifications. The only user-facing deletion action is archiving (soft delete). Hard deletion is performed exclusively by the scheduled cleanup job after 365 days.

### BR-06: Duplicate Prevention
The unique constraint `(event_id, recipient_id, type)` acts as the idempotency key. If the consumer replays an event due to a crash, the database rejects the duplicate insert. The consumer MUST catch `UniqueConstraintViolationException` and treat it as an idempotent success (acknowledge and continue). No retry is needed.

### BR-07: Price Update Notification Targets Active Drivers Only
When a Pricing Updated event is received, the broadcast must only target users with `role = 'DRIVER' AND status = 'ACTIVE'`. Inactive, banned, or deleted Drivers must not receive this notification.

### BR-08: Feedback Notifications Respect Submitter Privacy
Feedback response/closure notifications (E29, E30, E31) are sent ONLY to identified (authenticated) submitters. Anonymous feedback submitters receive no notification. Anonymous feedback records have no `recipient_id`.

### BR-09: Notification Ordering
Notifications are ordered by `created_at DESC` with `id` as a tiebreaker. Newest notifications appear first. This order is enforced at the DB query level and must not be overridden by API callers.

### BR-10: Unread Badge Accuracy
The `unreadCount` returned by `/me/unread` must always reflect the exact count of records where `read_at IS NULL AND is_archived = FALSE AND expires_at > NOW()` for the authenticated user. There must be no client-side manipulation of this count.

### BR-11: Cursor-Based Pagination Required
All list endpoints for notifications MUST use cursor-based pagination using `(created_at, id)` as the cursor. Offset-based pagination is strictly prohibited to avoid duplicate/missing items during concurrent writes.

### BR-12: Broadcast Requires Authorization
The broadcast endpoint `POST /api/support/notifications/broadcast` requires `ADMIN` or `MANAGER` role. Staff and Driver roles are forbidden. Missing role returns `403 FORBIDDEN`.

### BR-13: Broadcast is Asynchronous
Broadcast requests for more than 1 user return `202 Accepted` immediately. The actual bulk insert is performed asynchronously by a background job in batches of 500 users. The caller must not assume delivery is complete when the 202 response is received.

### BR-14: Broadcast Audit Required
Every Admin or Manager broadcast operation MUST be recorded in the centralized Audit Log with: `actor_id`, `actor_role`, `action = NOTIFICATION_BROADCAST`, `target_scope`, `title`, `estimated_recipients_count`, `initiated_at`.

### BR-15: Security Events are High-Priority
Notifications for Account Locked (E32) and Password Changed (E34) must be created even if the user session is invalidated. They are created by the Spring Boot consumer using the `recipient_id` from the outbox event directly (not from an active JWT).

### BR-16: Expiry Includes Active Filter
All API read endpoints for user notifications MUST filter `WHERE is_archived = FALSE AND expires_at > NOW()`. Expired notifications that have not yet been archived by the scheduler must also be excluded from user-facing queries.

### BR-17: No PII or PCI in Notification Content
`title`, `body`, and `data_safe` must never contain: full credit card numbers, bank account details, raw provider secrets, full driver personal identity numbers, or raw passwords. Backend validates and rejects payloads violating this rule.

### BR-18: `data_safe` Schema is Strict
Every notification must have a `data_safe` JSONB field conforming exactly to:
```json
{
  "targetType": "RESERVATION | PAYMENT | PARKING_SESSION | MONTHLY_PASS | PRICING | FEEDBACK | SYSTEM",
  "targetId": "uuid | null",
  "redirectUrl": "/path/to/resource"
}
```
`targetId` may be `null` for system-wide announcements without a specific entity. `redirectUrl` is always required.

### BR-19: Support Trace Audit on Admin Browse
If a support agent or admin accesses a user's notification data for troubleshooting through an internal admin tool (not through this module's standard endpoints), a `SupportReadTrace` audit event MUST be fired with actor, target user, and timestamp.

### BR-20: Unread Count Cap at Display Level Only
The backend always returns the exact unread count. The frontend displays `99+` when the count exceeds 99, but the API never truncates the count.

---

## 9. Happy Paths

### HP-01: Reservation Created → Driver Notified

```
1. Driver creates a reservation → .NET Core API commits reservation + payment obligation.
2. .NET Core API writes outbox event: {event_id, type: "RESERVATION_CREATED", recipientId: driver.id, reservationId, code, location, paymentDeadline}.
3. Spring Boot outbox consumer polls and reads the event.
4. Consumer validates schema (2KB limit, no HTML, type recognized).
5. Consumer resolves title: "Reservation Confirmed – Code {code}" and body: "Your slot at {location} is reserved until {deadline}."
6. Consumer inserts record into support_notifications: {id: new UUID, event_id, recipient_id, type: RESERVATION, title, body, data_safe: {targetType: RESERVATION, targetId: reservationId, redirectUrl: /reservations/{reservationId}}, expires_at: NOW()+90d, is_archived: false, read_at: null}.
7. Consumer acknowledges the event (marks as processed in outbox).
8. Frontend: Driver app polls GET /api/support/notifications/me/unread → receives unreadCount: 1.
9. Frontend: Displays red badge with count 1.
10. Driver opens notification tray → GET /api/support/notifications/me → returns notification in list.
11. Driver clicks notification → Frontend calls PATCH /api/support/notifications/{id}/read.
12. DB executes: UPDATE support_notifications SET read_at = NOW() WHERE id = {id} AND recipient_id = {sub} AND read_at IS NULL → 1 row affected.
13. Redis cache unreadCount:{sub} is invalidated.
14. API returns: 200 OK { id, readAt }.
15. Frontend navigates to /reservations/{reservationId} via data_safe.redirectUrl.
16. Next poll: GET /me/unread → returns unreadCount: 0. Badge cleared.
```

### HP-02: Payment Successful → Driver Notified

```
1. PayOS webhook confirms payment → .NET Core API settles obligation, emits PAYMENT_SUCCESSFUL outbox event.
2. Spring Boot consumer reads event: {event_id, recipientId, paymentId, maskedAmount}.
3. Consumer inserts notification: type=PAYMENT, title="Payment Successful", body="Your payment of {amount} VND was successful.", data_safe: {targetType: PAYMENT, targetId: paymentId, redirectUrl: /payments/{paymentId}}.
4. Driver polls /me/unread → sees badge.
5. Driver marks as read → 200 OK. Badge cleared.
```

### HP-03: Payment Failed → Driver High-Priority Alert

```
1. Payment fails (provider rejects or reconciliation determines FAILED).
2. .NET emits PAYMENT_FAILED outbox event.
3. Spring Boot inserts notification: type=PAYMENT, priority=HIGH, title="Payment Failed", body="Your payment could not be processed. Please retry or contact support.", data_safe: {redirectUrl: /payments/{paymentId}/retry}.
4. Driver sees HIGH priority notification (highlighted in UI).
5. Driver clicks → navigated to payment retry page.
```

### HP-04: Monthly Pass Expiring (3-Day Warning) → Driver Notified

```
1. Scheduler runs daily at 06:00 UTC. Queries passes WHERE expires_at BETWEEN NOW() AND NOW()+3d AND status='ACTIVE' AND expiry_3d_notified=FALSE.
2. For each pass, .NET emits PASS_EXPIRING_3D outbox event.
3. Spring Boot consumer inserts notification: type=MONTHLY_PASS, priority=HIGH, title="Your Monthly Pass Expires in 3 Days", body="Renew before {date} to avoid disruption.", data_safe: {targetType: MONTHLY_PASS, targetId: passId, redirectUrl: /monthly-passes/{passId}/renew}.
4. .NET marks pass.expiry_3d_notified=TRUE to prevent duplicate.
5. Driver polls → badge shows HIGH priority notification.
6. Driver clicks → navigated to renewal page.
```

### HP-05: System Announcement Broadcast → All Active Users

```
1. Admin logs in → navigates to Broadcast Notifications panel.
2. Admin fills: title, message (max 1000 chars), scope=ALL_ACTIVE_USERS.
3. Frontend calls POST /api/support/notifications/broadcast {title, body, scope: ALL_ACTIVE_USERS}.
4. Spring Security validates: role=ADMIN or MANAGER → authorized.
5. API validates payload (length, no HTML).
6. API returns 202 Accepted immediately. Queues broadcast job.
7. Background job: queries SELECT id FROM users WHERE status='ACTIVE' in batches of 500.
8. For each batch: JDBC batch insert into support_notifications (500 rows per statement).
9. Audit log entry written: {actor_id, role, action: NOTIFICATION_BROADCAST, scope: ALL_ACTIVE_USERS, estimated_recipients: N}.
10. All active users next poll → unreadCount incremented by 1.
```

### HP-06: Feedback Responded → Driver Notified (Identified Submitter)

```
1. Manager posts response to identified Driver's feedback.
2. Spring Boot Feedback module (same service) emits internal event.
3. Notification module creates notification: type=FEEDBACK, title="Response to Your Feedback", body="{responseSnippet first 150 chars}...", data_safe: {targetType: FEEDBACK, targetId: feedbackId, redirectUrl: /feedbacks/{feedbackId}}.
4. Driver polls → sees notification. Reads response in feedback detail page.
```

### HP-07: Mark All As Read

```
1. Driver opens notification tray. Sees unreadCount=15.
2. Driver clicks "Mark All as Read".
3. Frontend calls PATCH /api/support/notifications/read-all.
4. DB executes: UPDATE support_notifications SET read_at=NOW() WHERE recipient_id={sub} AND read_at IS NULL AND is_archived=FALSE → 15 rows affected.
5. Redis cache unreadCount:{sub} is deleted/set to 0.
6. API returns 200 OK {rowsAffected: 15}.
7. Frontend: unread badge disappears. All items show "read" state.
```

### HP-08: Archive (Dismiss) Notification

```
1. Driver clicks dismiss (X) on a notification.
2. Frontend calls DELETE /api/support/notifications/{id}.
3. DB executes: UPDATE support_notifications SET is_archived=TRUE WHERE id={id} AND recipient_id={sub}.
4. If read_at was NULL: decrement Redis cache unreadCount:{sub} by 1.
5. API returns 204 No Content.
6. Frontend removes notification from list without re-fetching.
```

### HP-09: Account Locked → Security Notification

```
1. Authentication module detects TOS violation / excessive failed attempts.
2. .NET emits ACCOUNT_LOCKED outbox event: {event_id, recipientId: user.id, lockReason: CATEGORY_LABEL}.
3. Spring Boot consumer inserts notification: type=SYSTEM, priority=CRITICAL, title="Your Account Has Been Locked", body="Your account was locked due to {lockReasonCategory}. Contact support.", data_safe: {targetType: SYSTEM, targetId: null, redirectUrl: /support/contact}.
4. Even though session is invalidated, notification is persisted for when user next authenticates.
5. On next login, user immediately sees CRITICAL notification with banner display.
```

### HP-10: Parking Session Started → Driver Notified

```
1. Driver's vehicle scans at gate; .NET Parking Session module opens session (gate opens).
2. .NET emits PARKING_SESSION_STARTED outbox event: {event_id, recipientId: driver.id, sessionId, locationId, entryTime, expectedExitBy}.
3. Spring Boot consumer inserts notification: type=PARKING_SESSION, priority=NORMAL,
   title="You Have Entered the Parking",
   body="Entry recorded at {location} at {entryTime}. Expected exit by {expectedExitBy}.",
   data_safe: {targetType: PARKING_SESSION, targetId: sessionId, redirectUrl: /sessions/{sessionId}}.
4. Driver polls /me/unread on mobile → badge shows 1.
5. Driver opens notification → navigates to session detail page showing live session status.
```

### HP-11: Overtime Warning → Driver High-Priority Alert

```
1. Parking Session module detects session has exceeded reserved window by configured threshold.
2. .NET emits PARKING_OVERTIME_WARNING outbox event: {event_id, recipientId, sessionId, overage, currentTime}.
3. Spring Boot consumer inserts notification: type=PARKING_SESSION, priority=HIGH,
   title="Overtime Warning – Please Exit or Extend",
   body="Your reservation window ended {overage} ago. Overstay fees are accruing.",
   data_safe: {targetType: PARKING_SESSION, targetId: sessionId, redirectUrl: /sessions/{sessionId}/extend}.
4. Driver sees HIGH-priority notification with highlighted indicator.
5. Driver clicks → navigates to session page to take action (extend or proceed to exit).
```

### HP-12: Parking Session Completed → Driver Notified

```
1. Driver's vehicle exits; .NET Parking Session module closes session.
2. .NET emits PARKING_SESSION_COMPLETED outbox event: {event_id, recipientId, sessionId, duration, finalFee}.
3. Spring Boot consumer inserts notification: type=PARKING_SESSION, priority=NORMAL,
   title="Parking Session Ended",
   body="You parked for {duration}. Final fee: {finalFee} VND.",
   data_safe: {targetType: PARKING_SESSION, targetId: sessionId, redirectUrl: /sessions/{sessionId}}.
4. Driver polls → badge shows new notification.
5. Driver marks as read → navigates to session receipt.
```

### HP-13: Monthly Pass Application Approved → Driver Takes Action

```
1. Manager approves Driver's monthly pass application.
2. .NET emits MONTHLY_PASS_APPLICATION_APPROVED outbox event:
   {event_id, recipientId: driver.id, applicationId, passId, amountDue, paymentDeadline}.
3. Spring Boot consumer inserts notification: type=MONTHLY_PASS, priority=HIGH,
   title="Your Monthly Pass Application is Approved",
   body="Please complete payment of {amountDue} VND by {paymentDeadline} to activate your pass.",
   data_safe: {targetType: MONTHLY_PASS, targetId: applicationId, redirectUrl: /monthly-passes/applications/{applicationId}/pay}.
4. Driver polls → sees HIGH-priority notification.
5. Driver clicks → navigated to payment page for the approved application.
6. Driver completes payment → PayOS webhook fires → MONTHLY_PASS_ACTIVATED event.
7. New notification created (HP-14 below).
```

### HP-14: Monthly Pass Purchased / Activated → Driver Notified

```
1. PayOS webhook confirms monthly pass payment.
2. .NET Core settles obligation, activates pass, emits MONTHLY_PASS_ACTIVATED outbox event:
   {event_id, recipientId, passId, vehicleId, validFrom, validTo, cardId (if bound)}.
3. Spring Boot consumer inserts notification: type=MONTHLY_PASS, priority=HIGH,
   title="Monthly Pass Activated!",
   body="Your monthly pass for {vehiclePlate} is now active from {validFrom} to {validTo}.",
   data_safe: {targetType: MONTHLY_PASS, targetId: passId, redirectUrl: /monthly-passes/{passId}}.
4. Driver polls → sees HIGH-priority notification confirming activation.
5. Driver marks as read → navigates to pass detail page.
```

### HP-15: Pricing Updated → All Active Drivers Notified (Broadcast)

```
1. Admin updates a global price rule → .NET Pricing module commits update.
2. .NET emits PRICING_UPDATED outbox event:
   {event_id, type: PRICING_UPDATED, affectedVehicleTypes: [CAR, MOTORBIKE], effectiveDate}.
   NOTE: This event has NO single recipientId — it is a broadcast trigger.
3. Spring Boot consumer reads event, resolves scope: all users WHERE role='DRIVER' AND status='ACTIVE'.
4. Consumer fetches Driver IDs in batches of 500.
5. For each batch: JDBC batch insert. Each row gets unique event_id derived as {original_event_id}:{userId}.
6. Notification: type=PRICE_CHANGE, priority=NORMAL,
   title="Parking Fees Updated",
   body="Pricing for {vehicleTypes} has changed effective {effectiveDate}. View the updated rates.",
   data_safe: {targetType: PRICING, targetId: null, redirectUrl: /pricing}.
7. All active Drivers next poll → each sees +1 unread badge.
8. Each Driver reads → navigates to public pricing page.
```

---

## 10. Unhappy Paths

| # | Failure Scenario | Expected System Behavior | HTTP Status | Error Code |
| :--- | :--- | :--- | :--- | :--- |
| U01 | **Notification ID not found** | API returns 404. No error message reveals ownership state. | 404 | `NOTIF_NOT_FOUND` |
| U02 | **Wrong owner (horizontal escalation)** | API returns 404 (same as not found). Never 403. Prevents ownership disclosure. | 404 | `NOTIF_NOT_FOUND` |
| U03 | **Missing or invalid JWT** | API returns 401. No notification data is revealed. | 401 | `UNAUTHORIZED` |
| U04 | **Non-ADMIN/MANAGER calls broadcast** | API returns 403. No partial broadcast is executed. | 403 | `FORBIDDEN` |
| U05 | **Database unavailable during notification insert** | Consumer throws exception. Outbox event remains uncommitted/unacknowledged. Consumer retries with exponential backoff (1s, 2s, 4s, max 5 retries). Persistent failure moves event to DLQ. Alert fired to operations. | 500 (internal) | `NOTIF_DB_ERROR` |
| U06 | **Database unavailable during user read** | API returns 503 Service Unavailable. Frontend implements exponential backoff retry. | 503 | `NOTIF_DB_ERROR` |
| U07 | **Duplicate notification (event replay)** | DB unique constraint `(event_id, recipient_id, type)` rejects insert. Consumer catches `UniqueConstraintViolationException`, treats as idempotent success, acknowledges event, continues. No duplicate created. | N/A (consumer-side) | N/A |
| U08 | **Duplicate PATCH /read (double-click)** | Second request yields 0 rows updated. Consumer falls back to `SELECT read_at WHERE id={id} AND recipient_id={sub}`, returns 200 OK with original `readAt`. | 200 | None (idempotent) |
| U09 | **Duplicate DELETE /{id} (already archived)** | Second request finds `is_archived=TRUE`. Returns 204 No Content idempotently. No error. | 204 | None (idempotent) |
| U10 | **Notification expired before user reads** | Scheduler has archived it. API query excludes `is_archived=TRUE`. Returns 404 `NOTIF_NOT_FOUND`. | 404 | `NOTIF_NOT_FOUND` |
| U11 | **Invalid notification type in event payload** | Consumer validates type against `NotificationType` enum. Unknown type routes event to DLQ immediately. Alert fired to operations. No poison pill blocking. | N/A (consumer-side) | `NOTIF_UNSUPPORTED_TYPE` |
| U12 | **Payload exceeds 2KB limit** | Consumer validates `data_safe` size. Oversized payload routes event to DLQ. Alert fired. | N/A (consumer-side) | `NOTIF_PAYLOAD_TOO_LARGE` |
| U13 | **HTML in title/body** | Consumer strips HTML tags before insert. If stripping results in empty content, event is sent to DLQ. | N/A (consumer-side) | N/A |
| U14 | **Referenced entity deleted (e.g., reservation deleted)** | Notification remains persisted for historical context. `data_safe.redirectUrl` may result in 404 on frontend navigation. Frontend must handle 404 navigation gracefully ("This record is no longer available"). | 200 (notification still returned) | N/A |
| U15 | **Recipient user deleted/banned** | If `recipient_id` no longer exists in users table at event consumption time, consumer drops event, logs WARNING, does not insert. Soft validation only. | N/A (consumer-side) | N/A |
| U16 | **Concurrent PATCH /read race (two devices)** | First request sets `read_at`. Second request finds `read_at IS NOT NULL`, returns 200 OK with original `readAt`. Both succeed idempotently. DB row-level locking prevents duplicate update. | 200 | None |
| U17 | **Network timeout on PATCH /read** | Frontend marks notification as "pending read" locally. On next interaction or retry, frontend re-issues the PATCH. Idempotency ensures correctness. | (timeout) | N/A |
| U18 | **Pagination beyond available data** | Returns 200 OK with `items: []` and `nextCursor: null`. Never returns 404 for empty pages. | 200 | None |
| U19 | **Invalid cursor format** | API returns 400 `NOTIF_INVALID_FILTER`. | 400 | `NOTIF_INVALID_FILTER` |
| U20 | **Invalid date range filter** | API returns 400 `NOTIF_INVALID_FILTER`. | 400 | `NOTIF_INVALID_FILTER` |
| U21 | **Bulk broadcast server failure mid-batch** | Transaction for each batch of 500 is independent. Failed batch is retried from last checkpoint. Already-completed batches are not re-run (idempotency via unique constraint). | 500 (partial; 202 already returned) | Logged internally |
| U22 | **Broadcast to zero recipients** | Broadcast with empty target scope returns 400 `NOTIF_BROADCAST_EMPTY_TARGET`. No audit log entry. | 400 | `NOTIF_BROADCAST_EMPTY_TARGET` |
| U23 | **Consumer crashes mid-batch insert** | Batch transaction rolls back. Outbox event/checkpoint remains uncommitted. Consumer restarts and retries. Unique constraint prevents duplicate insertions. | N/A (consumer-side) | N/A |
| U24 | **Redis cache unavailable** | System falls back to direct DB query for unread count. Performance degrades but correctness is maintained. Log warning metric. | 200 (fallback) | None |
| U25 | **Unexpected server exception** | API returns 500. Generic error message. Internal exception logged with correlation ID. No stack trace exposed to caller. | 500 | `INTERNAL_ERROR` |

---

## 11. Edge Cases

| # | Edge Case | Expected Behavior |
| :--- | :--- | :--- |
| EC01 | **Empty notification list** | Returns `200 OK` with `{ items: [], nextCursor: null, unreadCount: 0 }`. Never returns 404. |
| EC02 | **Pagination overflow (page N beyond data)** | Returns `200 OK` with `{ items: [], nextCursor: null }`. |
| EC03 | **New notification arrives during pagination** | Cursor-based pagination ensures new records (newer than cursor) do not appear in mid-session pages. User sees them on next fresh load. |
| EC04 | **Notification expires during pagination** | Expired records excluded by `WHERE expires_at > NOW()`. User seamlessly skips them with no gap in pagination. |
| EC05 | **User marks all read while another device has the list open** | Next poll on second device returns `unreadCount: 0`. Items already fetched retain their old state until refresh. UI must refresh list on next open. |
| EC06 | **Read synchronization across multiple browser tabs** | Each tab polls independently. On PATCH from one tab, Redis cache is invalidated. Other tabs receive updated count on next poll cycle (≤30 seconds drift). |
| EC07 | **Polling during bulk insert** | User may receive partial unread count during a large broadcast in progress. This is acceptable eventual consistency. Full count stabilizes within one batch cycle. |
| EC08 | **Very large notification history (10,000+ records)** | Cursor-based pagination handles this transparently. Index `idx_notif_recipient_created` ensures sub-100ms query time even at scale. |
| EC09 | **Duplicate events from outbox (at-least-once delivery)** | Unique constraint `(event_id, recipient_id, type)` absorbs duplicates silently. Consumer handles gracefully. |
| EC10 | **Notification created for a deleted reservation** | Notification persists. Deep link shows "Record not found" on frontend. Notification itself remains valid historical record. |
| EC11 | **Unread count = 0 but list has items** | All items have `read_at IS NOT NULL`. Count is 0. Items are returned in list (they are not archived). Correct behavior. |
| EC12 | **Unread count >99** | Backend returns exact count (e.g., 143). Frontend displays "99+". Badge is never inaccurate at the backend level. |
| EC13 | **CRITICAL notification arrives while user is on a different page** | Frontend should display a banner/toast on next render cycle. Badge increments in background. |
| EC14 | **Broadcast to self (Admin sends and receives)** | Admin with active session receives their own broadcast. Expected behavior. No exclusion of broadcaster. |
| EC15 | **User archives unread notification** | `is_archived` is set to TRUE. If `read_at` was NULL, Redis unread count cache is decremented by 1. Archived notification disappears from default list. |
| EC16 | **Notification ID collision (UUID)** | Probability negligible with UUID v4. If collision occurs, DB primary key constraint rejects and consumer treats as retry-safe error. |
| EC17 | **Scheduler archival races with user reading** | If scheduler archives while user is marking as read: PATCH completes first (row still visible) or scheduler archives first (PATCH returns 404). Both outcomes are consistent. |
| EC18 | **Event with future `created_at`** | Consumer uses `NOW()` for `created_at` at insertion time, ignoring event timestamp for ordering. Event timestamp is stored separately if needed for traceability. |

---

## 12. API Review

### API Base URL
All notification endpoints are served by the **Spring Boot Support API**.

Base: `GET|PATCH|DELETE|POST /api/support/notifications/...`

---

### 12.1 GET /api/support/notifications/me

**Purpose:** List all non-archived, non-expired notifications for the authenticated user.

**Authorization:** Any authenticated user (Driver, Staff, Manager, Admin). JWT required.

**Request:**
```
GET /api/support/notifications/me
Authorization: Bearer {JWT}

Query Parameters:
  cursor       string    Optional. Cursor from previous page response (base64-encoded created_at:id).
  limit        integer   Optional. Default 20. Max 50.
  type         string    Optional. Filter by NotificationType enum. Comma-separated for multiple.
  priority     string    Optional. Filter by priority: NORMAL | HIGH | CRITICAL.
  isRead       boolean   Optional. Filter by read state: true | false.
  from         ISO8601   Optional. Filter notifications created after this timestamp.
  to           ISO8601   Optional. Filter notifications created before this timestamp.
```

**Response 200 OK:**
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "RESERVATION",
      "priority": "NORMAL",
      "title": "Reservation Confirmed – Code RES-001",
      "body": "Your slot at Building A, Floor 2 is reserved until 2026-07-15T10:00:00Z.",
      "dataSafe": {
        "targetType": "RESERVATION",
        "targetId": "uuid",
        "redirectUrl": "/reservations/uuid"
      },
      "isRead": false,
      "readAt": null,
      "createdAt": "2026-07-15T08:00:00Z",
      "expiresAt": "2026-10-13T08:00:00Z"
    }
  ],
  "nextCursor": "base64string_or_null",
  "hasMore": true,
  "totalUnread": 3
}
```

**Pagination:** Cursor-based. `nextCursor` is `null` when there are no more pages.

**Sorting:** `created_at DESC, id DESC`. Not configurable by caller.

**Filtering:** By `type`, `priority`, `isRead`, `from`, `to`. All filters are `AND` combined.

**Error Responses:**
| Status | Code | Condition |
| :--- | :--- | :--- |
| 400 | `NOTIF_INVALID_FILTER` | Invalid type/priority enum, invalid cursor, invalid date range, limit > 50 |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 500 | `NOTIF_DB_ERROR` | Database failure |

---

### 12.2 GET /api/support/notifications/me/unread

**Purpose:** Return the unread count and a preview of recent unread notifications for badge/indicator.

**Authorization:** Any authenticated user. JWT required.

**Request:**
```
GET /api/support/notifications/me/unread
Authorization: Bearer {JWT}

Query Parameters:
  limit   integer   Optional. Preview items to return. Default 5. Max 20.
```

**Response 200 OK:**
```json
{
  "unreadCount": 3,
  "items": [
    {
      "id": "uuid",
      "type": "PAYMENT",
      "priority": "HIGH",
      "title": "Payment Failed",
      "createdAt": "2026-07-15T09:30:00Z"
    }
  ],
  "asOf": "2026-07-15T09:31:00Z"
}
```

**Notes:**
- `unreadCount` is the authoritative backend count. Frontend displays `99+` when count > 99.
- `asOf` allows frontend to detect stale state across concurrent devices.
- Redis cache key: `unreadCount:{sub}` with 15-second TTL. Cache miss falls back to DB query.

**Error Responses:**
| Status | Code | Condition |
| :--- | :--- | :--- |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 500 | `NOTIF_DB_ERROR` | Database failure |

---

### 12.3 PATCH /api/support/notifications/{id}/read

**Purpose:** Mark a single notification as read. Idempotent.

**Authorization:** Any authenticated user. Ownership enforced via JWT.

**Path Parameters:**
- `id` — UUID of the notification.

**Request:**
```
PATCH /api/support/notifications/{id}/read
Authorization: Bearer {JWT}
Content-Type: application/json
(no body required)
```

**Response 200 OK:**
```json
{
  "id": "uuid",
  "readAt": "2026-07-15T09:35:00Z"
}
```

**Flow:**
1. Extract `sub` from JWT.
2. Execute: `UPDATE support_notifications SET read_at = NOW() WHERE id = {id} AND recipient_id = {sub} AND read_at IS NULL`.
3. If rows affected = 1: invalidate Redis cache `unreadCount:{sub}`.
4. If rows affected = 0: fallback SELECT to get original `read_at` (idempotent path).
5. Return 200 with `read_at`.

**Error Responses:**
| Status | Code | Condition |
| :--- | :--- | :--- |
| 400 | `NOTIF_INVALID_ID` | `id` is not a valid UUID |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 404 | `NOTIF_NOT_FOUND` | ID not found, not owned by user, or archived/expired |
| 500 | `NOTIF_DB_ERROR` | Database failure |

---

### 12.4 PATCH /api/support/notifications/read-all

**Purpose:** Mark all unread notifications for the authenticated user as read in one operation.

**Authorization:** Any authenticated user. JWT required.

**Request:**
```
PATCH /api/support/notifications/read-all
Authorization: Bearer {JWT}
```

**Response 200 OK:**
```json
{
  "rowsAffected": 15,
  "updatedAt": "2026-07-15T09:40:00Z"
}
```

**Flow:**
1. Extract `sub` from JWT.
2. Execute: `UPDATE support_notifications SET read_at = NOW() WHERE recipient_id = {sub} AND read_at IS NULL AND is_archived = FALSE`.
3. Invalidate Redis cache `unreadCount:{sub}` (or set to 0).
4. Return 200 with `rowsAffected`.
5. If `rowsAffected = 0`: returns 200 OK with `rowsAffected: 0` (idempotent — no error).

**Error Responses:**
| Status | Code | Condition |
| :--- | :--- | :--- |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 500 | `NOTIF_DB_ERROR` | Database failure |

---

### 12.5 DELETE /api/support/notifications/{id}

**Purpose:** Archive (soft-delete / dismiss) a single notification. Idempotent.

**Authorization:** Any authenticated user. Ownership enforced via JWT.

**Path Parameters:**
- `id` — UUID of the notification.

**Request:**
```
DELETE /api/support/notifications/{id}
Authorization: Bearer {JWT}
```

**Response:** `204 No Content`

**Flow:**
1. Extract `sub` from JWT.
2. Execute: `UPDATE support_notifications SET is_archived = TRUE WHERE id = {id} AND recipient_id = {sub}`.
3. If `read_at` was NULL before archive: decrement Redis `unreadCount:{sub}` by 1 (or invalidate cache).
4. If rows affected = 0: check if already archived → return 204 (idempotent).
5. Return 204 No Content.

**Error Responses:**
| Status | Code | Condition |
| :--- | :--- | :--- |
| 400 | `NOTIF_INVALID_ID` | `id` is not a valid UUID |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 404 | `NOTIF_NOT_FOUND` | ID not found or not owned by user |
| 500 | `NOTIF_DB_ERROR` | Database failure |

---

### 12.6 POST /api/support/notifications/broadcast

**Purpose:** Broadcast a notification to a defined scope of users (Admin / Manager only).

**Authorization:** Requires `ADMIN` or `MANAGER` role. JWT required.

**Request:**
```
POST /api/support/notifications/broadcast
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "title": "Scheduled Maintenance – July 20, 2026",
  "body": "The parking system will undergo maintenance from 02:00 to 04:00 UTC. Please plan accordingly.",
  "type": "SYSTEM",
  "priority": "HIGH",
  "scope": "ALL_ACTIVE_USERS",
  "buildingId": null,
  "targetRole": null,
  "dataSafe": {
    "targetType": "SYSTEM",
    "targetId": null,
    "redirectUrl": "/announcements/uuid"
  }
}
```

**Scope Values:**
| Scope | Description | Required Fields |
| :--- | :--- | :--- |
| `ALL_ACTIVE_USERS` | All active users regardless of role | None |
| `ROLE_SCOPED` | All active users with a specific role | `targetRole` required |
| `BUILDING_ROLE_SCOPED` | All active users with a specific role in a specific building | `targetRole` + `buildingId` required |
| `DRIVER_ONLY` | All active Drivers only | None |

**Response 202 Accepted:**
```json
{
  "broadcastId": "uuid",
  "status": "QUEUED",
  "estimatedRecipients": 1234,
  "queuedAt": "2026-07-15T09:45:00Z"
}
```

**Error Responses:**
| Status | Code | Condition |
| :--- | :--- | :--- |
| 400 | `NOTIF_INVALID_FILTER` | Invalid scope, missing required scope fields |
| 400 | `NOTIF_BROADCAST_EMPTY_TARGET` | Resolved recipient count = 0 |
| 400 | `NOTIF_PAYLOAD_TOO_LARGE` | Title/body/data_safe exceeds limits |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 403 | `FORBIDDEN` | Role is not ADMIN or MANAGER |
| 500 | `NOTIF_DB_ERROR` | Database failure |

---

## 13. Database Review

### 13.1 Full Schema Definition

```sql
-- Core notification table
CREATE TABLE support_notifications (
    id              UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id    UUID                     NOT NULL,
    -- Logical link to Core users table. No hard FK to maintain bounded context.
    -- Spring Boot validates existence at event consumption time (soft validation).

    event_id        UUID                     NOT NULL,
    -- Stable UUID from producing service. Part of idempotency key.

    type            VARCHAR(50)              NOT NULL,
    -- Enum: RESERVATION | PAYMENT | PARKING_SESSION | MONTHLY_PASS | PRICE_CHANGE | FEEDBACK | SYSTEM

    priority        VARCHAR(20)              NOT NULL DEFAULT 'NORMAL',
    -- Enum: NORMAL | HIGH | CRITICAL

    title           VARCHAR(255)             NOT NULL,
    -- No HTML. Backend strips/rejects. Max 255 characters.

    body            TEXT                     NOT NULL,
    -- No HTML. Backend strips/rejects. Max 1000 characters.

    data_safe       JSONB,
    -- Strict schema: { targetType: string, targetId: uuid|null, redirectUrl: string }
    -- Max 2KB. No PII, PCI, or secrets.

    created_at      TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
    read_at         TIMESTAMPTZ,
    -- NULL = unread. Set once and immutable thereafter.

    is_archived     BOOLEAN                  NOT NULL DEFAULT FALSE,
    -- TRUE = soft-deleted/dismissed. Set by user action or expiry scheduler.

    expires_at      TIMESTAMPTZ              NOT NULL,
    -- Always set to created_at + INTERVAL '90 days'. Immutable.

    -- Idempotency constraint: prevents duplicate notifications from event replay
    UNIQUE(event_id, recipient_id, type),

    -- Type validation
    CONSTRAINT chk_notif_type CHECK (
        type IN ('RESERVATION', 'PAYMENT', 'PARKING_SESSION', 'MONTHLY_PASS', 'PRICE_CHANGE', 'FEEDBACK', 'SYSTEM')
    ),

    -- Priority validation
    CONSTRAINT chk_notif_priority CHECK (
        priority IN ('NORMAL', 'HIGH', 'CRITICAL')
    ),

    -- Title and body non-empty
    CONSTRAINT chk_notif_title_nonempty CHECK (char_length(title) > 0),
    CONSTRAINT chk_notif_body_nonempty CHECK (char_length(body) > 0),

    -- expires_at must be after created_at
    CONSTRAINT chk_notif_expires_future CHECK (expires_at > created_at),

    -- read_at cannot be before created_at
    CONSTRAINT chk_notif_read_after_create CHECK (read_at IS NULL OR read_at >= created_at)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Primary read path: user inbox (most recent non-archived, non-expired)
CREATE INDEX idx_notif_recipient_created
    ON support_notifications (recipient_id, created_at DESC)
    WHERE is_archived = FALSE;

-- Unread badge count path (most selective index)
CREATE INDEX idx_notif_recipient_unread
    ON support_notifications (recipient_id)
    WHERE read_at IS NULL AND is_archived = FALSE;

-- Expiry cleanup scheduler path
CREATE INDEX idx_notif_expires_at
    ON support_notifications (expires_at)
    WHERE is_archived = FALSE;

-- Hard delete scheduler path (archived + old)
CREATE INDEX idx_notif_archived_created
    ON support_notifications (created_at)
    WHERE is_archived = TRUE;

-- Type filter queries
CREATE INDEX idx_notif_recipient_type
    ON support_notifications (recipient_id, type)
    WHERE is_archived = FALSE;

-- Priority filter for CRITICAL banner display
CREATE INDEX idx_notif_recipient_priority
    ON support_notifications (recipient_id, priority)
    WHERE is_archived = FALSE AND read_at IS NULL;
```

### 13.2 Column Specification

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| `recipient_id` | UUID | NOT NULL | — | Logical reference to `users.id`. No FK constraint (bounded context). |
| `event_id` | UUID | NOT NULL | — | Source event ID. Part of idempotency unique key. |
| `type` | VARCHAR(50) | NOT NULL | — | Notification type enum. Constrained by CHECK. |
| `priority` | VARCHAR(20) | NOT NULL | `'NORMAL'` | Priority level enum. Constrained by CHECK. |
| `title` | VARCHAR(255) | NOT NULL | — | Display title. No HTML. |
| `body` | TEXT | NOT NULL | — | Notification body. No HTML. Max 1000 chars enforced at application layer. |
| `data_safe` | JSONB | NULL | — | Navigation payload. 2KB max enforced at application layer. |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation timestamp. Immutable. Used for ordering. |
| `read_at` | TIMESTAMPTZ | NULL | `NULL` | Read timestamp. NULL = unread. Set once, never unset. |
| `is_archived` | BOOLEAN | NOT NULL | `FALSE` | Soft-delete flag. TRUE = hidden from user, pending hard delete. |
| `expires_at` | TIMESTAMPTZ | NOT NULL | — | Auto-archive threshold = `created_at + 90 days`. Immutable. |

### 13.3 Relationship Rules

| Rule | Description |
| :--- | :--- |
| No hard FK to `users` | `recipient_id` is a logical reference. Foreign key constraint is not enforced at DB level. Bounded context is respected. |
| Soft delete only | No `DELETE` DML is issued by application logic for user-facing actions. Only the hard-delete scheduler issues `DELETE`. |
| Idempotency key | `UNIQUE(event_id, recipient_id, type)` guarantees at-most-once notification per event per user per type. |
| `expires_at` immutable | Application layer never updates `expires_at` after insert. |
| `read_at` set-once | Application layer only updates `read_at` when it is `NULL`. Never overwrites an existing `read_at`. |
| `data_safe` schema enforced at app layer | JSONB does not enforce schema at DB level. Application validates `targetType`, `targetId`, and `redirectUrl` fields before insert. |

---

## 14. Validation Rules

### 14.1 API Input Validation

| Field | Rule | Error Code |
| :--- | :--- | :--- |
| `id` (path param) | Must be a valid UUID v4 format. | `NOTIF_INVALID_ID` |
| `cursor` (query) | Must be a base64-encoded string matching `created_at:id` format. | `NOTIF_INVALID_FILTER` |
| `limit` (query) | Integer. Min 1. Max 50. Default 20. | `NOTIF_INVALID_FILTER` |
| `type` (query filter) | Must be one or more of: `RESERVATION`, `PAYMENT`, `PARKING_SESSION`, `MONTHLY_PASS`, `PRICE_CHANGE`, `FEEDBACK`, `SYSTEM`. | `NOTIF_INVALID_FILTER` |
| `priority` (query filter) | Must be one of: `NORMAL`, `HIGH`, `CRITICAL`. | `NOTIF_INVALID_FILTER` |
| `isRead` (query filter) | Must be boolean `true` or `false`. | `NOTIF_INVALID_FILTER` |
| `from` / `to` (query) | Must be valid ISO 8601 UTC timestamps. `from` must be before `to`. | `NOTIF_INVALID_FILTER` |
| Broadcast `title` | Required. 1–255 characters. No HTML. | `NOTIF_PAYLOAD_TOO_LARGE` / `NOTIF_INVALID_FILTER` |
| Broadcast `body` | Required. 1–1000 characters. No HTML. | `NOTIF_PAYLOAD_TOO_LARGE` / `NOTIF_INVALID_FILTER` |
| Broadcast `type` | Must be a valid NotificationType. | `NOTIF_INVALID_FILTER` |
| Broadcast `priority` | Must be valid priority. | `NOTIF_INVALID_FILTER` |
| Broadcast `scope` | Must be one of defined scope values. | `NOTIF_INVALID_FILTER` |
| Broadcast `targetRole` | Required if scope is `ROLE_SCOPED` or `BUILDING_ROLE_SCOPED`. Must be valid role enum. | `NOTIF_INVALID_FILTER` |
| Broadcast `buildingId` | Required if scope is `BUILDING_ROLE_SCOPED`. Must be valid UUID. | `NOTIF_INVALID_FILTER` |
| Broadcast `data_safe` | Optional. If present: `targetType` required, `redirectUrl` required (path, not full URL). Max 2KB. | `NOTIF_PAYLOAD_TOO_LARGE` |

### 14.2 Consumer-Side Validation (Outbox Event)

| Field | Rule | On Failure |
| :--- | :--- | :--- |
| `event_id` | Required. Must be valid UUID. | Route to DLQ. |
| `recipient_id` | Required. Must be valid UUID. User soft-validated against `users` table. | Drop event, log WARNING. |
| `type` | Must match `NotificationType` enum. | Route to DLQ. Alert ops. |
| `title` | Required. 1–255 chars. | Route to DLQ. |
| `body` | Required. 1–1000 chars. | Route to DLQ. |
| `data_safe` | Optional. Max 2KB. Schema validated. | Route to DLQ if oversized or schema invalid. |
| HTML content | `title`, `body`, `data_safe` must have HTML stripped before insert. If result is empty after stripping, route to DLQ. | Route to DLQ. |

---

## 15. Security Review

### 15.1 Authentication
- All notification endpoints require a valid JWT in the `Authorization: Bearer {token}` header.
- JWT is validated by Spring Security on every request.
- Expired, malformed, or missing JWTs return `401 UNAUTHORIZED`.
- No endpoint is accessible without authentication (no anonymous read).

### 15.2 Authorization — Horizontal Privilege Escalation Prevention
- All user-facing read, mark-read, and archive operations use `WHERE recipient_id = JWT.sub`.
- No `userId` parameter is accepted from the request URL or body.
- The legacy route `GET /api/notifications/{userId}` — if it still exists — MUST reject any `userId` ≠ `JWT.sub` with `403 FORBIDDEN` or be removed entirely.
- Accessing another user's notification returns `404 NOT_FOUND` (same as not found), preventing ownership disclosure.

### 15.3 Authorization — Vertical Privilege Escalation Prevention
- Broadcast endpoint `POST /api/support/notifications/broadcast` requires `ADMIN` or `MANAGER` role enforced by Spring Security `@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")`.
- Driver or Staff attempting broadcast receives `403 FORBIDDEN`.
- Role information is derived from JWT claims only, never from request body.

### 15.4 Data Leakage Prevention
- `title`, `body`, and `data_safe` must never contain: full card numbers, raw provider secrets, passwords, government IDs, full names of other users, or internal system tokens.
- Backend validates and strips PII before insert. If violation detected, event is routed to DLQ and alert is fired.
- `data_safe.redirectUrl` must be a relative path (e.g., `/reservations/uuid`), never a full external URL (prevents open redirect).
- Notification list responses never include: `event_id` (internal identifier), raw outbox metadata.

### 15.5 XSS Prevention
- Backend strips all HTML tags from `title`, `body`, and all string values in `data_safe` before persistence.
- Frontend must render `title` and `body` as plain text (not innerHTML). No `dangerouslySetInnerHTML` or equivalent.
- `redirectUrl` must be validated as a known internal path before use in navigation.

### 15.6 SQL Injection Prevention
- All DB queries use parameterized statements (PreparedStatement / JPA). No string concatenation in queries.

### 15.7 Rate Limiting
- Broadcast endpoint: max 10 broadcast requests per Admin/Manager per hour. Excess returns `429 Too Many Requests`.
- Standard read/mark endpoints: normal user rate limiting applies per API gateway policy (not defined in this module).

### 15.8 Audit Security
- Admin/Manager broadcast actions are permanently audited and cannot be deleted.
- Audit log entries are append-only and stored in the centralized audit log table (not in `support_notifications`).

---

## 16. Frontend Behavior

### 16.1 Polling Strategy
- The frontend polls `GET /api/support/notifications/me/unread` every **30 seconds** when a user session is active.
- Polling MUST be paused when the browser tab is hidden (`document.visibilityState === 'hidden'`) to conserve resources.
- Polling resumes immediately when the tab becomes visible again.
- On initial page load, the unread count is fetched immediately (do not wait for the first 30-second interval).
- Polling uses `AbortController` to cancel in-flight requests when the component unmounts.

### 16.2 Unread Badge
- Display as a red circular badge on the notification bell icon.
- Show exact count when ≤99. Show `99+` when count >99.
- Badge updates immediately after `PATCH /read`, `PATCH /read-all`, or `DELETE /{id}` — do not wait for next poll.
- If unread count drops to 0, remove the badge entirely (do not show `0`).

### 16.3 Notification Ordering
- Notifications are displayed newest first (`created_at DESC`).
- Do not apply any client-side reordering.
- Priority grouping (CRITICAL/HIGH/NORMAL) may be applied visually within the same time band, but ordering is not changed.

### 16.4 Pagination
- Use cursor-based infinite scroll or "Load More" button.
- On first open: fetch first page (limit 20).
- On scroll to bottom / "Load More" click: fetch next page using `nextCursor`.
- If `nextCursor` is `null` or `hasMore` is `false`: show "No more notifications" message. Do not show Load More.
- Do not refetch all pages on each poll. Only refresh the unread count via `/me/unread`.

### 16.5 Filters
- UI provides filter controls for: `type`, `priority`, `isRead`.
- Applying a filter resets pagination (clears cursor, fetches first page with filter).
- Active filters are visually indicated (chip/tag with dismiss button).
- Clearing all filters restores the default unfiltered view.

### 16.6 Mark Read Behavior
- Clicking a notification: immediately call `PATCH /{id}/read` in background. Optimistically update the item to "read" state in UI. Navigate to `data_safe.redirectUrl`.
- If PATCH fails: revert the optimistic "read" state. Show error toast. Do not navigate.
- "Mark All as Read" button: optimistically clear all unread badges. Call `PATCH /read-all`. If it fails: show error toast and revert.

### 16.7 Archive Behavior
- "Dismiss" (X) button on each notification: optimistically remove from list. Call `DELETE /{id}`. If 404: already archived — no revert needed, item is gone. If 500: show error toast, revert visibility.

### 16.8 Empty State
- When no notifications exist or all are filtered out: display a centered illustration with the message "You have no notifications" (or "No notifications match your filters" when filters are active).
- Never show a 404 error screen for an empty list.

### 16.9 Loading State
- Show a skeleton loader for the first fetch.
- Show a spinner at the bottom of the list for "Load More" fetches.
- Show a spinner overlay for "Mark All as Read" to prevent double-clicks during processing.

### 16.10 Error State
- If `/me` or `/me/unread` fails: show a non-blocking error toast "Failed to load notifications. Retrying...".
- Retry with exponential backoff (1s, 2s, 4s, 8s) up to 4 retries. After 4 retries: show persistent "Could not load notifications" error with a manual retry button.
- Do not crash the entire app on notification load failure. Notification widget degrades gracefully.

### 16.11 CRITICAL Notification Banner
- On first load or tab visibility restore, if any CRITICAL notification exists in the unread list: display a dismissible full-width banner at the top of the page.
- Banner shows: notification title and a "View Details" action.
- Banner is dismissed locally (localStorage) per notification ID once user clicks "View Details".

### 16.12 Navigation
- Clicking a notification: extract `data_safe.redirectUrl`. Navigate using the SPA router (push to history).
- If `redirectUrl` results in a 404: display a graceful "This record is no longer available" message, not a crash.
- Never trust `redirectUrl` as an external URL. Validate it starts with `/` before navigation.

---

## 17. Notification Lifecycle

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                  NOTIFICATION LIFECYCLE                  │
                    └─────────────────────────────────────────────────────────┘

[Business Event Occurs]
        │
        ▼
  [CREATED] ──── Spring Boot consumer inserts record ────► DB: is_archived=FALSE, read_at=NULL
        │
        ▼
  [UNREAD] ──── User has not read; unreadCount > 0 ─────► Badge displayed to user
        │
        ├──── User marks as read ─────────────────────────► [READ] (read_at = timestamp, badge decremented)
        │
        ├──── User archives ──────────────────────────────► [ARCHIVED] (is_archived = TRUE, excluded from queries)
        │
        └──── expires_at < NOW() ────────────────────────► Scheduler Job 1 (daily at 02:00 UTC)
                                                                    │
                                                                    ▼
                                                            [ARCHIVED] (is_archived = TRUE)
                                                                    │
                                                    365 days later: Scheduler Job 3 (monthly)
                                                                    │
                                                                    ▼
                                                            [HARD DELETED] (DELETE FROM db)

  [READ] ───── User may still archive after reading ────────────────────────►  [ARCHIVED]
```

### Lifecycle State Definitions

| State | DB State | Visible to User | Description |
| :--- | :--- | :--- | :--- |
| CREATED | `is_archived=FALSE`, `read_at=NULL` | YES | Newly inserted. Counted as unread. |
| UNREAD | `is_archived=FALSE`, `read_at=NULL`, `expires_at > NOW()` | YES | Active unread state. |
| READ | `is_archived=FALSE`, `read_at IS NOT NULL`, `expires_at > NOW()` | YES | User has read. Not in unread count. |
| ARCHIVED | `is_archived=TRUE` | NO | Soft-deleted. Excluded from all user queries. |
| HARD DELETED | Row removed from DB | NO | Permanent. GDPR compliance. After 365 days archived. |

### Lifecycle Transition Rules

| From | To | Trigger | Reversible? |
| :--- | :--- | :--- | :--- |
| CREATED | UNREAD | Implicit (no action needed) | N/A |
| UNREAD | READ | `PATCH /{id}/read` or `PATCH /read-all` | NO |
| READ | ARCHIVED | `DELETE /{id}` (user action) | NO |
| UNREAD | ARCHIVED | `DELETE /{id}` (user action) | NO |
| UNREAD or READ | ARCHIVED | Scheduler (expiry cleanup) | NO |
| ARCHIVED | HARD DELETED | Scheduler (hard delete purge) | NO |

---

## 18. Error Matrix

| Scenario | HTTP Status | Business Error Code | Message (to caller) | Recovery / Action |
| :--- | :--- | :--- | :--- | :--- |
| Missing / invalid JWT | 401 | `UNAUTHORIZED` | Authentication required. | Re-login or refresh token. |
| Non-ADMIN/MANAGER calls broadcast | 403 | `FORBIDDEN` | Insufficient role for this operation. | Deny action. |
| Notification ID not found or not owned | 404 | `NOTIF_NOT_FOUND` | Notification not found. | Ignore / refresh list. |
| Invalid UUID format for ID | 400 | `NOTIF_INVALID_ID` | Invalid notification ID format. | Correct and retry. |
| Invalid query filter (type, priority, date) | 400 | `NOTIF_INVALID_FILTER` | Invalid filter parameter: {field}. | User corrects input. |
| Invalid cursor format | 400 | `NOTIF_INVALID_FILTER` | Invalid pagination cursor. | Reset to first page. |
| Limit exceeds maximum (>50) | 400 | `NOTIF_INVALID_FILTER` | Limit must not exceed 50. | Reduce limit. |
| Payload exceeds 2KB (consumer / broadcast) | 400 | `NOTIF_PAYLOAD_TOO_LARGE` | Notification payload exceeds 2KB limit. | Producer corrects payload. |
| Unsupported notification type (consumer) | 422 | `NOTIF_UNSUPPORTED_TYPE` | Notification type not recognized. | Route to DLQ. Developer action required. |
| Broadcast with zero resolved recipients | 400 | `NOTIF_BROADCAST_EMPTY_TARGET` | No active recipients match the target scope. | Revise scope. |
| Broadcast rate limit exceeded | 429 | `RATE_LIMITED` | Broadcast rate limit exceeded. Retry after {seconds}. | Wait and retry. |
| Transient database failure | 500 | `NOTIF_DB_ERROR` | Temporary service error. Please retry. | Exponential backoff retry. |
| Unexpected internal exception | 500 | `INTERNAL_ERROR` | An unexpected error occurred. Correlation ID: {id}. | Log correlation ID, contact support. |
| Service unavailable (DB down) | 503 | `SERVICE_UNAVAILABLE` | Notification service temporarily unavailable. | Retry after backoff. |

---

## 19. Scheduler Jobs

### Job 1: Expiry Archival (Daily)
- **Schedule:** Daily at 02:00 UTC.
- **Query:** `UPDATE support_notifications SET is_archived = TRUE WHERE expires_at < NOW() AND is_archived = FALSE`.
- **Batch Size:** 10,000 rows per run with cursor-based batching to avoid lock escalation.
- **On Failure:** Log error, alert operations. Retry next scheduled run.
- **Note:** Does NOT invalidate Redis cache per user (too many cache keys). Next user poll will compute fresh count from DB.

### Job 2: Hard Delete Purge (Monthly)
- **Schedule:** First day of each month at 03:00 UTC.
- **Query:** `DELETE FROM support_notifications WHERE is_archived = TRUE AND created_at < NOW() - INTERVAL '365 days'`.
- **Batch Size:** 1,000 rows per batch to prevent long locks.
- **On Failure:** Log error, alert operations. Retry next scheduled run.
- **GDPR Compliance:** Mandatory. Ensures no indefinite data retention.

### Job 3: Bulk Broadcast Processor (On-Demand / Background)
- **Trigger:** Enqueued on `POST /api/support/notifications/broadcast`.
- **Processing:** Fetches user IDs in batches of 500. JDBC batch insert per batch.
- **Idempotency:** Each batch insert is protected by unique constraint. Partial re-run safe.
- **On Failure:** Logs failed batch with `broadcastId`. Operator can trigger re-run for specific `broadcastId`.

### Job 4: DLQ Retry (Hourly)
- **Schedule:** Every hour.
- **Action:** Attempts reprocessing of events in the Dead Letter Queue (DLQ) that were routed there due to transient failures.
- **Limit:** Max 3 retry attempts per event. After 3 failures, event is marked DEAD and alert is fired.
- **On Failure:** Log and alert. No automatic data repair.

---

## 20. Duplicate Prevention & Bulk Notification

### Duplicate Prevention

The unique constraint `(event_id, recipient_id, type)` is the system's primary idempotency mechanism:

1. Producer emits event with stable `event_id` (e.g., `reservation_created:uuid`).
2. Consumer tries to insert notification.
3. If DB raises `UniqueConstraintViolationException`: consumer catches it, logs DEBUG "Duplicate notification ignored for event_id={event_id}", acknowledges event successfully, and continues.
4. No second notification is created. No error is returned to the caller.
5. This mechanism protects against: consumer crashes and replays, duplicate outbox events, network-level redeliveries.

### Bulk Delivery Mechanics

For broadcast to 100,000+ users:

1. Admin triggers `POST /broadcast`.
2. API validates payload and estimates recipient count from `users WHERE status='ACTIVE'`.
3. API returns `202 Accepted` with `broadcastId` immediately.
4. Background worker fetches users in batches of 500 with `SELECT id FROM users WHERE ... ORDER BY id LIMIT 500 OFFSET N`.
5. For each batch: JDBC batch insert (single `INSERT INTO support_notifications VALUES (...), (...), ...` for 500 rows).
6. Each batch insert is in its own transaction. Failure of one batch does not roll back completed batches.
7. On batch failure: log with `broadcastId` and batch offset. Retry via DLQ Retry job.
8. Unique constraint absorbs any duplicate rows on retry.
9. Total estimated time for 100,000 users: ~200 batches × ~50ms per batch ≈ ~10 seconds (acceptable for async background job).

---

## 21. Test Cases

### 21.1 Positive (Happy Path) Tests

| TC-ID | Test Case | Expected Result |
| :--- | :--- | :--- |
| TC-P01 | Authenticated Driver calls GET /me with valid JWT and has notifications | Returns 200 OK with paginated notification list |
| TC-P02 | Authenticated Driver calls GET /me with no notifications | Returns 200 OK with `items: []`, `nextCursor: null` |
| TC-P03 | Driver calls GET /me/unread with 5 unread notifications | Returns 200 with `unreadCount: 5` and up to 5 items |
| TC-P04 | Driver marks a notification as read (PATCH /{id}/read) | Returns 200 with `readAt` timestamp. `read_at` is set in DB. |
| TC-P05 | Driver marks an already-read notification as read (idempotent) | Returns 200 with original `readAt`. No duplicate update. |
| TC-P06 | Driver marks all notifications as read (PATCH /read-all) | Returns 200 with `rowsAffected > 0`. All `read_at` set. |
| TC-P07 | Driver marks all as read when already all read | Returns 200 with `rowsAffected: 0`. No error. |
| TC-P08 | Driver archives a notification (DELETE /{id}) | Returns 204. Record has `is_archived=TRUE`. Not returned in subsequent GET /me. |
| TC-P09 | Driver archives an already-archived notification | Returns 204 (idempotent). |
| TC-P10 | Admin broadcasts to ALL_ACTIVE_USERS | Returns 202. Broadcast job enqueued. Users receive notification on next poll. |
| TC-P11 | Manager broadcasts to ROLE_SCOPED=DRIVER | Returns 202. Only Drivers receive notification. |
| TC-P12 | Pagination: cursor-based next page | Second page returns next 20 items with new cursor. No duplicates with first page. |
| TC-P13 | Filter by type=PAYMENT | Returns only PAYMENT type notifications. |
| TC-P14 | Filter by isRead=false | Returns only unread notifications. |
| TC-P15 | Reservation Created event consumed | Notification created for Driver with correct type, title, data_safe. |
| TC-P16 | Duplicate outbox event replayed | No second notification created. Consumer acknowledges successfully. |
| TC-P17 | Payment Failed event consumed | HIGH priority notification created for Driver. |
| TC-P18 | Expiry cleanup scheduler runs | Notifications with `expires_at < NOW()` have `is_archived=TRUE` after job run. |
| TC-P19 | Hard delete scheduler runs | Notifications with `is_archived=TRUE` and `created_at < NOW()-365d` are deleted. |
| TC-P20 | Feedback Responded event consumed for identified Driver | Driver receives FEEDBACK notification with response snippet. |

### 21.2 Negative (Unhappy Path) Tests

| TC-ID | Test Case | Expected Result |
| :--- | :--- | :--- |
| TC-N01 | GET /me without JWT | Returns 401 UNAUTHORIZED |
| TC-N02 | PATCH /{id}/read for another user's notification | Returns 404 NOTIF_NOT_FOUND (no ownership disclosure) |
| TC-N03 | PATCH /{id}/read with non-existent ID | Returns 404 NOTIF_NOT_FOUND |
| TC-N04 | DELETE /{id} for another user's notification | Returns 404 NOTIF_NOT_FOUND |
| TC-N05 | POST /broadcast by DRIVER role | Returns 403 FORBIDDEN |
| TC-N06 | POST /broadcast by STAFF role | Returns 403 FORBIDDEN |
| TC-N07 | POST /broadcast with limit=0 recipients | Returns 400 NOTIF_BROADCAST_EMPTY_TARGET |
| TC-N08 | GET /me with invalid cursor | Returns 400 NOTIF_INVALID_FILTER |
| TC-N09 | GET /me with limit=51 | Returns 400 NOTIF_INVALID_FILTER |
| TC-N10 | GET /me with invalid type filter | Returns 400 NOTIF_INVALID_FILTER |
| TC-N11 | Outbox event with unknown type | Consumer routes to DLQ. No notification created. Alert fired. |
| TC-N12 | Outbox event with payload > 2KB | Consumer routes to DLQ. No notification created. Alert fired. |
| TC-N13 | Outbox event for deleted user | Consumer drops event, logs WARNING. No notification created. |
| TC-N14 | PATCH /{id}/read with invalid UUID format | Returns 400 NOTIF_INVALID_ID |
| TC-N15 | Broadcast with HTML in title | Returns 400. HTML is rejected at validation layer. |
| TC-N16 | Anonymous Feedback Responded event | No notification dispatched (anonymous submitter has no recipient_id). |

### 21.3 Boundary Tests

| TC-ID | Test Case | Expected Result |
| :--- | :--- | :--- |
| TC-B01 | GET /me with limit=50 (max) | Returns up to 50 items. No error. |
| TC-B02 | GET /me with limit=1 | Returns 1 item. nextCursor set if more exist. |
| TC-B03 | Notification with title=255 chars | Accepted and stored. |
| TC-B04 | Notification with title=256 chars | Rejected. DB constraint or app validation prevents insert. |
| TC-B05 | Notification with body=1000 chars | Accepted and stored. |
| TC-B06 | Notification with body=1001 chars | Rejected at application validation layer. |
| TC-B07 | `data_safe` exactly 2048 bytes | Accepted and stored. |
| TC-B08 | `data_safe` 2049 bytes | Rejected. Consumer routes to DLQ. |
| TC-B09 | unreadCount=99 | Badge shows `99`. Backend returns `99`. |
| TC-B10 | unreadCount=100 | Badge shows `99+`. Backend returns `100`. |
| TC-B11 | expires_at exactly = created_at | DB constraint `chk_notif_expires_future` rejects insert. |
| TC-B12 | Pagination cursor from last item on last page | nextCursor=null, hasMore=false. Returns 200 with empty items. |

### 21.4 Security Tests

| TC-ID | Test Case | Expected Result |
| :--- | :--- | :--- |
| TC-S01 | User A calls PATCH /notifications/{user_B_notification_id}/read | Returns 404. No 403 to prevent ownership disclosure. |
| TC-S02 | User A calls GET /me with forged userId header | Header ignored. JWT sub used exclusively. |
| TC-S03 | Notification body contains `<script>alert(1)</script>` | HTML stripped before insert. `<script>` is removed. |
| TC-S04 | data_safe.redirectUrl = `http://evil.com` | Application validation rejects external URLs. Must start with `/`. |
| TC-S05 | Expired JWT on PATCH /read | Returns 401 UNAUTHORIZED. |
| TC-S06 | JWT signed with wrong secret | Returns 401 UNAUTHORIZED. |
| TC-S07 | Admin broadcasts 11 times in 1 hour | 11th request returns 429 RATE_LIMITED. |
| TC-S08 | Notification response contains event_id | Verify event_id is NOT exposed in API response body. |
| TC-S09 | Notification body contains credit card number | Consumer validation rejects and routes to DLQ. Not persisted. |
| TC-S10 | SQL injection in cursor parameter | Parameterized query prevents injection. Returns 400 NOTIF_INVALID_FILTER. |

### 21.5 Concurrency Tests

| TC-ID | Test Case | Expected Result |
| :--- | :--- | :--- |
| TC-C01 | Two simultaneous PATCH /{id}/read from different devices | First succeeds (sets read_at). Second returns 200 with original readAt. No error. |
| TC-C02 | Scheduler archives notification while user is reading it | PATCH completes if issued before archive, 404 if issued after. Both consistent. |
| TC-C03 | Outbox event replayed 5 times simultaneously | Unique constraint absorbs all duplicates. Only 1 notification created. |
| TC-C04 | Broadcast to 1,000 users with 2 concurrent workers | Unique constraint prevents duplicates. Each user gets exactly 1 notification. |
| TC-C05 | PATCH /read-all while GET /me in flight | GET returns snapshot at its query time. Next GET reflects updated read state. |

### 21.6 Performance Tests

| TC-ID | Test Case | Expected Result |
| :--- | :--- | :--- |
| TC-PERF01 | GET /me with user having 10,000 archived notifications | Response time < 150ms due to partial index `WHERE is_archived=FALSE`. |
| TC-PERF02 | GET /me/unread with 1,000 unread notifications | Response time < 150ms (Redis cache or indexed DB query). |
| TC-PERF03 | Broadcast to 100,000 users | Completes background job within 60 seconds. No DB lock escalation. |
| TC-PERF04 | Expiry cleanup on 500,000 rows | Job completes within 10 minutes using batched cursor update. |
| TC-PERF05 | 100 concurrent GET /me/unread requests | All respond < 150ms. No N+1 queries. DB connection pool not exhausted. |

### 21.7 Integration Tests

| TC-ID | Test Case | Expected Result |
| :--- | :--- | :--- |
| TC-I01 | End-to-end: Reservation Created → Outbox → Consumer → Notification visible to Driver | Full flow verified. Notification in DB matches event data. |
| TC-I02 | End-to-end: Payment Failed → Notification → Driver reads → unreadCount decremented | Full flow verified. |
| TC-I03 | Feedback Responded → identified Driver sees notification | Notification created with feedbackId in data_safe. |
| TC-I04 | Anonymous Feedback Responded → no notification dispatched | Verify no notification created for anonymous feedback. |
| TC-I05 | Monthly Pass Expiring scheduler → 3-day notification sent once | Notification created. Duplicate flag set. No second notification on next scheduler run. |
| TC-I06 | Dashboard unread badge query matches /me/unread API | Count is identical. No discrepancy. |
| TC-I07 | Admin broadcast → Audit log entry created | Audit log contains: actor_id, scope, estimated_recipients, initiated_at. |
| TC-I08 | End-to-end: Monthly Pass Approved → Driver pays → Pass Activated → Two notifications in sequence | Two distinct notifications in DB. Driver receives both with correct type, priority, and data_safe. |
| TC-I09 | End-to-end: Pricing Updated → broadcast to 500 active Drivers → all receive exactly 1 PRICE_CHANGE notification | 500 notifications created. No duplicates. Each has unique event_id derived from original. |
| TC-I10 | End-to-end: Parking Session Started → Overtime Warning → Session Completed → Driver receives 3 notifications in sequence | 3 notifications created in correct order. Each has correct type (PARKING_SESSION) and priority. |
| TC-I11 | Cross-feature: Reservation Created → Payment Successful → Reservation Confirmed → 3 notifications for Driver | 3 distinct notifications. Ordered by created_at DESC. Driver reads all 3 in sequence. |
| TC-I12 | Account Locked → notification persisted → user re-authenticates → sees CRITICAL banner on first load | Notification present on login. Banner shown. data_safe.redirectUrl = /support/contact. |
| TC-I13 | Feedback submitted by identified Driver → Manager receives FEEDBACK notification → Manager reads → Driver not notified at submit stage | Manager notification created. Driver receives no notification at submission time (only on response). |
| TC-I14 | Monthly Pass Expiry: 3-day warning sent → 1-day warning sent next day → expired notification sent on expiry date | 3 separate MONTHLY_PASS notifications. Each idempotent (unique constraint per event_id). |

---

## 22. Acceptance Criteria

### AC-01: Notification Delivery Correctness
- Every business event listed in the Notification Event Matrix (E01–E38) MUST produce exactly one notification per target recipient.
- No event in the matrix may be silently dropped without an alert to operations.
- Duplicate events MUST NOT produce duplicate notifications.

### AC-02: API Response Time
- `GET /me` MUST respond in < 150ms at P95 for users with up to 1,000 non-archived notifications.
- `GET /me/unread` MUST respond in < 100ms at P95 with Redis cache active.
- `PATCH /{id}/read` MUST respond in < 100ms at P95.

### AC-03: Ownership Security
- Zero instances where User A can read, mark, or archive User B's notification. Verified by security test suite.
- Zero instances where a Driver or Staff can trigger a broadcast. Verified by security test suite.

### AC-04: Idempotency
- Sending the same outbox event 5 times in sequence MUST result in exactly 1 notification record in the database.
- Calling `PATCH /{id}/read` 10 times MUST return the same `readAt` value each time with no error.
- Calling `DELETE /{id}` twice MUST return `204 No Content` both times with no error.

### AC-05: Data Integrity
- No notification in the database may have `read_at < created_at`. Verified by DB constraint.
- No notification may have `expires_at <= created_at`. Verified by DB constraint.
- No notification body or title may contain an HTML tag. Verified by automated content scan.
- No notification `data_safe` may contain a credit card number pattern. Verified by automated content scan.

### AC-06: Retention Compliance
- After 90 days: notifications are archived (not deleted). Verified by scheduler test.
- After 365 days post-archival: notifications are hard-deleted. Verified by scheduler test.

### AC-07: Broadcast Scale
- A broadcast to 100,000 active users MUST complete background processing within 60 seconds.
- MUST NOT cause DB lock escalation (P99 query latency must not spike > 5x during broadcast).
- MUST be logged in the Audit Log before the 202 response is returned.

### AC-08: Frontend Badge Accuracy
- After `PATCH /read`: unread badge count decreases by exactly 1 within 1 UI cycle.
- After `PATCH /read-all`: unread badge clears to 0 within 1 UI cycle.
- After `DELETE /{id}` on unread notification: unread badge decreases by 1 within 1 UI cycle.
- Badge never shows 0 unless all notifications are read or archived.

### AC-09: Unhappy Path Handling
- Every error scenario in the Unhappy Paths table (U01–U25) MUST return the documented HTTP status and error code.
- No 500 error may expose a stack trace in the response body.
- Every 500 error MUST include a `correlationId` in the response for traceability.

### AC-10: Consumer Reliability
- Consumer MUST NOT crash the entire process when a single malformed event is encountered.
- Consumer MUST successfully process the next valid event immediately after routing a poison pill to DLQ.
- DLQ retry job MUST attempt reprocessing at least once per hour for up to 3 attempts.

### AC-11: Scheduler Reliability
- Expiry cleanup job MUST run daily and process all expired rows within 10 minutes.
- Hard delete job MUST run monthly and process all eligible archived rows within 30 minutes.
- Failed scheduler runs MUST trigger an operational alert.

### AC-12: Cursor Pagination
- No user may see the same notification twice in sequential paginated calls under normal conditions.
- No notification may be skipped in sequential paginated calls unless it was archived/expired between requests.

---

## 24. Navigation Rules

Every notification type has a defined frontend navigation target. The frontend MUST use `data_safe.redirectUrl` exclusively for navigation. `data_safe.targetType` provides context for UI rendering. This section formalizes the navigation contract per notification type.

### Navigation Rule: RESERVATION

| Business Event | `targetType` | `targetId` | `redirectUrl` | Frontend Action |
| :--- | :--- | :--- | :--- | :--- |
| Reservation Created | `RESERVATION` | `reservationId` | `/reservations/{id}` | Navigate to reservation detail page |
| Reservation Confirmed | `RESERVATION` | `reservationId` | `/reservations/{id}` | Navigate to reservation detail page |
| Reservation Cancelled | `RESERVATION` | `reservationId` | `/reservations/{id}` | Navigate to reservation detail page (shows CANCELLED state) |
| Reservation Expiring | `RESERVATION` | `reservationId` | `/reservations/{id}/payment` | Navigate to payment page for the reservation |
| Reservation Expired | `RESERVATION` | `reservationId` | `/reservations/{id}` | Navigate to reservation detail (shows EXPIRED state) |
| Reservation Extended | `RESERVATION` | `reservationId` | `/reservations/{id}` | Navigate to reservation detail with new end time |
| Slot Reassigned | `RESERVATION` | `reservationId` | `/reservations/{id}` | Navigate to reservation detail showing new slot |

**Navigation Guard:** If the reservation no longer exists when Driver navigates, frontend shows "This reservation is no longer available" and does NOT crash.

---

### Navigation Rule: PAYMENT

| Business Event | `targetType` | `targetId` | `redirectUrl` | Frontend Action |
| :--- | :--- | :--- | :--- | :--- |
| Payment Successful | `PAYMENT` | `paymentId` | `/payments/{id}` | Navigate to payment receipt page |
| Payment Failed | `PAYMENT` | `paymentId` | `/payments/{id}/retry` | Navigate to payment retry page |
| Payment Waived | `PAYMENT` | `paymentId` | `/payments/{id}` | Navigate to payment detail showing WAIVED state |
| Payment Under Review | `PAYMENT` | `paymentId` | `/payments/{id}` | Navigate to payment detail showing UNDER_REVIEW state |

**Navigation Guard:** Payment retry URL MUST only work if payment is still in a retriable state. If Driver navigates after payment is already resolved, redirect to `/payments/{id}` instead.

---

### Navigation Rule: PARKING_SESSION

| Business Event | `targetType` | `targetId` | `redirectUrl` | Frontend Action |
| :--- | :--- | :--- | :--- | :--- |
| Parking Session Started | `PARKING_SESSION` | `sessionId` | `/sessions/{id}` | Navigate to live session status page |
| Overtime Warning | `PARKING_SESSION` | `sessionId` | `/sessions/{id}/extend` | Navigate to session extend/action page |
| Parking Session Completed | `PARKING_SESSION` | `sessionId` | `/sessions/{id}` | Navigate to session receipt/summary |

---

### Navigation Rule: MONTHLY_PASS

| Business Event | `targetType` | `targetId` | `redirectUrl` | Frontend Action |
| :--- | :--- | :--- | :--- | :--- |
| Application Submitted (Driver confirm) | `MONTHLY_PASS` | `applicationId` | `/monthly-passes/applications/{id}` | Navigate to application status page |
| Application Under Review | `MONTHLY_PASS` | `applicationId` | `/monthly-passes/applications/{id}` | Navigate to application status page |
| Application Approved | `MONTHLY_PASS` | `applicationId` | `/monthly-passes/applications/{id}/pay` | Navigate to payment page for pass activation |
| Application Rejected | `MONTHLY_PASS` | `applicationId` | `/monthly-passes/applications/{id}` | Navigate to application showing rejection reason |
| Pass Purchased / Activated | `MONTHLY_PASS` | `passId` | `/monthly-passes/{id}` | Navigate to active pass detail |
| Card Bound | `MONTHLY_PASS` | `passId` | `/monthly-passes/{id}` | Navigate to pass detail showing bound card |
| Pass Expiring (3d / 1d) | `MONTHLY_PASS` | `passId` | `/monthly-passes/{id}/renew` | Navigate to renewal page |
| Pass Expired | `MONTHLY_PASS` | `passId` | `/monthly-passes/{id}/renew` | Navigate to renewal page with expired state |
| Pass Suspended | `MONTHLY_PASS` | `passId` | `/monthly-passes/{id}` | Navigate to pass detail showing suspension reason |
| Pass Renewed | `MONTHLY_PASS` | `passId` | `/monthly-passes/{id}` | Navigate to pass detail with new period |

---

### Navigation Rule: PRICING (PRICE_CHANGE)

| Business Event | `targetType` | `targetId` | `redirectUrl` | Frontend Action |
| :--- | :--- | :--- | :--- | :--- |
| Pricing Updated | `PRICING` | `null` | `/pricing` | Navigate to the public pricing information page |

**Note:** `targetId` is always `null` for PRICE_CHANGE. No specific entity is referenced.

---

### Navigation Rule: FEEDBACK

| Business Event | `targetType` | `targetId` | `redirectUrl` | Frontend Action |
| :--- | :--- | :--- | :--- | :--- |
| Feedback Submitted (Manager alert) | `FEEDBACK` | `feedbackId` | `/admin/feedbacks/{id}` | Navigate to Manager feedback queue detail |
| Feedback Assigned (Staff alert) | `FEEDBACK` | `feedbackId` | `/admin/feedbacks/{id}` | Navigate to Staff feedback detail for action |
| Feedback Responded (Driver alert) | `FEEDBACK` | `feedbackId` | `/feedbacks/{id}` | Navigate to Driver's own feedback showing the response |
| Feedback Closed (Driver alert) | `FEEDBACK` | `feedbackId` | `/feedbacks/{id}` | Navigate to Driver's own closed feedback |
| Feedback Rejected (Driver alert) | `FEEDBACK` | `feedbackId` | `/feedbacks/{id}` | Navigate to Driver's own feedback showing rejection |

**Note:** Staff and Manager see `/admin/feedbacks/{id}`. Drivers see `/feedbacks/{id}` (own-only view). Both routes resolve to the correct scoped view per role.

---

### Navigation Rule: SYSTEM

| Business Event | `targetType` | `targetId` | `redirectUrl` | Frontend Action |
| :--- | :--- | :--- | :--- | :--- |
| Account Locked | `SYSTEM` | `null` | `/support/contact` | Navigate to support contact page |
| Account Unlocked | `SYSTEM` | `null` | `/profile/security` | Navigate to security settings page |
| Password Changed | `SYSTEM` | `null` | `/profile/security` | Navigate to security settings page |
| System Announcement | `SYSTEM` | `announcementId` (or null) | `/announcements/{id}` or `/announcements` | Navigate to announcement detail or list |
| System Maintenance | `SYSTEM` | `null` | `/announcements` | Navigate to announcements list |
| Emergency Notice | `SYSTEM` | `null` | `/announcements` | Navigate to announcements list |
| Role/Building Broadcast | `SYSTEM` | `null` | `/announcements` | Navigate to announcements list |

**Navigation Guard for SYSTEM:** If `targetId` is `null`, the frontend navigates to the `redirectUrl` path directly without attempting to load an entity detail. If `redirectUrl` results in 404, show a generic "This content is no longer available" message.

---

### General Navigation Rules

| Rule | Description |
| :--- | :--- |
| **Relative paths only** | `redirectUrl` always starts with `/`. External URLs (http://, https://) are rejected at backend validation. |
| **SPA routing** | Navigation uses the SPA router (`history.pushState`), never a full page reload. |
| **404 guard** | Every navigation target MUST gracefully handle 404 (entity deleted) without crashing the app. |
| **Role guard** | Navigation to `/admin/feedbacks/{id}` from a Driver's JWT is blocked by role guard on the target page. Notification does not bypass page-level RBAC. |
| **Read-before-navigate** | The frontend marks the notification as read BEFORE navigating. If mark-read fails: navigate anyway, retry mark-read in background. |
| **No external redirect** | The frontend MUST validate that `redirectUrl` starts with `/` before trusting it. If it does not, navigate to `/` instead and log a security warning. |

---

## 25. Polling Strategy

### 25.1 Current Implementation: REST Polling

The current implementation uses client-initiated REST polling. No server push, WebSocket, or SSE is used.

**Design Rationale:**
- Simple to implement and debug.
- No persistent connection state to manage on the server.
- Resilient: polling automatically self-heals after network interruptions.
- Acceptable latency for a parking management system where 30-second delay is tolerable.

### 25.2 Polling Endpoints

| Endpoint | Purpose | Polling Trigger |
| :--- | :--- | :--- |
| `GET /api/support/notifications/me/unread` | Unread count + preview for badge | Every 30 seconds (background timer) |
| `GET /api/support/notifications/me` | Full notification list | On-demand (user opens tray, applies filter, loads more) |

**Rule:** Frontend NEVER polls `/me` in the background. Only `/me/unread` is polled automatically. `/me` is fetched on explicit user interaction only.

### 25.3 Polling Lifecycle

```
[Session Starts]
      │
      ▼
[Immediate fetch: GET /me/unread] ──► [Display badge]
      │
      ▼
[Start 30s interval timer]
      │
      ▼
[Every 30s: GET /me/unread] ──► [Update badge]
      │
      ├── [Tab becomes hidden] ──► [Pause interval timer]
      │
      ├── [Tab becomes visible] ──► [Immediate fetch + Resume timer]
      │
      ├── [User performs PATCH /read or PATCH /read-all] ──► [Update badge immediately (don't wait for next poll)]
      │
      └── [Session ends / component unmounts] ──► [Cancel AbortController. Clear interval timer.]
```

### 25.4 Polling Implementation Rules

| Rule | Description |
| :--- | :--- |
| **Interval:** 30 seconds | Configurable via environment variable `NOTIFICATION_POLL_INTERVAL_MS`. Default: 30000. |
| **Immediate on load** | First poll fires immediately on component mount. Do not wait for the first interval. |
| **Pause on hidden tab** | Use `document.addEventListener('visibilitychange')`. Pause when `document.visibilityState === 'hidden'`. |
| **Resume on visible tab** | Resume timer AND fire an immediate fetch when `document.visibilityState === 'visible'`. |
| **AbortController** | All in-flight requests cancelled on component unmount to prevent state updates on unmounted component. |
| **No parallel requests** | If a poll is already in-flight when the next 30s fires, skip the new poll. Reset timer after the in-flight request completes. |
| **Error handling** | Poll failure does NOT stop the timer. Failed polls are retried on the next interval. After 4 consecutive failures, show error state in badge area. |
| **Backoff on 503** | On 503 response, double the poll interval (up to 120 seconds max). Reset to 30s on first success. |
| **Jitter** | Add ±5 seconds of random jitter to the interval to prevent thundering herd when many users log in simultaneously. |

### 25.5 Polling and Notification Freshness

| Scenario | Behavior |
| :--- | :--- |
| New notification arrives between polls | Driver sees it within ≤30 seconds (next poll). This is expected and acceptable. |
| User reads notification on Device A | Device B will see updated count within ≤30 seconds (next poll). |
| User receives CRITICAL notification | Frontend checks for CRITICAL items on every `/me/unread` response. Banner shown immediately on detection. |
| Notification expires between polls | Expired notification disappears from list on next `/me` fetch. Unread count corrects on next `/me/unread` poll. |

### 25.6 Future Enhancement: Real-Time Delivery

> ⚠️ The following are FUTURE ENHANCEMENT only. Not part of current implementation.

- **WebSocket:** Persistent bidirectional channel. Server pushes `{unreadCount, latestNotification}` on every new notification. Eliminates polling. Requires connection state management.
- **Server-Sent Events (SSE):** Unidirectional server-push. Simpler than WebSocket. Server pushes events on new notification creation. Client reconnects on drop.
- **Firebase Cloud Messaging (FCM) / APNs:** Mobile push for offline users. Separate device token registration flow required.

---

## 26. Cross-Feature Business Flows

This section documents end-to-end flows that span multiple PBMS modules, showing how Notification integrates into the broader system.

---

### CF-01: Full Reservation-to-Completion Flow with Notifications

```
[DRIVER]
   │
   ├─ Step 1: Driver creates reservation
   │     → .NET: POST /api/core/reservations
   │     → DB: reservation created (PENDING_PAYMENT)
   │     → Outbox event: RESERVATION_CREATED
   │     → Spring Boot: notification inserted (type=RESERVATION, NORMAL)
   │     → Frontend: badge +1
   │
   ├─ Step 2: Driver pays for reservation
   │     → .NET: PayOS webhook → PAYMENT_SUCCESSFUL
   │     → DB: reservation moves to CONFIRMED
   │     → Outbox events: PAYMENT_SUCCESSFUL + RESERVATION_CONFIRMED
   │     → Spring Boot: 2 notifications inserted
   │     → Frontend: badge +2
   │
   ├─ Step 3: Driver arrives and enters parking
   │     → .NET: gate opens → PARKING_SESSION_STARTED
   │     → DB: session opened (ACTIVE)
   │     → Spring Boot: notification inserted (type=PARKING_SESSION, NORMAL)
   │     → Frontend: badge +1
   │
   ├─ Step 4: Session completes normally
   │     → Driver exits → .NET: PARKING_SESSION_COMPLETED
   │     → DB: session closed
   │     → Spring Boot: notification inserted (type=PARKING_SESSION, NORMAL)
   │     → Frontend: badge +1
   │
   ├─ Step 5: Driver reads all notifications
   │     → PATCH /read-all
   │     → All 4 notifications marked read
   │     → Redis cache cleared
   │     → Frontend: badge = 0
   │
   └─ Step 6: Dashboard
         → Dashboard widget polls GET /me/unread → returns 0
         → Dashboard shows no pending notifications for this user

[AUDIT LOG]
   No audit entry required for standard Driver reads.
   Audit entries only for Admin/Manager broadcast actions.
```

---

### CF-02: Monthly Pass Full Lifecycle with Notifications

```
[DRIVER → MANAGER → DRIVER]
   │
   ├─ Step 1: Driver submits application
   │     → .NET: POST /api/core/monthly-passes/applications
   │     → Outbox: MONTHLY_PASS_APPLICATION_SUBMITTED
   │     → Spring Boot: 2 notifications:
   │         (a) Driver: "Your application was submitted" (NORMAL)
   │         (b) All Managers: "New pass application pending review" (NORMAL)
   │
   ├─ Step 2: Manager reviews and approves
   │     → .NET: PATCH application status → APPROVED_PENDING_PAYMENT
   │     → Outbox: MONTHLY_PASS_APPLICATION_APPROVED
   │     → Spring Boot: Driver notification:
   │         "Your application is approved. Pay to activate." (HIGH)
   │
   ├─ Step 3: Driver pays
   │     → .NET: PayOS webhook → pass ACTIVE
   │     → Outbox: MONTHLY_PASS_ACTIVATED
   │     → Spring Boot: Driver notification:
   │         "Your monthly pass is now active!" (HIGH)
   │
   ├─ Step 4: 3 days before expiry
   │     → .NET Scheduler: PASS_EXPIRING_3D
   │     → Spring Boot: Driver notification:
   │         "Your pass expires in 3 days" (HIGH)
   │
   ├─ Step 5: 1 day before expiry
   │     → .NET Scheduler: PASS_EXPIRING_1D
   │     → Spring Boot: Driver notification:
   │         "Your pass expires tomorrow" (HIGH)
   │
   └─ Step 6: Pass expired (no renewal)
         → .NET Expiry Worker: MONTHLY_PASS_EXPIRED
         → Spring Boot: Driver notification:
             "Your monthly pass has expired. Renew now." (HIGH)
             data_safe.redirectUrl = /monthly-passes/{id}/renew

Total notifications for full lifecycle: 7 (Driver: 6, Manager: 1)
```

---

### CF-03: Payment Failure with Reconciliation Flow

```
[DRIVER → SYSTEM → MANAGER]
   │
   ├─ Step 1: Driver initiates payment
   │     → PayOS fails immediately
   │     → .NET: PAYMENT_FAILED
   │     → Spring Boot: Driver notification (HIGH):
   │         "Payment failed. Please retry."
   │
   ├─ Step 2: Discrepancy detected later by reconciliation
   │     → .NET Reconciliation Worker: payment → UNDER_REVIEW
   │     → Outbox: PAYMENT_UNDER_REVIEW
   │     → Spring Boot: 2 notifications:
   │         (a) Driver: "Your payment is under review" (HIGH)
   │         (b) Manager: "Payment discrepancy needs review" (HIGH)
   │
   ├─ Step 3: Manager resolves (confirm paid)
   │     → .NET: payment → PAID
   │     → Outbox: PAYMENT_SUCCESSFUL
   │     → Spring Boot: Driver notification (NORMAL):
   │         "Your payment has been confirmed."
   │
   └─ Step 4: Both Driver and Manager read their notifications
         → PATCH /read-all for each user
         → Audit log: Manager's review action (audited in Payment Review module)
         → Notification module: no additional audit for standard reads
```

---

### CF-04: System Maintenance Broadcast → All Users

```
[ADMIN → ALL USERS → DASHBOARD]
   │
   ├─ Step 1: Admin creates maintenance broadcast
   │     → POST /api/support/notifications/broadcast
   │       {title, body, type: SYSTEM, priority: HIGH, scope: ALL_ACTIVE_USERS}
   │     → Spring Security: validates ADMIN role
   │     → API validates payload
   │     → Audit Log: entry written BEFORE 202 response
   │     → API returns 202 Accepted immediately
   │
   ├─ Step 2: Background worker runs
   │     → SELECT users WHERE status='ACTIVE' in batches of 500
   │     → JDBC batch insert 500 rows per batch
   │     → Unique event_id per user: {broadcastId}:{userId}
   │     → Each row: expires_at = NOW() + 90 days
   │
   ├─ Step 3: All users' next poll
   │     → GET /me/unread → unreadCount increases by 1
   │     → Frontend shows badge increment
   │     → CRITICAL/HIGH notifications show banner on next render
   │
   ├─ Step 4: Users read notification
   │     → PATCH /{id}/read per user (or PATCH /read-all)
   │     → Badge cleared
   │     → Frontend: navigates to /announcements list
   │
   └─ Step 5: Dashboard
         → Admin's dashboard shows "Broadcast sent to N users" in Audit Log
         → Notification counts reflect eventual read/unread state per user
```

---

### CF-05: Feedback Submitted → Staff Notified → Driver Notified on Response

```
[DRIVER → MANAGER → STAFF → DRIVER]
   │
   ├─ Step 1: Driver submits feedback
   │     → POST /api/support/feedbacks
   │     → Spring Boot Feedback module: saves feedback (NEW)
   │     → Internal event: FEEDBACK_SUBMITTED
   │     → Notification module (same service, direct call):
   │         Notification for all Managers: "New feedback received" (NORMAL)
   │
   ├─ Step 2: Manager assigns feedback to Staff
   │     → PUT feedback status → IN_REVIEW + assigned_to = staffId
   │     → Internal event: FEEDBACK_ASSIGNED
   │     → Notification module: notification for Staff (assignee) (NORMAL)
   │
   ├─ Step 3: Staff responds
   │     → PUT feedback status → RESPONDED + response text
   │     → Internal event: FEEDBACK_RESPONDED
   │     → Notification module: notification for Driver (NORMAL):
   │         "Response to your feedback: {snippet...}"
   │
   ├─ Step 4: Driver reads response
   │     → PATCH /{id}/read → navigates to /feedbacks/{id}
   │     → Driver sees full response in feedback detail
   │
   └─ Step 5: Manager closes feedback
         → PUT feedback status → CLOSED
         → Internal event: FEEDBACK_CLOSED
         → Notification module: notification for Driver (NORMAL):
             "Your feedback has been resolved and closed."

Anonymous feedback: Steps 3, 4, 5 produce NO Driver notification (no recipient_id).
```

---

### CF-06: Account Security Flow with Notifications

```
[SYSTEM → AFFECTED USER]
   │
   ├─ Step 1: Excessive failed login attempts
   │     → .NET Auth: account locked
   │     → Outbox: ACCOUNT_LOCKED {event_id, recipientId, lockReasonCategory}
   │     → Spring Boot: notification (CRITICAL):
   │         "Your account has been locked."
   │         data_safe.redirectUrl = /support/contact
   │     → JWT invalidated (session already dead)
   │
   ├─ Step 2: User next logs in (after resolution)
   │     → Login succeeds (Admin unlocked)
   │     → Frontend: first poll → sees CRITICAL notification
   │     → CRITICAL banner displayed immediately
   │     → Badge shows count
   │
   ├─ Step 3: Admin unlocks account
   │     → .NET Auth: ACCOUNT_UNLOCKED outbox event
   │     → Spring Boot: notification (NORMAL):
   │         "Your account has been unlocked. We recommend changing your password."
   │         data_safe.redirectUrl = /profile/security
   │
   └─ Step 4: User reads both notifications
         → PATCH /read-all
         → Navigates to /profile/security to change password
         → Password Changed → new notification (HIGH): security alert
```

---

### CF-07: Notification → Dashboard Integration

```
[NOTIFICATION MODULE → DASHBOARD]
   │
   ├─ Dashboard loads for authenticated user
   │     → Dashboard widget calls GET /api/support/notifications/me/unread
   │     → Response: {unreadCount: N, items: [...], asOf: timestamp}
   │     → Dashboard renders unread badge/bell widget
   │
   ├─ User reads a notification from Dashboard widget
   │     → PATCH /api/support/notifications/{id}/read
   │     → Dashboard widget immediately decrements badge count by 1
   │     → No full page reload
   │
   ├─ Dashboard polling (every 30s, same as notification tray)
   │     → Shared polling instance if Dashboard and Notification tray are on same page
   │     → Single poll serves both Dashboard badge and tray badge
   │     → Do NOT create two separate polling timers for the same endpoint
   │
   └─ Dashboard Report Integration
         → Reports module uses notification count data only for:
             - Audit log entries (Admin broadcast actions)
             - NOT for notification read rate or delivery metrics (Future Enhancement only)
```

---

## 27. UAT Checklist

This section defines User Acceptance Testing criteria. Each item must be verified by a QA Engineer or Business Analyst with a test user before production deployment sign-off.

### UAT-01: Notification Delivery (Driver)

- [ ] Create a reservation as a Driver. Verify notification appears in notification tray within 30 seconds.
- [ ] Pay for the reservation. Verify payment success notification appears.
- [ ] Allow a reservation to expire (set short deadline in test environment). Verify expiry notification appears.
- [ ] Cancel a reservation. Verify cancellation notification appears with reason.
- [ ] Enter parking (gate open). Verify Parking Session Started notification appears.
- [ ] Exit parking. Verify Parking Session Completed notification appears with final fee.

### UAT-02: Monthly Pass Lifecycle (Driver + Manager)

- [ ] Driver submits monthly pass application. Verify Driver sees submission confirmation. Verify Manager sees "new application" notification.
- [ ] Manager approves application. Verify Driver sees HIGH-priority "Approved" notification with payment link.
- [ ] Driver completes payment. Verify Driver sees HIGH-priority "Pass Activated" notification.
- [ ] Wait for 3-day warning (set expiry to 3 days in test environment). Verify HIGH-priority expiry warning notification.
- [ ] Wait for 1-day warning. Verify separate HIGH-priority 1-day warning notification (not duplicate of 3-day).
- [ ] Allow pass to expire. Verify "Pass Expired" HIGH-priority notification with renewal link.

### UAT-03: Notification Read and Badge Behavior

- [ ] Verify unread badge shows correct count after each notification arrives.
- [ ] Click one notification. Verify badge decrements by 1. Verify notification shows as read in list.
- [ ] Click "Mark All as Read". Verify badge clears to 0. Verify all items show read state.
- [ ] Dismiss (archive) an unread notification. Verify badge decrements. Verify item disappears from list.
- [ ] Open notification tray on two devices simultaneously. Read on Device A. Verify badge on Device B updates within 30 seconds.

### UAT-04: Navigation Deep Links

- [ ] Click a RESERVATION notification. Verify navigation to correct reservation detail page.
- [ ] Click a PAYMENT notification. Verify navigation to correct payment detail or retry page.
- [ ] Click a MONTHLY_PASS notification. Verify navigation to correct pass or application page.
- [ ] Click a PARKING_SESSION notification. Verify navigation to correct session page.
- [ ] Click a FEEDBACK notification (Driver). Verify navigation to Driver's feedback detail.
- [ ] Click a FEEDBACK notification (Manager). Verify navigation to admin feedback queue detail.
- [ ] Click a SYSTEM notification. Verify navigation to correct target (contact, security settings, announcements).
- [ ] Click a PRICE_CHANGE notification. Verify navigation to public pricing page.
- [ ] Delete the related reservation. Click the old reservation notification. Verify "record not found" message shown gracefully.

### UAT-05: Admin Broadcast

- [ ] Admin sends broadcast to ALL_ACTIVE_USERS. Verify all test users receive notification within 60 seconds.
- [ ] Manager sends broadcast to DRIVER_ONLY. Verify only Drivers receive it. Staff and Admin do not.
- [ ] Manager sends broadcast to BUILDING_ROLE_SCOPED. Verify only users in the specified building and role receive it.
- [ ] Verify Audit Log contains the broadcast entry with: actor, scope, estimated_recipients, initiated_at.
- [ ] Driver attempts to broadcast. Verify 403 FORBIDDEN response.

### UAT-06: Polling Behavior

- [ ] Session active: verify GET /me/unread is called every ~30 seconds in browser DevTools Network tab.
- [ ] Switch browser tab to background. Verify polling pauses (no network requests while hidden).
- [ ] Switch tab back to foreground. Verify immediate fetch fires + polling resumes.
- [ ] Verify no duplicate polling timers when Dashboard and notification tray are both open.

### UAT-07: Security Verification

- [ ] Log in as Driver A. Attempt to call PATCH /notifications/{Driver_B_notification_id}/read using Driver A's JWT. Verify 404 response.
- [ ] Log in with expired JWT. Call GET /me. Verify 401 UNAUTHORIZED.
- [ ] Attempt to access GET /me without any token. Verify 401 UNAUTHORIZED.
- [ ] Lock a test user account. Verify CRITICAL notification appears on their next login with correct banner behavior.

### UAT-08: Edge Cases

- [ ] User with 0 notifications opens tray. Verify empty state illustration shown. No error.
- [ ] User opens tray with 100+ notifications. Verify `99+` displayed in badge. Verify backend returns exact count.
- [ ] Apply filter by type=PAYMENT. Verify only payment notifications listed. Verify filter chip visible.
- [ ] Clear filter. Verify all notifications restored.
- [ ] Load multiple pages via "Load More". Verify no duplicate notifications across pages.

---

## 28. Production Deployment Checklist

This checklist must be completed before deploying the Notification module to production.

### Infrastructure

- [ ] PostgreSQL `support_notifications` table created with all constraints, indexes, and CHECK constraints.
- [ ] All 6 indexes verified: `idx_notif_recipient_created`, `idx_notif_recipient_unread`, `idx_notif_expires_at`, `idx_notif_archived_created`, `idx_notif_recipient_type`, `idx_notif_recipient_priority`.
- [ ] `UNIQUE(event_id, recipient_id, type)` constraint verified active.
- [ ] Redis instance configured and reachable by Spring Boot (if using unread count cache). Fallback to DB verified.
- [ ] Environment variable `NOTIFICATION_POLL_INTERVAL_MS` set (default: 30000).

### Scheduler Jobs

- [ ] Job 1 (Expiry Archival): configured to run daily at 02:00 UTC.
- [ ] Job 2 (Hard Delete Purge): configured to run first day of each month at 03:00 UTC.
- [ ] Job 3 (Bulk Broadcast Processor): background worker active and responding.
- [ ] Job 4 (DLQ Retry): configured to run hourly.
- [ ] All scheduler jobs emit operational alerts on failure.

### Security

- [ ] All notification endpoints require JWT. Verified via Spring Security filter chain.
- [ ] Broadcast endpoint `@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")` verified.
- [ ] `WHERE recipient_id = JWT.sub` enforced on all read/write operations. No path-parameter userId accepted.
- [ ] HTML stripping active on all incoming event payloads.
- [ ] `redirectUrl` validation: must start with `/`. External URLs blocked.
- [ ] Rate limiting on broadcast endpoint: max 10 per hour per actor. Verified.
- [ ] No `event_id` exposed in API responses.

### Integration

- [ ] Outbox consumer polling from .NET Core outbox table: interval configured and verified.
- [ ] Consumer exponential backoff configured: 1s, 2s, 4s, 8s, 16s — max 5 retries before DLQ.
- [ ] DLQ table exists and consumer correctly routes poison pills there.
- [ ] Audit Log integration: broadcast actions write to centralized audit log table.
- [ ] Feedback internal event integration: verified that Feedback Responded/Closed events trigger Driver notifications.

### Performance

- [ ] Load test: 100 concurrent `GET /me/unread` requests — all respond < 150ms.
- [ ] Load test: 1,000 concurrent `PATCH /read` requests — all respond < 100ms.
- [ ] Broadcast test: 100,000 users — background job completes within 60 seconds.
- [ ] Index coverage verified: EXPLAIN ANALYZE on primary read queries shows index scan (not sequential scan).

### Monitoring

- [ ] Metric: `notification_consumer_dlq_count` — alert if DLQ grows > 10 in 1 hour.
- [ ] Metric: `notification_insert_error_rate` — alert if error rate > 1%.
- [ ] Metric: `notification_api_p95_latency` — alert if `/me` P95 > 200ms.
- [ ] Metric: `broadcast_job_duration_seconds` — alert if broadcast takes > 120s.
- [ ] Metric: `scheduler_job_failure_count` — alert on any scheduler job failure.
- [ ] Log: correlation IDs present in all 500 error responses.

### Acceptance Sign-Off

- [ ] All UAT items in §27 verified and signed off by QA Lead.
- [ ] All Acceptance Criteria in §22 verified and signed off by QA Lead.
- [ ] Security review signed off by Security Lead.
- [ ] Database schema reviewed and signed off by DBA.
- [ ] Backend API reviewed and signed off by Backend Tech Lead.
- [ ] Frontend behavior reviewed and signed off by Frontend Lead.

---

## 23. Future Enhancements

> ⚠️ The following features are explicitly documented as Future Enhancements only.
> They MUST NOT be implemented in the current phase.
> They MUST NOT be referenced in current API contracts or database schemas (no future-proofing columns).

### FE-01: WebSocket Real-Time Delivery
Replace polling with WebSocket connections for zero-latency notification delivery. Eliminates the 30-second polling delay. Requires connection state management and reconnect logic.

### FE-02: Server-Sent Events (SSE)
Alternative to WebSocket: unidirectional server-push channel for notification delivery. Simpler protocol, suitable for notification-only scenarios.

### FE-03: Firebase Cloud Messaging (FCM) / APNs Mobile Push
Push notifications to mobile devices when users are offline or the app is in the background. Requires device token registration and management.

### FE-04: Email Notification Integration
Trigger email notifications from the same notification events. Requires email worker separate from this module. Email template management.

### FE-05: User Notification Preferences
Allow users to opt-in/opt-out of specific notification types (e.g., "Mute PRICE_CHANGE notifications"). Requires a `user_notification_preferences` table and preference check at dispatch time.

### FE-06: Notification Aggregation / Grouping
Group multiple similar notifications into one aggregated item (e.g., "You have 5 new feedback replies"). Reduces badge noise for high-volume events.

### FE-07: Notification Priority Escalation
If a HIGH priority notification is unread after X hours, escalate to email or mobile push automatically.

### FE-08: Rich Notification Content
Support for images, action buttons, and structured content in notification body (beyond plain text).

### FE-09: Notification Templates with Versioning
Centralized, versioned template management for notification content. Allows non-developer content updates.

### FE-10: Notification Read Analytics
Track read rates, click-through rates, and delivery latency per notification type. Requires analytics pipeline.

### FE-11: Notification Channels (Multi-Channel)
Allow the same notification event to dispatch to multiple channels simultaneously (in-app + email + SMS) with per-channel opt-out.

### FE-12: Archive Restore
Allow users to view and restore archived (dismissed) notifications within a configurable window.

---
---

# AI Implementation Guide: Notification Dispatch

**Target Path:** Notifications > Notification Dispatch (`leaf-notif-dispatch`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API / System  
**API:** internal Core outbox consumer

## 1. Summary / Objective
Convert committed domain events into one or more durable in-app recipient notifications.

## 6. Main Flow (Happy Path)
1. Consumer reads event from Outbox table (polled at configurable interval, default 5 seconds).
2. System validates schema and payload safety (Max 2KB, type enum, no HTML, no PII patterns).
3. System validates `recipient_id` exists in `users` table with `status = ACTIVE` (soft validation).
4. System resolves recipient and template (e.g., "Your reservation {id} is confirmed").
5. System batch-inserts into `support_notifications` with `expires_at = NOW() + 90 days`.
6. Outbox event is marked as consumed atomically.

## 8. Failure Flows (Unhappy Path)
- **Database Down:** Transient persistence failure triggers exponential backoff retries (1s, 2s, 4s, 8s, 16s). After 5 failures, event is moved to DLQ. Operations alert fired.
- **Poison Message / Schema Mismatch:** Payload fails validation (unknown type, payload > 2KB, empty after HTML strip). Immediately routed to DLQ to prevent Head-of-Line blocking. Alert operations.
- **Duplicate Event Received:** Unique constraint `(event_id, recipient_id, type)` triggers a silent consumer acknowledgement (idempotent skip). Log at DEBUG level.
- **User Not Found / Deleted:** Soft validation fails. Log WARNING. Drop event. Move to DLQ only if consistently failing across retries.
- **HTML in Content:** Strip HTML. If result is empty, route to DLQ.
- **PII Pattern Detected:** Route to DLQ. Alert security team.

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
2. Parse and validate all query parameters (cursor, limit, type, priority, isRead, from, to).
3. Build parameterized query: `WHERE recipient_id = {sub} AND is_archived = FALSE AND expires_at > NOW()`.
4. Apply optional filters for type, priority, isRead, from, to.
5. Apply cursor: `WHERE (created_at, id) < (cursor.createdAt, cursor.id)` for next-page queries.
6. Execute `ORDER BY created_at DESC, id DESC LIMIT {limit+1}` (fetch one extra to determine `hasMore`).
7. If `items.length > limit`: set `hasMore = true`, remove last item, encode `nextCursor` from last included item.
8. Return 200 OK with `items`, `nextCursor`, `hasMore`, and `totalUnread` (from Redis or quick DB count).

## 7. Alternative & Edge Cases
- **Empty List:** Returns `200 OK` with empty `items` array. Do not return 404.
- **Expired while paging:** Automatically excluded by the query `expires_at > NOW()`.
- **All filtered out:** Returns `200 OK` with empty items and no nextCursor.
- **Type filter with comma-separated values:** `WHERE type IN ('RESERVATION','PAYMENT')`.

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
2. Check Redis Cache for `unreadCount:{sub}`. If cache miss, query DB for count.
3. Execute: `SELECT COUNT(*) FROM support_notifications WHERE recipient_id={sub} AND read_at IS NULL AND is_archived=FALSE AND expires_at > NOW()`.
4. Store count in Redis with 15-second TTL.
5. Fetch preview items: `SELECT ... WHERE recipient_id={sub} AND read_at IS NULL AND is_archived=FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT {previewLimit}`.
6. Return `unreadCount`, `items`, and `asOf = NOW()`.

## 8. Failure Flows & Edge Cases
- **Concurrent Mark Read:** If a separate thread marks an item read during this fetch, the database snapshot isolation ensures the count and items match the exact `asOf` timestamp. Next UI poll will reconcile.
- **Count > 99:** UI should display "99+", but backend returns exact count.
- **Redis Unavailable:** Fall back to DB query. Log warning metric. Do not fail the request.
- **unreadCount = 0:** Return `200 OK` with `{ unreadCount: 0, items: [] }`. Never 404.

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
2. Validate `id` is a valid UUID format.
3. Execute `UPDATE support_notifications SET read_at = NOW() WHERE id = {id} AND recipient_id = {sub} AND read_at IS NULL`.
4. If rows affected = 1: Clear Redis Cache `unreadCount:{sub}`. Return 200 OK with `{id, readAt: NOW()}`.
5. If rows affected = 0: Execute `SELECT read_at FROM support_notifications WHERE id = {id} AND recipient_id = {sub} AND is_archived = FALSE`.
   - If found with `read_at IS NOT NULL`: Return 200 OK with `{id, readAt: existing_read_at}` (idempotent).
   - If not found: Return 404 `NOTIF_NOT_FOUND`.

## 7. Alternative Flows & Edge Cases
- **Duplicate Clicks (Idempotency):** If user double-clicks, the second request yields `rows affected = 0`. Backend falls back to `SELECT read_at`, returning 200 OK with the *original* `readAt`.
- **Notification archived before read:** SELECT returns no row → 404.
- **Notification expired:** SELECT filtered by business logic → 404.

> **Audit Finding:** Duplicate clicks (race conditions) were not strictly addressed for the PATCH endpoint.
> **Impact:** HTTP 500s or incorrect unread counts if a user multi-clicked the notification on a slow network.

---

# AI Implementation Guide: Mark All as Read

**Target Path:** Notifications > Mark All Read (`leaf-notif-read-all`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Driver, Staff, Manager, Admin  
**API:** `PATCH /api/support/notifications/read-all`

## 1. Summary / Objective
Mark all unread notifications for the user as read in one atomic operation.

## 6. Main Flow
1. Extract `sub`.
2. Execute `UPDATE support_notifications SET read_at = NOW() WHERE recipient_id = {sub} AND read_at IS NULL AND is_archived = FALSE`.
3. Clear Redis Cache `unreadCount:{sub}` (set to 0 or delete key).
4. Return 200 OK with `{ rowsAffected: N, updatedAt: NOW() }`.
5. If `rowsAffected = 0` (already all read): Return 200 OK `{ rowsAffected: 0 }`. No error.

## 8. Failure Flows
- **DB failure mid-update:** Transaction rolls back. Redis cache is NOT invalidated (stays consistent with DB). Return 500.
- **Concurrent read-all from two devices:** One UPDATE wins; second sees `rowsAffected = 0`. Both return 200. Consistent outcome.

---

# AI Implementation Guide: Archive Notification

**Target Path:** Notifications > Archive Notification (`leaf-notif-archive`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Driver, Staff, Manager, Admin  
**API:** `DELETE /api/support/notifications/{id}`

## 1. Summary / Objective
Allows a user to dismiss/hide a notification (soft delete). Idempotent.

## 6. Main Flow
1. Extract `sub`.
2. Validate `id` is a valid UUID format.
3. First: check current state to handle cache correctly: `SELECT id, read_at, is_archived FROM support_notifications WHERE id = {id} AND recipient_id = {sub}`.
4. If not found: Return 404 `NOTIF_NOT_FOUND`.
5. If `is_archived = TRUE` already: Return 204 No Content (idempotent).
6. Execute `UPDATE support_notifications SET is_archived = TRUE WHERE id = {id} AND recipient_id = {sub} AND is_archived = FALSE`.
7. If `read_at` was NULL before archive: decrement Redis `unreadCount:{sub}` by 1 (or invalidate cache).
8. Return 204 No Content.

## 8. Failure Flows
- **Foreign ID / Not Owned:** Return `404 NOT_FOUND` to prevent ownership disclosure.
- **DB failure:** Return 500. Do not update Redis cache.
- **Concurrent archive from two devices:** First UPDATE sets `is_archived=TRUE`. Second UPDATE affects 0 rows (already archived). Both return 204. Consistent.

---

# AI Implementation Guide: Broadcast Notification

**Target Path:** Notifications > Broadcast Notification (`leaf-notif-broadcast`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Admin, Manager  
**API:** `POST /api/support/notifications/broadcast`

## 1. Summary / Objective
Allow Admin or Manager to dispatch a notification to a scoped set of active users asynchronously.

## 6. Main Flow
1. Extract `sub` and validate role = `ADMIN` or `MANAGER`.
2. Validate request payload (title length, body length, type enum, priority enum, scope, conditionally required buildingId/targetRole).
3. Validate `data_safe` if provided (schema, size).
4. Resolve target user IDs by scope:
   - `ALL_ACTIVE_USERS`: `SELECT id FROM users WHERE status='ACTIVE'`
   - `DRIVER_ONLY`: `WHERE role='DRIVER' AND status='ACTIVE'`
   - `ROLE_SCOPED`: `WHERE role={targetRole} AND status='ACTIVE'`
   - `BUILDING_ROLE_SCOPED`: `WHERE role={targetRole} AND building_id={buildingId} AND status='ACTIVE'`
5. If resolved count = 0: Return 400 `NOTIF_BROADCAST_EMPTY_TARGET`.
6. Write Audit Log entry: `{actor_id, role, action=NOTIFICATION_BROADCAST, scope, estimated_recipients, title, initiated_at}`.
7. Return `202 Accepted` with `{broadcastId, status: QUEUED, estimatedRecipients}`.
8. Background job: fetches user IDs in batches of 500. For each batch: generate one `event_id` per recipient, JDBC batch insert into `support_notifications`. Each batch is its own transaction. On batch failure: log with `broadcastId` and batch offset for retry.

## 8. Failure Flows
- **Role validation fails:** Return 403 FORBIDDEN. No audit log entry.
- **Payload validation fails:** Return 400. No audit log entry. No job enqueued.
- **Zero recipients:** Return 400 NOTIF_BROADCAST_EMPTY_TARGET. No job enqueued.
- **Batch insert failure mid-job:** Log failed batch. Retry via DLQ retry job. Already-inserted batches are protected by unique constraint on retry.
- **Rate limit exceeded:** Return 429 RATE_LIMITED. No job enqueued.

---
**Readiness Verification:** **READY FOR IMPLEMENTATION**.

---

## Self-Review Checklist

> This checklist answers the final question: "Is there ANY missing business flow, validation rule, edge case, integration, database rule, API behavior, frontend behavior, security rule, ownership rule, business rule, or system interaction?"

| Category | Status | Notes |
| :--- | :--- | :--- |
| Business Objective | ✅ Complete | All 4 sub-sections documented |
| Business Scope (In/Out/Assumptions/Constraints/Dependencies) | ✅ Complete | All 5 sub-sections documented |
| Notification Event Matrix | ✅ Complete | 38 events covering all PBMS modules |
| Notification Type Matrix | ✅ Complete | 7 types with priority, navigation targets |
| Receiver Matrix | ✅ Complete | All receiver roles and resolution rules |
| Feature Interaction Matrix | ✅ Complete | All 11 PBMS modules covered |
| Ownership Matrix | ✅ Complete | Module, data, and mutation ownership |
| Business Rules | ✅ Complete | 20 explicit business rules (BR-01 to BR-20) |
| Happy Paths | ✅ Complete | 15 end-to-end flows (HP-01 to HP-15) covering all event types |
| Unhappy Paths | ✅ Complete | 25 failure scenarios with HTTP codes |
| Edge Cases | ✅ Complete | 18 edge cases documented |
| API Review | ✅ Complete | 6 endpoints with full request/response/error spec |
| Database Schema | ✅ Complete | Full DDL, indexes, constraints, column spec |
| Validation Rules | ✅ Complete | API input + consumer-side validation |
| Security Review | ✅ Complete | Auth, authz, horizontal/vertical escalation, XSS, SQL injection, rate limiting |
| Frontend Behavior | ✅ Complete | 12 sub-sections covering all UI behavior |
| Notification Lifecycle | ✅ Complete | Full state machine with diagram |
| Error Matrix | ✅ Complete | 12 error scenarios with codes and recovery |
| Scheduler Jobs | ✅ Complete | 4 jobs with schedule, query, batch size |
| Duplicate Prevention & Bulk | ✅ Complete | Idempotency and bulk mechanics |
| Test Cases | ✅ Complete | 80+ test cases across 7 categories + 8 additional integration tests |
| Acceptance Criteria | ✅ Complete | 12 measurable acceptance criteria |
| **Navigation Rules** | ✅ Complete | §24: Per-type navigation contract for all 7 notification types |
| **Polling Strategy** | ✅ Complete | §25: Formal polling lifecycle, rules, and error handling |
| **Cross-Feature Business Flows** | ✅ Complete | §26: 7 end-to-end cross-module flows (CF-01 to CF-07) |
| **UAT Checklist** | ✅ Complete | §27: 8 UAT categories with 40+ verification items |
| **Production Deployment Checklist** | ✅ Complete | §28: Infrastructure, Scheduler, Security, Integration, Performance, Monitoring sign-off |
| Future Enhancements | ✅ Complete | 12 future enhancements clearly separated |
| AI Implementation Guides | ✅ Complete | 7 implementation guides (Dispatch, User, Unread, Read, ReadAll, Archive, Broadcast) |

---

> **Final Audit Verdict:** The Notification Module specification is **COMPLETE and PRODUCTION-READY**.
> All business flows, API contracts, database rules, validation rules, security rules, edge cases, integration points, frontend behaviors, navigation contracts, UAT criteria, and deployment checklists have been documented.
> No obvious missing requirement remains.

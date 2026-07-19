# Category: Public Information

**Shared decisions:** SDR-01/03/09/15/20 apply. These Support APIs are anonymous, read-only, rate limited and cached no longer than 60 seconds. They expose only approved aggregate/display fields. `Public Pricing` (`leaf-pub-price`) is fully specified in [06-pricing.md](06-pricing.md).

---

# AI Implementation Guide: Parking Info

**Target Path:** Public Information > Parking Info (`leaf-pub-info`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Guest, Driver  
**API:** `GET /api/public/parking-info`

## 1. Summary / Objective
Publish stable visitor-facing building contact/location/hours information.
## 2. Scope
Approved public profile/read projection; no dynamic operations, staff/contact/private config.
## 3. Actors / Roles / Permissions
Anonymous; rate limited.
## 4. Preconditions
Public profile projection exists/approved.
## 5. Postconditions
No mutation; cache/asOf metadata supplied.
## 6. Main Flow
Read approved public profile/version and return safe fields.
## 7. Alternative Flows
Temporarily unavailable service hours display explicit status/message only when approved.
## 8. Failure Flows
Projection unavailable yields retryable error, no internal config output.
## 9. Business Rules
Fields limited to display name, address, contact channel, opening hours, accessibility/visitor notes; no gate/device/occupancy/personnel data.
## 10. API Contracts
Response `{name,address,contact,hours,visitorNotes,asOf,cacheTtlSeconds}`.
## 11. Data Requirements
Support public profile projection/version/publish status.
## 12. Validation Rules
No input except optional locale from allow-list.
## 13. Duplicate, Retry and Concurrency Rules
Safe GET/cache ≤60s; event version invalidates cache.
## 14. Security Requirements
Rate limit, field allow-list, no internal admin notes.
## 15. Logging / Audit / Observability
Rate/cache/error/freshness metrics only.
## 16. Frontend Behavior
Public info card with loading/error/retry and asOf where operational status shown.
## 17. Edge Cases
Missing optional contact hides field rather than exposing fallback private number.
## 18. Automated Test Cases
Anonymous success, cache/event update, field allow-list, outage, rate limit/locale.
## 19. Acceptance / Done Criteria
API has no personal/operational-security leakage.
## 20. Decisions and Assumptions
Public profile edit workflow is configuration backlog, not needed for read readiness.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Public Rules

**Target Path:** Public Information > Public Rules (`leaf-pub-rules`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Guest, Driver  
**API:** `GET /api/public/rules`

## 1. Summary / Objective
Publish approved customer parking rules/version without legal/internal draft content.
## 2. Scope
Read current public policy sections/version/effective date; no acceptance tracking/edit.
## 3. Actors / Roles / Permissions
Anonymous; rate limited.
## 4. Preconditions
At least one approved published rule set.
## 5. Postconditions
No mutation; returns rule version/effective time/asOf.
## 6. Main Flow
Select one published current rule version and return ordered safe sections.
## 7. Alternative Flows
Future approved version may be shown with effective date only when public policy allows.
## 8. Failure Flows
No published rules → retryable configuration error/503, not hidden generic content.
## 9. Business Rules
Rules are display content, not a runtime fee/permission engine; price/session command use Core policy snapshots.
## 10. API Contracts
Response `{version,effectiveFrom,sections:[{id,title,content}],asOf}`.
## 11. Data Requirements
Support public rule projection/publish/effective status/version.
## 12. Validation Rules
Locale allow-list; section text sanitized plain/approved rich text.
## 13. Duplicate, Retry and Concurrency Rules
Safe GET/cache/event version handling.
## 14. Security Requirements
Only published content; sanitize markup/CSP-safe rendering.
## 15. Logging / Audit / Observability
Availability/cache metrics, no client PII log.
## 16. Frontend Behavior
Version/effective label, accessible section anchors, error/retry fallback.
## 17. Edge Cases
Future/expired versions are never selected as current due to UTC effective boundary.
## 18. Automated Test Cases
Current/future boundary, no published, content sanitization, cache update, anonymous/rate limit.
## 19. Acceptance / Done Criteria
Public rules are deterministic/current and cannot alter business enforcement.
## 20. Decisions and Assumptions
Legal approval workflow is external; API consumes only published state.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Public Available Slots

**Target Path:** Public Information > Public Available Slots (`leaf-pub-avail`; also fulfills `leaf-struct-avail`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Guest, Driver  
**API:** `GET /api/public/available-slots`

## 1. Summary / Objective
Publish coarse current availability for visitors without revealing operational layout/security details.
## 2. Scope
Aggregate availability by public vehicle category; no slot IDs, maps, reservations or guarantee.
## 3. Actors / Roles / Permissions
Anonymous/Driver; rate limited.
## 4. Preconditions
Support occupancy projection has current enough watermark.
## 5. Postconditions
No capacity mutation; aggregate/asOf/cache TTL returned.
## 6. Main Flow
Read approved aggregate available counts by type, subtract non-public/out-of-service capacity, return coarse status.
## 7. Alternative Flows
Low/zero capacity may return status `LIMITED`/`FULL`; exact counts use configuration threshold policy.
## 8. Failure Flows
Stale/unavailable projection returns unavailable response rather than last value beyond freshness cap.
## 9. Business Rules
Response is not a reservation/hold; never exposes slot/floor/area/gate/occupied plate/session/card data.
## 10. API Contracts
Response `{items:[{vehicleType,availabilityStatus,count?}],asOf,cacheTtlSeconds,disclaimer}`.
## 11. Data Requirements
Support aggregate occupancy/config projection and freshness watermark; no Core direct read.
## 12. Validation Rules
Optional vehicle type filter is approved public code; no location/driver IDs.
## 13. Duplicate, Retry and Concurrency Rules
Safe GET/cache ≤60s; Core allocation state remains authoritative for booking/entry.
## 14. Security Requirements
Rate limiting/aggregation thresholds; count can be omitted/bucketed when low capacity policy requires.
## 15. Logging / Audit / Observability
Rate/cache/freshness/error metrics; no user tracking beyond privacy-safe operational telemetry.
## 16. Frontend Behavior
Show “not guaranteed”, asOf/stale/unavailable state, link to reservation/login not direct hold.
## 17. Edge Cases
Counts may change after response; clients must never infer a specific slot or capacity reservation.
## 18. Automated Test Cases
Aggregate/mask, zero/limited, stale suppression, cache invalidation, no slot field, rate limit.
## 19. Acceptance / Done Criteria
Both duplicate taxonomy leaves map to one secure canonical public availability contract.
## 20. Decisions and Assumptions
Exact count versus bucket is configuration; default returns count when ≥ configured privacy threshold.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

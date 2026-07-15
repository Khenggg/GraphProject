# Category: Pricing

**Shared decisions:** SDR-04/05/12/15/20 apply. Pricing is Core-owned command data with a Support public projection. Existing reservation/session/pass snapshots never change after a later configuration mutation.

## Category-level rules

- VND decimal-zero precision; all rules use explicit UTC effective periods and priority.
- A rule covers exactly one purpose: `SESSION`, `RESERVATION`, `MONTHLY_PASS`, or `LOST_CARD`; selection is deterministic by active state, compatible vehicle type/scope, then higher priority, then latest version.
- Delete means retire/deactivate; it is never a history-destroying hard delete.

---

# AI Implementation Guide: Pricing Rule CRUD

**Target Path:** Pricing > Pricing Rule CRUD (`leaf-price-crud`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Manager, Admin  
**API:** `GET/POST /api/core/pricing-rules`, `GET/PUT /api/core/pricing-rules/{id}`, `DELETE /api/core/pricing-rules/{id}`, `PATCH /api/core/pricing-rules/{id}/reservation-hourly-price`

## 1. Summary / Objective
Create/read/version/retire rules used to price reservations, sessions, passes and lost-card penalties.
## 2. Scope
Rule management and price preview validation; excludes fee settlement and retroactive repricing.
## 3. Actors / Roles / Permissions
Manager standard operations; Admin recovery; all require reason/version.
## 4. Preconditions
Active compatible vehicle type, valid purpose/rate data, non-overlapping ambiguous effective range.
## 5. Postconditions
Versioned rule is active/retired; `PricingRuleChanged` is published after audit commit.
## 6. Main Flow
Validate scope/time/rate, detect conflict under transaction, save new version, publish read projection.
## 7. Alternative Flows
Reservation-hourly patch creates a new version/effective period, not an in-place modification of booked prices.
## 8. Failure Flows
Ambiguous overlap, invalid money, referenced hard-delete/stale version → typed validation/conflict/state error.
## 9. Business Rules
Fields include `purpose,vehicleTypeId?,effectiveFrom,effectiveTo?,priority,rateType,amount,unitMinutes?`; only `FLAT` or `HOURLY` rate type; no negative/free amount except approved waiver is not pricing.
## 10. API Contracts
Write `{purpose,vehicleTypeId?,effectiveFrom,effectiveTo?,priority,rateType,amount,unitMinutes?,version?,reason}`; DELETE retires and returns status/version; list filters purpose/type/active/asOf.
## 11. Data Requirements
`pricing_rules` immutable version/effective range/status; snapshot tables on reservation/session/pass; audit/outbox.
## 12. Validation Rules
VND integer ≥0; hourly unitMinutes 1–1440; effective end > start; priority integer; one unambiguous effective winner per scope.
## 13. Duplicate, Retry and Concurrency Rules
POST/PATCH/PUT/DELETE need idempotency key and version; overlap validation/insert serialized by scope/time lock/constraint.
## 14. Security Requirements
Manager/Admin RBAC; client never supplies a calculated session amount as authoritative.
## 15. Logging / Audit / Observability
Audit old/new rule/reason; alert pricing ambiguity/rejection and projection lag.
## 16. Frontend Behavior
Timeline view warns about overlap, effective date/time UTC/local conversion, and displays immutable snapshot notice.
## 17. Edge Cases
Retiring a current rule requires a non-ambiguous successor for a purpose marked mandatory; historic snapshots remain resolvable.
## 18. Automated Test Cases
Create each purpose; valid/invalid range; overlap/priority; VND precision; snapshot immutability; retire; stale/replay; authorization.
## 19. Acceptance / Done Criteria
Every calculator has exactly one deterministic rule or returns a configuration error before money is collected.
## 20. Decisions and Assumptions
Deterministic selection stated above is an `[ASSUMPTION FOR READINESS]`; commercial amounts remain ODR-02 configuration.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Public Pricing

**Target Path:** Pricing > Public Pricing (`leaf-price-public`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Guest, Driver  
**API:** `GET /api/public/pricing`

## 1. Summary / Objective
Publish active customer-facing rates without internal rules or personal data.
## 2. Scope
Read-only current price display; not personalized quote, booking calculation or configuration.
## 3. Actors / Roles / Permissions
Anonymous and authenticated users; rate limited.
## 4. Preconditions
Support active-price projection has consumed Core rule event.
## 5. Postconditions
No mutation; response has `asOf`, currency and cache metadata.
## 6. Main Flow
Read active public-safe projections at current UTC and return grouped vehicle/purpose display rates.
## 7. Alternative Flows
No price available for a public purpose returns empty section, not internal error detail.
## 8. Failure Flows
Projection unavailable → retryable service response; malformed query never reveals rule internals.
## 9. Business Rules
Displayed rate is informational; final reservation/session quote is Core snapshot at command time.
## 10. API Contracts
Query `asOf?` limited to current/future public schedule; response `{currency:"VND",items:[vehicleType,purpose,displayRate,effectiveFrom],asOf}`.
## 11. Data Requirements
Support public projection contains only active display fields/version/asOf.
## 12. Validation Rules
No arbitrary rule IDs; asOf UTC restricted to configured public horizon.
## 13. Duplicate, Retry and Concurrency Rules
Safe GET, 60-second maximum cache under SDR-20; event consumer uses version.
## 14. Security Requirements
No internal priority, margin, audit reason, future unapproved rule or configuration identity exposed.
## 15. Logging / Audit / Observability
Rate-limit/cache/projection freshness metrics; no sensitive logging.
## 16. Frontend Behavior
Show “from/effective at” and non-binding disclaimer; loading/empty/retry per SDR-10.
## 17. Edge Cases
When rule turns effective during cache TTL, cache invalidates on event or expires within 60 seconds.
## 18. Automated Test Cases
Anonymous success; masked internal fields; event update/cache; no price; stale projection; rate limit.
## 19. Acceptance / Done Criteria
Public display never becomes the fee authority.
## 20. Decisions and Assumptions
One-minute cache cap follows SDR-20.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

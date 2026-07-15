# Category: Reporting & Analytics

**Shared decisions:** SDR-03/05/09/20 apply. Spring Boot Support API owns read projections/reports only; Core command state and audit rows remain source events. Every response has UTC `asOf`, the report period/timezone used for grouping, and projection freshness. Report timestamps are stored/queried UTC; display timezone is request/configured IANA zone.

## Category-level metric definitions

- Revenue = settled `PAID` payments by `settledAt`, excluding `UNDER_REVIEW`; `WAIVED` is reported separately; no refund metric exists while ODR-01 is open.
- Traffic = session entries/exits by authoritative entry/closed timestamps; `EXIT_AUTHORIZED` is not an exit.
- Occupancy = current `OCCUPIED` slot count plus approved non-slot active area occupancy; `RESERVED` is separate, never reported as occupied.
- Exports are CSV UTF-8 only in this release, max 10,000 rows/request; large/scheduled export is a future feature. Results use the same query snapshot as on-screen reports.

---

# AI Implementation Guide: Support Dashboard

**Target Path:** Reporting & Analytics > Support Dashboard (`leaf-rep-dashboard`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Manager, Admin  
**API:** `GET /api/support/dashboard`

## 1. Summary / Objective
Present a role-scoped operational overview from read projections.
## 2. Scope
Current KPI tiles/trends/alerts; no command/action execution.
## 3. Actors / Roles / Permissions
Manager gets operating scope; Admin gets building-wide operational scope.
## 4. Preconditions
JWT/role valid and projection health known.
## 5. Postconditions
No mutation; dashboard indicates `asOf` and stale/partial components.
## 6. Main Flow
Authorize, load versioned aggregates in parallel, return per-widget data/freshness.
## 7. Alternative Flows
Optional unavailable widget returns `UNAVAILABLE` widget state while essential summary remains when safe.
## 8. Failure Flows
No projection/authorization failure yields typed response; UI does not invent zero values.
## 9. Business Rules
Tiles use category metric definitions; values are not cached beyond SDR-20 freshness policy.
## 10. API Contracts
Query `{from?,to?,timezone?}`; data `{occupancy,reservation,payment,incident,health,asOf,widgets[]}`.
## 11. Data Requirements
Support aggregate projections, event watermark, manager scope model.
## 12. Validation Rules
Range ≤31 days for dashboard, valid IANA timezone, no arbitrary SQL metric name.
## 13. Duplicate, Retry and Concurrency Rules
Safe GET; each widget carries source watermark to resolve event lag.
## 14. Security Requirements
Role/row scope, no PII/card/plate/payment reference in tiles.
## 15. Logging / Audit / Observability
Dashboard access/latency/widget failure and projection lag metrics.
## 16. Frontend Behavior
Independent widget skeleton/error, `asOf`/stale badges, drilldowns only to authorized reports.
## 17. Edge Cases
Cross-midnight grouping uses requested display timezone while source selection remains UTC.
## 18. Automated Test Cases
Role scope, metric math, partial widget failure, stale flag, timezone boundary, PII absence.
## 19. Acceptance / Done Criteria
Dashboard communicates data freshness and cannot trigger Core mutation.
## 20. Decisions and Assumptions
Manager scope defaults building-wide until multi-site scope is configured.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Revenue Report

**Target Path:** Reporting & Analytics > Revenue Report (`leaf-rep-revenue`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Manager, Admin  
**API:** `GET /api/support/reports/revenue`

## 1. Summary / Objective
Report settled revenue and its method/purpose breakdown.
## 2. Scope
Aggregates/drilldown summary; no financial adjustment or provider payload view.
## 3. Actors / Roles / Permissions
Manager/Admin; sensitive row details only Admin export path.
## 4. Preconditions
Valid role and date grouping request.
## 5. Postconditions
Read-only result with defined settled population/asOf.
## 6. Main Flow
Select `PAID` payments by settlement time, group period/method/purpose and separately aggregate waived/review totals.
## 7. Alternative Flows
No settled payment returns zero-valued aggregate with explanatory counts.
## 8. Failure Flows
Invalid range/grouping → validation; lag/stale projection clearly labeled.
## 9. Business Rules
`UNDER_REVIEW` excluded from revenue, cash/online separated, waiver is non-revenue metric.
## 10. API Contracts
Query `{from,to,groupBy:DAY|WEEK|MONTH,method?,purpose?,timezone?}` → `{series,totals,waivedTotal,underReviewTotal,asOf}`.
## 11. Data Requirements
Payment settlement projection with purpose/method/amount/currency/settledAt and watermark.
## 12. Validation Rules
Range ≤366 days; valid group/timezone/enums; VND output integer.
## 13. Duplicate, Retry and Concurrency Rules
Safe snapshot query; provider duplicate event already eliminated upstream.
## 14. Security Requirements
No provider reference/customer/contact in aggregate response.
## 15. Logging / Audit / Observability
Privileged report access, query/lag/error metric.
## 16. Frontend Behavior
Chart/table, explicit totals/exclusions, CSV export hands same filters to Generic Export.
## 17. Edge Cases
Payment settled after booking cancellation remains under review/excluded per SDR-16, not silently counted.
## 18. Automated Test Cases
Paid/waived/review separation, methods, timezone grouping, range guard, scope/PII, asOf.
## 19. Acceptance / Done Criteria
Revenue calculation is reproducible from documented settlement population.
## 20. Decisions and Assumptions
No tax/refund metric until ODR-01/commercial policy adds it.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Traffic Report

**Target Path:** Reporting & Analytics > Traffic Report (`leaf-rep-traffic`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Manager, Admin  
**API:** `GET /api/support/reports/traffic`

## 1. Summary / Objective
Report entry/verified exit volume by gate/time/type.
## 2. Scope
Aggregate operational traffic; no live session command or plate lookup.
## 3. Actors / Roles / Permissions
Manager/Admin.
## 4. Preconditions
Valid period/group/gate scope.
## 5. Postconditions
Read-only source-watermarked aggregate.
## 6. Main Flow
Group session `enteredAt` and `closedAt` events; calculate duration only for closed sessions.
## 7. Alternative Flows
Active/authorized sessions appear current-state count, not exited traffic.
## 8. Failure Flows
Invalid grouping/range or stale source produces typed/flagged result.
## 9. Business Rules
Barrier acknowledgement never counts as exit; cancel/test sessions excluded unless explicit admin diagnostic filter.
## 10. API Contracts
Query `{from,to,groupBy,gatewayId?,vehicleTypeId?,timezone?}` → `{entries,verifiedExits,activeCount,avgClosedDuration,asOf}`.
## 11. Data Requirements
Session event projection with entry/close timestamps, gate/type/status.
## 12. Validation Rules
Range/group/enums/IANA timezone, no arbitrary vehicle/plate filter.
## 13. Duplicate, Retry and Concurrency Rules
Safe snapshot; event version preserves one entry/close count.
## 14. Security Requirements
Aggregate-only; no identity/card/plate in normal report.
## 15. Logging / Audit / Observability
Access/lag/aggregation latency metric.
## 16. Frontend Behavior
Entries/exits trend with definition tooltip and stale label.
## 17. Edge Cases
Session crosses reporting boundary: entry counts by entry time and exit by closed time independently.
## 18. Automated Test Cases
Entry/closed/authorized classification, boundary/timezone, gate/type filter, dedupe, PII exclusion.
## 19. Acceptance / Done Criteria
Traffic reflects physical-passage-confirmed closure, not optimistic exit authorization.
## 20. Decisions and Assumptions
Duration uses closed minus entry UTC timestamps.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Occupancy Report

**Target Path:** Reporting & Analytics > Occupancy Report (`leaf-rep-occupancy`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Manager, Admin  
**API:** `GET /api/support/reports/occupancy`

## 1. Summary / Objective
Report current/historical configured capacity, occupied, reserved and out-of-service counts.
## 2. Scope
Aggregate/read model; no slot state change or allocation recommendation.
## 3. Actors / Roles / Permissions
Manager/Admin.
## 4. Preconditions
Projection available and date/scope valid.
## 5. Postconditions
No mutation; capacity status snapshot/asOf returned.
## 6. Main Flow
Aggregate active config and allocation events by floor/area/type/time bucket.
## 7. Alternative Flows
Historical point uses saved projection bucket; current view uses latest watermark.
## 8. Failure Flows
Unknown historical retention/date range → validation/not-found, never false zero.
## 9. Business Rules
`OCCUPIED`,`RESERVED`,`AVAILABLE`,`OUT_OF_SERVICE` shown separately; non-slot area counters are separate from physical slots.
## 10. API Contracts
Query `{asOf?,from?,to?,floorId?,areaId?,groupBy?}` → `{capacity,available,reserved,occupied,outOfService,nonSlotOccupancy,asOf}`.
## 11. Data Requirements
Config version/allocation state/history buckets, capacity counter events/watermark.
## 12. Validation Rules
One current or bounded historical range, UUID scope/group enums.
## 13. Duplicate, Retry and Concurrency Rules
Safe projection read; source transition event idempotence required.
## 14. Security Requirements
Managers see operational aggregate; public availability is a separate masked API.
## 15. Logging / Audit / Observability
Projection lag/count invariant mismatch alert.
## 16. Frontend Behavior
Stacked status chart, no “occupied” inference from reserved, freshness indicator.
## 17. Edge Cases
Out-of-service slot with a prior active session is retained/flagged inconsistency rather than silently excluded.
## 18. Automated Test Cases
Slot/non-slot counts, status separation, history boundary, configuration changes, invariants, scope.
## 19. Acceptance / Done Criteria
Report totals reconcile with state machine and never double count a slot.
## 20. Decisions and Assumptions
Historical bucket interval/retention is deployment configuration.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Card Session Report

**Target Path:** Reporting & Analytics > Card Session Report (`leaf-rep-card`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Manager, Admin  
**API:** `GET /api/support/reports/card-session`

## 1. Summary / Objective
Provide authorized audit-oriented usage history for physical cards and sessions.
## 2. Scope
Paged card/session correlation report; no card command/UID export by default.
## 3. Actors / Roles / Permissions
Manager summary/masked UID; Admin may see full UID only in audited detail policy.
## 4. Preconditions
Valid privileged role and bounded filter period.
## 5. Postconditions
No mutation; each row has asOf/source status.
## 6. Main Flow
Filter card/session projection by status/date/gate/card suffix, apply field masking/scope.
## 7. Alternative Flows
Lost/blocked card history remains visible but not selectable for operation.
## 8. Failure Flows
Unbounded/full-UID query rejected; unauthorized full detail denied.
## 9. Business Rules
Default card identifier is masked; sessions retain card UID snapshot even after card replacement.
## 10. API Contracts
Query `{from,to,status?,gateId?,cardSuffix?,page,pageSize}` → `{items:[sessionId,cardMasked,status,enteredAt,closedAt?,gateSummary],asOf}`.
## 11. Data Requirements
Card/session read projection with masked/full field policy and audit access entry.
## 12. Validation Rules
Date max 90d for detailed report; suffix 2–4 allowed chars; enum/paging.
## 13. Duplicate, Retry and Concurrency Rules
Safe GET, source event version dedupe.
## 14. Security Requirements
PII/UID masking, privilege audit, no raw QR/card secret.
## 15. Logging / Audit / Observability
Audit full-detail/export request and unusual query volume.
## 16. Frontend Behavior
Masked table, narrow filters, role-gated reveal requiring reason if policy enabled.
## 17. Edge Cases
Card retired/lost does not sever historic session relation.
## 18. Automated Test Cases
Mask/full scope, suffix filter, lost card, period guard, audit, event dedupe.
## 19. Acceptance / Done Criteria
Card reporting supports operations without becoming a tracking-data leak.
## 20. Decisions and Assumptions
Manager default never sees full UID; Admin reveal policy is audited.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Generic Report Export

**Target Path:** Reporting & Analytics > Generic Report Export (`leaf-rep-export`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Manager, Admin  
**API:** `GET /api/support/reports/export`

## 1. Summary / Objective
Export an authorized predefined report query as safe CSV.
## 2. Scope
Synchronous CSV for whitelisted report types/filters; excludes audit-log export and arbitrary SQL/files.
## 3. Actors / Roles / Permissions
Manager/Admin according to source report scope.
## 4. Preconditions
Valid `reportType`, filters accepted by that report, bounded result ≤10,000 rows.
## 5. Postconditions
No mutation; immutable export audit records requester/query hash/count/format/asOf.
## 6. Main Flow
Authorize source report, validate/canonicalize filters, execute same snapshot query, stream sanitized UTF-8 CSV.
## 7. Alternative Flows
Zero rows returns header-only CSV and rowCount zero.
## 8. Failure Flows
Unsupported type/over-limit/forbidden column/filter → validation/forbidden; no partial data file.
## 9. Business Rules
Allowed types: revenue, traffic, occupancy, card-session; CSV formula-injection characters are escaped.
## 10. API Contracts
Query `{reportType,filters...,format:csv}` → attachment with `X-Report-As-Of`, `X-Row-Count`; response body is file, not SDR JSON.
## 11. Data Requirements
Read projection/query snapshot/export audit log; no stored file necessary for synchronous export.
## 12. Validation Rules
Report enum/filter allow-list, CSV only, max rows/period inherited source rules.
## 13. Duplicate, Retry and Concurrency Rules
Safe GET semantically; repeat produces new audited access but same query snapshot semantics.
## 14. Security Requirements
Role/column masking, content-disposition safe filename, formula injection/CSV escaping, no raw provider data.
## 15. Logging / Audit / Observability
Audit requester/query hash/row count/result; rate/size/error metrics.
## 16. Frontend Behavior
Export button disabled while preparing, shows filters/asOf/count; error preserves report state.
## 17. Edge Cases
Report changes during request use database snapshot/watermark and headers disclose asOf.
## 18. Automated Test Cases
Each type/scope, zero/over-limit, filter/column denial, CSV escaping, audit, same snapshot metadata.
## 19. Acceptance / Done Criteria
Export cannot become arbitrary data extraction or leak unmasked PII.
## 20. Decisions and Assumptions
CSV-only follows project convention; scheduled/large exports need separate lifecycle/storage specification.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Audit Log Export

**Target Path:** Reporting & Analytics > Audit Log Export (`leaf-rep-audit`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** Spring Boot Support API · **Actors:** Admin  
**API:** `GET /api/support/audit-logs/export`

## 1. Summary / Objective
Export privileged immutable audit records for controlled investigation/compliance.
## 2. Scope
Filtered CSV audit export; excludes audit mutation/purge/raw secret payloads.
## 3. Actors / Roles / Permissions
`ADMIN` only, with fresh session/step-up confirmation token.
## 4. Preconditions
Admin authorization, bounded date/filter and fresh confirmation valid.
## 5. Postconditions
Sanitized CSV and an audit-of-audit access event exist.
## 6. Main Flow
Verify step-up, allow-list filters/fields, query immutable audit projection snapshot, mask sensitive values, stream CSV/audit access.
## 7. Alternative Flows
No results exports headers only; exact sensitive field detail remains unavailable even Admin.
## 8. Failure Flows
Expired step-up, unbounded range, too many rows or scope error returns typed failure/no file.
## 9. Business Rules
Fields: actor/action/target/outcome/correlation/time/reason reference; no password/token/provider secret/raw document/payment payload.
## 10. API Contracts
Query `{from,to,actorId?,action?,targetType?,outcome?,format:csv,confirmationToken}`; attachment metadata/asOf/row count.
## 11. Data Requirements
Immutable audit projection, redaction policy version, export-access audit relation.
## 12. Validation Rules
Date ≤90d per request, UUID/enums, confirmation token current, row max 10k.
## 13. Duplicate, Retry and Concurrency Rules
Safe query but each download audited; snapshot ensures consistent rows.
## 14. Security Requirements
Admin/step-up, redaction, download headers/no shared cache, audit access monitoring.
## 15. Logging / Audit / Observability
High-priority audit of requester/filter hash/count, suspicious volume alerts.
## 16. Frontend Behavior
Explicit privacy warning/step-up, filters, generated-file status; never pre-render sensitive CSV.
## 17. Edge Cases
Actor later deleted: immutable actor ID/display snapshot remains, no account rehydration.
## 18. Automated Test Cases
Admin/step-up scope, redaction, range/row limit, audit-of-audit, CSV injection, immutable snapshot.
## 19. Acceptance / Done Criteria
Audit export is accountable and cannot disclose secrets through convenience reporting.
## 20. Decisions and Assumptions
Endpoint normalized to Support prefix for ownership consistency; seed path is legacy mapping.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

# Category: Incidents & Exceptions

**Shared decisions:** SDR-04/05/13/14/16/18/23 apply. Core owns case/evidence/override commands. An incident preserves facts and produces compensating events; it never edits historic session/payment rows in place.

## Category-level lifecycle

Every exception has a case `OPEN → UNDER_REVIEW → RESOLVED → CLOSED` (or `VOID`). Staff may create/evidence cases; a Manager resolves standard business effects; Admin performs emergency override under ODR-03. The mandatory case lifecycle is added because the seed's lost-card document endpoints reference a `caseId` without defining its creation or authority.

---

# AI Implementation Guide: Incident Case Intake & Lifecycle

**Target Path:** Incidents & Exceptions > Incident Case Intake & Lifecycle (**new mandatory supporting feature**)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Staff, Manager, Admin  
**API:** `POST /api/core/incidents`, `GET /api/core/incidents/{id}`, `PATCH /api/core/incidents/{id}/status`

## 1. Summary / Objective
Create and govern a durable evidence-backed incident around a session, payment, card or gate event.
## 2. Scope
Intake, detail, assignment/status and evidence references; specific lost-card/mismatch/override effects have separate guides.
## 3. Actors / Roles / Permissions
Staff opens assigned-gate case; Manager resolves; Admin emergency/voids with reason.
## 4. Preconditions
Actor active; target exists and is in relevant scope; type and evidence context valid.
## 5. Postconditions
Immutable case identifier/fact snapshot/state/audit exists and target references it.
## 6. Main Flow
Validate target/type, deduplicate open equivalent case, persist snapshot/evidence refs, assign or queue, publish event.
## 7. Alternative Flows
System payment/barrier worker opens an automatically sourced case with correlation ID.
## 8. Failure Flows
Foreign target, duplicate open case, invalid transition or missing resolution evidence fails typed.
## 9. Business Rules
Types include `LOST_CARD`,`PLATE_MISMATCH`,`PAYMENT_MISMATCH`,`BARRIER_FAILURE`,`MANUAL_OVERRIDE`; case facts are append-only.
## 10. API Contracts
Create `{type,targetType,targetId,summary,evidenceRefs?}`; status `{status,version,reason,evidenceRef?,assigneeId?}`.
## 11. Data Requirements
`incidents`, event/fact snapshots, evidence metadata, assignment/status history, audit/outbox.
## 12. Validation Rules
Summary 10–1000; valid target/type; reason/evidence required for resolve/void; version required.
## 13. Duplicate, Retry and Concurrency Rules
Idempotency/unique open-case key per target/type; conditional state transitions.
## 14. Security Requirements
Role/gate/record scope; evidence access via authorized signed URL only.
## 15. Logging / Audit / Observability
Audit all status/assignment; open-age/SLA/type metrics and alerts.
## 16. Frontend Behavior
Timeline with immutable facts, role-gated transitions, evidence upload/retry state.
## 17. Edge Cases
Target becomes closed after case intake; case remains valid and is resolved as historical exception.
## 18. Automated Test Cases
Staff/system intake, duplicate, role transitions, target scope, evidence requirement, concurrent resolve, audit.
## 19. Acceptance / Done Criteria
Every override/mismatch/lost-card document has a traceable authoritative case.
## 20. Decisions and Assumptions
Assignment is optional initially; unassigned cases route to manager queue.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Lost Card Claim Management

**Target Path:** Incidents & Exceptions > Lost Card Claim Management (`leaf-inc-lost-card`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Staff, Manager  
**API:** `POST /api/core/lost-cards/{caseId}/documents`, `POST /api/core/lost-cards/{caseId}/documents/batch`, `GET /api/core/lost-cards/{caseId}/documents`, `DELETE /api/core/lost-cards/{caseId}/documents/{documentId}`

## 1. Summary / Objective
Attach, review and control evidence for an open lost-card case and linked replacement charge.
## 2. Scope
Document metadata/upload/list/remove and fee reference; case creation/resolution/card replacement use their guides.
## 3. Actors / Roles / Permissions
Staff uploads to assigned/open case; Manager views/removes/approves case effect.
## 4. Preconditions
Case type `LOST_CARD`, case `OPEN`/`UNDER_REVIEW`, actor scope, allowed document.
## 5. Postconditions
Virus-scanned immutable evidence metadata is linked; optional replacement-fee obligation references pricing snapshot.
## 6. Main Flow
Authorize case, validate file metadata/content scan, store encrypted object, persist metadata/hash/audit.
## 7. Alternative Flows
Batch upload is all-or-nothing metadata creation; failed scan leaves no accessible document link.
## 8. Failure Flows
Closed/foreign case, forbidden type/size, failed scan, duplicate hash or removal after resolution fails safely.
## 9. Business Rules
Only evidence metadata is in Core DB; raw file uses controlled storage. Lost card state/blocking happens through Card/Case resolution, not upload.
## 10. API Contracts
Upload multipart `{file,documentType,description?}`; list returns `{id,type,name,size,uploadedAt,uploadedBy,scanStatus}`; delete requires `{version,reason}`.
## 11. Data Requirements
Incident evidence metadata, encrypted object key/hash/retention class, optional lost-card fee/payment relation.
## 12. Validation Rules
Allow-list PDF/JPG/PNG, max 10 MB each/5 batch, SHA-256 dedupe, description max 500.
## 13. Duplicate, Retry and Concurrency Rules
Idempotency/upload hash; case version on removal; object finalize only after metadata transaction succeeds.
## 14. Security Requirements
Malware scan, signed time-limited download, encryption, no document binary/audit PII in logs.
## 15. Logging / Audit / Observability
Audit upload/remove/access, scan result/retention job failures; file name sanitized.
## 16. Frontend Behavior
Upload progress/scan pending/error; delete only while permitted, confirmation/reason field.
## 17. Edge Cases
Card loss reported during active session blocks card reuse but does not retroactively remove session identity.
## 18. Automated Test Cases
Allowed/blocked files, scan failure, case/role state, batch atomicity, dedupe, signed access, removal lock.
## 19. Acceptance / Done Criteria
Evidence remains secure/auditable and cannot be attached to unrelated case.
## 20. Decisions and Assumptions
Replacement fee uses `LOST_CARD` pricing snapshot when Manager resolves; refund stays ODR-01.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Plate Mismatch Case

**Target Path:** Incidents & Exceptions > Plate Mismatch Case (`leaf-inc-mismatch`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Staff, Manager  
**API:** `POST /api/core/incidents/plate-mismatches`, `GET /api/core/incidents/{id}`

## 1. Summary / Objective
Capture conflict between observed plate and reservation/session/card/pass identity without unsafe gate action.
## 2. Scope
Case intake/fact capture and routing; no automatic plate correction or payment waiver.
## 3. Actors / Roles / Permissions
Staff at matching gate creates; Manager resolves through case lifecycle/approved override.
## 4. Preconditions
Observed plate and conflicting target/session/reservation/card reference available.
## 5. Postconditions
Open `PLATE_MISMATCH` case with immutable observed/reference snapshots; affected operation is held.
## 6. Main Flow
Normalize plate, correlate targets, detect mismatch, atomically open/dedupe case and return safe hold instruction.
## 7. Alternative Flows
OCR confidence below configured threshold is “needs verification”, not mismatch until staff confirms observation.
## 8. Failure Flows
No target/cross-gate record/duplicate case returns safe non-disclosing result; barrier remains closed.
## 9. Business Rules
Raw scan, normalized plate, source/confidence and comparison values are retained; no silent replacement of registered plate.
## 10. API Contracts
`{gateId,observedPlate,source,confidence?,targetType,targetId,sessionVersion?}` → `{caseId,status,operationInstruction}`.
## 11. Data Requirements
Incident facts, source scan metadata, target immutable snapshots, gate/session relation/audit.
## 12. Validation Rules
Plate grammar/source enum/confidence 0–1, active gate, target UUID/version.
## 13. Duplicate, Retry and Concurrency Rules
Device event/idempotency plus unique open mismatch per target/gate observation window.
## 14. Security Requirements
Staff/gate scope; full plate restricted to authorized case view; public/driver responses are masked.
## 15. Logging / Audit / Observability
Audit mismatch source/result; monitor OCR confidence and repeat targets.
## 16. Frontend Behavior
Staff sees difference/hold, evidence action and manager escalation—not editable plate overwrite.
## 17. Edge Cases
Two valid vehicles with similar normalized plate remains manual review; never selects by fuzzy match.
## 18. Automated Test Cases
Confirmed mismatch; low confidence; gate/target scope; duplicate event; masking; no-barrier behavior.
## 19. Acceptance / Done Criteria
Identity conflict always preserves original facts and enters controlled workflow.
## 20. Decisions and Assumptions
Automated OCR never self-approves a mismatch resolution.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

---

# AI Implementation Guide: Manual Staff Override

**Target Path:** Incidents & Exceptions > Manual Staff Override (`leaf-inc-override`)  
**Status:** READY FOR IMPLEMENTATION · **Owner:** .NET Core API · **Actors:** Staff, Manager, Admin  
**API:** `POST /api/core/override-requests`, `PATCH /api/core/override-requests/{id}/approve`, `PATCH /api/core/override-requests/{id}/reject`

## 1. Summary / Objective
Allow Staff to request, and authorized leadership to approve, a narrow exception action with compensating audit.
## 2. Scope
Request/review/execute documented override; excludes free-form direct mutation/refund.
## 3. Actors / Roles / Permissions
Staff submits assigned-gate request; Manager approves standard operation; Admin emergency action per ODR-03.
## 4. Preconditions
Open linked incident, target/current version, permitted action type, reason/evidence.
## 5. Postconditions
Approved request executes one whitelisted compensating command and records actor/approver/evidence/outcome.
## 6. Main Flow
Staff creates request, Manager locks/reviews, Core revalidates target state then executes/records result atomically.
## 7. Alternative Flows
Manager can reject/request evidence; Admin emergency execution retains post-facto manager review task.
## 8. Failure Flows
No incident/evidence, unallowed action, stale target, self-approval or closed request fails.
## 9. Business Rules
Whitelisted actions: barrier retry, staff-confirmed passage, card block, session hold; no amount/edit/refund action absent dedicated policy.
## 10. API Contracts
Create `{incidentId,actionType,targetId,targetVersion,reason,evidenceRef}`; decision `{version,reason}` returns immutable execution outcome.
## 11. Data Requirements
Override request/status, incident link, target snapshot/version, compensating event/audit/outbox.
## 12. Validation Rules
Action enum/evidence/reason 10–500; requester cannot approve own request; version mandatory.
## 13. Duplicate, Retry and Concurrency Rules
Idempotency + one open request per incident/action/target; approve locks target/request.
## 14. Security Requirements
Role/gate scope, segregation of duties, no generic admin SQL/command path.
## 15. Logging / Audit / Observability
High-priority immutable audit/alert; metrics approval time/override type/failure.
## 16. Frontend Behavior
Request form exposes only whitelisted actions; approver sees evidence and irreversible-impact confirmation.
## 17. Edge Cases
Target changes before approval: request becomes stale and requires new evidence/request.
## 18. Automated Test Cases
Staff submit; manager/admin approval scope; self-approval deny; stale target; reject; execution once; audit completeness.
## 19. Acceptance / Done Criteria
No Staff UI/API can directly bypass session/payment/identity invariants.
## 20. Decisions and Assumptions
ODR-03 default requires Manager approval; monetary exceptions remain excluded pending ODR-01.
## 21. Readiness Verification
**READY FOR IMPLEMENTATION**.

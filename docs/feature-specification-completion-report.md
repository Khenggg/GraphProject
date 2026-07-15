# Feature Specification Completion Report

**Status:** Complete — documentation-only delivery  
**Scope:** Parking Building Management System feature taxonomy in `src/seed/parkingBuildingSeed.ts`  
**Completion date:** 2026-07-12

## Outcome

All **71 source taxonomy leaf features** now map to an implementation-ready guide. The documentation contains **78 AI Implementation Guides**, each with all 21 required sections and an explicit `READY FOR IMPLEMENTATION` verification. The difference is intentional:

- `leaf-auth-session` is correctly decomposed into four independently implementable operations: Sign In, Current User Profile, Refresh Access Token and Sign Out.
- `leaf-price-public`/`leaf-pub-price` share one canonical Public Pricing guide; `leaf-struct-avail`/`leaf-pub-avail` share one canonical Public Available Slots guide. These pairs are taxonomy aliases of the same secure read contract.
- Six mandatory supporting features were added to close business-flow gaps, listed below.

No application source code was written or changed for this documentation completion.

## Coverage manifest

| Domain / taxonomy leaves | Source leaf IDs covered | Canonical guide document | Result |
|---|---|---|---|
| Authentication | `leaf-auth-session`, `leaf-auth-register` | `01-authentication.md` | 5 guides; session composite split into 4 operations |
| User & Driver Management | `leaf-user-list-detail`, `leaf-user-create`, `leaf-user-update`, `leaf-user-status`, `leaf-user-role`, `leaf-driver-vehicles-list`, `leaf-driver-vehicle-history`, `leaf-driver-mp-application` | `03-driver-vehicle-and-user-management.md`, `08-monthly-passes.md` | Ready |
| Parking Configuration | `leaf-vehicle-type`, `leaf-struct-floor`, `leaf-struct-area`, `leaf-struct-slot`, `leaf-struct-gate`, `leaf-struct-avail`, `leaf-struct-suggest`, `leaf-card-crud` | `02-parking-configuration.md`, `13-public-information.md` | Ready |
| Reservations | `leaf-res-avail`, `leaf-res-create`, `leaf-res-extend`, `leaf-res-cancel`, `leaf-res-driver-history` | `04-reservations.md` | Ready |
| Parking Operations | `leaf-sess-entry`, `leaf-sess-claim`, `leaf-sess-exit`, `leaf-mp-validation` | `05-parking-operations.md` | Ready |
| Pricing | `leaf-price-crud`, `leaf-price-public`, `leaf-pub-price` | `06-pricing.md` | Ready; public alias is canonicalized |
| Payments & Reconciliation | `leaf-pay-webhook`, `leaf-pay-online`, `leaf-pay-cash`, `leaf-pay-waived`, `leaf-pay-reconcile`, `leaf-pay-review` | `07-payments-and-reconciliation.md` | Ready |
| Monthly Passes | `leaf-mp-app-review`, `leaf-mp-card-manage`, `leaf-mp-renew` | `08-monthly-passes.md` | Ready; entry/exit validation and driver application map to their operational/driver guides |
| Incidents & Exceptions | `leaf-inc-lost-card`, `leaf-inc-mismatch`, `leaf-inc-override` | `09-incidents-and-exceptions.md` | Ready |
| Notifications | `leaf-notif-user`, `leaf-notif-unread`, `leaf-notif-read` | `10-notifications.md` | Ready; insecure `{userId}` routing is normalized to `/me` |
| Feedback | `leaf-feed-submit`, `leaf-feed-list`, `leaf-feed-detail`, `leaf-feed-update` | `11-feedback.md` | Ready |
| Reporting & Analytics | `leaf-rep-dashboard`, `leaf-rep-revenue`, `leaf-rep-traffic`, `leaf-rep-occupancy`, `leaf-rep-card`, `leaf-rep-export`, `leaf-rep-audit` | `12-reporting-and-analytics.md` | Ready |
| Public Information | `leaf-pub-info`, `leaf-pub-rules`, `leaf-pub-avail` | `13-public-information.md` | Ready; availability alias is canonicalized |
| Developer & Test Utilities | `leaf-mock-camera`, `leaf-mock-rfid`, `leaf-mock-barrier`, `leaf-diag-clear-res`, `leaf-diag-migrate`, `leaf-diag-expire-res`, `leaf-diag-expire-pay` | `14-developer-and-test-utilities.md` | Ready; non-production only |
| Platform Operations & Diagnostics | `leaf-diag-core-health`, `leaf-diag-support-health`, `leaf-diag-db-check`, `leaf-diag-res-dump`, `leaf-diag-sess-dump` | `15-platform-operations-and-diagnostics.md` | Ready; detailed dumps are break-glass only |

## Mandatory supporting features added

| Feature | Why it is required | Guide |
|---|---|---|
| Driver Vehicle Registration & Maintenance | Reservation/pass flows require an owned active vehicle, not merely a list endpoint. | `03-driver-vehicle-and-user-management.md` |
| Reservation Expiry & Allocation Release | Unpaid/expired holds must release capacity automatically and exactly once. | `04-reservations.md` |
| Exit Passage Confirmation & Barrier Handoff | A barrier acknowledgement is not evidence that the car exited; it prevents premature session closure. | `05-parking-operations.md` |
| Monthly Pass Application Payment | Approval cannot activate entitlement without a verified payment lifecycle. | `08-monthly-passes.md` |
| Incident Case Intake & Lifecycle | Existing lost-card/mismatch/override leaves need a common authoritative `caseId`, evidence and approval state. | `09-incidents-and-exceptions.md` |
| Notification Dispatch | Notification list/read leaves need a durable event-to-recipient creation path. | `10-notifications.md` |

## Dependency and risk closure

The following previously blocking design risks are now fixed in the Shared Decision Register and used directly by guides:

| Risk | Closure |
|---|---|
| Conflicting lifecycle states | SDR-13 reservation/session/allocation lifecycle; gate passage is separate from barrier acknowledgement. |
| Duplicate commands, scans, webhooks and jobs | SDR-04 command idempotency/versioning; SDR-16 provider event dedupe; worker locks in feature guides. |
| Pricing and money ambiguity | SDR-15 immutable price snapshots/VND precision; SDR-16 single successful settlement and review handling. |
| Cross-service write conflict | SDR-06 Core command ownership and Support projection-only ownership; SDR-19 durable outbox/inbox. |
| Vehicle/card/pass identity conflict | SDR-14, SDR-22 and SDR-23 ownership, precedence and binding rules. |
| Unsafe operations/diagnostics | SDR-21 and SDR-24 non-production/test-run/break-glass guardrails. |
| PII/public/report leak | SDR-09, SDR-20 and per-guide field allow-lists/masking/export controls. |

## Organizational defaults retained for implementation readiness

The following are real organization/commercial choices, but none block implementation because their defaults are recorded and referenced by all affected guides:

| Register item | Default in effect |
|---|---|
| ODR-01 Monetary refund/void policy | No refund/void command; inconsistent money enters `UNDER_REVIEW`. |
| ODR-02 Commercial fees and booking limits | Values/deadlines/thresholds are configuration, never hard-coded. |
| ODR-03 Financial/override approval threshold | Manager approval; Admin emergency action with mandatory reason/evidence. |

## Implementation order

1. Shared contracts/identity/configuration and driver vehicle lifecycle.
2. Reservation allocation/expiry, parking entry/exit/passage controls.
3. Pricing, payments/webhook/reconciliation and monthly pass entitlement.
4. Incidents, notification dispatch/feedback, projections/reports/public reads.
5. Non-production utilities and guarded operational diagnostics.

This order is reflected in guide numbering. Authentication remains unchanged because SDR-12 through SDR-24 do not conflict with its decisions.

## Verification record

- The source seed contains 71 unique `leaf-*` IDs.
- All source IDs are mapped in the manifest; the Authentication composite/registration IDs are covered by the pre-existing Authentication guide structure.
- 78 `# AI Implementation Guide` headings exist and exactly 78 matching `## 21. Readiness Verification` headings exist.
- `git diff --check` completed without whitespace errors.
- Project map is regenerated after this report as the final task step.

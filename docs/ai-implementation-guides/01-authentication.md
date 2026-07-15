# Category: Authentication

**Shared decisions:** [Shared Decision Register](../shared-decision-register.md) SDR-01 to SDR-11 apply to every guide below.

## Category-level rules

- `.NET Core API` owns users, roles, sessions, refresh-token families and access-token revocation records.
- Only `ACTIVE` accounts authenticate or access protected APIs. All inactive/disabled/locked/deleted login failures are indistinguishable from invalid credentials.
- Access tokens are JWTs valid for 15 minutes; refresh tokens are opaque, hashed at rest, valid for 30 days and single-use with rotation.
- Authentication endpoints never log raw credentials or tokens. Mutations are audited under SDR-05.

---

# AI Implementation Guide: Sign In

**Target Path:** Parking Building Management System > Authentication > Authentication & Session Management > Sign In  
**Node Type:** leaf_feature  
**Status:** ready  
**Priority:** high  
**Authorized Actors/Roles:** Guest; successful login may establish `DRIVER`, `STAFF`, `MANAGER`, or `ADMIN` identity  
**Owner Service:** .NET Core API  
**Dependencies:** User account, role assignment, session/refresh-token storage, SDR-01/02/04/05/07/10

## 1. Summary / Objective

An unauthenticated user submits username and password. The system authenticates an `ACTIVE` account and returns one access token, one refresh token and a minimal identity summary for a new session.

## 2. Scope

### In Scope

- Username/password validation, credential verification, account-state check, session creation and token issuance.
- Rate limit and generic failure behavior that prevents account enumeration.

### Out of Scope

- OAuth, MFA, password reset, device-management UI and login on behalf of another user.

## 3. Actors / Roles / Permissions

- Guest may call the endpoint; no authenticated role is required.
- Only an `ACTIVE` user can receive a session. The returned roles are read-only claims; the caller cannot select them.

## 4. Preconditions

- A normalized username/password request is supplied over HTTPS.
- The user account and assigned roles exist; the password hash is valid only for the stored user record.

## 5. Postconditions

### On Success

- A session, refresh-token family and hashed refresh token are created atomically; an audit event records a successful login.
- The response returns a 15-minute access token and the single raw refresh token exactly once.

### On Failure

- No session or token is created. Invalid, unknown or non-active accounts return the same `UNAUTHENTICATED` response.

## 6. Main Flow

1. Frontend validates required fields and submits `username`, `password`, and `Idempotency-Key`.
2. API applies username/IP rate limit and normalizes username by trimming and lowercasing.
3. API loads the user, verifies password in constant time, and requires `status=ACTIVE`.
4. API creates session/token-family records and signs access/refresh tokens in one transaction.
5. API audits success and returns identity summary, access token and refresh token.

## 7. Alternative Flows

- A retry with the same idempotency key and identical credentials returns the original successful token response from the protected idempotency result for five minutes.
- A user with multiple roles receives all active role codes in the `roles` claim; client routing selects the permitted workspace.

## 8. Failure Flows

- Empty/malformed fields return `VALIDATION_FAILED` with field errors.
- Rate limit returns `RATE_LIMITED` and `retryAfterSeconds`; invalid/non-active credentials return `UNAUTHENTICATED`.
- Session persistence failure rolls back token/session records and returns `INTERNAL_ERROR` without issuing tokens.

## 9. Business Rules

| Current State | Action | Next State | Actor | Conditions |
|---|---|---|---|---|
| `ACTIVE` | Sign in | `ACTIVE` + new session | Guest | Password matches and rate limit allows |
| `INACTIVE`/`DISABLED`/`LOCKED`/`DELETED` | Sign in | unchanged | Guest | Always denied with generic response |

- Username is case-insensitive; password is case-sensitive and never trimmed.
- Maximum five failed attempts per username/IP in 15 minutes; a successful login does not erase an audit trail.

## 10. API Contracts

- **POST `/api/core/auth/login`** — public. Body: `username`, `password`; header: `Idempotency-Key`. Success `200` returns `accessToken`, `refreshToken`, `expiresIn=900`, and `{id, username, fullName, email, roles, status}`. Errors: `VALIDATION_FAILED` (400), `UNAUTHENTICATED` (401), `RATE_LIMITED` (429). Side effect: creates one current session. Same idempotency key replays original outcome; a different fingerprint returns `IDEMPOTENCY_CONFLICT` (409).

## 11. Data Requirements

- Read `users(id, username_normalized, password_hash, status, full_name, email)` and `user_roles`.
- Create `sessions(id, user_id, status, created_at, last_seen_at, revoked_at)` and `refresh_tokens(id, session_id, token_family_id, token_hash, expires_at, revoked_at)`.
- Store `jti`, `sid`, issuer/audience and expiration as token claims; store only token hashes, never raw token values.

## 12. Validation Rules

| Field/Condition | Rule | Error Code |
|---|---|---|
| username | Required; trimmed length 3–50 | `VALIDATION_FAILED` |
| password | Required; 1–100 characters; preserve input exactly | `VALIDATION_FAILED` |
| username/IP | No more than 5 failures in 15 minutes | `RATE_LIMITED` |
| account | Must exist, password match, and be `ACTIVE` | `UNAUTHENTICATED` |

## 13. Duplicate, Retry and Concurrency Rules

- Same idempotency key and request fingerprint returns the original result; different fingerprint returns `IDEMPOTENCY_CONFLICT`.
- Concurrent successful logins with different keys create independent sessions; this is permitted.
- A failed attempt is never cached as a successful idempotency outcome.

## 14. Security Requirements

- HTTPS, secure password hash verification, configured issuer/audience/signing key and rate limit are mandatory.
- The response and logs use the same generic authentication failure for account enumeration resistance.

## 15. Logging / Audit / Observability

- Audit `AUTH_LOGIN_SUCCEEDED` and `AUTH_LOGIN_FAILED` with user ID only when safely resolved, username hash, IP hash, correlation ID and result.
- Track login failure/rate-limit counters and authentication latency; never log password or tokens.

## 16. Frontend Behavior

- Entry page `/login` has username/password fields and a single submit action disabled while pending.
- Field errors render inline; `UNAUTHENTICATED` renders one generic banner; `RATE_LIMITED` shows retry time.
- Success stores tokens only through the approved client session mechanism, loads `/auth/me`, then redirects to the role-permitted landing page.

## 17. Edge Cases

- Account is disabled after password check but before token issue: conditional account-state update prevents issuance.
- Network timeout after success: same idempotency key safely returns the prior result.
- A role changes after issuance: next protected request checks current account status and authorization policy.

## 18. Automated Test Cases

### Test: Active user signs in

- Type: Integration
- Precondition: `ACTIVE` Driver with known password.
- Action: Submit valid credentials and idempotency key.
- Expected API/UI result: 200; login redirects after profile load.
- Expected data/state result: One active session/token family; audit success event.

### Test: Invalid credentials remain generic

- Type: API/security
- Precondition: Existing user and unknown username.
- Action: Submit wrong password and unknown username separately.
- Expected API/UI result: Both return identical `UNAUTHENTICATED` body.
- Expected data/state result: No session; two failed-login audits.

### Test: Disabled user is denied

- Type: Integration
- Precondition: Correct password for `DISABLED` user.
- Action: Submit login.
- Expected API/UI result: 401 `UNAUTHENTICATED`.
- Expected data/state result: No token/session.

### Test: Login retry is idempotent

- Type: API
- Precondition: Valid active user.
- Action: Submit same body/key twice.
- Expected API/UI result: Both return the same original success result.
- Expected data/state result: One session and one audit success event.

## 19. Acceptance / Done Criteria

- [ ] Only `ACTIVE` users receive tokens.
- [ ] Unknown, invalid and non-active users receive indistinguishable failures.
- [ ] A successful retry cannot create a second session for the same idempotency key.
- [ ] Tokens/raw credentials never appear in logs or audit payloads.
- [ ] UI prevents duplicate submit and maps all documented error codes.

## 20. Decisions and Assumptions

### Decisions Applied

- Decision: 15-minute access token, 30-day rotating refresh token, five login failures per 15 minutes, and generic 401 authentication failures.

### Remaining Open Decisions

- None for this feature.

## 21. Readiness Verification

| Area | Complete? | Notes |
|---|---|---|
| Objective and scope | Yes | Defined above |
| Permissions | Yes | Public endpoint; active-account gate |
| Business rules | Yes | Account state and rate limit fixed |
| Data | Yes | Session/token family defined |
| API contracts | Yes | One endpoint fully covered |
| Frontend behavior | Yes | Login entry/error/success defined |
| Failure and concurrency | Yes | Idempotency and rate-limit defined |
| Security and audit | Yes | SDR-05/07 applied |
| Acceptance criteria | Yes | Testable checklist |
| Testability | Yes | Integration/security tests listed |

`Readiness: READY FOR IMPLEMENTATION`

---

# AI Implementation Guide: Current User Profile

**Target Path:** Parking Building Management System > Authentication > Authentication & Session Management > Current User Profile  
**Node Type:** leaf_feature  
**Status:** ready  
**Priority:** high  
**Authorized Actors/Roles:** Authenticated `DRIVER`, `STAFF`, `MANAGER`, `ADMIN`  
**Owner Service:** .NET Core API  
**Dependencies:** Valid access token, current user/role record, SDR-01/02/07/08/10

## 1. Summary / Objective

Return the minimal current identity profile used by the client to render authorized navigation and ownership-scoped features.

## 2. Scope

### In Scope

- Validate access token and current account state; return identity, active roles and status.

### Out of Scope

- Editing profile, retrieving driver business profile, password data, token history or other users’ profiles.

## 3. Actors / Roles / Permissions

- Any authenticated active user reads only their own profile derived from token `sub`.
- No caller-supplied user ID is accepted; Staff/Manager/Admin cannot use this endpoint to inspect another user.

## 4. Preconditions

- Valid Bearer token with unexpired `jti` and `sid`; subject exists and account remains `ACTIVE`.

## 5. Postconditions

### On Success

- No business data changes. The API returns current profile and canonical role codes.

### On Failure

- No data changes. Invalid/revoked/non-active identity returns `UNAUTHENTICATED`.

## 6. Main Flow

1. Client sends Bearer token.
2. API validates signature, issuer, audience, expiration and revoked `jti`.
3. API loads subject and current account state/roles.
4. API rejects non-active account; otherwise returns minimal profile.

## 7. Alternative Flows

- A changed role set is returned immediately on the next request; client rebuilds permitted navigation.

## 8. Failure Flows

- Missing/malformed/expired/revoked token returns `UNAUTHENTICATED`.
- Deleted or non-active user returns `UNAUTHENTICATED`; the client clears local session.

## 9. Business Rules

- Profile data is derived from token subject, never from a path/query parameter.
- The response excludes password hash, security stamp, token family, internal audit metadata and non-active roles.

## 10. API Contracts

- **GET `/api/core/auth/me`** — Bearer required. Success `200` returns `{id, username, fullName, email, roles, status}`. Error `UNAUTHENTICATED` (401). Side effects: none. No idempotency key needed; the current database role/status is authoritative.

## 11. Data Requirements

- Read `users` and active `user_roles`; no write.
- `id` is UUID; `roles` are canonical role codes; status is a canonical account-state enum.

## 12. Validation Rules

| Field/Condition | Rule | Error Code |
|---|---|---|
| Authorization header | `Bearer <JWT>` format | `UNAUTHENTICATED` |
| JWT | Signature, issuer, audience, expiration, jti and sid valid | `UNAUTHENTICATED` |
| User | Exists and is `ACTIVE` | `UNAUTHENTICATED` |

## 13. Duplicate, Retry and Concurrency Rules

- The request is read-only and safely repeatable.
- If status/roles change during processing, the API returns a profile from one committed read; the next call returns the newer version.

## 14. Security Requirements

- Enforce token validation before user lookup; do not expose a difference between a missing and disabled subject.
- Response is `Cache-Control: no-store` and contains no sensitive security fields.

## 15. Logging / Audit / Observability

- Log only correlation ID, response status and latency. Audit is not required for successful reads; audit abnormal revoked-token access attempts.

## 16. Frontend Behavior

- Called after login and application reload to populate session state.
- Show profile skeleton while loading; 401 clears session and goes to `/login`; 5xx/network shows retry without clearing a valid local session.

## 17. Edge Cases

- User is disabled after token issuance: next `/me` call denies access.
- A token contains an old role: current active role records override the stale claim for UI authorization.

## 18. Automated Test Cases

### Test: Own profile is returned

- Type: API
- Precondition: Active Driver with valid token.
- Action: Call `/auth/me`.
- Expected API/UI result: 200 and no password/security fields.
- Expected data/state result: No writes.

### Test: Revoked token is rejected

- Type: Security
- Precondition: Token `jti` is revoked.
- Action: Call `/auth/me`.
- Expected API/UI result: 401 and client clears session.
- Expected data/state result: No profile data disclosed.

### Test: Disabled-after-login user loses access

- Type: Integration
- Precondition: Valid token, then account changed to `DISABLED`.
- Action: Call `/auth/me`.
- Expected API/UI result: 401 `UNAUTHENTICATED`.
- Expected data/state result: No writes.

## 19. Acceptance / Done Criteria

- [ ] The endpoint cannot read another user by supplied ID.
- [ ] Current account status and roles are enforced at request time.
- [ ] Sensitive credential/session fields never leave the API.
- [ ] UI clears the session only for authentication failure, not transient server failure.

## 20. Decisions and Assumptions

### Decisions Applied

- Decision: Database current status/roles are authoritative for this response; no-store caching is mandatory.

### Remaining Open Decisions

- None for this feature.

## 21. Readiness Verification

| Area | Complete? | Notes |
|---|---|---|
| Objective and scope | Yes | Identity-only read |
| Permissions | Yes | Token-subject ownership |
| Business rules | Yes | Current state/role check |
| Data | Yes | Read model identified |
| API contracts | Yes | One endpoint |
| Frontend behavior | Yes | Load/retry/401 behavior |
| Failure and concurrency | Yes | Safe read behavior |
| Security and audit | Yes | Token/field rules fixed |
| Acceptance criteria | Yes | Testable |
| Testability | Yes | API/security scenarios |

`Readiness: READY FOR IMPLEMENTATION`

---

# AI Implementation Guide: Refresh Access Token

**Target Path:** Parking Building Management System > Authentication > Authentication & Session Management > Refresh Access Token  
**Node Type:** leaf_feature  
**Status:** ready  
**Priority:** high  
**Authorized Actors/Roles:** Holder of a valid refresh token; no access token required  
**Owner Service:** .NET Core API  
**Dependencies:** Refresh-token/session storage, token family, idempotency store, SDR-01/04/05/07/10

## 1. Summary / Objective

Renew one active session by rotating a valid single-use refresh token and returning a new access/refresh pair without requiring credentials again.

## 2. Scope

### In Scope

- Refresh-token verification, atomic consumption/rotation, reuse detection and family revocation.

### Out of Scope

- Password login, device list, all-session logout and recovery after a revoked/expired family.

## 3. Actors / Roles / Permissions

- The bearer of an opaque refresh token may call this endpoint; no role grants access.
- The related account must still be `ACTIVE`; no caller-provided user/session ID is trusted.

## 4. Preconditions

- Raw refresh token, UUID `Idempotency-Key`, unrevoked unexpired token row, active session and active account exist.

## 5. Postconditions

### On Success

- The used token is consumed, replacement token is stored only as a hash in the same family, and new tokens are returned once.

### On Failure

- Invalid/expired/revoked data creates no replacement. Confirmed reuse with a different key revokes the whole family.

## 6. Main Flow

1. Client submits refresh token and idempotency key.
2. API hashes token, locks/conditionally consumes matching active row and validates account/session.
3. API creates replacement token and new access token in the same transaction.
4. API stores protected idempotency result, audits rotation and returns new pair.

## 7. Alternative Flows

- Same token/key/payload retry returns the cached original pair for ten minutes.
- A token already consumed with a different key is treated as suspected reuse; the family is revoked.

## 8. Failure Flows

- Missing/malformed token/key returns `VALIDATION_FAILED`.
- Unknown, expired, revoked or inactive-session token returns `UNAUTHENTICATED`.
- Reuse with a different key returns `CONFLICT` code `REFRESH_TOKEN_REUSED` after family revocation.

## 9. Business Rules

| Current State | Action | Next State | Actor | Conditions |
|---|---|---|---|---|
| Active refresh token | Refresh | consumed + replacement active | Token holder | Account/session active, same idempotency key replay allowed |
| Consumed token | Refresh with new key | family revoked | Token holder | Reuse suspected |
| Expired/revoked token | Refresh | unchanged | Token holder | Denied |

- A refresh token is opaque, single-use and valid for 30 days. The access token lifetime is 15 minutes.

## 10. API Contracts

- **POST `/api/core/auth/refresh-token`** — public token endpoint. Body: `refreshToken`; header: required `Idempotency-Key`. Success `200` returns `accessToken`, `refreshToken`, `expiresIn=900`. Errors: `VALIDATION_FAILED` (400), `UNAUTHENTICATED` (401), `REFRESH_TOKEN_REUSED` (409). Side effect: consumes/replaces token or revokes family on confirmed reuse.

## 11. Data Requirements

- Read/write `refresh_tokens`, `sessions`, `users` and protected idempotency result.
- Token row includes token hash, family ID, session ID, issued/expiry/revoked/consumed timestamps and replacement reference.

## 12. Validation Rules

| Field/Condition | Rule | Error Code |
|---|---|---|
| refreshToken | Required opaque value, maximum 4096 characters | `VALIDATION_FAILED` |
| Idempotency-Key | Required UUID | `VALIDATION_FAILED` |
| token/session/user | Token active; session active; user `ACTIVE` | `UNAUTHENTICATED` |
| consumed token | Same key replays; other key revokes family | `REFRESH_TOKEN_REUSED` |

## 13. Duplicate, Retry and Concurrency Rules

- The first atomic consume wins. Same key returns its cached result; different concurrent key triggers reuse response/family revocation.
- No two active replacement rows may originate from one consumed token.

## 14. Security Requirements

- Hash all refresh tokens at rest; compare safely; rate limit by token-family/user/IP without exposing identity.
- Do not send tokens in URLs, logs or error details. Require HTTPS and secure response handling.

## 15. Logging / Audit / Observability

- Audit `AUTH_REFRESH_SUCCEEDED`, `AUTH_REFRESH_FAILED`, `AUTH_REFRESH_REUSE_DETECTED`, family ID, session ID, correlation ID and outcome.
- Alert on reuse detection; never log raw refresh values.

## 16. Frontend Behavior

- A session interceptor refreshes once for an expired access token; parallel failed calls wait for that single refresh promise.
- On `UNAUTHENTICATED`/reuse, clear local session and route to `/login`; on 5xx preserve session and present retry only once.

## 17. Edge Cases

- Network loss after rotation is recoverable only through the same idempotency key.
- Account disabled between issue and refresh denies replacement.
- Parallel browser tabs use a shared refresh lock to avoid accidental token-family revocation.

## 18. Automated Test Cases

### Test: Refresh rotates a token

- Type: Integration
- Precondition: Active user/session and valid refresh token.
- Action: Refresh with new idempotency key.
- Expected API/UI result: 200 with new pair.
- Expected data/state result: Old token consumed; one replacement active.

### Test: Retry returns original pair

- Type: API
- Precondition: Successful refresh request.
- Action: Repeat exact request/key.
- Expected API/UI result: Same 200 result.
- Expected data/state result: No second replacement.

### Test: Reuse revokes family

- Type: Security/integration
- Precondition: Token consumed under one key.
- Action: Submit it with a different key.
- Expected API/UI result: 409 `REFRESH_TOKEN_REUSED`.
- Expected data/state result: All active tokens in family revoked and alert/audit written.

## 19. Acceptance / Done Criteria

- [ ] A refresh consumes exactly one token and creates exactly one replacement.
- [ ] Safe retry never logs a user out or creates a second replacement.
- [ ] Confirmed reuse revokes the family and is observable.
- [ ] Inactive accounts cannot refresh.
- [ ] Client serializes concurrent refresh attempts.

## 20. Decisions and Assumptions

### Decisions Applied

- Decision: Required idempotency key distinguishes safe network retry from token theft/reuse.

### Remaining Open Decisions

- None for this feature.

## 21. Readiness Verification

| Area | Complete? | Notes |
|---|---|---|
| Objective and scope | Yes | Rotation only |
| Permissions | Yes | Token-bound authority |
| Business rules | Yes | Family lifecycle table |
| Data | Yes | Token/session/idempotency records |
| API contracts | Yes | One endpoint |
| Frontend behavior | Yes | Refresh lock/error mapping |
| Failure and concurrency | Yes | Atomic consume and replay fixed |
| Security and audit | Yes | Reuse defense/audit fixed |
| Acceptance criteria | Yes | Testable |
| Testability | Yes | Rotation/retry/reuse cases |

`Readiness: READY FOR IMPLEMENTATION`

---

# AI Implementation Guide: Sign Out

**Target Path:** Parking Building Management System > Authentication > Authentication & Session Management > Sign Out  
**Node Type:** leaf_feature  
**Status:** ready  
**Priority:** high  
**Authorized Actors/Roles:** Authenticated `DRIVER`, `STAFF`, `MANAGER`, `ADMIN`  
**Owner Service:** .NET Core API  
**Dependencies:** Access-token revocation store, session/token-family storage, SDR-01/04/05/07/10

## 1. Summary / Objective

End the current authenticated session immediately so its access token and associated refresh-token family cannot be used again.

## 2. Scope

### In Scope

- Revoke current `sid`, access-token `jti` and the current refresh-token family.

### Out of Scope

- Logout from all devices, administrator session termination and password-change session revocation.

## 3. Actors / Roles / Permissions

- Any authenticated active user may end only the session identified by their Bearer token.
- No body/path user ID or session ID is accepted.

## 4. Preconditions

- Valid non-revoked Bearer access token with `sid`, `jti`, `sub` and future expiry.

## 5. Postconditions

### On Success

- Session is `REVOKED`; all active refresh rows in its family are revoked; current `jti` is deny-listed through expiry; audit event is written.

### On Failure

- No partial revocation is committed. An already-revoked current session is treated as successful idempotent completion.

## 6. Main Flow

1. Client sends authenticated logout request.
2. API validates token and derives current session/family.
3. API atomically revokes session, refresh family and current `jti`.
4. API audits outcome and returns success.
5. Client clears local session and navigates to `/login`.

## 7. Alternative Flows

- Repeating logout after a completed revocation returns success with `alreadyRevoked=true`.

## 8. Failure Flows

- Missing/invalid token returns `UNAUTHENTICATED`; client still removes local tokens.
- Storage failure returns `INTERNAL_ERROR`; client warns that server logout could not be confirmed but clears local tokens.

## 9. Business Rules

| Current State | Action | Next State | Actor | Conditions |
|---|---|---|---|---|
| Active session | Sign out | `REVOKED` | Current user | Valid token |
| Revoked session | Sign out | `REVOKED` | Current user | Return idempotent success |

- Current-session logout revokes only the family linked to token `sid`; all-device logout is a separate feature.

## 10. API Contracts

- **POST `/api/core/auth/logout`** — Bearer required; empty body; optional `Idempotency-Key`. Success `200` returns `{alreadyRevoked}`. Errors: `UNAUTHENTICATED` (401), `INTERNAL_ERROR` (500). Side effect: revokes current session/family/jti. Repeated completed command is a success, including without an idempotency key.

## 11. Data Requirements

- Update `sessions.status/revoked_at`, all family `refresh_tokens.revoked_at`, and create `revoked_access_tokens(jti, expires_at, reason)`.
- Preserve revocation/audit history through access-token expiry and retention policy.

## 12. Validation Rules

| Field/Condition | Rule | Error Code |
|---|---|---|
| Bearer token | Valid signature, claims, expiration | `UNAUTHENTICATED` |
| sid/jti | Present and belongs to current subject | `UNAUTHENTICATED` |
| session | Active or already revoked | `UNAUTHENTICATED` only when token invalid |

## 13. Duplicate, Retry and Concurrency Rules

- Logout is naturally idempotent: concurrent/repeated requests converge on `REVOKED`.
- An optional same idempotency key replays the original outcome; no duplicate audit success is written.

## 14. Security Requirements

- Do not accept a raw refresh token in this endpoint; derive family from authenticated `sid`.
- Current `jti` deny-list check provides immediate access revocation until natural expiration.

## 15. Logging / Audit / Observability

- Audit `AUTH_LOGOUT_SUCCEEDED` or `AUTH_LOGOUT_FAILED` with subject/session/family IDs, correlation ID and result.
- Monitor revoke-store failures; never log token values.

## 16. Frontend Behavior

- Logout action shows confirmation only when unsaved user work would be lost; otherwise it executes immediately.
- Disable the action while pending; always clear local auth state after response or network failure, then route to `/login`.

## 17. Edge Cases

- Expired local access token cannot server-logout; frontend clears it and relies on expiry.
- Two tabs logout together: both reach the same revoked state without error.

## 18. Automated Test Cases

### Test: Logout revokes current family

- Type: Integration
- Precondition: Active session with issued access/refresh tokens.
- Action: Call logout with access token.
- Expected API/UI result: 200 then login page.
- Expected data/state result: Session/family/jti revoked; audit exists.

### Test: Logout is idempotent

- Type: API
- Precondition: Previously revoked current session.
- Action: Repeat logout before access token expiry.
- Expected API/UI result: 200 `{alreadyRevoked:true}`.
- Expected data/state result: No duplicate state transition.

### Test: Revoked access loses protected access

- Type: Security
- Precondition: Successful logout.
- Action: Call protected `/auth/me` with old token.
- Expected API/UI result: 401.
- Expected data/state result: No private data returned.

## 19. Acceptance / Done Criteria

- [ ] Logout makes the current access and refresh tokens unusable immediately.
- [ ] Repeated logout cannot fail due to an already-revoked state.
- [ ] No raw token is accepted, returned or logged by logout.
- [ ] Client clears local state on confirmed or unconfirmed logout.

## 20. Decisions and Assumptions

### Decisions Applied

- Decision: Current-session logout revokes its entire token family; all-device logout is explicitly out of scope.

### Remaining Open Decisions

- None for this feature.

## 21. Readiness Verification

| Area | Complete? | Notes |
|---|---|---|
| Objective and scope | Yes | Current session only |
| Permissions | Yes | Token/session-derived |
| Business rules | Yes | Revocation state fixed |
| Data | Yes | Session/family/jti tables |
| API contracts | Yes | One endpoint |
| Frontend behavior | Yes | Clear/navigate behavior |
| Failure and concurrency | Yes | Naturally idempotent |
| Security and audit | Yes | Immediate revocation/audit |
| Acceptance criteria | Yes | Testable |
| Testability | Yes | Integration/security cases |

`Readiness: READY FOR IMPLEMENTATION`

---

# AI Implementation Guide: Driver Registration

**Target Path:** Parking Building Management System > Authentication > Driver Registration  
**Node Type:** leaf_feature  
**Status:** ready  
**Priority:** high  
**Authorized Actors/Roles:** Guest  
**Owner Service:** .NET Core API  
**Dependencies:** User/role records, Driver Profile, password hashing, idempotency store, SDR-01/02/04/05/07/10

## 1. Summary / Objective

A guest creates one active Driver account and its associated Driver Profile using unique, normalized identity data. The caller cannot create another role or choose account status.

## 2. Scope

### In Scope

- Validate/normalize full name, username, email, Vietnamese phone, password and confirmation.
- Atomically create `users`, `user_roles(DRIVER)` and `driver_profiles` with `ACTIVE` status.

### Out of Scope

- Email/phone verification, staff/manager/admin creation, social sign-up, automatic login and driver vehicle registration.

## 3. Actors / Roles / Permissions

- Guest calls the public endpoint.
- The request cannot supply `role`, `status`, user ID or driver profile ID. Only `DRIVER` and `ACTIVE` are assigned.

## 4. Preconditions

- Registration fields are present; normalized username/email/phone are not already owned by another non-deleted user.

## 5. Postconditions

### On Success

- One User, Driver role and Driver Profile exist in one transaction, are `ACTIVE`, and are auditable.

### On Failure

- No user, role or profile remains. A duplicate identity reports a precise conflict code without exposing unrelated account data.

## 6. Main Flow

1. Guest completes registration form; frontend performs client validation and submits `Idempotency-Key`.
2. API trims/normalizes fields, validates password and checks unique normalized identity values.
3. API hashes password and atomically creates user, Driver role and Driver Profile.
4. API writes audit event and returns the new non-sensitive identity/profile IDs.
5. Frontend shows success and routes to `/login`; it does not automatically authenticate the new user.

## 7. Alternative Flows

- Same idempotency key and same normalized request returns the original created record.
- A soft-deleted identity remains reserved; re-registration requires an administrator-led recovery process, not public reuse.

## 8. Failure Flows

- Invalid field returns `VALIDATION_FAILED` with field error.
- Username/email/phone collision returns `USERNAME_ALREADY_EXISTS`, `EMAIL_ALREADY_EXISTS`, or `PHONE_ALREADY_EXISTS` (409).
- Concurrent duplicate registration resolves through unique constraints; losing transaction rolls back and maps to the relevant conflict code.

## 9. Business Rules

| Current State | Action | Next State | Actor | Conditions |
|---|---|---|---|---|
| No identity | Register | User/Driver Profile `ACTIVE` | Guest | All normalized identities unique |
| Existing normalized identity | Register | unchanged | Guest | Denied with specific conflict code |

- Username is lowercase `[a-z0-9_]{3,50}`. Email is trimmed/lowercased. Vietnamese phone is normalized from `+84xxxxxxxxx` to `0xxxxxxxxx` and must contain 10 digits.
- Full name is trimmed 2–100 characters. Password is 8–100 characters and requires upper, lower and digit; confirmation must match.

## 10. API Contracts

- **POST `/api/core/auth/register`** — public. Body: `fullName`, `username`, `email`, `phone`, `password`, `confirmPassword`; header: required `Idempotency-Key`. Success `201` returns `{id, driverProfileId, fullName, username, email, phone, role:"DRIVER", status:"ACTIVE", createdAt}`. Errors: `VALIDATION_FAILED` (400), specific identity conflict (409), `IDEMPOTENCY_CONFLICT` (409), `RATE_LIMITED` (429). Side effect: one atomic identity/profile creation.

## 11. Data Requirements

- `users`: UUID, normalized username/email/phone, full name, password hash, `ACTIVE`, created/updated/audit timestamps.
- `user_roles`: user ID + `DRIVER`; `driver_profiles`: UUID, user ID, `ACTIVE`, timestamps.
- Enforce unique normalized username, email and phone; retain audit/idempotency record without raw password.

## 12. Validation Rules

| Field/Condition | Rule | Error Code |
|---|---|---|
| fullName | Trimmed 2–100 characters | `VALIDATION_FAILED` |
| username | Lowercase 3–50, `[a-z0-9_]` | `VALIDATION_FAILED` |
| email | Valid email, lowercased | `VALIDATION_FAILED` |
| phone | Valid normalized Vietnamese 10-digit number | `VALIDATION_FAILED` |
| password | 8–100, upper/lower/digit | `VALIDATION_FAILED` |
| confirmPassword | Equals password | `PASSWORD_CONFIRMATION_NOT_MATCH` |
| normalized identity | Unique across users, including deleted reservation | `*_ALREADY_EXISTS` |

## 13. Duplicate, Retry and Concurrency Rules

- Same idempotency key/fingerprint returns original 201 result; same key with changed data returns `IDEMPOTENCY_CONFLICT`.
- Unique database constraints decide concurrent collisions. The transaction creates all three records or none.
- Repeated submission after a conflict never creates a partial Driver Profile.

## 14. Security Requirements

- Rate limit registration by IP and normalized identity; hash passwords with the approved adaptive password algorithm.
- Ignore/reject extra `role`, `status` or internal ID fields; never return password/hash.

## 15. Logging / Audit / Observability

- Audit `DRIVER_REGISTERED` with new IDs, normalized identity hashes, correlation ID and result.
- Log validation/conflict/rate-limit counts without raw password, email or phone; alert on abuse spikes.

## 16. Frontend Behavior

- Page `/register` has six fields with blur and submit validation, password confirmation feedback and disabled submit while pending.
- Show field errors for validation/conflict, retain safe input except passwords, show success banner, then redirect to `/login` after acknowledgement.

## 17. Edge Cases

- Equivalent `+84` and `0` phone submissions conflict after normalization.
- Two requests with same identity race: exactly one succeeds.
- A previous idempotent success lost by network returns the original response rather than a false duplicate error.

## 18. Automated Test Cases

### Test: Valid guest creates Driver identity

- Type: Integration
- Precondition: Unique normalized identity fields.
- Action: Submit valid registration with idempotency key.
- Expected API/UI result: 201 then login navigation.
- Expected data/state result: One active User, Driver role and Driver Profile; BCrypt/approved hash only.

### Test: Normalized duplicates conflict

- Type: API/database
- Precondition: Existing `driver_a@example.com` and `0987654321`.
- Action: Register with `Driver_A@Example.com` or `+84987654321`.
- Expected API/UI result: 409 relevant conflict.
- Expected data/state result: No new records.

### Test: Concurrent registration is atomic

- Type: Integration/concurrency
- Precondition: No record for one identity.
- Action: Send two matching requests with different idempotency keys concurrently.
- Expected API/UI result: One 201; one conflict.
- Expected data/state result: Exactly one user/profile/role set.

### Test: Client cannot assign privileged role

- Type: Security
- Precondition: Valid registration body.
- Action: Add `role:"ADMIN"` and `status:"LOCKED"` fields.
- Expected API/UI result: 201 only when ignored safely, or 400 when rejected by strict schema.
- Expected data/state result: Created role is only `DRIVER`; status only `ACTIVE`.

## 19. Acceptance / Done Criteria

- [ ] Every successful registration creates User, Driver role and Driver Profile atomically.
- [ ] Username, email and phone uniqueness use normalized values and survive concurrent requests.
- [ ] Passwords are never stored or returned in raw form.
- [ ] Request cannot select a role or status.
- [ ] UI maps validation/conflict/idempotency/rate-limit responses to actionable feedback.

## 20. Decisions and Assumptions

### Decisions Applied

- Decision: Email and phone verification are not MVP gates; a successful valid registration creates an `ACTIVE` Driver account but does not auto-login.
- Decision: Deleted normalized identities remain reserved to prevent account takeover/reuse ambiguity.

### Remaining Open Decisions

- None for implementation; commercial onboarding policy can later add verification as a separate feature.

## 21. Readiness Verification

| Area | Complete? | Notes |
|---|---|---|
| Objective and scope | Yes | Identity/profile creation boundary fixed |
| Permissions | Yes | Guest-only; forced Driver/Active |
| Business rules | Yes | Normalization/uniqueness fixed |
| Data | Yes | Atomic entity set defined |
| API contracts | Yes | One endpoint |
| Frontend behavior | Yes | Form/errors/navigation defined |
| Failure and concurrency | Yes | Idempotency/unique race defined |
| Security and audit | Yes | Password/abuse/audit fixed |
| Acceptance criteria | Yes | Testable |
| Testability | Yes | API/database/security tests |

`Readiness: READY FOR IMPLEMENTATION`

---

## Category consistency check

| Feature | Readiness | Remaining open decisions | Dependency consistency | Contract consistency |
|---|---|---|---|---|
| Sign In | READY FOR IMPLEMENTATION | None | Uses SDR-07 session/token lifecycle | One route fully specified |
| Current User Profile | READY FOR IMPLEMENTATION | None | Uses token subject/current account state | One route fully specified |
| Refresh Access Token | READY FOR IMPLEMENTATION | None | Uses same session/family lifecycle as sign-in/logout | One route fully specified |
| Sign Out | READY FOR IMPLEMENTATION | None | Revokes same `sid`/family issued at sign-in | One route fully specified |
| Driver Registration | READY FOR IMPLEMENTATION | None | Produces active Driver identity consumed by sign-in | One route fully specified |

**Consistency result:** Authentication owns the complete account/token lifecycle. A Driver can register, sign in, load current identity, refresh safely after access expiry, and revoke the current session without an undocumented hand-off.

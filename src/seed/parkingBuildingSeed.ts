import { createSeedNode, type SeedNodeInput } from "../domain/featureNodeFactory";
import type { FeatureNode, TestCase, DoneCriterion, ContractField } from "../domain/featureNode.types";

// Helper to generate test cases for leaf features
function defaultApiTests(featureTitle: string, clients: string[], endpoints: string[]): TestCase[] {
  const tests: TestCase[] = [
    {
      id: `tc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-auth`,
      title: `Verify authorized client (${clients.join(", ")}) can access "${featureTitle}" successfully`,
      type: "api",
      precondition: `Client is authenticated with role: ${clients[0] || "Public"}`,
      steps: [
        `Authenticate user as ${clients[0] || "Guest"}`,
        `Invoke endpoint: ${endpoints[0] || "N/A"}`,
        `Check response code is 200/201 OK`
      ],
      expectedResult: `Request succeeds and returns correct payload`,
      status: "not_started"
    },
    {
      id: `tc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-unauth`,
      title: `Verify unauthorized role is rejected when accessing "${featureTitle}"`,
      type: "api",
      precondition: `User is anonymous or lacks required role`,
      steps: [
        `Attempt to invoke endpoint: ${endpoints[0] || "N/A"} without token/role`,
        `Check response status code is 401 Unauthorized or 403 Forbidden`
      ],
      expectedResult: `Request is blocked and returns clear error response`,
      status: "not_started"
    }
  ];

  // Specific tests based on title keywords
  const titleLower = featureTitle.toLowerCase();
  if (titleLower.includes("payment") || titleLower.includes("payos") || titleLower.includes("fee") || titleLower.includes("exit")) {
    tests.push({
      id: `tc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-mismatch`,
      title: `Verify amount or payment status mismatch is handled safely`,
      type: "integration",
      expectedResult: `Transaction is flagged for review or rejected without state mutation`,
      status: "not_started"
    });
  }
  if (titleLower.includes("reservation") || titleLower.includes("session") || titleLower.includes("booking")) {
    tests.push({
      id: `tc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-expired`,
      title: `Verify request with expired reservation or session token is rejected`,
      type: "integration",
      expectedResult: `System returns validation error stating resource has expired`,
      status: "not_started"
    });
  }
  if (titleLower.includes("public") || titleLower.includes("info") || titleLower.includes("pricing") || titleLower.includes("available")) {
    tests.push({
      id: `tc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-sanitize`,
      title: `Verify public request returns sanitized data without private details`,
      type: "api",
      expectedResult: `Returned JSON contains only public fields`,
      status: "not_started"
    });
  }
  if (titleLower.includes("report") || titleLower.includes("export")) {
    tests.push({
      id: `tc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-export`,
      title: `Verify export endpoint returns correct spreadsheet binary type`,
      type: "integration",
      expectedResult: `Response content-type is application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,
      status: "not_started"
    });
  }

  return tests;
}

// Helper to generate done criteria
function defaultDoneCriteria(featureTitle: string): DoneCriterion[] {
  const criteria: DoneCriterion[] = [
    { id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-contract`, content: "API contract is documented in this node.", checked: false },
    { id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-clients`, content: "Required clients/roles are assigned.", checked: false },
    { id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-rules`, content: "Business rules and inherited rules are visible in AI export.", checked: false },
    { id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-resp`, content: "Success response uses common API response format where applicable.", checked: false },
    { id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-err`, content: "Error response is clear and does not leak sensitive data.", checked: false },
    { id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-tests`, content: "At least two test cases are defined.", checked: false },
    { id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-export`, content: "Feature can be exported as AI-readable Markdown.", checked: false }
  ];

  const titleLower = featureTitle.toLowerCase();
  if (titleLower.includes("create") || titleLower.includes("ui") || titleLower.includes("edit") || titleLower.includes("form") || titleLower.includes("dashboard")) {
    criteria.push({ id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-uistate`, content: "UI states are documented: idle, loading, success, empty, error.", checked: false });
    criteria.push({ id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-uivalidate`, content: "Validation and error display behavior are documented.", checked: false });
  }

  if (titleLower.includes("payment") || titleLower.includes("reservation") || titleLower.includes("session")) {
    criteria.push({ id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-edge`, content: "Edge cases are documented.", checked: false });
    criteria.push({ id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-transitions`, content: "Payment/session/reservation state transition is documented.", checked: false });
  }

  return criteria;
}

// Generate API Contracts
function createApiContract(endpoint: string): ContractField[] {
  const method = endpoint.split(" ")[0] || "GET";
  const path = endpoint.split(" ")[1] || "/";
  return [
    {
      id: `api-contract-${path.replace(/[^a-z0-9]/g, "-")}`,
      name: `${method} ${path}`,
      content: `Method: ${method}\nPath: ${path}\nHeaders:\n  Authorization: Bearer <token>\nResponse:\n  status: 200 OK\n  data: { success: true }`
    }
  ];
}

export function createParkingBuildingSeedTree(): FeatureNode[] {
  const seedInput: SeedNodeInput = {
    id: "root-parking-system",
    title: "Parking Building Management System",
    type: "project",
    clients: ["Admin", "Manager", "Staff", "Driver", "Guest", "System"],
    status: "in_progress",
    priority: "must_have",
    tags: ["system", "parking", "core"],
    summary: "Integrated solution for managing multi-floor parking buildings, spaces, pricing, reservations, automated gate sessions, and digital payments.",
    businessRules: [
      "The system manages parking building operations for public guests, drivers, staff, managers, and admins.",
      "The backend is split into .NET Core API for transactional/write operations and Spring Boot Support API for support/read/report/public operations.",
      "All APIs should return a consistent success/error response format.",
      "Authenticated APIs must validate JWT and role permissions.",
      "Both backend services access a shared PostgreSQL database, maintaining strict entity ownership.",
      "Global error handling middleware must prevent internal stack traces from leaking to clients.",
      "A request logging system must log all incoming API requests for security tracing.",
      "All manager/admin mutating operations must be logged to a dedicated audit schema."
    ],
    children: [
      // 3. Authentication
      {
        id: "cat-authentication",
        title: "Authentication",
        type: "category",
        summary: "Authentication flows to verify user identity.",
        businessRules: [
          "Login must return authenticated user information and a usable access token.",
          "Disabled or inactive users must not be allowed to access protected features."
        ],
        children: [
          {
            id: "leaf-auth-session",
            title: "Login & Session Management",
            type: "leaf_feature",
            summary: "User authentication flows, current user profile retrieval, JWT token refreshing, and session termination.",
            clients: ["Driver", "Staff", "Manager", "Admin"],
            status: "ready",
            priority: "high",
            tags: ["auth", "session", "security"],
            dependencies: [],
            risks: [],
            notes: "Immediate session revocation requires access token blacklisting using JWT jti claims.",
            ownerService: ".NET Core API",
            objective: "Implement complete authentication and session management for the Parking Building Management System. This feature must allow users to:\n1. Login with username and password.\n2. Receive a short-lived JWT access token.\n3. Receive a secure refresh token.\n4. Retrieve the current authenticated user profile.\n5. Refresh expired access tokens using refresh token rotation.\n6. Logout and revoke the current session.\n7. Prevent disabled or inactive users from accessing protected APIs.\n\nThe .NET Core API is the owner of authentication. The Spring Boot Support API must be able to validate the JWT issued by the .NET Core API.",
            inScope: [
              "Login with username and password.",
              "Receive a short-lived JWT access token.",
              "Receive a secure refresh token.",
              "Retrieve the current authenticated user profile.",
              "Refresh expired access tokens using refresh token rotation.",
              "Logout and revoke the current session.",
              "Prevent disabled or inactive users from accessing protected APIs."
            ],
            outOfScope: [
              "Third-party OAuth identity providers (Google, Facebook).",
              "User registration or signup flow.",
              "Frontend UI theme customization."
            ],
            permissions: [
              { role: "Driver", permission: "Can login, retrieve own profile, refresh token, and logout." },
              { role: "Staff", permission: "Can login, retrieve own profile, refresh token, and logout." },
              { role: "Manager", permission: "Can login, retrieve own profile, refresh token, and logout." },
              { role: "Admin", permission: "Can login, retrieve own profile, refresh token, and logout." }
            ],
            dbExistingTables: ["users", "user_roles"],
            dbNewTablesSql: `-- Table for storing hashed refresh tokens
CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  token_hash text NOT NULL,
  token_family_id uuid NOT NULL,
  jwt_id varchar(255) null,
  expires_at timestamp not null,
  revoked_at timestamp null,
  replaced_by_token_hash text null,
  created_at timestamp not null,
  created_by_ip varchar(100) null,
  revoked_by_ip varchar(100) null,
  revocation_reason varchar(255) null
);

CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- Table for storing revoked access tokens (blacklist)
CREATE TABLE revoked_access_tokens (
  id uuid PRIMARY KEY,
  jwt_id varchar(255) UNIQUE NOT NULL,
  user_id uuid NOT NULL,
  expires_at timestamp NOT NULL,
  revoked_at timestamp NOT NULL,
  reason varchar(255) NULL
);`,
            dbRelationships: ["refresh_tokens(user_id) references users(id)"],
            validationRules: [
              { field: "username", rule: "Required, non-empty, string", errorMessage: "Username is required." },
              { field: "password", rule: "Required, non-empty, string", errorMessage: "Password is required." }
            ],
            securityRules: [
              "Never log raw password, raw access token, or raw refresh token.",
              "Store only the hashed refresh token in the database using secure HMAC SHA256 / SHA256.",
              "Login endpoint must have rate limiting (limit: 5 failed attempts per username/IP in 15 minutes).",
              "Use HTTPS in production and load JWT secrets from secure configuration / environment.",
              "Use constant-time comparison for token validation if available.",
              "All date/time values must use UTC.",
              "Error messages must not reveal username existence (use generic 'Invalid username or password')."
            ],
            logEvents: [
              "Successful login events.",
              "Failed login attempts.",
              "Disabled or inactive user login attempts.",
              "Token refresh success.",
              "Refresh token reuse anomaly detection.",
              "Logout session revocation."
            ],
            noLogEvents: [
              "Raw passwords.",
              "Access tokens.",
              "Refresh tokens."
            ],
            integrationPoints: [
              { system: "Spring Boot Support API", responsibility: "Must validate issuer, audience, signing key, expiration, and roles claim of JWT issued by .NET Core API" }
            ],
            uiPage: "/login",
            uiComponents: "LoginForm, Button, FormInput",
            uiStateLoading: "Show spinner overlay on the login card, disable the submit button and input fields to prevent double submission.",
            uiStateEmpty: "Not applicable for authentication screen.",
            uiStateError: "Display a warning banner toast indicating validation fails or invalid credential messages.",
            uiStateSuccess: "Redirect the authenticated user to the main home dashboard and display a welcome toast message.",
            endpoints: [
              "POST /api/core/auth/login",
              "GET /api/core/auth/me",
              "POST /api/core/auth/refresh-token",
              "POST /api/core/auth/logout"
            ],
            apiContracts: [
              {
                id: "contract-auth-login",
                name: "POST /api/core/auth/login",
                content: `Method: POST
Path: /api/core/auth/login
Headers:
  Content-Type: application/json
Request Body:
  {
    "username": "driver_john",
    "password": "Password123"
  }
Success Response (200 OK):
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOi...",
      "expiresIn": 3600,
      "refreshToken": "d8f3k9s...",
      "user": {
        "id": "usr-12345",
        "username": "driver_john",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "roles": ["Driver"],
        "status": "Active"
      }
    },
    "message": "Login successful.",
    "errors": null
  }
Validation Error Response (400 Bad Request):
  {
    "success": false,
    "data": null,
    "message": "Validation failed.",
    "errors": [
      { "field": "username", "message": "Username is required." }
    ]
  }
Invalid Credentials Response (401 Unauthorized):
  {
    "success": false,
    "data": null,
    "message": "Invalid username or password.",
    "errors": null
  }
Inactive/Disabled Account Response (403 Forbidden):
  {
    "success": false,
    "data": null,
    "message": "Your account is currently disabled or inactive.",
    "errors": null
  }`
              },
              {
                id: "contract-auth-me",
                name: "GET /api/core/auth/me",
                content: `Method: GET
Path: /api/core/auth/me
Headers:
  Authorization: Bearer <accessToken>
Success Response (200 OK):
  {
    "success": true,
    "data": {
      "id": "usr-12345",
      "username": "driver_john",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "roles": ["Driver"],
      "status": "Active"
    },
    "message": null,
    "errors": null
  }
Unauthorized Response (401 Unauthorized):
  {
    "success": false,
    "data": null,
    "message": "Unauthorized. Token is invalid or expired.",
    "errors": null
  }
Disabled/Not-Exist Response (403 Forbidden):
  {
    "success": false,
    "data": null,
    "message": "Your account is disabled or user does not exist.",
    "errors": null
  }`
              },
              {
                id: "contract-auth-refresh",
                name: "POST /api/core/auth/refresh-token",
                content: `Method: POST
Path: /api/core/auth/refresh-token
Headers:
  Content-Type: application/json
Request Body:
  {
    "refreshToken": "d8f3k9s..."
  }
Success Response (200 OK):
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOi...",
      "expiresIn": 3600,
      "refreshToken": "new_d8f3k9s..."
    },
    "message": "Token refreshed successfully.",
    "errors": null
  }
Invalid/Expired/Revoked Refresh Token Response (400 Bad Request):
  {
    "success": false,
    "data": null,
    "message": "Invalid or expired refresh token.",
    "errors": null
  }`
              },
              {
                id: "contract-auth-logout",
                name: "POST /api/core/auth/logout",
                content: `Method: POST
Path: /api/core/auth/logout
Headers:
  Authorization: Bearer <accessToken>
Request Body (Optional):
  {
    "refreshToken": "d8f3k9s..."
  }
Success Response (200 OK):
  {
    "success": true,
    "data": null,
    "message": "Session terminated successfully.",
    "errors": null
  }
Invalid Token Response (401 Unauthorized):
  {
    "success": false,
    "data": null,
    "message": "Invalid token.",
    "errors": null
  }`
              }
            ],
            testCases: [
              {
                id: "tc-auth-login-success",
                title: "Login - Happy Path (Success)",
                type: "integration",
                precondition: "Active user exists. Password hash matches test password.",
                steps: ["Send POST /api/core/auth/login with valid username and password."],
                expectedResult: "Returns 200 OK with success=true, accessToken, refreshToken, expiresIn = 3600, and user info. Password hash is not returned.",
                status: "not_started"
              },
              {
                id: "tc-auth-login-empty-username",
                title: "Login - Empty Username",
                type: "integration",
                precondition: "None.",
                steps: ["Send login request with empty username."],
                expectedResult: "Returns 400 Bad Request with success=false and username validation error message.",
                status: "not_started"
              },
              {
                id: "tc-auth-login-empty-password",
                title: "Login - Empty Password",
                type: "integration",
                precondition: "None.",
                steps: ["Send login request with empty password."],
                expectedResult: "Returns 400 Bad Request with success=false and password validation error message.",
                status: "not_started"
              },
              {
                id: "tc-auth-login-invalid-password",
                title: "Login - Invalid Password",
                type: "integration",
                precondition: "User exists.",
                steps: ["Send login request with correct username and wrong password."],
                expectedResult: "Returns 401 Unauthorized with success=false and message 'Invalid username or password.'",
                status: "not_started"
              },
              {
                id: "tc-auth-login-unknown-username",
                title: "Login - Unknown Username",
                type: "integration",
                precondition: "None.",
                steps: ["Send login request with non-existing username."],
                expectedResult: "Returns 401 Unauthorized with message 'Invalid username or password.' and does not reveal whether username exists.",
                status: "not_started"
              },
              {
                id: "tc-auth-login-disabled-account",
                title: "Login - Disabled Account",
                type: "integration",
                precondition: "User exists with status 'Disabled'.",
                steps: ["Send login request with correct credentials."],
                expectedResult: "Returns 403 Forbidden with success=false and message indicating account is disabled or inactive.",
                status: "not_started"
              },
              {
                id: "tc-auth-login-inactive-account",
                title: "Login - Inactive Account",
                type: "integration",
                precondition: "User exists with status 'Inactive'.",
                steps: ["Send login request with correct credentials."],
                expectedResult: "Returns 403 Forbidden with success=false.",
                status: "not_started"
              },
              {
                id: "tc-auth-me-success",
                title: "Get Profile - Happy Path (Success)",
                type: "integration",
                precondition: "User has valid access token.",
                steps: ["Send GET /api/core/auth/me with valid Bearer token."],
                expectedResult: "Returns 200 OK with success=true and current user profile details, without password hash.",
                status: "not_started"
              },
              {
                id: "tc-auth-me-missing-token",
                title: "Get Profile - Missing Token",
                type: "integration",
                precondition: "None.",
                steps: ["Send GET /api/core/auth/me without Authorization header."],
                expectedResult: "Returns 401 Unauthorized.",
                status: "not_started"
              },
              {
                id: "tc-auth-me-malformed-token",
                title: "Get Profile - Malformed Token",
                type: "integration",
                precondition: "None.",
                steps: ["Send GET /api/core/auth/me with malformed Bearer token."],
                expectedResult: "Returns 401 Unauthorized.",
                status: "not_started"
              },
              {
                id: "tc-auth-me-expired-token",
                title: "Get Profile - Expired Token",
                type: "integration",
                precondition: "None.",
                steps: ["Send GET /api/core/auth/me with expired token."],
                expectedResult: "Returns 401 Unauthorized.",
                status: "not_started"
              },
              {
                id: "tc-auth-me-disabled-after-login",
                title: "Get Profile - Disabled After Login",
                type: "integration",
                precondition: "User logs in successfully, user status is then changed to 'Disabled'.",
                steps: ["Send GET /api/core/auth/me using old valid access token."],
                expectedResult: "Returns 403 Forbidden.",
                status: "not_started"
              },
              {
                id: "tc-auth-refresh-success",
                title: "Refresh Token - Happy Path (Success)",
                type: "integration",
                precondition: "User has active refresh token.",
                steps: ["Send POST /api/core/auth/refresh-token with active refresh token."],
                expectedResult: "Returns 200 OK with new access token and new refresh token, old refresh token is revoked.",
                status: "not_started"
              },
              {
                id: "tc-auth-refresh-missing-token",
                title: "Refresh Token - Missing Token",
                type: "integration",
                precondition: "None.",
                steps: ["Send refresh request with empty body."],
                expectedResult: "Returns 400 Bad Request.",
                status: "not_started"
              },
              {
                id: "tc-auth-refresh-expired-token",
                title: "Refresh Token - Expired Token",
                type: "integration",
                precondition: "Refresh token exists but expired.",
                steps: ["Send refresh request."],
                expectedResult: "Returns 400 Bad Request with message 'Invalid or expired refresh token.'",
                status: "not_started"
              },
              {
                id: "tc-auth-refresh-revoked-reuse",
                title: "Refresh Token - Revoked Token Reuse",
                type: "integration",
                precondition: "Refresh token was already used or revoked.",
                steps: ["Send refresh request using revoked token."],
                expectedResult: "Returns 400 Bad Request, token family is revoked, security audit log created.",
                status: "not_started"
              },
              {
                id: "tc-auth-refresh-disabled-user",
                title: "Refresh Token - Disabled User",
                type: "integration",
                precondition: "User has valid refresh token, user status becomes 'Disabled'.",
                steps: ["Send refresh request."],
                expectedResult: "Returns 403 Forbidden, no new token issued.",
                status: "not_started"
              },
              {
                id: "tc-auth-logout-success",
                title: "Logout - Happy Path (Success)",
                type: "integration",
                precondition: "User has valid active session.",
                steps: ["Send POST /api/core/auth/logout with valid Bearer token."],
                expectedResult: "Returns 200 OK, refresh token/session is revoked, access token jti is blacklisted.",
                status: "not_started"
              },
              {
                id: "tc-auth-logout-missing-token",
                title: "Logout - Missing Token",
                type: "integration",
                precondition: "None.",
                steps: ["Send logout request without Authorization header."],
                expectedResult: "Returns 401 Unauthorized.",
                status: "not_started"
              },
              {
                id: "tc-auth-logout-reuse-token",
                title: "Logout - Reuse Access Token After Logout",
                type: "integration",
                precondition: "User logs in, user logs out.",
                steps: ["Call protected endpoint using the same old access token."],
                expectedResult: "Returns 401 Unauthorized due to access token blacklist JTI check.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-auth-login-impl", content: "Login endpoint is fully implemented.", checked: false },
              { id: "dc-auth-login-validation", content: "Login validates required fields.", checked: false },
              { id: "dc-auth-login-reject-invalid", content: "Login rejects invalid credentials.", checked: false },
              { id: "dc-auth-login-reject-disabled", content: "Login rejects disabled, inactive, and locked users.", checked: false },
              { id: "dc-auth-password-hash", content: "Password verification uses secure hashing.", checked: false },
              { id: "dc-jwt-claims", content: "JWT access token is generated with required claims.", checked: false },
              { id: "dc-jwt-expiry", content: "Access token expires after 1 hour.", checked: false },
              { id: "dc-refresh-secure", content: "Refresh token is generated securely.", checked: false },
              { id: "dc-refresh-hashed", content: "Refresh token is stored hashed in database.", checked: false },
              { id: "dc-refresh-rotation", content: "Refresh token rotation works.", checked: false },
              { id: "dc-refresh-reuse", content: "Refresh token reuse detection works.", checked: false },
              { id: "dc-logout-revoke", content: "Logout revokes refresh token/session.", checked: false },
              { id: "dc-logout-blacklist", content: "Logout revokes access token using JWT jti blacklist.", checked: false },
              { id: "dc-me-profile", content: "GET /api/core/auth/me returns the current authenticated user.", checked: false },
              { id: "dc-me-no-expose", content: "GET /api/core/auth/me does not expose password hash or sensitive fields.", checked: false },
              { id: "dc-me-disabled", content: "Disabled users cannot use /auth/me even with an old token.", checked: false },
              { id: "dc-global-format", content: "All endpoints return the global response format.", checked: false },
              { id: "dc-global-error", content: "Global error handling prevents stack traces from leaking.", checked: false },
              { id: "dc-request-logging", content: "Request logging excludes passwords and tokens.", checked: false },
              { id: "dc-security-audit", content: "Security audit logs are created for auth events.", checked: false },
              { id: "dc-spring-boot-jwt", content: "Spring Boot Support API can validate JWT issued by .NET Core API.", checked: false },
              { id: "dc-tests-pass", content: "Automated tests for all listed cases pass.", checked: false },
              { id: "dc-no-break", content: "Existing tests are not broken.", checked: false }
            ]
          },
          {
            id: "leaf-auth-register",
            title: "Driver Registration",
            type: "leaf_feature",
            clients: ["Guest"],
            status: "ready",
            priority: "high",
            tags: ["auth", "register", "driver", "signup"],
            summary: "Public self-service registration for Driver accounts.",
            objective: "Enable public guest users to register a Driver account. A guest provides registration information including full name, username, email, phone, password, and confirm password. After successful registration, the system creates a users record and a driver_profiles record in one database transaction.",
            inScope: [
              "Public registration endpoint: POST /api/core/auth/register",
              "Input validation: Required full name, username format validation, username must be lowercase, unique username, valid email format, email normalized to lowercase before saving, unique email, Vietnamese phone format validation, phone normalization before saving, unique phone after normalization, password strength validation, and confirm password validation.",
              "Case-insensitive duplicate handling for username and email.",
              "Duplicate submit handling.",
              "Duplicate conflict handling.",
              "Race condition handling for concurrent registration requests.",
              "Database unique constraints for username, email, and phone.",
              "Password hashing with BCrypt.",
              "Transactional creation of users and driver_profiles records.",
              "Default user role: DRIVER.",
              "Default user status: ACTIVE.",
              "Default driver profile status: ACTIVE.",
              "Common API response format.",
              "Return safe response without password or password hash.",
              "Basic request logging and security-safe error handling.",
              "Optional rate limiting."
            ],
            outOfScope: [
              "Email verification OTP/link.",
              "Phone OTP verification.",
              "Registration of internal roles: ADMIN, MANAGER, STAFF.",
              "Driver vehicle registration during signup.",
              "Driver profile verification/resident verification.",
              "Initial wallet/deposit.",
              "Automatic login after registration.",
              "Refresh token implementation unless already supported elsewhere.",
              "Full RBAC tables."
            ],
            permissions: [
              { role: "Guest", permission: "Can call register endpoint anonymously" },
              { role: "Driver", permission: "Should not need to call register again" },
              { role: "Staff", permission: "No special access" },
              { role: "Manager", permission: "No special access" },
              { role: "Admin", permission: "No special access" }
            ],
            dbExistingTables: ["users", "driver_profiles"],
            dbNewTablesSql: `-- Unique indexes for case-insensitive duplicate checking and race condition protection
CREATE UNIQUE INDEX ux_users_username_lower ON users (LOWER(username));
CREATE UNIQUE INDEX ux_users_email_lower ON users (LOWER(email));
CREATE UNIQUE INDEX ux_users_phone ON users (phone);`,
            dbRelationships: [
              "driver_profiles.user_id references users.id"
            ],
            validationRules: [
              { field: "fullName", rule: "Required, trim, max 150", errorMessage: "VALIDATION_FAILED" },
              { field: "username", rule: "Required, trim, max 100", errorMessage: "VALIDATION_FAILED" },
              { field: "username", rule: "Must be lowercase", errorMessage: "VALIDATION_FAILED" },
              { field: "username", rule: "Must match username format", errorMessage: "VALIDATION_FAILED" },
              { field: "username", rule: "Unique case-insensitively", errorMessage: "USERNAME_ALREADY_EXISTS" },
              { field: "email", rule: "Required, valid email format, max 150", errorMessage: "VALIDATION_FAILED" },
              { field: "email", rule: "Normalize to lowercase after valid format check", errorMessage: "N/A" },
              { field: "email", rule: "Unique case-insensitively", errorMessage: "EMAIL_ALREADY_EXISTS" },
              { field: "phone", rule: "Required, valid Vietnamese phone format, max 30", errorMessage: "VALIDATION_FAILED" },
              { field: "phone", rule: "Normalize before duplicate check and saving", errorMessage: "N/A" },
              { field: "phone", rule: "Unique after normalization", errorMessage: "PHONE_ALREADY_EXISTS" },
              { field: "password", rule: "Required, min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit", errorMessage: "VALIDATION_FAILED" },
              { field: "confirmPassword", rule: "Required if included in DTO, must match password", errorMessage: "PASSWORD_CONFIRMATION_NOT_MATCH" }
            ],
            securityRules: [
              "Endpoint is public but must be protected against abuse.",
              "Hash password with BCrypt before saving.",
              "Do not use MD5/SHA/plain text for password.",
              "Do not log password or password hash.",
              "Do not return password hash.",
              "Use database transaction.",
              "Use global exception handling and prevent stack trace leakage.",
              "Sanitize/validate text input before persisting or rendering.",
              "Do not allow client to send role or status.",
              "If client sends role or status, backend must ignore or reject it.",
              "Created user role must always be DRIVER.",
              "Created user status must always be ACTIVE.",
              "Created driver profile status must always be ACTIVE.",
              "Optional rate limiting: Max 5 registration attempts per minute per IP, returning 429 Too Many Requests with RATE_LIMIT_EXCEEDED."
            ],
            logEvents: [
              "DRIVER_REGISTER_ATTEMPT",
              "DRIVER_REGISTERED",
              "DRIVER_REGISTER_FAILED",
              "DRIVER_REGISTER_DUPLICATE_CONFLICT",
              "DRIVER_REGISTER_RACE_CONFLICT"
            ],
            noLogEvents: [
              "Password",
              "Confirm password",
              "Password hash",
              "Access token",
              "Refresh token"
            ],
            integrationPoints: [
              { system: "ParkingDbContext", responsibility: "Performs atomic insert operations for users and driver_profiles in a transaction." },
              { system: "IPasswordHasher / BCrypt helper", responsibility: "Hashes raw password with BCrypt before saving." },
              { system: "GlobalExceptionMiddleware / BusinessException", responsibility: "Maps validation, duplicate conflict, and database unique constraint errors to safe HTTP responses." },
              { system: "AuthController", responsibility: "Exposes public AllowAnonymous POST /api/core/auth/register endpoint." },
              { system: "Database unique constraints", responsibility: "Final protection against duplicate records and race condition." }
            ],
            uiPage: "/register",
            uiComponents: "Registration Form, Full Name input, Username input, Email input, Phone input, Password input, Confirm Password input, Submit Button, Loading indicator, Field-level error messages, General rate limit error banner, Success redirection banner.",
            uiStateLoading: "Disable all inputs, disable submit button, show loading spinner on submit button, and prevent duplicate submit from UI side.",
            uiStateEmpty: "N/A",
            uiStateError: "Display specific validation errors under respective inputs: 'Username must be lowercase', 'Username format is invalid', 'Email already exists', 'Phone already exists', 'Password confirmation does not match'. Display general banner for RATE_LIMIT_EXCEEDED or unexpected registration error.",
            uiStateSuccess: "Show 'Registration successful! Redirecting to login...' and redirect to /login after 2 seconds without auto-login.",
            notes: "Driver registration does not perform email verification or phone verification for now. Username must be lowercase. Email normalized to lowercase before saving. Phone normalized using Vietnamese phone normalization before checking. Concurrent duplicate registration requests are protected by database unique constraints (ux_users_username_lower, ux_users_email_lower, ux_users_phone).",
            endpoints: [
              "POST /api/core/auth/register"
            ],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "api-contract-post-register",
                name: "POST /api/core/auth/register",
                content: "Description:\nPublic self-service registration for Driver accounts.\n\nAuth:\nAllowAnonymous\n\nContent-Type:\napplication/json\n\nRequest Body:\n{\n  \"fullName\": \"Nguyen Van A\",\n  \"username\": \"driver_a\",\n  \"email\": \"driver_a@example.com\",\n  \"phone\": \"0987654321\",\n  \"password\": \"Password123\",\n  \"confirmPassword\": \"Password123\"\n}\n\nResponse 201 Created:\n{\n  \"success\": true,\n  \"message\": \"Driver registered successfully\",\n  \"data\": {\n    \"id\": 15,\n    \"driverProfileId\": 9,\n    \"fullName\": \"Nguyen Van A\",\n    \"username\": \"driver_a\",\n    \"email\": \"driver_a@example.com\",\n    \"phone\": \"0987654321\",\n    \"role\": \"DRIVER\",\n    \"status\": \"ACTIVE\",\n    \"createdAt\": \"2026-07-05T17:20:00+07:00\"\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
              }
            ],
            uiContracts: [
              {
                id: "ui-contract-register-flow",
                name: "Driver Registration UI Flow",
                content: "Form inputs:\n  - Full Name (fullName)\n  - Username (username - lowercase only)\n  - Email (email)\n  - Phone (phone - Vietnamese phone format)\n  - Password (password)\n  - Confirm Password (confirmPassword)\n\nValidation triggers:\n  - On blur for individual fields.\n  - On form submission (calls POST /api/core/auth/register).\n\nState handling:\n  - Loading: Form fields and submit button disabled, loading spinner shown.\n  - Success (201): Success banner shown, redirects to /login after 2s.\n  - Error: Respective fields highlighted in red, error message displayed below them."
              }
            ],
            dataContracts: [
              {
                id: "data-contract-register-request",
                name: "RegisterDriverRequest (C# DTO)",
                content: "public class RegisterDriverRequest\n{\n    public string FullName { get; set; } = string.Empty;\n    public string Username { get; set; } = string.Empty;\n    public string Email { get; set; } = string.Empty;\n    public string Phone { get; set; } = string.Empty;\n    public string Password { get; set; } = string.Empty;\n    public string ConfirmPassword { get; set; } = string.Empty;\n}"
              },
              {
                id: "data-contract-register-response",
                name: "RegisterDriverResponse (C# DTO)",
                content: "public class RegisterDriverResponse\n{\n    public long Id { get; set; }\n    public long DriverProfileId { get; set; }\n    public string FullName { get; set; } = string.Empty;\n    public string Username { get; set; } = string.Empty;\n    public string Email { get; set; } = string.Empty;\n    public string Phone { get; set; } = string.Empty;\n    public string Role { get; set; } = \"DRIVER\";\n    public string Status { get; set; } = \"ACTIVE\";\n    public DateTimeOffset CreatedAt { get; set; }\n}"
              }
            ],
            testCases: [
              {
                id: "tc-reg-01",
                title: "Guest can register successfully with valid data",
                type: "api",
                steps: [
                  "Submit POST /api/core/auth/register with valid Nguyen Van A data.",
                  "Check response code.",
                  "Check database records."
                ],
                expectedResult: "Status 201. Response has success = true. User is created in users table with role DRIVER, status ACTIVE. Password is stored as BCrypt hash. Driver profile is created in driver_profiles table. Response does not contain password or password hash.",
                status: "not_started"
              },
              {
                id: "tc-reg-02",
                title: "Register normalizes email to lowercase",
                type: "api",
                steps: [
                  "Submit request with email Driver_A@Example.com."
                ],
                expectedResult: "Status 201. Saved email is driver_a@example.com. Response email is driver_a@example.com.",
                status: "not_started"
              },
              {
                id: "tc-reg-03",
                title: "Register fails when email format is invalid",
                type: "api",
                steps: [
                  "Submit request with invalid email format."
                ],
                expectedResult: "Status 400. Error code VALIDATION_FAILED.",
                status: "not_started"
              },
              {
                id: "tc-reg-04",
                title: "Register treats email duplicate case-insensitively",
                type: "api",
                steps: [
                  "Register with email Driver_A@Example.com.",
                  "Register again with email driver_a@example.com."
                ],
                expectedResult: "Second request fails with HTTP 409. Error code EMAIL_ALREADY_EXISTS. Only one user exists for that email.",
                status: "not_started"
              },
              {
                id: "tc-reg-05",
                title: "Register fails when username is uppercase",
                type: "api",
                steps: [
                  "Submit request with username Driver_A."
                ],
                expectedResult: "Status 400. Error code VALIDATION_FAILED. Field: username. Message indicates username must be lowercase.",
                status: "not_started"
              },
              {
                id: "tc-reg-06",
                title: "Register fails when username format is invalid",
                type: "api",
                steps: [
                  "Submit request with username that does not match username format."
                ],
                expectedResult: "Status 400. Error code VALIDATION_FAILED. Field: username.",
                status: "not_started"
              },
              {
                id: "tc-reg-07",
                title: "Register treats username duplicate case-insensitively",
                type: "api",
                steps: [
                  "Register with username driver_a.",
                  "Try to register with username DRIVER_A."
                ],
                expectedResult: "Second request fails with HTTP 400 if uppercase format is rejected. If duplicate check is reached, it must fail with HTTP 409 USERNAME_ALREADY_EXISTS. No duplicate username can exist in database.",
                status: "not_started"
              },
              {
                id: "tc-reg-08",
                title: "Register normalizes Vietnamese phone",
                type: "api",
                steps: [
                  "Submit request with phone +84987654321."
                ],
                expectedResult: "Status 201. Saved phone is normalized to 0987654321. Response phone is normalized.",
                status: "not_started"
              },
              {
                id: "tc-reg-09",
                title: "Register fails when phone is invalid",
                type: "api",
                steps: [
                  "Submit request with invalid phone format."
                ],
                expectedResult: "Status 400. Error code VALIDATION_FAILED. Field: phone.",
                status: "not_started"
              },
              {
                id: "tc-reg-10",
                title: "Register treats normalized phone as duplicate",
                type: "api",
                steps: [
                  "Register with phone 0987654321.",
                  "Register again with phone +84987654321."
                ],
                expectedResult: "Second request fails with HTTP 409. Error code PHONE_ALREADY_EXISTS. Only one user exists for that normalized phone.",
                status: "not_started"
              },
              {
                id: "tc-reg-11",
                title: "Register fails when fullName is empty",
                type: "api",
                steps: [
                  "Submit request with empty fullName."
                ],
                expectedResult: "Status 400. Error code VALIDATION_FAILED.",
                status: "not_started"
              },
              {
                id: "tc-reg-12",
                title: "Register fails when username is empty",
                type: "api",
                steps: [
                  "Submit request with empty username."
                ],
                expectedResult: "Status 400. Error code VALIDATION_FAILED.",
                status: "not_started"
              },
              {
                id: "tc-reg-13",
                title: "Register fails when password is weak",
                type: "api",
                steps: [
                  "Submit password with less than 8 characters, or without uppercase/lowercase/digit."
                ],
                expectedResult: "Status 400. Error code VALIDATION_FAILED.",
                status: "not_started"
              },
              {
                id: "tc-reg-14",
                title: "Register fails when confirmPassword does not match",
                type: "api",
                steps: [
                  "Submit request where confirmPassword != password."
                ],
                expectedResult: "Status 400. Error code PASSWORD_CONFIRMATION_NOT_MATCH.",
                status: "not_started"
              },
              {
                id: "tc-reg-15",
                title: "Register fails when username already exists",
                type: "api",
                expectedResult: "Status 409. Error code USERNAME_ALREADY_EXISTS.",
                status: "not_started"
              },
              {
                id: "tc-reg-16",
                title: "Register fails when email already exists",
                type: "api",
                expectedResult: "Status 409. Error code EMAIL_ALREADY_EXISTS.",
                status: "not_started"
              },
              {
                id: "tc-reg-17",
                title: "Register fails when phone already exists",
                type: "api",
                expectedResult: "Status 409. Error code PHONE_ALREADY_EXISTS.",
                status: "not_started"
              },
              {
                id: "tc-reg-18",
                title: "Client cannot assign role",
                type: "api",
                steps: [
                  "Submit request with extra field role: ADMIN."
                ],
                expectedResult: "Backend ignores or rejects role field. Created user role must still be DRIVER.",
                status: "not_started"
              },
              {
                id: "tc-reg-19",
                title: "Client cannot assign status",
                type: "api",
                steps: [
                  "Submit request with extra field status: LOCKED."
                ],
                expectedResult: "Backend ignores or rejects status field. Created user status must still be ACTIVE.",
                status: "not_started"
              },
              {
                id: "tc-reg-20",
                title: "Duplicate submit creates only one account",
                type: "integration",
                steps: [
                  "Submit the same valid registration request twice quickly."
                ],
                expectedResult: "Only one user is created. Only one driver_profile is created. One request succeeds with HTTP 201. The duplicate request fails with HTTP 409 and correct duplicate error code.",
                status: "not_started"
              },
              {
                id: "tc-reg-21",
                title: "Register handles concurrent duplicate email race condition",
                type: "integration",
                steps: [
                  "Send two concurrent register requests with the same email.",
                  "Let both requests reach duplicate checking at nearly the same time."
                ],
                expectedResult: "Only one user is created. Only one driver_profile is created. One request succeeds. The other request fails with HTTP 409 EMAIL_ALREADY_EXISTS. No raw database error is returned.",
                status: "not_started"
              },
              {
                id: "tc-reg-22",
                title: "Register handles concurrent duplicate username race condition",
                type: "integration",
                steps: [
                  "Send two concurrent register requests with the same username."
                ],
                expectedResult: "Only one user is created. The second request fails with HTTP 409 USERNAME_ALREADY_EXISTS. No duplicate username exists.",
                status: "not_started"
              },
              {
                id: "tc-reg-23",
                title: "Register handles concurrent duplicate phone race condition",
                type: "integration",
                steps: [
                  "Send two concurrent register requests with equivalent phone numbers (e.g. 0987654321 and +84987654321)."
                ],
                expectedResult: "Only one user is created. The second request fails with HTTP 409 PHONE_ALREADY_EXISTS. No duplicate normalized phone exists.",
                status: "not_started"
              },
              {
                id: "tc-reg-24",
                title: "Register is transactional",
                type: "integration",
                steps: [
                  "Force driver_profiles insert to fail.",
                  "Submit valid register request."
                ],
                expectedResult: "Response is an error. users insert is rolled back. No orphaned user exists.",
                status: "not_started"
              },
              {
                id: "tc-reg-25",
                title: "Password hash is not plain text",
                type: "integration",
                steps: [
                  "Register successfully.",
                  "Read users.password_hash."
                ],
                expectedResult: "password_hash is not equal to raw password. BCrypt verify succeeds with raw password.",
                status: "not_started"
              },
              {
                id: "tc-reg-26",
                title: "Register response uses common response format",
                type: "api",
                expectedResult: "Response contains: success, message, data, errors, timestamp.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-reg-01", content: "POST /api/core/auth/register exists in AuthController.", checked: false },
              { id: "dc-reg-02", content: "Endpoint is public and allows anonymous access.", checked: false },
              { id: "dc-reg-03", content: "Endpoint does not require JWT.", checked: false },
              { id: "dc-reg-04", content: "Request validates fullName, username, email, phone, password, and confirmPassword.", checked: false },
              { id: "dc-reg-05", content: "fullName is trimmed before saving.", checked: false },
              { id: "dc-reg-06", content: "username is trimmed before validation.", checked: false },
              { id: "dc-reg-07", content: "username must be lowercase.", checked: false },
              { id: "dc-reg-08", content: "username invalid format returns HTTP 400 VALIDATION_FAILED.", checked: false },
              { id: "dc-reg-09", content: "username duplicate check is case-insensitive.", checked: false },
              { id: "dc-reg-10", content: "Duplicate username returns HTTP 409 USERNAME_ALREADY_EXISTS.", checked: false },
              { id: "dc-reg-11", content: "email validates correct email format before normalization.", checked: false },
              { id: "dc-reg-12", content: "email is normalized to lowercase before duplicate check and saving.", checked: false },
              { id: "dc-reg-13", content: "email duplicate check is case-insensitive.", checked: false },
              { id: "dc-reg-14", content: "Duplicate email returns HTTP 409 EMAIL_ALREADY_EXISTS.", checked: false },
              { id: "dc-reg-15", content: "phone validates Vietnamese phone format.", checked: false },
              { id: "dc-reg-16", content: "phone is normalized before duplicate check and saving.", checked: false },
              { id: "dc-reg-17", content: "Duplicate normalized phone returns HTTP 409 PHONE_ALREADY_EXISTS.", checked: false },
              { id: "dc-reg-18", content: "Database has unique protection index lower(username).", checked: false },
              { id: "dc-reg-19", content: "Database has unique protection index lower(email).", checked: false },
              { id: "dc-reg-20", content: "Database has unique protection index for phone.", checked: false },
              { id: "dc-reg-21", content: "Database uniqueness protects against race condition.", checked: false },
              { id: "dc-reg-22", content: "Backend catches database unique constraint violation.", checked: false },
              { id: "dc-reg-23", content: "Backend maps database duplicate conflict to safe HTTP 409 response.", checked: false },
              { id: "dc-reg-24", content: "Backend does not expose raw SQL/database errors.", checked: false },
              { id: "dc-reg-25", content: "Duplicate submit creates only one account.", checked: false },
              { id: "dc-reg-26", content: "Concurrent duplicate registration requests create only one account.", checked: false },
              { id: "dc-reg-27", content: "Password is hashed with BCrypt.", checked: false },
              { id: "dc-reg-28", content: "No password or password hash is returned.", checked: false },
              { id: "dc-reg-29", content: "Created user has role DRIVER.", checked: false },
              { id: "dc-reg-30", content: "Created user has status ACTIVE.", checked: false },
              { id: "dc-reg-31", content: "Created driver profile has status ACTIVE.", checked: false },
              { id: "dc-reg-32", content: "Email verification is not implemented for now.", checked: false },
              { id: "dc-reg-33", content: "Phone verification is not implemented for now.", checked: false },
              { id: "dc-reg-34", content: "users and driver_profiles are created in one transaction.", checked: false },
              { id: "dc-reg-35", content: "Transaction rolls back if either insert fails.", checked: false },
              { id: "dc-reg-36", content: "Client cannot create ADMIN, MANAGER, or STAFF through this endpoint.", checked: false },
              { id: "dc-reg-37", content: "Client cannot assign custom status through this endpoint.", checked: false },
              { id: "dc-reg-38", content: "Response uses common API response format.", checked: false },
              { id: "dc-reg-39", content: "Success response returns HTTP 201.", checked: false },
              { id: "dc-reg-40", content: "Validation errors return HTTP 400.", checked: false },
              { id: "dc-reg-41", content: "Duplicate conflicts return HTTP 409.", checked: false },
              { id: "dc-reg-42", content: "Rate limit returns HTTP 429 if rate limiting is implemented.", checked: false },
              { id: "dc-reg-43", content: "Audit/application log records DRIVER_REGISTERED.", checked: false },
              { id: "dc-reg-44", content: "Automated test cases pass.", checked: false }
            ]
          }
        ]
      },
      {
        id: "cat-user-driver",
        title: "User & Driver Management",
        type: "category",
        summary: "Operations for administering users and driver vehicle records.",
        children: [
          {
            id: "cat-user-management",
            title: "User Management",
            type: "category",
            summary: "Operations for administering internal accounts, status, and role configurations.",
            children: [
              {
                id: "leaf-user-list-detail",
                title: "User Listing & Detail",
                type: "leaf_feature",
                clients: ["Admin"],
                status: "ready",
                priority: "medium",
                tags: ["users", "listing", "detail", "admin"],
                summary: "Allows Admin to search, list, filter, and view detail of all users.",
                objective: "Implement user search, listing, and detail views for Admin. User list and detail endpoints can retrieve ADMIN, MANAGER, STAFF, and DRIVER. Password hashes must be hidden.",
                inScope: [
                  "Admin user listing with keyword search, role filter, status filter, and pagination.",
                  "User listing includes ADMIN, MANAGER, STAFF, and DRIVER.",
                  "Admin user detail for all user roles, including DRIVER.",
                  "Common API response format.",
                  "All APIs require JWT authentication and Admin role."
                ],
                outOfScope: [
                  "Driver public registration.",
                  "Driver profile management.",
                  "Driver vehicle management.",
                  "User password reset.",
                  "Change password.",
                  "Hard delete user.",
                  "Full RBAC/permission table management.",
                  "Email invitation/activation email.",
                  "Email verification.",
                  "Phone verification."
                ],
                permissions: [
                  { role: "ADMIN", permission: "Full access to list and detail APIs" },
                  { role: "MANAGER", permission: "No access" },
                  { role: "STAFF", permission: "No access" },
                  { role: "DRIVER", permission: "No access" },
                  { role: "Anonymous", permission: "No access" }
                ],
                dbExistingTables: ["users"],
                dbRelationships: [
                  "Reads records from users table.",
                  "No hard delete is allowed."
                ],
                securityRules: [
                  "Validate JWT.",
                  "Require Admin role for listing and detail endpoints.",
                  "Do not return password hash in any response.",
                  "Use global exception handling and prevent stack trace leakage."
                ],
                uiPage: "/admin/users",
                uiComponents: "User Table, Search Input, Role Filter Dropdown, Status Filter Dropdown, Pagination Controls.",
                uiStateLoading: "Show skeleton table rows or animated loading indicator while fetching users.",
                uiStateEmpty: "No users found matching filters.",
                uiStateError: "Display general toast/banner for FORBIDDEN, USER_NOT_FOUND, or unexpected errors.",
                uiStateSuccess: "Render users list in a responsive table. Highlight active filters.",
                notes: "Admin can list and view all users, including DRIVER users. Driver profile fields are not managed by this feature.",
                endpoints: [
                  "GET /api/core/users",
                  "GET /api/core/users/{id}"
                ],
                ownerService: ".NET Core API",
                apiContracts: [
                  {
                    id: "api-contract-get-users",
                    name: "GET /api/core/users",
                    content: "Description:\nAdmin searches and lists all users, including ADMIN, MANAGER, STAFF, and DRIVER.\n\nAuth:\nJWT required\n\nRole:\nADMIN only\n\nQuery Parameters:\n  - keyword: string (optional)\n  - role: string (optional)\n  - status: string (optional)\n  - page: int (default 1)\n  - pageSize: int (default 20, max 100)\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"Get users successfully\",\n  \"data\": {\n    \"items\": [\n      {\n        \"id\": 2,\n        \"fullName\": \"Staff User\",\n        \"username\": \"staff01\",\n        \"email\": \"staff01@example.com\",\n        \"phone\": \"0900000002\",\n        \"role\": \"STAFF\",\n        \"status\": \"ACTIVE\",\n        \"createdAt\": \"2026-07-05T17:20:00+07:00\"\n      },\n      {\n        \"id\": 15,\n        \"fullName\": \"Driver User\",\n        \"username\": \"driver01\",\n        \"email\": \"driver01@example.com\",\n        \"phone\": \"0987654321\",\n        \"role\": \"DRIVER\",\n        \"status\": \"ACTIVE\",\n        \"createdAt\": \"2026-07-05T17:20:00+07:00\"\n      }\n    ],\n    \"page\": 1,\n    \"pageSize\": 20,\n    \"totalItems\": 2,\n    \"totalPages\": 1\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
                  },
                  {
                    id: "api-contract-get-user-detail",
                    name: "GET /api/core/users/{id}",
                    content: "Description:\nAdmin gets user detail by ID. User detail can return ADMIN, MANAGER, STAFF, or DRIVER.\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"Get user successfully\",\n  \"data\": {\n    \"id\": 2,\n    \"fullName\": \"Staff User\",\n    \"username\": \"staff01\",\n    \"email\": \"staff01@example.com\",\n    \"phone\": \"0900000002\",\n    \"role\": \"STAFF\",\n    \"status\": \"ACTIVE\",\n    \"createdAt\": \"2026-07-05T17:20:00+07:00\",\n    \"updatedAt\": \"2026-07-05T17:20:00+07:00\"\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
                  }
                ],
                testCases: [
                  {
                    id: "tc-user-ld-01",
                    title: "Admin can list all users including drivers",
                    type: "api",
                    precondition: "User authenticated as ADMIN. Database has ADMIN, MANAGER, STAFF, and DRIVER users.",
                    steps: [
                      "Call GET /api/core/users?page=1&pageSize=20."
                    ],
                    expectedResult: "Status 200. Response has success = true. Items can include ADMIN, MANAGER, STAFF, and DRIVER users.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-02",
                    title: "Admin can search users by keyword",
                    type: "api",
                    steps: [
                      "Call GET /api/core/users?keyword=staff."
                    ],
                    expectedResult: "Only matching users are returned. Search matches username/fullName/email/phone.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-03",
                    title: "Admin can filter by role DRIVER",
                    type: "api",
                    steps: [
                      "Call GET /api/core/users?role=DRIVER."
                    ],
                    expectedResult: "Status 200. Returned users have role DRIVER.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-04",
                    title: "Admin can filter by role/status",
                    type: "api",
                    steps: [
                      "Call GET /api/core/users?role=STAFF&status=ACTIVE."
                    ],
                    expectedResult: "Returned users have role STAFF and status ACTIVE.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-05",
                    title: "Invalid page/pageSize returns validation error",
                    type: "api",
                    steps: [
                      "Call GET /api/core/users?page=0&pageSize=1000."
                    ],
                    expectedResult: "Status 400 or page/pageSize are safely clamped based on existing project convention. No server error occurs.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-06",
                    title: "Admin can get user detail",
                    type: "api",
                    steps: [
                      "Call GET /api/core/users/{id}."
                    ],
                    expectedResult: "Status 200. User detail returned. Response does not contain passwordHash.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-07",
                    title: "Admin can get Driver user detail",
                    type: "api",
                    steps: [
                      "Call GET /api/core/users/{driverUserId}."
                    ],
                    expectedResult: "Status 200. Driver user detail returned. Response does not contain passwordHash. Driver profile management data is not required in this response.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-08",
                    title: "User not found returns 404",
                    type: "api",
                    steps: [
                      "Call GET /api/core/users/999999."
                    ],
                    expectedResult: "Status 404. Error code USER_NOT_FOUND.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-09",
                    title: "Staff cannot access User Management",
                    type: "api",
                    precondition: "User authenticated as STAFF.",
                    steps: [
                      "Call GET /api/core/users."
                    ],
                    expectedResult: "Status 403.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-10",
                    title: "Anonymous cannot access User Management",
                    type: "api",
                    steps: [
                      "Call GET /api/core/users without token."
                    ],
                    expectedResult: "Status 401.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-11",
                    title: "User Management responses use common response format",
                    type: "api",
                    expectedResult: "All endpoints return response containing success, message, data, errors, and timestamp.",
                    status: "not_started"
                  }
                ],
                doneCriteria: [
                  { id: "dc-user-ld-01", content: "Endpoints GET /api/core/users and GET /api/core/users/{id} are exposed.", checked: false },
                  { id: "dc-user-ld-02", content: "No hard delete endpoint exists.", checked: false },
                  { id: "dc-user-ld-03", content: "All endpoints require JWT authentication.", checked: false },
                  { id: "dc-user-ld-04", content: "All endpoints require Admin role.", checked: false },
                  { id: "dc-user-ld-05", content: "GET /api/core/users supports keyword, role, status, page, pageSize.", checked: false },
                  { id: "dc-user-ld-06", content: "GET /api/core/users can list ADMIN, MANAGER, STAFF, and DRIVER users.", checked: false },
                  { id: "dc-user-ld-07", content: "GET /api/core/users supports role filter DRIVER.", checked: false },
                  { id: "dc-user-ld-08", content: "GET /api/core/users/{id} can return ADMIN, MANAGER, STAFF, and DRIVER user detail.", checked: false },
                  { id: "dc-user-ld-09", content: "List endpoint returns paged response.", checked: false },
                  { id: "dc-user-ld-10", content: "No response exposes password hash.", checked: false },
                  { id: "dc-user-ld-11", content: "Response uses common API response format.", checked: false }
                ]
              },
              {
                id: "leaf-user-create",
                title: "Internal User Creation",
                type: "leaf_feature",
                clients: ["Admin"],
                status: "ready",
                priority: "medium",
                tags: ["users", "create", "admin"],
                summary: "Allows Admin to create internal users (ADMIN, MANAGER, STAFF).",
                objective: "Implement internal user creation for Admin. DRIVER role creation is rejected. Encrypt password with BCrypt. Enforce duplicate rules, database index integrity, and audit logging.",
                inScope: [
                  "Admin creates internal users only: ADMIN, MANAGER, STAFF.",
                  "Password hashing with BCrypt.",
                  "Username lowercase validation and trimmed.",
                  "Email lowercase normalization and trimmed.",
                  "Vietnamese phone validation and normalization.",
                  "Case-insensitive duplicate handling for username and email.",
                  "Duplicate submit handling and concurrent race condition check.",
                  "Database unique constraints for username, email, and phone.",
                  "Mutating operations write audit log USER_CREATED."
                ],
                outOfScope: [
                  "Driver public registration.",
                  "Driver profile management.",
                  "User profile update.",
                  "Status changes.",
                  "Role changes after creation.",
                  "Password reset.",
                  "Hard delete."
                ],
                permissions: [
                  { role: "ADMIN", permission: "Can call POST /api/core/users" }
                ],
                dbExistingTables: ["users"],
                dbNewTablesSql: `-- Unique indexes for case-insensitive duplicate checking and race condition protection\nCREATE UNIQUE INDEX ux_users_username_lower ON users (LOWER(username));\nCREATE UNIQUE INDEX ux_users_email_lower ON users (LOWER(email)) WHERE email IS NOT NULL;\nCREATE UNIQUE INDEX ux_users_phone ON users (phone) WHERE phone IS NOT NULL;`,
                dbRelationships: [
                  "Creates records in users table."
                ],
                validationRules: [
                  { field: "fullName", rule: "Required, trim, max 150", errorMessage: "VALIDATION_FAILED" },
                  { field: "username", rule: "Required, trim, max 100", errorMessage: "VALIDATION_FAILED" },
                  { field: "username", rule: "Must be lowercase", errorMessage: "VALIDATION_FAILED" },
                  { field: "username", rule: "Must match username format", errorMessage: "VALIDATION_FAILED" },
                  { field: "username", rule: "Unique case-insensitively", errorMessage: "USERNAME_ALREADY_EXISTS" },
                  { field: "email", rule: "Optional, valid email format, max 150", errorMessage: "VALIDATION_FAILED" },
                  { field: "email", rule: "Normalize to lowercase after valid format check", errorMessage: "N/A" },
                  { field: "email", rule: "Unique case-insensitively if present", errorMessage: "EMAIL_ALREADY_EXISTS" },
                  { field: "phone", rule: "Optional, valid Vietnamese phone format, max 30", errorMessage: "VALIDATION_FAILED" },
                  { field: "phone", rule: "Normalize before duplicate check and saving", errorMessage: "N/A" },
                  { field: "phone", rule: "Unique after normalization if present", errorMessage: "PHONE_ALREADY_EXISTS" },
                  { field: "password", rule: "Required on create, min 8, at least 1 uppercase, 1 lowercase, 1 digit", errorMessage: "VALIDATION_FAILED" },
                  { field: "role", rule: "Required on create, only ADMIN, MANAGER, STAFF", errorMessage: "INVALID_USER_ROLE" }
                ],
                securityRules: [
                  "Validate JWT.",
                  "Require Admin role.",
                  "Hash password with BCrypt before saving.",
                  "Do not log password or password hash.",
                  "Do not return password hash.",
                  "Prevent creating DRIVER through POST /api/core/users.",
                  "Do not expose raw SQL/database errors."
                ],
                logEvents: [
                  "USER_CREATED",
                  "USER_CREATE_DUPLICATE_CONFLICT",
                  "USER_CREATE_RACE_CONFLICT"
                ],
                noLogEvents: [
                  "Password",
                  "Password hash"
                ],
                integrationPoints: [
                  { system: "Auth / JWT Middleware", responsibility: "Validates authenticated Admin request" },
                  { system: "Password Hasher / BCrypt helper", responsibility: "Hashes password when creating user" },
                  { system: "Audit Log Service", responsibility: "Writes audit logs on mutating operations" },
                  { system: "Database unique constraints", responsibility: "Final protection against duplicate records and race condition" }
                ],
                uiComponents: "Create User Modal, Form fields: fullName, username, email, phone, password, role dropdown.",
                uiStateLoading: "Disable submit button, show loading spinner, prevent duplicate submits.",
                uiStateError: "Display field-level validation errors.",
                uiStateSuccess: "Show success toast, refresh user list, close modal.",
                endpoints: [
                  "POST /api/core/users"
                ],
                ownerService: ".NET Core API",
                apiContracts: [
                  {
                    id: "api-contract-post-create-user",
                    name: "POST /api/core/users",
                    content: "Description:\nAdmin creates an internal user (ADMIN, MANAGER, or STAFF). DRIVER role is rejected.\n\nRequest Body:\n{\n  \"fullName\": \"New Staff\",\n  \"username\": \"staff02\",\n  \"email\": \"Staff02@Example.com\",\n  \"phone\": \"+84900000003\",\n  \"password\": \"Password123\",\n  \"role\": \"STAFF\"\n}\n\nResponse 201 Created:\n{\n  \"success\": true,\n  \"message\": \"User created successfully\",\n  \"data\": {\n    \"id\": 20,\n    \"fullName\": \"New Staff\",\n    \"username\": \"staff02\",\n    \"email\": \"staff02@example.com\",\n    \"phone\": \"0900000003\",\n    \"role\": \"STAFF\",\n    \"status\": \"ACTIVE\",\n    \"createdAt\": \"2026-07-05T17:20:00+07:00\"\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
                  }
                ],
                dataContracts: [
                  {
                    id: "data-contract-create-user-request",
                    name: "CreateUserRequest (C# DTO)",
                    content: "public class CreateUserRequest\n{\n    public string FullName { get; set; } = string.Empty;\n    public string Username { get; set; } = string.Empty;\n    public string Email { get; set; } = string.Empty;\n    public string Phone { get; set; } = string.Empty;\n    public string Password { get; set; } = string.Empty;\n    public string Role { get; set; } = string.Empty;\n}"
                  }
                ],
                testCases: [
                  {
                    id: "tc-user-c-01",
                    title: "Admin can create STAFF user",
                    type: "api",
                    steps: [
                      "Call POST /api/core/users with valid STAFF payload."
                    ],
                    expectedResult: "Status 201. User created with status ACTIVE. Password is stored as BCrypt hash. Response does not contain passwordHash. Audit log USER_CREATED exists.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-02",
                    title: "Create user normalizes email to lowercase",
                    type: "api",
                    steps: [
                      "Submit POST /api/core/users with email Staff02@Example.com."
                    ],
                    expectedResult: "Status 201. Saved email is staff02@example.com. Response email is staff02@example.com.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-03",
                    title: "Create user normalizes Vietnamese phone",
                    type: "api",
                    steps: [
                      "Submit POST /api/core/users with phone +84900000003."
                    ],
                    expectedResult: "Status 201. Saved phone is normalized to 0900000003. Response phone is normalized.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-04",
                    title: "Create user with uppercase username is rejected",
                    type: "api",
                    steps: [
                      "Submit POST /api/core/users with username Staff02."
                    ],
                    expectedResult: "Status 400. Error code VALIDATION_FAILED. Field username indicates username must be lowercase.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-05",
                    title: "Create user with invalid username format is rejected",
                    type: "api",
                    steps: [
                      "Submit POST /api/core/users with invalid username format."
                    ],
                    expectedResult: "Status 400. Error code VALIDATION_FAILED. Field username.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-06",
                    title: "Create user with invalid email format is rejected",
                    type: "api",
                    steps: [
                      "Submit POST /api/core/users with invalid email format."
                    ],
                    expectedResult: "Status 400. Error code VALIDATION_FAILED. Field email.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-07",
                    title: "Create user with invalid phone format is rejected",
                    type: "api",
                    steps: [
                      "Submit POST /api/core/users with invalid Vietnamese phone format."
                    ],
                    expectedResult: "Status 400. Error code VALIDATION_FAILED. Field phone.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-08",
                    title: "Duplicate username returns 409",
                    type: "api",
                    expectedResult: "Status 409. Error code USERNAME_ALREADY_EXISTS.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-09",
                    title: "Duplicate email returns 409",
                    type: "api",
                    expectedResult: "Status 409. Error code EMAIL_ALREADY_EXISTS.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-10",
                    title: "Duplicate phone returns 409",
                    type: "api",
                    expectedResult: "Status 409. Error code PHONE_ALREADY_EXISTS.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-11",
                    title: "Duplicate email is case-insensitive",
                    type: "api",
                    steps: [
                      "Create user with email Staff02@Example.com.",
                      "Create another user with email staff02@example.com."
                    ],
                    expectedResult: "Second request fails with HTTP 409. Error code EMAIL_ALREADY_EXISTS. Only one user exists for that email.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-12",
                    title: "Duplicate phone is checked after normalization",
                    type: "api",
                    steps: [
                      "Create user with phone 0900000003.",
                      "Create another user with phone +84900000003."
                    ],
                    expectedResult: "Second request fails with HTTP 409. Error code PHONE_ALREADY_EXISTS. Only one user exists for that normalized phone.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-13",
                    title: "Create user with DRIVER role is rejected",
                    type: "api",
                    steps: [
                      "Call POST /api/core/users with role DRIVER."
                    ],
                    expectedResult: "Status 400. Error code INVALID_USER_ROLE. No user is created.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-14",
                    title: "Password policy is enforced when creating user",
                    type: "api",
                    steps: [
                      "Call POST /api/core/users with weak password."
                    ],
                    expectedResult: "Status 400. Error code VALIDATION_FAILED. Password must satisfy min length, uppercase, lowercase, and digit rule.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-15",
                    title: "Duplicate submit creates only one user",
                    type: "integration",
                    steps: [
                      "Submit the same valid POST /api/core/users request twice quickly."
                    ],
                    expectedResult: "Only one user is created. One request succeeds with HTTP 201. The duplicate request fails with HTTP 409 and correct duplicate error code.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-16",
                    title: "Create user handles concurrent duplicate email race condition",
                    type: "integration",
                    steps: [
                      "Send two concurrent POST /api/core/users requests with the same email."
                    ],
                    expectedResult: "Only one user is created. One request succeeds. The other request fails with HTTP 409 EMAIL_ALREADY_EXISTS. No raw database error is returned.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-17",
                    title: "Create user handles concurrent duplicate username race condition",
                    type: "integration",
                    steps: [
                      "Send two concurrent POST /api/core/users requests with the same username."
                    ],
                    expectedResult: "Only one user is created. The second request fails with HTTP 409 USERNAME_ALREADY_EXISTS. No duplicate username exists.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-18",
                    title: "Create user handles concurrent duplicate phone race condition",
                    type: "integration",
                    steps: [
                      "Send two concurrent POST /api/core/users requests with equivalent phone numbers (e.g. 0900000003 and +84900000003)."
                    ],
                    expectedResult: "Only one user is created. The second request fails with HTTP 409 PHONE_ALREADY_EXISTS. No duplicate normalized phone exists.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-19",
                    title: "Password hash is not plain text",
                    type: "integration",
                    steps: [
                      "Create user successfully.",
                      "Read users.password_hash."
                    ],
                    expectedResult: "password_hash is not equal to raw password. BCrypt verify succeeds with raw password.",
                    status: "not_started"
                  }
                ],
                doneCriteria: [
                  { id: "dc-user-c-01", content: "Endpoint POST /api/core/users is exposed.", checked: false },
                  { id: "dc-user-c-02", content: "Create endpoint returns HTTP 201.", checked: false },
                  { id: "dc-user-c-03", content: "POST /api/core/users creates internal users only.", checked: false },
                  { id: "dc-user-c-04", content: "POST /api/core/users allows ADMIN, MANAGER, STAFF.", checked: false },
                  { id: "dc-user-c-05", content: "POST /api/core/users rejects DRIVER role.", checked: false },
                  { id: "dc-user-c-06", content: "fullName is trimmed before saving.", checked: false },
                  { id: "dc-user-c-07", content: "username is trimmed before validation.", checked: false },
                  { id: "dc-user-c-08", content: "username must be lowercase.", checked: false },
                  { id: "dc-user-c-09", content: "username invalid format returns HTTP 400 VALIDATION_FAILED.", checked: false },
                  { id: "dc-user-c-10", content: "username duplicate check is case-insensitive.", checked: false },
                  { id: "dc-user-c-11", content: "Duplicate username returns HTTP 409 USERNAME_ALREADY_EXISTS.", checked: false },
                  { id: "dc-user-c-12", content: "email validates correct email format before normalization.", checked: false },
                  { id: "dc-user-c-13", content: "email is normalized to lowercase before duplicate check and saving.", checked: false },
                  { id: "dc-user-c-14", content: "email duplicate check is case-insensitive.", checked: false },
                  { id: "dc-user-c-15", content: "Duplicate email returns HTTP 409 EMAIL_ALREADY_EXISTS.", checked: false },
                  { id: "dc-user-c-16", content: "phone validates Vietnamese phone format.", checked: false },
                  { id: "dc-user-c-17", content: "phone is normalized before duplicate check and saving.", checked: false },
                  { id: "dc-user-c-18", content: "Duplicate normalized phone returns HTTP 409 PHONE_ALREADY_EXISTS.", checked: false },
                  { id: "dc-user-c-19", content: "Database has unique index lower(username).", checked: false },
                  { id: "dc-user-c-20", content: "Database has unique index lower(email) if present.", checked: false },
                  { id: "dc-user-c-21", content: "Database has unique index phone if present.", checked: false },
                  { id: "dc-user-c-22", content: "Database uniqueness protects against race condition.", checked: false },
                  { id: "dc-user-c-23", content: "Backend catches database unique constraint violation.", checked: false },
                  { id: "dc-user-c-24", content: "Backend maps database duplicate conflict to safe HTTP 409 response.", checked: false },
                  { id: "dc-user-c-25", content: "Backend does not expose raw SQL/database errors.", checked: false },
                  { id: "dc-user-c-26", content: "Duplicate submit creates only one user.", checked: false },
                  { id: "dc-user-c-27", content: "Concurrent duplicate create requests create only one user.", checked: false },
                  { id: "dc-user-c-28", content: "Password is hashed with BCrypt.", checked: false },
                  { id: "dc-user-c-29", content: "No response exposes password hash.", checked: false },
                  { id: "dc-user-c-30", content: "Mutating operations write audit log USER_CREATED.", checked: false }
                ]
              },
              {
                id: "leaf-user-update",
                title: "User Profile Update",
                type: "leaf_feature",
                clients: ["Admin"],
                status: "ready",
                priority: "medium",
                tags: ["users", "update", "admin"],
                summary: "Allows Admin to update basic user profile fields (fullName, email, phone).",
                objective: "Implement basic profile field updates for Admin. Username, password, role, status are read-only. Prevent email/phone duplicates with other users.",
                inScope: [
                  "Admin updates basic user profile fields: fullName, email, phone.",
                  "Email and phone normalization and validation.",
                  "Prevent duplicate email or phone with another user (returns HTTP 409).",
                  "Allow updating with same email/phone of the current user.",
                  "Audit log USER_UPDATED is written."
                ],
                outOfScope: [
                  "Creating users.",
                  "Changing status.",
                  "Changing role.",
                  "Changing password.",
                  "Hard delete.",
                  "Driver profile management."
                ],
                permissions: [
                  { role: "ADMIN", permission: "Can call PUT /api/core/users/{id}" }
                ],
                dbExistingTables: ["users"],
                dbRelationships: [
                  "Updates records in users table."
                ],
                validationRules: [
                  { field: "fullName", rule: "Required, trim, max 150", errorMessage: "VALIDATION_FAILED" },
                  { field: "email", rule: "Optional, valid email format, max 150", errorMessage: "VALIDATION_FAILED" },
                  { field: "email", rule: "Normalize to lowercase after valid format check", errorMessage: "N/A" },
                  { field: "phone", rule: "Optional, valid Vietnamese phone format, max 30", errorMessage: "VALIDATION_FAILED" },
                  { field: "phone", rule: "Normalize before duplicate check and saving", errorMessage: "N/A" }
                ],
                securityRules: [
                  "Validate JWT.",
                  "Require Admin role.",
                  "Do not accept password, username, role, or status updates in this endpoint.",
                  "Do not expose raw SQL/database errors."
                ],
                logEvents: [
                  "USER_UPDATED",
                  "USER_UPDATE_DUPLICATE_CONFLICT",
                  "USER_UPDATE_RACE_CONFLICT"
                ],
                integrationPoints: [
                  { system: "Auth / JWT Middleware", responsibility: "Validates authenticated Admin request" },
                  { system: "Audit Log Service", responsibility: "Writes audit logs on mutating operations" }
                ],
                uiComponents: "Edit User Modal, Form fields: fullName, email, phone. Username read-only.",
                uiStateLoading: "Disable submit button, show loading spinner.",
                uiStateError: "Display field-level validation errors.",
                uiStateSuccess: "Show success toast, refresh list, close modal.",
                endpoints: [
                  "PUT /api/core/users/{id}"
                ],
                ownerService: ".NET Core API",
                apiContracts: [
                  {
                    id: "api-contract-put-update-user",
                    name: "PUT /api/core/users/{id}",
                    content: "Description:\nAdmin updates basic user profile fields: fullName, email, phone. Username, password, role, status are not updated.\n\nRequest Body:\n{\n  \"fullName\": \"Updated Staff Name\",\n  \"email\": \"Staff02.Updated@Example.com\",\n  \"phone\": \"+84900000004\"\n}\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"User updated successfully\",\n  \"data\": {\n    \"id\": 20,\n    \"fullName\": \"Updated Staff Name\",\n    \"username\": \"staff02\",\n    \"email\": \"staff02.updated@example.com\",\n    \"phone\": \"0900000004\",\n    \"role\": \"STAFF\",\n    \"status\": \"ACTIVE\",\n    \"updatedAt\": \"2026-07-05T17:30:00+07:00\"\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:30:00+07:00\"\n}"
                  }
                ],
                dataContracts: [
                  {
                    id: "data-contract-update-user-request",
                    name: "UpdateUserRequest (C# DTO)",
                    content: "public class UpdateUserRequest\n{\n    public string FullName { get; set; } = string.Empty;\n    public string Email { get; set; } = string.Empty;\n    public string Phone { get; set; } = string.Empty;\n}"
                  }
                ],
                testCases: [
                  {
                    id: "tc-user-u-01",
                    title: "Admin can update fullName/email/phone",
                    type: "api",
                    expectedResult: "Status 200. Fields updated. Username, role, status, passwordHash unchanged. Audit log USER_UPDATED exists.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-u-02",
                    title: "PUT normalizes email to lowercase",
                    type: "api",
                    steps: [
                      "Update user email to Updated.Staff@Example.com."
                    ],
                    expectedResult: "Status 200. Saved email is updated.staff@example.com.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-u-03",
                    title: "PUT normalizes Vietnamese phone",
                    type: "api",
                    steps: [
                      "Update user phone to +84900000004."
                    ],
                    expectedResult: "Status 200. Saved phone is 0900000004.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-u-04",
                    title: "PUT duplicate email with another user returns 409",
                    type: "api",
                    steps: [
                      "User A has email staff01@example.com.",
                      "User B updates email to staff01@example.com."
                    ],
                    expectedResult: "Status 409. Error code EMAIL_ALREADY_EXISTS.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-u-05",
                    title: "PUT duplicate phone with another user returns 409",
                    type: "api",
                    steps: [
                      "User A has phone 0900000003.",
                      "User B updates phone to +84900000003."
                    ],
                    expectedResult: "Status 409. Error code PHONE_ALREADY_EXISTS.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-u-06",
                    title: "PUT same email/phone of current user is allowed",
                    type: "api",
                    steps: [
                      "User A currently has email staff01@example.com and phone 0900000003.",
                      "Update User A with same email and phone."
                    ],
                    expectedResult: "Status 200. No duplicate error is returned.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-u-07",
                    title: "PUT cannot change password/role/status",
                    type: "api",
                    steps: [
                      "Send extra fields password, role, status in PUT body."
                    ],
                    expectedResult: "Extra fields ignored or rejected. Stored password, role, status remain unchanged.",
                    status: "not_started"
                  }
                ],
                doneCriteria: [
                  { id: "dc-user-u-01", content: "Endpoint PUT /api/core/users/{id} is exposed.", checked: false },
                  { id: "dc-user-u-02", content: "PUT only updates fullName, email, phone.", checked: false },
                  { id: "dc-user-u-03", content: "PUT cannot change username.", checked: false },
                  { id: "dc-user-u-04", content: "PUT cannot change password.", checked: false },
                  { id: "dc-user-u-05", content: "PUT cannot change role.", checked: false },
                  { id: "dc-user-u-06", content: "PUT cannot change status.", checked: false },
                  { id: "dc-user-u-07", content: "PUT duplicate email with another user returns HTTP 409 EMAIL_ALREADY_EXISTS.", checked: false },
                  { id: "dc-user-u-08", content: "PUT duplicate phone with another user returns HTTP 409 PHONE_ALREADY_EXISTS.", checked: false },
                  { id: "dc-user-u-09", content: "PUT with same email/phone of current user is allowed.", checked: false },
                  { id: "dc-user-u-10", content: "Mutating operations write audit log USER_UPDATED.", checked: false }
                ]
              },
              {
                id: "leaf-user-status",
                title: "User Status Management",
                type: "leaf_feature",
                clients: ["Admin"],
                status: "ready",
                priority: "medium",
                tags: ["users", "status", "admin"],
                summary: "Allows Admin to change user status (ACTIVE, LOCKED, INACTIVE) with a required reason.",
                objective: "Implement status changing for Admin. Protect Admin from deactivating their own account or the last active Admin.",
                inScope: [
                  "Admin changes user status: ACTIVE, LOCKED, INACTIVE.",
                  "Status change requires a reason.",
                  "Self status change protection.",
                  "Last active Admin status change protection.",
                  "Audit log USER_STATUS_CHANGED is written."
                ],
                outOfScope: [
                  "Creating users.",
                  "Updating profile.",
                  "Changing role.",
                  "Hard delete.",
                  "Password reset."
                ],
                permissions: [
                  { role: "ADMIN", permission: "Can call PATCH /api/core/users/{id}/status" }
                ],
                dbExistingTables: ["users"],
                validationRules: [
                  { field: "status", rule: "Required, ACTIVE, LOCKED, INACTIVE", errorMessage: "INVALID_USER_STATUS" },
                  { field: "reason", rule: "Required, trim", errorMessage: "REASON_REQUIRED" }
                ],
                securityRules: [
                  "Validate JWT.",
                  "Require Admin role.",
                  "Prevent Admin from locking or deactivating own account.",
                  "Prevent locking or deactivating the last active Admin."
                ],
                logEvents: [
                  "USER_STATUS_CHANGED",
                  "USER_SELF_PROTECTION_BLOCKED",
                  "USER_LAST_ADMIN_PROTECTION_BLOCKED"
                ],
                integrationPoints: [
                  { system: "Auth / JWT Middleware", responsibility: "Validates authenticated Admin request" },
                  { system: "Audit Log Service", responsibility: "Writes audit logs on mutating operations" }
                ],
                uiComponents: "Change Status Confirmation Modal, required reason text input.",
                uiStateLoading: "Disable inputs, show loading spinner.",
                uiStateError: "Display general validation errors.",
                uiStateSuccess: "Show success toast, refresh list, close modal.",
                endpoints: [
                  "PATCH /api/core/users/{id}/status"
                ],
                ownerService: ".NET Core API",
                apiContracts: [
                  {
                    id: "api-contract-patch-user-status",
                    name: "PATCH /api/core/users/{id}/status",
                    content: "Description:\nAdmin changes user status. Reason is required.\n\nRequest Body:\n{\n  \"status\": \"LOCKED\",\n  \"reason\": \"Suspicious activity\"\n}\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"User status changed successfully\",\n  \"data\": {\n    \"id\": 20,\n    \"fullName\": \"Updated Staff Name\",\n    \"username\": \"staff02\",\n    \"role\": \"STAFF\",\n    \"oldStatus\": \"ACTIVE\",\n    \"newStatus\": \"LOCKED\",\n    \"reason\": \"Suspicious activity\",\n    \"updatedAt\": \"2026-07-05T17:35:00+07:00\"\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:35:00+07:00\"\n}"
                  }
                ],
                dataContracts: [
                  {
                    id: "data-contract-change-status-request",
                    name: "ChangeStatusRequest (C# DTO)",
                    content: "public class ChangeStatusRequest\n{\n    public string Status { get; set; } = string.Empty;\n    public string Reason { get; set; } = string.Empty;\n}"
                  }
                ],
                testCases: [
                  {
                    id: "tc-user-s-01",
                    title: "Admin can lock user with reason",
                    type: "api",
                    steps: [
                      "Call PATCH /api/core/users/{id}/status.",
                      "Body: { \"status\": \"LOCKED\", \"reason\": \"Policy violation\" }."
                    ],
                    expectedResult: "Status 200. User status becomes LOCKED. Audit log USER_STATUS_CHANGED exists.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-s-02",
                    title: "Missing reason in status change returns 400",
                    type: "api",
                    expectedResult: "Status 400. Error code REASON_REQUIRED.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-s-03",
                    title: "Admin cannot lock or deactivate own account",
                    type: "api",
                    expectedResult: "Status 409. Error code CANNOT_CHANGE_OWN_STATUS.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-s-04",
                    title: "Admin cannot lock or deactivate last active Admin",
                    type: "api",
                    precondition: "There is only one ACTIVE Admin in the system.",
                    steps: [
                      "Attempt to change that Admin status to LOCKED or INACTIVE."
                    ],
                    expectedResult: "Status 409. Error code CANNOT_DISABLE_LAST_ADMIN. Admin remains ACTIVE.",
                    status: "not_started"
                  }
                ],
                doneCriteria: [
                  { id: "dc-user-s-01", content: "Endpoint PATCH /api/core/users/{id}/status is exposed.", checked: false },
                  { id: "dc-user-s-02", content: "Status change requires reason.", checked: false },
                  { id: "dc-user-s-03", content: "Admin cannot lock or deactivate own account.", checked: false },
                  { id: "dc-user-s-04", content: "Admin cannot lock or deactivate the last active Admin.", checked: false },
                  { id: "dc-user-s-05", content: "Mutating operations write audit log USER_STATUS_CHANGED.", checked: false }
                ]
              },
              {
                id: "leaf-user-role",
                title: "User Role Management",
                type: "leaf_feature",
                clients: ["Admin"],
                status: "ready",
                priority: "medium",
                tags: ["users", "role", "admin"],
                summary: "Allows Admin to change internal user role (ADMIN, MANAGER, STAFF) with a required reason.",
                objective: "Implement role changing for Admin. Protect Admin from self-demotion or demoting the last active Admin. Rejects DRIVER role assignment.",
                inScope: [
                  "Admin changes internal user role: ADMIN, MANAGER, STAFF.",
                  "Role change requires a reason.",
                  "Self-demotion protection.",
                  "Last active Admin demotion protection.",
                  "Rejects DRIVER role assignment.",
                  "Audit log USER_ROLE_CHANGED is written."
                ],
                outOfScope: [
                  "Creating users.",
                  "Updating profile.",
                  "Changing status.",
                  "Driver registration.",
                  "Driver profile management.",
                  "Full RBAC/permission table management."
                ],
                permissions: [
                  { role: "ADMIN", permission: "Can call PATCH /api/core/users/{id}/role" }
                ],
                dbExistingTables: ["users"],
                validationRules: [
                  { field: "role", rule: "Required, ADMIN, MANAGER, STAFF", errorMessage: "INVALID_USER_ROLE" },
                  { field: "reason", rule: "Required, trim", errorMessage: "REASON_REQUIRED" }
                ],
                securityRules: [
                  "Validate JWT.",
                  "Require Admin role.",
                  "Prevent Admin from demoting own role.",
                  "Prevent demoting the last active Admin.",
                  "Prevent assigning DRIVER through PATCH /api/core/users/{id}/role."
                ],
                logEvents: [
                  "USER_ROLE_CHANGED",
                  "USER_SELF_PROTECTION_BLOCKED",
                  "USER_LAST_ADMIN_PROTECTION_BLOCKED"
                ],
                integrationPoints: [
                  { system: "Auth / JWT Middleware", responsibility: "Validates authenticated Admin request" },
                  { system: "Audit Log Service", responsibility: "Writes audit logs on mutating operations" }
                ],
                uiComponents: "Change Role Confirmation Modal, required reason text input.",
                uiStateLoading: "Disable inputs, show loading spinner.",
                uiStateError: "Display general validation errors.",
                uiStateSuccess: "Show success toast, refresh list, close modal.",
                endpoints: [
                  "PATCH /api/core/users/{id}/role"
                ],
                ownerService: ".NET Core API",
                apiContracts: [
                  {
                    id: "api-contract-patch-user-role",
                    name: "PATCH /api/core/users/{id}/role",
                    content: "Description:\nAdmin changes internal user role. Reason is required. DRIVER role is rejected.\n\nRequest Body:\n{\n  \"role\": \"MANAGER\",\n  \"reason\": \"Promoted to manager\"\n}\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"User role changed successfully\",\n  \"data\": {\n    \"id\": 20,\n    \"fullName\": \"Updated Staff Name\",\n    \"username\": \"staff02\",\n    \"oldRole\": \"STAFF\",\n    \"newRole\": \"MANAGER\",\n    \"reason\": \"Promoted to manager\",\n    \"updatedAt\": \"2026-07-05T17:40:00+07:00\"\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:40:00+07:00\"\n}"
                  }
                ],
                dataContracts: [
                  {
                    id: "data-contract-change-role-request",
                    name: "ChangeRoleRequest (C# DTO)",
                    content: "public class ChangeRoleRequest\n{\n    public string Role { get; set; } = string.Empty;\n    public string Reason { get; set; } = string.Empty;\n}"
                  }
                ],
                testCases: [
                  {
                    id: "tc-user-r-01",
                    title: "Admin can change role with reason",
                    type: "api",
                    steps: [
                      "Call PATCH /api/core/users/{id}/role.",
                      "Body: { \"role\": \"MANAGER\", \"reason\": \"Promotion\" }."
                    ],
                    expectedResult: "Status 200. User role becomes MANAGER. Audit log USER_ROLE_CHANGED exists.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-r-02",
                    title: "Missing reason in role change returns 400",
                    type: "api",
                    expectedResult: "Status 400. Error code REASON_REQUIRED.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-r-03",
                    title: "Change role to DRIVER is rejected",
                    type: "api",
                    steps: [
                      "Call PATCH /api/core/users/{id}/role with role DRIVER."
                    ],
                    expectedResult: "Status 400. Error code INVALID_USER_ROLE.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-r-04",
                    title: "Admin cannot demote own role",
                    type: "api",
                    expectedResult: "Status 409. Error code CANNOT_CHANGE_OWN_ROLE.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-r-05",
                    title: "Admin cannot demote last active Admin",
                    type: "api",
                    precondition: "There is only one ACTIVE Admin in the system.",
                    steps: [
                      "Attempt to change that Admin role to MANAGER or STAFF."
                    ],
                    expectedResult: "Status 409. Error code CANNOT_DEMOTE_LAST_ADMIN. Admin role remains ADMIN.",
                    status: "not_started"
                  }
                ],
                doneCriteria: [
                  { id: "dc-user-r-01", content: "Endpoint PATCH /api/core/users/{id}/role is exposed.", checked: false },
                  { id: "dc-user-r-02", content: "PATCH /api/core/users/{id}/role rejects DRIVER role.", checked: false },
                  { id: "dc-user-r-03", content: "Role change requires reason.", checked: false },
                  { id: "dc-user-r-04", content: "Admin cannot demote own role.", checked: false },
                  { id: "dc-user-r-05", content: "Admin cannot demote the last active Admin.", checked: false },
                  { id: "dc-user-r-06", content: "Mutating operations write audit log USER_ROLE_CHANGED.", checked: false }
                ]
              }
            ]
          },
          {
            id: "leaf-driver-vehicles-list",
            title: "Driver Registered Vehicles",
            type: "leaf_feature",
            clients: ["Admin", "Manager", "Staff", "Driver"],
            status: "ready",
            priority: "medium",
            tags: ["driver", "vehicles"],
            summary: "Allows Drivers to register and manage their vehicles, and Staff/Managers/Admins to approve and review them.",
            objective: "Implement a complete Driver Registered Vehicles management feature that allows Drivers to register, update, and remove their own vehicles while enabling Staff and Managers to review and approve registered vehicles. The feature provides a verified vehicle dataset used as the reference source for Automatic Number Plate Recognition (ANPR) and monthly parking pass registration.",
            inScope: [
              "CRUD operations for vehicle information linked to a specific Driver.",
              "Drivers can register, view, update, and delete their own vehicles.",
              "Staff and Managers can search, review, update vehicle information, and modify approval status.",
              "Validate duplicate license plates before saving.",
              "Role-based access control.",
              "Common API response format."
            ],
            outOfScope: [
              "Real-time ANPR camera recognition.",
              "Guest vehicle management.",
              "Parking session processing.",
              "Monthly pass management."
            ],
            permissions: [
              { role: "Driver", permission: "Manage own registered vehicles only" },
              { role: "Staff", permission: "View all vehicles, modify information, approve/reject vehicles" },
              { role: "Manager", permission: "Full management of all registered vehicles" },
              { role: "Admin", permission: "Full management of all registered vehicles" }
            ],
            dbExistingTables: ["users", "vehicles"],
            dbRelationships: [
              "One Driver can register multiple vehicles.",
              "Each vehicle belongs to exactly one Driver.",
              "License Plate must be unique."
            ],
            validationRules: [
              { field: "licensePlate", rule: "Required, unique across the system", errorMessage: "VALIDATION_FAILED" },
              { field: "vehicleType", rule: "Required (CAR or MOTORBIKE)", errorMessage: "VALIDATION_FAILED" },
              { field: "brand", rule: "Required", errorMessage: "VALIDATION_FAILED" },
              { field: "color", rule: "Required", errorMessage: "VALIDATION_FAILED" }
            ],
            securityRules: [
              "Validate JWT.",
              "Validate role permissions.",
              "Driver can only access their own vehicles.",
              "Staff, Manager, and Admin can manage all vehicles.",
              "Prevent duplicate license plates.",
              "Use global exception handling.",
              "Prevent stack trace leakage."
            ],
            logEvents: [
              "Vehicle registration (VEHICLE_REGISTERED)",
              "Vehicle update (VEHICLE_UPDATED)",
              "Vehicle deletion (VEHICLE_DELETED)",
              "Vehicle approval status change (VEHICLE_APPROVAL_STATUS_CHANGED)"
            ],
            noLogEvents: [
              "Passwords",
              "Access tokens",
              "Refresh tokens"
            ],
            integrationPoints: [
              { system: "Automatic Number Plate Recognition (ANPR)", responsibility: "Reference dataset for vehicle recognition" },
              { system: "Monthly Parking Pass Registration", responsibility: "Reference dataset for monthly pass registration" }
            ],
            uiPage: "/driver/vehicles",
            uiComponents: "Vehicle Table, Add Vehicle Form, Edit Vehicle Dialog, Delete Confirmation, Approval Status Badge, Pagination",
            uiStateLoading: "Show loading indicator while fetching vehicles.",
            uiStateEmpty: "No registered vehicles.",
            uiStateError: "Display general error notification.",
            uiStateSuccess: "Display updated vehicle list.",
            endpoints: [
              "GET /api/core/driver/vehicles",
              "GET /api/core/driver/vehicles/{id}",
              "POST /api/core/driver/vehicles",
              "PUT /api/core/driver/vehicles/{id}",
              "DELETE /api/core/driver/vehicles/{id}",
              "PATCH /api/core/driver/vehicles/{id}/approval-status"
            ],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-get-vehicles",
                name: "GET /api/core/driver/vehicles",
                content: "Description:\nRetrieve registered vehicles.\nDriver returns only their own vehicles. Staff/Manager/Admin returns all with keyword, type, and status filters.\n\nQuery Parameters:\n- keyword: string (optional)\n- vehicleType: string (optional)\n- approvalStatus: string (optional)\n- page: int (default 1)\n- pageSize: int (default 20, max 100)\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"Get registered vehicles successfully\",\n  \"data\": {\n    \"items\": [\n      {\n        \"id\": 1,\n        \"driverId\": 12,\n        \"licensePlate\": \"51A12345\",\n        \"vehicleType\": \"CAR\",\n        \"brand\": \"Toyota\",\n        \"color\": \"White\",\n        \"approvalStatus\": \"APPROVED\",\n        \"createdAt\": \"2026-07-05T17:20:00+07:00\"\n      }\n    ],\n    \"page\": 1,\n    \"pageSize\": 20,\n    \"totalItems\": 1,\n    \"totalPages\": 1\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
              },
              {
                id: "contract-get-vehicle-detail",
                name: "GET /api/core/driver/vehicles/{id}",
                content: "Description:\nRetrieve vehicle detail. Driver can only retrieve their own vehicle.\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"Get vehicle successfully\",\n  \"data\": {\n    \"id\": 1,\n    \"driverId\": 12,\n    \"licensePlate\": \"51A12345\",\n    \"vehicleType\": \"CAR\",\n    \"brand\": \"Toyota\",\n    \"color\": \"White\",\n    \"approvalStatus\": \"APPROVED\",\n    \"createdAt\": \"2026-07-05T17:20:00+07:00\",\n    \"updatedAt\": \"2026-07-05T17:20:00+07:00\"\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
              },
              {
                id: "contract-post-vehicle",
                name: "POST /api/core/driver/vehicles",
                content: "Description:\nRegister a new vehicle. Driver role only. Sets approval status to PENDING.\n\nRequest Body:\n{\n  \"licensePlate\": \"51A-12345\",\n  \"vehicleType\": \"CAR\",\n  \"brand\": \"Toyota\",\n  \"color\": \"White\",\n  \"description\": \"My personal car\"\n}\n\nResponse 201 Created:\n{\n  \"success\": true,\n  \"message\": \"Vehicle registered successfully\",\n  \"data\": {\n    \"id\": 1,\n    \"driverId\": 12,\n    \"licensePlate\": \"51A-12345\",\n    \"vehicleType\": \"CAR\",\n    \"brand\": \"Toyota\",\n    \"color\": \"White\",\n    \"approvalStatus\": \"PENDING\",\n    \"createdAt\": \"2026-07-05T17:20:00+07:00\",\n    \"updatedAt\": \"2026-07-05T17:20:00+07:00\"\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
              },
              {
                id: "contract-put-vehicle",
                name: "PUT /api/core/driver/vehicles/{id}",
                content: "Description:\nUpdate registered vehicle. Driver can update own vehicle. Staff/Manager/Admin can update any vehicle.\n\nRequest Body:\n{\n  \"licensePlate\": \"51A-12345\",\n  \"vehicleType\": \"CAR\",\n  \"brand\": \"Toyota\",\n  \"color\": \"White\",\n  \"description\": \"My updated car\"\n}\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"Vehicle updated successfully\",\n  \"data\": {\n    \"id\": 1,\n    \"driverId\": 12,\n    \"licensePlate\": \"51A-12345\",\n    \"vehicleType\": \"CAR\",\n    \"brand\": \"Toyota\",\n    \"color\": \"White\",\n    \"approvalStatus\": \"APPROVED\",\n    \"createdAt\": \"2026-07-05T17:20:00+07:00\",\n    \"updatedAt\": \"2026-07-05T17:25:00+07:00\"\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:25:00+07:00\"\n}"
              },
              {
                id: "contract-delete-vehicle",
                name: "DELETE /api/core/driver/vehicles/{id}",
                content: "Description:\nSoft-delete registered vehicle. Driver can delete own. Staff/Manager/Admin can delete any.\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"Vehicle deleted successfully\",\n  \"data\": \"Vehicle deleted successfully\",\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:30:00+07:00\"\n}"
              },
              {
                id: "contract-patch-approval-status",
                name: "PATCH /api/core/driver/vehicles/{id}/approval-status",
                content: "Description:\nApprove or reject registered vehicle. Roles: Staff, Manager, Admin.\n\nRequest Body:\n{\n  \"approvalStatus\": \"APPROVED\"\n}\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"Vehicle approval status updated successfully\",\n  \"data\": {\n    \"id\": 1,\n    \"driverId\": 12,\n    \"licensePlate\": \"51A-12345\",\n    \"brand\": \"Toyota\",\n    \"color\": \"White\",\n    \"approvalStatus\": \"APPROVED\",\n    \"createdAt\": \"2026-07-05T17:20:00+07:00\",\n    \"updatedAt\": \"2026-07-05T17:35:00+07:00\"\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:35:00+07:00\"\n}"
              }
            ],
            testCases: [
              {
                id: "tc-veh-01",
                title: "Driver can register a vehicle",
                type: "api",
                expectedResult: "Vehicle created successfully with PENDING status.",
                status: "not_started"
              },
              {
                id: "tc-veh-02",
                title: "Duplicate license plate is rejected",
                type: "api",
                expectedResult: "Validation error returned with status code 400.",
                status: "not_started"
              },
              {
                id: "tc-veh-03",
                title: "Driver can retrieve own vehicles",
                type: "api",
                expectedResult: "Only own vehicles are returned in list query.",
                status: "not_started"
              },
              {
                id: "tc-veh-04",
                title: "Driver cannot access another Driver's vehicle",
                type: "api",
                expectedResult: "Status 403 Forbidden is returned.",
                status: "not_started"
              },
              {
                id: "tc-veh-05",
                title: "Staff can approve vehicle",
                type: "api",
                expectedResult: "Approval status updated to APPROVED, audit log written.",
                status: "not_started"
              },
              {
                id: "tc-veh-06",
                title: "Manager can view all vehicles",
                type: "api",
                expectedResult: "All vehicles from all drivers returned with status 200.",
                status: "not_started"
              },
              {
                id: "tc-veh-07",
                title: "Anonymous user cannot access",
                type: "api",
                expectedResult: "Status 401 Unauthorized is returned.",
                status: "not_started"
              },
              {
                id: "tc-veh-08",
                title: "Vehicle responses use common API response format",
                type: "api",
                expectedResult: "All responses contain success, message, data, errors, and timestamp fields.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-veh-01", content: "CRUD APIs for Driver Registered Vehicles are implemented.", checked: false },
              { id: "dc-veh-02", content: "Drivers can only manage their own vehicles.", checked: false },
              { id: "dc-veh-03", content: "Staff, Manager, and Admin can manage all vehicles.", checked: false },
              { id: "dc-veh-04", content: "Duplicate license plates are prevented.", checked: false },
              { id: "dc-veh-05", content: "Vehicle approval workflow is implemented.", checked: false },
              { id: "dc-veh-06", content: "JWT authentication is required.", checked: false },
              { id: "dc-veh-07", content: "Role-based authorization is enforced.", checked: false },
              { id: "dc-veh-08", content: "Common API response format is used.", checked: false },
              { id: "dc-veh-09", content: "Vehicle data is available for ANPR and Monthly Pass modules.", checked: false }
            ]
          },
          {
            id: "leaf-driver-vehicle-history",
            title: "Driver Vehicle Entry Exit History",
            type: "leaf_feature",
            clients: ["Admin", "Manager", "Staff", "Driver", "System"],
            status: "ready",
            priority: "medium",
            tags: ["driver", "vehicles", "history", "entry", "exit"],
            summary: "Allows Drivers to view their own vehicle entry/exit history, and Staff/Managers/Admins to search and audit all vehicle history.",
            objective: "Implement a read-only Driver Vehicle Entry Exit History feature that provides a complete, transparent, and immutable history of vehicle entry and exit transactions. The feature enables Drivers to review their own parking history while allowing Staff and Managers to perform operational auditing, parking duration verification, and parking fee dispute resolution. The system also serves as the reporting layer for vehicle entry and exit events automatically recorded by the parking system.",
            inScope: [
              "Read-only APIs for vehicle entry and exit history.",
              "Drivers can view only their own vehicle history.",
              "Staff, Managers, and Admins can search all vehicle history records.",
              "Filter by time range.",
              "Filter by license plate.",
              "Filter by current parking status (IN_BUILDING / DEPARTED).",
              "Display entry time, exit time, parking duration, parking fee, and captured license plate image URLs if available.",
              "Automatically display records generated by the parking system.",
              "Common API response format."
            ],
            outOfScope: [
              "Logging administrative configuration changes.",
              "Sending commands to physical gate hardware.",
              "Editing or deleting parking history.",
              "Real-time gate control."
            ],
            permissions: [
              { role: "Driver", permission: "View own vehicle entry/exit history" },
              { role: "Staff", permission: "View and search all vehicle history" },
              { role: "Manager", permission: "View and search all vehicle history" },
              { role: "Admin", permission: "View and search all vehicle history" },
              { role: "System", permission: "Automatically creates entry/exit history records" }
            ],
            dbExistingTables: ["parking_sessions", "vehicles", "users", "parking_gates"],
            dbRelationships: [
              "One Driver can have multiple parking history records.",
              "Each history record belongs to exactly one vehicle.",
              "Each history record references one parking session.",
              "History records are read-only after creation."
            ],
            validationRules: [
              { field: "driverId", rule: "Driver can only access their own parking history", errorMessage: "FORBIDDEN" },
              { field: "dateRange", rule: "fromDate must not be later than toDate", errorMessage: "VALIDATION_FAILED" },
              { field: "status", rule: "Must be IN_BUILDING or DEPARTED if provided", errorMessage: "VALIDATION_FAILED" }
            ],
            securityRules: [
              "Validate JWT.",
              "Validate role permissions.",
              "Driver can only view their own records.",
              "Staff, Manager, and Admin can view all records.",
              "History records cannot be modified through this feature.",
              "Prevent stack trace leakage."
            ],
            logEvents: [
              "History search requests (GET /api/support/driver/vehicles/entry-exit-history)",
              "History detail requests (GET /api/support/driver/vehicles/entry-exit-history/{id})"
            ],
            noLogEvents: [
              "Passwords",
              "Access tokens",
              "Refresh tokens"
            ],
            integrationPoints: [
              { system: "Parking Session Module", responsibility: "Creates history records automatically" },
              { system: "ANPR Module", responsibility: "Feeds license plate recognition data" },
              { system: "Gate Sensor Events", responsibility: "Triggers record generation on entry/exit" }
            ],
            uiPage: "/driver/history",
            uiComponents: "History Table, License Plate Search, Status Filter, Date Range Picker, Pagination, Vehicle Snapshot Viewer",
            uiStateLoading: "Show loading indicator while fetching history.",
            uiStateEmpty: "No parking history found.",
            uiStateError: "Display general error notification.",
            uiStateSuccess: "Display paginated parking history.",
            endpoints: [
              "GET /api/support/driver/vehicles/entry-exit-history",
              "GET /api/support/driver/vehicles/entry-exit-history/{id}"
            ],
            ownerService: "Spring Boot Support API",
            apiContracts: [
              {
                id: "contract-get-history",
                name: "GET /api/support/driver/vehicles/entry-exit-history",
                content: "Description:\nRetrieve vehicle entry and exit history.\n\nQuery Parameters:\n- keyword: string (optional, license plate)\n- status: string (optional, IN_BUILDING / DEPARTED)\n- fromDate: datetime (optional)\n- toDate: datetime (optional)\n- page: int (default 1)\n- pageSize: int (default 20, max 100)\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"Get vehicle entry exit history successfully\",\n  \"data\": {\n    \"items\": [\n      {\n        \"id\": 101,\n        \"driverId\": 12,\n        \"licensePlate\": \"51A12345\",\n        \"vehicleType\": \"CAR\",\n        \"entryTime\": \"2026-07-05T08:10:00+07:00\",\n        \"exitTime\": \"2026-07-05T17:35:00+07:00\",\n        \"parkingDuration\": \"09:25:00\",\n        \"parkingFee\": 50000,\n        \"status\": \"DEPARTED\",\n        \"entryImageUrl\": \"https://example.com/images/entry.jpg\",\n        \"exitImageUrl\": \"https://example.com/images/exit.jpg\"\n      }\n    ],\n    \"page\": 1,\n    \"pageSize\": 20,\n    \"totalItems\": 1,\n    \"totalPages\": 1\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
              },
              {
                id: "contract-get-history-detail",
                name: "GET /api/support/driver/vehicles/entry-exit-history/{id}",
                content: "Description:\nRetrieve detailed vehicle entry and exit history.\nDriver can only retrieve records belonging to their own account.\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"Get vehicle entry exit history successfully\",\n  \"data\": {\n    \"id\": 101,\n    \"driverId\": 12,\n    \"licensePlate\": \"51A12345\",\n    \"vehicleType\": \"CAR\",\n    \"entryTime\": \"2026-07-05T08:10:00+07:00\",\n    \"exitTime\": \"2026-07-05T17:35:00+07:00\",\n    \"parkingDuration\": \"09:25:00\",\n    \"parkingFee\": 50000,\n    \"status\": \"DEPARTED\",\n    \"entryImageUrl\": \"https://example.com/images/entry.jpg\",\n    \"exitImageUrl\": \"https://example.com/images/exit.jpg\"\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
              }
            ],
            testCases: [
              {
                id: "tc-hist-01",
                title: "Driver can view own parking history",
                type: "api",
                expectedResult: "Only driver's own history is returned.",
                status: "not_started"
              },
              {
                id: "tc-hist-02",
                title: "Driver cannot view another driver's history",
                type: "api",
                expectedResult: "Status 403 Forbidden is returned.",
                status: "not_started"
              },
              {
                id: "tc-hist-03",
                title: "Staff can search history by license plate",
                type: "api",
                expectedResult: "Matching vehicle history records returned.",
                status: "not_started"
              },
              {
                id: "tc-hist-04",
                title: "Manager can filter by date range",
                type: "api",
                expectedResult: "Only records within the date range are returned.",
                status: "not_started"
              },
              {
                id: "tc-hist-05",
                title: "Manager can filter by parking status",
                type: "api",
                expectedResult: "Only vehicles with the specified parking status (e.g., IN_BUILDING) are returned.",
                status: "not_started"
              },
              {
                id: "tc-hist-06",
                title: "History detail contains parking duration and fee",
                type: "api",
                expectedResult: "Entry time, exit time, duration, fee, and image URLs are returned in detail.",
                status: "not_started"
              },
              {
                id: "tc-hist-07",
                title: "Anonymous user cannot access history",
                type: "api",
                expectedResult: "Status 401 Unauthorized is returned.",
                status: "not_started"
              },
              {
                id: "tc-hist-08",
                title: "History responses use common API response format",
                type: "api",
                expectedResult: "All responses contain success, message, data, errors, and timestamp.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-hist-01", content: "Read-only history APIs are implemented.", checked: false },
              { id: "dc-hist-02", content: "Drivers can only access their own history.", checked: false },
              { id: "dc-hist-03", content: "Staff, Manager, and Admin can search all history.", checked: false },
              { id: "dc-hist-04", content: "History supports filtering by date range.", checked: false },
              { id: "dc-hist-05", content: "History supports filtering by license plate.", checked: false },
              { id: "dc-hist-06", content: "History supports filtering by parking status.", checked: false },
              { id: "dc-hist-07", content: "Entry time, exit time, duration, parking fee, and image URLs are returned.", checked: false },
              { id: "dc-hist-08", content: "History records are immutable.", checked: false },
              { id: "dc-hist-09", content: "JWT authentication is required.", checked: false },
              { id: "dc-hist-10", content: "Role-based authorization is enforced.", checked: false },
              { id: "dc-hist-11", content: "Common API response format is used.", checked: false }
            ]
          },
          {
            id: "leaf-driver-mp-application",
            title: "Driver Monthly Pass Application",
            type: "leaf_feature",
            status: "ready",
            priority: "medium",
            clients: ["Admin", "Manager", "Staff", "Driver"],
            endpoints: [
              "POST /api/core/monthly-passes/applications",
              "GET /api/core/monthly-passes/applications",
              "GET /api/core/monthly-passes/applications/{id}",
              "PUT /api/core/monthly-passes/applications/{id}",
              "PATCH /api/core/monthly-passes/applications/{id}/status",
              "PATCH /api/core/monthly-passes/applications/{id}/payment",
              "PATCH /api/core/monthly-passes/applications/{id}/assign-rfid"
            ],
            ownerService: ".NET Core API",
            summary: "Allows Drivers to submit monthly parking pass applications using one of their approved vehicles. Managers review applications, and upon approval, Drivers or Staff can process payment. Finally, Staff assigns a physical RFID card to activate the monthly pass.",
            objective: "Implement a complete monthly parking pass application workflow that digitalizes the submission, approval, payment, and issuance process for Drivers.",
            inScope: [
              "Submit monthly parking pass applications using approved vehicles",
              "Review and update application status (PENDING -> APPROVED_AWAITING_PAYMENT / REJECTED)",
              "Record cash or bank transfer payment details",
              "Assign physical RFID card and activate monthly pass",
              "Verify slot availability and pricing rules before approval"
            ],
            outOfScope: [
              "Payment gateway integration (PayOS/Stripe)",
              "Automated RFID hardware scanner reader communication"
            ],
            businessRules: [
              "Only approved vehicles belonging to the driver can be registered for a monthly pass.",
              "A vehicle can have at most one active monthly pass or application at any time.",
              "Pricing must be retrieved dynamically from pricing rules based on the vehicle type.",
              "The starting date of the monthly pass must be in the future (within 30 days).",
              "Upon RFID card assignment, the card status is kept AVAILABLE so it can scan at gates."
            ],
            apiContracts: createApiContract("POST /api/core/monthly-passes/applications"),
            testCases: defaultApiTests("Driver Monthly Pass Application", ["Admin", "Manager", "Staff", "Driver"], ["POST /api/core/monthly-passes/applications"]),
            doneCriteria: defaultDoneCriteria("Driver Monthly Pass Application")
          }
        ]
      },
      // 4b. Vehicle Configuration
      {
        id: "cat-vehicle-config",
        title: "Vehicle Configuration",
        type: "category",
        summary: "Configuration and master data of vehicle properties.",
        children: [
          {
            id: "leaf-vehicle-type",
            title: "Vehicle Type Management",
            type: "leaf_feature",
            clients: ["Admin", "Manager"],
            status: "ready",
            priority: "medium",
            tags: ["vehicle", "configuration"],
            summary: "Provide a comprehensive management tool for all types of vehicles (cars, motorbikes, electric vehicles, etc.) permitted to enter and exit the parking building. Ensure accurate vehicle categorization to support fare configuration, gate traffic control, and optimal parking slot allocation.\n\nThis feature allows administrative roles to perform CRUD (Create, Read, Update, Delete) operations on vehicle types. Each vehicle type includes attributes such as vehicle type name, description, and operational status. The system utilizes this master directory for validation when drivers register their vehicles or when vehicles pass through the gate recognition system.",
            objective: "Implement CRUD APIs and management dashboard for vehicle types in .NET Core API and React frontend, enforcing uniqueness, status management, role-based access control, and audit logging.",
            inScope: [
              "Design the management dashboard interface and create/edit forms for vehicle types accessible by Admin and Manager",
              "Build RESTful APIs using .NET Core to handle CRUD operations",
              "Implement input validation (e.g., vehicle type name must be unique and cannot be empty)",
              "Store and update the operational status of vehicle types in the shared PostgreSQL database",
              "Log mutating histories (Audit log) into a dedicated audit schema whenever a vehicle type is modified or deleted"
            ],
            outOfScope: [
              "Detailed fare/pricing configuration for each vehicle type (handled under the Vehicle Configuration / Pricing Management module)",
              "AI-based license plate and vehicle type recognition at the gates (handled under the Gate Read Model module)",
              "Handling refunds or monthly pass cancellations when a specific vehicle type is deactivated or deleted"
            ],
            permissions: [
              { role: "Admin", permission: "Full access to Create, Read, Update, and Delete vehicle types." },
              { role: "Manager", permission: "Can View, Create, and Update vehicle types. Cannot delete vehicle types." },
              { role: "Staff", permission: "No access." },
              { role: "Driver", permission: "No access." },
              { role: "Anonymous", permission: "No access." }
            ],
            businessRules: [
              "Vehicle type names must be unique across the system.",
              "Vehicle types are referenced as master data by vehicle registration, parking sessions, and gate validation processes.",
              "Deleting a vehicle type should be restricted if it is currently referenced by other business entities."
            ],
            dbExistingTables: ["vehicle_types"],
            dbNewTablesSql: "",
            dbRelationships: [
              "Vehicle types are referenced by registered vehicles.",
              "Vehicle types are referenced during gate validation.",
              "Vehicle types are used by parking pricing configuration.",
              "Vehicle type status determines whether new vehicle registrations are allowed."
            ],
            validationRules: [
              { field: "name", rule: "Required, non-empty, unique across the system", errorMessage: "VALIDATION_FAILED" },
              { field: "status", rule: "Must be a valid system status", errorMessage: "VALIDATION_FAILED" }
            ],
            securityRules: [
              "Validate JWT.",
              "Require Admin or Manager role.",
              "Only Admin can delete vehicle types.",
              "Prevent unauthorized access.",
              "Use global exception handling.",
              "Prevent stack trace leakage."
            ],
            logEvents: [
              "Vehicle type created.",
              "Vehicle type updated.",
              "Vehicle type activated/deactivated.",
              "Vehicle type deleted.",
              "Log request access, inputs, duration, and response code."
            ],
            noLogEvents: [
              "Passwords.",
              "Access tokens.",
              "Refresh tokens.",
              "Credit card details."
            ],
            integrationPoints: [
              { system: "Shared PostgreSQL database", responsibility: "Store vehicle types and track status." },
              { system: "Vehicle Registration module", responsibility: "Reference vehicle types for new registrations." },
              { system: "Gate Recognition / Validation module", responsibility: "Use vehicle types to validate vehicle entry/exit." },
              { system: "Pricing Management module", responsibility: "Configure pricing rules per vehicle type." },
              { system: "Audit Logging module", responsibility: "Record administrative mutating operations." }
            ],
            uiPage: "/admin/vehicle-types",
            uiComponents: "Vehicle Type Table, Search Input, Status Filter, Create/Edit Dialog, Pagination.",
            uiStateLoading: "Display loading indicator while retrieving data.",
            uiStateEmpty: "Show 'No vehicle types found.'",
            uiStateError: "Display validation or authorization error messages.",
            uiStateSuccess: "Refresh list after successful CRUD operations.",
            endpoints: [
              "GET /api/core/vehicle-types",
              "GET /api/core/vehicle-types/{id}",
              "POST /api/core/vehicle-types",
              "PUT /api/core/vehicle-types/{id}",
              "PATCH /api/core/vehicle-types/{id}/active",
              "DELETE /api/core/vehicle-types/{id}"
            ],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-get-vehicle-types",
                name: "GET /api/core/vehicle-types",
                content: "Method: GET\nPath: /api/core/vehicle-types\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER\nQuery Parameters:\n  - keyword: string (optional)\n  - status: string (optional)\n  - page: int (default 1)\n  - pageSize: int (default 20, max 100)\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"Get vehicle types successfully\",\n  \"data\": {\n    \"items\": [\n      {\n        \"id\": 1,\n        \"name\": \"Car\",\n        \"description\": \"Four-wheel passenger vehicle\",\n        \"status\": \"ACTIVE\"\n      },\n      {\n        \"id\": 2,\n        \"name\": \"Motorbike\",\n        \"description\": \"Two-wheel vehicle\",\n        \"status\": \"ACTIVE\"\n      }\n    ],\n    \"page\": 1,\n    \"pageSize\": 20,\n    \"totalItems\": 2,\n    \"totalPages\": 1\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
              },
              {
                id: "contract-get-vehicle-types-id",
                name: "GET /api/core/vehicle-types/{id}",
                content: "Method: GET\nPath: /api/core/vehicle-types/{id}\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER"
              },
              {
                id: "contract-post-vehicle-types",
                name: "POST /api/core/vehicle-types",
                content: "Method: POST\nPath: /api/core/vehicle-types\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER\nValidation:\n  - Name is required.\n  - Name must be unique."
              },
              {
                id: "contract-put-vehicle-types-id",
                name: "PUT /api/core/vehicle-types/{id}",
                content: "Method: PUT\nPath: /api/core/vehicle-types/{id}\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER"
              },
              {
                id: "contract-patch-vehicle-types-id-active",
                name: "PATCH /api/core/vehicle-types/{id}/active",
                content: "Method: PATCH\nPath: /api/core/vehicle-types/{id}/active\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER"
              },
              {
                id: "contract-delete-vehicle-types-id",
                name: "DELETE /api/core/vehicle-types/{id}",
                content: "Method: DELETE\nPath: /api/core/vehicle-types/{id}\nAuth:\n  JWT required\nRole:\n  ADMIN only\nBusiness Rules:\n  - Cannot delete vehicle type currently referenced by other entities.\n  - Audit log must be recorded."
              }
            ],
            testCases: [
              {
                id: "tc-vehicle-type-create-admin",
                title: "Admin can create vehicle type",
                type: "api",
                expectedResult: "Vehicle type created successfully.",
                status: "not_started"
              },
              {
                id: "tc-vehicle-type-create-manager",
                title: "Manager can create vehicle type",
                type: "api",
                expectedResult: "Vehicle type created successfully.",
                status: "not_started"
              },
              {
                id: "tc-vehicle-type-name-unique",
                title: "Vehicle type name must be unique",
                type: "api",
                expectedResult: "Duplicate name returns validation error.",
                status: "not_started"
              },
              {
                id: "tc-vehicle-type-name-empty",
                title: "Vehicle type name cannot be empty",
                type: "api",
                expectedResult: "Validation error returned.",
                status: "not_started"
              },
              {
                id: "tc-vehicle-type-update-manager",
                title: "Manager can update vehicle type",
                type: "api",
                expectedResult: "Vehicle type updated successfully.",
                status: "not_started"
              },
              {
                id: "tc-vehicle-type-delete-manager",
                title: "Manager cannot delete vehicle type",
                type: "api",
                expectedResult: "Status 403 Forbidden.",
                status: "not_started"
              },
              {
                id: "tc-vehicle-type-delete-admin-unused",
                title: "Admin can delete unused vehicle type",
                type: "api",
                expectedResult: "Vehicle type deleted successfully.",
                status: "not_started"
              },
              {
                id: "tc-vehicle-type-delete-admin-referenced",
                title: "Admin cannot delete referenced vehicle type",
                type: "api",
                expectedResult: "Business validation error returned.",
                status: "not_started"
              },
              {
                id: "tc-vehicle-type-anonymous",
                title: "Anonymous cannot access Vehicle Type Management",
                type: "api",
                expectedResult: "Status 401 Unauthorized.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-vehicle-type-crud", content: "CRUD APIs for vehicle types are implemented.", checked: false },
              { id: "dc-vehicle-type-unique", content: "Vehicle type name is unique.", checked: false },
              { id: "dc-vehicle-type-nonempty", content: "Vehicle type name cannot be empty.", checked: false },
              { id: "dc-vehicle-type-status", content: "Vehicle type operational status is maintained.", checked: false },
              { id: "dc-vehicle-type-admin-crud", content: "Admin has full CRUD permissions.", checked: false },
              { id: "dc-vehicle-type-manager-permissions", content: "Manager has Create, Read, and Update permissions only.", checked: false },
              { id: "dc-vehicle-type-delete-audit", content: "Delete operation records audit logs.", checked: false },
              { id: "dc-vehicle-type-delete-referenced", content: "Delete operation prevents removal of referenced vehicle types.", checked: false },
              { id: "dc-vehicle-type-jwt", content: "All APIs require JWT authentication.", checked: false },
              { id: "dc-vehicle-type-common-response", content: "Response uses common API response format.", checked: false }
            ]
          }
        ]
      },

      // 5. Parking Structure Management
      {
        id: "cat-structure",
        title: "Parking Structure Management",
        type: "category",
        summary: "Floors, Areas, and individual slot layout configurations.",
        children: [
          {
            id: "leaf-struct-floor",
            title: "Floor Management",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            status: "ready",
            priority: "medium",
            tags: ["floor", "structure"],
            summary: "Manage the physical levels/floors within the parking structure, establishing the foundational layout for spatial organization and capacity tracking.\n\nThis feature allows Managers and Admins to configure floor details (e.g., Floor Name/Number, Max Capacity, Vehicle Type Restrictions). It serves as the top-level container in the parking inventory hierarchy.",
            objective: "Implement CRUD APIs and UI for managing levels/floors in a parking building in the .NET Core API, enforcing uniqueness constraints and status tracking, with audit logs.",
            inScope: [
              "Design CRUD UI and forms for floor configurations",
              "Build RESTful APIs in .NET Core to persist floor metadata",
              "Validate that floor numbers and floor names are unique within the building",
              "Configure floor information including Floor Name/Number, Maximum Capacity, and Vehicle Type Restrictions",
              "Record audit logs for every floor configuration mutation into the dedicated audit schema"
            ],
            outOfScope: [
              "Direct drawing or visual mapping of floor layouts (handled by CAD/GIS integration if needed later)"
            ],
            permissions: [
              { role: "Admin", permission: "Full access to Create, Read, Update, and Delete floor configurations." },
              { role: "Manager", permission: "Full access to Create, Read, Update, and Delete floor configurations." },
              { role: "Staff", permission: "No access." },
              { role: "Driver", permission: "No access." },
              { role: "Anonymous", permission: "No access." }
            ],
            businessRules: [
              "Floor names and floor numbers must be unique within the parking building.",
              "Each floor represents the highest level of the parking structure hierarchy.",
              "Floor capacity is used for operational monitoring and future parking allocation logic.",
              "Vehicle type restrictions determine which vehicle categories are permitted on each floor."
            ],
            dbExistingTables: ["floors"],
            dbNewTablesSql: "",
            dbRelationships: [
              "One floor contains multiple parking zones.",
              "Floor metadata is referenced by parking slots.",
              "Floor capacity contributes to overall parking capacity reporting.",
              "Vehicle type restrictions are validated during parking slot assignment."
            ],
            validationRules: [
              { field: "floorName", rule: "Required, unique within the building", errorMessage: "VALIDATION_FAILED" },
              { field: "floorNumber", rule: "Required, unique within the building", errorMessage: "VALIDATION_FAILED" },
              { field: "maxCapacity", rule: "Must be greater than zero", errorMessage: "VALIDATION_FAILED" },
              { field: "vehicleTypeRestrictions", rule: "Must reference existing vehicle types", errorMessage: "VALIDATION_FAILED" }
            ],
            securityRules: [
              "Validate JWT.",
              "Require Admin or Manager role.",
              "Prevent unauthorized access.",
              "Use global exception handling.",
              "Prevent stack trace leakage."
            ],
            logEvents: [
              "Floor created.",
              "Floor updated.",
              "Floor deleted.",
              "Floor capacity modified.",
              "Vehicle type restriction modified.",
              "Log request access, inputs, duration, and response code."
            ],
            noLogEvents: [
              "Passwords.",
              "Access tokens.",
              "Refresh tokens.",
              "Credit card details."
            ],
            integrationPoints: [
              { system: "Shared PostgreSQL database", responsibility: "Persist floors and validate constraints." },
              { system: "Parking Zone Management module", responsibility: "Link zones to their parent floors." },
              { system: "Parking Slot Management module", responsibility: "Reference parent floors for slot constraints." },
              { system: "Vehicle Type Management module", responsibility: "Validate vehicle type restrictions on floors." },
              { system: "Audit Logging module", responsibility: "Record mutating events for floors." }
            ],
            uiPage: "/admin/floors",
            uiComponents: "Floor Table, Search Input, Create/Edit Dialog, Capacity Input, Vehicle Type Restriction Selector, Pagination.",
            uiStateLoading: "Display loading indicator while retrieving floor data.",
            uiStateEmpty: "Show 'No floors configured.'",
            uiStateError: "Display validation or authorization errors.",
            uiStateSuccess: "Refresh floor list after successful CRUD operations.",
            endpoints: [
              "GET /api/core/floors",
              "GET /api/core/floors/{id}",
              "POST /api/core/floors",
              "PUT /api/core/floors/{id}",
              "DELETE /api/core/floors/{id}"
            ],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-get-floors",
                name: "GET /api/core/floors",
                content: "Method: GET\nPath: /api/core/floors\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER\nQuery Parameters:\n  - keyword: string (optional)\n  - page: int (default 1)\n  - pageSize: int (default 20)\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"Get floors successfully\",\n  \"data\": {\n    \"items\": [\n      {\n        \"id\": 1,\n        \"floorName\": \"B1\",\n        \"floorNumber\": -1,\n        \"maxCapacity\": 200,\n        \"vehicleTypeRestrictions\": [\"Car\",\"Motorbike\"]\n      }\n    ]\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
              },
              {
                id: "contract-get-floors-id",
                name: "GET /api/core/floors/{id}",
                content: "Method: GET\nPath: /api/core/floors/{id}\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER"
              },
              {
                id: "contract-post-floors",
                name: "POST /api/core/floors",
                content: "Method: POST\nPath: /api/core/floors\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER\nValidation:\n  - Floor name is required.\n  - Floor number is required.\n  - Floor name must be unique.\n  - Floor number must be unique."
              },
              {
                id: "contract-put-floors-id",
                name: "PUT /api/core/floors/{id}",
                content: "Method: PUT\nPath: /api/core/floors/{id}\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER"
              },
              {
                id: "contract-delete-floors-id",
                name: "DELETE /api/core/floors/{id}",
                content: "Method: DELETE\nPath: /api/core/floors/{id}\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER\nBusiness Rules:\n  - Prevent deletion when dependent parking zones or slots exist.\n  - Audit log must be recorded."
              }
            ],
            testCases: [
              {
                id: "tc-floor-create-admin",
                title: "Admin can create a floor",
                type: "api",
                expectedResult: "Floor is created successfully.",
                status: "not_started"
              },
              {
                id: "tc-floor-create-manager",
                title: "Manager can create a floor",
                type: "api",
                expectedResult: "Floor is created successfully.",
                status: "not_started"
              },
              {
                id: "tc-floor-name-unique",
                title: "Floor name must be unique",
                type: "api",
                expectedResult: "Duplicate floor name returns validation error.",
                status: "not_started"
              },
              {
                id: "tc-floor-number-unique",
                title: "Floor number must be unique",
                type: "api",
                expectedResult: "Duplicate floor number returns validation error.",
                status: "not_started"
              },
              {
                id: "tc-floor-capacity-positive",
                title: "Maximum capacity must be greater than zero",
                type: "api",
                expectedResult: "Validation error is returned.",
                status: "not_started"
              },
              {
                id: "tc-floor-update-manager",
                title: "Manager can update floor information",
                type: "api",
                expectedResult: "Floor information is updated successfully.",
                status: "not_started"
              },
              {
                id: "tc-floor-delete-dependent",
                title: "Cannot delete floor containing parking zones",
                type: "api",
                expectedResult: "Business validation error is returned.",
                status: "not_started"
              },
              {
                id: "tc-floor-anonymous",
                title: "Anonymous cannot access Floor Management",
                type: "api",
                expectedResult: "Status 401 Unauthorized.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-floor-crud", content: "CRUD APIs for floor management are implemented.", checked: false },
              { id: "dc-floor-name-unique", content: "Floor names are unique within the building.", checked: false },
              { id: "dc-floor-number-unique", content: "Floor numbers are unique within the building.", checked: false },
              { id: "dc-floor-capacity-configurable", content: "Maximum capacity is configurable.", checked: false },
              { id: "dc-floor-restrictions-configurable", content: "Vehicle type restrictions are configurable.", checked: false },
              { id: "dc-floor-audit-logs", content: "Audit logs are generated for all floor mutations.", checked: false },
              { id: "dc-floor-permissions", content: "Admin and Manager have access to all floor management functions.", checked: false },
              { id: "dc-floor-jwt", content: "All APIs require JWT authentication.", checked: false },
              { id: "dc-floor-common-response", content: "Responses use the common API response format.", checked: false },
              { id: "dc-floor-delete-rules", content: "Business rules prevent deleting floors with dependent entities.", checked: false }
            ]
          },
          {
            id: "leaf-struct-area",
            title: "Area Management",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            status: "ready",
            priority: "medium",
            tags: ["area", "structure"],
            summary: "Divide each floor into distinct zones or sections (e.g., Zone A, VIP Area, Electric Vehicle Charging Zone) to optimize traffic flow and permit specialized parking rules.\n\nThis feature enables Managers and Admins to partition parking floors into manageable operational areas. Each area belongs to a parent floor and may inherit or define its own operational properties such as total parking slots and allowed vehicle categories.",
            objective: "Implement CRUD APIs and UI components to partition floors into operational areas in .NET Core API and React, persisting Floor-Area relationships and allowed vehicle categories.",
            inScope: [
              "Design CRUD UI components for managing parking areas",
              "Allow assigning each area to a specific floor",
              "Build RESTful APIs using .NET Core to manage area information and relationships",
              "Store area metadata and Floor–Area relationships in the shared PostgreSQL database",
              "Configure area properties including area name, parent floor, total slots, and allowed vehicle categories",
              "Record all create, update, and delete operations in the dedicated audit schema"
            ],
            outOfScope: [
              "Dynamic resizing or automatic adjustment of parking areas based on real-time occupancy (areas remain statically configured by managers)"
            ],
            permissions: [
              { role: "Admin", permission: "Full access to Create, Read, Update, and Delete parking areas." },
              { role: "Manager", permission: "Full access to Create, Read, Update, and Delete parking areas." },
              { role: "Staff", permission: "No access." },
              { role: "Driver", permission: "No access." },
              { role: "Anonymous", permission: "No access." }
            ],
            businessRules: [
              "Every area must belong to exactly one floor.",
              "Area names must be unique within the same floor.",
              "Vehicle category restrictions defined for an area must reference existing vehicle types.",
              "Areas are used to organize parking slots and support traffic management."
            ],
            dbExistingTables: ["floors", "areas"],
            dbNewTablesSql: "",
            dbRelationships: [
              "One floor can contain multiple areas.",
              "Each area belongs to exactly one floor.",
              "One area contains multiple parking slots.",
              "Allowed vehicle categories reference the Vehicle Type master data."
            ],
            validationRules: [
              { field: "name", rule: "Required, unique within the selected floor", errorMessage: "VALIDATION_FAILED" },
              { field: "floorId", rule: "Required, must reference an existing floor", errorMessage: "VALIDATION_FAILED" },
              { field: "totalSlots", rule: "Cannot be negative", errorMessage: "VALIDATION_FAILED" },
              { field: "allowedVehicleTypes", rule: "Must reference existing vehicle types", errorMessage: "VALIDATION_FAILED" }
            ],
            securityRules: [
              "Validate JWT.",
              "Require Admin or Manager role.",
              "Prevent unauthorized access.",
              "Use global exception handling.",
              "Prevent stack trace leakage."
            ],
            logEvents: [
              "Area created.",
              "Area updated.",
              "Area deleted.",
              "Parent floor changed.",
              "Allowed vehicle categories modified.",
              "Log request access, inputs, duration, and response code."
            ],
            noLogEvents: [
              "Passwords.",
              "Access tokens.",
              "Refresh tokens.",
              "Credit card details."
            ],
            integrationPoints: [
              { system: "Shared PostgreSQL database", responsibility: "Store areas, floors, and relation constraints." },
              { system: "Floor Management module", responsibility: "Provide floors as parent containers." },
              { system: "Parking Slot Management module", responsibility: "Organize slots under their respective areas." },
              { system: "Vehicle Type Management module", responsibility: "Validate allowed vehicle types for area configuration." },
              { system: "Audit Logging module", responsibility: "Record administrative mutating events." }
            ],
            uiPage: "/admin/areas",
            uiComponents: "Area Table, Search Input, Floor Filter Dropdown, Create/Edit Dialog, Vehicle Type Selector, Pagination.",
            uiStateLoading: "Display loading indicator while retrieving areas.",
            uiStateEmpty: "Show 'No parking areas configured.'",
            uiStateError: "Display validation or authorization error messages.",
            uiStateSuccess: "Refresh the area list after successful CRUD operations.",
            endpoints: [
              "GET /api/core/areas",
              "GET /api/core/areas/{id}",
              "POST /api/core/areas",
              "PUT /api/core/areas/{id}",
              "DELETE /api/core/areas/{id}"
            ],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-get-areas",
                name: "GET /api/core/areas",
                content: "Method: GET\nPath: /api/core/areas\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER\nQuery Parameters:\n  - keyword: string (optional)\n  - floorId: int (optional)\n  - page: int (default 1)\n  - pageSize: int (default 20)\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"Get areas successfully\",\n  \"data\": {\n    \"items\": [\n      {\n        \"id\": 1,\n        \"name\": \"Zone A\",\n        \"floorId\": 2,\n        \"floorName\": \"B1\",\n        \"totalSlots\": 120,\n        \"allowedVehicleTypes\": [\n          \"Car\",\n          \"Motorbike\"\n        ]\n      }\n    ],\n    \"page\": 1,\n    \"pageSize\": 20,\n    \"totalItems\": 1,\n    \"totalPages\": 1\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
              },
              {
                id: "contract-get-areas-id",
                name: "GET /api/core/areas/{id}",
                content: "Method: GET\nPath: /api/core/areas/{id}\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER"
              },
              {
                id: "contract-post-areas",
                name: "POST /api/core/areas",
                content: "Method: POST\nPath: /api/core/areas\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER\nValidation:\n  - Area name is required.\n  - Parent floor is required.\n  - Area name must be unique within the selected floor."
              },
              {
                id: "contract-put-areas-id",
                name: "PUT /api/core/areas/{id}",
                content: "Method: PUT\nPath: /api/core/areas/{id}\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER"
              },
              {
                id: "contract-delete-areas-id",
                name: "DELETE /api/core/areas/{id}",
                content: "Method: DELETE\nPath: /api/core/areas/{id}\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER\nBusiness Rules:\n  - Cannot delete an area containing parking slots.\n  - Audit log must be recorded."
              }
            ],
            testCases: [
              {
                id: "tc-area-create-admin",
                title: "Admin can create a parking area",
                type: "api",
                expectedResult: "Area is created successfully.",
                status: "not_started"
              },
              {
                id: "tc-area-create-manager",
                title: "Manager can create a parking area",
                type: "api",
                expectedResult: "Area is created successfully.",
                status: "not_started"
              },
              {
                id: "tc-area-valid-floor",
                title: "Area must belong to a valid floor",
                type: "api",
                expectedResult: "Validation error is returned if floor does not exist.",
                status: "not_started"
              },
              {
                id: "tc-area-name-unique",
                title: "Area name must be unique within the same floor",
                type: "api",
                expectedResult: "Duplicate area name returns validation error.",
                status: "not_started"
              },
              {
                id: "tc-area-update-manager",
                title: "Manager can update area information",
                type: "api",
                expectedResult: "Area is updated successfully.",
                status: "not_started"
              },
              {
                id: "tc-area-delete-dependent",
                title: "Cannot delete an area containing parking slots",
                type: "api",
                expectedResult: "Business validation error is returned.",
                status: "not_started"
              },
              {
                id: "tc-area-anonymous",
                title: "Anonymous cannot access Area Management",
                type: "api",
                expectedResult: "Status 401 Unauthorized.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-area-crud", content: "CRUD APIs for area management are implemented.", checked: false },
              { id: "dc-area-valid-floor", content: "Each area belongs to a valid floor.", checked: false },
              { id: "dc-area-name-unique", content: "Area names are unique within each floor.", checked: false },
              { id: "dc-area-floor-relation", content: "Floor–Area relationships are persisted in PostgreSQL.", checked: false },
              { id: "dc-area-vehicles-configurable", content: "Allowed vehicle categories are configurable.", checked: false },
              { id: "dc-area-audit-logs", content: "Audit logs are generated for all area mutations.", checked: false },
              { id: "dc-area-permissions", content: "Admin and Manager have access to all area management functions.", checked: false },
              { id: "dc-area-jwt", content: "All APIs require JWT authentication.", checked: false },
              { id: "dc-area-common-response", content: "Responses use the common API response format.", checked: false },
              { id: "dc-area-delete-rules", content: "Business rules prevent deleting areas containing parking slots.", checked: false }
            ]
          },
          {
            id: "leaf-struct-slot",
            title: "Slot Management",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            status: "ready",
            priority: "medium",
            tags: ["slot", "structure"],
            summary: "Define and manage individual physical parking slots within an area, enabling precise inventory tracking and state management.\n\nThis feature manages the lowest level of the parking structure hierarchy: individual parking slots. Each slot contains a unique slot identifier, slot type (Standard, Compact, EV, Disabled), operational status, and is associated with a parent parking area. Slots can also be linked to physical sensors or status flags for future integration with the parking monitoring system.",
            objective: "Implement CRUD APIs and management dashboard UI for individual parking slots in the .NET Core API and React, with status override support and audit logs.",
            inScope: [
              "Design CRUD management dashboard and forms for parking slots",
              "Build RESTful APIs using .NET Core to manage slot information",
              "Configure slot metadata including slot identifier, slot type, operational status, and parent area",
              "Validate that slot identifiers are unique within the same parking area",
              "Implement PostgreSQL schema supporting slot statuses: Available, Occupied, Reserved, Maintenance",
              "Record audit logs whenever managers manually override slot status or modify slot information"
            ],
            outOfScope: [
              "Managing parking sensor firmware",
              "Processing raw IoT telemetry or hardware communication directly (handled by the external IoT Broker/Gateway)"
            ],
            permissions: [
              { role: "Admin", permission: "Full access to Create, Read, Update, Delete, and manually change slot status." },
              { role: "Manager", permission: "Full access to Create, Read, Update, Delete, and manually change slot status." },
              { role: "Staff", permission: "No access." },
              { role: "Driver", permission: "No access." },
              { role: "Anonymous", permission: "No access." }
            ],
            businessRules: [
              "Every slot must belong to exactly one parking area.",
              "Slot identifiers must be unique within the same parking area.",
              "Slot types must reference predefined supported parking slot categories.",
              "Slot status must always be one of: Available, Occupied, Reserved, or Maintenance.",
              "Manual status overrides performed by managers or admins must be audit logged."
            ],
            dbExistingTables: ["areas", "slots"],
            dbNewTablesSql: "",
            dbRelationships: [
              "One area contains multiple parking slots.",
              "Each parking slot belongs to exactly one parking area.",
              "Slot status is stored in PostgreSQL.",
              "Slot type references predefined parking slot categories.",
              "Slot records may be associated with physical sensor identifiers for future IoT integration."
            ],
            validationRules: [
              { field: "slotCode", rule: "Required, unique within the same area", errorMessage: "VALIDATION_FAILED" },
              { field: "areaId", rule: "Required, must reference existing parking area", errorMessage: "VALIDATION_FAILED" },
              { field: "slotType", rule: "Required, must reference valid category", errorMessage: "VALIDATION_FAILED" },
              { field: "status", rule: "Must be one of: AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE", errorMessage: "VALIDATION_FAILED" }
            ],
            securityRules: [
              "Validate JWT.",
              "Require Admin or Manager role.",
              "Prevent unauthorized access.",
              "Use global exception handling.",
              "Prevent stack trace leakage."
            ],
            logEvents: [
              "Parking slot created.",
              "Parking slot updated.",
              "Parking slot deleted.",
              "Manual slot status override.",
              "Slot type changed.",
              "Log request access, inputs, duration, and response code."
            ],
            noLogEvents: [
              "Passwords.",
              "Access tokens.",
              "Refresh tokens.",
              "Credit card details."
            ],
            integrationPoints: [
              { system: "Shared PostgreSQL database", responsibility: "Persist parking slots and validate unique constraints." },
              { system: "Area Management module", responsibility: "Provide parent area contexts for slots." },
              { system: "Parking Session Management module", responsibility: "Allocate slots to active sessions and track occupancy." },
              { system: "IoT Broker / Gateway", responsibility: "Support future sensor integration for real-time status updates." },
              { system: "Audit Logging module", responsibility: "Record manual status overrides and configuration mutations." }
            ],
            uiPage: "/admin/slots",
            uiComponents: "Slot Table, Search Input, Area Filter, Status Filter, Slot Type Filter, Create/Edit Dialog, Pagination.",
            uiStateLoading: "Display loading indicator while retrieving parking slots.",
            uiStateEmpty: "Show 'No parking slots configured.'",
            uiStateError: "Display validation or authorization errors.",
            uiStateSuccess: "Refresh slot list after successful CRUD operations or status updates.",
            endpoints: [
              "GET /api/core/slots",
              "GET /api/core/slots/{id}",
              "POST /api/core/slots",
              "PUT /api/core/slots/{id}",
              "PATCH /api/core/slots/{id}/status",
              "DELETE /api/core/slots/{id}"
            ],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-get-slots",
                name: "GET /api/core/slots",
                content: "Method: GET\nPath: /api/core/slots\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER\nQuery Parameters:\n  - keyword: string (optional)\n  - areaId: int (optional)\n  - status: string (optional)\n  - slotType: string (optional)\n  - page: int (default 1)\n  - pageSize: int (default 20)\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"Get parking slots successfully\",\n  \"data\": {\n    \"items\": [\n      {\n        \"id\": 15,\n        \"slotCode\": \"A1-001\",\n        \"areaId\": 2,\n        \"areaName\": \"Zone A\",\n        \"slotType\": \"STANDARD\",\n        \"status\": \"AVAILABLE\"\n      }\n    ],\n    \"page\": 1,\n    \"pageSize\": 20,\n    \"totalItems\": 1,\n    \"totalPages\": 1\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
              },
              {
                id: "contract-get-slots-id",
                name: "GET /api/core/slots/{id}",
                content: "Method: GET\nPath: /api/core/slots/{id}\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER"
              },
              {
                id: "contract-post-slots",
                name: "POST /api/core/slots",
                content: "Method: POST\nPath: /api/core/slots\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER\nValidation:\n  - Slot code is required.\n  - Parent area is required.\n  - Slot code must be unique within the selected area.\n  - Slot type is required."
              },
              {
                id: "contract-put-slots-id",
                name: "PUT /api/core/slots/{id}",
                content: "Method: PUT\nPath: /api/core/slots/{id}\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER"
              },
              {
                id: "contract-patch-slots-id-status",
                name: "PATCH /api/core/slots/{id}/status",
                content: "Method: PATCH\nPath: /api/core/slots/{id}/status\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER\nBusiness Rules:\n  - Allowed statuses: AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE\n  - Manual override must be audit logged."
              },
              {
                id: "contract-delete-slots-id",
                name: "DELETE /api/core/slots/{id}",
                content: "Method: DELETE\nPath: /api/core/slots/{id}\nAuth:\n  JWT required\nRole:\n  ADMIN, MANAGER\nBusiness Rules:\n  - Cannot delete a slot currently occupied.\n  - Audit log must be recorded."
              }
            ],
            testCases: [
              {
                id: "tc-slot-create-admin",
                title: "Admin can create a parking slot",
                type: "api",
                expectedResult: "Slot is created successfully.",
                status: "not_started"
              },
              {
                id: "tc-slot-create-manager",
                title: "Manager can create a parking slot",
                type: "api",
                expectedResult: "Slot is created successfully.",
                status: "not_started"
              },
              {
                id: "tc-slot-code-unique",
                title: "Slot identifier must be unique within the same area",
                type: "api",
                expectedResult: "Duplicate slot identifier returns validation error.",
                status: "not_started"
              },
              {
                id: "tc-slot-require-area",
                title: "Slot cannot be created without parent area",
                type: "api",
                expectedResult: "Validation error is returned.",
                status: "not_started"
              },
              {
                id: "tc-slot-override-status",
                title: "Manager can manually update slot status",
                type: "api",
                expectedResult: "Slot status is updated successfully and audit log is generated.",
                status: "not_started"
              },
              {
                id: "tc-slot-status-invalid",
                title: "Invalid slot status returns validation error",
                type: "api",
                expectedResult: "Request is rejected.",
                status: "not_started"
              },
              {
                id: "tc-slot-delete-occupied",
                title: "Cannot delete occupied slot",
                type: "api",
                expectedResult: "Business validation error is returned.",
                status: "not_started"
              },
              {
                id: "tc-slot-anonymous",
                title: "Anonymous cannot access Slot Management",
                type: "api",
                expectedResult: "Status 401 Unauthorized.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-slot-crud", content: "CRUD APIs for parking slots are implemented.", checked: false },
              { id: "dc-slot-code-unique", content: "Slot identifiers are unique within each parking area.", checked: false },
              { id: "dc-slot-valid-area", content: "Every slot belongs to a valid parking area.", checked: false },
              { id: "dc-slot-type-configurable", content: "Slot types are configurable.", checked: false },
              { id: "dc-slot-status-supported", content: "Slot statuses (Available, Occupied, Reserved, Maintenance) are supported.", checked: false },
              { id: "dc-slot-override-audit", content: "Manual status overrides generate audit logs.", checked: false },
              { id: "dc-slot-permissions", content: "Admin and Manager have access to all slot management functions.", checked: false },
              { id: "dc-slot-jwt", content: "All APIs require JWT authentication.", checked: false },
              { id: "dc-slot-common-response", content: "Responses use the common API response format.", checked: false },
              { id: "dc-slot-delete-rules", content: "Business rules prevent deleting occupied parking slots.", checked: false }
            ]
          },
          {
            id: "leaf-struct-gate",
            title: "Gate Read Model",
            type: "leaf_feature",
            clients: ["Staff", "Manager", "Admin"],
            status: "ready",
            priority: "medium",
            tags: ["gate", "structure", "read-model"],
            summary: "Provide a highly optimized, read-only data model representing gate statuses and recent barrier events to ensure smooth monitoring at entry/exit points.\n\nThis feature materializes and serves real-time entry and exit gate data for Staff, Managers, and Admins. It enables monitoring dashboards to retrieve gate hardware availability, operational status, and recent gate event history without impacting the transactional database.",
            objective: "Implement optimized read-only APIs for gate monitoring and event tracking in the Spring Boot Support API, sourcing and synchronizing statuses asynchronously from event streams.",
            inScope: [
              "Develop optimized read-only REST APIs using the Spring Boot Support API",
              "Build read models for gate status and recent gate event history",
              "Listen to entry and exit event streams to update gate status in near real-time",
              "Implement JWT-based authentication and authorization for Staff, Manager, and Admin roles",
              "Support efficient querying for monitoring dashboards without affecting transactional workloads"
            ],
            outOfScope: [
              "Triggering physical gate open/close commands",
              "Direct communication with gate hardware controllers",
              "Processing transactional parking operations handled by the .NET Core API"
            ],
            permissions: [
              { role: "Admin", permission: "View all gate statuses and event history." },
              { role: "Manager", permission: "View all gate statuses and event history." },
              { role: "Staff", permission: "View all gate statuses and event history." },
              { role: "Driver", permission: "No access." },
              { role: "Anonymous", permission: "No access." }
            ],
            businessRules: [
              "Read APIs must not modify transactional data.",
              "Gate status should be updated asynchronously from entry and exit event streams.",
              "Read models should be optimized for dashboard queries and monitoring performance.",
              "Event history is read-only and sourced from transactional events."
            ],
            dbExistingTables: ["gates", "gate_events"],
            dbNewTablesSql: "",
            dbRelationships: [
              "One gate has many gate events.",
              "Gate event history is generated from transactional parking events.",
              "Read model is synchronized asynchronously from transactional data."
            ],
            validationRules: [
              { field: "gateId", rule: "Must reference valid gate", errorMessage: "VALIDATION_FAILED" },
              { field: "eventType", rule: "Must reference valid event category", errorMessage: "VALIDATION_FAILED" }
            ],
            securityRules: [
              "Validate JWT.",
              "Require Staff, Manager, or Admin role.",
              "Prevent unauthorized access.",
              "Read-only APIs must not expose administrative operations.",
              "Use global exception handling.",
              "Prevent stack trace leakage."
            ],
            logEvents: [
              "API request access.",
              "Query execution duration.",
              "Response status codes.",
              "Authentication failures."
            ],
            noLogEvents: [
              "Passwords.",
              "Access tokens.",
              "Refresh tokens.",
              "Personal payment information."
            ],
            integrationPoints: [
              { system: "Spring Boot Support API", responsibility: "Expose gate status and event read APIs." },
              { system: ".NET Core API event stream", responsibility: "Publish gate status/event messages." },
              { system: "PostgreSQL Read Model", responsibility: "Maintain materialized view of gates." },
              { system: "Gate Event Stream", responsibility: "Deliver real-time gate entry/exit events." },
              { system: "Monitoring Dashboard", responsibility: "Consume gate read model APIs." }
            ],
            uiPage: "/monitor/gates",
            uiComponents: "Gate Status Cards, Gate Status Table, Event History Table, Search Box, Status Filter, Time Range Filter.",
            uiStateLoading: "Display loading indicator while fetching gate data.",
            uiStateEmpty: "Display \"No gate data available.\"",
            uiStateError: "Display authorization or service unavailable messages.",
            uiStateSuccess: "Automatically refresh gate statuses and event history.",
            endpoints: [
              "GET /api/support/gates",
              "GET /api/support/gates/{id}",
              "GET /api/support/gates/events",
              "GET /api/support/gates/events/{id}"
            ],
            ownerService: "Spring Boot Support API",
            apiContracts: [
              {
                id: "contract-get-support-gates",
                name: "GET /api/support/gates",
                content: "Method: GET\nPath: /api/support/gates\nAuth:\n  JWT required\nRole:\n  STAFF, MANAGER, ADMIN\nQuery Parameters:\n  - keyword: string (optional)\n  - gateType: string (optional)\n  - status: string (optional)\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"Get gate status successfully\",\n  \"data\": [\n    {\n      \"id\": 1,\n      \"gateName\": \"Entrance Gate A\",\n      \"gateType\": \"ENTRY\",\n      \"status\": \"ONLINE\",\n      \"lastUpdated\": \"2026-07-05T17:20:00+07:00\"\n    }\n  ],\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
              },
              {
                id: "contract-get-support-gates-id",
                name: "GET /api/support/gates/{id}",
                content: "Method: GET\nPath: /api/support/gates/{id}\nAuth:\n  JWT required\nRole:\n  STAFF, MANAGER, ADMIN"
              },
              {
                id: "contract-get-support-gates-events",
                name: "GET /api/support/gates/events",
                content: "Method: GET\nPath: /api/support/gates/events\nAuth:\n  JWT required\nRole:\n  STAFF, MANAGER, ADMIN\nQuery Parameters:\n  - gateId (optional)\n  - eventType (optional)\n  - fromTime (optional)\n  - toTime (optional)\n  - page\n  - pageSize"
              },
              {
                id: "contract-get-support-gates-events-id",
                name: "GET /api/support/gates/events/{id}",
                content: "Method: GET\nPath: /api/support/gates/events/{id}\nAuth:\n  JWT required\nRole:\n  STAFF, MANAGER, ADMIN"
              }
            ],
            testCases: [
              {
                id: "tc-gate-status-staff",
                title: "Staff can view gate status",
                type: "api",
                expectedResult: "Status 200 and gate status list returned.",
                status: "not_started"
              },
              {
                id: "tc-gate-events-manager",
                title: "Manager can view gate event history",
                type: "api",
                expectedResult: "Event history returned successfully.",
                status: "not_started"
              },
              {
                id: "tc-gate-filter-admin",
                title: "Admin can filter gate events",
                type: "api",
                expectedResult: "Filtered results returned correctly.",
                status: "not_started"
              },
              {
                id: "tc-gate-anonymous",
                title: "Anonymous user cannot access Gate Read Model",
                type: "api",
                expectedResult: "Status 401 Unauthorized.",
                status: "not_started"
              },
              {
                id: "tc-gate-driver-denied",
                title: "Driver cannot access Gate Read Model",
                type: "api",
                expectedResult: "Status 403 Forbidden.",
                status: "not_started"
              },
              {
                id: "tc-gate-no-write",
                title: "Read model does not modify transactional data",
                type: "integration",
                expectedResult: "No database write operations occur during API requests.",
                status: "not_started"
              },
              {
                id: "tc-gate-stream-sync",
                title: "Gate status updates after receiving event stream",
                type: "integration",
                expectedResult: "Read model reflects latest gate status.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-gate-read-apis", content: "Read-only APIs for gate monitoring are implemented.", checked: false },
              { id: "dc-gate-optimized", content: "APIs are optimized for monitoring dashboards.", checked: false },
              { id: "dc-gate-sync", content: "Gate statuses are synchronized from event streams.", checked: false },
              { id: "dc-gate-events-query", content: "Recent gate events are queryable.", checked: false },
              { id: "dc-gate-jwt", content: "JWT authentication is enforced.", checked: false },
              { id: "dc-gate-permissions", content: "Only Staff, Manager, and Admin can access the APIs.", checked: false },
              { id: "dc-gate-no-write", content: "No transactional database updates occur through these APIs.", checked: false },
              { id: "dc-gate-common-response", content: "Responses follow the common API response format.", checked: false },
              { id: "dc-gate-events-filters", content: "Event history supports filtering and pagination.", checked: false },
              { id: "dc-gate-tests-pass", content: "Automated tests pass successfully.", checked: false }
            ]
          },
          {
            id: "leaf-struct-avail",
            title: "Public Available Slots",
            type: "leaf_feature",
            clients: ["Guest", "Driver"],
            status: "ready",
            priority: "medium",
            tags: ["available-slots", "structure", "public"],
            summary: "Expose real-time, aggregated parking availability data to public users to help them decide whether to navigate to the building.\n\nThis feature provides a high-concurrency, public-facing read model that displays the number of available parking slots by floor and area. Drivers and guests can quickly view overall parking availability before arriving at the parking building without accessing transactional data.",
            objective: "Implement high-performance read-only public APIs using the Spring Boot Support API to retrieve aggregated available slots from cached PostgreSQL statistics.",
            inScope: [
              "Develop high-performance read-only APIs using the Spring Boot Support API",
              "Support public access or Guest-level JWT authentication",
              "Query cached parking occupancy statistics stored in PostgreSQL",
              "Return aggregated available slot counts by floor and area",
              "Optimize API responses for low latency and high concurrent requests",
              "Design mobile-friendly response formats suitable for web and mobile applications"
            ],
            outOfScope: [
              "Reserving or booking parking slots",
              "Selecting individual parking slots",
              "Displaying detailed parking session information",
              "Any transactional parking operations handled by the .NET Core API"
            ],
            permissions: [
              { role: "Guest", permission: "View public parking availability." },
              { role: "Driver", permission: "View public parking availability." },
              { role: "Staff", permission: "No access required (uses internal monitoring APIs instead)." },
              { role: "Manager", permission: "No access required (uses internal monitoring APIs instead)." },
              { role: "Admin", permission: "No access required (uses internal monitoring APIs instead)." },
              { role: "Anonymous", permission: "Optional access if public endpoint is enabled." }
            ],
            businessRules: [
              "Public APIs should support anonymous access or Guest-level JWT based on deployment configuration.",
              "Cached occupancy statistics should be used instead of querying transactional parking sessions directly.",
              "APIs must be optimized for high read throughput and low response latency.",
              "Returned information must contain only aggregated availability data without exposing internal parking structure details.",
              "Read APIs must never modify transactional data."
            ],
            dbExistingTables: ["floors", "areas", "slots"],
            dbNewTablesSql: "",
            dbRelationships: [
              "Availability counts are aggregated from parking slot status.",
              "Floor availability is calculated from associated areas.",
              "Area availability is calculated from associated parking slots.",
              "Read model is synchronized asynchronously from transactional parking events."
            ],
            validationRules: [
              { field: "floorId", rule: "Optional, must reference existing floor if supplied", errorMessage: "VALIDATION_FAILED" }
            ],
            securityRules: [
              "Support anonymous access or Guest JWT based on deployment configuration.",
              "Prevent exposure of transactional or administrative data.",
              "Read-only APIs must never modify data.",
              "Use global exception handling.",
              "Prevent stack trace leakage."
            ],
            logEvents: [
              "API request access.",
              "Request duration.",
              "Response status code.",
              "API performance metrics."
            ],
            noLogEvents: [
              "Passwords.",
              "Access tokens.",
              "Refresh tokens.",
              "Personal user information.",
              "Individual parking session data."
            ],
            integrationPoints: [
              { system: "Spring Boot Support API", responsibility: "Expose public available slot read APIs." },
              { system: "Cached PostgreSQL Read Model", responsibility: "Store cached availability metrics." },
              { system: "Parking Slot Read Model", responsibility: "Source for raw slot statuses." },
              { system: "Floor Management Read Model", responsibility: "Grouping source for floors." },
              { system: "Area Management Read Model", responsibility: "Grouping source for areas." }
            ],
            uiPage: "/available-slots",
            uiComponents: "Availability Summary Card, Floor Availability List, Area Availability List, Refresh Indicator.",
            uiStateLoading: "Display loading skeleton while retrieving data.",
            uiStateEmpty: "Display \"No parking information available.\"",
            uiStateError: "Display service unavailable message.",
            uiStateSuccess: "Automatically refresh availability every configurable interval (e.g., 30 seconds).",
            endpoints: [
              "GET /api/public/available-slots",
              "GET /api/public/available-slots/floors",
              "GET /api/public/available-slots/areas"
            ],
            ownerService: "Spring Boot Support API",
            apiContracts: [
              {
                id: "contract-get-public-avail",
                name: "GET /api/public/available-slots",
                content: "Method: GET\nPath: /api/public/available-slots\nAuth:\n  Anonymous or Guest JWT (system configuration)\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"Get parking availability successfully\",\n  \"data\": {\n    \"totalAvailableSlots\": 185,\n    \"totalCapacity\": 500,\n    \"occupancyRate\": 63.0\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
              },
              {
                id: "contract-get-public-avail-floors",
                name: "GET /api/public/available-slots/floors",
                content: "Method: GET\nPath: /api/public/available-slots/floors\nAuth:\n  Anonymous or Guest JWT\nResponse:\n[\n  {\n    \"floorName\": \"B1\",\n    \"availableSlots\": 65\n  },\n  {\n    \"floorName\": \"B2\",\n    \"availableSlots\": 48\n  }\n]"
              },
              {
                id: "contract-get-public-avail-areas",
                name: "GET /api/public/available-slots/areas",
                content: "Method: GET\nPath: /api/public/available-slots/areas\nAuth:\n  Anonymous or Guest JWT\nQuery Parameters:\n  - floorId (optional)\nResponse:\n[\n  {\n    \"areaName\": \"Zone A\",\n    \"availableSlots\": 32\n  },\n  {\n    \"areaName\": \"EV Zone\",\n    \"availableSlots\": 8\n  }\n]"
              }
            ],
            testCases: [
              {
                id: "tc-avail-guest",
                title: "Guest can view parking availability",
                type: "api",
                expectedResult: "Parking availability is returned successfully.",
                status: "not_started"
              },
              {
                id: "tc-avail-driver",
                title: "Driver can view parking availability",
                type: "api",
                expectedResult: "Parking availability is returned successfully.",
                status: "not_started"
              },
              {
                id: "tc-avail-anonymous",
                title: "Anonymous access works when enabled",
                type: "api",
                expectedResult: "Status 200 and aggregated availability is returned.",
                status: "not_started"
              },
              {
                id: "tc-avail-aggregated-only",
                title: "Response contains aggregated data only",
                type: "api",
                expectedResult: "No slot identifiers or private information are exposed.",
                status: "not_started"
              },
              {
                id: "tc-avail-consistency",
                title: "Floor availability equals sum of area availability",
                type: "integration",
                expectedResult: "Aggregated counts are consistent.",
                status: "not_started"
              },
              {
                id: "tc-avail-sync",
                title: "Availability updates after parking session changes",
                type: "integration",
                expectedResult: "Cached read model reflects the latest parking occupancy.",
                status: "not_started"
              },
              {
                id: "tc-avail-concurrency",
                title: "High concurrent requests maintain low latency",
                type: "manual",
                expectedResult: "API continues serving requests within acceptable response time.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-avail-public-read", content: "Public read-only APIs are implemented.", checked: false },
              { id: "dc-avail-aggregated", content: "APIs return aggregated parking availability.", checked: false },
              { id: "dc-avail-floors", content: "Floor-level availability is supported.", checked: false },
              { id: "dc-avail-areas", content: "Area-level availability is supported.", checked: false },
              { id: "dc-avail-cached", content: "Cached PostgreSQL data is used for low-latency responses.", checked: false },
              { id: "dc-avail-auth", content: "APIs support anonymous access or Guest JWT.", checked: false },
              { id: "dc-avail-no-expose", content: "No transactional or sensitive information is exposed.", checked: false },
              { id: "dc-avail-response-format", content: "Responses follow the common API response format.", checked: false },
              { id: "dc-avail-concurrency-optimized", content: "APIs are optimized for high-concurrency read workloads.", checked: false },
              { id: "dc-avail-tests-pass", content: "Automated tests pass successfully.", checked: false }
            ]
          },
          {
            id: "leaf-struct-suggest",
            title: "Location / Slot Suggestion",
            type: "leaf_feature",
            clients: ["Staff", "Manager", "Driver"],
            status: "ready",
            priority: "medium",
            tags: ["suggestion", "slots", "structure"],
            summary: "Provide intelligent allocation recommendations to drivers or staff to minimize cruising time inside the structure.\n\nThis feature analyzes the current parking occupancy and recommends the optimal parking location—including floor, area, or individual slot—based on parking structure layout, vehicle type, slot availability, and driver preferences. The recommendation service helps reduce searching time and improves traffic flow inside the parking building.",
            objective: "Implement a parking recommendation algorithm in .NET Core API that analyzes real-time occupancy and suggests compatible, available parking spots with fallback options.",
            inScope: [
              "Develop a parking recommendation algorithm using parking structure hierarchy and real-time occupancy",
              "Recommend the optimal floor, parking area, or individual parking slot",
              "Expose recommendation APIs for Driver mobile applications and Staff operational consoles",
              "Consider vehicle type compatibility when generating recommendations",
              "Support preference-based recommendations when driver preferences are available",
              "Implement fallback recommendation logic when preferred locations are unavailable",
              "Return recommendations using the common API response format"
            ],
            outOfScope: [
              "Indoor turn-by-turn navigation",
              "AR guidance inside the parking building",
              "Physical navigation hardware integration",
              "Voice navigation or map rendering"
            ],
            permissions: [
              { role: "Driver", permission: "Request parking location recommendations." },
              { role: "Staff", permission: "Request recommendations for assisting incoming vehicles." },
              { role: "Manager", permission: "Request recommendations and monitor recommendation behavior." },
              { role: "Admin", permission: "No direct access required." },
              { role: "Guest", permission: "No access." },
              { role: "Anonymous", permission: "No access." }
            ],
            businessRules: [
              "Recommendation logic should prioritize the nearest suitable available location.",
              "Recommendations must consider vehicle type compatibility.",
              "Recommendations should avoid occupied, reserved, or maintenance slots.",
              "If preferred parking areas are unavailable, the system must automatically provide fallback recommendations.",
              "Recommendation APIs must not reserve parking slots automatically."
            ],
            dbExistingTables: ["floors", "areas", "slots", "vehicle_types", "parking_sessions"],
            dbNewTablesSql: "",
            dbRelationships: [
              "Recommendations are generated from floor, area, and parking slot hierarchy.",
              "Parking slot status is used to determine availability.",
              "Vehicle type compatibility is validated before recommending a slot.",
              "Recommendation results are computed dynamically and are not permanently stored."
            ],
            validationRules: [
              { field: "vehicleTypeId", rule: "Required, must refer to an existing vehicle type", errorMessage: "VALIDATION_FAILED" },
              { field: "preferredFloorId", rule: "Optional, must reference existing floor if provided", errorMessage: "VALIDATION_FAILED" },
              { field: "preferredAreaId", rule: "Optional, must reference existing area if provided", errorMessage: "VALIDATION_FAILED" }
            ],
            securityRules: [
              "Validate JWT.",
              "Require Driver, Staff, or Manager role.",
              "Prevent unauthorized access.",
              "Use global exception handling.",
              "Prevent stack trace leakage.",
              "Recommendation API must not expose internal optimization logic."
            ],
            logEvents: [
              "Recommendation requests.",
              "Recommendation generation duration.",
              "Recommendation failures.",
              "Fallback recommendation execution.",
              "API response status."
            ],
            noLogEvents: [
              "Passwords.",
              "Access tokens.",
              "Refresh tokens.",
              "Personal payment information.",
              "Driver preference details beyond operational necessity."
            ],
            integrationPoints: [
              { system: "Parking Session Management", responsibility: "Read active sessions and exclude occupied slots." },
              { system: "Parking Slot Management", responsibility: "Verify physical slot existence and status." },
              { system: "Floor Management", responsibility: "Map floor layout and restrictions." },
              { system: "Area Management", responsibility: "Identify zones and allowed vehicles in areas." },
              { system: "Vehicle Type Management", responsibility: "Validate compatibility of requested vehicle categories." },
              { system: "Real-time Occupancy Service", responsibility: "Supply occupancy metrics to algorithm." }
            ],
            uiPage: "/available-slots",
            uiComponents: "Availability Summary Card, Floor Availability List, Area Availability List, Refresh Indicator.",
            uiStateLoading: "Show recommendation loading indicator.",
            uiStateEmpty: "Display \"No suitable parking location available.\"",
            uiStateError: "Display recommendation unavailable message.",
            uiStateSuccess: "Highlight the recommended parking location with explanation.",
            endpoints: [
              "POST /api/core/parking-sessions/suggest-slot"
            ],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-post-suggest-slot",
                name: "POST /api/core/parking-sessions/suggest-slot",
                content: "Method: POST\nPath: /api/core/parking-sessions/suggest-slot\nAuth:\n  JWT required\nRole:\n  DRIVER, STAFF, MANAGER\nRequest Body:\n{\n  \"vehicleTypeId\": 2,\n  \"preferredFloorId\": 1,\n  \"preferredAreaId\": null\n}\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"Parking recommendation generated successfully\",\n  \"data\": {\n    \"floorId\": 2,\n    \"floorName\": \"B1\",\n    \"areaId\": 5,\n    \"areaName\": \"Zone A\",\n    \"slotId\": 108,\n    \"slotCode\": \"A-108\",\n    \"slotType\": \"STANDARD\",\n    \"reason\": \"Nearest available compatible parking slot\"\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
              }
            ],
            testCases: [
              {
                id: "tc-suggest-driver",
                title: "Driver receives parking recommendation",
                type: "api",
                expectedResult: "Recommended floor, area, and slot are returned.",
                status: "not_started"
              },
              {
                id: "tc-suggest-staff",
                title: "Staff can request recommendation",
                type: "api",
                expectedResult: "Recommendation is generated successfully.",
                status: "not_started"
              },
              {
                id: "tc-suggest-manager",
                title: "Manager can request recommendation",
                type: "api",
                expectedResult: "Recommendation is generated successfully.",
                status: "not_started"
              },
              {
                id: "tc-suggest-vehicle-match",
                title: "Recommended slot matches vehicle type",
                type: "api",
                expectedResult: "Only compatible slot types are returned.",
                status: "not_started"
              },
              {
                id: "tc-suggest-exclude-reserved",
                title: "Reserved slots are never recommended",
                type: "api",
                expectedResult: "Reserved slots are excluded.",
                status: "not_started"
              },
              {
                id: "tc-suggest-exclude-maintenance",
                title: "Maintenance slots are never recommended",
                type: "api",
                expectedResult: "Maintenance slots are excluded.",
                status: "not_started"
              },
              {
                id: "tc-suggest-fallback",
                title: "Fallback recommendation works when preferred area is full",
                type: "integration",
                expectedResult: "Alternative parking location is returned.",
                status: "not_started"
              },
              {
                id: "tc-suggest-no-reserve",
                title: "Recommendation does not reserve parking slot",
                type: "integration",
                expectedResult: "Slot status remains unchanged.",
                status: "not_started"
              },
              {
                id: "tc-suggest-anonymous",
                title: "Anonymous user cannot access recommendation API",
                type: "api",
                expectedResult: "Status 401 Unauthorized.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-suggest-algorithm", content: "Recommendation algorithm is implemented.", checked: false },
              { id: "dc-suggest-return-fields", content: "APIs return floor, area, and slot recommendations.", checked: false },
              { id: "dc-suggest-occupancy", content: "Recommendations consider real-time occupancy.", checked: false },
              { id: "dc-suggest-vehicle-check", content: "Vehicle type compatibility is enforced.", checked: false },
              { id: "dc-suggest-fallback", content: "Fallback recommendations are generated when preferred locations are unavailable.", checked: false },
              { id: "dc-suggest-no-reserve", content: "Recommendation API does not reserve parking slots.", checked: false },
              { id: "dc-suggest-jwt", content: "JWT authentication is required.", checked: false },
              { id: "dc-suggest-roles", content: "Driver, Staff, and Manager can access the API.", checked: false },
              { id: "dc-suggest-response-format", content: "Responses use the common API response format.", checked: false },
              { id: "dc-suggest-tests-pass", content: "Automated tests pass successfully.", checked: false }
            ]
          }
        ]
      },

      // 6. Card & RFID Management
      {
        id: "cat-cards",
        title: "Card & RFID Management",
        type: "category",
        summary: "Managing mechanical RFIDs and tracking physical entry cards.",
        children: [
          {
            id: "leaf-card-crud",
            title: "Parking Card CRUD",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: [
              "GET /api/core/cards",
              "GET /api/core/cards/{id}",
              "POST /api/core/cards",
              "PUT /api/core/cards/{id}",
              "PATCH /api/core/cards/{id}/status",
              "DELETE /api/core/cards/{id}",
              "GET /api/core/cards/available"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/cards"),
            testCases: defaultApiTests("Parking Card CRUD", ["Manager"], ["POST /api/core/cards"]),
            doneCriteria: [
              ...defaultDoneCriteria("Parking Card CRUD"),
              { id: "dc-card-avail", content: "Retrieval of unassigned cards for on-site registration is functional.", checked: false }
            ]
          }
        ]
      },

      // 7. Reservation / Booking
      {
        id: "cat-reservation",
        title: "Reservation / Booking",
        type: "category",
        summary: "Pre-booking mechanisms for locking slots ahead of arrival.",
        businessRules: [
          "A reservation must be associated with a driver, vehicle/plate, vehicle type, selected parking location, reservation time, payment status, and booking amount.",
          "Reservation payment status must be trackable.",
          "Unpaid or expired reservations must not permanently lock slots.",
          "Reservation entry check must validate reservation code, gate, payment status, time validity, and whether the reservation has already been used.",
          "Booking amount must be consistent with configured reservation hourly price and selected duration."
        ],
        children: [
          {
            id: "leaf-res-avail",
            title: "Available Reservation Locations",
            type: "leaf_feature",
            clients: ["Driver"],
            status: "ready",
            priority: "high",
            tags: ["reservation", "booking", "available-locations"],
            summary: "Query and display a list of available parking locations/slots that allow advanced booking. The system must filter results based on the estimated arrival time, driver's vehicle type, and real-time actual capacity.",
            objective: "Implement high-performance read APIs in the .NET Core API to retrieve available reservation locations based on estimated arrival time, vehicle type compatibility, and actual real-time capacity calculations.",
            inScope: [
              "Query and display available parking locations that support advanced booking.",
              "Filter available locations based on the driver's estimated arrival time.",
              "Filter available locations based on the driver's registered vehicle type.",
              "Calculate projected availability using current reservations and currently parked vehicles.",
              "Return only parking locations that are available for reservation."
            ],
            outOfScope: [
              "Reservation creation.",
              "Reservation payment.",
              "External system integrations not specified in this document."
            ],
            permissions: [
              { role: "Driver", permission: "Authorized to access this feature." }
            ],
            businessRules: [
              "Only display parking locations suitable for the driver's registered vehicle type.",
              "Do not display areas undergoing maintenance.",
              "Do not display parking locations that are fully booked during the requested time frame.",
              "Projected availability must be calculated based on both existing reservations and currently parked vehicles."
            ],
            dbExistingTables: [
              "parking_locations",
              "parking_slots",
              "reservations",
              "parking_sessions",
              "vehicles",
              "vehicle_types"
            ],
            dbNewTablesSql: "",
            dbRelationships: [
              "Availability must be calculated from existing reservations and active parking sessions.",
              "Parking location must support the driver's registered vehicle type."
            ],
            validationRules: [
              { field: "estimatedArrivalTime", rule: "Required, must be greater than current UTC time (in the future)", errorMessage: "Estimated arrival time must be in the future." },
              { field: "vehicleTypeId", rule: "Must exist if provided", errorMessage: "Invalid vehicle type." }
            ],
            securityRules: [
              "Validate role permissions.",
              "Prevent unauthorized access.",
              "Do not log sensitive data."
            ],
            logEvents: [
              "Log request access, inputs, duration, and response code.",
              "Log reservation location search requests."
            ],
            noLogEvents: [
              "Passwords, access tokens, refresh tokens, and credit card details."
            ],
            integrationPoints: [],
            uiPage: "/driver/reservations",
            uiComponents: "Available Locations List, Date Time Picker, Vehicle Type Dropdown",
            uiStateLoading: "Show loading skeleton while fetching available locations.",
            uiStateEmpty: "Show 'No available reservation locations found for the selected time.'",
            uiStateError: "Display error notification with reason.",
            uiStateSuccess: "Display list of available reservation locations.",
            endpoints: ["GET /api/core/reservations/available-locations"],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-get-reservations-available-locations",
                name: "GET /api/core/reservations/available-locations",
                content: "Method: GET\nPath: /api/core/reservations/available-locations\nHeaders:\n  Authorization: Bearer <token>\nQuery Parameters:\n  estimatedArrivalTime: datetime (required)\n  vehicleTypeId: integer (optional)\nResponse:\n  status: 200 OK\n  data:\n  {\n    \"success\": true,\n    \"data\": [\n      {\n        \"locationId\": \"loc-001\",\n        \"locationName\": \"Basement B1\",\n        \"vehicleTypeId\": 1,\n        \"availableSlots\": 25,\n        \"supportsReservation\": true\n      }\n    ]\n  }"
              }
            ],
            testCases: [
              {
                id: "tc-res-avail-driver-success",
                title: "Verify authorized client (Driver) can access \"Available Reservation Locations\" successfully",
                type: "api",
                precondition: "Client is authenticated with role: Driver",
                steps: [
                  "Authenticate user as Driver",
                  "Invoke endpoint: GET /api/core/reservations/available-locations",
                  "Check response code is 200/201 OK"
                ],
                expectedResult: "Request succeeds and returns correct payload",
                status: "not_started"
              },
              {
                id: "tc-res-avail-unauthorized",
                title: "Verify unauthorized role is rejected when accessing \"Available Reservation Locations\"",
                type: "api",
                precondition: "User is anonymous or lacks required role",
                steps: [
                  "Attempt to invoke endpoint: GET /api/core/reservations/available-locations without token/role",
                  "Check response status code is 401 Unauthorized or 403 Forbidden"
                ],
                expectedResult: "Request is blocked and returns clear error response",
                status: "not_started"
              },
              {
                id: "tc-res-avail-exclude-maintenance",
                title: "Verify maintenance areas are not returned",
                type: "integration",
                expectedResult: "Areas under maintenance are excluded from the response.",
                status: "not_started"
              },
              {
                id: "tc-res-avail-exclude-fully-booked",
                title: "Verify fully booked locations are not returned",
                type: "integration",
                expectedResult: "Fully booked locations during the requested time frame are excluded.",
                status: "not_started"
              },
              {
                id: "tc-res-avail-compatible-vehicle",
                title: "Verify only compatible vehicle type locations are returned",
                type: "integration",
                expectedResult: "Returned locations are compatible with the driver's registered vehicle type.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-res-avail-contract", content: "API contract is documented in this node.", checked: false },
              { id: "dc-res-avail-roles", content: "Required clients/roles are assigned.", checked: false },
              { id: "dc-res-avail-export", content: "Business rules and inherited rules are visible in AI export.", checked: false },
              { id: "dc-res-avail-response-format", content: "Success response uses common API response format where applicable.", checked: false },
              { id: "dc-res-avail-error-safe", content: "Error response is clear and does not leak sensitive data.", checked: false },
              { id: "dc-res-avail-vehicle-filter", content: "Available locations are filtered by driver's vehicle type.", checked: false },
              { id: "dc-res-avail-maintenance", content: "Maintenance areas are excluded.", checked: false },
              { id: "dc-res-avail-fully-booked", content: "Fully booked locations are excluded.", checked: false },
              { id: "dc-res-avail-projected", content: "Projected availability is calculated using current reservations and currently parked vehicles.", checked: false },
              { id: "dc-res-avail-test-cases", content: "At least two test cases are defined.", checked: false },
              { id: "dc-res-avail-ai-export", content: "Feature can be exported as AI-readable Markdown.", checked: false },
              { id: "dc-res-avail-edge-cases", content: "Edge cases are documented.", checked: false },
              { id: "dc-res-avail-state-transitions", content: "Payment/session/reservation state transition is documented.", checked: false }
            ]
          },
          {
            id: "leaf-res-create",
            title: "Create Reservation",
            type: "leaf_feature",
            clients: ["Driver"],
            status: "ready",
            priority: "must_have",
            tags: ["reservation", "booking", "create-reservation"],
            summary: "Allow drivers to create a new reservation request. This process includes selecting a parking location, specifying reservation start/end times, confirming vehicle details, and processing the reservation payment.",
            objective: "Implement transaction-safe reservation creation APIs in .NET Core API that validate slot availability, lock slots temporarily, initialize payment via PayOS, and handle status updates.",
            inScope: [
              "Allow drivers to create a new parking reservation.",
              "Select an available parking location.",
              "Specify reservation start time and end time.",
              "Confirm the vehicle/license plate associated with the reservation.",
              "Calculate the reservation amount.",
              "Temporarily lock the selected slot while waiting for payment.",
              "Process reservation payment.",
              "Confirm reservation after successful payment.",
              "Retrieve reservation payment status."
            ],
            outOfScope: [
              "Reservation modification after creation.",
              "Reservation cancellation.",
              "External system integrations not specified in this document."
            ],
            permissions: [
              { role: "Driver", permission: "Authorized to access this feature." }
            ],
            businessRules: [
              "A reservation must be associated with a driver, vehicle/plate, vehicle type, selected parking location, reservation time, payment status, and booking amount.",
              "Reservation payment status must be trackable.",
              "Unpaid or expired reservations must not permanently lock slots.",
              "Reservation entry check must validate reservation code, gate, payment status, time validity, and whether the reservation has already been used.",
              "Booking amount must be consistent with configured reservation hourly price and selected duration.",
              "A reservation must be tied to a specific vehicle/license plate.",
              "The selected parking slot must be temporarily locked for approximately 5–10 minutes while waiting for payment completion.",
              "The reservation is only confirmed when the payment status is updated to Paid.",
              "Expired unpaid reservations must automatically release the temporarily locked slot."
            ],
            dbExistingTables: [
              "reservations",
              "reservation_payments",
              "parking_locations",
              "parking_slots",
              "vehicles",
              "vehicle_types"
            ],
            dbNewTablesSql: "",
            dbRelationships: [
              "Every reservation must reference one driver.",
              "Every reservation must reference one vehicle/license plate.",
              "Every reservation must reference one parking location.",
              "Payment status determines whether the reservation becomes confirmed.",
              "Temporary slot lock expires automatically if payment is not completed."
            ],
            validationRules: [
              { field: "locationId", rule: "Required", errorMessage: "Parking location is required." },
              { field: "vehicleId", rule: "Required", errorMessage: "Vehicle is required." },
              { field: "licensePlate", rule: "Required", errorMessage: "License plate is required." },
              { field: "startTime", rule: "Required", errorMessage: "Start time is required." },
              { field: "endTime", rule: "Required, must be later than startTime", errorMessage: "End time must be greater than start time." }
            ],
            securityRules: [
              "Validate role permissions.",
              "Prevent unauthorized access.",
              "Do not log sensitive data."
            ],
            logEvents: [
              "Log request access, inputs, duration, and response code.",
              "Log reservation creation.",
              "Log temporary slot lock creation.",
              "Log payment confirmation callback.",
              "Log automatic reservation expiration."
            ],
            noLogEvents: [
              "Passwords, access tokens, refresh tokens, and credit card details."
            ],
            integrationPoints: [
              { system: "Payment module (PayOS Webhook)", responsibility: "Verify and confirm payment status." }
            ],
            uiPage: "/driver/reservations/create",
            uiComponents: "Reservation Form, Location Selector, Time Picker, Vehicle selector, Payment redirection link, QR code popup",
            uiStateIdle: "Display reservation form with available locations.",
            uiStateLoading: "Disable inputs while creating reservation or waiting for payment initialization.",
            uiStateSuccess: "Redirect the driver to the payment page or display payment QR/link.",
            uiStateError: "Display validation or payment initialization errors.",
            uiStateEmpty: "Display message when no reservable slots are available.",
            endpoints: [
              "POST /api/core/reservations",
              "GET /api/core/reservations/{id}/payment-status"
            ],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-post-reservations",
                name: "POST /api/core/reservations",
                content: "Method: POST\nPath: /api/core/reservations\nHeaders:\n  Authorization: Bearer <token>\nRequest Body:\n{\n  \"locationId\": \"loc-001\",\n  \"slotId\": \"slot-101\",\n  \"vehicleId\": \"veh-001\",\n  \"licensePlate\": \"51A-12345\",\n  \"startTime\": \"2026-07-20T08:00:00Z\",\n  \"endTime\": \"2026-07-20T12:00:00Z\"\n}\nResponse:\n  status: 200 OK\n  data:\n  {\n    \"success\": true,\n    \"data\": {\n      \"reservationId\": \"res-001\",\n      \"paymentStatus\": \"Pending\",\n      \"paymentUrl\": \"<payment_url>\",\n      \"expiresAt\": \"2026-07-20T07:10:00Z\"\n    }\n  }"
              },
              {
                id: "contract-get-reservations-payment-status",
                name: "GET /api/core/reservations/{id}/payment-status",
                content: "Method: GET\nPath: /api/core/reservations/{id}/payment-status\nHeaders:\n  Authorization: Bearer <token>\nResponse:\n  status: 200 OK\n  data:\n  {\n    \"success\": true,\n    \"data\": {\n      \"reservationId\": \"res-001\",\n      \"paymentStatus\": \"Paid\"\n    }\n  }"
              }
            ],
            testCases: [
              {
                id: "tc-res-create-driver-success",
                title: "Verify authorized client (Driver) can access \"Create Reservation\" successfully",
                type: "api",
                precondition: "Client is authenticated with role: Driver",
                steps: [
                  "Authenticate user as Driver",
                  "Invoke endpoint: POST /api/core/reservations",
                  "Check response code is 200/201 OK"
                ],
                expectedResult: "Request succeeds and returns correct payload",
                status: "not_started"
              },
              {
                id: "tc-res-create-unauthorized",
                title: "Verify unauthorized role is rejected when accessing \"Create Reservation\"",
                type: "api",
                precondition: "User is anonymous or lacks required role",
                steps: [
                  "Attempt to invoke endpoint: POST /api/core/reservations without token/role",
                  "Check response status code is 401 Unauthorized or 403 Forbidden"
                ],
                expectedResult: "Request is blocked and returns clear error response",
                status: "not_started"
              },
              {
                id: "tc-res-create-vehicle-associated",
                title: "Verify reservation is associated with a specific vehicle",
                type: "integration",
                expectedResult: "Reservation cannot be created without a valid vehicle/license plate.",
                status: "not_started"
              },
              {
                id: "tc-res-create-temporary-lock",
                title: "Verify temporary slot lock is created",
                type: "integration",
                expectedResult: "Selected slot is locked for 5–10 minutes while waiting for payment.",
                status: "not_started"
              },
              {
                id: "tc-res-create-confirm-after-payment",
                title: "Verify reservation is confirmed after successful payment",
                type: "integration",
                expectedResult: "Reservation status becomes Confirmed and payment status becomes Paid.",
                status: "not_started"
              },
              {
                id: "tc-res-create-unpaid-expiry",
                title: "Verify unpaid reservation expires automatically",
                type: "integration",
                expectedResult: "Temporary slot lock is released after timeout when payment is not completed.",
                status: "not_started"
              },
              {
                id: "tc-res-create-expired-token-rejected",
                title: "Verify request with expired reservation or session token is rejected",
                type: "integration",
                expectedResult: "System returns validation error stating resource has expired.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-res-create-contract", content: "API contract is documented in this node.", checked: false },
              { id: "dc-res-create-roles", content: "Required clients/roles are assigned.", checked: false },
              { id: "dc-res-create-export", content: "Business rules and inherited rules are visible in AI export.", checked: false },
              { id: "dc-res-create-response-format", content: "Success response uses common API response format where applicable.", checked: false },
              { id: "dc-res-create-error-safe", content: "Error response is clear and does not leak sensitive data.", checked: false },
              { id: "dc-res-create-vehicle-associated", content: "Reservation is associated with a specific vehicle/license plate.", checked: false },
              { id: "dc-res-create-temp-lock", content: "Temporary slot lock mechanism is implemented.", checked: false },
              { id: "dc-res-create-confirm-paid", content: "Reservation is confirmed only after payment status becomes Paid.", checked: false },
              { id: "dc-res-create-payment-verification", content: "Payment verification integration is functional.", checked: false },
              { id: "dc-res-create-expiration-release", content: "Automatic expiration releases unpaid slot locks.", checked: false },
              { id: "dc-res-create-test-cases", content: "At least two test cases are defined.", checked: false },
              { id: "dc-res-create-ai-export", content: "Feature can be exported as AI-readable Markdown.", checked: false },
              { id: "dc-res-create-ui-states", content: "UI states are documented: idle, loading, success, empty, error.", checked: false },
              { id: "dc-res-create-ui-validation", content: "Validation and error display behavior are documented.", checked: false },
              { id: "dc-res-create-edge-cases", content: "Edge cases are documented.", checked: false },
              { id: "dc-res-create-state-transitions", content: "Payment/session/reservation state transition is documented.", checked: false }
            ]
          },
          {
            id: "leaf-res-extend",
            title: "Extend Reservation",
            type: "leaf_feature",
            clients: ["Driver"],
            status: "ready",
            priority: "medium",
            tags: ["reservation", "booking", "extend-reservation"],
            summary: "Support drivers in extending the duration of an ongoing reservation. The system automatically recalculates the additional fee based on the extended reservation time before confirming the extension.",
            objective: "Implement transaction-safe reservation extension APIs in .NET Core API that validate extension eligibility, conflict-free scheduling, recalculate fee based on current pricing, and update reservation timings.",
            inScope: [
              "Allow drivers to extend an active reservation.",
              "Validate that the reservation is still eligible for extension.",
              "Check slot availability for the requested extended period.",
              "Detect scheduling conflicts with existing reservations.",
              "Recalculate the additional fee based on the extended duration.",
              "Update the reservation end time after successful extension."
            ],
            outOfScope: [
              "Creating a new reservation.",
              "Reservation cancellation.",
              "External system integrations not specified in this document."
            ],
            permissions: [
              { role: "Driver", permission: "Authorized to access this feature." }
            ],
            businessRules: [
              "Extension is only allowed when the reservation is still in a valid state (not yet expired).",
              "The system must check whether the current parking slot has another reservation immediately after the original reservation period before allowing an extension.",
              "The extension fee must be calculated according to the current hourly reservation pricing.",
              "Reservation extension must not create overlapping reservations for the same parking slot."
            ],
            dbExistingTables: [
              "reservations",
              "reservation_payments",
              "parking_slots",
              "parking_locations",
              "pricing_policies"
            ],
            dbNewTablesSql: "",
            dbRelationships: [
              "Reservation extension updates the existing reservation.",
              "Additional fee is calculated using the active hourly pricing policy.",
              "Slot availability must be checked before updating the reservation end time."
            ],
            validationRules: [
              { field: "id", rule: "Must exist", errorMessage: "Reservation does not exist." },
              { field: "newEndTime", rule: "Required, must be greater than current reservation end time", errorMessage: "New end time must be later than the current reservation end time." },
              { field: "Reservation Status", rule: "Must be active", errorMessage: "Reservation is no longer eligible for extension." }
            ],
            securityRules: [
              "Validate role permissions.",
              "Prevent unauthorized access.",
              "Do not log sensitive data."
            ],
            logEvents: [
              "Log request access, inputs, duration, and response code.",
              "Log reservation extension requests.",
              "Log additional fee calculations.",
              "Log reservation extension success or failure."
            ],
            noLogEvents: [
              "Passwords, access tokens, refresh tokens, and credit card details."
            ],
            integrationPoints: [],
            uiPage: "/driver/reservations/extend",
            uiComponents: "Reservation Detail Viewer, Extension Configurator, Time Selector, Cost Estimator, Submit Button",
            uiStateIdle: "Display the current reservation information and extension option.",
            uiStateLoading: "Disable the confirmation button while processing the extension request.",
            uiStateSuccess: "Display the updated reservation end time and additional fee.",
            uiStateError: "Display validation errors or scheduling conflict messages.",
            endpoints: ["POST /api/core/reservations/{id}/extend"],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-post-reservations-extend",
                name: "POST /api/core/reservations/{id}/extend",
                content: "Method: POST\nPath: /api/core/reservations/{id}/extend\nHeaders:\n  Authorization: Bearer <token>\nRequest Body:\n{\n  \"newEndTime\": \"2026-07-20T15:00:00Z\"\n}\nResponse:\n  status: 200 OK\n  data:\n  {\n    \"success\": true,\n    \"data\": {\n      \"reservationId\": \"res-001\",\n      \"previousEndTime\": \"2026-07-20T13:00:00Z\",\n      \"newEndTime\": \"2026-07-20T15:00:00Z\",\n      \"additionalFee\": 50000\n    }\n  }"
              }
            ],
            testCases: [
              {
                id: "tc-res-extend-driver-success",
                title: "Verify authorized client (Driver) can access \"Extend Reservation\" successfully",
                type: "api",
                precondition: "Client is authenticated with role: Driver",
                steps: [
                  "Authenticate user as Driver",
                  "Invoke endpoint: POST /api/core/reservations/{id}/extend",
                  "Check response code is 200/201 OK"
                ],
                expectedResult: "Request succeeds and returns correct payload",
                status: "not_started"
              },
              {
                id: "tc-res-extend-unauthorized",
                title: "Verify unauthorized role is rejected when accessing \"Extend Reservation\"",
                type: "api",
                precondition: "User is anonymous or lacks required role",
                steps: [
                  "Attempt to invoke endpoint: POST /api/core/reservations/{id}/extend without token/role",
                  "Check response status code is 401 Unauthorized or 403 Forbidden"
                ],
                expectedResult: "Request is blocked and returns clear error response",
                status: "not_started"
              },
              {
                id: "tc-res-extend-expired-rejected",
                title: "Verify expired reservation cannot be extended",
                type: "integration",
                expectedResult: "System rejects the extension request for expired reservations.",
                status: "not_started"
              },
              {
                id: "tc-res-extend-conflict-rejected",
                title: "Verify extension is rejected when slot has a conflicting reservation",
                type: "integration",
                expectedResult: "System detects the scheduling conflict and rejects the extension.",
                status: "not_started"
              },
              {
                id: "tc-res-extend-fee-correct",
                title: "Verify additional fee is calculated correctly",
                type: "integration",
                expectedResult: "Additional fee matches the current hourly pricing policy.",
                status: "not_started"
              },
              {
                id: "tc-res-extend-success-updates-end-time",
                title: "Verify successful reservation extension updates reservation end time",
                type: "integration",
                expectedResult: "Reservation end time is updated and extension details are returned.",
                status: "not_started"
              },
              {
                id: "tc-res-extend-expired-token-rejected",
                title: "Verify request with expired reservation or session token is rejected",
                type: "integration",
                expectedResult: "System returns validation error stating resource has expired.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-res-extend-contract", content: "API contract is documented in this node.", checked: false },
              { id: "dc-res-extend-roles", content: "Required clients/roles are assigned.", checked: false },
              { id: "dc-res-extend-export", content: "Business rules and inherited rules are visible in AI export.", checked: false },
              { id: "dc-res-extend-response-format", content: "Success response uses common API response format where applicable.", checked: false },
              { id: "dc-res-extend-error-safe", content: "Error response is clear and does not leak sensitive data.", checked: false },
              { id: "dc-res-extend-valid-only", content: "Reservation can only be extended while it is still valid.", checked: false },
              { id: "dc-res-extend-conflict", content: "Slot conflict validation is implemented.", checked: false },
              { id: "dc-res-extend-fee-calc", content: "Additional fee is calculated using the current hourly pricing.", checked: false },
              { id: "dc-res-extend-updates-end", content: "Reservation end time is updated successfully after validation.", checked: false },
              { id: "dc-res-extend-test-cases", content: "At least two test cases are defined.", checked: false },
              { id: "dc-res-extend-ai-export", content: "Feature can be exported as AI-readable Markdown.", checked: false },
              { id: "dc-res-extend-edge-cases", content: "Edge cases are documented.", checked: false },
              { id: "dc-res-extend-state-transitions", content: "Payment/session/reservation state transition is documented.", checked: false }
            ]
          },
          {
            id: "leaf-res-cancel",
            title: "Cancel Reservation",
            type: "leaf_feature",
            clients: ["Driver"],
            status: "ready",
            priority: "high",
            tags: ["reservation", "booking", "cancel-reservation"],
            summary: "Allow drivers to cancel an existing reservation. The system immediately releases the reserved parking slot and initiates the refund process if the reservation satisfies the configured refund policy.",
            objective: "Implement transaction-safe reservation cancellation APIs in .NET Core API that validate cancellation eligibility, release slot immediately, trigger refund calculation based on refund policy, and log details.",
            inScope: [
              "Allow drivers to cancel an existing reservation.",
              "Validate whether the reservation is eligible for cancellation.",
              "Release the reserved parking slot immediately after successful cancellation.",
              "Calculate refund amount according to the cancellation policy.",
              "Trigger the refund process when applicable.",
              "Record the cancellation reason when provided.",
              "Update parking capacity immediately after cancellation."
            ],
            outOfScope: [
              "Reservation modification.",
              "Manual refund processing.",
              "External system integrations not specified in this document."
            ],
            permissions: [
              { role: "Driver", permission: "Authorized to access this feature." }
            ],
            businessRules: [
              "Reservations cancelled at least X minutes (e.g., 30 minutes) before the reservation start time receive a full refund.",
              "Last-minute cancellations are subject to the configured cancellation fee.",
              "Parking slots from cancelled reservations must immediately transition back to the available state.",
              "Parking capacity must be updated immediately after a successful cancellation.",
              "The cancellation reason should be recorded when provided."
            ],
            dbExistingTables: [
              "reservations",
              "reservation_payments",
              "parking_slots",
              "parking_locations",
              "payments",
              "refunds"
            ],
            dbNewTablesSql: "",
            dbRelationships: [
              "Reservation status changes to Cancelled after successful cancellation.",
              "Reserved parking slot immediately changes to Available.",
              "Refund amount is determined according to the configured cancellation policy.",
              "Parking capacity must be updated immediately after cancellation."
            ],
            validationRules: [
              { field: "id", rule: "Must exist", errorMessage: "Reservation does not exist." },
              { field: "Reservation Status", rule: "Must be active", errorMessage: "Reservation cannot be cancelled." },
              { field: "reason", rule: "Optional, maximum 500 characters", errorMessage: "Cancellation reason is too long." }
            ],
            securityRules: [
              "Validate role permissions.",
              "Prevent unauthorized access.",
              "Do not log sensitive data."
            ],
            logEvents: [
              "Log request access, inputs, duration, and response code.",
              "Log reservation cancellation.",
              "Log cancellation reason when provided.",
              "Log refund processing.",
              "Log parking capacity update."
            ],
            noLogEvents: [
              "Passwords, access tokens, refresh tokens, and credit card details."
            ],
            integrationPoints: [
              { system: "Internal parking management API", responsibility: "Update parking capacity immediately after successful cancellation." },
              { system: "Refund workflow", responsibility: "Trigger refund processing according to configured refund policy." }
            ],
            uiPage: "/driver/reservations",
            uiComponents: "Reservation Detail Viewer, Cancel Confirmation Dialog, Reason Input Area, Cancellation Success Screen",
            uiStateIdle: "Display reservation details with a Cancel Reservation button.",
            uiStateLoading: "Disable actions while cancellation is being processed.",
            uiStateSuccess: "Display cancellation confirmation and refund information.",
            uiStateError: "Display validation errors or cancellation failure messages.",
            endpoints: ["POST /api/core/reservations/{id}/cancel"],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-post-reservations-cancel",
                name: "POST /api/core/reservations/{id}/cancel",
                content: "Method: POST\nPath: /api/core/reservations/{id}/cancel\nHeaders:\n  Authorization: Bearer <token>\nRequest Body:\n{\n  \"reason\": \"Changed travel plan\"\n}\nResponse:\n  status: 200 OK\n  data:\n  {\n    \"success\": true,\n    \"data\": {\n      \"reservationId\": \"res-001\",\n      \"status\": \"Cancelled\",\n      \"refundStatus\": \"Processing\",\n      \"refundAmount\": 100000\n    }\n  }"
              }
            ],
            testCases: [
              {
                id: "tc-res-cancel-driver-success",
                title: "Verify authorized client (Driver) can access \"Cancel Reservation\" successfully",
                type: "api",
                precondition: "Client is authenticated with role: Driver",
                steps: [
                  "Authenticate user as Driver",
                  "Invoke endpoint: POST /api/core/reservations/{id}/cancel",
                  "Check response code is 200/201 OK"
                ],
                expectedResult: "Request succeeds and returns correct payload",
                status: "not_started"
              },
              {
                id: "tc-res-cancel-unauthorized",
                title: "Verify unauthorized role is rejected when accessing \"Cancel Reservation\"",
                type: "api",
                precondition: "User is anonymous or lacks required role",
                steps: [
                  "Attempt to invoke endpoint: POST /api/core/reservations/{id}/cancel without token/role",
                  "Check response status code is 401 Unauthorized or 403 Forbidden"
                ],
                expectedResult: "Request is blocked and returns clear error response",
                status: "not_started"
              },
              {
                id: "tc-res-cancel-full-refund",
                title: "Verify full refund is applied for early cancellation",
                type: "integration",
                expectedResult: "Reservation cancelled before the configured time threshold receives a 100% refund.",
                status: "not_started"
              },
              {
                id: "tc-res-cancel-late-fee",
                title: "Verify cancellation fee is applied for late cancellation",
                type: "integration",
                expectedResult: "System deducts the configured cancellation fee before processing the refund.",
                status: "not_started"
              },
              {
                id: "tc-res-cancel-releases-slot",
                title: "Verify cancelled reservation immediately releases parking slot",
                type: "integration",
                expectedResult: "Parking slot status changes to Available and parking capacity is updated.",
                status: "not_started"
              },
              {
                id: "tc-res-cancel-reason-recorded",
                title: "Verify cancellation reason is recorded",
                type: "integration",
                expectedResult: "Cancellation reason is successfully stored in the system log or database.",
                status: "not_started"
              },
              {
                id: "tc-res-cancel-expired-token-rejected",
                title: "Verify request with expired reservation or session token is rejected",
                type: "integration",
                expectedResult: "System returns validation error stating resource has expired.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-res-cancel-contract", content: "API contract is documented in this node.", checked: false },
              { id: "dc-res-cancel-roles", content: "Required clients/roles are assigned.", checked: false },
              { id: "dc-res-cancel-export", content: "Business rules and inherited rules are visible in AI export.", checked: false },
              { id: "dc-res-cancel-response-format", content: "Success response uses common API response format where applicable.", checked: false },
              { id: "dc-res-cancel-error-safe", content: "Error response is clear and does not leak sensitive data.", checked: false },
              { id: "dc-res-cancel-driver-action", content: "Reservation can be cancelled by the driver.", checked: false },
              { id: "dc-res-cancel-policy-refund", content: "Refund amount follows the configured cancellation policy.", checked: false },
              { id: "dc-res-cancel-late-fee", content: "Late cancellation fee is applied correctly.", checked: false },
              { id: "dc-res-cancel-slot-release", content: "Cancelled parking slots immediately become available.", checked: false },
              { id: "dc-res-cancel-capacity-update", content: "Parking capacity is updated after cancellation.", checked: false },
              { id: "dc-res-cancel-refund-workflow", content: "Refund process is triggered when applicable.", checked: false },
              { id: "dc-res-cancel-test-cases", content: "At least two test cases are defined.", checked: false },
              { id: "dc-res-cancel-ai-export", content: "Feature can be exported as AI-readable Markdown.", checked: false },
              { id: "dc-res-cancel-edge-cases", content: "Edge cases are documented.", checked: false },
              { id: "dc-res-cancel-state-transitions", content: "Payment/session/reservation state transition is documented.", checked: false }
            ]
          },
          {
            id: "leaf-res-driver-history",
            title: "Driver Reservation History",
            type: "leaf_feature",
            clients: ["Driver"],
            status: "ready",
            priority: "low",
            tags: ["reservation", "booking", "driver-reservation-history"],
            summary: "Provide an interface for drivers to review their complete reservation history, including reservation details, statuses (Completed, Cancelled, Expired, etc.), and corresponding payment information.",
            objective: "Implement high-performance read-only query APIs in Spring Boot Support API to fetch active reservations and paginated reservation history with date filters for the authenticated driver.",
            inScope: [
              "Retrieve the driver's active reservations.",
              "Retrieve the driver's reservation history.",
              "Display reservation status and payment information.",
              "Support pagination for reservation history.",
              "Support filtering reservation history by time range.",
              "Return reservation records belonging only to the authenticated driver."
            ],
            outOfScope: [
              "Reservation creation or modification.",
              "Reservation cancellation.",
              "External system integrations not specified in this document."
            ],
            permissions: [
              { role: "Driver", permission: "Authorized to access this feature." }
            ],
            businessRules: [
              "Drivers are only permitted to query and view the reservation history belonging to their own account.",
              "Reservation history must support pagination.",
              "Reservation history must support filtering by time range.",
              "Historical reservation records include completed, cancelled, expired, and other supported reservation statuses."
            ],
            dbExistingTables: [
              "reservations",
              "reservation_payments",
              "payments",
              "parking_locations",
              "vehicles"
            ],
            dbNewTablesSql: "",
            dbRelationships: [
              "Reservation history is queried based on the authenticated driver's account.",
              "Payment information is retrieved from the associated reservation payment records.",
              "Historical data includes reservation status and payment status."
            ],
            validationRules: [
              { field: "page", rule: "Must be greater than 0", errorMessage: "Invalid page number." },
              { field: "size", rule: "Must be greater than 0", errorMessage: "Invalid page size." },
              { field: "fromDate", rule: "Must be earlier than or equal to toDate", errorMessage: "Invalid date range." },
              { field: "toDate", rule: "Must be later than or equal to fromDate", errorMessage: "Invalid date range." }
            ],
            securityRules: [
              "Validate role permissions.",
              "Prevent unauthorized access.",
              "Drivers may only access their own reservation history.",
              "Do not log sensitive data."
            ],
            logEvents: [
              "Log request access, inputs, duration, and response code.",
              "Log reservation history queries.",
              "Log pagination and filter parameters."
            ],
            noLogEvents: [
              "Passwords, access tokens, refresh tokens, and credit card details."
            ],
            integrationPoints: [],
            uiPage: "/driver/reservations/history",
            uiComponents: "Reservation History Table, Active Reservations Cards, Date Range Filters, Pagination Controls, Payment Detail Modal",
            uiStateIdle: "Display reservation history list.",
            uiStateLoading: "Display loading indicator while retrieving history.",
            uiStateSuccess: "Display reservation history with payment information.",
            uiStateEmpty: "Display message when no reservation history exists.",
            uiStateError: "Display validation or system error messages.",
            endpoints: [
              "GET /api/support/reservations/me/active",
              "GET /api/support/reservations/me/history"
            ],
            ownerService: "Spring Boot Support API",
            apiContracts: [
              {
                id: "contract-get-reservations-me-history",
                name: "GET /api/support/reservations/me/history",
                content: "Method: GET\nPath: /api/support/reservations/me/history\nHeaders:\n  Authorization: Bearer <token>\nQuery Parameters:\n  page: integer (optional)\n  size: integer (optional)\n  fromDate: datetime (optional)\n  toDate: datetime (optional)\nResponse:\n  status: 200 OK\n  data:\n  {\n    \"success\": true,\n    \"data\": {\n      \"items\": [\n        {\n          \"reservationId\": \"res-001\",\n          \"status\": \"Completed\",\n          \"paymentStatus\": \"Paid\",\n          \"bookingAmount\": 120000,\n          \"reservationTime\": \"2026-07-20T08:00:00Z\"\n        }\n      ],\n      \"page\": 1,\n      \"size\": 10,\n      \"totalItems\": 50\n    }\n  }"
              }
            ],
            testCases: [
              {
                id: "tc-res-history-driver-success",
                title: "Verify authorized client (Driver) can access \"Driver Reservation History\" successfully",
                type: "api",
                precondition: "Client is authenticated with role: Driver",
                steps: [
                  "Authenticate user as Driver",
                  "Invoke endpoint: GET /api/support/reservations/me/history",
                  "Check response code is 200/201 OK"
                ],
                expectedResult: "Request succeeds and returns correct payload",
                status: "not_started"
              },
              {
                id: "tc-res-history-unauthorized",
                title: "Verify unauthorized role is rejected when accessing \"Driver Reservation History\"",
                type: "api",
                precondition: "User is anonymous or lacks required role",
                steps: [
                  "Attempt to invoke endpoint: GET /api/support/reservations/me/history without token/role",
                  "Check response status code is 401 Unauthorized or 403 Forbidden"
                ],
                expectedResult: "Request is blocked and returns clear error response",
                status: "not_started"
              },
              {
                id: "tc-res-history-own-only",
                title: "Verify drivers can only view their own reservation history",
                type: "integration",
                expectedResult: "System returns only reservation records belonging to the authenticated driver.",
                status: "not_started"
              },
              {
                id: "tc-res-history-pagination",
                title: "Verify pagination works correctly",
                type: "integration",
                expectedResult: "Reservation history is returned according to the requested page and page size.",
                status: "not_started"
              },
              {
                id: "tc-res-history-time-filter",
                title: "Verify time filter returns correct reservation history",
                type: "integration",
                expectedResult: "Only reservation records within the specified date range are returned.",
                status: "not_started"
              },
              {
                id: "tc-res-history-expired-token-rejected",
                title: "Verify request with expired reservation or session token is rejected",
                type: "integration",
                expectedResult: "System returns validation error stating resource has expired.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-res-history-contract", content: "API contract is documented in this node.", checked: false },
              { id: "dc-res-history-roles", content: "Required clients/roles are assigned.", checked: false },
              { id: "dc-res-history-export", content: "Business rules and inherited rules are visible in AI export.", checked: false },
              { id: "dc-res-history-response-format", content: "Success response uses common API response format where applicable.", checked: false },
              { id: "dc-res-history-error-safe", content: "Error response is clear and does not leak sensitive data.", checked: false },
              { id: "dc-res-history-own-only", content: "Drivers can only access their own reservation history.", checked: false },
              { id: "dc-res-history-details", content: "Reservation history includes reservation status and payment information.", checked: false },
              { id: "dc-res-history-pagination", content: "Pagination is implemented.", checked: false },
              { id: "dc-res-history-time-filter", content: "Time range filtering is implemented.", checked: false },
              { id: "dc-res-history-test-cases", content: "At least two test cases are defined.", checked: false },
              { id: "dc-res-history-ai-export", content: "Feature can be exported as AI-readable Markdown.", checked: false },
              { id: "dc-res-history-edge-cases", content: "Edge cases are documented.", checked: false },
              { id: "dc-res-history-state-transitions", content: "Payment/session/reservation state transition is documented.", checked: false }
            ]
          },
        ]
      },

      // 8. Parking Session
      {
        id: "cat-session",
        title: "Parking Session",
        type: "category",
        summary: "Active check-in entry to check-out exit transactional sessions.",
        businessRules: [
          "A parking session starts at vehicle entry and ends after successful exit processing.",
          "Entry requires card/session information, plate information, gate, and location decision.",
          "Exit fee must be calculated before completing casual exit.",
          "Monthly pass exit must validate an active monthly pass.",
          "Staff operations must be protected by role authorization."
        ],
        children: [
          {
            id: "leaf-sess-entry",
            title: "Vehicle Entry",
            type: "leaf_feature",
            clients: ["Staff"],
            endpoints: [
              "POST /api/core/parking-sessions/entry",
              "GET /api/core/reservations/{reservationCode}/entry-check",
              "GET /api/core/parking-sessions/location-suggestion"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/parking-sessions/entry"),
            testCases: defaultApiTests("Vehicle Entry", ["Staff"], ["POST /api/core/parking-sessions/entry"]),
            doneCriteria: [
              ...defaultDoneCriteria("Vehicle Entry"),
              { id: "dc-sess-res-check", content: "Integration checking driver pre-bookings works.", checked: false },
              { id: "dc-sess-suggest", content: "Integration proposing available floor space layout works.", checked: false }
            ]
          },
          {
            id: "leaf-sess-claim",
            title: "Claim Session by QR",
            type: "leaf_feature",
            clients: ["Driver"],
            endpoints: ["POST /api/core/parking-sessions/{qrToken}/claim"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/parking-sessions/{qrToken}/claim"),
            testCases: defaultApiTests("Claim Session by QR", ["Driver"], ["POST /api/core/parking-sessions/{qrToken}/claim"]),
            doneCriteria: defaultDoneCriteria("Claim Session by QR")
          },
          {
            id: "leaf-sess-exit",
            title: "Vehicle Exit",
            type: "leaf_feature",
            clients: ["Staff"],
            endpoints: [
              "POST /api/core/parking-sessions/{id}/exit",
              "GET /api/core/parking-sessions/by-card-code/{cardCode}",
              "POST /api/core/parking-sessions/{id}/calculate-fee",
              "POST /api/core/parking-sessions/{id}/monthly-pass-exit"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/parking-sessions/{id}/exit"),
            testCases: defaultApiTests("Casual Exit", ["Staff"], ["POST /api/core/parking-sessions/{id}/exit"]),
            doneCriteria: [
              ...defaultDoneCriteria("Vehicle Exit"),
              { id: "dc-sess-find", content: "Card RFID scanning loads correct active session.", checked: false },
              { id: "dc-sess-calc", content: "Accurate fee calculation based on active pricing scheme.", checked: false },
              { id: "dc-sess-monthly-exit", content: "Seamless gate exit for registered monthly pass vehicles.", checked: false }
            ]
          },
          {
            id: "leaf-mp-validation",
            title: "Monthly Pass Check During Entry Exit",
            type: "leaf_feature",
            clients: ["Staff", "System"],
            endpoints: [
              "GET /api/core/monthly-passes/check"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/monthly-passes/check"),
            testCases: defaultApiTests("Monthly Pass Check During Entry Exit", ["Staff"], ["GET /api/core/monthly-passes/check"]),
            doneCriteria: defaultDoneCriteria("Monthly Pass Check During Entry Exit")
          }
        ]
      },

      // 9. Payment
      {
        id: "cat-payment",
        title: "Payment",
        type: "category",
        summary: "Checkout pathways including cash, waived permissions, and PayOS integrations.",
        businessRules: [
          "PayOS webhook must verify payment data before marking payment as paid.",
          "Exit online payment must be linked to an existing active parking session.",
          "Cash payment must be created only by authorized staff/manager flow.",
          "Waived payment must require a reason and authorized role.",
          "Amount mismatches or uncertain provider status should be treated as review cases instead of blindly succeeding."
        ],
        children: [
          {
            id: "leaf-pay-webhook",
            title: "PayOS Webhook",
            type: "leaf_feature",
            clients: ["System"],
            endpoints: ["POST /api/core/payments/payos/webhook"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/payments/payos/webhook"),
            testCases: defaultApiTests("PayOS Webhook", ["System"], ["POST /api/core/payments/payos/webhook"]),
            doneCriteria: defaultDoneCriteria("PayOS Webhook")
          },
          {
            id: "leaf-pay-online",
            title: "Online Exit Fee Payment",
            type: "leaf_feature",
            clients: ["Staff", "Driver"],
            endpoints: ["POST /api/core/payments/online/exit-fee"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/payments/online/exit-fee"),
            testCases: defaultApiTests("Online Exit Fee Payment", ["Driver"], ["POST /api/core/payments/online/exit-fee"]),
            doneCriteria: defaultDoneCriteria("Online Exit Fee Payment")
          },
          {
            id: "leaf-pay-cash",
            title: "Cash Payment",
            type: "leaf_feature",
            clients: ["Staff", "Manager"],
            endpoints: ["POST /api/core/payments/cash"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/payments/cash"),
            testCases: defaultApiTests("Cash Payment", ["Staff"], ["POST /api/core/payments/cash"]),
            doneCriteria: defaultDoneCriteria("Cash Payment")
          },
          {
            id: "leaf-pay-waived",
            title: "Waived Payment",
            type: "leaf_feature",
            clients: ["Staff", "Manager"],
            endpoints: ["POST /api/core/payments/waive"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/payments/waive"),
            testCases: defaultApiTests("Waived Payment", ["Manager"], ["POST /api/core/payments/waive"]),
            doneCriteria: defaultDoneCriteria("Waived Payment")
          },
          {
            id: "leaf-pay-reconcile",
            title: "Reservation Payment Reconciliation",
            type: "leaf_feature",
            clients: ["System"],
            endpoints: [],
            ownerService: ".NET Core API",
            testCases: defaultApiTests("Reservation Payment Reconciliation", ["System"], []),
            doneCriteria: defaultDoneCriteria("Reservation Payment Reconciliation")
          },
          {
            id: "leaf-pay-review",
            title: "Payment Review / Mismatch Handling",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: [],
            ownerService: ".NET Core API",
            testCases: defaultApiTests("Payment Review / Mismatch Handling", ["Manager"], []),
            doneCriteria: defaultDoneCriteria("Payment Review / Mismatch Handling")
          }
        ]
      },

      // 10. Pricing & Fee Calculation
      {
        id: "cat-pricing",
        title: "Pricing & Fee Calculation",
        type: "category",
        summary: "CRUD parameters for vehicle groups pricing plans.",
        businessRules: [
          "Pricing rules must be configurable by vehicle type.",
          "Reservation hourly price must be configurable.",
          "Lost card fee and monthly price should be included in pricing-related contracts.",
          "Fee calculation must use active pricing rules."
        ],
        children: [
          {
            id: "leaf-price-crud",
            title: "Pricing Rule CRUD",
            type: "leaf_feature",
            clients: ["Admin", "Manager"],
            endpoints: [
              "GET /api/core/pricing-rules",
              "GET /api/core/pricing-rules/{id}",
              "POST /api/core/pricing-rules",
              "PUT /api/core/pricing-rules/{id}",
              "DELETE /api/core/pricing-rules/{id}",
              "PATCH /api/core/pricing-rules/{id}/reservation-hourly-price"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/pricing-rules"),
            testCases: defaultApiTests("Pricing Rule CRUD", ["Manager"], ["GET /api/core/pricing-rules"]),
            doneCriteria: [
              ...defaultDoneCriteria("Pricing Rule CRUD"),
              { id: "dc-price-patch", content: "Reservation hourly rates can be modified dynamically.", checked: false },
              { id: "dc-price-lost", content: "Pricing configurations include card loss penalties.", checked: false }
            ]
          },
          {
            id: "leaf-price-public",
            title: "Public Pricing",
            type: "leaf_feature",
            clients: ["Guest", "Driver"],
            endpoints: ["GET /api/public/pricing"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/public/pricing"),
            testCases: defaultApiTests("Public Pricing", ["Guest"], ["GET /api/public/pricing"]),
            doneCriteria: defaultDoneCriteria("Public Pricing")
          }
        ]
      },

      // 11. Monthly Pass
      {
        id: "cat-monthly-pass",
        title: "Monthly Pass",
        type: "category",
        summary: "Management of registered commuters parking subscriptions.",
        businessRules: [
          "Monthly pass validity depends on plate number, vehicle type, active status, and valid time range.",
          "Renewal must extend or recreate a valid pass period.",
          "Monthly pass exit must not charge casual parking fee if the pass is valid."
        ],
        children: [
          {
            id: "leaf-mp-app-review",
            title: "Monthly Pass Application Review",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: [
              "GET /api/core/monthly-passes/applications",
              "PATCH /api/core/monthly-passes/applications/{id}/status"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/monthly-passes/applications"),
            testCases: defaultApiTests("Monthly Pass Application Review", ["Manager"], ["GET /api/core/monthly-passes/applications"]),
            doneCriteria: defaultDoneCriteria("Monthly Pass Application Review")
          },
          {
            id: "leaf-mp-card-manage",
            title: "Monthly Pass Card Management",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: [
              "GET /api/core/monthly-passes",
              "POST /api/core/monthly-passes",
              "PUT /api/core/monthly-passes/{id}",
              "PATCH /api/core/monthly-passes/{id}/status"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/monthly-passes"),
            testCases: defaultApiTests("Monthly Pass Card Management", ["Manager"], ["GET /api/core/monthly-passes"]),
            doneCriteria: [
              ...defaultDoneCriteria("Monthly Pass Card Management"),
              { id: "dc-mp-validity", content: "Card scans check monthly pass validity instantly.", checked: false }
            ]
          },
          {
            id: "leaf-mp-renew",
            title: "Renew Monthly Pass",
            type: "leaf_feature",
            clients: ["Driver", "Staff"],
            endpoints: ["POST /api/core/monthly-passes/{id}/renew"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/monthly-passes/{id}/renew"),
            testCases: defaultApiTests("Renew Monthly Pass", ["Driver"], ["POST /api/core/monthly-passes/{id}/renew"]),
            doneCriteria: defaultDoneCriteria("Renew Monthly Pass")
          }
        ]
      },

      // 12. Lost Card & Incidents
      {
        id: "cat-incidents",
        title: "Lost Card & Incidents",
        type: "category",
        summary: "Incidents manual handling and document storage for lost cards.",
        children: [
          {
            id: "leaf-inc-lost-card",
            title: "Lost Card Claim Management",
            type: "leaf_feature",
            clients: ["Staff", "Manager"],
            status: "draft",
            priority: "high",
            tags: ["lost-card", "incidents", "claim-management"],
            summary: "Provide a complete workflow for staff to record and process lost parking card claims. The feature supports collecting customer information, uploading proof of vehicle ownership, calculating lost card penalties, and issuing a temporary or replacement ticket that allows the customer to exit the parking building safely.",
            objective: "Implement transactional APIs and secure document management flows in .NET Core API to process lost parking card claims, blacklist cards, calculate penalties, and issue replacement tickets.",
            inScope: [
              "Record a lost parking card claim.",
              "Capture customer and vehicle information.",
              "Upload and manage supporting documents.",
              "Calculate the lost card penalty fee.",
              "Issue a temporary or replacement parking ticket.",
              "Blacklist the lost parking card immediately after confirmation."
            ],
            outOfScope: [
              "Integration with external identity verification services.",
              "Payment gateway implementation.",
              "Physical RFID card printing."
            ],
            permissions: [
              { role: "Staff", permission: "Authorized to create, update, and process lost card claims." },
              { role: "Manager", permission: "Authorized to review, supervise, and process lost card claims." }
            ],
            businessRules: [
              "Lost card claims must include mandatory photo evidence of the vehicle registration and the driver's personal identification before processing.",
              "A standardized lost card penalty fee must be applied according to the parking building's policy before the vehicle is allowed to exit.",
              "Once a lost card claim is confirmed, the original parking card must immediately be marked as Blacklisted or Invalid to prevent fraudulent reuse.",
              "Supporting documents must be stored securely and linked to the lost card claim."
            ],
            dbExistingTables: [
              "lost_card_cases",
              "parking_cards",
              "users",
              "attachments"
            ],
            dbNewTablesSql: "",
            dbRelationships: [
              "Each lost card case may contain multiple supporting documents.",
              "Supporting documents are associated with one lost card case.",
              "Lost parking cards are linked to their original parking card records.",
              "Card status must be updated immediately after a lost card claim is approved."
            ],
            validationRules: [
              { field: "vehicleRegistrationImage", rule: "Required", errorMessage: "Vehicle registration image is required." },
              { field: "driverIdentificationImage", rule: "Required", errorMessage: "Driver identification image is required." },
              { field: "Uploaded File Type", rule: "Must be a supported image format", errorMessage: "Unsupported file format." },
              { field: "Uploaded File Size", rule: "Must not exceed configured size", errorMessage: "File size exceeds the allowed limit." }
            ],
            securityRules: [
              "Validate role permissions.",
              "Prevent unauthorized access.",
              "Store uploaded documents securely.",
              "Prevent direct public access to uploaded files.",
              "Immediately blacklist lost cards after successful processing.",
              "Do not log sensitive data."
            ],
            logEvents: [
              "Lost card claim creation.",
              "Document upload and deletion.",
              "Lost card approval.",
              "Lost card penalty calculation.",
              "Parking card blacklist operation.",
              "Temporary/replacement ticket issuance."
            ],
            noLogEvents: [
              "Passwords.",
              "Access tokens.",
              "Refresh tokens.",
              "Credit card details.",
              "Personal identification document images."
            ],
            integrationPoints: [
              { system: "Secure File Storage Service", responsibility: "Handle secure document uploads." },
              { system: "Parking Card Management module", responsibility: "Update card status." },
              { system: "Ticket Management module", responsibility: "Issue temporary or replacement tickets." }
            ],
            uiPage: "/staff/lost-cards",
            uiComponents: "Lost Card Claim Form, File Upload Dropzone, Penalty Calculator Display, Replacement Ticket Action Panel",
            uiStateIdle: "Display lost card claim information and uploaded documents.",
            uiStateLoading: "Display upload progress while files are being uploaded.",
            uiStateSuccess: "Display confirmation after successful processing.",
            uiStateEmpty: "Prompt staff to upload required supporting documents.",
            uiStateError: "Display validation errors or upload failures.",
            endpoints: [
              "POST /api/core/lost-cards/{caseId}/documents",
              "POST /api/core/lost-cards/{caseId}/documents/batch",
              "GET /api/core/lost-cards/{caseId}/documents",
              "DELETE /api/core/lost-cards/{caseId}/documents/{documentId}"
            ],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-post-lost-cards-documents",
                name: "POST /api/core/lost-cards/{caseId}/documents",
                content: "Method: POST\nPath: /api/core/lost-cards/{caseId}/documents\nHeaders:\n  Authorization: Bearer <token>\n  Content-Type: multipart/form-data\nRequest:\n  Files:\n    - vehicleRegistrationImage\n    - driverIdentificationImage\nResponse:\n  status: 200 OK\n  data:\n  {\n    \"success\": true,\n    \"message\": \"Documents uploaded successfully.\"\n  }"
              }
            ],
            testCases: [
              {
                id: "tc-lost-card-staff-success",
                title: "Verify authorized client (Staff) can access \"Lost Card Claim Management\" successfully",
                type: "api",
                precondition: "Client is authenticated with role: Staff",
                steps: [
                  "Authenticate user as Staff.",
                  "Invoke endpoint: GET /api/core/lost-cards/{caseId}/documents.",
                  "Check response code is 200 OK."
                ],
                expectedResult: "Request succeeds and returns the associated documents.",
                status: "not_started"
              },
              {
                id: "tc-lost-card-unauthorized",
                title: "Verify unauthorized role is rejected when accessing \"Lost Card Claim Management\"",
                type: "api",
                precondition: "User is anonymous or lacks required role.",
                steps: [
                  "Attempt to invoke endpoint without authorization."
                ],
                expectedResult: "Returns 401 Unauthorized or 403 Forbidden.",
                status: "not_started"
              },
              {
                id: "tc-lost-card-mandatory-docs",
                title: "Verify mandatory supporting documents are required",
                type: "integration",
                expectedResult: "Processing is rejected when either the driver's ID or vehicle registration image is missing.",
                status: "not_started"
              },
              {
                id: "tc-lost-card-blacklist",
                title: "Verify lost card is blacklisted after claim approval",
                type: "integration",
                expectedResult: "Parking card status changes to Blacklisted or Invalid immediately after approval.",
                status: "not_started"
              },
              {
                id: "tc-lost-card-penalty-calc",
                title: "Verify standardized penalty fee is calculated",
                type: "integration",
                expectedResult: "System calculates the correct penalty according to the configured policy before allowing exit.",
                status: "not_started"
              },
              {
                id: "tc-lost-card-replacement-ticket",
                title: "Verify replacement ticket can be issued",
                type: "integration",
                expectedResult: "System successfully issues a temporary or replacement parking ticket after claim completion.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-lost-card-contract", content: "API contract is documented in this node.", checked: false },
              { id: "dc-lost-card-roles", content: "Required clients/roles are assigned.", checked: false },
              { id: "dc-lost-card-export", content: "Business rules and inherited rules are visible in AI export.", checked: false },
              { id: "dc-lost-card-response-format", content: "Success response uses common API response format where applicable.", checked: false },
              { id: "dc-lost-card-error-safe", content: "Error response is clear and does not leak sensitive data.", checked: false },
              { id: "dc-lost-card-upload", content: "Secure document upload is implemented.", checked: false },
              { id: "dc-lost-card-validate-docs", content: "Mandatory supporting documents are validated.", checked: false },
              { id: "dc-lost-card-blacklist-action", content: "Lost parking cards are immediately blacklisted after approval.", checked: false },
              { id: "dc-lost-card-penalty-calc", content: "Standardized lost card penalties are calculated correctly.", checked: false },
              { id: "dc-lost-card-replacement-issue", content: "Temporary or replacement tickets can be issued.", checked: false },
              { id: "dc-lost-card-test-cases", content: "At least two test cases are defined.", checked: false },
              { id: "dc-lost-card-ai-export", content: "Feature can be exported as AI-readable Markdown.", checked: false },
              { id: "dc-lost-card-secure-fee", content: "Lost card documentation and replacement fee details are managed securely.", checked: false }
            ]
          },
          {
            id: "leaf-inc-mismatch",
            title: "Plate Mismatch Case",
            type: "leaf_feature",
            clients: ["Staff"],
            status: "draft",
            priority: "high",
            tags: ["lost-card", "incidents", "plate-mismatch"],
            summary: "Handle scenarios where the Automatic License Plate Recognition (ALPR) system detects a mismatch between the license plate captured at vehicle exit and the plate recorded during vehicle entry for the same parking card. The feature enables staff to manually compare entry and exit camera snapshots, verify the incident, and approve or reject the vehicle exit while maintaining a complete audit trail.",
            objective: "Implement transactional verification APIs in .NET Core API that support displaying mismatch cases, viewing snapshots side-by-side, verification decision processing, and permanent exception report logging.",
            inScope: [
              "Detect plate mismatch incidents generated by the ALPR system.",
              "Display entry and exit vehicle snapshots for manual comparison.",
              "Allow staff to approve or reject the vehicle exit.",
              "Record verification reason and staff information.",
              "Generate audit records for every manual verification.",
              "Automatically create an incident record for manager reporting after approval."
            ],
            outOfScope: [
              "Improvements to the ALPR recognition algorithm.",
              "Integration with external government vehicle databases."
            ],
            permissions: [
              { role: "Staff", permission: "Authorized to review, verify, approve, or reject plate mismatch cases." }
            ],
            businessRules: [
              "Staff must manually verify entry and exit vehicle snapshots before approving a plate mismatch case.",
              "Staff must provide a written reason or select a predefined reason (such as 'Muddy Plate', 'ALPR Misread') when approving a mismatch.",
              "Every manual verification must permanently record the staff ID, verification timestamp, decision, and reason.",
              "Every approved plate mismatch must automatically generate an incident entry for the Manager's daily exception report."
            ],
            dbExistingTables: [
              "parking_sessions",
              "parking_cards",
              "entry_exit_images",
              "users",
              "incident_cases"
            ],
            dbNewTablesSql: "",
            dbRelationships: [
              "Each plate mismatch case belongs to one parking session.",
              "Entry and exit camera images are linked to the corresponding parking session.",
              "Manual verification records are associated with the resolving staff member.",
              "Approved incidents are included in the manager's daily incident report."
            ],
            validationRules: [
              { field: "reason", rule: "Required when approving a mismatch", errorMessage: "Approval reason is required." },
              { field: "caseId", rule: "Must exist", errorMessage: "Plate mismatch case does not exist." },
              { field: "decision", rule: "Must be Approve or Reject", errorMessage: "Invalid verification decision." }
            ],
            securityRules: [
              "Validate role permissions.",
              "Prevent unauthorized access.",
              "Only authorized staff may approve or reject mismatch cases.",
              "Store verification logs securely for auditing.",
              "Do not log sensitive data."
            ],
            logEvents: [
              "Plate mismatch detection.",
              "Staff opens a mismatch case.",
              "Manual verification performed.",
              "Approval or rejection decision.",
              "Verification reason.",
              "Staff ID and timestamp.",
              "Automatic creation of manager incident report entry."
            ],
            noLogEvents: [
              "Passwords.",
              "Access tokens.",
              "Refresh tokens.",
              "Credit card details."
            ],
            integrationPoints: [
              { system: "ALPR Recognition Service", responsibility: "Feed plate mismatch detection events." },
              { system: "Camera Image Storage Service", responsibility: "Retrieve and store entry and exit snapshots." },
              { system: "Manager Daily Exception Report module", responsibility: "Include approved mismatch cases." }
            ],
            uiPage: "/staff/mismatches",
            uiComponents: "Mismatch Incidents Table, Snapshot Comparison Tool, Decision Control Dialog, Verification Form",
            uiStateIdle: "Display detected mismatch cases awaiting review.",
            uiStateLoading: "Show loading indicator while retrieving images.",
            uiStateSuccess: "Display confirmation after approval or rejection.",
            uiStateEmpty: "Display 'No plate mismatch cases found.'",
            uiStateError: "Display validation or processing errors.",
            endpoints: [
              "GET /api/core/incidents/plate-mismatches",
              "GET /api/core/incidents/plate-mismatches/{caseId}",
              "POST /api/core/incidents/plate-mismatches/{caseId}/approve",
              "POST /api/core/incidents/plate-mismatches/{caseId}/reject"
            ],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-post-mismatches-approve",
                name: "POST /api/core/incidents/plate-mismatches/{caseId}/approve",
                content: "Method: POST\nPath: /api/core/incidents/plate-mismatches/{caseId}/approve\nHeaders:\n  Authorization: Bearer <token>\nRequest:\n{\n  \"reason\": \"ALPR Misread\"\n}\nResponse:\n  status: 200 OK\n{\n  \"success\": true,\n  \"message\": \"Plate mismatch case approved successfully.\"\n}"
              },
              {
                id: "contract-post-mismatches-reject",
                name: "POST /api/core/incidents/plate-mismatches/{caseId}/reject",
                content: "Method: POST\nPath: /api/core/incidents/plate-mismatches/{caseId}/reject\nHeaders:\n  Authorization: Bearer <token>\nRequest:\n{\n  \"reason\": \"Vehicle information does not match.\"\n}\nResponse:\n  status: 200 OK\n{\n  \"success\": true,\n  \"message\": \"Plate mismatch case rejected successfully.\"\n}"
              }
            ],
            testCases: [
              {
                id: "tc-mismatch-staff-success",
                title: "Verify authorized client (Staff) can access \"Plate Mismatch Case\" successfully",
                type: "api",
                precondition: "Client is authenticated with role: Staff.",
                steps: [
                  "Authenticate user as Staff.",
                  "Retrieve a plate mismatch case."
                ],
                expectedResult: "Request succeeds and returns the case details.",
                status: "not_started"
              },
              {
                id: "tc-mismatch-unauthorized",
                title: "Verify unauthorized role is rejected when accessing \"Plate Mismatch Case\"",
                type: "api",
                precondition: "User is anonymous or lacks required role.",
                steps: [
                  "Attempt to access the feature without authorization."
                ],
                expectedResult: "Returns 401 Unauthorized or 403 Forbidden.",
                status: "not_started"
              },
              {
                id: "tc-mismatch-reason-required",
                title: "Verify approval requires a reason",
                type: "integration",
                expectedResult: "System rejects approval when no reason is provided.",
                status: "not_started"
              },
              {
                id: "tc-mismatch-audit-log",
                title: "Verify manual verification is permanently logged",
                type: "integration",
                expectedResult: "Audit log contains staff ID, timestamp, decision, and reason.",
                status: "not_started"
              },
              {
                id: "tc-mismatch-manager-report",
                title: "Verify approved mismatch is included in manager report",
                type: "integration",
                expectedResult: "Approved case automatically appears in the manager's daily exception report.",
                status: "not_started"
              },
              {
                id: "tc-mismatch-snapshot-display",
                title: "Verify entry and exit snapshots are displayed correctly",
                type: "ui",
                expectedResult: "Staff can compare entry and exit images side-by-side before making a decision.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-mismatch-contract", content: "API contract is documented in this node.", checked: false },
              { id: "dc-mismatch-roles", content: "Required clients/roles are assigned.", checked: false },
              { id: "dc-mismatch-export", content: "Business rules and inherited rules are visible in AI export.", checked: false },
              { id: "dc-mismatch-response-format", content: "Success response uses common API response format where applicable.", checked: false },
              { id: "dc-mismatch-error-safe", content: "Error response is clear and does not leak sensitive data.", checked: false },
              { id: "dc-mismatch-side-by-side", content: "Staff can compare entry and exit snapshots side-by-side.", checked: false },
              { id: "dc-mismatch-reason-check", content: "Approval requires a reason.", checked: false },
              { id: "dc-mismatch-audit", content: "Manual verification events are permanently audited.", checked: false },
              { id: "dc-mismatch-staff-record", content: "Staff ID, timestamp, and decision are recorded.", checked: false },
              { id: "dc-mismatch-manager-sync", content: "Approved mismatches automatically appear in the manager's daily incident report.", checked: false },
              { id: "dc-mismatch-test-cases", content: "At least two test cases are defined.", checked: false },
              { id: "dc-mismatch-ai-export", content: "Feature can be exported as AI-readable Markdown.", checked: false }
            ]
          },
          {
            id: "leaf-inc-override",
            title: "Manual Staff Override",
            type: "leaf_feature",
            clients: ["Staff", "Manager"],
            endpoints: [],
            ownerService: ".NET Core API",
            testCases: defaultApiTests("Manual Staff Override", ["Staff"], []),
            doneCriteria: defaultDoneCriteria("Manual Staff Override")
          }
        ]
      },

      // 13. Reporting & Dashboard
      {
        id: "cat-reports",
        title: "Reporting & Dashboard",
        type: "category",
        summary: "Analytics and operational oversight for managers.",
        children: [
          {
            id: "leaf-rep-dashboard",
            title: "Support Dashboard",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: ["GET /api/support/dashboard"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/dashboard"),
            testCases: defaultApiTests("Support Dashboard", ["Manager"], ["GET /api/support/dashboard"]),
            doneCriteria: defaultDoneCriteria("Support Dashboard")
          },
          {
            id: "leaf-rep-revenue",
            title: "Revenue Report",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: ["GET /api/support/reports/revenue"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/reports/revenue"),
            testCases: defaultApiTests("Revenue Report", ["Manager"], ["GET /api/support/reports/revenue"]),
            doneCriteria: defaultDoneCriteria("Revenue Report")
          },
          {
            id: "leaf-rep-traffic",
            title: "Traffic Report",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: ["GET /api/support/reports/traffic"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/reports/traffic"),
            testCases: defaultApiTests("Traffic Report", ["Manager"], ["GET /api/support/reports/traffic"]),
            doneCriteria: defaultDoneCriteria("Traffic Report")
          },
          {
            id: "leaf-rep-occupancy",
            title: "Occupancy Report",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: ["GET /api/support/reports/occupancy"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/reports/occupancy"),
            testCases: defaultApiTests("Occupancy Report", ["Manager"], ["GET /api/support/reports/occupancy"]),
            doneCriteria: defaultDoneCriteria("Occupancy Report")
          },
          {
            id: "leaf-rep-card",
            title: "Card Session Report",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: ["GET /api/support/reports/card-session"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/reports/card-session"),
            testCases: defaultApiTests("Card Session Report", ["Manager"], ["GET /api/support/reports/card-session"]),
            doneCriteria: defaultDoneCriteria("Card Session Report")
          },
          {
            id: "leaf-rep-export",
            title: "Generic Report Export",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: ["GET /api/support/reports/export"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/reports/export"),
            testCases: defaultApiTests("Generic Report Export", ["Manager"], ["GET /api/support/reports/export"]),
            doneCriteria: defaultDoneCriteria("Generic Report Export")
          },
          {
            id: "leaf-rep-audit",
            title: "Audit Log Export",
            type: "leaf_feature",
            clients: ["Admin"],
            endpoints: ["GET /api/audit-logs/export"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/audit-logs/export"),
            testCases: defaultApiTests("Audit Log Export", ["Admin"], ["GET /api/audit-logs/export"]),
            doneCriteria: defaultDoneCriteria("Audit Log Export")
          }
        ]
      },

      // 14. Public APIs
      {
        id: "cat-public",
        title: "Public APIs",
        type: "category",
        summary: "Read-only datasets readable without credentials.",
        businessRules: [
          "Public APIs must not expose private user/session/payment details.",
          "Public parking information, pricing, rules, and available slots should be readable without login."
        ],
        children: [
          {
            id: "leaf-pub-info",
            title: "Parking Info",
            type: "leaf_feature",
            clients: ["Guest", "Driver"],
            endpoints: ["GET /api/public/parking-info"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/public/parking-info"),
            testCases: defaultApiTests("Parking Info", ["Guest"], ["GET /api/public/parking-info"]),
            doneCriteria: defaultDoneCriteria("Parking Info")
          },
          {
            id: "leaf-pub-price",
            title: "Public Pricing",
            type: "leaf_feature",
            clients: ["Guest", "Driver"],
            endpoints: ["GET /api/public/pricing"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/public/pricing"),
            testCases: defaultApiTests("Public Pricing", ["Guest"], ["GET /api/public/pricing"]),
            doneCriteria: defaultDoneCriteria("Public Pricing")
          },
          {
            id: "leaf-pub-rules",
            title: "Public Rules",
            type: "leaf_feature",
            clients: ["Guest", "Driver"],
            endpoints: ["GET /api/public/rules"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/public/rules"),
            testCases: defaultApiTests("Public Rules", ["Guest"], ["GET /api/public/rules"]),
            doneCriteria: defaultDoneCriteria("Public Rules")
          },
          {
            id: "leaf-pub-avail",
            title: "Public Available Slots",
            type: "leaf_feature",
            clients: ["Guest", "Driver"],
            endpoints: ["GET /api/public/available-slots"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/public/available-slots"),
            testCases: defaultApiTests("Public Available Slots", ["Guest"], ["GET /api/public/available-slots"]),
            doneCriteria: defaultDoneCriteria("Public Available Slots")
          }
        ]
      },

      // 15. Feedback
      {
        id: "cat-feedback",
        title: "Feedback",
        type: "category",
        summary: "Driver reviews, suggestion submissions and backoffice management lists.",
        businessRules: [
          "Public/Driver users can submit feedback.",
          "Manager/Admin can list, view, and update feedback status.",
          "Feedback status updates should record manager/admin response details."
        ],
        children: [
          {
            id: "leaf-feed-submit",
            title: "Submit Feedback",
            type: "leaf_feature",
            clients: ["Guest", "Driver"],
            endpoints: ["POST /api/support/feedbacks"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("POST /api/support/feedbacks"),
            testCases: defaultApiTests("Submit Feedback", ["Driver"], ["POST /api/support/feedbacks"]),
            doneCriteria: defaultDoneCriteria("Submit Feedback")
          },
          {
            id: "leaf-feed-list",
            title: "Feedback Management List",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: ["GET /api/admin/feedbacks"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/admin/feedbacks"),
            testCases: defaultApiTests("Feedback Management List", ["Manager"], ["GET /api/admin/feedbacks"]),
            doneCriteria: defaultDoneCriteria("Feedback Management List")
          },
          {
            id: "leaf-feed-detail",
            title: "Feedback Detail",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: ["GET /api/admin/feedbacks/{id}"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/admin/feedbacks/{id}"),
            testCases: defaultApiTests("Feedback Detail", ["Manager"], ["GET /api/admin/feedbacks/{id}"]),
            doneCriteria: defaultDoneCriteria("Feedback Detail")
          },
          {
            id: "leaf-feed-update",
            title: "Feedback Status Update",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: ["PUT /api/admin/feedbacks/{id}"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("PUT /api/admin/feedbacks/{id}"),
            testCases: defaultApiTests("Feedback Status Update", ["Manager"], ["PUT /api/admin/feedbacks/{id}"]),
            doneCriteria: defaultDoneCriteria("Feedback Status Update")
          }
        ]
      },

      // 16. Notification
      {
        id: "cat-notification",
        title: "Notification",
        type: "category",
        summary: "Real-time SSE or long-poll alert push feeds for operators and drivers.",
        children: [
          {
            id: "leaf-notif-user",
            title: "User Notifications",
            type: "leaf_feature",
            clients: ["Driver", "Staff", "Manager", "Admin"],
            endpoints: ["GET /api/notifications/{userId}"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/notifications/{userId}"),
            testCases: defaultApiTests("User Notifications", ["Driver"], ["GET /api/notifications/{userId}"]),
            doneCriteria: defaultDoneCriteria("User Notifications")
          },
          {
            id: "leaf-notif-unread",
            title: "Unread Notifications",
            type: "leaf_feature",
            clients: ["Driver", "Staff", "Manager", "Admin"],
            endpoints: ["GET /api/notifications/{userId}/unread"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/notifications/{userId}/unread"),
            testCases: defaultApiTests("Unread Notifications", ["Driver"], ["GET /api/notifications/{userId}/unread"]),
            doneCriteria: defaultDoneCriteria("Unread Notifications")
          },
          {
            id: "leaf-notif-read",
            title: "Mark Notification as Read",
            type: "leaf_feature",
            clients: ["Driver", "Staff", "Manager", "Admin"],
            endpoints: ["PATCH /api/notifications/{id}/read"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("PATCH /api/notifications/{id}/read"),
            testCases: defaultApiTests("Mark Notification as Read", ["Driver"], ["PATCH /api/notifications/{id}/read"]),
            doneCriteria: defaultDoneCriteria("Mark Notification as Read")
          }
        ]
      },

      // 17. Mock Devices
      {
        id: "cat-mock-devices",
        title: "Mock Devices",
        type: "category",
        summary: "Hardware sensors mock simulation endpoints.",
        businessRules: [
          "Mock devices simulate camera, RFID, and barrier events only.",
          "Mock camera/RFID/barrier must not bypass the real entry/exit business rules."
        ],
        children: [
          {
            id: "leaf-mock-camera",
            title: "Mock Camera Scan",
            type: "leaf_feature",
            clients: ["Staff", "Manager", "Admin"],
            endpoints: ["POST /api/mock/camera/scan"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("POST /api/mock/camera/scan"),
            testCases: defaultApiTests("Mock Camera Scan", ["Staff"], ["POST /api/mock/camera/scan"]),
            doneCriteria: defaultDoneCriteria("Mock Camera Scan")
          },
          {
            id: "leaf-mock-rfid",
            title: "Mock RFID Scan",
            type: "leaf_feature",
            clients: ["Staff", "Manager", "Admin"],
            endpoints: ["POST /api/mock/rfid/scan"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("POST /api/mock/rfid/scan"),
            testCases: defaultApiTests("Mock RFID Scan", ["Staff"], ["POST /api/mock/rfid/scan"]),
            doneCriteria: defaultDoneCriteria("Mock RFID Scan")
          },
          {
            id: "leaf-mock-barrier",
            title: "Mock Barrier Control",
            type: "leaf_feature",
            clients: ["Staff", "Manager", "Admin"],
            endpoints: ["POST /api/mock/barrier/control"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("POST /api/mock/barrier/control"),
            testCases: defaultApiTests("Mock Barrier Control", ["Staff"], ["POST /api/mock/barrier/control"]),
            doneCriteria: defaultDoneCriteria("Mock Barrier Control")
          }
        ]
      },

      // 18. Health & Diagnostics
      {
        id: "cat-diagnostics",
        title: "Health & Diagnostics",
        type: "category",
        summary: "System logs check, DB sync, and debugging routines.",
        children: [
          {
            id: "leaf-diag-core-health",
            title: "Core Health Check",
            type: "leaf_feature",
            clients: ["Admin", "System"],
            endpoints: ["GET /api/core/health"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/health"),
            testCases: defaultApiTests("Core Health Check", ["Admin"], ["GET /api/core/health"]),
            doneCriteria: defaultDoneCriteria("Core Health Check")
          },
          {
            id: "leaf-diag-support-health",
            title: "Support Health Check",
            type: "leaf_feature",
            clients: ["Admin", "System"],
            endpoints: ["GET /api/support/health"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/health"),
            testCases: defaultApiTests("Support Health Check", ["Admin"], ["GET /api/support/health"]),
            doneCriteria: defaultDoneCriteria("Support Health Check")
          },
          {
            id: "leaf-diag-db-check",
            title: "Database Check",
            type: "leaf_feature",
            clients: ["Admin", "System"],
            endpoints: ["GET /api/core/db-check"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/db-check"),
            testCases: defaultApiTests("Database Check", ["Admin"], ["GET /api/core/db-check"]),
            doneCriteria: defaultDoneCriteria("Database Check")
          },
          { id: "leaf-diag-res-dump", title: "Reservation Debug Dump", type: "leaf_feature", clients: ["Admin"], endpoints: [], ownerService: "System", testCases: defaultApiTests("Reservation Debug Dump", ["Admin"], []), doneCriteria: defaultDoneCriteria("Reservation Debug Dump") },
          { id: "leaf-diag-sess-dump", title: "Session Debug Dump", type: "leaf_feature", clients: ["Admin"], endpoints: [], ownerService: "System", testCases: defaultApiTests("Session Debug Dump", ["Admin"], []), doneCriteria: defaultDoneCriteria("Session Debug Dump") },
          { id: "leaf-diag-clear-res", title: "Clear Reservations Debug", type: "leaf_feature", clients: ["Admin"], endpoints: [], ownerService: "System", testCases: defaultApiTests("Clear Reservations Debug", ["Admin"], []), doneCriteria: defaultDoneCriteria("Clear Reservations Debug") },
          { id: "leaf-diag-migrate", title: "Migrate Database Debug", type: "leaf_feature", clients: ["Admin"], endpoints: [], ownerService: "System", testCases: defaultApiTests("Migrate Database Debug", ["Admin"], []), doneCriteria: defaultDoneCriteria("Migrate Database Debug") },
          { id: "leaf-diag-expire-res", title: "Expire Reservation Debug", type: "leaf_feature", clients: ["Admin"], endpoints: [], ownerService: "System", testCases: defaultApiTests("Expire Reservation Debug", ["Admin"], []), doneCriteria: defaultDoneCriteria("Expire Reservation Debug") },
          { id: "leaf-diag-expire-pay", title: "Expire Payment Deadline Debug", type: "leaf_feature", clients: ["Admin"], endpoints: [], ownerService: "System", testCases: defaultApiTests("Expire Payment Deadline Debug", ["Admin"], []), doneCriteria: defaultDoneCriteria("Expire Payment Deadline Debug") }
        ]
      }
    ]
  };

  const rootNode = createSeedNode(seedInput, null, 0);
  enrichNodeWithTags(rootNode);
  return [rootNode];
}

function enrichNodeWithTags(node: FeatureNode) {
  if (!node.tags) {
    node.tags = [];
  }

  if (node.id === "root-parking-system") {
    node.tags = ["system", "parking", "core"];
  } else if (node.id.startsWith("cat-")) {
    const categoryTags: Record<string, string[]> = {
      "cat-authentication": ["auth", "security"],
      "cat-access-control": ["auth", "rbac", "security"],
      "cat-user-driver": ["user", "driver"],
      "cat-structure": ["structure", "inventory"],
      "cat-cards": ["cards", "membership"],
      "cat-reservation": ["booking", "reservation"],
      "cat-session": ["session", "gate"],
      "cat-payment": ["payment", "billing", "finance"],
      "cat-pricing": ["pricing", "billing"],
      "cat-monthly-pass": ["cards", "monthly-pass"],
      "cat-incidents": ["incidents", "support"],
      "cat-reports": ["reports", "dashboard", "manager"],
      "cat-public": ["public", "info"],
      "cat-feedback": ["feedback", "support"],
      "cat-notification": ["notification", "alerts"],
      "cat-mock-devices": ["devices", "mock"],
      "cat-diagnostics": ["diagnostics", "admin"]
    };
    const key = node.id;
    if (categoryTags[key]) {
      node.tags = [...categoryTags[key]];
    }
  } else if (node.id.startsWith("leaf-")) {
    const localTags: string[] = [];
    const idLower = node.id.toLowerCase();
    const titleLower = node.title.toLowerCase();

    if (idLower.includes("login") || titleLower.includes("login")) localTags.push("jwt", "api");
    if (idLower.includes("logout") || titleLower.includes("logout") || idLower.includes("refresh") || titleLower.includes("refresh") || idLower.includes("session") || titleLower.includes("session")) localTags.push("api");
    if (idLower.includes("payos") || titleLower.includes("payos")) localTags.push("payos", "webhook");
    if (idLower.includes("stripe") || titleLower.includes("stripe")) localTags.push("stripe");
    if (idLower.includes("crud") || titleLower.includes("crud") || idLower.includes("manage") || titleLower.includes("manage")) localTags.push("crud");
    if (idLower.includes("report") || idLower.includes("export") || titleLower.includes("export") || titleLower.includes("report")) localTags.push("excel", "pdf");
    if (idLower.includes("device") || idLower.includes("gate") || idLower.includes("barrier") || titleLower.includes("gate") || titleLower.includes("device") || titleLower.includes("barrier")) localTags.push("hardware", "iot");
    if (idLower.includes("cron") || idLower.includes("worker") || titleLower.includes("cron") || titleLower.includes("worker")) localTags.push("cron", "job");
    if (idLower.includes("health") || idLower.includes("diag") || titleLower.includes("health") || titleLower.includes("diag")) localTags.push("diagnostics");

    node.tags = localTags;
  }

  if (node.children) {
    node.children.forEach(enrichNodeWithTags);
  }
}

export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

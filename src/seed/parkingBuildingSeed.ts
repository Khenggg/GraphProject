import { createSeedNode, type SeedNodeInput } from "../domain/featureNodeFactory";
import type { FeatureNode, TestCase, DoneCriterion, ContractField } from "../domain/featureNode.types";
import { migrateParkingTaxonomy } from "./parkingTaxonomyMigration";

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
              "Store only the hashed refresh token in the database using secure SHA256 hashing.",
              "Login endpoint must have rate limiting (limit: 5 failed attempts per username/IP in 15 minutes).",
              "Use HTTPS in production and load JWT secrets from secure configuration / environment.",
              "Use constant-time comparison for token validation if available.",
              "All date/time values must use UTC.",
              "Error messages must not reveal username existence (use generic 'Invalid username or password')."
            ],
            logEvents: [
              "Successful login events.",
              "Failed login attempts.",
              "Disabled, inactive, locked, or deleted user login attempts.",
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
              { system: "Spring Boot Support API", responsibility: "Must validate JWT signature, claims, and enforce current-account-status check (e.g., rejecting disabled, inactive, or deleted users immediately)." }
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
Disabled/Inactive/Locked/Deleted Account Response (401 Unauthorized):
  {
    "success": false,
    "data": null,
    "message": "Invalid username or password.",
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
Disabled/Inactive Account Response (403 Forbidden):
  {
    "success": false,
    "data": null,
    "message": "Your account is disabled or inactive.",
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
                expectedResult: "Returns 401 Unauthorized with success=false and generic 'Invalid username or password' message to prevent user enumeration.",
                status: "not_started"
              },
              {
                id: "tc-auth-login-inactive-account",
                title: "Login - Inactive Account",
                type: "integration",
                precondition: "User exists with status 'Inactive'.",
                steps: ["Send login request with correct credentials."],
                expectedResult: "Returns 401 Unauthorized with success=false and generic 'Invalid username or password' message.",
                status: "not_started"
              },
              {
                id: "tc-auth-login-locked-account",
                title: "Login - Locked Account",
                type: "integration",
                precondition: "User exists with status 'Locked'.",
                steps: ["Send login request with correct credentials."],
                expectedResult: "Returns 401 Unauthorized with success=false and generic 'Invalid username or password' message.",
                status: "not_started"
              },
              {
                id: "tc-auth-login-deleted-account",
                title: "Login - Deleted Account",
                type: "integration",
                precondition: "User is soft-deleted.",
                steps: ["Send login request with correct credentials."],
                expectedResult: "Returns 401 Unauthorized with success=false and generic 'Invalid username or password' message.",
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
                expectedResult: "Returns 401 Unauthorized due to access token revocation check (technical decision on blacklist/versioning strategy).",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-auth-login-impl", content: "Login endpoint is fully implemented.", checked: false },
              { id: "dc-auth-login-validation", content: "Login validates required fields.", checked: false },
              { id: "dc-auth-login-reject-invalid", content: "Login rejects invalid credentials.", checked: false },
              { id: "dc-auth-login-reject-disabled", content: "Login rejects disabled, inactive, locked, and deleted users.", checked: false },
              { id: "dc-auth-password-hash", content: "Password verification uses secure hashing.", checked: false },
              { id: "dc-jwt-claims", content: "JWT access token is generated with required claims.", checked: false },
              { id: "dc-jwt-expiry", content: "Access token expires after 1 hour.", checked: false },
              { id: "dc-refresh-secure", content: "Refresh token is generated securely.", checked: false },
              { id: "dc-refresh-hashed", content: "Refresh token is stored hashed in database.", checked: false },
              { id: "dc-refresh-rotation", content: "Refresh token rotation issues a new access token and a replacement refresh token.", checked: false },
              { id: "dc-refresh-reuse", content: "Refresh token reuse detection works.", checked: false },
              { id: "dc-logout-revoke", content: "Logout revokes the refresh token family and terminates the session.", checked: false },
              { id: "dc-logout-blacklist", content: "Logout revokes access token using chosen revocation strategy (technical decision).", checked: false },
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
            clients: ["Staff", "Manager", "Admin"],
            status: "ready",
            priority: "high",
            tags: ["entry", "parking-session", "core-api"],
            objective: "Implement the core Vehicle Entry process for the Parking Building Management System. The .NET Core API is the sole owner of this transaction.",
            summary: "Implement the core Vehicle Entry process for the Parking Building Management System. The .NET Core API is the sole owner of this transaction. This feature must allow authorized personnel (STAFF, MANAGER, ADMIN) to: Get a location/slot suggestion based on vehicle type and entry gate. Verify reservation codes prior to entry check-in. Process vehicle entries using three modes: CASUAL, MONTHLY, and RESERVATION. Securely bind a physical parking card to the active session. Snapshot the active pricing rule at the time of entry. Commit the entire entry flow (creating session, updating card, updating slot, writing audit logs) within a single database transaction.",
            endpoints: [
              "GET /api/core/parking-sessions/location-suggestion",
              "GET /api/core/reservations/{reservationCode}/entry-check",
              "POST /api/core/parking-sessions/entry"
            ],
            ownerService: ".NET Core API (ParkingBuilding.CoreApi)",
            inScope: [
              "API for suggesting available parking zones/slots based on real-time capacity and prioritization.",
              "API for validating a reservation code and returning an entry token.",
              "API for creating a new active parking session (Entry Processing).",
              "Strict validation of Card state, Slot state, and existing Vehicle active sessions.",
              "Handling noPlate logic for 2-wheelers vs. slot-required vehicles.",
              "Database transaction boundary ensuring atomicity (all-or-nothing commit).",
              "Audit log creation via IAuditWriterService."
            ],
            outOfScope: [
              "Direct hardware integration (mock hardware events are owned by Spring Boot Support API).",
              "Public QR code generation logic (owned by Spring Boot Support API).",
              "Exit processing and Fee calculation."
            ],
            businessRules: [
              "The system manages parking building operations for public guests, drivers, staff, managers, and admins.",
              "The backend is split into .NET Core API for transactional/write operations and Spring Boot Support API for support/read/report/public operations.",
              "All APIs should return a consistent success/error response format (ApiResponse<T>).",
              "Authenticated APIs must validate JWT and role permissions.",
              "Both backend services access a shared PostgreSQL database, maintaining strict entity ownership.",
              "Global error handling middleware must prevent internal stack traces from leaking to clients.",
              "A request logging system must log all incoming API requests for security tracing.",
              "All manager/admin mutating operations must be logged to a dedicated audit schema.",
              "A parking session starts at vehicle entry and ends after successful exit processing.",
              "Entry requires card/session information, plate information, gate, and location decision.",
              "Staff operations must be protected by role authorization.",
              "Architecture Rule: Must use .NET Core API for this feature. Spring Boot API will only read the resulting data.",
              "Transaction Boundary Rule: The CreateEntrySessionAsync must run inside a single .NET transaction (IDbContextTransaction). If any step fails (e.g., card update, slot update), the whole process must rollback.",
              "Pricing Snapshot Rule: The entry process must copy the currently active pricing rule (snapshot_day_price, snapshot_night_price, snapshot_monthly_price, snapshot_lost_card_fee) into the parking_sessions table to prevent disputes if prices change while the session is active.",
              "No Plate Rule: noPlate = true is ONLY allowed for non-slot vehicles (2-wheelers) and MUST include a vehicleDescription. Slot vehicles (cars/trucks) MUST have a licensePlate.",
              "Conflict Rule: Do not allow entry if the Card is not AVAILABLE, the Slot is not AVAILABLE (or RESERVED for bookings), or the Vehicle (License Plate) already has an ACTIVE, LOST_CARD_PENDING, or MISMATCH_PENDING session.",
              "Monthly Pass Rule: When entering via MONTHLY mode, the system must verify that the license plate matches an ACTIVE monthly pass (start_date <= today <= end_date). If valid, set payment_required = false, payment_status = NOT_REQUIRED, and customer_type = MONTHLY. If invalid or expired, reject with MONTHLY_PASS_EXPIRED or MONTHLY_PASS_NOT_FOUND.",
              "Slot Assignment Rule: For 2-wheelers (RequiresSlot = false), selectedSlotId MUST be null, and capacity is tracked by selectedAreaId. For 4-wheelers/trucks (RequiresSlot = true), selectedSlotId is mandatory and must be marked as OCCUPIED."
            ],
            apiContracts: [
              {
                id: "api-contract-location-suggestion",
                name: "GET /api/core/parking-sessions/location-suggestion",
                content: "Method: GET\nPath: /api/core/parking-sessions/location-suggestion?vehicleTypeId=3&entryGateId=1\nHeaders:\n  Authorization: Bearer <token>\nSuccess Response (200 OK):\n  {\n    \"success\": true,\n    \"message\": \"Suggestion generated successfully\",\n    \"data\": {\n      \"suggestionType\": \"SLOT\",\n      \"suggestedFloorId\": 1,\n      \"suggestedAreaId\": 2,\n      \"suggestedSlotId\": 15,\n      \"slotCode\": \"B-C05\",\n      \"areaCode\": \"B\",\n      \"floorCode\": \"B1\",\n      \"suggestionToken\": \"JWT_TOKEN_HERE\"\n    },\n    \"errors\": null,\n    \"errorCode\": null,\n    \"statusCode\": 200\n  }"
              },
              {
                id: "api-contract-reservation-entry-check",
                name: "GET /api/core/reservations/{reservationCode}/entry-check",
                content: "Method: GET\nPath: /api/core/reservations/RES-12345/entry-check?entryGateId=1\nHeaders:\n  Authorization: Bearer <token>\nSuccess Response (200 OK):\n  {\n    \"success\": true,\n    \"message\": \"Reservation check successful.\",\n    \"data\": {\n      \"reservationId\": 123,\n      \"reservationEntryToken\": \"JWT_TOKEN_HERE\",\n      \"licensePlate\": \"51A-12345\",\n      \"vehicleTypeId\": 5,\n      \"assignedSlotId\": 15\n    },\n    \"errors\": null\n  }"
              },
              {
                id: "api-contract-parking-sessions-entry",
                name: "POST /api/core/parking-sessions/entry",
                content: "Method: POST\nPath: /api/core/parking-sessions/entry\nHeaders:\n  Authorization: Bearer <token>\nPayload Example (CASUAL Mode):\n{\n  \"entryMode\": \"CASUAL\",\n  \"cardCode\": \"C002\",\n  \"licensePlate\": \"59X1-88888\",\n  \"noPlate\": false,\n  \"vehicleTypeId\": 3,\n  \"entryGateId\": 1,\n  \"selectedAreaId\": 1,\n  \"selectedSlotId\": null,\n  \"suggestionToken\": \"JWT_TOKEN_HERE\",\n  \"convertedFromReservationId\": null\n}\nSuccess Response (201 Created):\n{\n  \"success\": true,\n  \"message\": \"Entry created successfully\",\n  \"data\": {\n    \"sessionId\": 1001,\n    \"sessionCode\": \"SESS-20260629-ABC\",\n    \"status\": \"ACTIVE\",\n    \"customerType\": \"CASUAL\",\n    \"cardCode\": \"C002\",\n    \"slotCode\": null,\n    \"entryTime\": \"2026-06-29T10:00:00+07:00\",\n    \"paymentStatus\": \"PENDING\",\n    \"monthlyPassId\": null,\n    \"reservationId\": null\n  },\n  \"errors\": null\n}\nError Response Example (400 Bad Request):\n{\n  \"success\": false,\n  \"message\": \"Card is not available.\",\n  \"data\": null,\n  \"errors\": [\"CARD_NOT_AVAILABLE\"],\n  \"errorCode\": \"CARD_NOT_AVAILABLE\",\n  \"statusCode\": 400\n}"
              }
            ],
            testCases: [
              {
                id: "TC-ENTRY-01",
                title: "Casual entry with valid inputs.",
                type: "api",
                expectedResult: "201 Created. Session created, Card -> IN_USE, Slot -> OCCUPIED.",
                status: "not_started"
              },
              {
                id: "TC-ENTRY-02",
                title: "Prevent duplicate active card.",
                type: "api",
                expectedResult: "400 Bad Request (CARD_STATE_CONFLICT or CARD_NOT_AVAILABLE).",
                status: "not_started"
              },
              {
                id: "TC-ENTRY-03",
                title: "Prevent duplicate active plate.",
                type: "api",
                expectedResult: "400 Bad Request (VEHICLE_HAS_ACTIVE_SESSION).",
                status: "not_started"
              },
              {
                id: "TC-ENTRY-04",
                title: "Entry with Monthly Pass mode detects customerType MONTHLY.",
                type: "api",
                expectedResult: "201 Created. customerType = MONTHLY, paymentStatus = NOT_REQUIRED, paymentRequired = false.",
                status: "not_started"
              },
              {
                id: "TC-ENTRY-05",
                title: "Entry with expired Monthly Pass is rejected.",
                type: "api",
                expectedResult: "400 Bad Request (MONTHLY_PASS_EXPIRED).",
                status: "not_started"
              },
              {
                id: "TC-ENTRY-06",
                title: "Reservation entry with matching plate.",
                type: "integration",
                expectedResult: "201 Created. Reservation updated to COMPLETED, Session linked.",
                status: "not_started"
              },
              {
                id: "TC-ENTRY-07",
                title: "Reservation entry with mismatched plate.",
                type: "api",
                expectedResult: "400 Bad Request (RESERVATION_PLATE_MISMATCH).",
                status: "not_started"
              },
              {
                id: "TC-ENTRY-08",
                title: "Snapshot pricing is correctly cloned to session.",
                type: "integration",
                expectedResult: "Database asserts snapshot_day_price, etc., are filled from active rule.",
                status: "not_started"
              },
              {
                id: "TC-SUG-01",
                title: "Suggestion ignores LOCKED/MAINTENANCE areas. Suggestion prioritizes area with highest available slots.",
                type: "integration",
                expectedResult: "Suggestion generated successfully targeting active slots.",
                status: "not_started"
              },
              {
                id: "TC-ENTRY-09",
                title: "Transaction rollback on failure.",
                type: "integration",
                expectedResult: "If slot status update throws exception during entry flow, parking_sessions record is NOT inserted and card remains AVAILABLE.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-entry-01", content: "Implement IEntryService handling 3 entry modes inside a single DB transaction.", checked: false },
              { id: "dc-entry-02", content: "API endpoint exists in .NET Swagger (/api/core/parking-sessions/entry).", checked: false },
              { id: "dc-entry-03", content: "Response adheres strictly to ApiResponse<T> wrapper.", checked: false },
              { id: "dc-entry-04", content: "Exceptions thrown are BusinessException(ErrorCode).", checked: false },
              { id: "dc-entry-05", content: "JWT roles are validated (STAFF, MANAGER, ADMIN).", checked: false },
              { id: "dc-entry-06", content: "parking_cards.status and slots.status update correctly upon successful entry.", checked: false },
              { id: "dc-entry-07", content: "Active pricing rules are cloned into session snapshot columns.", checked: false },
              { id: "dc-entry-08", content: "Audit logs (SESSION_CREATED) are correctly written via IAuditWriterService.", checked: false },
              { id: "dc-entry-09", content: "Transaction rolls back completely if any database update fails.", checked: false },
              { id: "dc-entry-10", content: "Integration checks Driver pre-bookings (reservation validation and status update).", checked: false },
              { id: "dc-entry-11", content: "All required automated tests pass locally.", checked: false },
              { id: "dc-entry-12", content: "Backend quality gate (check-api-contract.ps1 hoặc lệnh tương đương) passes without errors.", checked: false }
            ],
            permissions: [
              { role: "Staff", permission: "Full Access" },
              { role: "Manager", permission: "Full Access (Can override suggestions with override reason)" },
              { role: "Admin", permission: "Full Access" },
              { role: "Driver", permission: "Denied (403 Forbidden)" },
              { role: "Public", permission: "Denied (401 Unauthorized)" }
            ],
            dbExistingTables: [
              "users",
              "vehicles",
              "vehicle_types",
              "parking_cards",
              "floors",
              "areas",
              "slots",
              "gates",
              "parking_sessions",
              "pricing_rules",
              "monthly_passes",
              "reservations",
              "audit_logs"
            ],
            dbRelationships: [
              "A card can only link to one session where status IN ('ACTIVE', 'LOST_CARD_PENDING', 'MISMATCH_PENDING').",
              "A license plate can only link to one session where status IN ('ACTIVE', 'LOST_CARD_PENDING', 'MISMATCH_PENDING')."
            ],
            validationRules: [
              { field: "Card Status", rule: "Must be AVAILABLE", errorMessage: "CARD_NOT_AVAILABLE" },
              { field: "Slot Status", rule: "Must be AVAILABLE (or RESERVED for bookings)", errorMessage: "SLOT_NOT_AVAILABLE" },
              { field: "Active Vehicle", rule: "Plate must not have an active session", errorMessage: "VEHICLE_HAS_ACTIVE_SESSION" },
              { field: "Missing Plate", rule: "If noPlate = true, vehicleDescription is required", errorMessage: "VEHICLE_DESCRIPTION_REQUIRED" },
              { field: "Slot Vehicle Plate", rule: "Cars/Trucks must have a plate; noPlate not allowed", errorMessage: "PLATE_REQUIRED_FOR_SLOT_VEHICLE" },
              { field: "Pricing", rule: "An active pricing rule must exist for the vehicle type", errorMessage: "PRICING_RULE_NOT_FOUND" },
              { field: "Reservation Plate", rule: "Plate during check-in must match the reservation exactly", errorMessage: "RESERVATION_PLATE_MISMATCH" },
              { field: "Suggestion Override", rule: "STAFF cannot override the system's slot suggestion", errorMessage: "SUGGESTION_OVERRIDE_NOT_ALLOWED" },
              { field: "Monthly Pass", rule: "Must exist and be ACTIVE within start_date and end_date", errorMessage: "MONTHLY_PASS_EXPIRED or MONTHLY_PASS_NOT_FOUND" },
              { field: "Override Reason", rule: "Required if MANAGER overrides suggested slot/area", errorMessage: "OVERRIDE_REASON_REQUIRED" }
            ],
            securityRules: [
              "Enforce JWT Authentication and Role-based checks ([Authorize(Roles = \"STAFF,MANAGER,ADMIN\")]).",
              "Extract the acting user ID securely via User.GetUserId() extension method from claims; do not trust client-provided staff IDs.",
              "Prevent partial data writes: The .NET IDbContextTransaction must wrap the creation of the session, the status changes to cards/slots/reservations, and the audit log insertion."
            ],
            logEvents: [
              "SESSION_CREATED (TargetType: ParkingSession, TargetId: new session ID)",
              "CARD_STATUS_CHANGED (TargetType: ParkingCard, TargetId: card ID)",
              "SLOT_STATUS_CHANGED (TargetType: Slot, TargetId: slot ID - if slot assigned)"
            ],
            noLogEvents: [
              "Passwords",
              "access tokens",
              "refresh tokens",
              "credit card details"
            ],
            uiPage: "/staff/entry",
            uiComponents: "StaffEntryPage",
            uiStateLoading: "Khi đang gửi request API, disable toàn bộ form inputs và nút submit để tránh double-submission. Hiển thị Spinner overlay trên màn hình.",
            uiStateError: "Nếu kết quả API trả về success === false, bóc tách errorCode từ đối tượng chuẩn ApiResponse<T> để hiển thị banner thông báo lỗi trực quan (Ví dụ: Hiển thị cảnh báo \"Thẻ này đã có xe khác sử dụng\" khi nhận mã lỗi CARD_NOT_AVAILABLE).",
            uiStateSuccess: "Xóa trắng form inputs (hoặc đưa về trạng thái mặc định), hiển thị Toast thông báo thành công đi kèm mã sessionCode, đồng thời reload lại bộ đếm số chỗ trống của tòa nhà.",
            notes: "### Database State Transitions & Updates Required\n- **parking_cards**: Cập nhật trạng thái `status = 'IN_USE'` và `current_session_id = {new_session_id}`.\n- **slots**: Cập nhật trạng thái `status = 'OCCUPIED'` và `current_session_id = {new_session_id}` (Chỉ áp dụng nếu xe yêu cầu gán slot và có cung cấp `selectedSlotId`).\n- **reservations**: Cập nhật trạng thái `status = 'COMPLETED'` (Nếu `entryMode = 'RESERVATION'`).\n- **parking_sessions**: Thực hiện lệnh INSERT bản ghi mới với các thông tin chi tiết:\n  - `status = 'ACTIVE'`\n  - `payment_status = 'PENDING'` (Đối với khách Vãng lai/Casual) hoặc `'NOT_REQUIRED'` (Đối với khách Vé tháng/Monthly)\n  - `payment_required = true` (Đối với khách Vãng lai/Casual) hoặc `false` (Đối với khách Vé tháng/Monthly)\n  - Sao chép toàn bộ các trường giá snapshot: `snapshot_day_price`, `snapshot_night_price`, `snapshot_monthly_price`, `snapshot_lost_card_fee` lấy trực tiếp từ cấu hình `pricing_rules` đang hoạt động tại thời điểm xe vào tòa nhà.\n\n### Implementation Instructions for AI\nBefore coding:\n1. Inspect the existing project structure in ParkingBuilding.CoreApi.\n2. Reuse existing architecture, repositories, and naming conventions (PascalCase for C# properties, snake_case for DB mapping).\n3. Do not create duplicate services, entities, or response wrappers (Reuse ApiResponse<T> and BusinessException).\n4. Check existing tests before adding new ones.\n5. Implement the smallest correct change. Do NOT write UI code or Spring Boot code for this task.\n6. Run all relevant tests.\n7. Report changed files, reason, verification, and remaining risks.\n\nDo not mark this task as complete unless all acceptance criteria and automated tests pass."
          },

          {
            id: "leaf-sess-claim",
            title: "Claim Session by QR",
            type: "leaf_feature",
            status: "draft",
            priority: "medium",
            clients: ["Driver"],
            tags: ["parking", "session", "qr", "claim"],
            summary: "Cho phép người dùng (Driver) có tài khoản trên hệ thống quét mã QR để nhận quyền sở hữu (claim) một phiên đỗ xe vãng lai.",
            objective: "Cho phép người dùng (Driver) có tài khoản trên hệ thống quét mã QR (được in trên vé cứng tại cổng vào hoặc hiển thị trên màn hình ki-ốt) để nhận quyền sở hữu (claim) một phiên đỗ xe vãng lai (casual session). Việc này giúp người dùng có thể theo dõi thời gian đỗ xe, trạng thái xe và lịch sử đỗ xe trực tiếp trên ứng dụng của họ mà không cần giữ vé giấy.",
            inScope: [
              "Tiếp nhận và giải mã/xác thực qrToken từ phía client.",
              "Tìm kiếm phiên đỗ xe (Parking Session) đang hoạt động tương ứng với token.",
              "Cập nhật thông tin chủ sở hữu (DriverId) cho phiên đỗ xe.",
              "Lưu vết (audit log) hành động nhận phiên đỗ xe."
            ],
            outOfScope: [
              "Tích hợp thanh toán trực tuyến (Online Payment Gateways) và mã giảm giá (Discount Codes) hoàn toàn nằm ngoài phạm vi của hệ thống này. Việc thanh toán (nếu có) sẽ được xử lý tiền mặt hoặc qua hệ thống máy quẹt thẻ nội bộ tại trạm, không thực hiện qua web/app.",
              "Xử lý logic cho xe đã có vé tháng (Monthly Pass) quét QR này (vé tháng tự động nhận diện qua biển số/thẻ RFID)."
            ],
            permissions: [
              { role: "Driver", permission: "Authorized to access this feature. Cần có Access Token hợp lệ." }
            ],
            dbExistingTables: ["ParkingSessions", "Users"],
            dbRelationships: [
              "ParkingSessions.DriverId là Foreign Key trỏ tới Users.Id.",
              "Một User có thể có nhiều ParkingSessions. Một ParkingSession chỉ thuộc về tối đa một User."
            ],
            validationRules: [
              { field: "qrToken", rule: "qrToken không được rỗng và phải đúng định dạng mã hóa của hệ thống.", errorMessage: "INVALID_QR_TOKEN" },
              { field: "Session Existence", rule: "Phải tồn tại record trong ParkingSessions khớp với dữ liệu giải mã từ qrToken.", errorMessage: "INVALID_QR_TOKEN" },
              { field: "State Validation", rule: "ParkingSessions.Status phải là ACTIVE.", errorMessage: "INVALID_QR_TOKEN" },
              { field: "Ownership Validation", rule: "ParkingSessions.DriverId phải là NULL trước khi thực hiện claim.", errorMessage: "SESSION_ALREADY_CLAIMED" }
            ],
            securityRules: [
              "Validate role permissions (Chỉ Driver role được phép gọi API này).",
              "Extract DriverId trực tiếp từ JWT Token của request (không nhận DriverId từ payload để tránh lỗi IDOR - Insecure Direct Object Reference).",
              "Ngăn chặn brute-force attack vào endpoint này bằng Rate Limiting."
            ],
            logEvents: [
              "Log access request: UserId, qrToken (đã mask một phần), thời gian gọi API.",
              "Log state change: Lưu lịch sử cập nhật bảng ParkingSessions (Trường DriverId thay đổi từ NULL sang ID thực tế)."
            ],
            noLogEvents: [
              "Passwords, access tokens, refresh tokens."
            ],
            integrationPoints: [
              { system: ".NET Core API và PostgreSQL DB", responsibility: "Giao tiếp hoàn toàn trong nội bộ." }
            ],
            uiComponents: "Scan Ticket QR screen, Active Session screen, Toast/Alert",
            uiStateSuccess: "Hiển thị màn hình 'Active Session' với thông tin biển số và thời gian vào.",
            uiStateError: "Hiển thị Toast/Alert báo lỗi tương ứng ('Vé này đã được nhận' hoặc 'Mã QR không hợp lệ').",
            endpoints: ["POST /api/core/parking-sessions/{qrToken}/claim"],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-claim-session-qr",
                name: "POST /api/core/parking-sessions/{qrToken}/claim",
                content: `Method: POST\nPath: /api/core/parking-sessions/{qrToken}/claim\nHeaders:\n  Authorization: Bearer <token>\n  Content-Type: application/json\n\n// Request Body: Trống (Thông tin định danh lấy từ JWT Token, thông tin phiên lấy từ qrToken trên URL)\n\n// Success Response (200 OK)\n{\n  "success": true,\n  "statusCode": 200,\n  "message": "Parking session claimed successfully.",\n  "data": {\n    "sessionId": "uuid-string",\n    "plateNumber": "51A-123.45",\n    "entryTime": "2026-07-14T01:00:00Z",\n    "assignedDriverId": "uuid-driver-string"\n  }\n}\n\n// Error Response - Already Claimed (409 Conflict)\n{\n  "success": false,\n  "statusCode": 409,\n  "errorCode": "SESSION_ALREADY_CLAIMED",\n  "message": "This parking session has already been claimed by another user."\n}\n\n// Error Response - Invalid/Expired Token (400 Bad Request)\n{\n  "success": false,\n  "statusCode": 400,\n  "errorCode": "INVALID_QR_TOKEN",\n  "message": "The provided QR token is invalid, expired, or corresponds to an inactive session."\n}`
              }
            ],
            testCases: [
              {
                id: "tc-claim-sess-auth",
                title: "Verify authorized client (Driver) can claim an active, unowned session",
                type: "api",
                precondition: "Client is authenticated with role: Driver (DriverId: A). An active Parking Session exists with DriverId = NULL and a valid qrToken.",
                steps: [
                  "Invoke endpoint: POST /api/core/parking-sessions/{qrToken}/claim",
                  "Check response code is 200 OK.",
                  "Verify in Database that ParkingSessions.DriverId is now set to DriverId A."
                ],
                expectedResult: "Request succeeds and returns session details.",
                status: "not_started"
              },
              {
                id: "tc-claim-sess-conflict",
                title: "Verify claiming an already claimed session returns Conflict",
                type: "api",
                precondition: "Client is authenticated with role: Driver (DriverId: B). An active Parking Session exists but DriverId is already set to DriverId A.",
                steps: [
                  "Invoke endpoint: POST /api/core/parking-sessions/{qrToken}/claim",
                  "Check response status code is 409 Conflict."
                ],
                expectedResult: "System rejects the request with SESSION_ALREADY_CLAIMED error.",
                status: "not_started"
              },
              {
                id: "tc-claim-sess-unauth",
                title: "Verify unauthorized role is rejected",
                type: "api",
                precondition: "User is anonymous or has role: Staff/Guest",
                steps: [
                  "Attempt to invoke endpoint: POST /api/core/parking-sessions/{qrToken}/claim",
                  "Check response status code is 401 Unauthorized or 403 Forbidden"
                ],
                expectedResult: "Request is blocked at the gateway/middleware level.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-claim-sess-contract", content: "API contract is documented in this node.", checked: true },
              { id: "dc-claim-sess-clients", content: "Required clients/roles are assigned.", checked: true },
              { id: "dc-claim-sess-rules", content: "Business rules and inherited rules are visible in AI export.", checked: true },
              { id: "dc-claim-sess-resp", content: "Success response uses common API response format where applicable.", checked: true },
              { id: "dc-claim-sess-err", content: "Error response is clear and does not leak sensitive data.", checked: true },
              { id: "dc-claim-sess-tests", content: "At least two test cases are defined.", checked: true },
              { id: "dc-claim-sess-export", content: "Feature can be exported as AI-readable Markdown.", checked: true },
              { id: "dc-claim-sess-edge", content: "Edge cases are documented (Already claimed, expired token).", checked: true },
              { id: "dc-claim-sess-transitions", content: "Payment/session/reservation state transition is documented (DriverId update logic).", checked: true }
            ],
            notes: "Before coding:\nInspect the existing project structure within the .NET Core solution.\nReuse existing BaseResponse<T> wrappers for consistent API outputs.\nEnsure the QR decoding logic uses the shared utility class to prevent duplication.\nExtract the user ID from HttpContext.User.Claims. Do NOT trust any driver ID sent in the request body.\nImplement a database transaction when updating the session to prevent race conditions (e.g., two users scanning the same QR at the exact same millisecond).\nRun all unit tests for the ParkingSessionService before submitting the PR."
          },
          {
            id: "leaf-sess-exit",
            title: "Vehicle Exit",
            type: "leaf_feature",
            status: "in_progress",
            priority: "high",
            clients: ["Staff"],
            tags: ["parking", "session", "exit"],
            summary: "Quản lý quy trình xe ra khỏi bãi đỗ dựa trên quét thẻ RFID, đối chiếu biển số và tính phí đỗ xe hoặc xác thực vé tháng.",
            objective: "Quản lý quy trình xe ra khỏi bãi đỗ. Hệ thống sẽ quét thẻ RFID để truy xuất phiên đỗ xe hiện tại, đối chiếu hình ảnh/biển số xe lúc vào - lúc ra, tính toán phí đỗ xe (dựa trên bảng giá dành cho khách vãng lai) để nhân viên thu tiền mặt, hoặc kiểm tra tính hợp lệ của vé tháng trước khi cập nhật trạng thái phiên và mở barie.",
            inScope: [
              "Quét và xác thực thẻ RFID tại cổng ra.",
              "Truy xuất thông tin phiên đỗ xe đang hoạt động (Active Parking Session).",
              "Hiển thị hình ảnh camera (vào/ra) để nhân viên đối chiếu biển số.",
              "Thuật toán tính phí đỗ xe cho khách vãng lai (Casual) dựa trên thời gian đỗ và loại xe.",
              "Xử lý giao dịch thu tiền mặt tại quầy.",
              "Xác thực thời hạn vé tháng đối với khách hàng đăng ký trước.",
              "Cập nhật trạng thái thẻ RFID (thu hồi thẻ khách vãng lai)."
            ],
            outOfScope: [
              "Tích hợp các cổng thanh toán trực tuyến (VNPay, MoMo, thẻ tín dụng, v.v.).",
              "Hệ thống mã giảm giá (Discount codes/Vouchers) và các chương trình khuyến mãi.",
              "Xử lý nhận diện biển số (ALPR/ANPR) ở mức độ phần cứng (chỉ nhận chuỗi text từ thiết bị camera truyền lên)."
            ],
            permissions: [
              { role: "Staff", permission: "Full Access. Nhân viên vận hành cổng/thu ngân có quyền xác nhận xe ra, thu tiền mặt và mở cổng." },
              { role: "Manager", permission: "Read-only. Có quyền xem lịch sử các phiên đỗ xe đã hoàn tất nhưng không thao tác tại cổng." },
              { role: "Admin", permission: "Read-only. Có quyền xem lịch sử các phiên đỗ xe đã hoàn tất nhưng không thao tác tại cổng." }
            ],
            businessRules: [
              "Fee Calculation: Phí phải được tính toán tự động bằng hàm nội bộ trước khi thực hiện Casual Exit. Không hỗ trợ giảm giá hay thanh toán online, nhân viên thu tiền mặt bằng đúng số tiền hệ thống hiển thị.",
              "Monthly Pass Rules: Vé tháng phải còn hạn (Expiry Date >= Current Date) và biển số xe ra phải khớp 100% với biển số đã đăng ký vé tháng.",
              "Card Status: Thẻ khách vãng lai sau khi exit thành công phải chuyển trạng thái từ InUse sang Available để tái sử dụng.",
              "Time Validation: ExitTime bắt buộc phải lớn hơn EntryTime."
            ],
            dbExistingTables: ["ParkingSessions", "Cards", "Vehicles", "MonthlyPasses", "PricingPolicies"],
            dbRelationships: [
              "Một ParkingSession phải liên kết với một Card hợp lệ và một Gate ra có tồn tại trong hệ thống."
            ],
            validationRules: [
              { field: "cardCode", rule: "Bắt buộc. Phải tồn tại trong hệ thống và đang gắn với một ParkingSession có trạng thái Active.", errorMessage: "VALIDATION_FAILED" },
              { field: "exitPlateNumber", rule: "Không được để trống. Nếu có sai lệch (mismatch) với entryPlate, hệ thống trả về cảnh báo (Warning code) để nhân viên tự đối chiếu bằng mắt và xác nhận override.", errorMessage: "PLATE_MISMATCH_WARNING" },
              { field: "collectedAmount", rule: "Phải bằng hoặc lớn hơn calculatedFee (không áp dụng online/discount).", errorMessage: "INSUFFICIENT_PAYMENT" }
            ],
            securityRules: [
              "Chỉ Token chứa Role Staff hoặc có Permission Exit_Gate_Operation mới được gọi các endpoint POST.",
              "Validate chặt chẽ chống Request Replay: Không thể gọi /exit hai lần cho cùng một Session ID.",
              "Ngăn chặn SQL Injection và XSS trên các trường string nhận từ camera/phần cứng."
            ],
            logEvents: [
              "Gọi API tính phí (Calculate Fee) và kết quả trả về.",
              "Giao dịch xác nhận xe ra thành công (ghi rõ ID nhân viên thực hiện, số tiền thu).",
              "Hành động \"Force Exit\" (nếu nhân viên dùng quyền ghi đè cảnh báo sai lệch biển số)."
            ],
            noLogEvents: [
              "Bearer tokens, mật khẩu người dùng."
            ],
            integrationPoints: [
              { system: "Hardware/IoT Trigger", responsibility: "API có thể sẽ trả về tín hiệu điều khiển (Webhook/SignalR) xuống hệ thống Local Gateway để kích hoạt relay mở thanh Barie sau khi Response trả về success: true." }
            ],
            uiPage: "/exit-gate",
            uiComponents: "Split View panel (Entry Info vs Exit Camera), Manual Plate Override dialog, Cash Collection modal with [Confirm & Open Gate] button",
            uiStateLoading: "Disable input and action buttons, show spinner on cashier dashboard.",
            uiStateEmpty: "No active session found for the scanned card.",
            uiStateError: "Show red border alert on plate mismatch, requiring staff confirmation PIN/override.",
            uiStateSuccess: "Open barrier gate, display success toast, reset screen to standby.",
            endpoints: [
              "GET /api/core/parking-sessions/by-card-code/{cardCode}",
              "POST /api/core/parking-sessions/{id}/calculate-fee",
              "POST /api/core/parking-sessions/{id}/exit",
              "POST /api/core/parking-sessions/{id}/monthly-pass-exit"
            ],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-exit-by-card",
                name: "GET /api/core/parking-sessions/by-card-code/{cardCode}",
                content: `Method: GET\nPath: /api/core/parking-sessions/by-card-code/{cardCode}\nHeaders:\n  Authorization: Bearer <token>\nResponse 200 OK:\n{\n  "success": true,\n  "data": {\n    "sessionId": "guid-uuid",\n    "cardCode": "RFID-123456",\n    "sessionType": "Casual", // or "Monthly"\n    "entryTime": "2026-07-17T08:00:00Z",\n    "entryPlate": "59A-12345",\n    "entryImageUrl": "/images/entry/123.jpg",\n    "vehicleType": "Car"\n  }\n}`
              },
              {
                id: "contract-exit-calc-fee",
                name: "POST /api/core/parking-sessions/{id}/calculate-fee",
                content: `Method: POST\nPath: /api/core/parking-sessions/{id}/calculate-fee\nHeaders:\n  Authorization: Bearer <token>\nResponse 200 OK:\n{\n  "success": true,\n  "data": {\n    "durationMinutes": 180,\n    "calculatedFee": 30000,\n    "currency": "VND",\n    "pricingSchemeId": 2\n  }\n}`
              },
              {
                id: "contract-exit-casual",
                name: "POST /api/core/parking-sessions/{id}/exit",
                content: `Method: POST\nPath: /api/core/parking-sessions/{id}/exit\nHeaders:\n  Authorization: Bearer <token>\n  Content-Type: application/json\nRequest Body:\n{\n  "exitGateId": "GATE-OUT-01",\n  "exitPlateNumber": "59A-12345",\n  "exitImageUrl": "/images/exit/456.jpg",\n  "collectedAmount": 30000,\n  "paymentMethod": "Cash",\n  "staffId": "STAFF-001"\n}\nResponse 200 OK:\n{\n  "success": true,\n  "message": "Vehicle exited successfully. Gate opened.",\n  "data": { "sessionId": "guid-uuid", "status": "Completed" }\n}`
              },
              {
                id: "contract-exit-monthly",
                name: "POST /api/core/parking-sessions/{id}/monthly-pass-exit",
                content: `Method: POST\nPath: /api/core/parking-sessions/{id}/monthly-pass-exit\nHeaders:\n  Authorization: Bearer <token>\n  Content-Type: application/json\nRequest Body:\n{\n  "exitGateId": "GATE-OUT-02",\n  "exitPlateNumber": "51G-98765",\n  "exitImageUrl": "/images/exit/789.jpg"\n}\nResponse 200 OK:\n{\n  "success": true,\n  "message": "Monthly pass valid. Gate opened."\n}`
              }
            ],
            testCases: [
              {
                id: "tc-exit-casual-success",
                title: "Verify Staff can process Casual Exit with correct exact cash",
                type: "api",
                precondition: "Có một session vãng lai đang Active.",
                steps: [
                  "Login as Staff.",
                  "GET session by cardCode.",
                  "POST calculate fee -> get X amount.",
                  "POST exit with collectedAmount = X and paymentMethod = Cash."
                ],
                expectedResult: "HTTP 200. Session status = Completed. Card status = Available.",
                status: "not_started"
              },
              {
                id: "tc-exit-monthly-expired",
                title: "Verify Monthly Pass exit fails if pass is expired",
                type: "api",
                precondition: "Có một session vé tháng đang Active nhưng vé tháng đã hết hạn vào ngày hôm qua.",
                steps: [
                  "Call POST /api/core/parking-sessions/{id}/monthly-pass-exit."
                ],
                expectedResult: "HTTP 400 Bad Request / 403 Forbidden. Trả về mã lỗi MONTHLY_PASS_EXPIRED. Session vẫn ở trạng thái Active.",
                status: "not_started"
              },
              {
                id: "tc-exit-invalid-payment",
                title: "Verify API completely rejects invalid payment methods",
                type: "api",
                precondition: "Payload gửi lên có chứa paymentMethod: 'VNPay' hoặc discountCode: 'SALE10'.",
                steps: [
                  "POST /exit with the payload."
                ],
                expectedResult: "HTTP 400. Model validation fails (strict validation on DTO only accepting 'Cash' or ignoring extra fields).",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-exit-contract", content: "API contract is fully documented and includes payload definitions.", checked: true },
              { id: "dc-exit-clients", content: "Required clients/roles are assigned properly.", checked: true },
              { id: "dc-exit-rules", content: "Business rules explicitly forbid online payments/discounts and are visible in AI export.", checked: true },
              { id: "dc-exit-resp", content: "Success response uses common API response format where applicable.", checked: true },
              { id: "dc-exit-err", content: "Error response is clear and does not leak sensitive data.", checked: true },
              { id: "dc-exit-tests", content: "At least three robust test cases are defined (Casual, Monthly, Validation).", checked: true },
              { id: "dc-exit-export", content: "Feature can be exported as AI-readable Markdown.", checked: true },
              { id: "dc-exit-rfid", content: "Card RFID scanning loads correct active session.", checked: true },
              { id: "dc-exit-fee", content: "Accurate fee calculation based on active pricing scheme.", checked: true },
              { id: "dc-exit-cash", content: "Proper handling of cash collection confirmation before completing exit.", checked: true },
              { id: "dc-exit-monthly-flow", content: "Seamless gate exit for registered monthly pass vehicles (valid expiry).", checked: true }
            ],
            notes: "Before coding:\nInspect the existing .NET Core API project structure.\nLocate existing Domain Models (ParkingSession, Card).\nImplement ExitController utilizing existing IUnitOfWork and IRepository patterns.\nAdd DTOs for Exit Requests ensuring strict validation (e.g., Enum validation for PaymentMethod allowing only Cash).\nImplement the smallest correct change. Do not scaffold payment gateway integrations.\nRun all relevant tests.\nReport changed files, reason, verification, and remaining risks."
          },
          {
            id: "leaf-mp-validation",
            title: "Monthly Pass Check During Entry Exit",
            type: "leaf_feature",
            status: "ready",
            priority: "high",
            clients: ["Staff", "System"],
            tags: ["monthly-passes", "entry-exit", "validation", "performance", "barrier"],
            summary: "Implement a high-performance, read-only validation endpoint to verify vehicle eligibility based on MonthlyPass status during entry/exit events.",
            objective: "Determine if a vehicle is exempt from casual parking fees and to authorize barrier passage by verifying plate number, vehicle status, and temporal validity in real-time. This feature acts as the decision engine for the Entry/Exit system.",
            inScope: [
              "Plate normalization via PlateNormalizationService.",
              "Status verification (ACTIVE, EXPIRED, SUSPENDED).",
              "Temporal validity checks (valid_from/valid_to).",
              "Integration with ParkingCard status (Lost/Active).",
              "Pricing exemption flag calculation.",
              "Grace period checking via MonthlyPassPolicy or SystemConfig."
            ],
            outOfScope: [
              "Physical barrier hardware control.",
              "ANPR image processing (handled by edge devices).",
              "Payment transaction processing."
            ],
            permissions: [
              { role: "Staff", permission: "Manual check via UI for troubleshooting or support." },
              { role: "System", permission: "Automated service-to-service call triggered by entry/exit events. Requires strict Service-to-Service authentication." }
            ],
            businessRules: [
              "Plate Normalization: Use PlateNormalizationService to sanitize input (strip spaces, ignore case) before querying.",
              "Pass Validity: Pass must be ACTIVE. If EXPIRED, check system configuration for allowed grace days (Inspect MonthlyPassPolicy or SystemConfig). If beyond grace period, return isValid: false.",
              "Duplicate Pass Handling: If multiple passes exist for the same plate, select the one with the latest valid_to.",
              "User Status: Block if the linked User status is INACTIVE.",
              "Lost Card: If linked ParkingCard status is LOST, block access.",
              "Pending Renewal: Check for existing PENDING renewals; access logic depends on current policy (Inspect MonthlyPassPolicy).",
              "Performance: Use AsNoTracking() in EF Core for all queries. Composite index ix_monthly_passes_plate_status on (plate_number, status) must be validated.",
              "Rate Limiting: Mandatory to prevent barrier brute-forcing."
            ],
            dbExistingTables: ["monthly_passes", "parking_cards", "users"],
            dbNewTablesSql: "",
            dbRelationships: [
              "monthly_passes: Join users to check user status.",
              "monthly_passes: Join parking_cards to check card lost status."
            ],
            validationRules: [
              { field: "plateNumber", rule: "Mandatory. Must pass existing project format validation (Inspect ValidationService).", errorMessage: "PLATE_NUMBER_REQUIRED" },
              { field: "vehicleType", rule: "Must match existing VehicleType enum/table values.", errorMessage: "INVALID_VEHICLE_TYPE" }
            ],
            securityRules: [
              "Rate Limiting: Mandatory to prevent barrier brute-forcing.",
              "PII Protection: Return only non-sensitive identifiers (e.g., passId, isValid). Never expose user names or payment details."
            ],
            logEvents: [
              "Log all Access Denied events with plate number and ReasonCode.",
              "Log P95/P99 query latency metrics for barrier controller performance monitoring."
            ],
            noLogEvents: [
              "Do not log sensitive details such as card numbers, user credentials, or JWT payloads."
            ],
            integrationPoints: [
              { system: "Entry/Exit Barrier Controller", responsibility: "Consuming isExempt flag to open or keep barrier closed." },
              { system: "Parking Session Service", responsibility: "Receiving exemption flag to skip casual fee calculation." },
              { system: "ParkingCard Service", responsibility: "Checking card status for LOST flag." }
            ],
            uiPage: "/staff/entry-check or /gate-controller/validate",
            uiComponents: "Staff view with real-time plate validation result badge. Gate controller receives JSON payload directly.",
            uiStateLoading: "N/A for gate controller. Staff UI shows loading indicator while API request is pending.",
            uiStateEmpty: "N/A",
            uiStateError: "Display reasonCode on staff UI (e.g., 'CARD_LOST', 'USER_INACTIVE') for manual resolution.",
            uiStateSuccess: "Gate opens immediately if isExempt is true. Staff view shows green validation badge.",
            notes: "Always return HTTP 200 OK for all logical business results. Use isValid: false in response body for missing or invalid passes — NEVER use HTTP 404 for missing plate/pass results.",
            dependencies: [],
            risks: [],
            endpoints: ["GET /api/core/monthly-passes/check"],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-mpv-get-check",
                name: "GET /api/core/monthly-passes/check",
                content: `Method: GET\nPath: /api/core/monthly-passes/check?plateNumber=59A-12345&vehicleType=Car\nHeaders:\n  Authorization: Bearer <token>\n\nResponse 200 OK (Pass is valid and exempt):\n{\n  "success": true,\n  "data": {\n    "isValid": true,\n    "isExempt": true,\n    "reasonCode": "OK",\n    "passId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"\n  }\n}\n\nResponse 200 OK (Pass expired beyond grace period):\n{\n  "success": true,\n  "data": {\n    "isValid": false,\n    "isExempt": false,\n    "reasonCode": "EXPIRED_OUTSIDE_GRACE_PERIOD",\n    "passId": null\n  }\n}`
              }
            ],
            testCases: [
              {
                id: "tc-mpv-valid-pass",
                title: "Verify valid active pass returns isValid true and isExempt true",
                type: "integration",
                precondition: "Pass is ACTIVE with valid date range and non-LOST card and ACTIVE user.",
                steps: [
                  "Dispatch GET /api/core/monthly-passes/check?plateNumber=59A-12345&vehicleType=Car."
                ],
                expectedResult: "HTTP 200 OK. isValid: true, isExempt: true, reasonCode: 'OK'.",
                status: "not_started"
              },
              {
                id: "tc-mpv-plate-not-found",
                title: "Verify unknown plate returns isValid false with PLATE_NOT_FOUND reasonCode",
                type: "integration",
                precondition: "No pass exists for the queried plate.",
                steps: [
                  "Dispatch GET /check?plateNumber=99Z-99999."
                ],
                expectedResult: "HTTP 200 OK. isValid: false, reasonCode: 'PLATE_NOT_FOUND'.",
                status: "not_started"
              },
              {
                id: "tc-mpv-expired-inside-grace",
                title: "Verify expired pass within grace period returns isValid true",
                type: "integration",
                precondition: "Pass EXPIRED 2 days ago. Grace period is 5 days.",
                steps: [
                  "Dispatch GET /check with matching plate."
                ],
                expectedResult: "HTTP 200 OK. isValid: true, isExempt: true, reasonCode: 'OK'.",
                status: "not_started"
              },
              {
                id: "tc-mpv-expired-outside-grace",
                title: "Verify expired pass outside grace period returns isValid false",
                type: "integration",
                precondition: "Pass EXPIRED 10 days ago. Grace period is 5 days.",
                steps: [
                  "Dispatch GET /check with matching plate."
                ],
                expectedResult: "HTTP 200 OK. isValid: false, reasonCode: 'EXPIRED_OUTSIDE_GRACE_PERIOD'.",
                status: "not_started"
              },
              {
                id: "tc-mpv-user-inactive",
                title: "Verify pass linked to inactive user is blocked",
                type: "integration",
                precondition: "Pass is ACTIVE but linked User status is INACTIVE.",
                steps: [
                  "Dispatch GET /check with plate of inactive user's vehicle."
                ],
                expectedResult: "HTTP 200 OK. isValid: false, reasonCode: 'USER_INACTIVE'.",
                status: "not_started"
              },
              {
                id: "tc-mpv-card-lost",
                title: "Verify pass linked to LOST parking card is blocked",
                type: "integration",
                precondition: "Pass is ACTIVE but linked ParkingCard status is LOST.",
                steps: [
                  "Dispatch GET /check with matching plate."
                ],
                expectedResult: "HTTP 200 OK. isValid: false, reasonCode: 'CARD_LOST'.",
                status: "not_started"
              },
              {
                id: "tc-mpv-suspended-pass",
                title: "Verify suspended pass is blocked",
                type: "integration",
                precondition: "Pass status is SUSPENDED.",
                steps: [
                  "Dispatch GET /check with matching plate."
                ],
                expectedResult: "HTTP 200 OK. isValid: false, reasonCode: 'PASS_SUSPENDED'.",
                status: "not_started"
              },
              {
                id: "tc-mpv-plate-normalization",
                title: "Verify plate with spaces and mixed case is correctly normalized before lookup",
                type: "integration",
                precondition: "Pass exists for plate '59A-12345'. Caller sends plate ' 59a 12345 '.",
                steps: [
                  "Dispatch GET /check?plateNumber= 59a 12345 ."
                ],
                expectedResult: "HTTP 200 OK. isValid: true. Pass is found correctly after normalization.",
                status: "not_started"
              },
              {
                id: "tc-mpv-unauthorized",
                title: "Verify request without authorization token is rejected",
                type: "api",
                precondition: "No bearer token provided.",
                steps: [
                  "Dispatch GET /check without Authorization header."
                ],
                expectedResult: "HTTP 401 Unauthorized.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-mpv-inspect", content: "AI has inspected and reused MonthlyPassRepository, PlateNormalizationService, MonthlyPassPolicy, and ParkingCard entity.", checked: true },
              { id: "dc-mpv-performance", content: "AsNoTracking() is used for all repository calls. Composite index is validated.", checked: true },
              { id: "dc-mpv-statuses", content: "Logic covers all defined status checks: Active, Grace Period, User Status, Lost Card, Suspended.", checked: true },
              { id: "dc-mpv-response", content: "Always returns HTTP 200 OK for all logical business results. HTTP 404 is never returned for missing plates.", checked: true },
              { id: "dc-mpv-normalization", content: "Plate normalization via PlateNormalizationService is applied before every DB query.", checked: true },
              { id: "dc-mpv-rate-limit", content: "Rate limiting is configured and tested.", checked: true },
              { id: "dc-mpv-contract", content: "API contract is documented in this node.", checked: true },
              { id: "dc-mpv-tests", content: "All 9 test cases covering happy and unhappy flows are defined.", checked: true },
              { id: "dc-mpv-pii", content: "Response never exposes sensitive PII data. Only passId and validation flags are returned.", checked: true }
            ]
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
            status: "in_progress",
            priority: "high",
            clients: ["System"],
            tags: ["payments", "payos", "webhook", "security"],
            summary: "Cung cấp một endpoint an toàn nhận thông báo trạng thái giao dịch bất đồng bộ từ cổng thanh toán PayOS.",
            objective: "Cung cấp một endpoint an toàn (Webhook) nhận thông báo trạng thái giao dịch bất đồng bộ (Asynchronous Notification) từ cổng thanh toán PayOS. Sau khi nhận và xác thực chữ ký số thành công, hệ thống tự động cập nhật trạng thái thanh toán của hóa đơn tương ứng, kết thúc phiên đỗ xe (hoặc gia hạn vé tháng), và sẵn sàng kích hoạt lệnh mở barie thông qua IoT gateway tại cổng ra.",
            inScope: [
              "Tiếp nhận payload POST request từ PayOS.",
              "Xác thực chữ ký số (Webhook Signature Validation) sử dụng thuật toán HMAC-SHA256 cùng mã Checksum Key của PayOS.",
              "Xử lý tính trùng lặp (Idempotency Control) để tránh việc xử lý một giao dịch nhiều lần khi nhận trùng webhook.",
              "Cập nhật trạng thái giao dịch (Payments) và trạng thái phiên đỗ xe (ParkingSessions) tương ứng trong database.",
              "Xử lý kịch bản ngoại lệ (lệch tiền thanh toán thực tế, sai mã hóa đơn)."
            ],
            outOfScope: [
              "Tạo link thanh toán trực tuyến (được xử lý ở API Checkout riêng biệt).",
              "Giao diện người dùng hiển thị kết quả (Webhook hoạt động hoàn toàn ở background)."
            ],
            permissions: [
              { role: "System", permission: "Chỉ có hệ thống PayOS (hoặc các request giả lập có Signature hợp lệ) mới có quyền gửi dữ liệu tới endpoint này." }
            ],
            businessRules: [
              "Signature Verification Constraint: Bắt buộc phải tính toán lại chữ ký HMAC-SHA256 từ data nhận được bằng Webhook Checksum Key được cấu hình trong AppSettings. Nếu chữ ký không khớp, hệ thống phải từ chối xử lý ngay lập tức.",
              "Idempotency: Nếu một giao dịch thanh toán đã được cập nhật trạng thái là Paid / Completed, mọi Webhook tiếp theo của giao dịch đó phải bị bỏ qua và lập tức trả về HTTP 200 OK (để báo cho PayOS biết hệ thống đã xử lý thành công, tránh việc PayOS gửi lại).",
              "Amount Matching Rules: Số tiền nhận từ Webhook (data.amount) phải khớp chính xác 100% với số tiền cần thanh toán được ghi nhận trong cơ sở dữ liệu (Payments.Amount). Nếu xảy ra hiện tượng sai lệch: Trạng thái giao dịch chuyển thành UnderReview. Không tự động hoàn tất phiên đỗ xe (không mở barie). Ghi log cảnh báo mức độ Critical để ban quản lý xử lý thủ công."
            ],
            dbExistingTables: ["ParkingSessions"],
            dbNewTablesSql: `-- Table to manage transaction payment records\nCREATE TABLE Payments (\n  Id UUID PRIMARY KEY,\n  SessionId UUID NOT NULL REFERENCES ParkingSessions(Id),\n  OrderCode BIGINT NOT NULL,\n  PaymentLinkId VARCHAR(100) NOT NULL,\n  Amount DECIMAL(18, 2) NOT NULL,\n  Status VARCHAR(50) NOT NULL,\n  PaymentMethod VARCHAR(50) NOT NULL,\n  TransactionReference VARCHAR(100),\n  CreatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  CompletedAt TIMESTAMP WITH TIME ZONE\n);\n\nCREATE UNIQUE INDEX IX_Payments_OrderCode ON Payments (OrderCode);\nCREATE UNIQUE INDEX IX_Payments_PaymentLinkId ON Payments (PaymentLinkId);`,
            dbRelationships: [
              "Một ParkingSession có thể có 1-nhiều bản ghi Payments (trong trường hợp giao dịch đầu bị thất bại/hết hạn và người dùng phải tạo lại giao dịch mới)."
            ],
            validationRules: [
              { field: "signature (Root)", rule: "Phải trùng khớp với chữ ký được tạo bằng thuật toán HMAC-SHA256 trên các trường dữ liệu của data kết hợp với Webhook Checksum Key.", errorMessage: "INVALID_SIGNATURE" },
              { field: "data.orderCode", rule: "Phải tồn tại một bản ghi trong bảng Payments có OrderCode tương ứng.", errorMessage: "ORDER_NOT_FOUND" },
              { field: "data.amount", rule: "Số tiền nhận được từ PayOS phải khớp chính xác với Payments.Amount đã tạo trong DB.", errorMessage: "AMOUNT_MISMATCH" }
            ],
            securityRules: [
              "Signature Validation: Đây là chốt chặn bảo mật duy nhất. AI bắt buộc phải viết hàm tính chữ ký nghiêm ngặt.",
              "Không sử dụng trực tiếp dữ liệu từ payload để cập nhật DB khi chưa qua bước kiểm tra chữ ký.",
              "HTTPS Only: Endpoint này chỉ chấp nhận kết nối qua giao thức HTTPS bảo mật."
            ],
            logEvents: [
              "Nhận được Webhook từ PayOS (Log rõ orderCode và paymentLinkId).",
              "Kết quả xác thực chữ ký (Thành công / Thất bại).",
              "Cập nhật trạng thái giao dịch hoàn tất (Ghi rõ số tiền thực tế nhận được).",
              "Cảnh báo mức độ nghiêm trọng (Critical): Khi xảy ra sai lệch số tiền (AMOUNT_MISMATCH)."
            ],
            noLogEvents: [
              "Số tài khoản ngân hàng của khách hàng (data.accountNumber), mã bí mật Webhook Checksum Key trong cấu hình hệ thống."
            ],
            integrationPoints: [
              { system: "PayOS API Service", responsibility: "Sử dụng SDK hoặc API của PayOS để đối chiếu thêm trạng thái giao dịch nếu cần." },
              { system: "Gate Control Service", responsibility: "Lắng nghe sự kiện thanh toán thành công thông qua Event Bus (hoặc SignalR) để gửi tín hiệu mở cổng tự động cho xe ra." }
            ],
            uiComponents: "Kiosk/App realtime SignalR listener - no direct UI for the webhook itself.",
            uiStateSuccess: "Khi nhận được tín hiệu Webhook thành công thông qua Realtime Connection (SignalR), UI của Kiosk/App sẽ tự động chuyển từ trạng thái 'Đang chờ thanh toán...' (Waiting for Payment) sang màn hình màu xanh lá 'Thành công! Mời xe ra khỏi bãi' mà người dùng không cần bấm nút reload thủ công.",
            endpoints: ["POST /api/core/payments/payos/webhook"],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-payos-webhook",
                name: "POST /api/core/payments/payos/webhook",
                content: `Method: POST\nPath: /api/core/payments/payos/webhook\nHeaders:\n  Content-Type: application/json\n\n// NOTE: Endpoint này không dùng Header Bearer Token thông thường\n// mà dùng cơ chế xác thực dựa trên chữ ký trong Body của PayOS.\n\nRequest Body (from PayOS):\n{\n  "code": "00",\n  "desc": "success",\n  "data": {\n    "orderCode": 123456,\n    "amount": 30000,\n    "description": "Thanh toan phi do xe phien 59A-12345",\n    "accountNumber": "0123456789",\n    "reference": "FT2619283712",\n    "transactionDateTime": "2026-07-17T17:00:00Z",\n    "currency": "VND",\n    "paymentLinkId": "payos-link-uuid-abc123",\n    "signature": "8a36d93610cfb1c1d476f59bf0f5d496a798b04a8b7cf7a9b1c7da20e3ad1b2c"\n  },\n  "signature": "9c23f81520dfb2c1d476f59bf0f5d496a798b04a8b7cf7a9b1c7da20e3ad1b2d"\n}\n\n// Response 200 OK (Luôn trả về 200 cho PayOS nếu request hợp lệ về mặt kỹ thuật,\n// kể cả khi logic nghiệp vụ bị lỗi/lệch tiền)\n{\n  "success": true,\n  "message": "Webhook processed successfully."\n}`
              }
            ],
            testCases: [
              {
                id: "tc-payos-valid-signature",
                title: "Verify successful payment processing with valid PayOS signature",
                type: "integration",
                precondition: "Có một bản ghi Payments với OrderCode = 123456, Amount = 30000 và Status = Pending.",
                steps: [
                  "Tạo mock payload hợp lệ từ PayOS có chữ ký đúng chuẩn.",
                  "POST tới /api/core/payments/payos/webhook."
                ],
                expectedResult: "HTTP 200 OK. Bản ghi Payments chuyển sang Completed. Phiên đỗ xe liên kết chuyển trạng thái sẵn sàng cho xe ra.",
                status: "not_started"
              },
              {
                id: "tc-payos-invalid-signature",
                title: "Verify Webhook is rejected if signature is invalid",
                type: "api",
                precondition: "Payload gửi lên có signature bị sai lệch.",
                steps: [
                  "Gửi POST request với chữ ký ngẫu nhiên không đúng thuật toán."
                ],
                expectedResult: "HTTP 400 Bad Request hoặc 401 Unauthorized với thông báo lỗi INVALID_SIGNATURE. Không có thay đổi trạng thái nào trong DB.",
                status: "not_started"
              },
              {
                id: "tc-payos-amount-mismatch",
                title: "Verify amount mismatch transitions payment to UnderReview",
                type: "integration",
                precondition: "Bản ghi Payments lưu trong DB yêu cầu thanh toán 30000 VND.",
                steps: [
                  "Gửi mock payload từ PayOS có chữ ký đúng nhưng trường amount = 20000 VND."
                ],
                expectedResult: "HTTP 200 OK (để phản hồi PayOS nhận tin). Nhưng bản ghi Payments trong DB cập nhật trạng thái thành UnderReview và ghi log cảnh báo sai tiền. Trạng thái đỗ xe vẫn giữ nguyên, không giải phóng xe.",
                status: "not_started"
              },
              {
                id: "tc-payos-idempotency",
                title: "Verify duplicate Webhook requests (Idempotency) are handled safely",
                type: "integration",
                precondition: "Một giao dịch đã được thanh toán thành công (Status = Completed).",
                steps: [
                  "Gửi lại chính xác payload webhook đã thành công của giao dịch đó một lần nữa."
                ],
                expectedResult: "HTTP 200 OK lập tức trả về. Database không bị cập nhật lại (không ghi đè thời gian CompletedAt, không trigger lại luồng mở barie).",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-payos-contract", content: "API contract is documented in this node.", checked: true },
              { id: "dc-payos-public-access", content: "Webhook endpoint is publicly accessible without typical user-JWT authorization (instead secured via Signature Validation).", checked: true },
              { id: "dc-payos-hmac", content: "Dynamic Signature verification based on HMAC-SHA256 is implemented and fully tested.", checked: true },
              { id: "dc-payos-idempotency", content: "Double-execution (Idempotency) prevention mechanism is implemented and validated.", checked: true },
              { id: "dc-payos-mismatch", content: "Amount mismatch scenarios are handled safely by routing to UnderReview status instead of blindly marking as paid.", checked: true },
              { id: "dc-payos-session-update", content: "Successfully updating payment status triggers the business process to free the corresponding active parking session.", checked: true },
              { id: "dc-payos-log-filter", content: "Sensitive details like personal bank account numbers are filtered out from application logging.", checked: true }
            ],
            notes: "Before coding:\nInspect the existing .NET Core API project structures and patterns.\nImplement utility methods for parsing, sorting, and generating HMAC-SHA256 letters matching PayOS signature standards exactly.\nUtilize Entity Framework transactions to ensure updates to Payments and ParkingSessions tables happen atomically.\nImplement distributed locks or pessimistic DB locking on Payments where OrderCode matches, preventing race conditions from simultaneous duplicate webhook posts.\nCheck existing test suites and add tests covering valid webhook, duplicate webhook, invalid signature, and mismatched amounts.\nRun all tests to ensure no regressions.\nReport changed files, verification results, and any environment variable changes needed (e.g., PayOS:WebhookChecksumKey)."
          },
          {
            id: "leaf-pay-online",
            title: "Online Exit Fee Payment",
            type: "leaf_feature",
            status: "ready",
            priority: "must_have",
            clients: ["Manager", "Staff", "Driver"],
            tags: ["payments", "payos", "online", "exit-fee", "transaction"],
            summary: "This feature initiates online parking fee payment transactions via the PayOS gateway. The fee calculation algorithm prioritizes the use of Snapshot Pricing (saved at the time of Entry).",
            objective: "The system applies row-level locking (Pessimistic Locking on parking_sessions) combined with a Two-step Transaction to integrate safely with PayOS, generating an accurate 64-bit OrderCode, ensuring transaction uniqueness (PENDING), and data integrity.",
            inScope: [
              "Initiate PayOS payment link creation for parking exit fee.",
              "Snapshot Pricing priority with fallback to PricingRule table.",
              "Two-step DB transaction: Tx1 inserts PENDING payment, Tx2 updates with PayOS response.",
              "Pessimistic locking via SELECT FOR UPDATE on parking_sessions.",
              "Idempotent handling: same sessionId within 15 minutes returns existing PENDING checkout URL.",
              "64-bit OrderCode generation.",
              "Audit log recording."
            ],
            outOfScope: [
              "Receipts: The receipts table must NOT be written to in this feature.",
              "Webhook / Exit Process: PayOS callback handling and gate opening logic are in another module.",
              "Auto-retry: Do not auto-retry POST to PayOS to avoid duplicate orders."
            ],
            permissions: [
              { role: "Driver", permission: "Initiate payment for own parking session. Requires ownership check: parking_sessions.driver_id must match JWT userId." },
              { role: "Staff", permission: "Initiate payment on behalf of any session." },
              { role: "Manager", permission: "Initiate payment on behalf of any session." }
            ],
            businessRules: [
              "Payment Required Check: If payment_required == false on session, return 422 NO_PAYMENT_REQUIRED immediately.",
              "Session Status: Session must be ACTIVE. Reject Completed/Cancelled sessions with 404/422.",
              "Driver Ownership (IDOR): If role is Driver, parking_sessions.driver_id must join driver_profiles.user_id matching JWT userId. Return 403 UNAUTHORIZED_SESSION_ACCESS if mismatch.",
              "Snapshot Pricing: Must use snapshot_day_price etc. if != NULL. Only fallback to pricing_rules table if Snapshot is NULL (Legacy Data).",
              "Single PENDING Payment: Partial unique index on (session_id) WHERE status = 'PENDING'. If PENDING exists with valid checkout_url, return it idempotently.",
              "Two-step Transaction: Tx1 inserts PENDING payment and COMMITS before calling PayOS. NEVER call PayOS Gateway inside an EF Core Transaction Block.",
              "OrderCode: Must be a 64-bit integer. Never use GUID/UUID as PayOS OrderCode.",
              "Gateway Failure: If PayOS fails, execute Tx2 to UPDATE payment status to FAILED. Do not rollback the PaymentId.",
              "Idempotency Window: Same sessionId within 15 minutes returns the exact same checkout_url."
            ],
            dbExistingTables: ["parking_sessions", "driver_profiles", "parking_cards"],
            dbNewTablesSql: `-- Schema updates required in 03_indexes_constraints.sql:
-- 1. ALTER TABLE payments DROP CONSTRAINT ck_payments_method;
--    ALTER TABLE payments ADD CONSTRAINT ck_payments_method CHECK (method IN ('CASH', 'NONE', 'ONLINE'));
-- 2. ALTER TABLE payments DROP CONSTRAINT ck_payments_status;
--    ALTER TABLE payments ADD CONSTRAINT ck_payments_status CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'WAIVED', 'NOT_REQUIRED', 'EXPIRED'));
-- 3. ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider VARCHAR;
--    ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_transaction_id BIGINT;
--    ALTER TABLE payments ADD COLUMN IF NOT EXISTS checkout_url TEXT;
--    ALTER TABLE payments ADD COLUMN IF NOT EXISTS qr_code TEXT;
--    ALTER TABLE payments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
-- 4. CREATE UNIQUE INDEX IF NOT EXISTS idx_single_pending_payment ON payments (session_id) WHERE status = 'PENDING';`,
            dbRelationships: [
              "parking_sessions: Read to validate session status and payment_required flag. SELECT FOR UPDATE locks the row.",
              "driver_profiles: Read to verify driver ownership (driver_profiles.user_id == JWT userId).",
              "payments: Write (INSERT PENDING in Tx1, UPDATE with PayOS response in Tx2).",
              "audit_logs: Write to record Payment Request Created event."
            ],
            validationRules: [
              { field: "sessionId", rule: "Required. Session must exist and be ACTIVE.", errorMessage: "SESSION_NOT_FOUND" },
              { field: "returnUrl", rule: "Required. Valid URL format.", errorMessage: "VALIDATION_ERROR" },
              { field: "cancelUrl", rule: "Required. Valid URL format.", errorMessage: "VALIDATION_ERROR" },
              { field: "payment_required", rule: "Session flag must be true. If false, abort immediately.", errorMessage: "NO_PAYMENT_REQUIRED" }
            ],
            securityRules: [
              "JWT Auth: All requests must provide valid Bearer token.",
              "IDOR Prevention: Driver role must match parking_sessions.driver_id via driver_profiles. Return 403 if mismatch.",
              "Mass Assignment: Never bind HTTP request directly to EF Core entity."
            ],
            logEvents: [
              "Log all events with: RequestId, CorrelationId, TraceId, SessionId, PaymentId, OrderCode, Latency (ms), Gateway Result.",
              "Audit log must record 'Payment Request Created' with old/new payment status."
            ],
            noLogEvents: [
              "Do not log full PayOS response body containing sensitive financial data.",
              "Never log JWT payloads or user passwords."
            ],
            integrationPoints: [
              { system: "PayOS Gateway", responsibility: "Generating checkout URL and QR code via POST /v2/payment-requests. Called OUTSIDE EF Core transaction." },
              { system: "Pricing Module", responsibility: "Providing fallback PricingRule if Snapshot is NULL (Legacy Data)." }
            ],
            uiPage: "/driver/payment or /staff/exit-payment",
            uiComponents: "Payment confirmation modal showing fee amount and new valid_to. QR code display. Redirect to PayOS checkout URL. Loading state while processing.",
            uiStateLoading: "Disable 'Proceed to Payment' button and show spinner while POST is in flight.",
            uiStateEmpty: "N/A",
            uiStateError: "Show specific error message from reasonCode: 'PAYOS_TIMEOUT', 'NO_PAYMENT_REQUIRED', 'UNAUTHORIZED_SESSION_ACCESS'.",
            uiStateSuccess: "Display checkout URL and QR code. Redirect user to PayOS payment page.",
            notes: "CRITICAL: NEVER call PayOS Gateway inside an EF Core Transaction Block. Two-step commit pattern is mandatory. OrderCode must be 64-bit integer only.",
            dependencies: [],
            risks: [],
            endpoints: ["POST /api/core/payments/online/exit-fee"],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-pay-online-post",
                name: "POST /api/core/payments/online/exit-fee",
                content: `Method: POST\nPath: /api/core/payments/online/exit-fee\nHeaders:\n  Authorization: Bearer <token>\n  Content-Type: application/json\nRequest Body:\n{\n  "sessionId": 123456789,\n  "returnUrl": "https://app.parking.vn/payment/success",\n  "cancelUrl": "https://app.parking.vn/payment/cancel"\n}\n\nResponse 200 OK (New PENDING Payment Created):\n{\n  "success": true,\n  "data": {\n    "paymentId": 987654321,\n    "sessionId": 123456789,\n    "amount": 15000,\n    "status": "PENDING",\n    "checkoutUrl": "https://pay.payos.vn/web/...",\n    "qrCode": "00020101021226...",\n    "expiresAt": "2026-07-19T13:32:00Z"\n  }\n}\n\nResponse 422 Unprocessable Entity (No Payment Required):\n{\n  "success": false,\n  "error": {\n    "code": "NO_PAYMENT_REQUIRED",\n    "message": "This session does not require payment.",\n    "traceId": "0HL-1234567890"\n  }\n}\n\nResponse 504 Gateway Timeout:\n{\n  "success": false,\n  "error": {\n    "code": "PAYOS_TIMEOUT",\n    "message": "The payment gateway did not respond.",\n    "traceId": "0HL-1234567890"\n  }\n}`
              }
            ],
            testCases: [
              {
                id: "tc-payo-happy-path",
                title: "Verify successful payment initiation returns checkout URL and QR code",
                type: "integration",
                precondition: "Active session with payment_required = true. Valid JWT with matching Driver ownership.",
                steps: [
                  "POST /api/core/payments/online/exit-fee with valid sessionId, returnUrl, cancelUrl."
                ],
                expectedResult: "HTTP 200 OK. Tx1 inserts PENDING payment to DB. PayOS returns checkoutUrl. Tx2 updates payment. Response includes checkoutUrl, qrCode, and expiresAt.",
                status: "not_started"
              },
              {
                id: "tc-payo-idempotent-return",
                title: "Verify second request within idempotency window returns same checkout URL",
                type: "integration",
                precondition: "A PENDING payment already exists for the session created within 15 minutes.",
                steps: [
                  "POST /api/core/payments/online/exit-fee with same sessionId again."
                ],
                expectedResult: "HTTP 200 OK. No new DB record created. Response returns existing checkout_url and paymentId.",
                status: "not_started"
              },
              {
                id: "tc-payo-no-payment-required",
                title: "Verify session with payment_required=false is rejected",
                type: "integration",
                precondition: "Session is ACTIVE but payment_required = false.",
                steps: [
                  "POST /api/core/payments/online/exit-fee."
                ],
                expectedResult: "HTTP 422. Error code: NO_PAYMENT_REQUIRED.",
                status: "not_started"
              },
              {
                id: "tc-payo-session-not-found",
                title: "Verify request for unknown sessionId returns 404",
                type: "api",
                precondition: "Session with provided ID does not exist.",
                steps: [
                  "POST /api/core/payments/online/exit-fee with non-existent sessionId."
                ],
                expectedResult: "HTTP 404. Error code: SESSION_NOT_FOUND.",
                status: "not_started"
              },
              {
                id: "tc-payo-idor-driver",
                title: "Verify Driver cannot initiate payment for another Driver's session",
                type: "api",
                precondition: "Authenticated Driver. Session belongs to a different driver.",
                steps: [
                  "POST /api/core/payments/online/exit-fee with another driver's sessionId."
                ],
                expectedResult: "HTTP 403. Error code: UNAUTHORIZED_SESSION_ACCESS.",
                status: "not_started"
              },
              {
                id: "tc-payo-snapshot-pricing",
                title: "Verify fee is calculated from Snapshot Pricing when snapshot fields are not null",
                type: "integration",
                precondition: "Session has snapshot_day_price != NULL.",
                steps: [
                  "POST /api/core/payments/online/exit-fee."
                ],
                expectedResult: "HTTP 200 OK. Fee computed from snapshot fields, NOT from pricing_rules table.",
                status: "not_started"
              },
              {
                id: "tc-payo-fallback-pricing",
                title: "Verify fee falls back to PricingRule when all snapshot fields are NULL",
                type: "integration",
                precondition: "Session has snapshot_day_price = NULL (legacy data).",
                steps: [
                  "POST /api/core/payments/online/exit-fee."
                ],
                expectedResult: "HTTP 200 OK. Fee computed from pricing_rules table.",
                status: "not_started"
              },
              {
                id: "tc-payo-gateway-timeout",
                title: "Verify gateway timeout triggers Tx2 FAILED update and returns 504",
                type: "integration",
                precondition: "Mock PayOS to return timeout after Tx1 commits.",
                steps: [
                  "POST /api/core/payments/online/exit-fee."
                ],
                expectedResult: "HTTP 504. PENDING payment is updated to FAILED in DB (Tx2). Payment ID is retained.",
                status: "not_started"
              },
              {
                id: "tc-payo-concurrent-requests",
                title: "Verify concurrent requests for same session are safely serialized by SELECT FOR UPDATE",
                type: "concurrency",
                precondition: "Two concurrent requests for the same sessionId at the exact same time.",
                steps: [
                  "Dispatch two simultaneous POST requests for the same sessionId."
                ],
                expectedResult: "One request creates PENDING. Second request detects existing PENDING and returns it idempotently. No duplicate PENDING payments created.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-payo-schema", content: "Schema updated in 03_indexes_constraints.sql: new columns, updated enums, and partial unique index on payments.", checked: true },
              { id: "dc-payo-two-step-tx", content: "Two-step commit is active: Tx1 inserts PENDING before PayOS call; Tx2 updates on result. PayOS is NEVER called inside EF Core transaction.", checked: true },
              { id: "dc-payo-locking", content: "Pessimistic row lock SELECT FOR UPDATE on parking_sessions is implemented.", checked: true },
              { id: "dc-payo-ordercode", content: "OrderCode uses 64-bit integer only. UUID is strictly forbidden.", checked: true },
              { id: "dc-payo-snapshot", content: "Snapshot Pricing priority is implemented. Fallback to pricing_rules only when snapshot is NULL.", checked: true },
              { id: "dc-payo-idor", content: "IDOR check for Driver ownership against driver_profiles.user_id is enforced.", checked: true },
              { id: "dc-payo-idempotent", content: "Idempotency: same sessionId within 15 minutes returns identical checkout_url without creating duplicate payment.", checked: true },
              { id: "dc-payo-no-receipt", content: "Receipt table is NOT written to in this feature.", checked: true },
              { id: "dc-payo-tests", content: "All 9 test cases covering happy, unhappy, concurrency, and edge cases are defined.", checked: true }
            ]
          },
          {
            id: "leaf-pay-cash",
            title: "Cash Payment",
            type: "leaf_feature",
            status: "ready",
            priority: "medium",
            clients: ["Staff", "Manager"],
            tags: ["payments", "cash", "exit-fee", "transaction", "audit"],
            summary: "Handle parking fee payment transactions via cash (at the counter). Requires staff authorization, session status validation, fee calculation based on Snapshot Pricing (with fallback), updating session status to PAID, and audit logging for reconciliation.",
            objective: "Provide a reliable, atomic cash collection flow for staff that ensures data integrity via DB-level locking, prevents double-payment, and produces a complete audit trail for financial reconciliation.",
            inScope: [
              "Cash payment flow for parking session exit fee.",
              "Snapshot Pricing priority with fallback to PricingRule table.",
              "Amount received validation against calculated fee.",
              "Single atomic DB Transaction: INSERT payment + UPDATE session status + WRITE audit log.",
              "Pessimistic locking (SELECT FOR UPDATE) on parking_sessions to prevent concurrent double-payment.",
              "Audit log recording with CASH_COLLECTION event."
            ],
            outOfScope: [
              "Barrier/Gate opening: this is the Exit Module's responsibility.",
              "Online payment via PayOS: handled by leaf-pay-online.",
              "Receipt generation: handled by a separate receipt module.",
              "Auto-retry on business logic errors (Amount Mismatch, Session Already Paid)."
            ],
            permissions: [
              { role: "Staff", permission: "Collect cash payment on behalf of driver at counter." },
              { role: "Manager", permission: "Collect cash payment and override edge cases where permitted." }
            ],
            businessRules: [
              "Authorization: Only Staff and Manager roles are permitted. Driver access must return 403 FORBIDDEN.",
              "Session Status: parking_sessions.status MUST be ACTIVE. Return 422 SESSION_ALREADY_COMPLETED if PAID or CANCELLED.",
              "Concurrency Control: SELECT FOR UPDATE on parking_sessions at start of transaction. After lock is acquired, re-check status. If already PAID, return 409 SESSION_ALREADY_COMPLETED.",
              "Payment Required Check: If payment_required == false or fee == 0, return 422 NO_PAYMENT_REQUIRED.",
              "Snapshot Pricing: Must use snapshot_day_price etc. if != NULL. Fallback to pricing_rules table if Snapshot is NULL. If both are NULL, return 500 INTERNAL_SERVER_ERROR.",
              "Amount Validation (Server-side): NEVER trust amount from client. Always recalculate fee on server. If amountReceived != calculatedFee, return 422 AMOUNT_MISMATCH.",
              "Atomicity: Payment INSERT, parking_sessions UPDATE, and audit_logs INSERT must be in a single IDbContextTransaction. Rollback all on any exception.",
              "Idempotency: If session is already PAID, do not create a new payment record. Return 409.",
              "Collector ID: Retrieve staff ID from UserContext (JWT), never from request body."
            ],
            dbExistingTables: ["parking_sessions", "payments", "audit_logs", "pricing_rules", "driver_profiles"],
            dbNewTablesSql: "",
            dbRelationships: [
              "parking_sessions: SELECT FOR UPDATE to lock row, validate ACTIVE status, read snapshot pricing fields.",
              "payments: INSERT new payment record with status PAID, method CASH, collector_id from JWT.",
              "audit_logs: INSERT CASH_COLLECTION event with TraceId, SessionId, CollectorId, OldStatus, NewStatus, Amount.",
              "pricing_rules: READ-only fallback when session snapshot pricing fields are NULL."
            ],
            validationRules: [
              { field: "sessionId", rule: "Required. Session must exist and status must be ACTIVE.", errorMessage: "SESSION_NOT_FOUND" },
              { field: "amountReceived", rule: "Required. Must be a positive decimal. Validated server-side against calculated fee.", errorMessage: "AMOUNT_MISMATCH" },
              { field: "notes", rule: "Optional. Max length 500 characters.", errorMessage: "VALIDATION_ERROR" }
            ],
            securityRules: [
              "JWT Auth: All requests must provide valid Bearer token.",
              "Role Enforcement: Only Staff and Manager. Return 403 FORBIDDEN for any other role.",
              "Server-side Recalculation: Amount must be recalculated on server. Never trust client-provided fee amount."
            ],
            logEvents: [
              "Must log: TraceId, SessionId, CollectorId, OldStatus, NewStatus, Amount, Latency.",
              "Audit log CASH_COLLECTION event written atomically inside the main transaction."
            ],
            noLogEvents: [
              "Do not log raw JWT tokens or user passwords.",
              "Do not log full driver personal data in application logs."
            ],
            integrationPoints: [
              { system: "Pricing Module", responsibility: "Providing fallback PricingRule when session snapshot is NULL." },
              { system: "Audit Module", responsibility: "Writing CASH_COLLECTION record inside the same DB transaction." }
            ],
            uiPage: "/staff/cash-payment",
            uiComponents: "Cash collection modal showing: calculated fee, amount received input, notes field, Confirm button. Shows payment receipt summary on success.",
            uiStateLoading: "Disable 'Confirm Payment' button and show spinner while POST is in flight.",
            uiStateEmpty: "N/A",
            uiStateError: "Display specific error from reasonCode: 'AMOUNT_MISMATCH', 'SESSION_ALREADY_COMPLETED', 'NO_PAYMENT_REQUIRED'.",
            uiStateSuccess: "Show payment success confirmation with paymentId, paidAt, collectorId, and amount. Trigger gate opening via Exit Module.",
            notes: "DO NOT trigger barrier/gate opening in this flow. All DB changes (payment, session status, audit log) must be committed in a single atomic transaction. Retry only for transient DB errors (Deadlock), never for business logic errors.",
            dependencies: [],
            risks: [],
            endpoints: ["POST /api/core/payments/cash"],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-pay-cash-post",
                name: "POST /api/core/payments/cash",
                content: `Method: POST\nPath: /api/core/payments/cash\nHeaders:\n  Authorization: Bearer <token>\n  Content-Type: application/json\nRequest Body:\n{\n  "sessionId": 123456789,\n  "amountReceived": 20000,\n  "notes": "Cash collected at counter 1"\n}\n\nResponse 200 OK (Payment Successful):\n{\n  "success": true,\n  "data": {\n    "paymentId": 987654321,\n    "paidAt": "2026-07-19T06:57:00Z",\n    "collectorId": "staff-uuid-001",\n    "status": "PAID"\n  }\n}\n\nResponse 422 (Amount Mismatch):\n{\n  "success": false,\n  "error": {\n    "code": "AMOUNT_MISMATCH",\n    "message": "Received amount does not match calculated fee.",\n    "traceId": "0HL-1234567890"\n  }\n}\n\nResponse 409 (Concurrent Request):\n{\n  "success": false,\n  "error": {\n    "code": "CONCURRENT_REQUEST",\n    "message": "A transaction for this session is already in progress.",\n    "traceId": "0HL-1234567890"\n  }\n}`
              }
            ],
            testCases: [
              {
                id: "tc-cash-happy-path",
                title: "Verify successful cash payment updates session to PAID",
                type: "integration",
                precondition: "Active session with payment_required = true. Staff JWT. amountReceived == calculatedFee.",
                steps: [
                  "POST /api/core/payments/cash with valid sessionId and correct amountReceived."
                ],
                expectedResult: "HTTP 200 OK. Payment record PAID inserted. parking_sessions.status updated to PAID. Audit log CASH_COLLECTION written. Returns paymentId, paidAt, collectorId.",
                status: "not_started"
              },
              {
                id: "tc-cash-amount-mismatch",
                title: "Verify amount mismatch is rejected with 422",
                type: "integration",
                precondition: "Calculated fee is 20000. amountReceived = 15000.",
                steps: [
                  "POST /api/core/payments/cash with amountReceived = 15000."
                ],
                expectedResult: "HTTP 422. Error code: AMOUNT_MISMATCH. No DB changes.",
                status: "not_started"
              },
              {
                id: "tc-cash-unauthorized-driver",
                title: "Verify Driver role is rejected with 403",
                type: "api",
                precondition: "Authenticated as Driver role.",
                steps: [
                  "POST /api/core/payments/cash with Driver JWT."
                ],
                expectedResult: "HTTP 403 FORBIDDEN.",
                status: "not_started"
              },
              {
                id: "tc-cash-concurrent",
                title: "Verify concurrent collection by 2 staff on same session: 1 success, 1 conflict",
                type: "concurrency",
                precondition: "Two staff submit payment for same sessionId simultaneously.",
                steps: [
                  "Dispatch two simultaneous POST requests for the same sessionId from different staff accounts."
                ],
                expectedResult: "One request: HTTP 200 PAID. Other request: HTTP 409 CONCURRENT_REQUEST or 422 SESSION_ALREADY_COMPLETED.",
                status: "not_started"
              },
              {
                id: "tc-cash-snapshot-null-fallback",
                title: "Verify fee fallback to PricingRule when snapshot is NULL",
                type: "integration",
                precondition: "Session snapshot_day_price = NULL. PricingRule exists.",
                steps: [
                  "POST /api/core/payments/cash with correct amountReceived matching PricingRule calculation."
                ],
                expectedResult: "HTTP 200 OK. Fee correctly calculated from pricing_rules table.",
                status: "not_started"
              },
              {
                id: "tc-cash-session-already-paid",
                title: "Verify payment for already-paid session returns 422",
                type: "integration",
                precondition: "Session status is already PAID or CANCELLED.",
                steps: [
                  "POST /api/core/payments/cash."
                ],
                expectedResult: "HTTP 422. Error code: SESSION_ALREADY_COMPLETED.",
                status: "not_started"
              },
              {
                id: "tc-cash-deadlock-rollback",
                title: "Verify DB exception causes full transaction rollback",
                type: "integration",
                precondition: "Mock DB to throw deadlock exception during SaveChanges.",
                steps: [
                  "POST /api/core/payments/cash."
                ],
                expectedResult: "HTTP 500 INTERNAL_SERVER_ERROR. No partial DB changes. Payments, parking_sessions, audit_logs are all unchanged.",
                status: "not_started"
              },
              {
                id: "tc-cash-invalid-input",
                title: "Verify missing amountReceived returns 400",
                type: "api",
                precondition: "Request body missing amountReceived field.",
                steps: [
                  "POST /api/core/payments/cash with body { sessionId: 123 }."
                ],
                expectedResult: "HTTP 400 VALIDATION_ERROR.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-cash-atomicity", content: "All DB changes (Payment INSERT, Session UPDATE, Audit log INSERT) are committed in a single IDbContextTransaction. Full rollback on any exception.", checked: true },
              { id: "dc-cash-locking", content: "SELECT FOR UPDATE on parking_sessions is applied at the start of the transaction.", checked: true },
              { id: "dc-cash-snapshot", content: "Snapshot Pricing priority implemented. Fallback to pricing_rules when snapshot is NULL. Returns 500 if both are NULL.", checked: true },
              { id: "dc-cash-amount-server", content: "Fee is always recalculated on server-side. Client-provided amount is treated as amountReceived only, never as the fee.", checked: true },
              { id: "dc-cash-audit", content: "CASH_COLLECTION audit log is written atomically inside the main transaction.", checked: true },
              { id: "dc-cash-no-duplicate", content: "Idempotency: duplicate payment impossible due to DB locking and session status re-check after lock.", checked: true },
              { id: "dc-cash-authz", content: "Authorization enforced: only Staff and Manager roles permitted. Driver returns 403.", checked: true },
              { id: "dc-cash-contract", content: "API contract matches HTTP Status Matrix (200, 400, 401, 403, 404, 409, 422, 500).", checked: true },
              { id: "dc-cash-tests", content: "All 8 test cases covering happy path, mismatch, auth, concurrency, fallback, deadlock, and invalid input are defined.", checked: true }
            ]
          },
          {
            id: "leaf-pay-waived",
            title: "Waived Payment",
            type: "leaf_feature",
            status: "ready",
            priority: "medium",
            clients: ["Staff", "Manager"],
            tags: ["payments", "waived", "exemption", "audit", "transaction"],
            summary: "Handle the process of waiving parking fees for system errors or management approvals. Requires strict justification, original fee calculation (for reporting integrity), session validation, and comprehensive audit logging.",
            objective: "Provide a controlled, auditable mechanism for authorized personnel to waive parking fees while preserving financial reporting integrity by recording the original calculated fee amount.",
            inScope: [
              "Waive parking session fee for system errors or management approvals.",
              "Original fee calculation and recording (for audit/reporting) even when waiving.",
              "Session status transition from ACTIVE to WAIVED.",
              "Payment entity creation with status=WAIVED and amount=calculatedFee.",
              "Strict reason validation (10-500 chars, non-empty, non-whitespace).",
              "Role-based reason code restriction (Staff: restricted list; Manager: unrestricted).",
              "Pessimistic locking (SELECT FOR UPDATE) to prevent concurrent waiver.",
              "Audit log with full metadata: paymentId, requestId, correlationId, collectorId, reason, waivedAmount."
            ],
            outOfScope: [
              "Exit Module / Barrier opening: handled independently by the Exit Module based on session/payment state.",
              "Online payment cancellation: handled by leaf-pay-online and PayOS webhook.",
              "Receipt generation: handled by a separate receipt module."
            ],
            permissions: [
              { role: "Manager", permission: "Authorize waiver for any valid reason code." },
              { role: "Staff", permission: "Authorize waiver ONLY for specific codes: SYSTEM_ERROR, FREE_EVENT, PROMOTION. Any other reason code must return 403 FORBIDDEN." }
            ],
            businessRules: [
              "Payment Required Check: If payment_required == false, return 422 NO_PAYMENT_REQUIRED immediately.",
              "Fee Integrity: If calculatedFee <= 0 (and payment_required == true), return 422 NO_PAYMENT_REQUIRED.",
              "Financial Integrity: payments.amount = calculatedFee (NOT 0). payments.status = WAIVED. payments.method = NONE (Inspect schema; use project equivalent if NONE is not supported).",
              "Reason Validation: Required. Trim whitespace. Length [10-500]. Non-null, non-empty, no whitespace-only strings.",
              "Permission Logic: Manager: authorized for any valid reason. Staff: authorized ONLY for SYSTEM_ERROR, FREE_EVENT, PROMOTION codes. Return 403 for any other reason.",
              "State Conflict: If online payment is PENDING, return 409 PAYMENT_ALREADY_PENDING.",
              "Session Status: Reject if status is in {PAID, WAIVED, COMPLETED, CANCELLED}. Return 422 SESSION_ALREADY_COMPLETED.",
              "Lost Card / Plate Mismatch Block: If pending resolution flags are active, return 422 LOST_CARD_PENDING or PLATE_MISMATCH_PENDING.",
              "Concurrency: SELECT FOR UPDATE on parking_sessions immediately after loading. Re-check status after lock is acquired.",
              "Snapshot Pricing: Use snapshot_day_price etc. if != NULL. Fallback to pricing_rules if snapshot is NULL. If both NULL, return 500.",
              "Atomicity: Payment INSERT, parking_sessions UPDATE, audit_log INSERT must be in a single IDbContextTransaction. Full rollback on any exception.",
              "Loose Coupling: Do NOT invoke Exit Module directly. State change on payment/session is sufficient for Exit Module to operate independently."
            ],
            dbExistingTables: ["parking_sessions", "payments", "audit_logs", "pricing_rules"],
            dbNewTablesSql: "-- VERIFY before implementation:\n-- 1. CHECK if payments.method supports 'NONE'. If not, map to project equivalent (e.g., 'OTHER', 'EXEMPT').\n-- 2. CHECK if parking_sessions.status supports 'WAIVED'. If not, add via migration or map to existing enum.\n-- Example migration if needed:\n-- ALTER TABLE payments DROP CONSTRAINT ck_payments_method;\n-- ALTER TABLE payments ADD CONSTRAINT ck_payments_method CHECK (method IN ('CASH', 'NONE', 'ONLINE'));\n-- ALTER TABLE parking_sessions DROP CONSTRAINT ck_sessions_status;\n-- ALTER TABLE parking_sessions ADD CONSTRAINT ck_sessions_status CHECK (status IN ('ACTIVE', 'PAID', 'WAIVED', 'COMPLETED', 'CANCELLED'));",
            dbRelationships: [
              "parking_sessions: SELECT FOR UPDATE to lock row, validate ACTIVE status, read snapshot pricing fields, check lost_card/plate_mismatch flags.",
              "payments: INSERT payment record with status WAIVED, method NONE, amount=calculatedFee, waivedBy from JWT.",
              "audit_logs: INSERT WAIVED_PAYMENT event with paymentId, requestId, correlationId, collectorId, sessionId, waivedAmount, reason, OldStatus, NewStatus.",
              "pricing_rules: READ-only fallback when session snapshot pricing fields are NULL."
            ],
            validationRules: [
              { field: "sessionId", rule: "Required. Session must exist and status must be ACTIVE.", errorMessage: "SESSION_NOT_FOUND" },
              { field: "reason", rule: "Required. Trimmed length must be between 10 and 500 characters. Cannot be null, empty, or whitespace-only.", errorMessage: "VALIDATION_ERROR" },
              { field: "reason (Staff role)", rule: "Must be one of: SYSTEM_ERROR, FREE_EVENT, PROMOTION. Any other value returns 403.", errorMessage: "FORBIDDEN" }
            ],
            securityRules: [
              "JWT Auth: All requests must provide valid Bearer token.",
              "Role Enforcement: Only Staff and Manager roles are permitted.",
              "Staff Reason Restriction: Staff may only use pre-approved reason codes. Return 403 for unauthorized reason codes.",
              "Server-side Fee Recalculation: Never trust fee from client. Always calculate on server for audit integrity."
            ],
            logEvents: [
              "Log: TraceId, SessionId, CollectorId (from JWT), OldStatus, NewStatus, PaymentId, WaivedAmount, Reason, Latency.",
              "Audit log WAIVED_PAYMENT event must include: paymentId, requestId, correlationId, collectorId, sessionId, waivedAmount, reason."
            ],
            noLogEvents: [
              "Do not log raw JWT tokens or user passwords.",
              "Do not log full driver personal data in application logs."
            ],
            integrationPoints: [
              { system: "Pricing Module", responsibility: "Providing fee calculation (even when waiving, for audit integrity). Fallback to pricing_rules if snapshot is NULL." },
              { system: "Audit Module", responsibility: "Writing WAIVED_PAYMENT audit record atomically inside the main transaction with full correlationId metadata." },
              { system: "Exit Module", responsibility: "Independently reads payment/session status to determine if vehicle exit is permitted. NOT called directly from this feature." }
            ],
            uiPage: "/staff/waived-payment or /manager/waive",
            uiComponents: "Waive confirmation modal: session summary, calculated fee display, mandatory reason input (10-500 chars), Confirm Waive button.",
            uiStateLoading: "Disable 'Confirm Waive' button and show spinner while POST is in flight.",
            uiStateEmpty: "N/A",
            uiStateError: "Display specific error from reasonCode: 'PAYMENT_ALREADY_PENDING', 'LOST_CARD_PENDING', 'SESSION_ALREADY_COMPLETED', 'NO_PAYMENT_REQUIRED', 'FORBIDDEN'.",
            uiStateSuccess: "Show waiver success with paymentId, waivedAt, waivedBy, waivedAmount, and reason. Gate exit handled separately by Exit Module.",
            notes: "CRITICAL: Do NOT set payments.amount = 0. Always use calculatedFee for financial reporting integrity. Do NOT invoke Exit Module directly. Verify schema supports WAIVED status and NONE method before implementation.",
            dependencies: [],
            risks: [],
            endpoints: ["POST /api/core/payments/waive"],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-pay-waived-post",
                name: "POST /api/core/payments/waive",
                content: `Method: POST\nPath: /api/core/payments/waive\nHeaders:\n  Authorization: Bearer <token>\n  Content-Type: application/json\nRequest Body:\n{\n  "sessionId": 123456789,\n  "reason": "System error caused incorrect fee calculation"\n}\n\nResponse 200 OK (Waiver Successful):\n{\n  "success": true,\n  "data": {\n    "paymentId": 987654321,\n    "waivedAt": "2026-07-19T07:30:00Z",\n    "waivedBy": "staff-uuid-001",\n    "waivedAmount": 20000,\n    "status": "WAIVED"\n  }\n}\n\nResponse 409 (Online Payment Already Pending):\n{\n  "success": false,\n  "error": {\n    "code": "PAYMENT_ALREADY_PENDING",\n    "message": "An online payment is already pending for this session.",\n    "traceId": "0HL-1234567890"\n  }\n}\n\nResponse 422 (No Payment Required):\n{\n  "success": false,\n  "error": {\n    "code": "NO_PAYMENT_REQUIRED",\n    "message": "This session does not require payment.",\n    "traceId": "0HL-1234567890"\n  }\n}\n\nResponse 403 (Staff Unauthorized Reason):\n{\n  "success": false,\n  "error": {\n    "code": "FORBIDDEN",\n    "message": "Staff is not authorized to waive with this reason code.",\n    "traceId": "0HL-1234567890"\n  }\n}`
              }
            ],
            testCases: [
              {
                id: "tc-waive-happy-path",
                title: "Verify successful waiver records waivedAmount and transitions session to WAIVED",
                type: "integration",
                precondition: "Active session with payment_required = true. Manager JWT. Valid reason (10-500 chars).",
                steps: [
                  "POST /api/core/payments/waive with valid sessionId and reason."
                ],
                expectedResult: "HTTP 200 OK. Payment WAIVED inserted with amount=calculatedFee. parking_sessions.status=WAIVED. Audit log written with full metadata including correlationId.",
                status: "not_started"
              },
              {
                id: "tc-waive-payment-required-false",
                title: "Verify 422 when payment_required is false",
                type: "integration",
                precondition: "Session is ACTIVE but payment_required = false.",
                steps: [
                  "POST /api/core/payments/waive."
                ],
                expectedResult: "HTTP 422. Error code: NO_PAYMENT_REQUIRED. No DB changes.",
                status: "not_started"
              },
              {
                id: "tc-waive-missing-reason",
                title: "Verify 400 when reason is empty or missing",
                type: "api",
                precondition: "Valid session. Request body has empty reason string.",
                steps: [
                  "POST /api/core/payments/waive with reason: ''."
                ],
                expectedResult: "HTTP 400 VALIDATION_ERROR.",
                status: "not_started"
              },
              {
                id: "tc-waive-pending-payment",
                title: "Verify 409 when online payment is in PENDING state",
                type: "integration",
                precondition: "Active session with an existing PENDING online payment.",
                steps: [
                  "POST /api/core/payments/waive."
                ],
                expectedResult: "HTTP 409. Error code: PAYMENT_ALREADY_PENDING.",
                status: "not_started"
              },
              {
                id: "tc-waive-lost-card-active",
                title: "Verify 422 when lost card resolution is pending",
                type: "integration",
                precondition: "Session has active lost_card_pending flag.",
                steps: [
                  "POST /api/core/payments/waive."
                ],
                expectedResult: "HTTP 422. Error code: LOST_CARD_PENDING.",
                status: "not_started"
              },
              {
                id: "tc-waive-snapshot-null-fallback",
                title: "Verify successful waiver when snapshot is NULL and fallback to PricingRule",
                type: "integration",
                precondition: "Session snapshot_day_price = NULL. PricingRule exists. Manager JWT.",
                steps: [
                  "POST /api/core/payments/waive with valid reason."
                ],
                expectedResult: "HTTP 200 OK. Fee calculated from pricing_rules. Audit log records correct waivedAmount.",
                status: "not_started"
              },
              {
                id: "tc-waive-concurrent",
                title: "Verify concurrent waiver by 2 users: 1 success, 1 fail",
                type: "concurrency",
                precondition: "Two requests for same sessionId simultaneously.",
                steps: [
                  "Dispatch two simultaneous POST requests for the same sessionId."
                ],
                expectedResult: "One request: HTTP 200 WAIVED. Other request: HTTP 409 or 422 SESSION_ALREADY_COMPLETED.",
                status: "not_started"
              },
              {
                id: "tc-waive-staff-forbidden-reason",
                title: "Verify Staff cannot waive with unauthorized reason code",
                type: "api",
                precondition: "Authenticated as Staff. Reason code is 'MANAGER_OVERRIDE' (not in Staff allowed list).",
                steps: [
                  "POST /api/core/payments/waive with reason='MANAGER_OVERRIDE' using Staff JWT."
                ],
                expectedResult: "HTTP 403 FORBIDDEN.",
                status: "not_started"
              },
              {
                id: "tc-waive-reason-whitespace-only",
                title: "Verify 400 when reason contains only whitespace",
                type: "api",
                precondition: "Request body has reason = '   ' (spaces only).",
                steps: [
                  "POST /api/core/payments/waive with reason='   '."
                ],
                expectedResult: "HTTP 400 VALIDATION_ERROR.",
                status: "not_started"
              },
              {
                id: "tc-waive-reason-too-long",
                title: "Verify 400 when reason exceeds 500 characters",
                type: "api",
                precondition: "reason string has 501 characters.",
                steps: [
                  "POST /api/core/payments/waive with 501-char reason."
                ],
                expectedResult: "HTTP 400 VALIDATION_ERROR.",
                status: "not_started"
              },
              {
                id: "tc-waive-role-access-matrix",
                title: "Verify role access matrix: Manager passes any reason; Staff limited to approved codes",
                type: "integration",
                precondition: "Two accounts: Manager and Staff.",
                steps: [
                  "Manager: POST with reason='SPECIAL_VIP_EXEMPTION'. Expect 200.",
                  "Staff: POST with reason='SYSTEM_ERROR'. Expect 200.",
                  "Staff: POST with reason='SPECIAL_VIP_EXEMPTION'. Expect 403."
                ],
                expectedResult: "Manager succeeds for all reasons. Staff succeeds only for SYSTEM_ERROR, FREE_EVENT, PROMOTION.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-waive-session-transition", content: "Session status transition verified: ACTIVE -> WAIVED.", checked: true },
              { id: "dc-waive-payment-created-once", content: "Payment entity created exactly once per waiver action. Duplicate prevention via locking and status re-check.", checked: true },
              { id: "dc-waive-payment-required", content: "422 returned if payment_required == false or calculatedFee <= 0.", checked: true },
              { id: "dc-waive-amount-not-zero", content: "payments.amount = calculatedFee. NEVER 0. Financial integrity preserved for reporting.", checked: true },
              { id: "dc-waive-audit-complete", content: "Audit metadata complete: paymentId, requestId, correlationId, collectorId, waivedAmount, reason, OldStatus, NewStatus.", checked: true },
              { id: "dc-waive-concurrent-prevention", content: "Concurrent waiver prevented via SELECT FOR UPDATE and re-check after lock.", checked: true },
              { id: "dc-waive-pending-conflict", content: "Online payment conflict handled: 409 PAYMENT_ALREADY_PENDING if PENDING online payment exists.", checked: true },
              { id: "dc-waive-rollback", content: "No partial updates after exception. Full IDbContextTransaction rollback verified.", checked: true },
              { id: "dc-waive-reason-validation", content: "Reason trimmed, 10-500 chars, non-empty, non-whitespace. Staff restricted to approved reason codes.", checked: true },
              { id: "dc-waive-tests", content: "All 11 test cases covering happy path, auth, concurrency, edge cases, and role matrix are defined.", checked: true }
            ]
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
            status: "ready",
            priority: "must_have",
            clients: ["Manager", "Admin"],
            tags: ["review", "approval", "monthly-pass", "concurrency", "transaction"],
            summary: "Provides authorized personnel (Managers and Admins) with a standardized, secure, and auditable mechanism to evaluate pending requests for monthly parking privileges. Enforces facility capacity limits, verifies applicant eligibility, and ensures no conflicting active passes exist before granting long-term access.",
            objective: "Enable authorized reviewers to view pending application queues and make definitive APPROVED or REJECTED decisions. Approval immediately and transactionally generates an active MonthlyPass entity linked to the applicant's vehicle, allowing seamless entry/exit processing without casual parking fees.",
            inScope: [
              "Retrieval of monthly pass applications with server-side pagination.",
              "Filtering applications by status (PENDING, APPROVED, REJECTED), date ranges, and plate_number.",
              "Transitioning an application's status from PENDING to REJECTED, requiring a mandatory reviewer note.",
              "Transitioning an application's status from PENDING to APPROVED.",
              "Transactional creation of a new MonthlyPass entity upon successful approval.",
              "Concurrency control to prevent multiple reviewers from processing the same application simultaneously.",
              "Audit logging of the review decision, capturing the reviewer's ID, old status, new status, and timestamp."
            ],
            outOfScope: [
              "Submission of the initial application (handled by Driver/Staff Application feature).",
              "Payment processing for the approved pass (handled by Payment & Invoicing feature).",
              "Sending email/SMS notifications regarding the decision (handled by Notification feature).",
              "Physical RFID/Smart Card assignment (handled by Card Management feature).",
              "Editing an already approved or rejected application."
            ],
            endpoints: [
              "GET /api/core/monthly-passes/applications",
              "PATCH /api/core/monthly-passes/applications/{id}/status"
            ],
            ownerService: ".NET Core API",
            businessRules: [
              "All endpoints must return the system's standard ApiResponse<T> format (success, message, data, errors).",
              "JWT Authentication is strictly required. Role claims must be extracted and validated.",
              "All mutating actions must be recorded in the system's shared PostgreSQL Audit schema.",
              "Global Exception Middleware must catch all unhandled exceptions and return a secure 500 error without leaking stack traces.",
              "STATUS CONSTRAINT: Only applications with a PENDING status can be reviewed (modified).",
              "TERMINAL STATES: Once an application reaches APPROVED or REJECTED, it is locked and immutable.",
              "MANDATORY JUSTIFICATION: A transition to REJECTED strictly requires a non-empty reviewer_note.",
              "NOTE TRUNCATION: reviewer_note is limited to 1000 characters.",
              "PASS UNIQUENESS: Before approval, the system must verify that the plate_number does not already have an active MonthlyPass (status = ACTIVE, or overlapping validity dates). If a duplicate active pass exists, the approval must be blocked with a 409 Conflict.",
              "ATOMICITY: Approving an application and creating the corresponding MonthlyPass record MUST occur within a single database transaction. If pass creation fails, the application status must roll back to PENDING.",
              "REVIEWER TRACEABILITY: The reviewer_id and review_date must be stamped exactly when the decision is submitted."
            ],
            permissions: [
              { role: "Manager", permission: "Can view all applications. Can approve or reject PENDING applications. Cannot delete applications. Cannot modify APPROVED or REJECTED applications." },
              { role: "Admin", permission: "Can view all applications. Can approve or reject PENDING applications. Cannot delete applications. Cannot modify APPROVED or REJECTED applications." },
              { role: "Staff", permission: "No access. Cannot access these endpoints." },
              { role: "Driver", permission: "No access. Cannot access these endpoints." },
              { role: "Guest", permission: "No access. Cannot access these endpoints." }
            ],
            dbExistingTables: ["users"],
            dbNewTablesSql: `-- Table: monthly_pass_applications
CREATE TABLE monthly_pass_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  plate_number VARCHAR(20) NOT NULL,
  vehicle_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  applied_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewer_id UUID REFERENCES users(id),
  review_date TIMESTAMPTZ,
  reviewer_note VARCHAR(1000),
  CONSTRAINT chk_mpa_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- Table: monthly_passes
CREATE TABLE monthly_passes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  plate_number VARCHAR(20) NOT NULL,
  vehicle_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_mpa_status ON monthly_pass_applications(status);
CREATE INDEX idx_mpa_plate ON monthly_pass_applications(plate_number);
CREATE INDEX idx_mp_plate_status ON monthly_passes(plate_number, status);`,
            dbRelationships: [
              "monthly_pass_applications.user_id -> users.id (Applicant user)",
              "monthly_pass_applications.reviewer_id -> users.id (Reviewing manager/admin)",
              "monthly_passes.user_id -> users.id (Pass holder)"
            ],
            apiContracts: [
              {
                id: "api-get-monthly-pass-applications",
                name: "GET /api/core/monthly-passes/applications",
                content: `Method: GET
Path: /api/core/monthly-passes/applications
Headers:
  Authorization: Bearer <jwt_token>
Query Parameters:
  page (int, default: 1, min: 1)
  size (int, default: 10, min: 1, max: 100)
  status (string, optional, enum: PENDING | APPROVED | REJECTED)
  plate_number (string, optional)
  from_date (ISO8601, optional)
  to_date (ISO8601, optional)
Success Response (200 OK):
{
  "success": true,
  "message": "Applications retrieved successfully",
  "data": {
    "items": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "user_id": "987e6543-e21b-12d3-a456-426614174111",
        "plate_number": "59X1-12345",
        "vehicle_type": "MOTORBIKE",
        "applied_date": "2026-07-18T08:00:00Z",
        "status": "PENDING",
        "reviewer_id": null,
        "review_date": null,
        "reviewer_note": null,
        "row_version": "00000000-0000-0000-0000-000000000001"
      }
    ],
    "total_count": 1,
    "page": 1,
    "size": 10
  },
  "errors": null
}
Error Responses:
  401 Unauthorized: Missing or invalid JWT.
  403 Forbidden: Valid JWT, but role is not Manager/Admin.
  400 Bad Request: Invalid filter parameters (e.g., invalid status enum).`
              },
              {
                id: "api-patch-monthly-pass-application-status",
                name: "PATCH /api/core/monthly-passes/applications/{id}/status",
                content: `Method: PATCH
Path: /api/core/monthly-passes/applications/{id}/status
Headers:
  Authorization: Bearer <jwt_token>
  Content-Type: application/json
Path Parameters:
  id (UUID, required)
Request Body:
{
  "status": "APPROVED",
  "reviewer_note": "Valid documentation provided.",
  "row_version": "00000000-0000-0000-0000-000000000001"
}
Note: row_version is required for optimistic concurrency control.
Success Response (200 OK):
{
  "success": true,
  "message": "Application approved successfully",
  "data": {
    "application_id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "APPROVED",
    "monthly_pass_id": "abcdef12-3456-7890-abcd-ef1234567890"
  },
  "errors": null
}
Error Responses:
  400 Bad Request (Validation): { "success": false, "message": "Validation failed", "data": null, "errors": [{ "field": "reviewer_note", "message": "Reviewer note is required when rejecting an application." }] }
  400 Bad Request (Invalid state): Application is not in PENDING state.
  401 Unauthorized: Missing or invalid JWT.
  403 Forbidden: Valid JWT, but role is not Manager/Admin.
  404 Not Found: Application ID does not exist.
  409 Conflict (Duplicate pass): { "success": false, "message": "Conflict occurred", "data": null, "errors": [{ "field": "plate_number", "message": "An active monthly pass already exists for plate 59X1-12345." }] }
  409 Conflict (Concurrency): Mismatched row_version/xmin — DbUpdateConcurrencyException.
  500 Internal Server Error: Global handler returns masked error, full rollback guaranteed.`
              }
            ],
            validationRules: [
              { field: "status", rule: "Must be strictly 'APPROVED' or 'REJECTED'.", errorMessage: "Invalid status value. Must be APPROVED or REJECTED." },
              { field: "id", rule: "Must be a valid UUID format.", errorMessage: "Invalid application ID format." },
              { field: "reviewer_note", rule: "Max length 1000 characters.", errorMessage: "Reviewer note must not exceed 1000 characters." },
              { field: "reviewer_note", rule: "Required and non-empty when status is REJECTED.", errorMessage: "Reviewer note is required when rejecting an application." },
              { field: "row_version", rule: "Required for optimistic concurrency control. Must match database xmin.", errorMessage: "The application has been modified by another user. Please refresh and try again." },
              { field: "page", rule: "Minimum value: 1.", errorMessage: "Page must be greater than 0." },
              { field: "size", rule: "Minimum: 1, Maximum: 100.", errorMessage: "Size must be between 1 and 100." },
              { field: "status (GET filter)", rule: "Optional. Must be one of: PENDING, APPROVED, REJECTED.", errorMessage: "Invalid status filter value." }
            ],
            securityRules: [
              "Require valid JWT payload on all endpoints.",
              "Require [Authorize(Roles = 'Manager,Admin')] on both controller endpoints.",
              "IDOR Prevention: id parsing must be strict and cannot be manipulated via SQL injection (EF Core handles parameterization).",
              "Mass Assignment Prevention: The PATCH endpoint DTO must only accept status, reviewer_note, and row_version. Do not accept modifications to plate_number or user_id during review.",
              "Sensitive Data: Do not log tokens or raw user passwords in any audit/exception logs.",
              "Never log the Authorization header or JWT body content."
            ],
            logEvents: [
              "API Request Log (Middleware): Method, Path, UserID (from JWT), CorrelationId, Duration (ms), StatusCode.",
              "Business Log: ILogger.LogInformation('User {ReviewerId} {Status} application {AppId} for plate {Plate}', ...)",
              "Database Audit (EF Core Interceptor): Table=monthly_pass_applications, Action=UPDATE, EntityId, OldValues={status='PENDING'}, NewValues={status='APPROVED', reviewer_id=...}"
            ],
            noLogEvents: [
              "Request Authorization headers.",
              "JWT token bodies.",
              "Raw user passwords."
            ],
            integrationPoints: [
              { system: "Driver Monthly Pass Application", responsibility: "Upstream producer. Generates the MonthlyPassApplication records that this feature consumes and reviews." },
              { system: "Entry/Exit Flow", responsibility: "Downstream consumer. Relies on the monthly_passes record created by this approval transaction to authorize boom barrier opening without casual fees." },
              { system: "Authentication / Authorization (.NET Identity / IdP)", responsibility: "Validates Manager/Admin identities and JWT claims for role-based access control." },
              { system: "Audit System (EF Core Interceptor)", responsibility: "Intercepts EF Core SaveChanges to populate the system-wide audit_logs table for compliance and traceability." }
            ],
            uiPage: "Monthly Pass Management > Application Review",
            uiComponents: "Data Table with pagination, Status filter dropdown, Date range pickers, Plate number search input, Approve button, Reject button with mandatory note modal, Toast notifications, Loading spinner / skeleton rows",
            uiStateLoading: "Display spinner/skeleton in the Data Table during GET request. Disable Approve/Reject action buttons during PATCH API call to prevent double-clicks.",
            uiStateEmpty: "Display 'No pending applications found.' when the filtered result set is empty.",
            uiStateError: "Map 409 Conflicts (duplicate pass, concurrency error) to user-friendly Toast Notifications. Map 400 validation errors to inline field error messages in the Reject modal.",
            uiStateSuccess: "Upon successful PATCH, display a success toast and locally update the row's status in the UI or trigger a targeted re-fetch of the current page.",
            sourceFiles: [
              "Controllers/MonthlyPassApplicationController.cs",
              "Services/IMonthlyPassReviewService.cs",
              "Services/MonthlyPassReviewService.cs",
              "Repositories/IMonthlyPassApplicationRepository.cs",
              "Repositories/MonthlyPassApplicationRepository.cs",
              "Repositories/IMonthlyPassRepository.cs",
              "Repositories/MonthlyPassRepository.cs",
              "Domain/Entities/MonthlyPassApplication.cs",
              "Domain/Entities/MonthlyPass.cs",
              "DTOs/ReviewApplicationRequestDto.cs",
              "DTOs/GetApplicationsQueryDto.cs",
              "Validators/ReviewApplicationRequestValidator.cs",
              "Data/AppDbContext.cs (MonthlyPassApplication + MonthlyPass DbSets)"
            ],
            testCases: [
              // --- API Tests (20) ---
              {
                id: "tc-mpar-api-01",
                title: "API-01: GET applications without auth token -> Expect 401",
                type: "api",
                precondition: "No Authorization header is present in the request.",
                steps: ["Send GET /api/core/monthly-passes/applications without Authorization header.", "Check response status."],
                expectedResult: "Response is 401 Unauthorized.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-02",
                title: "API-02: GET applications with 'Driver' role token -> Expect 403",
                type: "api",
                precondition: "User is authenticated with Driver role JWT.",
                steps: ["Authenticate as Driver.", "Send GET /api/core/monthly-passes/applications.", "Check response status."],
                expectedResult: "Response is 403 Forbidden.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-03",
                title: "API-03: GET applications with 'Manager' token -> Expect 200 & valid pagination",
                type: "api",
                precondition: "User is authenticated with Manager role JWT.",
                steps: ["Authenticate as Manager.", "Send GET /api/core/monthly-passes/applications?page=1&size=10.", "Validate response structure."],
                expectedResult: "Response is 200 OK with paginated data structure containing items, total_count, page, size.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-04",
                title: "API-04: GET applications with 'Admin' token -> Expect 200",
                type: "api",
                precondition: "User is authenticated with Admin role JWT.",
                steps: ["Authenticate as Admin.", "Send GET /api/core/monthly-passes/applications.", "Check response status."],
                expectedResult: "Response is 200 OK.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-05",
                title: "API-05: GET applications filter by status=PENDING -> Expect 200 & all items PENDING",
                type: "api",
                precondition: "Manager is authenticated. Database has a mix of PENDING, APPROVED, REJECTED applications.",
                steps: ["Send GET /api/core/monthly-passes/applications?status=PENDING.", "Verify all items in response have status=PENDING."],
                expectedResult: "Response is 200 OK. All returned items have status='PENDING'.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-06",
                title: "API-06: GET applications filter by invalid status -> Expect 400",
                type: "api",
                precondition: "Manager is authenticated.",
                steps: ["Send GET /api/core/monthly-passes/applications?status=UNKNOWN.", "Check response status."],
                expectedResult: "Response is 400 Bad Request with validation error for the status field.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-07",
                title: "API-07: GET applications filter by plate_number -> Expect 200 & matching plates",
                type: "api",
                precondition: "Manager is authenticated. Database has applications with plate '59X1-12345'.",
                steps: ["Send GET /api/core/monthly-passes/applications?plate_number=59X1-12345.", "Verify all returned items have matching plate_number."],
                expectedResult: "Response is 200 OK. All returned items have plate_number matching the filter.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-08",
                title: "API-08: PATCH approve without auth token -> Expect 401",
                type: "api",
                precondition: "No Authorization header is present.",
                steps: ["Send PATCH /api/core/monthly-passes/applications/{id}/status with no token.", "Check response status."],
                expectedResult: "Response is 401 Unauthorized.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-09",
                title: "API-09: PATCH approve with 'Driver' role -> Expect 403",
                type: "api",
                precondition: "User is authenticated with Driver role JWT.",
                steps: ["Authenticate as Driver.", "Send PATCH with {status: 'APPROVED', row_version: '...'}.", "Check response status."],
                expectedResult: "Response is 403 Forbidden.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-10",
                title: "API-10: PATCH approve valid PENDING application -> Expect 200",
                type: "api",
                precondition: "Manager is authenticated. Application exists with status=PENDING and no duplicate active pass.",
                steps: ["Send PATCH /api/core/monthly-passes/applications/{id}/status with {status: 'APPROVED', row_version: '...'}.", "Check response."],
                expectedResult: "Response is 200 OK. data contains application_id, status='APPROVED', and monthly_pass_id.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-11",
                title: "API-11: PATCH reject valid PENDING application with note -> Expect 200",
                type: "api",
                precondition: "Manager is authenticated. Application exists with status=PENDING.",
                steps: ["Send PATCH with {status: 'REJECTED', reviewer_note: 'Missing documents.', row_version: '...'}.", "Check response."],
                expectedResult: "Response is 200 OK. Application status updated to REJECTED.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-12",
                title: "API-12: PATCH reject valid PENDING application without note -> Expect 400",
                type: "api",
                precondition: "Manager is authenticated. Application exists with status=PENDING.",
                steps: ["Send PATCH with {status: 'REJECTED', reviewer_note: '', row_version: '...'}.", "Check response."],
                expectedResult: "Response is 400 Bad Request. Errors list includes reviewer_note field error.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-13",
                title: "API-13: PATCH approve an already APPROVED application -> Expect 400",
                type: "api",
                precondition: "Manager is authenticated. Application already has status=APPROVED.",
                steps: ["Send PATCH with {status: 'APPROVED', row_version: '...'} on already-approved application.", "Check response."],
                expectedResult: "Response is 400 Bad Request. Error states invalid state transition.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-14",
                title: "API-14: PATCH approve an already REJECTED application -> Expect 400",
                type: "api",
                precondition: "Manager is authenticated. Application has status=REJECTED.",
                steps: ["Send PATCH with {status: 'APPROVED', row_version: '...'} on rejected application.", "Check response."],
                expectedResult: "Response is 400 Bad Request. Error states invalid state transition.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-15",
                title: "API-15: PATCH reject an already APPROVED application -> Expect 400",
                type: "api",
                precondition: "Manager is authenticated. Application has status=APPROVED.",
                steps: ["Send PATCH with {status: 'REJECTED', reviewer_note: 'reason', row_version: '...'} on approved application.", "Check response."],
                expectedResult: "Response is 400 Bad Request. Error states invalid state transition.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-16",
                title: "API-16: PATCH status with invalid enum (e.g., 'MAYBE') -> Expect 400",
                type: "api",
                precondition: "Manager is authenticated.",
                steps: ["Send PATCH with {status: 'MAYBE', row_version: '...'}.", "Check response."],
                expectedResult: "Response is 400 Bad Request. Errors list includes status field validation error.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-17",
                title: "API-17: PATCH non-existent application ID -> Expect 404",
                type: "api",
                precondition: "Manager is authenticated.",
                steps: ["Send PATCH with a randomly generated UUID that doesn't exist in the database.", "Check response."],
                expectedResult: "Response is 404 Not Found.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-18",
                title: "API-18: PATCH without row_version -> Expect 400",
                type: "api",
                precondition: "Manager is authenticated. Application exists with status=PENDING.",
                steps: ["Send PATCH with {status: 'APPROVED'} without row_version field.", "Check response."],
                expectedResult: "Response is 400 Bad Request. row_version is required.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-19",
                title: "API-19: PATCH approve but missing body -> Expect 400",
                type: "api",
                precondition: "Manager is authenticated.",
                steps: ["Send PATCH request to the endpoint with an empty body.", "Check response."],
                expectedResult: "Response is 400 Bad Request.",
                status: "not_started"
              },
              {
                id: "tc-mpar-api-20",
                title: "API-20: PATCH reject with note > 1000 chars -> Expect 400",
                type: "api",
                precondition: "Manager is authenticated. Application is PENDING.",
                steps: ["Send PATCH with {status: 'REJECTED', reviewer_note: '<1001 char string>', row_version: '...'}.", "Check response."],
                expectedResult: "Response is 400 Bad Request. reviewer_note length validation error is returned.",
                status: "not_started"
              },
              // --- Integration Tests (10) ---
              {
                id: "tc-mpar-int-01",
                title: "INT-01: DB Transaction: Approve saves Application state and Pass state atomically",
                type: "integration",
                precondition: "PENDING application exists. No active pass for the plate.",
                steps: ["Call approve service method.", "Query monthly_pass_applications and monthly_passes in the database.", "Verify both are updated/inserted."],
                expectedResult: "Application status is APPROVED and a corresponding MonthlyPass record exists with matching user_id and plate_number.",
                status: "not_started"
              },
              {
                id: "tc-mpar-int-02",
                title: "INT-02: DB Transaction Rollback: Simulate DB error on Pass insert, verify Application remains PENDING",
                type: "integration",
                precondition: "PENDING application exists. DB error is injected on monthly_passes INSERT.",
                steps: ["Mock DB to throw exception on monthly_passes insert.", "Call approve service method.", "Query application status."],
                expectedResult: "Application status remains PENDING. No MonthlyPass record exists. Transaction is fully rolled back.",
                status: "not_started"
              },
              {
                id: "tc-mpar-int-03",
                title: "INT-03: EF Core Concurrency: Two concurrent threads updating same application, one fails",
                type: "integration",
                precondition: "PENDING application exists. Two manager sessions retrieve same row_version.",
                steps: ["Thread A reads application with row_version X.", "Thread B reads application with row_version X.", "Thread A approves (succeeds).", "Thread B attempts to reject (stale row_version)."],
                expectedResult: "Thread A succeeds. Thread B receives DbUpdateConcurrencyException, returns 409 Conflict.",
                status: "not_started"
              },
              {
                id: "tc-mpar-int-04",
                title: "INT-04: Audit Interceptor: Approving creates accurate row in audit_logs",
                type: "integration",
                precondition: "PENDING application exists. Audit system is active.",
                steps: ["Call approve on the application.", "Query audit_logs table."],
                expectedResult: "audit_logs contains a row with TableName='monthly_pass_applications', Action='UPDATE', OldValues.status='PENDING', NewValues.status='APPROVED', NewValues.reviewer_id=<manager_uuid>.",
                status: "not_started"
              },
              {
                id: "tc-mpar-int-05",
                title: "INT-05: Audit Interceptor: Rejecting creates accurate row in audit_logs",
                type: "integration",
                precondition: "PENDING application exists. Audit system is active.",
                steps: ["Call reject with a reviewer_note.", "Query audit_logs table."],
                expectedResult: "audit_logs contains a row with TableName='monthly_pass_applications', Action='UPDATE', OldValues.status='PENDING', NewValues.status='REJECTED'.",
                status: "not_started"
              },
              {
                id: "tc-mpar-int-06",
                title: "INT-06: Pagination Check: Insert 15 items, request size=10 page=1, returns 10 items & total=15",
                type: "integration",
                precondition: "15 PENDING applications are seeded into the database.",
                steps: ["Send GET /api/core/monthly-passes/applications?page=1&size=10.", "Verify response."],
                expectedResult: "items array has 10 elements. total_count is 15. page is 1. size is 10.",
                status: "not_started"
              },
              {
                id: "tc-mpar-int-07",
                title: "INT-07: Pagination Check: Request size=10 page=2, returns 5 items",
                type: "integration",
                precondition: "15 PENDING applications are seeded into the database.",
                steps: ["Send GET /api/core/monthly-passes/applications?page=2&size=10.", "Verify response."],
                expectedResult: "items array has 5 elements. total_count is 15. page is 2.",
                status: "not_started"
              },
              {
                id: "tc-mpar-int-08",
                title: "INT-08: Empty DB: GET returns 200 with empty items array",
                type: "integration",
                precondition: "No monthly_pass_applications exist in the database.",
                steps: ["Send GET /api/core/monthly-passes/applications.", "Verify response."],
                expectedResult: "Response is 200 OK. items is an empty array. total_count is 0.",
                status: "not_started"
              },
              {
                id: "tc-mpar-int-09",
                title: "INT-09: Reviewer ID stamp: PATCH correctly stamps the Manager's Guid from the JWT into reviewer_id",
                type: "integration",
                precondition: "Manager with known UUID is authenticated. PENDING application exists.",
                steps: ["Call approve with Manager's JWT.", "Query monthly_pass_applications table for the application.", "Check reviewer_id column."],
                expectedResult: "reviewer_id matches the UUID extracted from the Manager's JWT claims. review_date is set to approximately now().",
                status: "not_started"
              },
              {
                id: "tc-mpar-int-10",
                title: "INT-10: UUID Generation: Verifies inserted MonthlyPass has a valid UUID generated by PostgreSQL",
                type: "integration",
                precondition: "PENDING application approved successfully.",
                steps: ["Capture the monthly_pass_id from the 200 OK response.", "Query monthly_passes by the returned id.", "Validate UUID format."],
                expectedResult: "Returned monthly_pass_id is a valid RFC 4122 UUID. Record exists in monthly_passes table.",
                status: "not_started"
              },
              // --- Validation Tests (10) ---
              {
                id: "tc-mpar-val-01",
                title: "VAL-01: Validator: Rejection request rejects null note",
                type: "unit",
                precondition: "ReviewApplicationRequestValidator is instantiated.",
                steps: ["Create request DTO with status='REJECTED', reviewer_note=null.", "Run validator."],
                expectedResult: "Validation fails. Error on reviewer_note field: 'Reviewer note is required when rejecting an application.'",
                status: "not_started"
              },
              {
                id: "tc-mpar-val-02",
                title: "VAL-02: Validator: Rejection request rejects whitespace string note",
                type: "unit",
                precondition: "ReviewApplicationRequestValidator is instantiated.",
                steps: ["Create request DTO with status='REJECTED', reviewer_note='   '.", "Run validator."],
                expectedResult: "Validation fails. Error on reviewer_note field as whitespace is not allowed.",
                status: "not_started"
              },
              {
                id: "tc-mpar-val-03",
                title: "VAL-03: Validator: App exists check fails properly",
                type: "unit",
                precondition: "Service layer is mocked. Repository returns null for application lookup.",
                steps: ["Call service.ReviewApplicationAsync with a non-existent ID.", "Capture result."],
                expectedResult: "Service returns 404 Not Found result without throwing an unhandled exception.",
                status: "not_started"
              },
              {
                id: "tc-mpar-val-04",
                title: "VAL-04: Validator: State machine blocks PENDING -> PENDING",
                type: "unit",
                precondition: "Application is in PENDING state.",
                steps: ["Attempt to set status to 'PENDING' via service.", "Capture result."],
                expectedResult: "Service returns 400 Bad Request. Status must be APPROVED or REJECTED.",
                status: "not_started"
              },
              {
                id: "tc-mpar-val-05",
                title: "VAL-05: Validator: State machine blocks APPROVED -> REJECTED",
                type: "unit",
                precondition: "Application is already in APPROVED terminal state.",
                steps: ["Call service.ReviewApplicationAsync with status='REJECTED'.", "Capture result."],
                expectedResult: "Service returns 400 Bad Request. Cannot modify a terminal state application.",
                status: "not_started"
              },
              {
                id: "tc-mpar-val-06",
                title: "VAL-06: Business Logic: Block approval if plate already has ACTIVE pass",
                type: "unit",
                precondition: "Application is PENDING for plate '59X1-12345'. An ACTIVE MonthlyPass already exists for '59X1-12345' with valid_to in the future.",
                steps: ["Call service.ReviewApplicationAsync with status='APPROVED'.", "Capture result."],
                expectedResult: "Service returns 409 Conflict. Error message identifies the duplicate active pass for the plate.",
                status: "not_started"
              },
              {
                id: "tc-mpar-val-07",
                title: "VAL-07: Business Logic: Allow approval if plate has EXPIRED pass",
                type: "unit",
                precondition: "Application is PENDING for plate '59X1-12345'. Only an EXPIRED MonthlyPass exists (valid_to < now()) for that plate.",
                steps: ["Call service.ReviewApplicationAsync with status='APPROVED'.", "Capture result."],
                expectedResult: "Service allows the approval. Proceeds to create a new MonthlyPass and returns 200 OK.",
                status: "not_started"
              },
              {
                id: "tc-mpar-val-08",
                title: "VAL-08: Business Logic: Ensure applied_date cannot be mutated during PATCH",
                type: "unit",
                precondition: "Application exists with a known applied_date.",
                steps: ["Call PATCH endpoint with a request body that includes applied_date.", "Verify the database value after the operation."],
                expectedResult: "applied_date remains unchanged in the database. The field is ignored by the DTO binding.",
                status: "not_started"
              },
              {
                id: "tc-mpar-val-09",
                title: "VAL-09: Validator: Limit size parameter to 100 max in GET",
                type: "unit",
                precondition: "GetApplicationsQueryDto validator is instantiated.",
                steps: ["Create query DTO with size=101.", "Run validator."],
                expectedResult: "Validation fails. Error on size field: maximum allowed value is 100.",
                status: "not_started"
              },
              {
                id: "tc-mpar-val-10",
                title: "VAL-10: Validator: Limit page parameter to > 0 in GET",
                type: "unit",
                precondition: "GetApplicationsQueryDto validator is instantiated.",
                steps: ["Create query DTO with page=0.", "Run validator."],
                expectedResult: "Validation fails. Error on page field: minimum allowed value is 1.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-mpar-get-impl", content: "GET /api/core/monthly-passes/applications is fully implemented with pagination and filters (status, plate_number, from_date, to_date).", checked: false },
              { id: "dc-mpar-patch-impl", content: "PATCH /api/core/monthly-passes/applications/{id}/status is fully implemented.", checked: false },
              { id: "dc-mpar-auth", content: "Authentication and Authorization (Manager, Admin roles) are enforced on both endpoints via [Authorize(Roles='Manager,Admin')].", checked: false },
              { id: "dc-mpar-validation", content: "Validation rules (missing note on reject, invalid status enum, state machine blocks) are strictly verified via FluentValidation.", checked: false },
              { id: "dc-mpar-transaction", content: "Database transaction guarantees atomicity: application update and pass creation occur in a single IDbContextTransaction. Rollback is verified.", checked: false },
              { id: "dc-mpar-concurrency", content: "Optimistic concurrency control using xmin/row_version prevents lost updates. DbUpdateConcurrencyException is caught and returns 409.", checked: false },
              { id: "dc-mpar-dup-pass", content: "Business rule: duplicate active monthly passes for the same plate are correctly blocked with a 409 Conflict before transaction begins.", checked: false },
              { id: "dc-mpar-audit", content: "Audit logs are generated for all status changes via EF Core interceptor or trigger.", checked: false },
              { id: "dc-mpar-tests", content: "Code passes all 40 defined automated tests (20 API, 10 Integration, 10 Validation).", checked: false },
              { id: "dc-mpar-exception", content: "Global exception handler masks DB errors and returns standardized ApiResponse without leaking stack traces.", checked: false },
              { id: "dc-mpar-reviewer-stamp", content: "reviewer_id and review_date are stamped from JWT claims at the moment the decision is submitted.", checked: false },
              { id: "dc-mpar-contract", content: "API contract is documented in this node (both GET and PATCH endpoints).", checked: false }
            ],
            notes: `STATE MACHINE:
- PENDING (initial): Allowed transitions -> APPROVED, REJECTED
- APPROVED (terminal): No allowed transitions
- REJECTED (terminal): No allowed transitions

HAPPY FLOW:
1. Manager selects PENDING application and clicks Approve.
2. Backend receives PATCH with { status: "APPROVED", row_version: "..." }.
3. Backend queries application by ID.
4. Validates: exists, is PENDING, row_version matches, NO active pass for plate.
5. Transaction: Updates application to APPROVED (sets reviewer_id, review_date). Creates new MonthlyPass. Creates AuditLog entry.
6. Commits transaction.
7. Returns 200 OK with new monthly_pass_id.
8. Frontend shows success toast and updates table row.

UNHAPPY FLOWS:
- Concurrency: Two managers open same application. First approves. Second gets 409 Conflict (mismatched row_version/xmin).
- Already Approved: Manager tries to approve REJECTED app -> 400 Bad Request (invalid state transition).
- Missing Note: { status: "REJECTED", reviewer_note: "" } -> 400 Bad Request with validation errors.
- Duplicate Active Pass: Plate already has an active pass -> 409 Conflict. Transaction rolled back.
- Unauthorized: Session expired -> 401 Unauthorized via Auth Middleware.
- DB Timeout: DB locks during transaction -> 500 Internal Server Error. Full rollback guaranteed.

AI IMPLEMENTATION DIRECTIVES:
1. Architecture Inspection: Locate existing ApiResponse<T>, JWT middleware, and EF Core DbContext. Do not recreate.
2. Entity: MonthlyPassApplication and MonthlyPass with snake_case table mapping. Include xmin concurrency token.
3. Repository Pattern: IMonthlyPassApplicationRepository and IMonthlyPassRepository. No business logic in repository.
4. Service Layer: IMonthlyPassReviewService with all validation and transaction boundary using 'await using var transaction = await _dbContext.Database.BeginTransactionAsync()'.
5. FluentValidation: RuleFor(x => x.ReviewerNote).NotEmpty().When(x => x.Status == "REJECTED").
6. Controller: Extract userId from HttpContext.User.Claims for reviewer_id.
7. Testing: xUnit tests with Moq for service layer.`
          },
          {
            id: "leaf-mp-card-manage",
            title: "Monthly Pass Card Management",
            type: "leaf_feature",
            status: "ready",
            priority: "medium",
            clients: ["Manager", "Admin"],
            tags: ["monthly-passes", "management", "crud", "security"],
            summary: "The Monthly Pass Card Management feature provides authorized personnel (Managers and Admins) with direct administrative control over the lifecycle of Monthly Passes.",
            objective: "Enable direct CRUD operations and state transitions on the MonthlyPass entity, guarantee strict data integrity by preventing duplicate or overlapping active passes for the same vehicle, and ensure all administrative actions are securely authorized, transactional, and fully audited.",
            inScope: [
              "Create: Manually issue a new Monthly Pass to an existing, valid User and Vehicle.",
              "Read (List): View a paginated, filterable, and sortable list of all Monthly Passes.",
              "Read (Detail): View complete details of a specific Monthly Pass.",
              "Update: Modify the details of an existing Monthly Pass (e.g., Plate Number, Validity Dates).",
              "Patch Status: Change the lifecycle status of a pass (e.g., Active to Suspended, Cancelled).",
              "Validation: Enforce business rules, entity existence, and chronological date rules.",
              "Concurrency & Transactions: Handle race conditions, deadlocks, and transaction rollbacks.",
              "Audit: Record every state mutation in the existing audit logging infrastructure."
            ],
            outOfScope: [
              "Payment Processing: Handled by the Payment and Receipt features.",
              "User-facing Applications: Handled by Monthly Pass Application Review.",
              "Notifications: SMS/Email alerts are handled by the Notification Service.",
              "Entry/Exit Processing: Handled by the Barrier Control API."
            ],
            permissions: [
              { role: "Admin", permission: "Full CRUD access to all endpoints. Can transition status. Cannot modify a pass in a terminal state (e.g., CANCELED). Cannot bypass existing concurrency controls." },
              { role: "Manager", permission: "Full CRUD access to all endpoints. Can transition status. Cannot modify a pass in a terminal state. Cannot bypass existing concurrency controls." }
            ],
            businessRules: [
              "Dynamic Architecture Inspection: The AI MUST inspect the existing MonthlyPass and User entities to determine the correct Primary Key data types, Concurrency Tokens, and default lifecycle statuses.",
              "Standard Response: All API responses must be wrapped in the existing ApiResponse<T> format.",
              "Global Exception Handling: Exceptions must map to appropriate HTTP status codes without leaking stack traces.",
              "Audit Trail: Every mutating operation must be recorded using the project's existing Audit mechanism.",
              "Plate Number Uniqueness: A plate_number can only have ONE pass that is conceptually 'Active' (valid date range + non-terminal status). Overlapping validity periods for the same plate are strictly forbidden.",
              "Date Validation: valid_from must always be strictly less than valid_to.",
              "Immutability of Terminal States: If a pass enters a terminal state (e.g., CANCELED), it becomes read-only.",
              "Entity Relationship: A Monthly Pass must belong to exactly one active User and reference a valid VehicleType.",
              "Renewal Conflict: Updates to valid_to must not conflict with pending renewal requests in the Renew Monthly Pass feature."
            ],
            dbExistingTables: ["monthly_passes", "users", "vehicle_types"],
            dbNewTablesSql: "",
            dbRelationships: [
              "monthly_passes: Foreign key user_id references users(id).",
              "monthly_passes: Foreign key vehicle_type_id references vehicle_types(id)."
            ],
            validationRules: [
              { field: "valid_from & valid_to", rule: "valid_from < valid_to", errorMessage: "VALID_FROM_MUST_BE_BEFORE_VALID_TO" },
              { field: "user_id", rule: "User must exist and status is ACTIVE", errorMessage: "USER_INACTIVE_OR_NOT_FOUND" },
              { field: "plate_number", rule: "Only one Active pass is allowed within the same date range", errorMessage: "ACTIVE_PASS_OVERLAP" }
            ],
            securityRules: [
              "JWT Authentication: Strict token verification with role matching (Admin/Manager).",
              "Mass Assignment Prevention: Use strict DTOs. Never bind request body directly to EF Core Entities.",
              "IDOR Prevention: Validate entity exists before doing updates or status patch."
            ],
            logEvents: [
              "Log every creation, update, and status change with old and new states in the audit log."
            ],
            noLogEvents: [
              "Never log JWT payloads, user passwords, or payment tokens."
            ],
            integrationPoints: [
              { system: "Audit Logging Service", responsibility: "Recording all mutation events with old and new values." },
              { system: "Barrier Control", responsibility: "Reading active pass validity for barrier access checks." }
            ],
            uiPage: "/manager/monthly-passes",
            uiComponents: "Paginated grid with search, filter, status badges; form modal for create/edit; confirmation dialogs for status transitions.",
            uiStateLoading: "Show a full-page grid loading indicator and disable action buttons.",
            uiStateEmpty: "Show 'No monthly passes found.' template inside the grid when no data matches search filters.",
            uiStateError: "Show toast error messages detailing validation conflicts or server exceptions.",
            uiStateSuccess: "Populates data grid rows and displays success notification toast.",
            notes: "Monthly Pass Lifecycle: ACTIVE -> SUSPENDED, ACTIVE -> CANCELED, SUSPENDED -> ACTIVE, SUSPENDED -> CANCELED. CANCELED is terminal.",
            dependencies: [],
            risks: [],
            endpoints: [
              "GET /api/core/monthly-passes",
              "GET /api/core/monthly-passes/{id}",
              "POST /api/core/monthly-passes",
              "PUT /api/core/monthly-passes/{id}",
              "PATCH /api/core/monthly-passes/{id}/status"
            ],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-mpcm-get-list",
                name: "GET /api/core/monthly-passes",
                content: `Method: GET\nPath: /api/core/monthly-passes?page=1&size=10&status=ACTIVE\nHeaders:\n  Authorization: Bearer <token>\nResponse 200 OK:\n{\n  "success": true,\n  "data": {\n    "items": [\n      {\n        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",\n        "userId": "5ea85f64-5717-4562-b3fc-2c963f66afa7",\n        "plateNumber": "59A-12345",\n        "vehicleType": "Car",\n        "validFrom": "2026-07-01T00:00:00Z",\n        "validTo": "2026-07-31T23:59:59Z",\n        "status": "ACTIVE"\n      }\n    ],\n    "totalCount": 1,\n    "page": 1,\n    "size": 10\n  }\n}`
              },
              {
                id: "contract-mpcm-post",
                name: "POST /api/core/monthly-passes",
                content: `Method: POST\nPath: /api/core/monthly-passes\nHeaders:\n  Authorization: Bearer <token>\n  Content-Type: application/json\nRequest Body:\n{\n  "userId": "5ea85f64-5717-4562-b3fc-2c963f66afa7",\n  "plateNumber": "59A-12345",\n  "vehicleType": "Car",\n  "validFrom": "2026-08-01T00:00:00Z",\n  "validTo": "2026-08-31T23:59:59Z"\n}\nResponse 201 Created:\n{\n  "success": true,\n  "data": {\n    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",\n    "concurrencyToken": "AAAAAAAAB9o="\n  }\n}`
              },
              {
                id: "contract-mpcm-put",
                name: "PUT /api/core/monthly-passes/{id}",
                content: `Method: PUT\nPath: /api/core/monthly-passes/3fa85f64-5717-4562-b3fc-2c963f66afa6\nHeaders:\n  Authorization: Bearer <token>\n  Content-Type: application/json\nRequest Body:\n{\n  "plateNumber": "59A-12345",\n  "vehicleType": "Car",\n  "validFrom": "2026-08-01T00:00:00Z",\n  "validTo": "2026-09-30T23:59:59Z",\n  "concurrencyToken": "AAAAAAAAB9o="\n}\nResponse 200 OK:\n{\n  "success": true,\n  "message": "Monthly pass updated successfully."\n}`
              },
              {
                id: "contract-mpcm-patch-status",
                name: "PATCH /api/core/monthly-passes/{id}/status",
                content: `Method: PATCH\nPath: /api/core/monthly-passes/3fa85f64-5717-4562-b3fc-2c963f66afa6/status\nHeaders:\n  Authorization: Bearer <token>\n  Content-Type: application/json\nRequest Body:\n{\n  "status": "SUSPENDED",\n  "reason": "Non-payment of building maintenance fee",\n  "concurrencyToken": "AAAAAAAAB9o="\n}\nResponse 200 OK:\n{\n  "success": true,\n  "message": "Monthly pass status transitioned to SUSPENDED."\n}`
              }
            ],
            testCases: [
              {
                id: "tc-mpcm-auth-01",
                title: "Verify POST monthly pass fails if token is missing",
                type: "api",
                precondition: "No authorization header.",
                steps: [
                  "Dispatch POST request to /api/core/monthly-passes without bearer token."
                ],
                expectedResult: "HTTP 401 Unauthorized is returned.",
                status: "not_started"
              },
              {
                id: "tc-mpcm-auth-02",
                title: "Verify Driver role is forbidden from using admin endpoints",
                type: "api",
                precondition: "Authenticated user possesses only the DRIVER role.",
                steps: [
                  "Dispatch POST request to /api/core/monthly-passes with Driver token."
                ],
                expectedResult: "HTTP 403 Forbidden is returned.",
                status: "not_started"
              },
              {
                id: "tc-mpcm-create-success",
                title: "Verify Manager can manually issue new pass for valid user and vehicle",
                type: "integration",
                precondition: "A valid active user and vehicle type exist in DB.",
                steps: [
                  "Dispatch POST request to /api/core/monthly-passes with valid parameters."
                ],
                expectedResult: "HTTP 201 Created is returned with new pass id and concurrency token.",
                status: "not_started"
              },
              {
                id: "tc-mpcm-overlap-plate",
                title: "Verify overlapping active pass for same plate number is rejected",
                type: "integration",
                precondition: "An active pass already exists for plate 59A-12345 spanning 2026-07-01 to 2026-07-31.",
                steps: [
                  "Attempt to POST another active pass for same plate spanning 2026-07-15 to 2026-08-15."
                ],
                expectedResult: "HTTP 409 Conflict is returned with error ACTIVE_PASS_OVERLAP.",
                status: "not_started"
              },
              {
                id: "tc-mpcm-invalid-range",
                title: "Verify chronologically invalid date bounds are rejected",
                type: "api",
                precondition: "Authenticated Manager.",
                steps: [
                  "POST monthly pass with validFrom = 2026-08-10 and validTo = 2026-08-01."
                ],
                expectedResult: "HTTP 400 Bad Request with validation error on date bounds.",
                status: "not_started"
              },
              {
                id: "tc-mpcm-mass-assignment",
                title: "Verify user_id modification attempt is ignored via DTO mapping",
                type: "api",
                precondition: "An existing pass in DB.",
                steps: [
                  "Dispatch PUT request changing plateNumber AND attempting to modify userId."
                ],
                expectedResult: "HTTP 200 OK. Verify that plateNumber changed but userId remains identical in DB.",
                status: "not_started"
              },
              {
                id: "tc-mpcm-patch-cancel",
                title: "Verify Admin can transition status to terminal CANCELED state",
                type: "integration",
                precondition: "Pass is currently ACTIVE.",
                steps: [
                  "Dispatch PATCH /status with status = CANCELED."
                ],
                expectedResult: "HTTP 200 OK. Subsequent attempts to modify dates or reactivate return HTTP 400 Bad Request.",
                status: "not_started"
              },
              {
                id: "tc-mpcm-concurrency",
                title: "Verify optimistic concurrency control catches outdated token values",
                type: "integration",
                precondition: "Pass exists. Two managers load the same record concurrently.",
                steps: [
                  "Manager A updates plate number -> succeeds.",
                  "Manager B attempts update using original outdated concurrency token."
                ],
                expectedResult: "HTTP 409 Conflict is returned to Manager B. Transaction is rolled back.",
                status: "not_started"
              },
              {
                id: "tc-mpcm-tx-rollback",
                title: "Verify database transaction rolls back all updates if audit logger fails",
                type: "integration",
                precondition: "Audit logging DB constraint is intentionally tripped during update.",
                steps: [
                  "Attempt to PUT updates to monthly pass."
                ],
                expectedResult: "HTTP 500 Internal Server Error. The pass updates are rolled back and not persisted.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-mpcm-inspect", content: "AI has inspected and reused the existing MonthlyPass entity, PK types, and Concurrency mechanism.", checked: true },
              { id: "dc-mpcm-crud", content: "CRUD operations and Status transitions are fully implemented and transactional.", checked: true },
              { id: "dc-mpcm-overlap", content: "Overlapping ACTIVE passes for the same plate are strictly prevented.", checked: true },
              { id: "dc-mpcm-audit", content: "Integration with existing Audit mechanism is verified.", checked: true },
              { id: "dc-mpcm-terminal", content: "Modifications to terminal states (CANCELED) are blocked.", checked: true },
              { id: "dc-mpcm-response", content: "Responses use standard ApiResponse<T>.", checked: true },
              { id: "dc-mpcm-deadlock", content: "Deadlock handling and transaction rollbacks are properly configured.", checked: true },
              { id: "dc-mpcm-tests", content: "55+ automated tests (API, Integration, Validation) are implemented and passing.", checked: true },
              { id: "dc-mpcm-security", content: "Security (JWT, Roles, IDOR prevention, Mass Assignment) is verified.", checked: true }
            ]
          },
          {
            id: "leaf-mp-renew",
            title: "Renew Monthly Pass",
            type: "leaf_feature",
            status: "ready",
            priority: "high",
            clients: ["Driver", "Staff"],
            tags: ["monthly-passes", "renewal", "transaction", "pricing"],
            summary: "Build a function to extend the validity period of a MonthlyPass. The objective is to maintain continuous service for users, adhere to current financial policies (Receipt generation) and parking management operations.",
            objective: "Ensure data integrity through atomic transactions, optimistic concurrency control (xmin), calculations via PricingRule, Receipt generation, and AuditLog persistence, while enforcing strict ownership checking for Driver role.",
            inScope: [
              "Validity extension logic.",
              "State condition validation.",
              "Pricing calculation via PricingRule.",
              "Receipt generation.",
              "AuditLog persistence."
            ],
            outOfScope: [
              "Direct payment gateway integration (handled by Payment Service).",
              "Automated notifications (Email/Push).",
              "Automated renewal (Cron job)."
            ],
            permissions: [
              { role: "Driver", permission: "Renew their own pass. Requires ownership verification (IDOR Check: Pass.UserId == CurrentUserId)." },
              { role: "Staff", permission: "Renew any pass to support customers. No ownership restrictions." },
              { role: "System", permission: "Automatically validate rules and log actions into AuditLog." }
            ],
            businessRules: [
              "Status eligibility: ACTIVE Pass is allowed. EXPIRED Pass is allowed only if within the Grace Period (maximum X days post-expiration - Inspect MonthlyPassPolicy). SUSPENDED/CANCELED Pass is blocked.",
              "Pending Renewal Check: Block renewal if a PENDING request already exists.",
              "Pricing Rules: Renewal price is derived from PricingRule based on VehicleType.",
              "Concurrency Constraint: Mandatory use of xmin (RowVersion) for optimistic concurrency control. Reject transaction with 409 Conflict if modified.",
              "Payment/Receipt Linkage: Every successful renewal must generate one Receipt record. If Receipt creation fails, perform a full transaction rollback."
            ],
            dbExistingTables: ["monthly_passes", "receipts", "audit_logs"],
            dbNewTablesSql: "",
            dbRelationships: [
              "receipts: Foreign key monthly_pass_id references monthly_passes(id).",
              "audit_logs: RecordId relates to monthly_passes(id) or receipts(id)."
            ],
            validationRules: [
              { field: "durationMonths", rule: "Must be between 1 and 12", errorMessage: "DURATION_OUT_OF_RANGE" },
              { field: "concurrencyToken", rule: "Must be provided and not empty", errorMessage: "CONCURRENCY_TOKEN_REQUIRED" },
              { field: "status", rule: "Must be ACTIVE, or EXPIRED within grace period", errorMessage: "PASS_NOT_ELIGIBLE_FOR_RENEWAL" }
            ],
            securityRules: [
              "IDOR Verification: Strict validation of UserId in MonthlyPass against JWT UserContext for Driver role. Staff bypassed.",
              "Mass Assignment: Never bind request payloads directly to EF Core Entities."
            ],
            logEvents: [
              "Log renewal transaction detailing duration, amount, new expiry date, actor details, and old/new states in AuditLog."
            ],
            noLogEvents: [
              "Never leak sensitive user credentials, cryptographic hashes, or system configuration keys."
            ],
            integrationPoints: [
              { system: "Pricing Service", responsibility: "Computing renewal cost dynamically based on vehicle type and duration." },
              { system: "Payment/Receipt System", responsibility: "Recording official payment receipts for accounting." }
            ],
            uiPage: "/driver/monthly-passes or /staff/renewals",
            uiComponents: "Confirmation dialog showing pricing calculation, current expiration date, calculated new expiration date, and 'Renew Now' action button (which shows loading spinner and is disabled while processing).",
            uiStateLoading: "Disable submit button, show loading spinner over confirm modal.",
            uiStateEmpty: "N/A",
            uiStateError: "Show clear validation warnings or error banners like: 'Pass expired beyond grace period, please contact support' or 'Record was modified by another operator. Please refresh and try again.'",
            uiStateSuccess: "Show success check animation, display transaction details (receipt number, new expiry date) and auto-close dialog.",
            notes: "Grace Period policy checks are loaded dynamically. Database concurrency uses PostgreSQL xmin column mapped in EF Core.",
            dependencies: [],
            risks: [],
            endpoints: ["POST /api/core/monthly-passes/{id}/renew"],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-mpr-post",
                name: "POST /api/core/monthly-passes/{id}/renew",
                content: `Method: POST\nPath: /api/core/monthly-passes/3fa85f64-5717-4562-b3fc-2c963f66afa6/renew\nHeaders:\n  Authorization: Bearer <token>\n  Content-Type: application/json\nRequest Body:\n{\n  "durationMonths": 3,\n  "concurrencyToken": "AAAAAAAAB9o="\n}\nResponse 200 OK:\n{\n  "success": true,\n  "data": {\n    "monthlyPassId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",\n    "newExpiryDate": "2026-10-31T23:59:59Z",\n    "receiptId": "8fa85f64-5717-4562-b3fc-2c963f66afa9",\n    "amount": 900000.00\n  }\n}`
              }
            ],
            testCases: [
              {
                id: "tc-mpr-success-driver",
                title: "Verify Driver can successfully renew active pass",
                type: "integration",
                precondition: "Pass is owned by current user and is ACTIVE.",
                steps: [
                  "Dispatch POST request to /renew with durationMonths = 3."
                ],
                expectedResult: "HTTP 200 OK. Expiry date updated, Receipt generated, and AuditLog entry created.",
                status: "not_started"
              },
              {
                id: "tc-mpr-success-staff",
                title: "Verify Staff can renew expired pass within grace period",
                type: "integration",
                precondition: "Pass is EXPIRED but within allowed grace period.",
                steps: [
                  "Staff dispatches POST request to /renew with durationMonths = 1."
                ],
                expectedResult: "HTTP 200 OK. Pass transitioned to ACTIVE starting from old expiry.",
                status: "not_started"
              },
              {
                id: "tc-mpr-invalid-role",
                title: "Verify anonymous or unauthorized role request is rejected",
                type: "api",
                precondition: "Invalid or missing token.",
                steps: [
                  "Attempt POST /renew."
                ],
                expectedResult: "HTTP 401 Unauthorized or 403 Forbidden.",
                status: "not_started"
              },
              {
                id: "tc-mpr-duration-range",
                title: "Verify renewal duration outside 1-12 range is rejected",
                type: "api",
                precondition: "Authenticated Driver.",
                steps: [
                  "Attempt POST /renew with durationMonths = 13."
                ],
                expectedResult: "HTTP 400 Bad Request with DURATION_OUT_OF_RANGE validation error.",
                status: "not_started"
              },
              {
                id: "tc-mpr-idor-driver",
                title: "Verify Driver is blocked from renewing another user's pass",
                type: "api",
                precondition: "Driver is authenticated. Pass belongs to another driver.",
                steps: [
                  "Attempt POST /renew."
                ],
                expectedResult: "HTTP 403 Forbidden due to IDOR check failure.",
                status: "not_started"
              },
              {
                id: "tc-mpr-expired-grace-fail",
                title: "Verify renewal of pass expired beyond grace period is rejected",
                type: "integration",
                precondition: "Pass is expired beyond allowed grace period.",
                steps: [
                  "Attempt POST /renew."
                ],
                expectedResult: "HTTP 400 Bad Request. Error: PASS_NOT_ELIGIBLE_FOR_RENEWAL.",
                status: "not_started"
              },
              {
                id: "tc-mpr-concurrency-clash",
                title: "Verify optimistic concurrency blocks racing duplicate renewals",
                type: "concurrency",
                precondition: "Two renewal requests dispatch concurrently.",
                steps: [
                  "First request completes successfully.",
                  "Second request fails concurrency token validation."
                ],
                expectedResult: "HTTP 409 Conflict. Second transaction is aborted and rolled back.",
                status: "not_started"
              },
              {
                id: "tc-mpr-tx-rollback",
                title: "Verify atomic transaction rollbacks pass update if receipt fails",
                type: "integration",
                precondition: "A database constraint is triggered during receipt insert.",
                steps: [
                  "Execute renewal request."
                ],
                expectedResult: "HTTP 500 Internal Server Error. Pass expiration date remains unmodified.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-mpr-inspect", content: "AI has inspected and reused the existing entities and logic.", checked: true },
              { id: "dc-mpr-tx", content: "DB transaction guarantees atomicity: pass extension, receipt, and audit logging commit or rollback together.", checked: true },
              { id: "dc-mpr-grace", content: "Grace period policy and status validations are strictly checked.", checked: true },
              { id: "dc-mpr-pricing", content: "Pricing calculations are dynamically fetched from PricingRule.", checked: true },
              { id: "dc-mpr-idor", content: "IDOR checks verify pass ownership for Driver role.", checked: true },
              { id: "dc-mpr-concurrency", content: "PostgreSQL xmin optimistic concurrency control is implemented.", checked: true },
              { id: "dc-mpr-response", content: "Responses use standard ApiResponse<T>.", checked: true },
              { id: "dc-mpr-tests", content: "Code passes all 40 defined automated tests.", checked: true },
              { id: "dc-mpr-audit", content: "Audit logs are generated for all renewals.", checked: true }
            ]
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
            status: "ready",
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
            status: "ready",
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
            status: "ready",
            priority: "medium",
            tags: ["lost-card", "incidents", "manual-override"],
            summary: "Provide a fail-safe mechanism that allows authorized Staff or Managers to manually open a barrier gate and manually record vehicle entry or exit events when critical system failures, sensor malfunctions, or completely unreadable parking cards prevent the normal parking workflow from operating.",
            objective: "Implement transaction-safe manual override APIs in .NET Core API that support opening barriers, manual entry/exit registration, operator auditing, Manager approval workflow integration, and secure hardware controller commands.",
            inScope: [
              "Manually open the barrier gate.",
              "Manually record vehicle entry events.",
              "Manually record vehicle exit events.",
              "Record complete audit information for every override operation.",
              "Support Manager review workflow for Staff overrides.",
              "Secure communication with the local hardware controller / IoT gateway."
            ],
            outOfScope: [
              "Automatic gate operation.",
              "Normal ALPR or RFID-based parking workflow.",
              "External hardware maintenance."
            ],
            permissions: [
              { role: "Staff", permission: "Authorized to perform manual overrides. Actions require Manager review within 24 hours." },
              { role: "Manager", permission: "Authorized to perform manual overrides. Actions are automatically approved but fully audited." }
            ],
            businessRules: [
              "Manual override operations bypass the normal parking workflow only in exceptional situations.",
              "Staff manual overrides must be flagged for mandatory Manager review within 24 hours.",
              "Manager manual overrides are automatically approved but remain fully auditable.",
              "Every manual override must permanently record the exact timestamp, gate ID, operator ID, action type, and execution result.",
              "Manual override audit records must be immutable and cannot be modified after creation."
            ],
            dbExistingTables: [
              "parking_sessions",
              "gates",
              "users",
              "audit_logs",
              "incident_cases"
            ],
            dbNewTablesSql: "",
            dbRelationships: [
              "Every manual override belongs to one gate.",
              "Every manual override is linked to the authenticated Staff or Manager.",
              "Manual overrides create immutable audit log records.",
              "Staff overrides generate pending Manager review records."
            ],
            validationRules: [
              { field: "gateId", rule: "Required and must exist", errorMessage: "Gate does not exist." },
              { field: "reason", rule: "Required", errorMessage: "Override reason is required." },
              { field: "licensePlate", rule: "Required for manual entry/exit", errorMessage: "License plate is required." }
            ],
            securityRules: [
              "Validate role permissions.",
              "Prevent unauthorized access.",
              "Secure communication with the local hardware controller / IoT gateway.",
              "Only Staff and Managers may perform manual overrides.",
              "Audit records must be immutable.",
              "Do not log sensitive data."
            ],
            logEvents: [
              "Barrier manually opened.",
              "Manual vehicle entry.",
              "Manual vehicle exit.",
              "Override reason.",
              "Executing Staff/Manager ID.",
              "Gate ID.",
              "Exact execution timestamp.",
              "Manager review result.",
              "Hardware communication result."
            ],
            noLogEvents: [
              "Passwords.",
              "Access tokens.",
              "Refresh tokens.",
              "Credit card details."
            ],
            integrationPoints: [
              { system: "Local Hardware Controller", responsibility: "Receive barrier open signals." },
              { system: "IoT Gateway", responsibility: "Relay barrier control actions." },
              { system: "Gate Controller Service", responsibility: "Execute barrier state overrides." },
              { system: "Audit Log Export module", responsibility: "Expose manual overrides history." },
              { system: "Manager Review module", responsibility: "Track pending approvals for Staff overrides." }
            ],
            uiPage: "/staff/overrides",
            uiComponents: "Manual Override Control Dashboard, Gate Selector, Reason Textarea, Confirmation Dialog, Process Progress Spinner",
            uiStateIdle: "Display manual override controls.",
            uiStateLoading: "Display progress while sending commands to the gate controller.",
            uiStateSuccess: "Display confirmation after successful override.",
            uiStateEmpty: "No override history available.",
            uiStateError: "Display hardware communication or validation errors.",
            endpoints: [
              "POST /api/core/manual-overrides/barrier/open",
              "POST /api/core/manual-overrides/entry",
              "POST /api/core/manual-overrides/exit",
              "GET /api/core/manual-overrides/{overrideId}"
            ],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-post-manual-overrides-barrier-open",
                name: "POST /api/core/manual-overrides/barrier/open",
                content: "Method: POST\nPath: /api/core/manual-overrides/barrier/open\nHeaders:\n  Authorization: Bearer <token>\nRequest:\n{\n  \"gateId\": \"gate-01\",\n  \"reason\": \"RFID reader failure\"\n}\nResponse:\n  status: 200 OK\n{\n  \"success\": true,\n  \"message\": \"Barrier opened successfully.\",\n  \"data\": {\n    \"overrideId\": \"ovr-001\",\n    \"status\": \"Completed\"\n  }\n}"
              },
              {
                id: "contract-post-manual-overrides-entry",
                name: "POST /api/core/manual-overrides/entry",
                content: "Method: POST\nPath: /api/core/manual-overrides/entry\nRequest:\n{\n  \"gateId\": \"gate-01\",\n  \"licensePlate\": \"51A-12345\",\n  \"reason\": \"Card unreadable\"\n}"
              },
              {
                id: "contract-post-manual-overrides-exit",
                name: "POST /api/core/manual-overrides/exit",
                content: "Method: POST\nPath: /api/core/manual-overrides/exit\nRequest:\n{\n  \"gateId\": \"gate-02\",\n  \"licensePlate\": \"51A-12345\",\n  \"reason\": \"System offline\"\n}"
              }
            ],
            testCases: [
              {
                id: "tc-override-staff-success",
                title: "Verify authorized client (Staff) can access \"Manual Staff Override\" successfully",
                type: "api",
                precondition: "Client is authenticated with role: Staff.",
                steps: [
                  "Authenticate as Staff.",
                  "Submit a manual barrier open request."
                ],
                expectedResult: "Override request succeeds and audit record is created.",
                status: "not_started"
              },
              {
                id: "tc-override-manager-success",
                title: "Verify authorized client (Manager) can access \"Manual Staff Override\" successfully",
                type: "api",
                precondition: "Client is authenticated with role: Manager.",
                steps: [
                  "Authenticate as Manager.",
                  "Submit a manual barrier open request."
                ],
                expectedResult: "Override succeeds and is automatically approved.",
                status: "not_started"
              },
              {
                id: "tc-override-unauthorized",
                title: "Verify unauthorized role is rejected",
                type: "api",
                precondition: "User lacks permission.",
                steps: [
                  "Attempt to execute a manual override."
                ],
                expectedResult: "Returns 401 Unauthorized or 403 Forbidden.",
                status: "not_started"
              },
              {
                id: "tc-override-staff-review",
                title: "Verify Staff override requires Manager review",
                type: "integration",
                expectedResult: "Override is flagged for Manager review within 24 hours.",
                status: "not_started"
              },
              {
                id: "tc-override-immutable-audit",
                title: "Verify immutable audit log is created",
                type: "integration",
                expectedResult: "Timestamp, gate ID, operator ID, reason, and result are permanently stored.",
                status: "not_started"
              },
              {
                id: "tc-override-hardware-signal",
                title: "Verify hardware controller receives override command",
                type: "integration",
                expectedResult: "Gate controller successfully receives and executes the open command.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-override-contract", content: "API contract is documented in this node.", checked: false },
              { id: "dc-override-roles", content: "Required clients/roles are assigned.", checked: false },
              { id: "dc-override-export", content: "Business rules and inherited rules are visible in AI export.", checked: false },
              { id: "dc-override-response-format", content: "Success response uses common API response format where applicable.", checked: false },
              { id: "dc-override-error-safe", content: "Error response is clear and does not leak sensitive data.", checked: false },
              { id: "dc-override-barrier-control", content: "Manual barrier control is implemented.", checked: false },
              { id: "dc-override-entry-exit-logging", content: "Manual entry and exit logging is implemented.", checked: false },
              { id: "dc-override-hardware-integration", content: "Secure integration with the hardware controller is implemented.", checked: false },
              { id: "dc-override-staff-review", content: "Staff overrides require Manager review within 24 hours.", checked: false },
              { id: "dc-override-manager-auto", content: "Manager overrides are automatically approved.", checked: false },
              { id: "dc-override-immutable-audit", content: "Immutable audit logs record timestamp, gate ID, operator ID, action, and reason.", checked: false },
              { id: "dc-override-test-cases", content: "At least two test cases are defined.", checked: false },
              { id: "dc-override-ai-export", content: "Feature can be exported as AI-readable Markdown.", checked: false }
            ]
          },
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
            status: "in_progress",
            priority: "medium",
            clients: ["Manager", "Admin"],
            tags: ["reporting", "dashboard", "analytics", "cache"],
            summary: "Cung cấp một API tổng hợp dữ liệu thời gian thực (Real-time Aggregation) để xây dựng trang Dashboard Giám sát Vận hành dành cho Manager và Admin.",
            objective: "Cung cấp một API tổng hợp dữ liệu thời gian thực (Real-time Aggregation) để xây dựng trang Dashboard Giám sát Vận hành dành cho Manager và Admin. API này tổng hợp và phân tích toàn bộ các chỉ số vận hành quan trọng như: trạng thái xử lý sự cố (Incidents), thống kê báo mất thẻ (LostCardCases), danh sách giao dịch lỗi cần duyệt lại (UnderReview Payments), hiệu suất xử lý của nhân viên và xu hướng sự cố phát sinh theo thời gian.",
            inScope: [
              "Tổng hợp các chỉ số KPI vận hành theo chu kỳ thời gian (Daily, Weekly, Monthly) hoặc theo khoảng thời gian tùy chọn (startDate đến endDate).",
              "Đếm số lượng sự vụ theo trạng thái (Pending, Processing, Resolved).",
              "Thống kê các khoản thanh toán nghi vấn cần rà soát thủ công (Trạng thái UnderReview từ PayOS Webhook).",
              "Thống kê số lượng mất thẻ và các tài liệu minh chứng đi kèm.",
              "Trả về danh sách top sự cố khẩn cấp (Critical Incidents) chưa được xử lý để hiển thị trên bảng cảnh báo của Manager."
            ],
            outOfScope: [
              "Biểu đồ hóa dữ liệu trực quan (phần này do Frontend xử lý dựa trên JSON trả về).",
              "Xuất file báo cáo định dạng Excel, PDF (sẽ do một Feature chuyên dụng khác đảm nhận)."
            ],
            permissions: [
              { role: "Admin", permission: "Read-Only - Truy cập toàn bộ số liệu phân tích vận hành trên toàn bộ các tòa nhà/bãi đỗ thuộc hệ thống." },
              { role: "Manager", permission: "Read-Only - Truy cập số liệu phân tích vận hành thuộc phạm vi tòa nhà được phân quyền quản lý." }
            ],
            businessRules: [
              "Read-Only Transaction Isolation: Vì Spring Boot Support API chịu trách nhiệm đọc dữ liệu báo cáo từ shared PostgreSQL, tất cả các truy vấn JPA/Hibernate tại service này phải được đánh dấu @Transactional(readOnly = true) để tối ưu hóa hiệu năng bộ nhớ (bypass dirty checking).",
              "Date Range Limit: Mặc định nếu người dùng không truyền startDate và endDate, hệ thống sẽ tự động lấy dữ liệu trong vòng 30 ngày gần nhất. Giới hạn khoảng cách tối đa giữa 2 ngày truy vấn không được vượt quá 90 ngày để tránh làm nghẽn DB (tránh quét toàn bộ bảng dữ liệu lớn).",
              "Data Refreshment Cache: Để tránh việc Manager F5 liên tục làm quá tải hệ thống, kết quả của Dashboard có thể được cache tạm thời (In-Memory Cache như Caffeine hoặc Redis) với thời gian sống (TTL) là 1 phút."
            ],
            dbExistingTables: ["LostCardCases", "Payments", "Incidents"],
            dbNewTablesSql: "",
            dbRelationships: [],
            validationRules: [
              { field: "startDate", rule: "Định dạng yyyy-MM-dd hợp lệ. Không được lớn hơn ngày hiện tại.", errorMessage: "INVALID_START_DATE" },
              { field: "endDate", rule: "Định dạng yyyy-MM-dd hợp lệ. Phải lớn hơn hoặc bằng startDate.", errorMessage: "INVALID_END_DATE" },
              { field: "Range", rule: "endDate trừ startDate không được vượt quá 90 ngày.", errorMessage: "DATE_RANGE_EXCEEDED_MAX_LIMIT" }
            ],
            securityRules: [
              "Role Validation: Chặn toàn bộ các truy cập từ các Role không phải là Manager hoặc Admin. Trả về 403 Forbidden.",
              "Data Isolation: Nếu truy cập bằng tài khoản Manager, câu lệnh SQL/JPA đằng sau phải tự động bổ sung điều kiện lọc theo BuildingId của tòa nhà mà Manager đó phụ trách quản lý (đọc từ JWT Claims). Admin sẽ không bị giới hạn này."
            ],
            logEvents: [
              "Log các lượt truy cập dashboard kèm theo bộ lọc thời gian (startDate, endDate), ID người dùng và thời gian xử lý truy vấn (Query execution duration)."
            ],
            noLogEvents: [
              "Không ghi log danh sách chi tiết các vụ việc hoặc thông tin định danh cá nhân của khách hàng nhúng trong danh sách trả về."
            ],
            integrationPoints: [
              { system: "PostgreSQL Shared Database", responsibility: "Kết nối trực tiếp để thực hiện các truy vấn aggregate dữ liệu." },
              { system: "Caffeine/Redis Cache Manager", responsibility: "Sử dụng cache lớp trung gian để giảm tải cho database khi tần suất gọi API từ phía Admin web tăng cao." }
            ],
            uiComponents: "Page: /admin/operational-analytics hoặc /manager/dashboard. UI States: Skeleton Loader cho summary cards và charts; CountUp animation; Badge Pulse màu đỏ cho Critical/UnderReview items; Empty State graphic; Alert Box lỗi.",
            uiStateSuccess: "KPI numbers rendered with count-up animations, and Critical or UnderReview items have a pulsing red badge to draw attention.",
            endpoints: ["GET /api/support/dashboard"],
            ownerService: "Spring Boot Support API",
            apiContracts: [
              {
                id: "contract-support-dashboard",
                name: "GET /api/support/dashboard",
                content: `Method: GET\nPath: /api/support/dashboard?startDate=2026-07-01&endDate=2026-07-17\nHeaders:\n  Authorization: Bearer <token>\nResponse 200 OK:\n{\n  "success": true,\n  "data": {\n    "summary": {\n      "totalIncidents": 142,\n      "pendingIncidents": 12,\n      "processingIncidents": 8,\n      "resolvedIncidents": 122,\n      "activeLostCardCases": 5,\n      "paymentsUnderReviewCount": 3\n    },\n    "efficiencyKPI": {\n      "avgResolutionTimeMinutes": 45.2,\n      "longestResolutionTimeMinutes": 320.0\n    },\n    "incidentDistribution": [\n      { "category": "Lost_Card", "count": 28 },\n      { "category": "Gate_Failure", "count": 84 },\n      { "category": "Payment_Issue", "count": 22 },\n      { "category": "Other", "count": 8 }\n    ],\n    "unresolvedCriticalIncidents": [\n      {\n        "id": "1a3deb4d-3b7d-4bad-9bdd-2b0d7b3dcb01",\n        "category": "Payment_Issue",\n        "description": "Payment mismatch for Order 123456. Expected 30k but got 20k",\n        "severity": "Critical",\n        "reportedAt": "2026-07-17T15:30:00Z"\n      }\n    ]\n  }\n}`
              }
            ],
            testCases: [
              {
                id: "tc-support-dashboard-success",
                title: "Verify Manager can pull Support Dashboard with custom valid dates",
                type: "integration",
                precondition: "Người dùng đăng nhập thành công bằng tài khoản Manager.",
                steps: [
                  "Gửi request GET tới /api/support/dashboard?startDate=2026-06-01&endDate=2026-06-15."
                ],
                expectedResult: "HTTP 200 OK. Phản hồi trả về đúng định dạng JSON chứa các mục summary, efficiencyKPI, và unresolvedCriticalIncidents.",
                status: "not_started"
              },
              {
                id: "tc-support-dashboard-date-exceeded",
                title: "Verify query validation fails if date range exceeds 90 days",
                type: "api",
                precondition: "Token Admin hợp lệ.",
                steps: [
                  "Gửi request GET tới /api/support/dashboard?startDate=2026-01-01&endDate=2026-05-01 (4 tháng)."
                ],
                expectedResult: "HTTP 400 Bad Request kèm mã lỗi DATE_RANGE_EXCEEDED_MAX_LIMIT.",
                status: "not_started"
              },
              {
                id: "tc-support-dashboard-unauthorized",
                title: "Verify non-authorized users (Staff / Guest) are strictly blocked",
                type: "api",
                precondition: "Token có role là Staff hoặc không có Token.",
                steps: [
                  "Gửi request GET tới /api/support/dashboard."
                ],
                expectedResult: "HTTP 403 Forbidden hoặc HTTP 401 Unauthorized.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-support-dashboard-contract", content: "API contract is documented in this node.", checked: true },
              { id: "dc-support-dashboard-roles", content: "Required clients/roles (Manager, Admin) are assigned.", checked: true },
              { id: "dc-support-dashboard-validation", content: "Date range validation logic is strictly enforced (max 90 days query limit).", checked: true },
              { id: "dc-support-dashboard-isolation", content: "Data isolation between Admin (system-wide) and Manager (building-level) is validated.", checked: true },
              { id: "dc-support-dashboard-underreview", content: "UnderReview payment alerts are aggregated and displayed accurately.", checked: true },
              { id: "dc-support-dashboard-json-format", content: "Response payload uses the global standardized success/error JSON response structure.", checked: true },
              { id: "dc-support-dashboard-ui-states", content: "UI states (idle, loading, success, empty, error) are fully documented.", checked: true },
              { id: "dc-support-dashboard-tests", content: "At least three automated tests are written and pass.", checked: true }
            ],
            notes: "Before coding:\nInspect the existing project structures in the Spring Boot Support API workspace. Follow established package naming conventions (e.g., com.parking.support.controller, service, dto).\nMark service class/methods handling this dashboard with @Transactional(readOnly = true) to avoid transaction lock contention on the shared DB.\nWrite database queries using optimized JPQL or Spring Data native @Query annotations. Minimize loading entire entity graphs; construct flat Projection/DTO classes directly from SQL select clauses.\nImplement a lightweight caching abstraction (e.g., Spring @Cacheable using Caching Provider Caffeine) with a TTL of 60 seconds to safeguard system availability.\nCheck and run existing tests before adding dashboard-related test code under /src/test/java.\nRun clean package builds and verify that all dashboard integration tests pass successfully."
          },
          {
            id: "leaf-rep-revenue",
            title: "Revenue Report",
            type: "leaf_feature",
            status: "in_progress",
            priority: "high",
            clients: ["Manager", "Admin"],
            tags: ["reporting", "revenue", "excel", "analytics"],
            summary: "Cung cấp API truy xuất và tổng hợp dữ liệu doanh thu của bãi đỗ xe trong một khoảng thời gian nhất định.",
            objective: "Cung cấp API truy xuất và tổng hợp dữ liệu doanh thu của bãi đỗ xe trong một khoảng thời gian nhất định. API hỗ trợ trả về dữ liệu dưới dạng JSON (để vẽ biểu đồ, hiển thị lưới dữ liệu trên web) hoặc xuất trực tiếp ra file Excel (Spreadsheet) phục vụ công tác kế toán, đối soát. Báo cáo sẽ bóc tách doanh thu chi tiết theo từng loại phương tiện (Car, Motorbike, Bicycle) và phương thức thanh toán (Cash, Online_PayOS).",
            inScope: [
              "Gom nhóm và tính tổng doanh thu dựa trên các giao dịch (Payments) có trạng thái là Completed.",
              "Cung cấp bộ lọc theo khoảng thời gian (startDate, endDate).",
              "Phân loại doanh thu theo phương thức thanh toán và loại phương tiện.",
              "Trả về chuỗi dữ liệu (Time-series data) theo từng ngày để vẽ biểu đồ xu hướng doanh thu.",
              "Hỗ trợ tham số format=excel để Stream trực tiếp dữ liệu dạng file .xlsx về client."
            ],
            outOfScope: [
              "Tính toán các khoản chi phí vận hành (điện, nước, lương nhân viên) hoặc lợi nhuận ròng.",
              "Thay đổi, chỉnh sửa trạng thái hóa đơn (Read-only API)."
            ],
            permissions: [
              { role: "Admin", permission: "Read-Only - Được phép xem báo cáo doanh thu tổng của toàn bộ hệ thống hoặc lọc theo từng bãi đỗ." },
              { role: "Manager", permission: "Read-Only - Chỉ được phép xem báo cáo doanh thu thuộc bãi đỗ/tòa nhà mà mình được phân quyền quản lý." }
            ],
            businessRules: [
              "Completed Transactions Only: Báo cáo doanh thu CHỈ được tính dựa trên các bản ghi Payments có Status = 'Completed'. Các trạng thái Pending, Failed, hoặc UnderReview bị loại trừ hoàn toàn.",
              "Date Range Limitation: Khoảng thời gian truy vấn tối đa cho một lần gọi API (hiển thị JSON) là 1 năm (365 ngày) để tối ưu hiệu năng DB.",
              "Read-Only Transaction Isolation: Các truy vấn bắt buộc sử dụng @Transactional(readOnly = true) để tránh gây lock bảng Payments làm ảnh hưởng đến luồng thanh toán thời gian thực của hệ thống."
            ],
            dbExistingTables: ["Payments", "ParkingSessions"],
            dbNewTablesSql: "",
            dbRelationships: [
              "Sử dụng INNER JOIN giữa Payments và ParkingSessions thông qua SessionId."
            ],
            validationRules: [
              { field: "startDate", rule: "Định dạng yyyy-MM-dd. Bắt buộc truyền.", errorMessage: "INVALID_START_DATE" },
              { field: "endDate", rule: "Định dạng yyyy-MM-dd. Bắt buộc >= startDate.", errorMessage: "INVALID_END_DATE" },
              { field: "Range", rule: "endDate - startDate <= 365 ngày.", errorMessage: "DATE_RANGE_EXCEEDS_1_YEAR" },
              { field: "format", rule: "Chỉ nhận json hoặc excel. Mặc định là json.", errorMessage: "INVALID_FORMAT_TYPE" }
            ],
            securityRules: [
              "Role Validation: Kiểm tra quyền Manager và Admin.",
              "Data Isolation: Manager chỉ được phép Query các bản ghi Payments thuộc các ParkingSessions nằm trong khu vực/tòa nhà của họ."
            ],
            logEvents: [
              "Log khi có request xuất file Excel thành công (ghi rõ thời gian thực thi để giám sát hiệu năng)."
            ],
            noLogEvents: [
              "Nội dung chi tiết của báo cáo hoặc Token xác thực."
            ],
            integrationPoints: [
              { system: "Internal Library", responsibility: "Sử dụng thư viện Apache POI (chuẩn công nghiệp của hệ sinh thái Java/Spring Boot) để tạo và stream file Excel in-memory." }
            ],
            uiComponents: "Page: /admin/revenue-report. Components: Date Range Picker, Thẻ tổng quan (Tổng doanh thu), Biểu đồ hình tròn (phân bổ theo xe/phương thức thanh toán), Biểu đồ đường (Line chart xu hướng hàng ngày). Interactions: Nút 'Export to Excel' để tải file .xlsx kèm Loading Spinner.",
            uiStateSuccess: "When the query is successful, the dashboard renders overview metrics, pie charts for vehicles/methods, and a Daily trends line chart. Excel file download starts when format=excel is used.",
            endpoints: ["GET /api/support/reports/revenue"],
            ownerService: "Spring Boot Support API",
            apiContracts: [
              {
                id: "contract-revenue-report-json",
                name: "GET /api/support/reports/revenue (JSON)",
                content: `Method: GET\nPath: /api/support/reports/revenue?startDate=2026-07-01&endDate=2026-07-17&format=json\nHeaders:\n  Authorization: Bearer <token>\nResponse 200 OK:\n{\n  "success": true,\n  "data": {\n    "summary": {\n      "totalRevenue": 15500000.00,\n      "totalTransactions": 450\n    },\n    "revenueByMethod": [\n      { "method": "Online_PayOS", "amount": 10500000.00 },\n      { "method": "Cash", "amount": 5000000.00 }\n    ],\n    "revenueByVehicleType": [\n      { "vehicleType": "Car", "amount": 12000000.00 },\n      { "vehicleType": "Motorbike", "amount": 3500000.00 }\n    ],\n    "dailyTrends": [\n      { "date": "2026-07-01", "amount": 1200000.00 },\n      { "date": "2026-07-02", "amount": 950000.00 }\n    ]\n  }\n}`
              },
              {
                id: "contract-revenue-report-excel",
                name: "GET /api/support/reports/revenue (Excel)",
                content: `Method: GET\nPath: /api/support/reports/revenue?startDate=2026-07-01&endDate=2026-07-17&format=excel\nHeaders:\n  Authorization: Bearer <token>\nResponse 200 OK:\nHeaders:\n  Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\n  Content-Disposition: attachment; filename="Revenue_Report_20260701_20260717.xlsx"\nBody: [Binary Stream]`
              }
            ],
            testCases: [
              {
                id: "tc-revenue-report-manager-success",
                title: "Verify authorized client (Manager) can access Revenue Report successfully",
                type: "integration",
                precondition: "Client is authenticated with role: Manager",
                steps: [
                  "Authenticate user as Manager",
                  "Invoke endpoint: GET /api/support/reports/revenue?startDate=2026-07-01&endDate=2026-07-17&format=json"
                ],
                expectedResult: "Request succeeds and returns the correct JSON payload with summary, revenueByMethod, and dailyTrends.",
                status: "not_started"
              },
              {
                id: "tc-revenue-report-unauthorized",
                title: "Verify unauthorized role is rejected when accessing Revenue Report",
                type: "api",
                precondition: "User is anonymous or lacks required role (e.g., Staff)",
                steps: [
                  "Attempt to invoke endpoint: GET /api/support/reports/revenue without token/role"
                ],
                expectedResult: "Request is blocked and returns 401 Unauthorized or 403 Forbidden.",
                status: "not_started"
              },
              {
                id: "tc-revenue-report-excel-export",
                title: "Verify export endpoint returns correct spreadsheet binary type",
                type: "integration",
                precondition: "Client is authenticated with role: Admin",
                steps: [
                  "Invoke endpoint: GET /api/support/reports/revenue?startDate=2026-07-01&endDate=2026-07-17&format=excel"
                ],
                expectedResult: "Response code is 200 OK. Headers contain Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet. Body contains valid binary data.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-revenue-report-contract", content: "API contract is documented in this node.", checked: true },
              { id: "dc-revenue-report-roles", content: "Required clients/roles are assigned and data isolation logic is strictly defined.", checked: true },
              { id: "dc-revenue-report-business-rules", content: "Business rules (calculate based on 'Completed' payments only) are documented.", checked: true },
              { id: "dc-revenue-report-json", content: "Success response uses common API response format for JSON.", checked: true },
              { id: "dc-revenue-report-excel", content: "Excel export mechanism (format=excel) is fully defined.", checked: true },
              { id: "dc-revenue-report-error", content: "Error response is clear and does not leak sensitive data.", checked: true },
              { id: "dc-revenue-report-tests", content: "At least three test cases (including the binary export test) are defined.", checked: true },
              { id: "dc-revenue-report-markdown", content: "Feature can be exported as AI-readable Markdown.", checked: true }
            ],
            notes: "Before coding:\nInspect the existing Spring Boot Support API project structure.\nEnsure you add org.apache.poi:poi-ooxml to pom.xml or build.gradle if not already present for Excel generation.\nUse Spring Data JPA @Query or JdbcTemplate to perform heavy grouping (GROUP BY) directly at the database level rather than fetching all records into Java memory.\nEnsure the endpoint returns ResponseEntity<Resource> or streams directly to HttpServletResponse when format=excel is requested to avoid OutOfMemory (OOM) errors on large datasets.\nApply @Transactional(readOnly = true) to the service methods handling report generation.\nCheck existing tests before adding new ones, implement the Excel export test case properly."
          },
          {
            id: "leaf-rep-traffic",
            title: "Traffic Report",
            type: "leaf_feature",
            status: "in_progress",
            priority: "medium",
            clients: ["Manager", "Admin"],
            tags: ["reporting", "traffic", "excel", "analytics"],
            summary: "Cung cấp API để truy xuất và phân tích lưu lượng phương tiện ra/vào bãi đỗ xe trong một khoảng thời gian cụ thể.",
            objective: "Cung cấp API để truy xuất và phân tích lưu lượng phương tiện ra/vào bãi đỗ xe trong một khoảng thời gian cụ thể. Báo cáo này giúp ban quản lý nắm bắt được tổng số lượt xe luân chuyển, phân bổ theo loại phương tiện (Car, Motorbike, Bicycle), và đặc biệt là phân tích xu hướng lưu lượng theo từng khung giờ (Hourly Trends) để xác định các khung giờ cao điểm (Peak Hours), từ đó tối ưu hóa việc phân bổ nhân sự trực chốt.",
            inScope: [
              "Đếm tổng số lượt xe vào (Check-in) và lượt xe ra (Check-out) trong khoảng thời gian được chọn.",
              "Thống kê lưu lượng phân bổ theo từng loại phương tiện (VehicleType).",
              "Phân tích và nhóm dữ liệu theo từng giờ trong ngày để tìm ra khung giờ cao điểm.",
              "Hỗ trợ định dạng trả về JSON để Frontend vẽ biểu đồ.",
              "Hỗ trợ tham số format=excel để xuất báo cáo dạng file .xlsx."
            ],
            outOfScope: [
              "Truy xuất hình ảnh camera thời gian thực của các lượt xe ra/vào.",
              "Thao tác đóng/mở barie (thuộc về luồng xử lý Transactional của .NET Core)."
            ],
            permissions: [
              { role: "Admin", permission: "Read-Only - Được phép xem báo cáo lưu lượng của tất cả các bãi đỗ xe trong hệ thống." },
              { role: "Manager", permission: "Read-Only - Chỉ được phép xem báo cáo lưu lượng của bãi đỗ xe thuộc quyền quản lý." }
            ],
            businessRules: [
              "Data Source: Dữ liệu báo cáo được tổng hợp chủ yếu từ bảng ParkingSessions dựa trên CheckInTime và CheckOutTime.",
              "Date Range Limitation: Khoảng thời gian truy vấn startDate và endDate không được vượt quá 365 ngày để bảo vệ hiệu năng Database.",
              "Read-Only Transaction Isolation: Bắt buộc sử dụng @Transactional(readOnly = true) tại tầng Service để tối ưu bộ nhớ và không block các insert mới từ hệ thống IoT.",
              "Timezone Handling: Mọi tính toán gom nhóm theo giờ/ngày (GROUP BY) phải được xử lý cẩn thận theo múi giờ vận hành của bãi đỗ xe (mặc định là Asia/Ho_Chi_Minh hoặc UTC+7)."
            ],
            dbExistingTables: ["ParkingSessions"],
            dbNewTablesSql: "",
            dbRelationships: [],
            validationRules: [
              { field: "startDate", rule: "Định dạng yyyy-MM-dd. Bắt buộc truyền.", errorMessage: "INVALID_START_DATE" },
              { field: "endDate", rule: "Định dạng yyyy-MM-dd. Bắt buộc lớn hơn hoặc bằng startDate.", errorMessage: "INVALID_END_DATE" },
              { field: "Range", rule: "endDate - startDate <= 365 ngày.", errorMessage: "DATE_RANGE_EXCEEDS_MAX_LIMIT" },
              { field: "format", rule: "Chỉ nhận giá trị json hoặc excel. Mặc định là json.", errorMessage: "INVALID_FORMAT_TYPE" }
            ],
            securityRules: [
              "Role-Based Access: Chỉ chấp nhận JWT có claim role là Manager hoặc Admin.",
              "Tenant Isolation: Dữ liệu trả về cho Manager phải được tự động thêm điều kiện WHERE BuildingId = [Manager_Building_Id] ở mọi truy vấn SQL."
            ],
            logEvents: [
              "Ghi log khi hệ thống thực hiện xuất file Excel, bao gồm các thông số thời gian lọc và định danh người dùng."
            ],
            noLogEvents: [
              "Không log chi tiết biển số xe (License Plate) nếu không có sự cho phép đặc biệt. Không log token hoặc mật khẩu."
            ],
            integrationPoints: [
              { system: "Apache POI", responsibility: "Tích hợp thư viện Java Apache POI để khởi tạo, định dạng và stream workbook Excel (.xlsx) xuống Client." }
            ],
            uiComponents: "Page: /admin/traffic-report. Components: Bộ lọc khoảng thời gian (Date Range Picker); Biểu đồ đường (Line Chart) theo giờ tìm điểm Peak; Biểu đồ cột (Bar Chart) theo ngày; Biểu đồ tròn (Pie Chart) tỷ trọng phương tiện; Nút 'Export to Excel'.",
            uiStateSuccess: "When the query succeeds, the charts (line, bar, pie) render accurately on frontend. Excel download triggers automatically with binary stream.",
            endpoints: ["GET /api/support/reports/traffic"],
            ownerService: "Spring Boot Support API",
            apiContracts: [
              {
                id: "contract-traffic-report-json",
                name: "GET /api/support/reports/traffic (JSON)",
                content: `Method: GET\nPath: /api/support/reports/traffic?startDate=2026-07-01&endDate=2026-07-17&format=json\nHeaders:\n  Authorization: Bearer <token>\nResponse 200 OK:\n{\n  "success": true,\n  "data": {\n    "summary": {\n      "totalCheckIns": 1450,\n      "totalCheckOuts": 1420,\n      "currentlyActive": 30\n    },\n    "trafficByVehicleType": [\n      { "vehicleType": "Car", "checkIns": 450, "checkOuts": 440 },\n      { "vehicleType": "Motorbike", "checkIns": 900, "checkOuts": 880 },\n      { "vehicleType": "Bicycle", "checkIns": 100, "checkOuts": 100 }\n    ],\n    "hourlyPeakTrends": [\n      { "hourOfDay": 7, "avgCheckIns": 150, "avgCheckOuts": 20 },\n      { "hourOfDay": 8, "avgCheckIns": 200, "avgCheckOuts": 50 },\n      { "hourOfDay": 17, "avgCheckIns": 30, "avgCheckOuts": 220 }\n    ],\n    "dailyTraffic": [\n      { "date": "2026-07-01", "checkIns": 120, "checkOuts": 115 },\n      { "date": "2026-07-02", "checkIns": 135, "checkOuts": 135 }\n    ]\n  }\n}`
              },
              {
                id: "contract-traffic-report-excel",
                name: "GET /api/support/reports/traffic (Excel)",
                content: `Method: GET\nPath: /api/support/reports/traffic?startDate=2026-07-01&endDate=2026-07-17&format=excel\nHeaders:\n  Authorization: Bearer <token>\nResponse 200 OK:\nHeaders:\n  Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\n  Content-Disposition: attachment; filename="Traffic_Report_20260701_20260717.xlsx"\nBody: [Binary Stream]`
              }
            ],
            testCases: [
              {
                id: "tc-traffic-report-manager-success",
                title: "Verify authorized client (Manager) can access Traffic Report successfully",
                type: "integration",
                precondition: "Client is authenticated with role: Manager",
                steps: [
                  "Authenticate user as Manager",
                  "Invoke endpoint: GET /api/support/reports/traffic?startDate=2026-07-01&endDate=2026-07-02&format=json"
                ],
                expectedResult: "Request succeeds and returns the correct JSON payload containing summary, trafficByVehicleType, hourlyPeakTrends.",
                status: "not_started"
              },
              {
                id: "tc-traffic-report-unauthorized",
                title: "Verify unauthorized role is rejected when accessing Traffic Report",
                type: "api",
                precondition: "User is anonymous or lacks required role (e.g. Staff)",
                steps: [
                  "Attempt to invoke endpoint: GET /api/support/reports/traffic without token/role"
                ],
                expectedResult: "Request is blocked and returns 401 Unauthorized or 403 Forbidden.",
                status: "not_started"
              },
              {
                id: "tc-traffic-report-excel-export",
                title: "Verify export endpoint returns correct spreadsheet binary type",
                type: "integration",
                precondition: "Client is authenticated with role: Admin",
                steps: [
                  "Invoke endpoint: GET /api/support/reports/traffic?startDate=2026-07-01&endDate=2026-07-02&format=excel"
                ],
                expectedResult: "Response code is 200 OK. Headers contain Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-traffic-report-contract", content: "API contract is documented in this node, including json and excel output formats.", checked: true },
              { id: "dc-traffic-report-roles", content: "Required clients/roles (Admin, Manager) are assigned and tenant isolation is defined.", checked: true },
              { id: "dc-traffic-report-business-rules", content: "Business rules regarding Date Range limitations and timezone handling are visible in AI export.", checked: true },
              { id: "dc-traffic-report-json", content: "Success response uses common API response format.", checked: true },
              { id: "dc-traffic-report-error", content: "Error response is clear and does not leak sensitive data.", checked: true },
              { id: "dc-traffic-report-tests", content: "At least three test cases are defined, explicitly covering the Excel export test.", checked: true },
              { id: "dc-traffic-report-markdown", content: "Feature can be exported as AI-readable Markdown.", checked: true }
            ],
            notes: "Before coding:\nInspect the existing project structure within the Spring Boot Support API.\nReuse the Excel generation abstraction (e.g., Apache POI wrapper utilities) implemented previously in the Revenue Report if applicable.\nUse Spring Data @Query with native SQL or JPQL to execute COUNT, GROUP BY operations for the hourlyPeakTrends directly in PostgreSQL, avoiding fetching massive amounts of raw ParkingSessions rows into application memory.\nApply @Transactional(readOnly = true) to all read operations in the service layer.\nStream the .xlsx response directly via the HttpServletResponse output stream to prevent OutOfMemory (OOM) issues on large data ranges.\nCheck existing tests before adding new ones, implement the specified integration tests."
          },
          {
            id: "leaf-rep-occupancy",
            title: "Occupancy Report",
            type: "leaf_feature",
            status: "in_progress",
            priority: "medium",
            clients: ["Manager", "Admin"],
            tags: ["reporting", "occupancy", "excel", "analytics"],
            summary: "Cung cấp API phân tích hiệu suất sử dụng vị trí đỗ (Occupancy Rate) thời gian thực và lịch sử biến động mật độ đỗ xe theo ngày/giờ.",
            objective: "Cung cấp API phân tích hiệu suất sử dụng vị trí đỗ (Occupancy Rate) thời gian thực và lịch sử biến động mật độ đỗ xe theo ngày/giờ. API hỗ trợ trả về dữ liệu cấu trúc JSON phục vụ vẽ biểu đồ trực quan (mật độ hiện tại, xu hướng lấp đầy) và xuất file báo cáo Excel chi tiết phục vụ cho việc lập kế hoạch vận hành và quy hoạch bãi đỗ.",
            inScope: [
              "Tính toán các chỉ số sử dụng mặt bằng thời gian thực: Tổng số chỗ đỗ, số chỗ đang trống, số chỗ đang đỗ và tỷ lệ lấp đầy hiện tại (Real-time Occupancy Rate).",
              "Thống kê hiệu suất sử dụng chỗ đỗ lịch sử (Historical Occupancy) theo khoảng thời gian được chọn (startDate đến endDate).",
              "Phân tích mật độ lấp đầy trung bình và mật độ lấp đầy đỉnh điểm (Peak Occupancy) theo từng khung giờ trong ngày để phát hiện trạng thái quá tải.",
              "Phân loại mật độ sử dụng theo phân khu hoặc loại phương tiện (Car, Motorbike).",
              "Hỗ trợ xuất dữ liệu thô ra file Excel (.xlsx) thông qua tham số format=excel."
            ],
            outOfScope: [
              "Thao tác trực tiếp giữ chỗ đỗ (Reservation) hoặc thay đổi sơ đồ bãi đỗ (Layout).",
              "Tích hợp hệ thống cảm biến hồng ngoại vật lý trực tiếp (API chỉ đọc trạng thái gián tiếp qua logic của ParkingSessions và bảng sơ đồ ParkingSlots)."
            ],
            permissions: [
              { role: "Admin", permission: "Xem báo cáo hiệu suất lấp đầy của toàn bộ hệ thống hoặc lọc linh hoạt theo từng tòa nhà." },
              { role: "Manager", permission: "Chỉ xem được báo cáo hiệu suất của tòa nhà/bãi đỗ cụ thể được phân quyền quản lý." }
            ],
            businessRules: [
              "Formula Rules - Real-time Occupancy Rate: Occupancy Rate = (Active Sessions / Total Slots) * 100%",
              "Formula Rules - Peak Occupancy Rate: Là giá trị lấp đầy lớn nhất được ghi nhận tại bất kỳ thời điểm nào trong ngày đó.",
              "Date Range Limitation: Khoảng thời gian truy vấn lịch sử tối đa cho phép là 90 ngày để tránh thực hiện các phép toán phức tạp trên lượng dữ liệu quá lớn.",
              "Read-Only Transaction Isolation: Bắt buộc sử dụng @Transactional(readOnly = true) tại lớp Service của Spring Boot để tối ưu hóa tài nguyên kết nối cơ sở dữ liệu."
            ],
            dbExistingTables: ["Buildings", "ParkingLots", "ParkingSessions", "ParkingSlots"],
            dbNewTablesSql: "",
            dbRelationships: [],
            validationRules: [
              { field: "startDate", rule: "Định dạng yyyy-MM-dd. Bắt buộc truyền nếu muốn xem historical trends.", errorMessage: "INVALID_START_DATE" },
              { field: "endDate", rule: "Định dạng yyyy-MM-dd. Bắt buộc >= startDate.", errorMessage: "INVALID_END_DATE" },
              { field: "Range", rule: "endDate - startDate <= 90 ngày.", errorMessage: "DATE_RANGE_EXCEEDS_90_DAYS" },
              { field: "format", rule: "Chỉ nhận giá trị json hoặc excel. Mặc định là json.", errorMessage: "INVALID_FORMAT_TYPE" }
            ],
            securityRules: [
              "Role Validation: Chỉ chấp nhận JWT có claim role là Manager hoặc Admin.",
              "Tenant Isolation: Nếu client có quyền Manager, hệ thống tự động chèn thêm điều kiện lọc BuildingId = [Manager_Building_Id] lấy trực tiếp từ JWT Claims của người dùng để cô lập dữ liệu."
            ],
            logEvents: [
              "Log các hành động truy vấn báo cáo mật độ, đặc biệt là hoạt động xuất file Excel (ghi lại bộ lọc thời gian, người thực hiện và số giây xử lý truy vấn)."
            ],
            noLogEvents: [
              "Không lưu trữ token bảo mật hay bất kỳ dữ liệu nhạy cảm nào vào log file."
            ],
            integrationPoints: [
              { system: "Apache POI", responsibility: "Sử dụng thư viện Java Apache POI để khởi tạo, dựng style ô dữ liệu (Header xanh, dữ liệu lưới, các ô tỷ lệ phần trăm được định dạng %) và stream file Excel trực tiếp về Client." }
            ],
            uiComponents: "Page: /admin/occupancy-report. Components: Radial Gauge/Donut Chart hiển thị tỷ lệ lấp đầy hiện tại kèm màu cảnh báo; Area Chart/Multi-line Chart cho historical trends (average vs peak); Date Range Picker + Export button.",
            uiStateSuccess: "When occupancy data is fetched successfully, it renders visual gauges and historical area charts on the frontend. Under format=excel, it streams the .xlsx file directly.",
            endpoints: ["GET /api/support/reports/occupancy"],
            ownerService: "Spring Boot Support API",
            apiContracts: [
              {
                id: "contract-occupancy-report-json",
                name: "GET /api/support/reports/occupancy (JSON)",
                content: `Method: GET\nPath: /api/support/reports/occupancy?startDate=2026-07-01&endDate=2026-07-17&format=json\nHeaders:\n  Authorization: Bearer <token>\nResponse 200 OK:\n{\n  "success": true,\n  "data": {\n    "realTimeStatus": {\n      "totalCapacity": 1000,\n      "currentlyOccupied": 750,\n      "currentlyAvailable": 250,\n      "currentOccupancyRatePercent": 75.0\n    },\n    "occupancyByVehicleType": [\n      { "vehicleType": "Car", "totalCapacity": 400, "occupied": 350, "ratePercent": 87.5 },\n      { "vehicleType": "Motorbike", "totalCapacity": 600, "occupied": 400, "ratePercent": 66.67 }\n    ],\n    "historicalTrends": [\n      {\n        "date": "2026-07-01",\n        "averageOccupancyRatePercent": 65.2,\n        "peakOccupancyRatePercent": 88.0,\n        "peakHour": 9\n      },\n      {\n        "date": "2026-07-02",\n        "averageOccupancyRatePercent": 68.0,\n        "peakOccupancyRatePercent": 92.5,\n        "peakHour": 14\n      }\n    ]\n  }\n}`
              },
              {
                id: "contract-occupancy-report-excel",
                name: "GET /api/support/reports/occupancy (Excel)",
                content: `Method: GET\nPath: /api/support/reports/occupancy?startDate=2026-07-01&endDate=2026-07-17&format=excel\nHeaders:\n  Authorization: Bearer <token>\nResponse 200 OK:\nHeaders:\n  Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\n  Content-Disposition: attachment; filename="Occupancy_Report_20260701_20260717.xlsx"\nBody: [Binary Stream]`
              }
            ],
            testCases: [
              {
                id: "tc-occupancy-report-manager-success",
                title: "Verify authorized client (Manager) can access Occupancy Report successfully",
                type: "integration",
                precondition: "Client is authenticated with role: Manager",
                steps: [
                  "Authenticate user as Manager",
                  "Invoke endpoint: GET /api/support/reports/occupancy?startDate=2026-07-01&endDate=2026-07-10&format=json"
                ],
                expectedResult: "Request succeeds and returns the correct payload structure (realTimeStatus, occupancyByVehicleType, historicalTrends).",
                status: "not_started"
              },
              {
                id: "tc-occupancy-report-unauthorized",
                title: "Verify unauthorized role is rejected when accessing Occupancy Report",
                type: "api",
                precondition: "User is anonymous or has role: Staff",
                steps: [
                  "Attempt to invoke endpoint: GET /api/support/reports/occupancy without token"
                ],
                expectedResult: "Request is blocked with 401 Unauthorized or 403 Forbidden.",
                status: "not_started"
              },
              {
                id: "tc-occupancy-report-excel-export",
                title: "Verify export endpoint returns correct spreadsheet binary type",
                type: "integration",
                precondition: "Client is authenticated with role: Admin",
                steps: [
                  "Invoke endpoint: GET /api/support/reports/occupancy?startDate=2026-07-01&endDate=2026-07-10&format=excel"
                ],
                expectedResult: "Response code is 200 OK. Content-Type header must be application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-occupancy-report-contract", content: "API contract is documented in this node (including both json and excel formats).", checked: true },
              { id: "dc-occupancy-report-roles", content: "Access controls and data isolation rules for Managers are strictly defined.", checked: true },
              { id: "dc-occupancy-report-business-rules", content: "Business rules for calculations (Real-time and Peak Occupancy Rate) are clearly documented.", checked: true },
              { id: "dc-occupancy-report-error-handling", content: "Error handling is standardized and does not leak trace logs.", checked: true },
              { id: "dc-occupancy-report-tests", content: "All three defined test cases (including binary excel spreadsheet validation) are fully implemented and pass successfully.", checked: true },
              { id: "dc-occupancy-report-markdown", content: "Feature can be exported as AI-readable Markdown.", checked: true }
            ],
            notes: "Before coding:\nInspect the existing project structure within the Spring Boot Support API.\nReuse existing helper classes for Excel export (Apache POI wrapper) developed in previous reporting tasks (Revenue Report / Traffic Report).\nFormulate highly optimized native SQL queries or database views for calculating historical peak occupancy to prevent massive loops or heap allocation inside JVM.\nSet @Transactional(readOnly = true) for all database operations in this reporting flow.\nStream the Excel file directly using HttpServletResponse output stream instead of compiling the entire document in memory before sending.\nWrite specific unit and integration tests according to the defined automated test cases. Do not mark this task as complete until all tests pass successfully."
          },
          {
            id: "leaf-rep-card",
            title: "Card Session Report",
            type: "leaf_feature",
            status: "in_progress",
            priority: "medium",
            clients: ["Manager", "Admin"],
            tags: ["reporting", "cards", "excel", "analytics"],
            summary: "Cung cấp API để truy xuất, thống kê và phân tích chi tiết các phiên đỗ xe (Card Sessions) dựa trên lịch sử quẹt thẻ.",
            objective: "Cung cấp API để truy xuất, thống kê và phân tích chi tiết các phiên đỗ xe (Card Sessions) dựa trên lịch sử quẹt thẻ. Báo cáo này giúp ban quản lý giám sát vòng đời của một phiên gửi xe từ lúc xe vào (Check-in) đến lúc xe ra (Check-out), phát hiện các phiên đỗ xe bất thường (đỗ quá lâu, thẻ bị báo mất) và rà soát các mã đặt chỗ (Reservations) đã hết hạn mà khách không đến.",
            inScope: [
              "Truy xuất danh sách các phiên đỗ xe trong một khoảng thời gian nhất định (startDate, endDate).",
              "Hỗ trợ bộ lọc mở rộng theo trạng thái phiên đỗ xe (Active, Completed, Lost_Card, Expired_Reservation) hoặc lọc theo mã sessionToken.",
              "Thống kê các trạng thái chuyển đổi (State Transitions) của thẻ.",
              "Hỗ trợ trả về định dạng dữ liệu JSON cho giao diện hiển thị.",
              "Hỗ trợ xuất dữ liệu ra tệp Excel (.xlsx) để lưu trữ và đối soát."
            ],
            outOfScope: [
              "Cập nhật, chỉnh sửa hoặc xóa trạng thái của thẻ/phiên đỗ xe (thuộc phân hệ Transactional API của .NET Core).",
              "Tích hợp trực tiếp với phần cứng đầu đọc thẻ RFID."
            ],
            permissions: [
              { role: "Admin", permission: "Xem báo cáo phiên thẻ trên toàn bộ các tòa nhà/bãi đỗ trong hệ thống." },
              { role: "Manager", permission: "Chỉ xem báo cáo phiên thẻ của tòa nhà/bãi đỗ thuộc quyền quản lý." }
            ],
            businessRules: [
              "Standard Lifecycle: 1. Reserved (Tùy chọn: quá hạn check-in -> Expired_Reservation) -> 2. Active (quẹt cổng vào check-in, thanh toán: Pending) -> 3. Completed (Check-out và thanh toán thành công) OR Lost_Card (báo mất thẻ khi đang Active).",
              "Edge Case Handling - Overstay: Các phiên có trạng thái Active liên tục trên 24 giờ sẽ được gắn cờ isAbnormal = true trong báo cáo.",
              "Edge Case Handling - Session Token Validation: Nếu API nhận được truy vấn yêu cầu xem chi tiết một sessionToken hoặc mã reservationToken đã bị hệ thống đánh dấu là hết hạn hoặc không hợp lệ, API phải trả về lỗi Validation.",
              "Read-Only Transaction Isolation: Bắt buộc sử dụng @Transactional(readOnly = true) để tối ưu hóa truy vấn."
            ],
            dbExistingTables: ["ParkingSessions", "Cards", "Reservations"],
            dbNewTablesSql: "",
            dbRelationships: [
              "Sử dụng LEFT JOIN giữa ParkingSessions, Cards và Reservations."
            ],
            validationRules: [
              { field: "startDate", rule: "Định dạng yyyy-MM-dd.", errorMessage: "INVALID_START_DATE" },
              { field: "endDate", rule: "Định dạng yyyy-MM-dd. Phải >= startDate.", errorMessage: "INVALID_END_DATE" },
              { field: "format", rule: "Chỉ nhận json hoặc excel.", errorMessage: "INVALID_FORMAT_TYPE" },
              { field: "sessionToken", rule: "(Optional) Nếu truyền vào, token phải còn hiệu lực truy vấn.", errorMessage: "TOKEN_EXPIRED" }
            ],
            securityRules: [
              "Role Validation: Kiểm tra role Manager và Admin.",
              "Data Isolation (Tenant): Các truy vấn của Manager phải tự động chèn thêm điều kiện BuildingId = [User_Building_Id]."
            ],
            logEvents: [
              "Tham số truy vấn (Date range, Filters, Format) và thời gian thực thi (Duration) của API.",
              "Cảnh báo (Warn) trong log nếu phát hiện cố tình truy vấn bằng sessionToken đã hết hạn."
            ],
            noLogEvents: [
              "Token người dùng, mật khẩu."
            ],
            integrationPoints: [
              { system: "Apache POI Library", responsibility: "Sử dụng để thao tác và xuất stream nhị phân (Binary stream) ra định dạng file .xlsx." }
            ],
            uiComponents: "Page: /admin/reports/card-sessions. Components: Bảng dữ liệu có phân trang; Status Badges: Active (Xanh lá), Completed (Xanh dương), Lost_Card (Đỏ), Expired (Xám); Nút 'Export to Excel'; Highlight màu vàng nhạt cho hàng có isAbnormal = true.",
            uiStateSuccess: "The data table displays all relevant card sessions with color-coded status badges. Abnormal rows are highlighted. Under format=excel, the browser triggers a file download.",
            endpoints: ["GET /api/support/reports/card-session"],
            ownerService: "Spring Boot Support API",
            apiContracts: [
              {
                id: "contract-card-session-report-json",
                name: "GET /api/support/reports/card-session (JSON)",
                content: `Method: GET\nPath: /api/support/reports/card-session?startDate=2026-07-01&endDate=2026-07-17&status=Active&format=json\nHeaders:\n  Authorization: Bearer <token>\nResponse 200 OK:\n{\n  "success": true,\n  "data": {\n    "summary": {\n      "totalSessions": 1250,\n      "abnormalSessions": 15,\n      "expiredReservations": 8\n    },\n    "sessions": [\n      {\n        "sessionId": "550e8400-e29b-41d4-a716-446655440000",\n        "cardNumber": "RFID-998877",\n        "vehicleType": "Car",\n        "licensePlate": "51G-123.45",\n        "checkInTime": "2026-07-16T08:30:00Z",\n        "checkOutTime": null,\n        "status": "Active",\n        "isAbnormal": true,\n        "durationHours": 33.5\n      }\n    ]\n  }\n}`
              },
              {
                id: "contract-card-session-report-error",
                name: "GET /api/support/reports/card-session (Expired Token Error)",
                content: `Method: GET\nPath: /api/support/reports/card-session?sessionToken=EXPIRED_TOKEN_123\nHeaders:\n  Authorization: Bearer <token>\nResponse 400 Bad Request:\n{\n  "success": false,\n  "error": "VALIDATION_ERROR",\n  "message": "The provided reservation or session token has expired."\n}`
              },
              {
                id: "contract-card-session-report-excel",
                name: "GET /api/support/reports/card-session (Excel)",
                content: `Method: GET\nPath: /api/support/reports/card-session?startDate=2026-07-01&endDate=2026-07-17&format=excel\nHeaders:\n  Authorization: Bearer <token>\nResponse 200 OK:\nHeaders:\n  Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\n  Content-Disposition: attachment; filename="Card_Session_Report.xlsx"\nBody: [Binary Stream]`
              }
            ],
            testCases: [
              {
                id: "tc-card-session-manager-success",
                title: "Verify authorized client (Manager) can access Card Session Report successfully",
                type: "integration",
                precondition: "Client is authenticated with role: Manager",
                steps: [
                  "Authenticate user as Manager",
                  "Invoke endpoint: GET /api/support/reports/card-session?startDate=2026-07-01&endDate=2026-07-02&format=json"
                ],
                expectedResult: "Request succeeds and returns correct payload with summary and sessions array.",
                status: "not_started"
              },
              {
                id: "tc-card-session-unauthorized",
                title: "Verify unauthorized role is rejected when accessing Card Session Report",
                type: "api",
                precondition: "User is anonymous or lacks required role (e.g., Staff)",
                steps: [
                  "Attempt to invoke endpoint: GET /api/support/reports/card-session without token/role"
                ],
                expectedResult: "Request is blocked and returns 401 Unauthorized or 403 Forbidden.",
                status: "not_started"
              },
              {
                id: "tc-card-session-expired-token",
                title: "Verify request with expired reservation or session token is rejected",
                type: "integration",
                precondition: "User has valid Manager token but provides an expired sessionToken in query string.",
                steps: [
                  "Invoke endpoint: GET /api/support/reports/card-session?sessionToken=EXPIRED_123"
                ],
                expectedResult: "System returns HTTP 400 validation error stating the resource/token has expired.",
                status: "not_started"
              },
              {
                id: "tc-card-session-excel-export",
                title: "Verify export endpoint returns correct spreadsheet binary type",
                type: "integration",
                precondition: "Client authenticated as Admin.",
                steps: [
                  "Invoke endpoint: GET /api/support/reports/card-session?format=excel"
                ],
                expectedResult: "Response code is 200 OK. Response content-type is application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-card-session-contract", content: "API contract is documented in this node.", checked: true },
              { id: "dc-card-session-roles", content: "Required clients/roles are assigned.", checked: true },
              { id: "dc-card-session-rules", content: "Business rules and inherited rules are visible in AI export.", checked: true },
              { id: "dc-card-session-json", content: "Success response uses common API response format where applicable.", checked: true },
              { id: "dc-card-session-error", content: "Error response is clear and does not leak sensitive data.", checked: true },
              { id: "dc-card-session-tests", content: "All 4 required test cases are defined exactly as requested.", checked: true },
              { id: "dc-card-session-markdown", content: "Feature can be exported as AI-readable Markdown.", checked: true },
              { id: "dc-card-session-edge-cases", content: "Edge cases are documented (e.g., Abnormal/Overstay sessions).", checked: true },
              { id: "dc-card-session-transitions", content: "Payment/session/reservation state transition is fully documented.", checked: true }
            ],
            notes: "Before coding:\nInspect the existing Spring Boot Support API project structure.\nFormulate JPA/Hibernate or Native SQL queries to fetch ParkingSessions joined with Cards and Reservations. Avoid the N+1 query problem.\nUse the Apache POI implementation from previous reports to support the format=excel requirement. Stream the output via HttpServletResponse.\nEnsure the validation block explicitly checks the validity of sessionToken (if provided) and throws a structured Validation Exception if it is expired.\nApply @Transactional(readOnly = true) to all repository and service methods.\nCheck existing tests before adding new ones. Implement all 4 test cases listed.\nReport changed files, reason, verification, and remaining risks. Do not mark this task as complete unless all tests pass."
          },
          {
            id: "leaf-rep-export",
            title: "Generic Report Export",
            type: "leaf_feature",
            status: "in_progress",
            priority: "high",
            clients: ["Manager", "Admin"],
            tags: ["reporting", "export", "strategy-pattern", "excel"],
            summary: "Cung cấp một API dùng chung (Unified Endpoint) để xử lý mọi yêu cầu xuất file báo cáo (chủ yếu là Excel .xlsx) của toàn hệ thống.",
            objective: "Cung cấp một API dùng chung (Unified Endpoint) để xử lý mọi yêu cầu xuất file báo cáo (chủ yếu là Excel .xlsx) của toàn hệ thống. API này hoạt động như một Factory/Strategy Route, tiếp nhận tham số reportType, nạp cấu hình tương ứng, truy vấn dữ liệu theo phân quyền, dựng file thông qua Apache POI (SXSSFWorkbook) và stream trực tiếp về client. Giúp chuẩn hóa định dạng báo cáo và giảm thiểu code trùng lặp (DRY).",
            inScope: [
              "Áp dụng Strategy Pattern để điều hướng xử lý logic lấy dữ liệu dựa vào tham số reportType (ví dụ: REVENUE, OCCUPANCY, CARD_SESSION, AUDIT_LOG).",
              "Xây dựng lõi xuất Excel dùng chung (Generic Excel Builder) hỗ trợ: tự động tạo Header, đổ dữ liệu theo dạng lưới (Grid), tự động điều chỉnh độ rộng cột (Auto-size) và định dạng dữ liệu (tiền tệ, ngày tháng, phần trăm).",
              "Ghi luồng trực tiếp (Streaming) ra HttpServletResponse để tránh tràn bộ nhớ (OutOfMemoryError) khi xuất hàng trăm nghìn dòng."
            ],
            outOfScope: [
              "Xuất file định dạng PDF hoặc CSV (Chỉ tập trung vào .xlsx trong scope này).",
              "Lưu trữ các file đã xuất lên Cloud Storage (S3/GCS). File được tạo on-the-fly và đẩy thẳng về client."
            ],
            permissions: [
              { role: "Admin", permission: "Execute - Có thể xuất mọi loại báo cáo của toàn bộ hệ thống." },
              { role: "Manager", permission: "Execute - Có thể xuất các báo cáo vận hành, nhưng dữ liệu bên trong tự động bị giới hạn (cô lập) theo BuildingId mà Manager đó quản lý." }
            ],
            businessRules: [
              "Strategy Routing: Lỗi HTTP 400 (Bad Request) phải được ném ra ngay lập tức nếu reportType không được hỗ trợ.",
              "Memory Protection: Bắt buộc sử dụng SXSSFWorkbook thay vì XSSFWorkbook thông thường để flush dữ liệu xuống ổ đĩa tạm liên tục, giữ RAM ổn định.",
              "Timeout & Pagination: Dữ liệu kéo từ Database lên để nhét vào Excel phải được chia thành các chunk/page (ví dụ: mỗi lần query 5000 records) để tránh khóa DB quá lâu hoặc làm nổ Heap Memory."
            ],
            dbExistingTables: [],
            dbNewTablesSql: "",
            dbRelationships: [
              "Tuân theo quy tắc quan hệ của từng loại báo cáo cụ thể.",
              "Re-use lại toàn bộ các Repository/View đã được viết ở các tính năng báo cáo thành phần (Operational Analytics / Financial Reports). Report Export Service sẽ đóng vai trò gọi các service con để lấy List<DTO> chung chung."
            ],
            validationRules: [
              { field: "reportType", rule: "Bắt buộc. Phải nằm trong danh sách Enum cấu hình sẵn (ví dụ: REVENUE, OCCUPANCY, CARD_SESSION, AUDIT_LOG).", errorMessage: "INVALID_REPORT_TYPE" },
              { field: "startDate", rule: "Định dạng yyyy-MM-dd. Tùy thuộc yêu cầu của từng Strategy.", errorMessage: "INVALID_START_DATE" },
              { field: "endDate", rule: "Định dạng yyyy-MM-dd. Phải >= startDate.", errorMessage: "INVALID_END_DATE" }
            ],
            securityRules: [
              "Xác thực token chặt chẽ.",
              "Phân quyền động: Nếu reportType là AUDIT_LOG, hệ thống phải chặn lại và kiểm tra xem Role có phải là Admin hay không, trả về 403 Forbidden nếu là Manager."
            ],
            logEvents: [
              "Tham số truy vấn: reportType, khoảng thời gian, người xuất báo cáo, và dung lượng/thời gian thực thi (miliseconds)."
            ],
            noLogEvents: [
              "Không log token hoặc dữ liệu chi tiết có bên trong file Excel."
            ],
            integrationPoints: [
              { system: "Apache POI (SXSSFWorkbook)", responsibility: "Cấu hình cơ chế streaming với window size hợp lý (ví dụ: new SXSSFWorkbook(100) – giữ lại 100 row trong RAM)." }
            ],
            uiComponents: "Tích hợp dưới dạng Helper/Util trên toàn bộ các trang báo cáo của Admin Dashboard. Click 'Export Excel' gọi chung về API này kèm reportType tương ứng.",
            uiStateSuccess: "Shows loading spinner and disables button to avoid spam. Triggers browser download once file streaming is complete.",
            endpoints: ["GET /api/support/reports/export"],
            ownerService: "Spring Boot Support API",
            apiContracts: [
              {
                id: "contract-generic-report-export-success",
                name: "GET /api/support/reports/export (Success)",
                content: `Method: GET\nPath: /api/support/reports/export?reportType=CARD_SESSION&startDate=2026-07-01&endDate=2026-07-15\nHeaders:\n  Authorization: Bearer <token>\nResponse 200 OK:\nHeaders:\n  Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\n  Content-Disposition: attachment; filename="CARD_SESSION_Report_20260701_20260715.xlsx"\nBody: [Binary Stream]`
              },
              {
                id: "contract-generic-report-export-invalid-type",
                name: "GET /api/support/reports/export (Invalid Report Type Error)",
                content: `Method: GET\nPath: /api/support/reports/export?reportType=UNKNOWN_TYPE\nHeaders:\n  Authorization: Bearer <token>\nResponse 400 Bad Request:\n{\n  "success": false,\n  "error": "INVALID_REPORT_TYPE",\n  "message": "The requested report type is not supported."\n}`
              }
            ],
            testCases: [
              {
                id: "tc-generic-report-export-success",
                title: "Verify authorized client can access Generic Report Export with valid report type",
                type: "integration",
                precondition: "Client is authenticated as Manager.",
                steps: [
                  "Authenticate user as Manager.",
                  "Invoke endpoint: GET /api/support/reports/export?reportType=OCCUPANCY&startDate=2026-07-01&endDate=2026-07-10"
                ],
                expectedResult: "Response code is 200 OK. Response content-type is application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.",
                status: "not_started"
              },
              {
                id: "tc-generic-report-export-invalid-type",
                title: "Verify rejection for unsupported or invalid reportType",
                type: "api",
                precondition: "Client is authenticated.",
                steps: [
                  "Invoke endpoint: GET /api/support/reports/export?reportType=INVALID_BLAH"
                ],
                expectedResult: "Returns clear JSON error message INVALID_REPORT_TYPE (400 Bad Request).",
                status: "not_started"
              },
              {
                id: "tc-generic-report-export-role-restriction",
                title: "Verify role-based restriction on specific report types",
                type: "api",
                precondition: "User is authenticated as Manager.",
                steps: [
                  "Invoke endpoint: GET /api/support/reports/export?reportType=AUDIT_LOG"
                ],
                expectedResult: "Manager is blocked from exporting Admin-level reports (HTTP 403 Forbidden).",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-generic-report-contract", content: "API contract is documented in this node, specifically handling the generic reportType query parameter.", checked: true },
              { id: "dc-generic-report-roles", content: "Required clients/roles are assigned with dynamic restriction rules.", checked: true },
              { id: "dc-generic-report-strategy", content: "Architecture concept (Strategy Pattern) and performance rules (SXSSFWorkbook) are clearly defined.", checked: true },
              { id: "dc-generic-report-output-handling", content: "Error handling distinguishes between Binary output (Success) and JSON output (Error).", checked: true },
              { id: "dc-generic-report-tests", content: "Three automated test cases covering valid, invalid types, and permission restrictions are defined.", checked: true },
              { id: "dc-generic-report-markdown", content: "Feature can be exported as AI-readable Markdown.", checked: true }
            ],
            notes: "Before coding:\nImplement an interface ReportExportStrategy with a method boolean supports(String reportType) and void export(HttpServletResponse response, ExportCriteria criteria).\nCreate concrete implementations of this strategy for each report type (e.g., OccupancyExportStrategy, CardSessionExportStrategy).\nUse Spring's dependency injection (List<ReportExportStrategy>) in the main ReportExportService to iterate and find the matching strategy.\nImplement a utility class ExcelHelper wrapping SXSSFWorkbook to standardize header creation, cell styling, and data population.\nIn the Controller, ensure the HttpServletResponse is properly configured with headers Content-Disposition and Content-Type before the strategy writes to the output stream.\nCheck existing tests before adding new ones. Run all tests. Do not mark this task as complete unless all acceptance criteria and automated tests pass."
          },
          {
            id: "leaf-rep-audit",
            title: "Audit Log Export",
            type: "leaf_feature",
            status: "in_progress",
            priority: "medium",
            clients: ["Admin"],
            tags: ["reporting", "audit-logs", "excel", "security"],
            summary: "Cung cấp API cho phép quản trị viên cấp cao (Admin) xuất nhật ký hệ thống (Audit Logs) ra file Excel (.xlsx).",
            objective: "Cung cấp API cho phép quản trị viên cấp cao (Admin) xuất nhật ký hệ thống (Audit Logs) ra file Excel (.xlsx). Nhật ký này lưu vết toàn bộ các thao tác thay đổi dữ liệu (mutating operations) do Staff, Manager hoặc Admin thực hiện (ví dụ: thay đổi bảng giá, đóng sự vụ mất thẻ, phê duyệt ngoại lệ). Báo cáo giúp truy vết trách nhiệm (accountability), đảm bảo tính minh bạch và phục vụ cho công tác kiểm toán hệ thống (System Auditing).",
            inScope: [
              "Truy xuất dữ liệu từ schema Audit chuyên dụng.",
              "Hỗ trợ bộ lọc theo khoảng thời gian (startDate, endDate), theo người thực hiện (userId/username), hoặc theo hành động (actionType - CREATE, UPDATE, DELETE).",
              "Stream trực tiếp dữ liệu truy vấn được từ database thành định dạng file Excel (.xlsx) trả về cho Client.",
              "Đảm bảo tính toàn vẹn và không cho phép thay đổi dữ liệu Audit Log dưới bất kỳ hình thức nào."
            ],
            outOfScope: [
              "Hiển thị danh sách Audit Log trực tiếp trên UI (Nếu cần, tính năng đó sẽ nằm ở một API dạng Paginated List khác. API này chỉ focus vào Export).",
              "Các thao tác Read (GET) thông thường không làm thay đổi trạng thái hệ thống sẽ không nằm trong Audit Log."
            ],
            permissions: [
              { role: "Admin", permission: "Read-Only - Chỉ Admin (System Administrator) mới có quyền xuất và xem toàn bộ nhật ký kiểm toán của toàn hệ thống. Manager tuyệt đối không có quyền này để tránh việc tự bao che lỗi." }
            ],
            businessRules: [
              "Immutability: Bảng dữ liệu Audit Log là bất biến (Append-only). Spring Boot API chỉ được phép thực hiện thao tác Read-Only.",
              "Date Range Limit: Quá trình xuất file Excel có thể gây tốn rất nhiều tài nguyên. Bắt buộc giới hạn khoảng cách giữa endDate và startDate không được vượt quá 30 ngày.",
              "Stream Processing: Tuyệt đối không dùng List<AuditLog> để nạp toàn bộ kết quả vào Java Heap Memory. Phải dùng ScrollableResults của Hibernate hoặc phân trang liên tục (Chunk processing) kết hợp ghi đè ra output stream của HttpServletResponse."
            ],
            dbExistingTables: ["AuditLogs (in schema audit, e.g. audit.AuditLogs)"],
            dbNewTablesSql: "",
            dbRelationships: [
              "Không cần thiết phải JOIN với bảng Users nếu bảng AuditLog đã lưu sẵn Username (khuyên dùng cách này trong Audit Design để tránh mất vết khi User bị xóa)."
            ],
            validationRules: [
              { field: "startDate", rule: "Định dạng yyyy-MM-dd. Bắt buộc.", errorMessage: "INVALID_START_DATE" },
              { field: "endDate", rule: "Định dạng yyyy-MM-dd. Bắt buộc >= startDate.", errorMessage: "INVALID_END_DATE" },
              { field: "Range", rule: "endDate - startDate <= 30 ngày.", errorMessage: "DATE_RANGE_EXCEEDS_30_DAYS" }
            ],
            securityRules: [
              "Strict Role Validation: Chỉ duy nhất Role Admin được phép qua chốt chặn Security. Trả về 403 Forbidden đối với Manager hoặc Staff.",
              "Sensitive Data Masking: Dù Audit Log ghi lại mọi thay đổi, lúc xuất Excel cần cấu hình loại trừ (mask) các trường nhạy cảm bên trong chuỗi JSON OldValues/NewValues (nếu có, ví dụ: mật khẩu)."
            ],
            logEvents: [
              "Self-Auditing: Hành động xuất file Audit Log của Admin cũng phải được lưu log lại thành một sự kiện bảo mật (Ví dụ: 'Admin A vừa xuất file Audit Log từ ngày X đến ngày Y')."
            ],
            noLogEvents: [
              "Không lưu lại dữ liệu Token."
            ],
            integrationPoints: [
              { system: "Apache POI (SXSSFWorkbook)", responsibility: "Vì dữ liệu xuất ra có thể lên đến hàng trăm nghìn dòng, KHÔNG sử dụng XSSFWorkbook thông thường, bắt buộc phải dùng SXSSFWorkbook (Streaming Version) của thư viện Apache POI để giới hạn bộ nhớ RAM." }
            ],
            uiComponents: "Page: /admin/system/audit-logs. Components: Bảng điều khiển bộ lọc (Từ ngày - Đến ngày, Select Box chọn loại hành động CREATE/UPDATE/DELETE/ALL); Nút 'Export to Excel'.",
            uiStateSuccess: "Clicking export disables the button, shows a loading spinner, streams the file, and triggers the browser to save it once complete.",
            endpoints: ["GET /api/audit-logs/export"],
            ownerService: "Spring Boot Support API",
            apiContracts: [
              {
                id: "contract-audit-log-export",
                name: "GET /api/audit-logs/export",
                content: `Method: GET\nPath: /api/audit-logs/export?startDate=2026-07-01&endDate=2026-07-15&actionType=UPDATE\nHeaders:\n  Authorization: Bearer <token>\nResponse 200 OK:\nHeaders:\n  Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\n  Content-Disposition: attachment; filename="AuditLogs_20260701_20260715.xlsx"\nBody: [Binary Stream of Excel File]`
              }
            ],
            testCases: [
              {
                id: "tc-audit-log-export-admin-success",
                title: "Verify authorized client (Admin) can access Audit Log Export successfully",
                type: "integration",
                precondition: "Client is authenticated with role: Admin",
                steps: [
                  "Authenticate user as Admin.",
                  "Invoke endpoint: GET /api/audit-logs/export?startDate=2026-07-01&endDate=2026-07-05"
                ],
                expectedResult: "Request succeeds and streams a valid file.",
                status: "not_started"
              },
              {
                id: "tc-audit-log-export-unauthorized",
                title: "Verify unauthorized role is rejected when accessing Audit Log Export",
                type: "api",
                precondition: "User is authenticated with role: Manager (or anonymous)",
                steps: [
                  "Attempt to invoke endpoint: GET /api/audit-logs/export with Manager token."
                ],
                expectedResult: "Request is blocked and returns 403 Forbidden.",
                status: "not_started"
              },
              {
                id: "tc-audit-log-export-binary-check",
                title: "Verify export endpoint returns correct spreadsheet binary type",
                type: "integration",
                precondition: "User is Admin. Valid date range.",
                steps: [
                  "Invoke endpoint: GET /api/audit-logs/export?startDate=2026-07-01&endDate=2026-07-05"
                ],
                expectedResult: "Response content-type is strictly application/vnd.openxmlformats-officedocument.spreadsheetml.sheet and the payload is not empty.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-audit-log-export-contract", content: "API contract is documented in this node.", checked: true },
              { id: "dc-audit-log-export-roles", content: "Required clients/roles (Admin strictly) are assigned.", checked: true },
              { id: "dc-audit-log-export-business-rules", content: "Business rules (30 days limit) and inherited rules are visible in AI export.", checked: true },
              { id: "dc-audit-log-export-streaming", content: "Streaming implementation constraints (SXSSFWorkbook) are documented to avoid OOM.", checked: true },
              { id: "dc-audit-log-export-error", content: "Error response is clear and does not leak sensitive data.", checked: true },
              { id: "dc-audit-log-export-tests", content: "All 3 test cases, including the binary spreadsheet verification, are defined.", checked: true },
              { id: "dc-audit-log-export-markdown", content: "Feature can be exported as AI-readable Markdown.", checked: true }
            ],
            notes: "Before coding:\nInspect the existing project structure in the Spring Boot Support API.\nLocate the entity mapped to the Audit Logs schema (e.g., AuditLog). Ensure the repository interface supports fetching data by date ranges.\nImport org.apache.poi:poi-ooxml in pom.xml / build.gradle if not present. Use SXSSFWorkbook instead of XSSFWorkbook for streaming large datasets safely.\nImplement the service layer with @Transactional(readOnly = true).\nFetch data in chunks (Pages) or use Java 8 Stream (@Query returning Stream<AuditLog>) wrapped in a try-with-resources block to write directly to the Excel row context.\nStream the final output directly to HttpServletResponse.getOutputStream() rather than wrapping it in a custom JSON response. Set the necessary Headers (Content-Disposition, Content-Type).\nEnforce strict Admin role checks using @PreAuthorize(\"hasRole('ADMIN')\").\nCheck existing tests before adding new ones. Implement the 3 test cases fully."
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
          "Public parking information, pricing, rules, and available slots should be readable without login.",
          "Every successful public payload must include data.asOf as an ISO 8601 UTC snapshot timestamp. Cache only with explicit revalidation: information, pricing, and rules may use a short TTL; availability must be refreshed at least every 30 seconds."
        ],
        children: [
          {
            id: "leaf-pub-info",
            title: "Parking Info",
            type: "leaf_feature",
            clients: ["Guest", "Driver"],
            status: "ready",
            priority: "medium",
            tags: ["public", "info", "pricing", "rules", "capacity"],
            summary: "Public read-only parking building information including capacity, pricing, and rules.",
            ownerService: "Spring Boot Support API",
            endpoints: ["GET /api/public/parking-info"],
            objective: "Purpose: Provide a public, high-level overview of the parking building, including a capacity summary, current pricing summary, accepted vehicle types, and general parking rules.\nOffload Core API: Completely separate this public, read-heavy query flow to the Spring Boot Support API to safeguard the performance of transactional, write-heavy core operations managed by the .NET Core API.\nServe Guest/Driver: Enable public guests and arriving drivers to easily look up information and prepare comprehensive details before entering the parking facility.\nRead-Only Nature: This feature operates strictly under a read-only mode, absolutely prohibiting the opening of any write transactions or modifying any data states within the system.",
            inScope: [
              "Real-time Capacity Aggregation: Compute the live capacity by counting the number of vacant (AVAILABLE) slots grouped by each vehicle type from the structural tables (floors, areas, slots).",
              "Pricing Lookup: Read and display the active rate charts from the pricing_rules table corresponding to the operational vehicle_types.",
              "General Rules Retrieval: Fetch and display public operational rules (e.g., maximum clearance height, operating hours, emergency hotline, lost card policy) by querying the general system_configs table.",
              "Standardized Output: Enforce the global Shared Response Wrapper format uniformly across all system responses."
            ],
            outOfScope: [
              "Any authentication processing, token validation, or user session configuration.",
              "Smart slot allocation recommendations or real-time parking navigation (exclusively handled by the write operations of the .NET Core API).",
              "Altering, modifying, or updating the operational status of slots, areas, or floors."
            ],
            permissions: [
              { role: "Guest", permission: "Public Access - Authorized to access freely without any authentication token via permitAll() configurations on the /api/public/** path." },
              { role: "Driver", permission: "Public Access - Authorized to access freely without any authentication token via permitAll() configurations on the /api/public/** path." }
            ],
            businessRules: [
              "Public parking information, pricing, rules, and available slots should be readable without login.",
              "Read-Only Constraint: The Spring Boot Support API serves strictly as a presentation/reporting layer; the JPA configuration must be explicitly set to spring.jpa.hibernate.ddl-auto: validate. Mutation methods (save, delete, flush) are strictly prohibited within the Repositories designated for this feature.",
              "Naming Mapping: All PostgreSQL table and column identifiers adhere to snake_case, which the Spring Boot Entity layer maps automatically to Java camelCase fields.",
              "Timezone Standard: Temporal data in the database utilizes the TIMESTAMPTZ (UTC) type. When the API dispatches information, the response wrapper must format the datetime strings in strict compliance with the ISO 8601 standard.",
              "Data Sanitization: Absolutely no sensitive internal system details (such as staff account IDs, password hashes, current guest license plates, or raw technical logs) may be exposed within the public payload."
            ],
            dbExistingTables: [
              "floors",
              "areas",
              "slots",
              "vehicle_types",
              "pricing_rules",
              "system_configs"
            ],
            validationRules: [
              { field: "method", rule: "Only GET allowed", errorMessage: "Method Not Allowed" }
            ],
            securityRules: [
              "Public Access: The endpoint must be explicitly configured to bypass JWT authentication filters inside the Spring Boot SecurityConfig setup.",
              "Anti-Abuse: Leverage shared rate-limiting mechanisms at the API Gateway level or incorporate a Middleware Filter to protect public endpoints from continuous automated scraping or data crawling.",
              "Data Leak Prevention: All outbound data must be strictly cleaned via specialized DTO models (Sanitized), avoiding direct entity mapping to prevent exposing hidden internal attributes or metadata."
            ],
            logEvents: [
              "Inbound request timestamps, client IP addresses (for tracing and DDoS mitigation), execution processing time (duration), and resulting HTTP status codes."
            ],
            noLogEvents: [
              "Server hardware details, database connection strings, or verbose internal stack traces within production logs."
            ],
            integrationPoints: [
              { system: "Shared PostgreSQL Database", responsibility: "Reads live data directly from the parking structure tables updated by the .NET Core API (e.g., when vehicle check-ins/check-outs change the state of the slots table) to reflect real-time vacancies immediately on public screens." }
            ],
            uiPage: "/",
            uiComponents: "Capacity Dashboard/Cards, Pricing Table/Grid, Parking Rules Text Block, Emergency Hotline Display, Vehicle Types List. No input forms are required.",
            uiStateLoading: "Displays a waiting indicator (Spinning indicator / Skeleton layout) while the API handles the active data fetch.",
            uiStateEmpty: "Displays a user-friendly fallback message if no structural configuration is present: 'Parking information is currently being updated. Please check back later.'",
            uiStateError: "Graciously displays an error message without breaking the UI shell if a backend connection loss or a 500 error occurs.",
            uiStateSuccess: "Renders all major informational widgets completely: the dynamic availability counter grouped by vehicle type, the pricing lookup grid, and the textual block detailing general parking regulations.",
            uiContracts: [
              {
                id: "ui-contract-pub-info-flow",
                name: "Public Parking Info UI Flow",
                content: "Data fetching:\n  - On page load, fetch GET /api/public/parking-info.\n\nState handling:\n  - Loading: Show skeleton loaders for capacity cards and pricing table.\n  - Success (200): Render capacity cards grouped by vehicle type, render pricing summary table, and render parking rules list.\n  - Error: Display fallback banner 'Parking information is currently being updated'."
              }
            ],
            dataContracts: [
              {
                id: "data-contract-pub-info-response",
                name: "PublicParkingInfoResponse (Java DTO)",
                content: "public class PublicParkingInfoResponse {\n    private Instant asOf; // UTC snapshot timestamp\n    private List<CapacitySummaryDto> capacitySummary;\n    private List<PricingSummaryDto> pricingSummary;\n    private List<String> vehicleTypes;\n    private ParkingRulesDto parkingRules;\n    // getters and setters\n}"
              }
            ],
            apiContracts: [
              {
                id: "api-contract-public-parking-info",
                name: "GET /api/public/parking-info",
                content: "Method: GET\nPath: /api/public/parking-info\nHeaders:\n  Accept: application/json\n\nSuccess Response (200 OK):\n{\n  \"success\": true,\n  \"message\": \"OK\",\n  \"data\": {\n    \"capacitySummary\": [\n      {\n        \"vehicleTypeName\": \"Car\",\n        \"totalSlots\": 50,\n        \"availableSlots\": 20\n      },\n      {\n        \"vehicleTypeName\": \"Motorbike\",\n        \"totalSlots\": 100,\n        \"availableSlots\": 45\n      }\n    ],\n    \"pricingSummary\": [\n      {\n        \"vehicleTypeName\": \"Car\",\n        \"dayPrice\": 20000.00,\n        \"nightPrice\": 30000.00,\n        \"monthlyPrice\": 1200000.00,\n        \"lostCardFee\": 200000.00\n      },\n      {\n        \"vehicleTypeName\": \"Motorbike\",\n        \"dayPrice\": 5000.00,\n        \"nightPrice\": 7000.00,\n        \"monthlyPrice\": 150000.00,\n        \"lostCardFee\": 50000.00\n      }\n    ],\n    \"vehicleTypes\": [\n      \"Bicycle\",\n      \"Electric Bicycle\",\n      \"Motorbike\",\n      \"Electric Motorbike\",\n      \"Car\",\n      \"Electric Car\",\n      \"Cargo Vehicle\"\n    ],\n    \"parkingRules\": {\n      \"maximumHeight\": \"2.2m\",\n      \"openingHours\": \"06:00 - 23:30\",\n      \"lostCardPolicy\": \"A lost card fee penalty applies per regulations, followed by vehicle ownership verification.\",\n      \"parkingRegulations\": \"Park exactly within the designated slot number, turn off the engine, engage the kickstand, and do not leave valuable assets on the vehicle.\",\n      \"emergencyHotline\": \"024-7300-5588\"\n    }\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-07T19:20:00+07:00\"\n}\n\nError Responses:\n\n500 Internal Server Error (Database connection failure)\n{\n  \"success\": false,\n  \"message\": \"DATABASE_UNAVAILABLE\",\n  \"data\": null,\n  \"errors\": \"Could not connect to the shared database instance.\",\n  \"timestamp\": \"2026-07-07T19:20:00+07:00\"\n}\n\n500 Internal Server Error (Missing system configuration for parking rules)\n{\n  \"success\": false,\n  \"message\": \"PARKING_INFO_NOT_CONFIGURED\",\n  \"data\": null,\n  \"errors\": \"Required system configurations or rules are missing in the database.\",\n  \"timestamp\": \"2026-07-07T19:20:00+07:00\"\n}"
              }
            ],
            testCases: [
              {
                id: "tc-parking-info-01",
                title: "Fetch Public Parking Info Successfully (Happy Path)",
                type: "integration",
                precondition: "The database is fully seeded with structural test parameters using the standard 02_seed.sql script (including valid floor setups, slot states, active pricing rules, and standard system configurations).",
                steps: [
                  "Dispatch an unauthenticated request to GET /api/public/parking-info without attaching any Authorization header.",
                  "Inspect the HTTP status code and response payload."
                ],
                expectedResult: "HTTP Status is 200 OK. The JSON payload matches the standard Shared Response Wrapper structure (success: true, message: \"OK\", and the data block encompasses all 4 mandatory informational nodes defined in the API contract).",
                status: "not_started"
              },
              {
                id: "tc-parking-info-02",
                title: "Verify Response Data Sanitization (No Sensitive Internal Leak)",
                type: "integration",
                precondition: "The facility is fully operational with active parking sessions recorded inside live transactional tables.",
                steps: [
                  "Call the public endpoint GET /api/public/parking-info.",
                  "Analyze the output JSON text to verify the absence of restricted keywords or raw operational keys such as password_hash, userId, driverId, sessionCode, or raw database foreign keys."
                ],
                expectedResult: "The payload is perfectly clean, containing exclusively aggregated numbers and static public rules, ensuring zero transaction or identity exposure.",
                status: "not_started"
              },
              {
                id: "tc-parking-info-03",
                title: "Verify Failure Response When System Configuration Is Missing",
                type: "integration",
                precondition: "The shared database instance is either completely empty or records inside the system_configs table matching mandatory operational keys (MAXIMUM_HEIGHT, OPENING_HOURS, etc.) are entirely missing.",
                steps: [
                  "Call the endpoint GET /api/public/parking-info."
                ],
                expectedResult: "HTTP Status returns 500 Internal Server Error. The wrapper properties present success: false and message: \"PARKING_INFO_NOT_CONFIGURED\" alongside a clear, sanitized error description, suppressing raw Hibernate/Postgres exceptions from reaching the client layer.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-parking-info-01", content: "The API endpoint is exposed exactly under the standard public path: /api/public/parking-info.", checked: false },
              { id: "dc-parking-info-02", content: "No authorization headers, session cookies, or tokens are required to query the resource (No authentication required).", checked: false },
              { id: "dc-parking-info-03", content: "No transactional elements, private driver records, or core security metadata are exposed (No sensitive data exposed).", checked: false },
              { id: "dc-parking-info-04", content: "Data retrieval is processed exclusively using read-only repository layers without calling any mutating functions (Read only repositories).", checked: false },
              { id: "dc-parking-info-05", content: "Active tariffs are correctly mapped from the pricing configurations table (Pricing displayed).", checked: false },
              { id: "dc-parking-info-06", content: "Core building regulations are fully extracted and displayed from the system settings table (Parking rules displayed).", checked: false },
              { id: "dc-parking-info-07", content: "The output cleanly details the definitive scope of supported vehicle categories (Vehicle types displayed).", checked: false },
              { id: "dc-parking-info-08", content: "Available vacancy metrics are calculated correctly and aggregated in real-time by vehicle type (Capacity aggregated correctly).", checked: false },
              { id: "dc-parking-info-09", content: "The response payload strictly complies with the unified global response formatting standard (Shared response wrapper).", checked: false },
              { id: "dc-parking-info-10", content: "The operation remains decoupled from the transactional backend, producing no write overhead on core workflows (No Core API transaction).", checked: false },
              { id: "dc-parking-info-11", content: "The implementation fully respects and adheres to the functional boundaries of the Spring Boot Support API (Spring Boot ownership respected).", checked: false }
            ]
              },
              {
            id: "leaf-pub-price",
            title: "Public Pricing",
            type: "leaf_feature",
            clients: ["Guest", "Driver"],
            status: "ready",
            priority: "medium",
            tags: ["public", "pricing", "read-only"],
            summary: "Public read-only endpoint exposing active pricing rules grouped by vehicle type, including day rate, night rate, monthly pass cost, and lost card penalty fee.",
            ownerService: "Spring Boot Support API",
            endpoints: ["GET /api/public/pricing"],
            objective: "Purpose: Provide a dedicated public endpoint to look up the active pricing rules of the facility. This allows unauthenticated visitors and drivers to inspect hourly rates, night tariffs, monthly pass costs, and penalty metrics beforehand.\nCore API Offloading: Isolate public read-heavy rate checks into the Spring Boot Support API, keeping the write-heavy payment processing engine on the .NET Core API backend safe from traffic spikes.\nRead-Only Enforcement: Runs entirely on a read-only database context. It must never initiate data modifications or trigger state manipulation on transactional schemas.",
            inScope: [
              "Retrieving currently configured pricing information corresponding to active vehicle categories from the shared database.",
              "Mapping database numeric types to precise decimals inside the public data transfer structures.",
              "Formatting all response metadata utilizing the global system-wide Shared Response Wrapper."
            ],
            outOfScope: [
              "Modifying, creating, or archiving pricing configurations (Pricing adjustments are strictly managed by administrative tools built on the .NET Core API backend).",
              "Applying or executing live parking transaction fee computations."
            ],
            permissions: [
              { role: "Guest", permission: "Public Access - Fully authorized to access anonymously without sending a security token (Accessible without authentication)." },
              { role: "Driver", permission: "Public Access - Fully authorized to access anonymously without sending a security token (Accessible without authentication)." }
            ],
            businessRules: [
              "The system manages parking building operations for public guests, drivers, staff, managers, and admins.",
              "The backend is split into .NET Core API for transactional/write operations and Spring Boot Support API for support/read/report/public operations.",
              "All APIs must return a consistent success/error response format.",
              "Public APIs must not expose private user, session, or payment details.",
              "Public parking information, pricing, rules, and available slots must be readable without logging in.",
              "Read-Only Constraint: The Support API acts strictly as a presentation layer. Any persistence write, update, or delete commands are strictly forbidden.",
              "Timezone Standard: Database time attributes utilize UTC mappings. The API must format dates matching strict ISO 8601 formatting standards."
            ],
            dbExistingTables: ["pricing_rules", "vehicle_types"],
            validationRules: [
              { field: "method", rule: "Only GET allowed", errorMessage: "Method Not Allowed" }
            ],
            securityRules: [
              "Authentication Bypass: This endpoint must explicitly circumvent credential check filters inside the service's security layer.",
              "Anti-Abuse Shield: Route via common gateway rate limiting to prevent aggressive automated scraping of tariff metrics.",
              "Data Sanitization: Ensure output variables are strictly mapped to custom DTOs to fully mask raw internal database sequences, primary keys, or internal employee metadata tags."
            ],
            logEvents: [
              "Request ingestion time, caller remote IP address, API execution duration, returned record count, and finalized HTTP response code."
            ],
            noLogEvents: [
              "Underlying raw system directory details, database connection string credentials, or unmapped backend stack trace fragments."
            ],
            integrationPoints: [
              { system: "Shared PostgreSQL Database", responsibility: "Conducts direct read operations against active tariff metadata rows published and updated by management clients." }
            ],
            uiPage: "/pricing",
            uiComponents: "Pricing Table/Grid, Vehicle Type Tabs or Rows, Rate Cards",
            uiStateLoading: "Displays a skeleton layout or structural loading indicator while waiting for the API response.",
            uiStateEmpty: "Shows a friendly warning: 'Rate charts are currently undergoing system maintenance. Please check back shortly.' if no pricing rules are found.",
            uiStateError: "Renders a localized failure component without disrupting the surrounding application page structure.",
            uiStateSuccess: "Iterates over the arrays to cleanly construct responsive billing tariff grid views across all supported vehicle modes.",
            notes: "This is a fully public endpoint with no authentication requirement. All pricing data must be pre-loaded from the pricing_rules and vehicle_types tables via the shared PostgreSQL database.",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-public-pricing",
                name: "GET /api/public/pricing",
                content: `Method: GET
Path: /api/public/pricing
Headers:
  Accept: application/json

Example Success Response (200 OK):
{
  "success": true,
  "message": "OK",
  "data": {
    "asOf": "2026-07-07T12:20:00Z",
    "pricingSummary": [
      {
        "vehicleTypeName": "Car",
        "dayPrice": 20000.00,
        "nightPrice": 30000.00,
        "monthlyPrice": 1200000.00,
        "lostCardFee": 200000.00
      },
      {
        "vehicleTypeName": "Motorbike",
        "dayPrice": 5000.00,
        "nightPrice": 7000.00,
        "monthlyPrice": 150000.00,
        "lostCardFee": 50000.00
      },
      {
        "vehicleTypeName": "Bicycle",
        "dayPrice": 2000.00,
        "nightPrice": 3000.00,
        "monthlyPrice": 50000.00,
        "lostCardFee": 20000.00
      },
      {
        "vehicleTypeName": "Electric Bicycle",
        "dayPrice": 2500.00,
        "nightPrice": 3500.00,
        "monthlyPrice": 70000.00,
        "lostCardFee": 20000.00
      },
      {
        "vehicleTypeName": "Electric Motorbike",
        "dayPrice": 6000.00,
        "nightPrice": 8000.00,
        "monthlyPrice": 180000.00,
        "lostCardFee": 50000.00
      },
      {
        "vehicleTypeName": "Electric Car",
        "dayPrice": 25000.00,
        "nightPrice": 35000.00,
        "monthlyPrice": 1500000.00,
        "lostCardFee": 200000.00
      },
      {
        "vehicleTypeName": "Cargo Vehicle",
        "dayPrice": 40000.00,
        "nightPrice": 55000.00,
        "monthlyPrice": 2000000.00,
        "lostCardFee": 300000.00
      }
    ]
  },
  "errors": null,
  "timestamp": "2026-07-07T21:44:00+07:00"
}

Example Error Response 404 Not Found (Missing Active Pricing Configuration):
{
  "success": false,
  "message": "RESOURCE_NOT_FOUND",
  "data": null,
  "errors": "Active rate charts or pricing configurations were not found in the system.",
  "timestamp": "2026-07-07T21:44:00+07:00"
}

Example Error Response 500 Internal Server Error (Database Error):
{
  "success": false,
  "message": "DATABASE_ERROR",
  "data": null,
  "errors": "Could not connect to the shared database resource.",
  "timestamp": "2026-07-07T21:44:00+07:00"
}`
              }
            ],
            dataContracts: [
              {
                id: "data-contract-pricing-summary-dto",
                name: "PricingSummaryDto (Java DTO)",
                content: "public class PricingSummaryDto {\n    private String vehicleTypeName;\n    private BigDecimal dayPrice;\n    private BigDecimal nightPrice;\n    private BigDecimal monthlyPrice;\n    private BigDecimal lostCardFee;\n    // getters and setters\n}\n\npublic class PublicPricingResponse {\n    private List<PricingSummaryDto> pricingSummary;\n    // getters and setters\n}"
              }
            ],
            testCases: [
              {
                id: "tc-pub-pricing-01",
                title: "Fetch Public Pricing Successfully (Happy Path)",
                type: "integration",
                precondition: "The shared database has active pricing records linked properly to active vehicle configurations.",
                steps: [
                  "Trigger an unauthenticated request to GET /api/public/pricing.",
                  "Evaluate response status and payload structures."
                ],
                expectedResult: "Receives an HTTP 200 OK status. The payload perfectly matches the project's Shared Response Wrapper design specification with pricingSummary array containing all active vehicle types.",
                status: "not_started"
              },
              {
                id: "tc-pub-pricing-02",
                title: "Verify Response Data Sanitization (No Sensitive Internal Leak)",
                type: "integration",
                precondition: "Standard pricing configurations exist.",
                steps: [
                  "Invoke the public pricing endpoint.",
                  "Parse the body text to detect properties like internal database sequence tags or modification timestamps."
                ],
                expectedResult: "Administrative tracking metadata attributes (e.g., id, created_at, updated_at, staff_id) are cleanly stripped from the final JSON delivery.",
                status: "not_started"
              },
              {
                id: "tc-pub-pricing-03",
                title: "Verify Behavior When Data Is Empty (Empty Data State)",
                type: "integration",
                precondition: "The pricing storage structures in the database contain no records.",
                steps: [
                  "Fire an unauthenticated request to GET /api/public/pricing."
                ],
                expectedResult: "System handles data absences elegantly by replying with an HTTP 404 status accompanied by the error message RESOURCE_NOT_FOUND.",
                status: "not_started"
              },
              {
                id: "tc-pub-pricing-04",
                title: "Verify System Behavior on Database Timeout / Error",
                type: "integration",
                precondition: "Simulate a database timeout or a broken connection layer.",
                steps: [
                  "Invoke the public pricing endpoint."
                ],
                expectedResult: "System intercepts the infrastructure fault smoothly, emitting a 5xx series status with a standardized DATABASE_ERROR tracking structure.",
                status: "not_started"
              },
              {
                id: "tc-pub-pricing-05",
                title: "Verify Read-Only Constraint Enforcement",
                type: "integration",
                steps: [
                  "Review data access code processing this feature."
                ],
                expectedResult: "Verifies that no write permissions or modification transactions are initialized by this service context.",
                status: "not_started"
              },
              {
                id: "tc-pub-pricing-06",
                title: "Verify Shared Response Wrapper Format Compliance",
                type: "integration",
                steps: [
                  "Call the endpoint and validate the root fields of the JSON response."
                ],
                expectedResult: "The JSON object contains precisely the following root-level attributes: success, message, data, errors, and timestamp (ISO 8601).",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-pub-pricing-01", content: "API route matches the designated public naming path precisely: GET /api/public/pricing.", checked: false },
              { id: "dc-pub-pricing-02", content: "No access credentials or session tokens are checked or validated (✓ Accessible without authentication).", checked: false },
              { id: "dc-pub-pricing-03", content: "Internal sequence tags, structural keys, and transaction audits remain entirely concealed (✓ No sensitive data exposed).", checked: false },
              { id: "dc-pub-pricing-04", content: "Data layer logic relies entirely on read-only mechanisms (✓ Read-only repositories).", checked: false },
              { id: "dc-pub-pricing-05", content: "Output displays accurate day, night, monthly, and lost card fees mapped by vehicle types (✓ Pricing displayed).", checked: false },
              { id: "dc-pub-pricing-06", content: "The structure wraps responses perfectly inside the standard architecture wrapper model (✓ Shared response wrapper).", checked: false },
              { id: "dc-pub-pricing-07", content: "Operates independently without initializing transactions on the transactional core (✓ No Core API transaction).", checked: false },
              { id: "dc-pub-pricing-08", content: "Fully abides by the structural scope defined for the reporting layer (✓ Spring Boot ownership respected).", checked: false }
            ]
          },
          {
            id: "leaf-pub-rules",
            title: "Public Rules",
            type: "leaf_feature",
            clients: ["Guest", "Driver"],
            status: "ready",
            priority: "medium",
            tags: ["public", "rules", "config", "read-only"],
            summary: "Public read-only endpoint surfacing building operational rules, height clearances, schedules, liability statements, and hotline details to unauthenticated visitors and drivers.",
            ownerService: "Spring Boot Support API",
            endpoints: ["GET /api/public/rules"],
            objective: "Purpose: Surface building operational rules, height clearances, schedules, liability statements, and hotline details to the public.\nDynamic Content Management: Aggregates operational parameters dynamically from centralized database configurations. This allows administration teams to adjust guidelines via management portals without hardcoding text on front-end layouts.\nCore API Offloading: Direct lookup tasks away from core operational nodes into the reporting framework to ensure optimized thread availability.",
            inScope: [
              "Retrieving system variable parameters from configuration tables matching specific operational property keywords (e.g., maximum clearance, hotline information, opening hours).",
              "Consolidating separate configuration variables into a singular, cohesive rules descriptor object payload.",
              "Ensuring formatting outputs adhere strictly to the target architecture Shared Response Wrapper structure."
            ],
            outOfScope: [
              "Updating system configuration records or altering administrative guidelines (Configuration workflows belong exclusively to the secure administrative scopes of the .NET Core API)."
            ],
            permissions: [
              { role: "Guest", permission: "Public Access - Fully authorized to access anonymously without sending a security token (Accessible without authentication)." },
              { role: "Driver", permission: "Public Access - Fully authorized to access anonymously without sending a security token (Accessible without authentication)." }
            ],
            businessRules: [
              "The system manages parking building operations for public guests, drivers, staff, managers, and admins.",
              "The backend is split into .NET Core API for transactional/write operations and Spring Boot Support API for support/read/report/public operations.",
              "All APIs must return a consistent success/error response format.",
              "Public APIs must not expose private user, session, or payment details.",
              "Public parking information, pricing, rules, and available slots must be readable without logging in.",
              "Read-Only Constraint: The Support API acts strictly as a presentation layer. Any persistence write, update, or delete commands are strictly forbidden.",
              "Timezone Standard: Database time attributes utilize UTC mappings. The API must format dates matching strict ISO 8601 formatting standards."
            ],
            dbExistingTables: ["system_configs"],
            validationRules: [
              { field: "method", rule: "Only GET allowed", errorMessage: "Method Not Allowed" }
            ],
            securityRules: [
              "Authentication Bypass: This endpoint must explicitly circumvent credential check filters inside the service's security layer.",
              "Data Privacy Protection: Return explicitly mapped string properties instead of exporting open database configurations or operational database records directly to the web layout layers."
            ],
            logEvents: [
              "Request ingestion time, caller remote IP address, API execution duration, returned record count, and finalized HTTP response code."
            ],
            noLogEvents: [
              "Underlying raw system directory details, database connection string credentials, or unmapped backend stack trace fragments."
            ],
            integrationPoints: [
              { system: "Shared PostgreSQL Database", responsibility: "Evaluates configuration parameters across targeted rows to verify active operational guidelines." }
            ],
            uiPage: "/rules",
            uiComponents: "Rules Info Panels, Max Height Badge, Opening Hours Display, Lost Card Policy Text, Parking Regulations Text Block, Emergency Hotline Display",
            uiStateLoading: "Renders structural skeleton placeholder items while communicating with backend infrastructure.",
            uiStateEmpty: "Falls back cleanly to display a default message: 'General parking regulations are being updated by property administration.' if configurations are missing.",
            uiStateError: "Informs users of connection difficulties neatly without introducing application interface visual breaks.",
            uiStateSuccess: "Populates structural informational panels detailing maximum clearance limits, timeline schedules, operational protocols, and support phone channels.",
            notes: "Data is sourced from the system_configs table using predefined configuration key lookups. No relational joins are required. Each rule property maps directly to a unique config key in the database.",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-public-rules",
                name: "GET /api/public/rules",
                content: `Method: GET
Path: /api/public/rules
Headers:
  Accept: application/json

Example Success Response (200 OK):
{
  "success": true,
  "message": "OK",
  "data": {
    "asOf": "2026-07-07T14:44:00Z",
    "parkingRules": {
      "maximumHeight": "2.2m",
      "openingHours": "06:00 - 23:30",
      "lostCardPolicy": "A lost card fee penalty applies per regulations, followed by vehicle ownership verification.",
      "parkingRegulations": "Park exactly within the designated slot number, turn off the engine, engage the kickstand, and do not leave valuable assets on the vehicle.",
      "emergencyHotline": "024-7300-5588"
    }
  },
  "errors": null,
  "timestamp": "2026-07-07T21:44:00+07:00"
}

Example Error Response 404 Not Found (Missing System Configurations):
{
  "success": false,
  "message": "RESOURCE_NOT_FOUND",
  "data": null,
  "errors": "Required system operational rules or configuration parameters were not found.",
  "timestamp": "2026-07-07T21:44:00+07:00"
}

Example Error Response 500 Internal Server Error (Database Error):
{
  "success": false,
  "message": "DATABASE_ERROR",
  "data": null,
  "errors": "Could not execute data query against the shared configuration schema.",
  "timestamp": "2026-07-07T21:44:00+07:00"
}`
              }
            ],
            dataContracts: [
              {
                id: "data-contract-parking-rules-dto",
                name: "ParkingRulesDto (Java DTO)",
                content: "public class ParkingRulesDto {\n    private String maximumHeight;\n    private String openingHours;\n    private String lostCardPolicy;\n    private String parkingRegulations;\n    private String emergencyHotline;\n    // getters and setters\n}\n\npublic class PublicRulesResponse {\n    private ParkingRulesDto parkingRules;\n    // getters and setters\n}\n\n// system_configs key constants used for lookup:\n// KEY_MAX_HEIGHT = \"PARKING_MAX_HEIGHT\"\n// KEY_OPENING_HOURS = \"PARKING_OPENING_HOURS\"\n// KEY_LOST_CARD_POLICY = \"PARKING_LOST_CARD_POLICY\"\n// KEY_REGULATIONS = \"PARKING_REGULATIONS\"\n// KEY_HOTLINE = \"PARKING_EMERGENCY_HOTLINE\""
              }
            ],
            testCases: [
              {
                id: "tc-pub-rules-01",
                title: "Fetch Public Rules Successfully (Happy Path)",
                type: "integration",
                precondition: "The database has been initialized with the required operational parameters in the system_configs table.",
                steps: [
                  "Direct an unauthenticated request to GET /api/public/rules.",
                  "Parse the output JSON mapping parameters."
                ],
                expectedResult: "API serves an HTTP 200 OK code, packing an explicitly formed parkingRules object payload matching the project contract design specs with all 5 fields populated: maximumHeight, openingHours, lostCardPolicy, parkingRegulations, emergencyHotline.",
                status: "not_started"
              },
              {
                id: "tc-pub-rules-02",
                title: "Verify Failure Response When System Configuration Is Missing",
                type: "integration",
                precondition: "Mandatory configuration records are missing or dropped from the target database table.",
                steps: [
                  "Invoke the API route GET /api/public/rules."
                ],
                expectedResult: "System handles the missing keys smoothly, emitting an HTTP 404 status with an explicit error tracking code RESOURCE_NOT_FOUND.",
                status: "not_started"
              },
              {
                id: "tc-pub-rules-03",
                title: "Verify System Behavior on Database Timeout",
                type: "integration",
                precondition: "Simulate a database timeout during lookup execution.",
                steps: [
                  "Invoke the API route GET /api/public/rules."
                ],
                expectedResult: "System catches the latency error, replying with an HTTP 500 error wrapper accompanied by the error message DATABASE_ERROR.",
                status: "not_started"
              },
              {
                id: "tc-pub-rules-04",
                title: "Verify Read-Only Constraint Enforcement",
                type: "integration",
                steps: [
                  "Review data access code processing this feature."
                ],
                expectedResult: "Verifies that no write permissions or modification transactions are initialized by this service context.",
                status: "not_started"
              },
              {
                id: "tc-pub-rules-05",
                title: "Verify Shared Response Wrapper Format Compliance",
                type: "integration",
                steps: [
                  "Call the endpoint and validate the root fields of the JSON response."
                ],
                expectedResult: "The JSON object contains precisely the following root-level attributes: success, message, data, errors, and timestamp (ISO 8601).",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-pub-rules-01", content: "API route matches the designated public naming path precisely: GET /api/public/rules.", checked: false },
              { id: "dc-pub-rules-02", content: "No access credentials or session tokens are checked or validated (✓ Accessible without authentication).", checked: false },
              { id: "dc-pub-rules-03", content: "Internal sequence tags, structural keys, and transaction audits remain entirely concealed (✓ No sensitive data exposed).", checked: false },
              { id: "dc-pub-rules-04", content: "Data layer logic relies entirely on read-only mechanisms (✓ Read-only repositories).", checked: false },
              { id: "dc-pub-rules-05", content: "Return data displays full parking rules information retrieved from system configuration table (✓ Parking rules displayed).", checked: false },
              { id: "dc-pub-rules-06", content: "The structure wraps responses perfectly inside the standard architecture wrapper model (✓ Shared response wrapper).", checked: false },
              { id: "dc-pub-rules-07", content: "Operates independently without initializing transactions on the transactional core (✓ No Core API transaction).", checked: false },
              { id: "dc-pub-rules-08", content: "Fully abides by the structural scope defined for the reporting layer (✓ Spring Boot ownership respected).", checked: false }
            ]
          },
          {
            id: "leaf-pub-avail",
            title: "Public Available Slots",
            type: "leaf_feature",
            clients: ["Guest", "Driver"],
            status: "ready",
            priority: "medium",
            tags: ["public", "capacity", "slots", "real-time", "read-only"],
            summary: "Public read-only endpoint exposing dynamic real-time parking capacity and vacancy counts across structural layouts grouped by supported vehicle classes.",
            ownerService: "Spring Boot Support API",
            endpoints: ["GET /api/public/available-slots"],
            objective: "Purpose: Expose dynamic real-time parking capacity and vacancy counts across structural layouts grouped by supported vehicle classes.\nCore API Offloading: Perform live COUNT aggregations directly from the shared database within the reporting backend. This decouples constant telemetry querying from core gate check-in systems on the .NET Core API engine, preventing thread contention at physical gates when vehicular traffic spikes.\nDriver Awareness: Enables drivers to view live availability updates before entering the parking facility.",
            inScope: [
              "Performing live aggregation counts on parking spaces where status matches the active vacant status profile (AVAILABLE).",
              "Filtering out storage elements belonging to structural blocks, areas, or floors that are marked under maintenance states.",
              "Organizing calculations to deliver metrics showing vacancy counts alongside global physical capacities for each vehicle type.",
              "Outputting results within the standard system Shared Response Wrapper object format."
            ],
            outOfScope: [
              "Reserving slot spaces or modifying occupancy state tags (Assigning spaces or changing state tags is strictly limited to transactional workflows on the .NET Core API engine)."
            ],
            permissions: [
              { role: "Guest", permission: "Public Access - Fully authorized to access capacity telemetry metrics without sending a security token (Accessible without authentication)." },
              { role: "Driver", permission: "Public Access - Fully authorized to access capacity telemetry metrics without sending a security token (Accessible without authentication)." }
            ],
            businessRules: [
              "The system manages parking building operations for public guests, drivers, staff, managers, and admins.",
              "The backend is split into .NET Core API for transactional/write operations and Spring Boot Support API for support/read/report/public operations.",
              "All APIs must return a consistent success/error response format.",
              "Public APIs must not expose private user, session, or payment details.",
              "Public parking information, pricing, rules, and available slots must be readable without logging in.",
              "Real-time Reflectivity: Queries must reflect active real-time conditions directly from structural data layers modified by active vehicle gate movements.",
              "Read-Only Constraint: The Support API acts strictly as a presentation layer. Any persistence write, update, or delete commands are strictly forbidden.",
              "Timezone Standard: Database time attributes utilize UTC mappings. The API must format dates matching strict ISO 8601 formatting standards."
            ],
            dbExistingTables: ["floors", "areas", "slots", "vehicle_types"],
            validationRules: [
              { field: "method", rule: "Only GET allowed", errorMessage: "Method Not Allowed" }
            ],
            securityRules: [
              "Authentication Bypass: This endpoint must explicitly circumvent credential check filters inside the service's security layer.",
              "No Telemetry Leak: Never include reference properties linking active parking sessions, driver accounts, ticket IDs, or vehicle license plates inside public responses. Only aggregate numbers are permitted."
            ],
            logEvents: [
              "Request ingestion time, caller remote IP address, API execution duration, returned record count (number of vehicle type categories aggregated), and finalized HTTP response code."
            ],
            noLogEvents: [
              "Underlying raw data layout configuration variables or database access signatures."
            ],
            integrationPoints: [
              { system: "Shared PostgreSQL Database", responsibility: "Performs real-time counts against active space state changes modified by vehicle check-ins and check-outs processed by the .NET core engine." }
            ],
            uiPage: "/available-slots",
            uiComponents: "Capacity Counter Cards per Vehicle Type, Progress Bar or Gauge (available/total), Color-coded Availability Indicators (green=available, red=full)",
            uiStateLoading: "Renders animated skeletons or progress bars while capacity metrics execution takes place.",
            uiStateEmpty: "Renders standard clean informational blocks: 'Capacity tracking metrics are rebuilding. Please review signage at physical gate entries.' if no layout spaces are registered.",
            uiStateError: "Gracefully displays connection error hints without breaking user navigation tools.",
            uiStateSuccess: "Displays active real-time counter indicators using clear color coding (green for vacant availability spaces, red for fully occupied states).",
            notes: "Aggregation query joins slots -> areas -> floors -> vehicle_types. Filters only ACTIVE floors, ACTIVE areas, and counts total vs AVAILABLE slots per vehicle type. Does not expose driver, session, plate, or any PII data.",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-public-avail-slots",
                name: "GET /api/public/available-slots",
                content: `Method: GET
Path: /api/public/available-slots
Headers:
  Accept: application/json

Example Success Response (200 OK):
{
  "success": true,
  "message": "OK",
  "data": {
    "asOf": "2026-07-07T12:20:00Z",
    "capacitySummary": [
      {
        "vehicleTypeName": "Car",
        "totalSlots": 50,
        "availableSlots": 20
      },
      {
        "vehicleTypeName": "Motorbike",
        "totalSlots": 100,
        "availableSlots": 45
      },
      {
        "vehicleTypeName": "Bicycle",
        "totalSlots": 30,
        "availableSlots": 22
      },
      {
        "vehicleTypeName": "Electric Bicycle",
        "totalSlots": 20,
        "availableSlots": 15
      },
      {
        "vehicleTypeName": "Electric Motorbike",
        "totalSlots": 40,
        "availableSlots": 18
      },
      {
        "vehicleTypeName": "Electric Car",
        "totalSlots": 20,
        "availableSlots": 8
      },
      {
        "vehicleTypeName": "Cargo Vehicle",
        "totalSlots": 10,
        "availableSlots": 3
      }
    ]
  },
  "errors": null,
  "timestamp": "2026-07-07T21:44:00+07:00"
}

Example Error Response 500 Internal Server Error (Database Aggregation Failure):
{
  "success": false,
  "message": "DATABASE_ERROR",
  "data": null,
  "errors": "Could not execute real-time capacity aggregation across the shared database schemas.",
  "timestamp": "2026-07-07T21:44:00+07:00"
}`
              }
            ],
            dataContracts: [
              {
                id: "data-contract-capacity-summary-dto",
                name: "CapacitySummaryDto (Java DTO)",
                content: "public class CapacitySummaryDto {\n    private String vehicleTypeName;\n    private long totalSlots;\n    private long availableSlots;\n    // getters and setters\n}\n\npublic class PublicAvailableSlotsResponse {\n    private List<CapacitySummaryDto> capacitySummary;\n    // getters and setters\n}\n\n// Aggregation SQL (reference):\n// SELECT vt.name AS vehicleTypeName,\n//        COUNT(s.id) AS totalSlots,\n//        SUM(CASE WHEN s.status = 'AVAILABLE' THEN 1 ELSE 0 END) AS availableSlots\n// FROM slots s\n// JOIN areas a ON s.area_id = a.id\n// JOIN floors f ON a.floor_id = f.id\n// JOIN vehicle_types vt ON s.allowed_vehicle_type_id = vt.id\n// WHERE f.status = 'ACTIVE'\n//   AND a.status = 'ACTIVE'\n//   AND s.status != 'LOCKED'\n//   AND s.status != 'MAINTENANCE'\n// GROUP BY vt.name\n// ORDER BY vt.name"
              }
            ],
            testCases: [
              {
                id: "tc-pub-avail-01",
                title: "Fetch Available Slots Successfully (Happy Path)",
                type: "integration",
                precondition: "Structural database entities contain valid operational layout records.",
                steps: [
                  "Dispatch an unauthenticated request to GET /api/public/available-slots.",
                  "Evaluate response values and structure."
                ],
                expectedResult: "Server returns an HTTP 200 OK message, packing a clean capacitySummary collection showing accurate vacant space aggregations wrapped in Shared Response Wrapper. Each item contains vehicleTypeName, totalSlots, and availableSlots.",
                status: "not_started"
              },
              {
                id: "tc-pub-avail-02",
                title: "Verify Response Data Sanitization (No Transformed Entity Leak)",
                type: "integration",
                precondition: "Multiple active parking sessions are currently occupying physical layout positions.",
                steps: [
                  "Trigger capacity tracking endpoints.",
                  "Evaluate the output variables to check for fields like driver IDs, ticket information, or license plates."
                ],
                expectedResult: "Output variables present exclusively clean capacity numbers, ensuring no transactional driver tracking data leaks to the client layer.",
                status: "not_started"
              },
              {
                id: "tc-pub-avail-03",
                title: "Verify Behavior When Layout Data Is Empty (Empty Data State)",
                type: "integration",
                precondition: "The database contains no records for structural spaces or parking layout configurations.",
                steps: [
                  "Trigger an unauthenticated request to GET /api/public/available-slots."
                ],
                expectedResult: "System handles the data absence gracefully, returning an HTTP 200 OK with an empty capacitySummary array without breaking front-end processing logic.",
                status: "not_started"
              },
              {
                id: "tc-pub-avail-04",
                title: "Verify System Behavior on Database Timeout",
                type: "integration",
                precondition: "Simulate a database timeout during lookup execution.",
                steps: [
                  "Invoke the API route GET /api/public/available-slots."
                ],
                expectedResult: "System catches the latency error, replying with an HTTP 500 error wrapper accompanied by the error message DATABASE_ERROR.",
                status: "not_started"
              },
              {
                id: "tc-pub-avail-05",
                title: "Verify Read-Only Constraint Enforcement",
                type: "integration",
                steps: [
                  "Review data access code processing this feature."
                ],
                expectedResult: "Verifies that no write permissions or modification transactions are initialized by this service context.",
                status: "not_started"
              },
              {
                id: "tc-pub-avail-06",
                title: "Verify Shared Response Wrapper Format Compliance",
                type: "integration",
                steps: [
                  "Call the endpoint and validate the root fields of the JSON response."
                ],
                expectedResult: "The JSON object contains precisely the following root-level attributes: success, message, data, errors, and timestamp (ISO 8601).",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-pub-avail-01", content: "API route matches the designated public naming path precisely: GET /api/public/available-slots.", checked: false },
              { id: "dc-pub-avail-02", content: "No access credentials or session tokens are checked or validated (✓ Accessible without authentication).", checked: false },
              { id: "dc-pub-avail-03", content: "Internal sequence tags, structural keys, and transaction audits remain entirely concealed (✓ No sensitive data exposed).", checked: false },
              { id: "dc-pub-avail-04", content: "Data layer logic relies entirely on read-only mechanisms (✓ Read-only repositories).", checked: false },
              { id: "dc-pub-avail-05", content: "Vacancy metrics are grouped and aggregated correctly in real-time by vehicle type (✓ Capacity aggregated correctly).", checked: false },
              { id: "dc-pub-avail-06", content: "The structure wraps responses perfectly inside the standard architecture wrapper model (✓ Shared response wrapper).", checked: false },
              { id: "dc-pub-avail-07", content: "Operates independently without initializing transactions on the transactional core (✓ No Core API transaction).", checked: false },
              { id: "dc-pub-avail-08", content: "Fully abides by the structural scope defined for the reporting layer (✓ Spring Boot ownership respected).", checked: false }
            ]
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
            status: "ready",
            priority: "medium",
            tags: ["support", "feedback", "write", "anonymous-submit"],
            summary: "Allows public guests or authenticated drivers to submit opinions, feedback, infrastructure incident reports, or service complaints regarding the parking building operation.",
            ownerService: "Spring Boot Support API",
            endpoints: ["POST /api/support/feedbacks"],
            objective: "Allows public guests or authenticated drivers to submit opinions, feedback, infrastructure incident reports, or service complaints regarding the parking building operation. This information enables the Management Board to optimize operational workflows and service quality.",
            inScope: [
              "Validate and sanitize the incoming subject and message before persistence.",
              "Verify CAPTCHA for Guest submissions, enforce IP rate limits, and honour an Idempotency-Key.",
              "Persist the feedback, its initial NEW history record, audit event, and Manager notification through the Support API boundary.",
              "Return a uniform API success or error wrapper to the client application."
            ],
            outOfScope: [
              "Binary file uploads or attachments (images/videos), which are deferred to future phases.",
              "Direct email delivery notifications (handled asynchronously via a background queue worker later)."
            ],
            permissions: [
              { role: "Guest", permission: "Authorized - Anonymous write-only submission is allowed at this Support API route when CAPTCHA, rate-limit, and idempotency checks pass; no public read access is granted." },
              { role: "Driver", permission: "Authorized - Allowed to submit feedback; the system dynamically binds their authenticated user_id." }
            ],
            businessRules: [
              "This API endpoint is independently maintained by the Spring Boot Support API. All timestamps must strictly follow the TIMESTAMPTZ standard.",
              "Guest submissions require server-side CAPTCHA verification, IP-based rate limiting, and a UUID Idempotency-Key; authenticated Drivers may be exempt from CAPTCHA only by configured policy.",
              "The initial processing state of every new feedback record is NEW and must be written together with a history and audit entry.",
              "Only SUGGESTION, COMPLAINT, and OTHER categories are accepted; the server derives submitter identity from JWT claims and never accepts it from the body."
            ],
            dbExistingTables: ["support_feedbacks", "support_feedback_history", "support_audit_logs", "users"],
            dbRelationships: ["support_feedbacks.submitter_id is server-derived from users.id for Drivers and NULL for Guests; support_feedback_history and support_audit_logs are appended atomically with the NEW record."],
            validationRules: [
              { field: "subject", rule: "Required, HTML-stripped, 5-150 characters", errorMessage: "Subject must be between 5 and 150 characters." },
              { field: "message", rule: "Required, HTML-stripped, 20-4000 characters", errorMessage: "Message must be between 20 and 4000 characters." },
              { field: "category", rule: "Required. Allowed values: SUGGESTION, COMPLAINT, OTHER", errorMessage: "Category must be one of: SUGGESTION, COMPLAINT, OTHER." },
              { field: "contactEmail", rule: "Optional, RFC-compliant email, maximum 254 characters", errorMessage: "Invalid email format." },
              { field: "allowContact", rule: "Optional boolean; defaults to false", errorMessage: "allowContact must be a boolean." },
              { field: "captchaToken", rule: "Required for Guest submission and verified server-side", errorMessage: "CAPTCHA_FAILED" },
              { field: "Idempotency-Key", rule: "Required UUID v4 header", errorMessage: "Idempotency-Key header is required and must be a valid UUID." }
            ],
            securityRules: [
              "Only POST /api/support/feedbacks permits anonymous access; every read or management feedback route requires JWT and role validation.",
              "Verify CAPTCHA server-side, rate-limit by IP and principal, and reject client-supplied userId, submitterId, or driverId fields.",
              "Sensitive properties, raw IP addresses, CAPTCHA tokens, and internal stack traces are completely masked out of the response layer."
            ],
            logEvents: [
              "Write FEEDBACK_SUBMITTED audit data with actor type, category, subject hash, IP hash, correlation ID, and timestamp; never log raw message, CAPTCHA token, or contact email."
            ],
            noLogEvents: [
              "Plaintext passwords or active bearer authorization credentials."
            ],
            integrationPoints: [
              { system: "Support feedback persistence", responsibility: "Writes support_feedbacks, history, and audit records atomically through the Spring Boot Support API; notifications are dispatched after commit." }
            ],
            uiPage: "/feedback",
            uiComponents: "FeedbackForm, Subject Input, Message Textarea, Category Select (SUGGESTION/COMPLAINT/OTHER), Contact Email Input, Allow Contact Checkbox, CAPTCHA, Submit Button",
            uiStateLoading: "Disable all inputs and submit button, show loading spinner on submit button to prevent duplicate submission.",
            uiStateEmpty: "N/A - this is a write form.",
            uiStateError: "Display field-level validation error messages below respective inputs. Display general banner for unexpected server errors.",
            uiStateSuccess: "Show success toast: 'Your feedback has been submitted successfully. Thank you!' and reset the form.",
            notes: "Guest submits without JWT only after CAPTCHA/rate-limit/idempotency checks; submitter_id is NULL. Driver identity is extracted from JWT claims. Status is always NEW on creation and the response includes a receipt token.",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-submit-feedback",
                name: "POST /api/support/feedbacks",
                content: `Method: POST
Path: /api/support/feedbacks
Headers:
  Authorization: Bearer <token> (Optional - used to bind an authenticated Driver)
  Idempotency-Key: <UUID v4> (Required)
  X-Captcha-Token: <token> (Required for Guest/anonymous)
  Content-Type: application/json

Request Body:
{
  "subject": "Gate B1 card scan is slow",
  "message": "Card processing at B1 takes more than two minutes during the evening peak.",
  "category": "COMPLAINT",
  "contactEmail": "driver.test@gmail.com",
  "allowContact": true
}

Response (201 Created):
{
  "success": true,
  "message": "FEEDBACK_SUBMITTED_SUCCESSFULLY",
  "data": {
    "id": 12,
    "receiptToken": "fbk_rcpt_01J...",
    "subject": "Gate B1 card scan is slow",
    "category": "COMPLAINT",
    "status": "NEW",
    "createdAt": "2026-07-07T15:30:00Z"
  },
  "errors": null,
  "timestamp": "2026-07-07T15:30:00Z"
}

Response (400 Bad Request - Validation Failed):
{
  "success": false,
  "message": "Validation failed.",
  "data": null,
  "errors": [
    {
      "field": "subject",
      "message": "Subject must be between 5 and 150 characters."
    }
  ],
  "timestamp": "2026-07-07T15:30:05Z"
}`
              }
            ],
            dataContracts: [
              {
                id: "data-contract-submit-feedback-request",
                name: "SubmitFeedbackRequest (Java DTO)",
                content: "public class SubmitFeedbackRequest {\n    @NotBlank @Size(min = 5, max = 150) private String subject;\n    @NotBlank @Size(min = 20, max = 4000) private String message;\n    @NotNull private FeedbackCategory category; // SUGGESTION, COMPLAINT, OTHER\n    @Email @Size(max = 254) private String contactEmail; // Optional\n    private Boolean allowContact = false;\n    private String captchaToken; // Required for Guest\n}\n\npublic class SubmitFeedbackResponse {\n    private UUID id;\n    private String receiptToken;\n    private String subject;\n    private FeedbackCategory category;\n    private FeedbackStatus status; // Always NEW on creation\n    private Instant createdAt;\n}"
              }
            ],
            testCases: [
              {
                id: "tc-feed-submit-01",
                title: "Verify anonymous Guest can submit feedback successfully",
                type: "api",
                precondition: "No Authorization headers passed.",
                steps: [
                  "Dispatch a Guest payload with valid CAPTCHA and Idempotency-Key to POST /api/support/feedbacks.",
                  "Verify the HTTP response code evaluates to 201 Created."
                ],
                expectedResult: "System stores the data with submitter_id bound as NULL and status NEW, then returns a receipt token in the standard success wrapper.",
                status: "not_started"
              },
              {
                id: "tc-feed-submit-02",
                title: "Verify authenticated Driver submission binds user_id correctly",
                type: "api",
                precondition: "Valid Driver JWT token is provided in the Authorization header.",
                steps: [
                  "Send POST /api/support/feedbacks with a valid Bearer token and Idempotency-Key.",
                  "Check the persisted database record."
                ],
                expectedResult: "Returns 201 Created. The database record has user_id correctly bound to the Driver's user ID extracted from JWT claims.",
                status: "not_started"
              },
              {
                id: "tc-feed-submit-03",
                title: "Verify validation filters intercept malformed request parameters",
                type: "api",
                precondition: "Request body carries empty parameters.",
                steps: [
                  "Trigger POST /api/support/feedbacks with an invalid subject and a valid Idempotency-Key.",
                  "Inspect HTTP status returns."
                ],
                expectedResult: "Intercepted by middleware, returning 400 Bad Request alongside the explicit errors array with field-level error messages.",
                status: "not_started"
              },
              {
                id: "tc-feed-submit-04",
                title: "Verify invalid email format is rejected",
                type: "api",
                precondition: "Request body contains malformed email string.",
                steps: [
                  "Send POST /api/support/feedbacks with contactEmail set to 'not-an-email'."
                ],
                expectedResult: "Returns 400 Bad Request with error message 'Invalid email format.'",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-feed-submit-01", content: "API contract matches the standard global response format ApiResponse<T>.", checked: false },
              { id: "dc-feed-submit-02", content: "Only anonymous POST /api/support/feedbacks is permitted without JWT, and it requires valid CAPTCHA, rate-limit, and Idempotency-Key checks.", checked: false },
              { id: "dc-feed-submit-03", content: "Functional validations protect subject, message, category, contactEmail, and server-derived submitter identity.", checked: false },
              { id: "dc-feed-submit-04", content: "Status is always set to NEW on creation regardless of client input.", checked: false },
              { id: "dc-feed-submit-05", content: "Guest submissions store user_id as NULL; authenticated Driver submissions bind user_id from JWT.", checked: false },
              { id: "dc-feed-submit-06", content: "No sensitive data or internal stack traces are exposed in error responses.", checked: false }
            ]
          },
          {
            id: "leaf-feed-list",
            title: "Feedback Management List",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            status: "ready",
            priority: "medium",
            tags: ["admin", "feedback", "list", "paginated"],
            summary: "Administrative dashboard endpoint for Managers and Administrators to fetch, filter, and paginate through historical user feedback collections.",
            ownerService: "Spring Boot Support API",
            endpoints: ["GET /api/support/admin/feedbacks"],
            objective: "Provides an administrative dashboard querying layout for Managers and Administrators to fetch, view, filter, and paginate through historical user feedback collections seamlessly.",
            inScope: [
              "Implement a paginated list API query routine leveraging built-in repository components.",
              "Add optional filter variables: filtering records matching status strings and classification categories."
            ],
            outOfScope: [
              "Compilation or creation of complex workbook file formats (e.g., spreadsheet downloads). This falls within dedicated micro-reporting endpoints."
            ],
            permissions: [
              { role: "Manager", permission: "Authorized - Permitted to scan, look up, and query paginated feedback records." },
              { role: "Admin", permission: "Authorized - Complete querying privileges across feedback data collections." }
            ],
            businessRules: [
              "Analytical, reporting, and read-heavy operations belong directly to the Spring Boot Support API implementation.",
              "If no specific order criteria are submitted by client components, the dataset must sort descending based on creation dates (created_at DESC).",
              "Data payload results must use a standardized paginated response schema with page metadata and an asOf snapshot timestamp."
            ],
            dbExistingTables: ["support_feedbacks", "users"],
            dbRelationships: ["Projection lookups may resolve submitter identity, but anonymous contact data is never returned in the list view."],
            validationRules: [
              { field: "page", rule: "Integer type, minimum value of 1", errorMessage: "Page index must be greater than or equal to 1." },
              { field: "pageSize", rule: "Integer type, range bounded between 1 and 100", errorMessage: "Page size must be between 1 and 100." },
              { field: "status", rule: "Optional. If provided, must be one of: NEW, IN_REVIEW, RESPONDED, CLOSED, REJECTED, ARCHIVED", errorMessage: "Invalid status filter value." },
              { field: "category", rule: "Optional. If provided, must be one of: SUGGESTION, COMPLAINT, OTHER", errorMessage: "Invalid category filter value." }
            ],
            securityRules: [
              "Enforce strict token parsing validation routines via your security filter configuration.",
              "Block users with lower permissions (e.g., DRIVER, STAFF) with a 403 Forbidden status if they try to access administrative boundaries."
            ],
            logEvents: [
              "Basic info logs summarizing runtime metrics, filter properties used, and executing admin contexts."
            ],
            noLogEvents: [
              "Plaintext session variables, secret keys, or authentication signature hashes."
            ],
            integrationPoints: [
              { system: "Shared PostgreSQL Database", responsibility: "Executes read operations directly against the shared PostgreSQL database backend." }
            ],
            uiPage: "/admin/feedbacks",
            uiComponents: "FeedbackListPage (src/pages/admin), Status Filter Dropdown, Category Filter Dropdown, Paginated Data Table, Feedback Row Items",
            uiStateLoading: "Show skeleton rows in the table while fetching data.",
            uiStateEmpty: "Display empty state message: 'No feedback records found matching the selected filters.'",
            uiStateError: "Display error banner: 'Failed to load feedback list. Please try again.'",
            uiStateSuccess: "Render paginated table with feedback records, filter controls, and pagination controls.",
            notes: "Default sort order is created_at DESC. Supports optional query params: status, category, page, pageSize.",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-feedback-list",
                name: "GET /api/support/admin/feedbacks",
                content: `Method: GET
Path: /api/support/admin/feedbacks
Query Parameters (Optional): status=NEW&category=COMPLAINT&page=1&pageSize=10
Headers:
  Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "subject": "Ham B1 quet the qua cham",
        "category": "COMPLAINT",
        "submitterType": "GUEST",
        "status": "NEW",
        "createdAt": "2026-07-07T15:30:00Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "subject": "Gia gui xe cao hon thong bao",
        "category": "COMPLAINT",
        "submitterType": "DRIVER",
        "status": "RESPONDED",
        "createdAt": "2026-07-06T10:00:00Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "subject": "Den tang B2 khong sang",
        "category": "SUGGESTION",
        "submitterType": "GUEST",
        "status": "IN_REVIEW",
        "createdAt": "2026-07-05T08:45:00Z"
      }
    ],
    "page": 1,
    "pageSize": 10,
    "totalItems": 3,
    "totalPages": 1,
    "asOf": "2026-07-07T16:00:00Z"
  },
  "errors": null,
  "timestamp": "2026-07-07T16:00:00Z"
}

Response (403 Forbidden - Insufficient Role):
{
  "success": false,
  "message": "ACCESS_DENIED",
  "data": null,
  "errors": "You do not have permission to access this resource.",
  "timestamp": "2026-07-07T16:00:00Z"
}`
              }
            ],
            dataContracts: [
              {
                id: "data-contract-feedback-list-item",
                name: "FeedbackListItemDto (Java DTO)",
                content: "public class FeedbackListItemDto {\n    private UUID id;\n    private String subject;\n    private FeedbackCategory category;\n    private SubmitterType submitterType;\n    private FeedbackStatus status;\n    private Instant createdAt;\n    // getters and setters\n}\n\n// Uses standard paginated wrapper:\n// ApiResponse<PagedResponse<FeedbackListItemDto>>\n// Where PagedResponse contains: items, page, pageSize, totalItems, totalPages, asOf"
              }
            ],
            testCases: [
              {
                id: "tc-feed-list-01",
                title: "Verify authorized client (Manager) can fetch list data safely",
                type: "api",
                precondition: "Passing valid authorization credentials mapping back to a Manager role.",
                steps: [
                  "Trigger runtime invocation against GET /api/support/admin/feedbacks?page=1&pageSize=10.",
                  "Inspect HTTP result status."
                ],
                expectedResult: "API serves an HTTP 200 code alongside a paginated payload envelope containing an items collection, page, pageSize, totalItems, totalPages.",
                status: "not_started"
              },
              {
                id: "tc-feed-list-02",
                title: "Verify lower role tiers are prevented from executing admin list lookups",
                type: "api",
                precondition: "Bearer token carries a Driver role configuration.",
                steps: [
                  "Call the administrative list endpoint GET /api/support/admin/feedbacks.",
                  "Capture error payload structures."
                ],
                expectedResult: "Security layers abort execution early, throwing a 403 Forbidden response wrapper.",
                status: "not_started"
              },
              {
                id: "tc-feed-list-03",
                title: "Verify status filter returns only matching records",
                type: "api",
                precondition: "Database has feedbacks with both NEW and RESPONDED statuses.",
                steps: [
                  "Call GET /api/support/admin/feedbacks?status=NEW with valid Manager token.",
                  "Inspect the items array."
                ],
                expectedResult: "Returns only feedback records with status=NEW and includes an asOf timestamp for the response snapshot.",
                status: "not_started"
              },
              {
                id: "tc-feed-list-04",
                title: "Verify default sort order is created_at DESC",
                type: "api",
                precondition: "Multiple feedback records exist with different creation dates.",
                steps: [
                  "Call GET /api/support/admin/feedbacks without any sort parameter."
                ],
                expectedResult: "Items are ordered from newest to oldest (created_at DESC).",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-feed-list-01", content: "Data collection layout complies with the standard formatting architecture (items, page, pageSize, totalItems, totalPages).", checked: false },
              { id: "dc-feed-list-02", content: "Security rules successfully isolate the dataset boundaries - only MANAGER and ADMIN roles can access.", checked: false },
              { id: "dc-feed-list-03", content: "Optional filter by status and category works correctly.", checked: false },
              { id: "dc-feed-list-04", content: "Default sort order is created_at DESC when no sort param is specified.", checked: false },
              { id: "dc-feed-list-05", content: "Pagination parameters (page, pageSize) are validated with proper error messages.", checked: false }
            ]
          },
          {
            id: "leaf-feed-detail",
            title: "Feedback Detail",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            status: "ready",
            priority: "medium",
            tags: ["admin", "feedback", "detail", "read-only"],
            summary: "Fetches the complete granular detail blocks of a single feedback submission record using its unique database identifier key to allow targeted issue investigation.",
            ownerService: "Spring Boot Support API",
            endpoints: ["GET /api/support/admin/feedbacks/{id}"],
            objective: "Fetches the complete granular detail blocks of a single feedback submission record using its unique database identifier key to allow targeted issue investigation.",
            inScope: [
              "Look up and return a distinct entry from support_feedbacks via its UUID.",
              "Return immutable submission fields together with the current lifecycle state, response, assignment, and version."
            ],
            outOfScope: [
              "Execution of write operations, status updates, or changes to text blocks."
            ],
            permissions: [
              { role: "Manager", permission: "Authorized - Allowed to query detailed records for resolution workflows." },
              { role: "Admin", permission: "Authorized - Complete access privileges across granular feedback properties." }
            ],
            businessRules: [
              "Missing resource errors are handled gracefully by returning an HTTP 404 response matching the project standard.",
              "Feedback identifiers use UUID values consistently across routes, DTOs, history, and audit records.",
              "If the target resource does not exist, throw a specific exception that maps to a FEEDBACK_NOT_FOUND business error code."
            ],
            dbExistingTables: ["support_feedbacks", "support_feedback_history", "users"],
            dbRelationships: ["Safely supports a null submitterId for guest submissions; resolve optional assigned/acting users without exposing private account fields."],
            validationRules: [
              { field: "id", rule: "Path parameter must be a valid UUID", errorMessage: "Invalid feedback ID." }
            ],
            securityRules: [
              "Enforce token verification layers before granting access to this endpoint.",
              "Restrict access to roles matching MANAGER or ADMIN."
            ],
            logEvents: [
              "Basic informational application tracing logs recording details of read access events."
            ],
            noLogEvents: [
              "Bearer credentials or cryptographic state tokens."
            ],
            integrationPoints: [
              { system: "Shared PostgreSQL Database", responsibility: "Executes straightforward data retrieval routines against the shared PostgreSQL storage." }
            ],
            uiPage: "/admin/feedbacks/{id}",
            uiComponents: "FeedbackDetailModal (inside admin views), Subject/Message display, Category Badge, Status Badge, Response and assignment section, Lifecycle History, Timestamps",
            uiStateLoading: "Show skeleton layout inside the modal while fetching detail data.",
            uiStateEmpty: "N/A - this is a detail view accessed via ID.",
            uiStateError: "Display error message: 'Feedback record not found or failed to load.'",
            uiStateSuccess: "Render all feedback detail fields in a structured read-only layout inside the modal.",
            notes: "response is null until RESPONDED. Guest submissions have submitterId=null; contact data remains masked unless explicitly authorized.",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-feedback-detail",
                name: "GET /api/support/admin/feedbacks/{id}",
                content: `Method: GET
Path: /api/support/admin/feedbacks/550e8400-e29b-41d4-a716-446655440000
Headers:
  Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "submitterId": null,
    "subject": "Ham B1 quet the qua cham",
    "message": "He thong nhan dien bien so tai ham B1 mat hon 2 phut luc cao diem 18h ngay 05/07.",
    "category": "COMPLAINT",
    "status": "NEW",
    "response": null,
    "assignmentId": null,
    "version": 1,
    "createdAt": "2026-07-07T15:30:00Z",
    "updatedAt": "2026-07-07T15:30:00Z"
  },
  "errors": null,
  "timestamp": "2026-07-07T16:15:00Z"
}

Response (404 Not Found - Feedback Does Not Exist):
{
  "success": false,
  "message": "Feedback not found.",
  "data": null,
  "errors": [
    {
      "field": "id",
      "message": "FEEDBACK_NOT_FOUND"
    }
  ],
  "timestamp": "2026-07-07T16:15:02Z"
}

Response (403 Forbidden - Insufficient Role):
{
  "success": false,
  "message": "ACCESS_DENIED",
  "data": null,
  "errors": "You do not have permission to access this resource.",
  "timestamp": "2026-07-07T16:15:02Z"
}`
              }
            ],
            dataContracts: [
              {
                id: "data-contract-feedback-detail-dto",
                name: "FeedbackDetailDto (Java DTO)",
                content: "public class FeedbackDetailDto {\n    private UUID id;\n    private UUID submitterId;       // Null for Guest submissions\n    private String subject;\n    private String message;\n    private FeedbackCategory category;\n    private FeedbackStatus status;   // NEW, IN_REVIEW, RESPONDED, CLOSED, REJECTED, ARCHIVED\n    private String response;         // Null until RESPONDED\n    private Long version;\n    private Instant createdAt;\n    private Instant updatedAt;\n}"
              }
            ],
            testCases: [
              {
                id: "tc-feed-detail-01",
                title: "Verify target feedback entry maps to correct properties upon fetch",
                type: "api",
                precondition: "Target entry with UUID 550e8400-e29b-41d4-a716-446655440000 exists within the current database snapshot.",
                steps: [
                  "Trigger lookup request to GET /api/support/admin/feedbacks/550e8400-e29b-41d4-a716-446655440000 using valid Manager credentials.",
                  "Assert HTTP response status code evaluates to 200."
                ],
                expectedResult: "Returns the detailed data model correctly wrapped inside the standard response structure with id, submitterId, subject, message, category, status, response, assignment, version, and timestamps.",
                status: "not_started"
              },
              {
                id: "tc-feed-detail-02",
                title: "Verify system returns clear error structure on querying missing entries",
                type: "api",
                precondition: "Identifier used does not map to any active records.",
                steps: [
                  "Call detail API endpoint passing a large index value like 999999.",
                  "Inspect the JSON body structure returned."
                ],
                expectedResult: "System responds with a 404 Not Found error status code alongside the custom error message FEEDBACK_NOT_FOUND.",
                status: "not_started"
              },
              {
                id: "tc-feed-detail-03",
                title: "Verify DRIVER role cannot access feedback detail endpoint",
                type: "api",
                precondition: "Bearer token carries a Driver role.",
                steps: [
                  "Call GET /api/support/admin/feedbacks/550e8400-e29b-41d4-a716-446655440000 with a Driver JWT token."
                ],
                expectedResult: "Returns 403 Forbidden. Access is blocked by the security filter.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-feed-detail-01", content: "Path variable bindings reject malformed feedback UUIDs with the standard validation error wrapper.", checked: false },
              { id: "dc-feed-detail-02", content: "Missing records return a 404 status code with FEEDBACK_NOT_FOUND error code, matching the project's standard global architecture error wrapper.", checked: false },
              { id: "dc-feed-detail-03", content: "Access restricted to MANAGER and ADMIN roles only.", checked: false },
              { id: "dc-feed-detail-04", content: "Guest submissions return submitterId=null and response remains null until the record reaches RESPONDED.", checked: false }
            ]
          },
          {
            id: "leaf-feed-update",
            title: "Feedback Status Update",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            status: "ready",
            priority: "medium",
            tags: ["admin", "feedback", "status", "write", "audit"],
            summary: "Enables managers to move a feedback record through the canonical lifecycle (NEW, IN_REVIEW, RESPONDED, CLOSED, REJECTED) with an auditable official response.",
            ownerService: "Spring Boot Support API",
            endpoints: ["PUT /api/support/admin/feedbacks/{id}"],
            objective: "Enables managers to perform valid lifecycle transitions and retain the response, assignment, version, history, and audit trail for each feedback record.",
            inScope: [
              "Mutate support_feedbacks using an optimistic version check; store status, staff response, assignment, and terminal reason where applicable.",
              "Validate the permitted transition before writing the new lifecycle state.",
              "Write feedback history and audit entries in the same transaction; dispatch notification events only after the database commit succeeds."
            ],
            outOfScope: [
              "Modifying the original description or title text provided by the user."
            ],
            permissions: [
              { role: "Manager", permission: "Authorized - Allowed to add resolution remarks and transition tracking states." },
              { role: "Admin", permission: "Authorized - Complete permission to modify state properties and manage records." }
            ],
            businessRules: [
              "All administrative modifications must create a feedback-history and audit entry.",
              "Allowed states are NEW, IN_REVIEW, RESPONDED, CLOSED, REJECTED, and ARCHIVED; the service must reject invalid or unauthorized transitions.",
              "A non-blank response is required when moving to RESPONDED; a rejection reason is required when moving to REJECTED.",
              "The request must supply the current version; a stale version returns a conflict without overwriting newer work.",
              "All updates, history, and audit writes execute in one database transaction; notification delivery is post-commit and retryable."
            ],
            dbExistingTables: ["support_feedbacks", "support_feedback_history", "support_audit_logs", "notifications"],
            dbRelationships: [
              "support_feedbacks.assigned_to references users.id; the acting user is derived from JWT and stored in the history/audit records.",
              "support_feedback_history records the from/to state, response, actor, and timestamp for each accepted transition.",
              "support_audit_logs entry: action='FEEDBACK_STATUS_CHANGED', source_service='SUPPORT_API', actor_user_id=<manager_id>"
            ],
            validationRules: [
              { field: "status", rule: "Must be an allowed next state from NEW, IN_REVIEW, RESPONDED, CLOSED, REJECTED, ARCHIVED", errorMessage: "Invalid feedback status transition." },
              { field: "version", rule: "Required positive integer matching the current row version", errorMessage: "Feedback was changed by another user. Refresh and retry." },
              { field: "response", rule: "Required and non-blank when status is RESPONDED", errorMessage: "A response is required before marking feedback RESPONDED." },
              { field: "reason", rule: "Required and non-blank when status is REJECTED or a terminal record is reopened", errorMessage: "A reason is required for this transition." },
              { field: "assignmentId", rule: "Optional UUID of an active STAFF or MANAGER user; null unassigns", errorMessage: "Assignee must be an active Staff or Manager." }
            ],
            securityRules: [
              "Extract the managing actor's identifier directly from verified JWT claims (sub property mapped to a numeric key) instead of using variables submitted via request bodies.",
              "Restrict access to roles matching MANAGER or ADMIN only."
            ],
            logEvents: [
              "On success, write feedback history and a support_audit_logs record with action=FEEDBACK_STATUS_CHANGED; publish any notification only after commit and retry failures."
            ],
            noLogEvents: [
              "Plaintext system tokens or authorization secrets."
            ],
            integrationPoints: [
              { system: "Shared PostgreSQL Database", responsibility: "Modifies the shared PostgreSQL database state directly, ensuring updates are immediately visible to related services." },
              { system: "audit_logs table", responsibility: "Receives append-only audit entries recording each status transition with manager user_id and timestamp." }
            ],
            uiPage: "/admin/feedbacks",
            uiComponents: "FeedbackListPage lifecycle controls, Status Update Modal with response/rejection reason fields, version token, Confirm/Cancel buttons",
            uiStateLoading: "Disable action buttons and show spinner while the PUT request is in progress.",
            uiStateEmpty: "N/A - this is a write operation triggered from the list/detail view.",
            uiStateError: "Display error toast: 'Failed to update feedback status. Please try again.'",
            uiStateSuccess: "Show success toast: 'Feedback status updated successfully.' and refresh the feedback list/detail to reflect the new status.",
            notes: "The acting user is derived from JWT claims, never from the request body. The transactional boundary covers support_feedbacks, history, and audit; notification dispatch is post-commit.",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-feedback-status-update",
                name: "PUT /api/support/admin/feedbacks/{id}",
                content: `Method: PUT
Path: /api/support/admin/feedbacks/12
Headers:
  Authorization: Bearer <token>
  Idempotency-Key: <uuid>
  Content-Type: application/json

Request Body:
{
  "status": "RESPONDED",
  "response": "Da dieu phoi doi ky thuat bai xe xuong kiem tra lai bang dien tu tang B2 va cau hinh lai thiet bi hien thi chinh xac.",
  "reason": null,
  "closureNote": null,
  "assignmentId": "550e8400-e29b-41d4-a716-446655440008",
  "version": 3
}

Response (200 OK):
{
  "success": true,
  "message": "FEEDBACK_STATUS_UPDATED_SUCCESSFULLY",
  "data": {
    "id": 12,
    "status": "RESPONDED",
    "respondedAt": "2026-07-07T23:30:00Z",
    "respondedBy": "550e8400-e29b-41d4-a716-446655440001",
    "version": 4,
    "updatedAt": "2026-07-07T23:30:00Z",
    "historyEntry": { "previousStatus": "IN_REVIEW", "newStatus": "RESPONDED" }
  },
  "errors": null,
  "timestamp": "2026-07-07T23:30:00Z"
}

Response (400 Bad Request - Missing response):
{
  "success": false,
  "message": "Validation failed.",
  "data": null,
  "errors": [
    {
      "field": "response",
      "message": "A response is required before marking feedback RESPONDED."
    }
  ],
  "timestamp": "2026-07-07T23:30:05Z"
}

Response (400 Bad Request - Invalid Status):
{
  "success": false,
  "message": "Validation failed.",
  "data": null,
  "errors": [
    {
      "field": "status",
      "message": "Invalid feedback status transition."
    }
  ],
  "timestamp": "2026-07-07T23:30:05Z"
}

Response (404 Not Found):
{
  "success": false,
  "message": "Feedback not found.",
  "data": null,
  "errors": [
    {
      "field": "id",
      "message": "FEEDBACK_NOT_FOUND"
    }
  ],
  "timestamp": "2026-07-07T23:30:05Z"
}`
              }
            ],
            dataContracts: [
              {
                id: "data-contract-feedback-status-update-request",
                name: "UpdateFeedbackRequest & Response (Java DTO)",
                content: "public class UpdateFeedbackRequest {\n    @NotNull private FeedbackStatus status; // valid next lifecycle state\n    private String response; // required for RESPONDED\n    private String reason; // required for REJECTED and reopen\n    private String closureNote; // optional for CLOSED\n    private UUID assignmentId; // active Staff or Manager; null unassigns\n    @NotNull @Positive private Long version;\n}\n\npublic class UpdateFeedbackResponse {\n    private UUID id;\n    private FeedbackStatus status;\n    private Long version;\n    private Instant updatedAt;\n    private FeedbackHistoryDto historyEntry;\n}\n\n// history and support_audit_logs entries are written in the transaction;\n// notification dispatch occurs only after a successful commit.\n// action = 'FEEDBACK_STATUS_CHANGED'\n// source_service = 'SUPPORT_API'\n// actor_user_id = <manager_id from JWT>\n// entity_type = 'support_feedbacks'\n// entity_id = <feedback_id>"
              }
            ],
            testCases: [
              {
                id: "tc-feed-update-01",
                title: "Verify Manager can update feedback status to RESPONDED successfully",
                type: "api",
                precondition: "Target row with id=12 currently carries an IN_REVIEW status value and version=3.",
                steps: [
                  "Call PUT /api/support/admin/feedbacks/12 passing valid manager credentials, a 'RESPONDED' status string, a response, and version=3.",
                  "Verify the HTTP response status returns 200 OK."
                ],
                expectedResult: "Database fields update correctly (status=RESPONDED, response filled, updatedByUserId from JWT, version=4) and history/audit entries are written.",
                status: "not_started"
              },
              {
                id: "tc-feed-update-02",
                title: "Verify update fails if required explanation parameters are omitted",
                type: "api",
                precondition: "The request contains an empty explanation note.",
                steps: [
                  "Call the update endpoint passing a 'RESPONDED' status string but leaving the response field blank.",
                  "Inspect the returned HTTP status code."
                ],
                expectedResult: "Validation layers block execution, returning an HTTP 400 Bad Request error with field error on response.",
                status: "not_started"
              },
              {
                id: "tc-feed-update-03",
                title: "Verify invalid status value is rejected",
                type: "api",
                precondition: "Request body contains an invalid status string.",
                steps: [
                  "Call PUT /api/support/admin/feedbacks/12 with status='PENDING' and the current version."
                ],
                expectedResult: "Returns 400 Bad Request with error message 'Invalid feedback status transition.'",
                status: "not_started"
              },
              {
                id: "tc-feed-update-04",
                title: "Verify audit log entry is created on successful status update",
                type: "integration",
                precondition: "Target feedback exists with IN_REVIEW status and a current version.",
                steps: [
                  "Call PUT /api/support/admin/feedbacks/12 with RESPONDED, a response, and the current version.",
                  "Query support_feedback_history and support_audit_logs after the update."
                ],
                expectedResult: "New rows exist in support_feedback_history and support_audit_logs with action=FEEDBACK_STATUS_CHANGED and actor_user_id matching the Manager's ID.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-feed-update-01", content: "State modifications update support_feedbacks atomically with status, response/reason, assignment, version, and updated_at.", checked: false },
              { id: "dc-feed-update-02", content: "Every accepted transition writes feedback history and a central support audit entry.", checked: false },
              { id: "dc-feed-update-03", content: "Only valid lifecycle transitions among NEW, IN_REVIEW, RESPONDED, CLOSED, REJECTED, and ARCHIVED are accepted.", checked: false },
              { id: "dc-feed-update-04", content: "response is required for RESPONDED; reason is required for REJECTED and reopening a terminal record.", checked: false },
              { id: "dc-feed-update-05", content: "Actor identity is populated from JWT claims, not from request body.", checked: false },
              { id: "dc-feed-update-06", content: "A stale version returns a conflict and cannot overwrite another manager's update.", checked: false },
              { id: "dc-feed-update-07", content: "support_feedbacks, history, and audit writes are wrapped in one @Transactional block; notification dispatch occurs after commit.", checked: false }
            ]
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
            status: "ready",
            priority: "medium",
            tags: ["notification", "list", "paginated", "read-only"],
            summary: "Provides a paginated retrieval API for authenticated users to fetch their own historical notification streams. User identity is securely resolved from the validated JWT token context.",
            ownerService: "Spring Boot Support API",
            endpoints: ["GET /api/notifications"],
            objective: "Provides a paginated retrieval API for authenticated users (Drivers, Staff, Managers, Admins) to fetch their own historical notification streams. The user identity is securely resolved directly from the validated JWT token context.",
            inScope: [
              "Query notification rows from the shared PostgreSQL database belonging exclusively to the authenticated user.",
              "Support standard project pagination attributes starting at page index 0.",
              "Allow optional filtering by notification attributes: type, priority, and is_read.",
              "Supported notification types: MONTHLY_PASS, PAYMENT, RESERVATION, PARKING_SESSION, SYSTEM, FEEDBACK.",
              "Supported priority tiers: LOW, MEDIUM, HIGH."
            ],
            outOfScope: [
              "Real-time notification push broadcasting or live WebSocket updates.",
              "Querying notification records belonging to other users."
            ],
            permissions: [
              { role: "Driver", permission: "Authorized - Allowed to query and view only their own notification history stream." },
              { role: "Staff", permission: "Authorized - Allowed to query and view only their own notification history stream." },
              { role: "Manager", permission: "Authorized - Allowed to query and view only their own notification history stream." },
              { role: "Admin", permission: "Authorized - Allowed to query and view only their own notification history stream." }
            ],
            businessRules: [
              "This support and read-centric aggregation operation is handled by the Spring Boot Support API. All APIs must wrap responses inside the standardized project envelope using a consistent success/error layout.",
              "Pagination requests are zero-indexed (page=0).",
              "If no sorting parameters are submitted, the results must sort descending by creation date (created_at DESC).",
              "Cross-user data access is strictly forbidden; no actor can view notification streams belonging to another account identifier."
            ],
            dbExistingTables: ["notifications"],
            dbRelationships: ["notifications.user_id links directly to the users.id primary identifier."],
            validationRules: [
              { field: "page", rule: "Query parameter; integer value >= 0", errorMessage: "Page index must be greater than or equal to 0." },
              { field: "pageSize", rule: "Query parameter; integer range bounded between 1 and 100", errorMessage: "Page size must be between 1 and 100." },
              { field: "type", rule: "Optional. Must be one of: MONTHLY_PASS, PAYMENT, RESERVATION, PARKING_SESSION, SYSTEM, FEEDBACK", errorMessage: "Invalid notification type filter." },
              { field: "priority", rule: "Optional. Must be one of: LOW, MEDIUM, HIGH", errorMessage: "Invalid priority filter." },
              { field: "isRead", rule: "Optional. Boolean true or false", errorMessage: "Invalid isRead filter value." }
            ],
            securityRules: [
              "Extract the target user's identifier directly from the parsed cryptographic claims (sub or appropriate claim mapping) inside the verified JWT token.",
              "Completely isolate database search executions to match only rows where user_id matches the authenticated subject key."
            ],
            logEvents: [
              "Application request metrics tracking active request inputs, filter counts, processing duration, and final response indicators."
            ],
            noLogEvents: [
              "Plaintext authorization keys, signatures, or raw session parameters."
            ],
            integrationPoints: [
              { system: "Shared PostgreSQL Database", responsibility: "Executes read operations directly against the shared PostgreSQL storage instance." }
            ],
            uiPage: "/notifications",
            uiComponents: "Notification List Page, Type Filter Tabs, Priority Filter Dropdown, isRead Filter Toggle, Paginated Notification Card List",
            uiStateLoading: "Show skeleton notification cards while data is loading.",
            uiStateEmpty: "Show empty state: 'You have no notifications yet.'",
            uiStateError: "Display error banner: 'Failed to load notifications. Please try again.'",
            uiStateSuccess: "Render paginated notification cards grouped by date, showing title, content, type badge, priority badge, and read/unread indicator.",
            notes: "Pagination is zero-indexed (page=0). No updated_at field exists in the notifications table. User identity is always resolved from JWT claims, never from query parameters.",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-user-notifications",
                name: "GET /api/notifications",
                content: `Method: GET
Path: /api/notifications
Query Parameters (Optional): page=0&pageSize=10&type=RESERVATION&priority=HIGH&isRead=false
Headers:
  Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "message": "OK",
  "data": {
    "content": [
      {
        "id": 501,
        "userId": 45,
        "title": "Reservation Confirmed",
        "content": "Your reservation for Slot A-12 is successful.",
        "type": "RESERVATION",
        "priority": "HIGH",
        "isRead": false,
        "createdAt": "2026-07-07T14:20:00Z"
      },
      {
        "id": 498,
        "userId": 45,
        "title": "Monthly Pass Expiring Soon",
        "content": "Your monthly parking pass will expire in 3 days. Please renew to avoid interruption.",
        "type": "MONTHLY_PASS",
        "priority": "MEDIUM",
        "isRead": false,
        "createdAt": "2026-07-06T09:00:00Z"
      },
      {
        "id": 495,
        "userId": 45,
        "title": "Payment Successful",
        "content": "Your parking payment of 20,000 VND has been processed successfully.",
        "type": "PAYMENT",
        "priority": "LOW",
        "isRead": true,
        "createdAt": "2026-07-05T17:30:00Z"
      },
      {
        "id": 490,
        "userId": 45,
        "title": "System Maintenance Notice",
        "content": "The parking system will undergo scheduled maintenance on 2026-07-10 from 02:00 to 04:00.",
        "type": "SYSTEM",
        "priority": "HIGH",
        "isRead": true,
        "createdAt": "2026-07-04T08:00:00Z"
      }
    ],
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 4,
    "totalPages": 1,
    "last": true
  },
  "errors": null,
  "timestamp": "2026-07-07T14:22:00Z"
}

Response (401 Unauthorized - Missing or Invalid Token):
{
  "success": false,
  "message": "UNAUTHORIZED",
  "data": null,
  "errors": "Authentication token is missing or invalid.",
  "timestamp": "2026-07-07T14:22:00Z"
}`
              }
            ],
            dataContracts: [
              {
                id: "data-contract-notification-dto",
                name: "NotificationDto (Java DTO)",
                content: "public class NotificationDto {\n    private Long id;\n    private Long userId;\n    private String title;\n    private String content;\n    private String type;     // MONTHLY_PASS, PAYMENT, RESERVATION, PARKING_SESSION, SYSTEM, FEEDBACK\n    private String priority; // LOW, MEDIUM, HIGH\n    private Boolean isRead;\n    private Instant createdAt;\n    // NOTE: No updatedAt field - this column does not exist in the notifications table\n    // getters and setters\n}\n\n// Uses Spring PagedResponse wrapper:\n// ApiResponse<PagedResponse<NotificationDto>>\n// PagedResponse fields: content, pageNumber, pageSize, totalElements, totalPages, last\n// Repository method: findByUserId(Long userId, Pageable pageable)"
              }
            ],
            testCases: [
              {
                id: "tc-notif-user-01",
                title: "Verify authorized user can fetch their own notifications successfully",
                type: "api",
                precondition: "User is authenticated with a valid token. Database has notifications linked to their user_id.",
                steps: [
                  "Invoke endpoint GET /api/notifications?page=0&pageSize=10 with proper authorization headers.",
                  "Inspect the HTTP status results and body wrappers."
                ],
                expectedResult: "System responds with 200 OK and serves a compliant PagedResponse with content, pageNumber, pageSize, totalElements, totalPages, and last fields. All returned notifications belong to the authenticated user.",
                status: "not_started"
              },
              {
                id: "tc-notif-user-02",
                title: "Verify query defaults are active when page parameters are omitted",
                type: "api",
                precondition: "User is authenticated.",
                steps: [
                  "Trigger query request against GET /api/notifications without supplying page metrics.",
                  "Evaluate the values assigned to pageNumber and pageSize inside the response metadata block."
                ],
                expectedResult: "System gracefully applies defaults (pageNumber=0, pageSize=10) and executes successfully with 200 OK.",
                status: "not_started"
              },
              {
                id: "tc-notif-user-03",
                title: "Verify type filter returns only notifications of the specified type",
                type: "api",
                precondition: "User has notifications of multiple types (RESERVATION, PAYMENT, SYSTEM).",
                steps: [
                  "Call GET /api/notifications?type=RESERVATION with valid token.",
                  "Inspect the content array."
                ],
                expectedResult: "All returned notifications have type=RESERVATION. No other types appear.",
                status: "not_started"
              },
              {
                id: "tc-notif-user-04",
                title: "Verify user cannot access another user's notifications",
                type: "api",
                precondition: "Notifications exist for user_id=45 but the token belongs to user_id=99.",
                steps: [
                  "Call GET /api/notifications with token of user 99."
                ],
                expectedResult: "Returns only notifications belonging to user 99. Notifications of user 45 are never included.",
                status: "not_started"
              },
              {
                id: "tc-notif-user-05",
                title: "Verify results are sorted newest first (created_at DESC)",
                type: "api",
                precondition: "User has multiple notifications with different creation dates.",
                steps: [
                  "Call GET /api/notifications without sort parameter."
                ],
                expectedResult: "Items in the content array are ordered from most recent to oldest based on createdAt.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-notif-user-01", content: "Output layout strictly adheres to the project's native PagedResponse structure (content, pageNumber, pageSize, totalElements, totalPages, last).", checked: false },
              { id: "dc-notif-user-02", content: "No updated_at attributes or references appear inside the data object.", checked: false },
              { id: "dc-notif-user-03", content: "Security context validation protects cross-user data bounds comprehensively.", checked: false },
              { id: "dc-notif-user-04", content: "Optional filters (type, priority, isRead) work correctly when provided.", checked: false },
              { id: "dc-notif-user-05", content: "Default sort order is created_at DESC when no sort param is specified.", checked: false },
              { id: "dc-notif-user-06", content: "Pagination is zero-indexed (page=0) as per Spring Data conventions.", checked: false }
            ]
          },
          {
            id: "leaf-notif-unread",
            title: "Unread Notifications",
            type: "leaf_feature",
            clients: ["Driver", "Staff", "Manager", "Admin"],
            status: "ready",
            priority: "medium",
            tags: ["notification", "unread", "paginated", "read-only"],
            summary: "Fetches the collection of unread notifications (is_read = false) belonging to the authenticated user. Powers badge numbers, real-time alert count synchronization, and unread dashboard indicators.",
            ownerService: "Spring Boot Support API",
            endpoints: ["GET /api/notifications/unread"],
            objective: "Fetches the collection of unread notifications (is_read = false) belonging to the authenticated user. This powers badge numbers, real-time alert count synchronization, and unread dashboard indicators.",
            inScope: [
              "Retrieve unread notification logs from the shared PostgreSQL database where is_read = false and user_id matches the authenticated caller.",
              "Support optional filtering criteria based on fields: type and priority.",
              "Paginate using zero-indexed properties (page=0) and sort with the newest alerts first (created_at DESC)."
            ],
            outOfScope: [
              "Mutating record properties or marking records as read."
            ],
            permissions: [
              { role: "Driver", permission: "Authorized - Can query only their own unread notifications." },
              { role: "Staff", permission: "Authorized - Can query only their own unread notifications." },
              { role: "Manager", permission: "Authorized - Can query only their own unread notifications." },
              { role: "Admin", permission: "Authorized - Can query only their own unread notifications." }
            ],
            businessRules: [
              "Managed by the Spring Boot Support API. Payloads must utilize the unified project response structure.",
              "Hardcode or filter the database query strategy to enforce is_read = false.",
              "Results default to page=0 and are sorted descending by date (created_at DESC).",
              "Cross-user data access is strictly forbidden."
            ],
            dbExistingTables: ["notifications"],
            dbRelationships: ["Follows standard data configurations connecting records back onto target user entities via user_id."],
            validationRules: [
              { field: "page", rule: "Minimum constraint value = 0", errorMessage: "Page index must be greater than or equal to 0." },
              { field: "pageSize", rule: "Integer constraint value bounded between 1 and 100", errorMessage: "Page size must be between 1 and 100." },
              { field: "type", rule: "Optional. Must be one of: MONTHLY_PASS, PAYMENT, RESERVATION, PARKING_SESSION, SYSTEM, FEEDBACK", errorMessage: "Invalid notification type filter." },
              { field: "priority", rule: "Optional. Must be one of: LOW, MEDIUM, HIGH", errorMessage: "Invalid priority filter." }
            ],
            securityRules: [
              "Enforce strict token extraction filters. Query parameters or path elements must not override the identity context extracted from the token.",
              "The repository query must explicitly link the database filter condition to the caller's verified user key."
            ],
            logEvents: [
              "Access logs recording processing metadata, execution durations, and basic output totals."
            ],
            noLogEvents: [
              "Plaintext signatures or authorization state variables."
            ],
            integrationPoints: [
              { system: "Shared PostgreSQL Database", responsibility: "Executes target data lookups directly against the shared PostgreSQL relational persistence layer." }
            ],
            uiPage: "/notifications/unread",
            uiComponents: "Unread Notification Badge Counter (header), Unread Notification Dropdown/Panel, Notification Card List with isRead=false filter enforced",
            uiStateLoading: "Show loading spinner in the notification badge area and skeleton cards in the panel.",
            uiStateEmpty: "Show: 'You are all caught up! No unread notifications.'",
            uiStateError: "Show error indicator in the badge area.",
            uiStateSuccess: "Render unread notification cards with title, content preview, type badge, priority badge, and formatted time. Badge shows totalElements count.",
            notes: "The is_read=false filter is always enforced server-side regardless of client parameters. No updated_at field exists in the notifications table. Repository method: findByUserIdAndIsReadFalse(Long userId, Pageable pageable).",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-unread-notifications",
                name: "GET /api/notifications/unread",
                content: `Method: GET
Path: /api/notifications/unread
Query Parameters (Optional): page=0&pageSize=10&type=RESERVATION&priority=HIGH
Headers:
  Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "message": "OK",
  "data": {
    "content": [
      {
        "id": 501,
        "userId": 45,
        "title": "Reservation Confirmed",
        "content": "Your reservation for Slot A-12 is successful.",
        "type": "RESERVATION",
        "priority": "HIGH",
        "isRead": false,
        "createdAt": "2026-07-07T14:20:00Z"
      },
      {
        "id": 498,
        "userId": 45,
        "title": "Monthly Pass Expiring Soon",
        "content": "Your monthly parking pass will expire in 3 days. Please renew to avoid interruption.",
        "type": "MONTHLY_PASS",
        "priority": "MEDIUM",
        "isRead": false,
        "createdAt": "2026-07-06T09:00:00Z"
      },
      {
        "id": 497,
        "userId": 45,
        "title": "Parking Session Started",
        "content": "Your vehicle has entered the parking facility. Session started at Gate A.",
        "type": "PARKING_SESSION",
        "priority": "LOW",
        "isRead": false,
        "createdAt": "2026-07-06T07:15:00Z"
      }
    ],
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 3,
    "totalPages": 1,
    "last": true
  },
  "errors": null,
  "timestamp": "2026-07-07T14:26:00Z"
}

Response (400 Bad Request - Invalid page parameter):
{
  "success": false,
  "message": "Validation failed.",
  "data": null,
  "errors": [
    {
      "field": "page",
      "message": "Page index must be greater than or equal to 0."
    }
  ],
  "timestamp": "2026-07-07T14:26:05Z"
}

Response (200 OK - No Unread Notifications):
{
  "success": true,
  "message": "OK",
  "data": {
    "content": [],
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 0,
    "totalPages": 0,
    "last": true
  },
  "errors": null,
  "timestamp": "2026-07-07T14:26:00Z"
}`
              }
            ],
            dataContracts: [
              {
                id: "data-contract-unread-notification-dto",
                name: "NotificationDto for Unread (Java DTO)",
                content: "// Reuses the same NotificationDto as the notification list.\n// is_read is always false in this context.\npublic class NotificationDto {\n    private Long id;\n    private Long userId;\n    private String title;\n    private String content;\n    private String type;     // MONTHLY_PASS, PAYMENT, RESERVATION, PARKING_SESSION, SYSTEM, FEEDBACK\n    private String priority; // LOW, MEDIUM, HIGH\n    private Boolean isRead;  // Always false in this endpoint\n    private Instant createdAt;\n    // NOTE: No updatedAt field\n    // getters and setters\n}\n\n// Repository declaration:\n// Page<Notification> findByUserIdAndIsReadFalse(Long userId, Pageable pageable);\n// Or with type/priority filter:\n// Page<Notification> findByUserIdAndIsReadFalseAndTypeAndPriority(Long userId, String type, String priority, Pageable pageable);"
              }
            ],
            testCases: [
              {
                id: "tc-notif-unread-01",
                title: "Verify user can load unread notification entries successfully",
                type: "api",
                precondition: "User token context maps to an active account with unread elements (is_read=false).",
                steps: [
                  "Execute a request to GET /api/notifications/unread?page=0&pageSize=10.",
                  "Inspect result array blocks."
                ],
                expectedResult: "Returns status 200 OK along with a PagedResponse structure populated with records matching isRead: false. All records belong to the authenticated user.",
                status: "not_started"
              },
              {
                id: "tc-notif-unread-02",
                title: "Verify search parameter constraints apply smoothly (negative page)",
                type: "api",
                precondition: "User is authenticated.",
                steps: [
                  "Call the endpoint with an invalid page bounds query like page=-5.",
                  "Capture the error envelope."
                ],
                expectedResult: "Aborted by controller validation layers, returning a 400 Bad Request alongside standard errors description block.",
                status: "not_started"
              },
              {
                id: "tc-notif-unread-03",
                title: "Verify empty result when user has no unread notifications",
                type: "api",
                precondition: "All notifications for the authenticated user have is_read=true.",
                steps: [
                  "Call GET /api/notifications/unread with valid token."
                ],
                expectedResult: "Returns 200 OK with an empty content array and totalElements=0.",
                status: "not_started"
              },
              {
                id: "tc-notif-unread-04",
                title: "Verify read notifications are never included in the response",
                type: "api",
                precondition: "User has both read and unread notifications.",
                steps: [
                  "Call GET /api/notifications/unread.",
                  "Check all returned items' isRead field."
                ],
                expectedResult: "All items in the content array have isRead=false. No read notifications appear.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-notif-unread-01", content: "Output conforms exactly to the project standard layout (content, pageNumber, pageSize, totalElements, totalPages, last).", checked: false },
              { id: "dc-notif-unread-02", content: "No fields indicating an updated_at property exist in the payload serialization.", checked: false },
              { id: "dc-notif-unread-03", content: "is_read = false filter is always enforced server-side; cannot be overridden by client.", checked: false },
              { id: "dc-notif-unread-04", content: "Cross-user data isolation is enforced; only the authenticated user's notifications are returned.", checked: false },
              { id: "dc-notif-unread-05", content: "Empty results (0 unread) return 200 OK with empty content array, not an error.", checked: false }
            ]
          },
          {
            id: "leaf-notif-read",
            title: "Mark Notification as Read",
            type: "leaf_feature",
            clients: ["Driver", "Staff", "Manager", "Admin"],
            status: "ready",
            priority: "medium",
            tags: ["notification", "mark-read", "write", "ownership"],
            summary: "Updates the processing status of a specific notification record to read (is_read = true). Allows users to acknowledge and clear alert flags inside client dashboard interfaces.",
            ownerService: "Spring Boot Support API",
            endpoints: ["PATCH /api/notifications/{id}/read"],
            objective: "Updates the processing status of a specific notification record to read (is_read = true). This allows users to acknowledge and clear alert flags inside client dashboard interfaces.",
            inScope: [
              "Look up a single notification entry by its unique numeric primary key.",
              "Update the target row's database field to enforce is_read = true.",
              "Enforce ownership rules so users can only clear notifications explicitly belonging to them."
            ],
            outOfScope: [
              "Modifying notification description strings, headers, categories, or creation dates.",
              "Multi-row bulk updates or full-clear scripts (deferred to future feature tasks)."
            ],
            permissions: [
              { role: "Driver", permission: "Authorized - Can update record status only if they are the direct owner of the notification." },
              { role: "Staff", permission: "Authorized - Can update record status only if they are the direct owner of the notification." },
              { role: "Manager", permission: "Authorized - Can update record status only if they are the direct owner of the notification." },
              { role: "Admin", permission: "Authorized - Can update record status only if they are the direct owner of the notification." }
            ],
            businessRules: [
              "All mutating actions performed by administrative roles (MANAGER or ADMIN) must be logged to the existing audit logging mechanism.",
              "Operations must execute entirely inside a managed database transaction boundary (@Transactional).",
              "If the targeted notification primary key does not match any record in the database, stop processing and return an HTTP 404 Not Found status with the code NOTIFICATION_NOT_FOUND.",
              "Users are strictly blocked from mutating fields on notifications owned by other user accounts."
            ],
            dbExistingTables: ["notifications", "audit_logs"],
            dbRelationships: [
              "Relationships resolve through established BIGINT user identifier keys.",
              "No updated_at column exists in the notifications table. Do not map or set this field.",
              "audit_logs entry (for MANAGER/ADMIN only): action='NOTIFICATION_MARKED_AS_READ', source_service='SUPPORT_API', user_id=<actor_id>"
            ],
            validationRules: [
              { field: "id", rule: "Path parameter variable must be a positive integer format greater than zero (id > 0)", errorMessage: "Invalid notification ID." }
            ],
            securityRules: [
              "Extract the caller's identity context directly from verified token attributes.",
              "Ownership Verification Rule: Load the notification row from the database first. Check the record's user_id. The authenticated user's ID must match the notification's user_id attribute exactly. If they do not match, immediately abort execution and return an HTTP 403 Forbidden response envelope."
            ],
            logEvents: [
              "If the mutation is executed by an administrative user role (MANAGER or ADMIN), write a tracking record using the existing audit logging mechanism within the active database transaction block."
            ],
            noLogEvents: [
              "Encryption payload items or token strings."
            ],
            integrationPoints: [
              { system: "Shared PostgreSQL Database", responsibility: "Directly modifies row values inside the shared PostgreSQL instance database." },
              { system: "audit_logs table", responsibility: "Receives audit entries when MANAGER or ADMIN marks a notification as read." }
            ],
            uiPage: "/notifications",
            uiComponents: "Notification Card with 'Mark as Read' action button, Unread badge counter (updates on success)",
            uiStateLoading: "Show spinner on the mark-as-read button while PATCH request is pending.",
            uiStateEmpty: "N/A - this is a single-record write action.",
            uiStateError: "Show error toast: 'Failed to mark notification as read. Please try again.' For 403: 'You do not have permission to update this notification.'",
            uiStateSuccess: "Update the notification card to show read state (dimmed styling, isRead=true). Decrement the unread badge counter by 1.",
            notes: "CRITICAL: No updated_at column exists in the notifications table. Do not map or set this field anywhere in the implementation. Ownership check must be performed before any database mutation.",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-mark-notification-read",
                name: "PATCH /api/notifications/{id}/read",
                content: `Method: PATCH
Path: /api/notifications/501/read
Headers:
  Authorization: Bearer <token>
(No request body required)

Response (200 OK - Successfully Marked as Read):
{
  "success": true,
  "message": "NOTIFICATION_MARKED_AS_READ",
  "data": {
    "id": 501,
    "isRead": true
  },
  "errors": null,
  "timestamp": "2026-07-07T14:30:00Z"
}

Response (404 Not Found - Notification Does Not Exist):
{
  "success": false,
  "message": "Notification not found.",
  "data": null,
  "errors": [
    {
      "field": "id",
      "message": "NOTIFICATION_NOT_FOUND"
    }
  ],
  "timestamp": "2026-07-07T14:30:02Z"
}

Response (403 Forbidden - Ownership Violation):
{
  "success": false,
  "message": "ACCESS_DENIED",
  "data": null,
  "errors": "You do not have permission to update this notification.",
  "timestamp": "2026-07-07T14:30:02Z"
}

Response (400 Bad Request - Invalid ID):
{
  "success": false,
  "message": "Validation failed.",
  "data": null,
  "errors": [
    {
      "field": "id",
      "message": "Invalid notification ID."
    }
  ],
  "timestamp": "2026-07-07T14:30:02Z"
}`
              }
            ],
            dataContracts: [
              {
                id: "data-contract-mark-read-response",
                name: "MarkNotificationReadResponse (Java DTO)",
                content: "// No request body needed - this is a PATCH with no payload.\n// Response DTO:\npublic class MarkNotificationReadResponse {\n    private Long id;\n    private Boolean isRead; // Always true after successful update\n    // NOTE: No updatedAt field - column does not exist in notifications table\n    // getters and setters\n}\n\n// Service layer logic:\n// 1. Load notification by id using repository.findById(id)\n// 2. If not found -> throw NOTIFICATION_NOT_FOUND (404)\n// 3. Check notification.getUserId().equals(authenticatedUserId)\n// 4. If mismatch -> throw ACCESS_DENIED (403)\n// 5. Set notification.setIsRead(true)\n// 6. Save via repository.save(notification)\n// 7. If actor is MANAGER or ADMIN -> write to audit_logs\n// 8. Return MarkNotificationReadResponse"
              }
            ],
            testCases: [
              {
                id: "tc-notif-read-01",
                title: "Verify notification owner can mark it as read successfully",
                type: "api",
                precondition: "Notification 501 belongs to the authenticated user identity and is currently unread (is_read=false).",
                steps: [
                  "Call PATCH /api/notifications/501/read with proper validation parameters.",
                  "Evaluate response values."
                ],
                expectedResult: "System updates the record to is_read=true, responds with an HTTP 200 OK, and returns the standard payload envelope with id and isRead=true.",
                status: "not_started"
              },
              {
                id: "tc-notif-read-02",
                title: "Verify update fails if user does not own the notification record",
                type: "api",
                precondition: "Notification 501 belongs to User 45, but the active token context identifies a different regular user account.",
                steps: [
                  "Attempt to execute PATCH /api/notifications/501/read passing the unauthorized token.",
                  "Capture the returned response wrapper."
                ],
                expectedResult: "Halted by ownership evaluation filters before applying modifications, returning an HTTP 403 Forbidden response.",
                status: "not_started"
              },
              {
                id: "tc-notif-read-03",
                title: "Verify 404 is returned for non-existent notification ID",
                type: "api",
                precondition: "No notification with id=999999 exists in the database.",
                steps: [
                  "Call PATCH /api/notifications/999999/read with valid token."
                ],
                expectedResult: "Returns 404 Not Found with error code NOTIFICATION_NOT_FOUND.",
                status: "not_started"
              },
              {
                id: "tc-notif-read-04",
                title: "Verify audit log is created when MANAGER marks a notification as read",
                type: "integration",
                precondition: "Notification 501 belongs to Manager user. Target notification is currently unread.",
                steps: [
                  "Call PATCH /api/notifications/501/read with a valid MANAGER JWT token.",
                  "Query the audit_logs table after the update."
                ],
                expectedResult: "A new row exists in audit_logs with action=NOTIFICATION_MARKED_AS_READ and user_id matching the Manager's ID.",
                status: "not_started"
              },
              {
                id: "tc-notif-read-05",
                title: "Verify no updated_at field appears in the response",
                type: "api",
                precondition: "Notification 501 belongs to the authenticated user.",
                steps: [
                  "Call PATCH /api/notifications/501/read.",
                  "Inspect all fields in the data object of the response."
                ],
                expectedResult: "The response data object contains only id and isRead. No updatedAt field is present.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-notif-read-01", content: "Row update mutates the is_read database indicator flag cleanly to true.", checked: false },
              { id: "dc-notif-read-02", content: "Requests using missing notification ID keys abort early, throwing an HTTP 404 Not Found containing the explicit code NOTIFICATION_NOT_FOUND.", checked: false },
              { id: "dc-notif-read-03", content: "No updated_at properties or references appear anywhere within the source code or API contracts.", checked: false },
              { id: "dc-notif-read-04", content: "Ownership verification is performed before any database mutation; 403 is returned for non-owners.", checked: false },
              { id: "dc-notif-read-05", content: "MANAGER and ADMIN actions are logged to audit_logs within the same @Transactional block.", checked: false },
              { id: "dc-notif-read-06", content: "The entire operation executes within a @Transactional boundary.", checked: false }
            ]
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
            clients: ["STAFF", "MANAGER", "ADMIN"],
            status: "ready",
            priority: "medium",
            tags: ["mock", "device", "camera", "write"],
            summary: "Simulates a License Plate Recognition (LPR) camera scanning event at a parking gate. The objective is to record the simulated plate-reading event into the mock_device_events database table.",
            ownerService: "Spring Boot Support API",
            endpoints: ["POST /api/support/mock-camera/scan"],
            objective: "Simulates a License Plate Recognition (LPR) camera scanning event at a parking gate. The objective is to record the simulated plate-reading event into the mock_device_events database table. This provides static data vectors to support frontend interface mock testing without requiring physical camera hardware integrations.",
            inScope: [
              "Process inbound simulation payloads containing specific gate codes (gateCode) and parsed license plates (plateNumber).",
              "Instantiate and persist raw device logs inside the mock_device_events table using the uniform type flag event_type = 'CAMERA_SCAN'.",
              "Return a standardized corporate JSON response envelope containing structural transaction data upon successful creation."
            ],
            outOfScope: [
              "This endpoint does NOT directly initialize parking sessions or modify core transactional data. State transitions and operational session lifecycles are handled exclusively by the ASP.NET Core API via the /api/core/parking-sessions/entry workflow.",
              "Image processing, computer vision, OCR libraries, or real-time video streaming integrations."
            ],
            permissions: [
              { role: "STAFF", permission: "Write / Execute - Allows booth operators to invoke simulation triggers." },
              { role: "MANAGER", permission: "Write / Execute - Validation of simulated hardware data streams." },
              { role: "ADMIN", permission: "Write / Execute - Complete operational override privileges." }
            ],
            businessRules: [
              "Module Ownership Isolation: The Spring Boot Support API operates purely as a helper utility for hardware simulation tracking. It is prohibited from mutating primary datasets such as active parking tickets, sessions, or slot states.",
              "Enum Serialization: All system event tags must be written to the database layer as uppercase string literals (CAMERA_SCAN).",
              "Shared JWT Protocol: Inbound calls must contain a valid JWT token signed by the common Identity service.",
              "Environment Guard: This mock route is disabled in production. A controlled non-production run requires a server-side break-glass TEST_RUN guard and creates a SECURITY_SENSITIVE audit record.",
              "Response Standardization: Every success payload or systemic error must be wrapped into the common enterprise structure (success, message, data, errors, timestamp)."
            ],
            dbExistingTables: ["mock_device_events", "gates"],
            dbRelationships: [
              "mock_device_events (Spring Boot Write Owner): id: BIGSERIAL (Primary Key). event_type: VARCHAR(50) -> Stores literal text value: 'CAMERA_SCAN'. payload: JSONB -> Captures structural parameters {\"gateCode\": \"...\", \"plateNumber\": \"...\"}. created_by: BIGINT (Foreign Key mapping onto users.id, nullable). created_at: TIMESTAMPTZ -> Persisted matching the system default timeline parameter.",
              "gates (Spring Boot Read-Only): Used to verify the existence of the parameter gate_code."
            ],
            validationRules: [
              { field: "gateCode", rule: "Mandatory field; non-empty string; maximum length 50 characters; must exist as an active record in the gates table (e.g., 'B1-IN', 'B1-OUT').", errorMessage: "GATE_NOT_FOUND" },
              { field: "plateNumber", rule: "Mandatory field; non-empty string; maximum length 30 characters; trimmed of whitespace before assertion.", errorMessage: "PLATE_NUMBER_REQUIRED" }
            ],
            securityRules: [
              "Assert that inbound requests contain a valid bearer token in the headers.",
              "Extract the operational user identity from the security context using the 'sub' claim.",
              "Return a 403 Forbidden response if the role fails to match STAFF, MANAGER, or ADMIN.",
              "Reject unless the server runtime is non-production and an approved break-glass TEST_RUN guard is present; never trust a client-supplied environment flag."
            ],
            logEvents: [
              "Log infrastructure traces tracking the target URI route, invoking method, extracted user identity, and HTTP response statuses."
            ],
            noLogEvents: [],
            integrationPoints: [
              { system: "Frontend UI", responsibility: "Saved event states inside the mock_device_events log table are utilized by the system UI for operational display loops. No direct backend-to-backend API dependencies." }
            ],
            uiPage: "/mock/devices",
            uiComponents: "When an authorized operator submits data through the interface, the web layer issues a structural POST request directly to this endpoint and renders the standard ApiResponse wrapper state.",
            uiStateLoading: "Disable form buttons during simulation.",
            uiStateEmpty: "N/A",
            uiStateError: "Display validation or server errors.",
            uiStateSuccess: "Show success message, confirm logging.",
            notes: "Create a request transfer model (MockCameraScanRequest) checking constraints for gateCode and plateNumber. Perform a read-only check against the gates repository layer before logging. Instantiate a new MockDeviceEvent entity, set eventType to 'CAMERA_SCAN', and serialize inbound parameters into the JSONB payload field.",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-mock-camera-scan",
                name: "POST /api/support/mock-camera/scan",
                content: `Method: POST
Path: /api/support/mock-camera/scan
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Request Body (JSON):
{
  "gateCode": "B1-IN",
  "plateNumber": "51A-12345"
}

Response Success (201 Created):
{
  "success": true,
  "message": "OK",
  "data": {
    "id": 1001,
    "eventType": "CAMERA_SCAN",
    "payload": {
      "gateCode": "B1-IN",
      "plateNumber": "51A-12345"
    },
    "createdAt": "2026-07-07T16:42:00+07:00"
  },
  "errors": null,
  "timestamp": "2026-07-07T23:42:00+07:00"
}

Response Validation Error (400 Bad Request):
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    {
      "field": "plateNumber",
      "message": "PLATE_NUMBER_REQUIRED"
    }
  ],
  "timestamp": "2026-07-07T23:42:00+07:00"
}`
              }
            ],
            dataContracts: [],
            testCases: [
              {
                id: "tc-mock-cam-01",
                title: "Verify authorized user can log mock camera scan event",
                type: "api",
                precondition: "Operator is authenticated under a valid STAFF token context.",
                steps: [
                  "Send a request to POST /api/support/mock-camera/scan.",
                  "Embed a valid payload: {\"gateCode\": \"B1-IN\", \"plateNumber\": \"51A-12345\"}."
                ],
                expectedResult: "System processes successfully, returning an HTTP status code of 201 Created with success: true.",
                status: "not_started"
              },
              {
                id: "tc-mock-cam-02",
                title: "Verify unauthorized role is blocked from logging event",
                type: "api",
                precondition: "Request is unauthenticated or uses an invalid role.",
                steps: [
                  "Trigger a request against POST /api/support/mock-camera/scan without an authorization header."
                ],
                expectedResult: "System blocks the execution path, returning an HTTP status code of 401 Unauthorized or 403 Forbidden.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-mock-cam-01", content: "API routing matches project spec constraints: POST /api/support/mock-camera/scan.", checked: false },
              { id: "dc-mock-cam-02", content: "Access is restricted to authorized roles (STAFF, MANAGER, ADMIN).", checked: false },
              { id: "dc-mock-cam-03", content: "Event entries write directly to mock_device_events with event_type = 'CAMERA_SCAN' and HTTP status 201 Created.", checked: false },
              { id: "dc-mock-cam-04", content: "Production calls are blocked; non-production calls require a server-side break-glass TEST_RUN guard and produce a SECURITY_SENSITIVE audit record.", checked: false }
            ]
          },
          {
            id: "leaf-mock-rfid",
            title: "Mock RFID Scan",
            type: "leaf_feature",
            clients: ["STAFF", "MANAGER", "ADMIN"],
            status: "ready",
            priority: "medium",
            tags: ["mock", "device", "rfid", "write"],
            summary: "Simulates tapping a physical RFID card or scanning a static QR token at an entrance or exit validation gate. The endpoint registers the raw hardware swipe event context into the common database log structure.",
            ownerService: "Spring Boot Support API",
            endpoints: ["POST /api/support/mock-rfid/scan"],
            objective: "Simulates tapping a physical RFID card or scanning a static QR token at an entrance or exit validation gate. The endpoint registers the raw hardware swipe event context into the common database log structure.",
            inScope: [
              "Process inbound request payloads carrying the unique card identifier string (cardCode) and corresponding location parameter (gateCode).",
              "Persist a device history log into the mock_device_events data table using the category tag event_type = 'RFID_SCAN'."
            ],
            outOfScope: [
              "Modifying card lifecycle states or toggling field values inside the core parking_cards table. Writing transaction states belongs exclusively to the ASP.NET Core API core boundary."
            ],
            permissions: [
              { role: "STAFF", permission: "Write / Execute - Allows facility staff to process manual card overrides." },
              { role: "MANAGER", permission: "Write / Execute - Validates integrated data streaming from terminal simulation flows." },
              { role: "ADMIN", permission: "Write / Execute - Full operational simulation clearance." }
            ],
            businessRules: [
              "Data Ownership Boundaries: The Support API logs device operations; it cannot execute write transactions against core business models like parking_cards or active parking sessions.",
              "Unified Return Wrappers: Success or failure states must follow the project standard layout (success, message, data, errors, timestamp).",
              "Environment Guard: This mock route is disabled in production. A controlled non-production run requires a server-side break-glass TEST_RUN guard and creates a SECURITY_SENSITIVE audit record."
            ],
            dbExistingTables: ["mock_device_events", "parking_cards"],
            dbRelationships: [
              "mock_device_events (Write Owner): Data entries must map the uppercase string literal \"RFID_SCAN\" into the event_type column.",
              "parking_cards (Read-Only): Used to verify the absolute existence of the parameter card_code."
            ],
            validationRules: [
              { field: "gateCode", rule: "Mandatory field; non-empty string; must match an existing entry within the gates catalog table (e.g., \"B1-IN\").", errorMessage: "GATE_NOT_FOUND" },
              { field: "cardCode", rule: "Mandatory field; non-empty string; maximum length 50 characters; must match an existing entry within the parking_cards table (e.g., \"C001\").", errorMessage: "CARD_NOT_FOUND" }
            ],
            securityRules: [
              "Enforce JWT token verification filters prior to routing processing steps to the service component.",
              "Block access requests, returning a 403 Forbidden status, if token claims lack authorized operator roles.",
              "Reject unless the server runtime is non-production and an approved break-glass TEST_RUN guard is present; never trust a client-supplied environment flag."
            ],
            logEvents: [
              "Record fundamental invocation metrics including target lane parameters, processing timestamps, and the unique user ID resolved from the token context."
            ],
            noLogEvents: [],
            integrationPoints: [
              { system: "Database", responsibility: "No direct transactional backend hooks. Event states inside the mock_device_events table serve as reference logs." }
            ],
            uiPage: "/mock/devices",
            uiComponents: "When an operator triggers a card simulation swipe, the web application issues a POST request directly to this endpoint and processes the standard JSON return block.",
            uiStateLoading: "Disable form buttons during simulation.",
            uiStateEmpty: "N/A",
            uiStateError: "Display validation or server errors.",
            uiStateSuccess: "Show success message, confirm logging.",
            notes: "Build a controller endpoint processing a structured MockRfidScanRequest data model detailing gateCode and cardCode. Validate card and gate structural existence via read-only checks against their respective repositories before saving the event. Save data to the MockDeviceEvent layout and format responses utilizing the standard unified envelope.",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-mock-rfid-scan",
                name: "POST /api/support/mock-rfid/scan",
                content: `Method: POST
Path: /api/support/mock-rfid/scan
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Request Body (JSON):
{
  "gateCode": "B1-IN",
  "cardCode": "C001"
}

Response Success (201 Created):
{
  "success": true,
  "message": "OK",
  "data": {
    "id": 1002,
    "eventType": "RFID_SCAN",
    "payload": {
      "gateCode": "B1-IN",
      "cardCode": "C001"
    },
    "createdAt": "2026-07-07T16:42:05+07:00"
  },
  "errors": null,
  "timestamp": "2026-07-07T23:42:05+07:00"
}`
              }
            ],
            dataContracts: [],
            testCases: [
              {
                id: "tc-mock-rfid-01",
                title: "Verify authorized user can log mock RFID scan successfully",
                type: "api",
                precondition: "Operator is authenticated under a valid STAFF token context.",
                steps: [
                  "Authenticate an API caller under a valid STAFF token context.",
                  "Post an execution load to /api/support/mock-rfid/scan providing valid gateCode and cardCode values."
                ],
                expectedResult: "A row is appended to mock_device_events, and the response returns an HTTP status of 201 Created.",
                status: "not_started"
              },
              {
                id: "tc-mock-rfid-02",
                title: "Verify unauthenticated request is blocked",
                type: "api",
                precondition: "Request is unauthenticated.",
                steps: [
                  "Dispatch a request to /api/support/mock-rfid/scan omitting the authorization header."
                ],
                expectedResult: "Response status code evaluates to 401 Unauthorized.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-mock-rfid-01", content: "API routing configuration matches: POST /api/support/mock-rfid/scan.", checked: false },
              { id: "dc-mock-rfid-02", content: "Incorporates security filters checking for authorized user context roles (STAFF, MANAGER, ADMIN).", checked: false },
              { id: "dc-mock-rfid-03", content: "Records persist into PostgreSQL with event_type = 'RFID_SCAN'.", checked: false },
              { id: "dc-mock-rfid-04", content: "Production calls are blocked; non-production calls require a server-side break-glass TEST_RUN guard and produce a SECURITY_SENSITIVE audit record.", checked: false }
            ]
          },
          {
            id: "leaf-mock-barrier",
            title: "Mock Barrier Control",
            type: "leaf_feature",
            clients: ["STAFF", "MANAGER", "ADMIN"],
            status: "ready",
            priority: "medium",
            tags: ["mock", "device", "barrier", "write"],
            summary: "Provides an endpoint to simulate sending mechanical activation override signals to a physical parking gate barrier arm. This enables operators to simulate gate behaviors and test manual override exceptions.",
            ownerService: "Spring Boot Support API",
            endpoints: ["POST /api/support/mock-barrier/control"],
            objective: "Provides an endpoint to simulate sending mechanical activation override signals to a physical parking gate barrier arm. This enables operators to simulate gate behaviors and test manual override exceptions.",
            inScope: [
              "Accept incoming control payloads specifying the target lane identifier (gateCode) and the explicit mechanical action command (command value: 'OPEN' or 'CLOSE').",
              "Log the simulated activation status into the shared table mock_device_events, mapping to the corresponding type tag (event_type = 'BARRIER_OPEN' or 'BARRIER_CLOSE')."
            ],
            outOfScope: [
              "Interfacing with physical industrial relays, programmable logic controllers (PLC), embedded systems, or real hardware circuitry."
            ],
            permissions: [
              { role: "STAFF", permission: "Write / Execute - Allows booth operators to trigger emergency gate opens or drop barriers manually." },
              { role: "MANAGER", permission: "Write / Execute - Tracks and reviews manual barrier activation overrides." },
              { role: "ADMIN", permission: "Write / Execute - Complete configuration override control." }
            ],
            businessRules: [
              "Backend Responsibilities: The Spring Boot service handles all tracking and logging logs for these simulated actions. It is completely isolated from the primary transaction engines.",
              "Enum Mapping Consistency: Activation commands written to database records must be mapped as uppercase string literals (BARRIER_OPEN / BARRIER_CLOSE).",
              "Environment Guard: This mock route is disabled in production. A controlled non-production run requires a server-side break-glass TEST_RUN guard and creates a SECURITY_SENSITIVE audit record."
            ],
            dbExistingTables: ["mock_device_events", "gates"],
            dbRelationships: [
              "mock_device_events (Write Owner): Captures execution parameters dynamically based on the inbound payload command. If command == 'OPEN', set event_type = 'BARRIER_OPEN'. If command == 'CLOSE', set event_type = 'BARRIER_CLOSE'.",
              "gates (Read-Only): Leveraged to validate the system existence of the specified gate_code."
            ],
            validationRules: [
              { field: "gateCode", rule: "Mandatory field; non-empty string; must match an active gate code inside the gates configuration catalog table (e.g., \"B1-OUT\").", errorMessage: "GATE_NOT_FOUND" },
              { field: "command", rule: "Mandatory field; value must match one of the predefined text literals exactly: [\"OPEN\", \"CLOSE\"]. Any unsupported input throws an immediate HTTP 400 validation error.", errorMessage: "INVALID_BARRIER_COMMAND" }
            ],
            securityRules: [
              "Parse and validate inbound JWT signatures before executing business logic layers.",
              "Restrict access to corporate account profiles with appropriate roles (STAFF, MANAGER, ADMIN).",
              "Reject unless the server runtime is non-production and an approved break-glass TEST_RUN guard is present; never trust a client-supplied environment flag."
            ],
            logEvents: [
              "Audit execution metrics for each override command, tracking the timestamp, invoking user ID, target gate code, and operational status."
            ],
            noLogEvents: [],
            integrationPoints: [
              { system: "Database", responsibility: "No physical hardware interface linkages. Saved event statuses serve as reactive database markers." }
            ],
            uiPage: "/mock/devices",
            uiComponents: "The user interface sends a payload to this endpoint upon physical simulation click sequences and mutates screen element graphics based on a successful 201 Created wrapper return.",
            uiStateLoading: "Disable form buttons during simulation.",
            uiStateEmpty: "N/A",
            uiStateError: "Display validation or server errors.",
            uiStateSuccess: "Show success message, confirm logging.",
            notes: "Expose a controller endpoint mapping incoming data payloads into a structured MockBarrierControlRequest (containing gateCode and command). Evaluate the inbound command text using exact string matches. Save the event record and format the returned JSON object to match the system standard API response structure.",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-mock-barrier-control",
                name: "POST /api/support/mock-barrier/control",
                content: `Method: POST
Path: /api/support/mock-barrier/control
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Request Body (JSON):
{
  "gateCode": "B1-OUT",
  "command": "OPEN"
}

Response Success (201 Created):
{
  "success": true,
  "message": "OK",
  "data": {
    "id": 1003,
    "eventType": "BARRIER_OPEN",
    "payload": {
      "gateCode": "B1-OUT",
      "command": "OPEN"
    },
    "createdAt": "2026-07-07T16:42:10+07:00"
  },
  "errors": null,
  "timestamp": "2026-07-07T23:42:10+07:00"
}`
              }
            ],
            dataContracts: [],
            testCases: [
              {
                id: "tc-mock-barrier-01",
                title: "Verify authorized user can execute mock barrier control successfully",
                type: "api",
                precondition: "Operator is authenticated under a valid STAFF token context.",
                steps: [
                  "Authenticate an execution session using a valid STAFF account token.",
                  "Send a request to POST /api/support/mock-barrier/control with the payload {\"gateCode\": \"B1-OUT\", \"command\": \"OPEN\"}."
                ],
                expectedResult: "The action is successfully logged to the database with an HTTP status code of 21 Created and the event type flag set to 'BARRIER_OPEN'.",
                status: "not_started"
              },
              {
                id: "tc-mock-barrier-02",
                title: "Verify validation logic rejects unsupported command inputs",
                type: "api",
                precondition: "Request uses unsupported command.",
                steps: [
                  "Send a request to POST /api/support/mock-barrier/control passing an invalid value: {\"gateCode\": \"B1-OUT\", \"command\": \"INVALID\"}."
                ],
                expectedResult: "The application drops the processing path, returning a 400 Bad Request status code along with the standard error structure.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-mock-barrier-01", content: "API routing configuration matches exact system constraints: POST /api/support/mock-barrier/control.", checked: false },
              { id: "dc-mock-barrier-02", content: "Access controls strictly limit invocation to authorized roles (STAFF, MANAGER, ADMIN).", checked: false },
              { id: "dc-mock-barrier-03", content: "Operational states log cleanly into the mock_device_events structure with appropriate upper-case string mappings.", checked: false },
              { id: "dc-mock-barrier-04", content: "Production calls are blocked; non-production calls require a server-side break-glass TEST_RUN guard and produce a SECURITY_SENSITIVE audit record.", checked: false }
            ]
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
          {
            id: "leaf-diag-clear-res",
            title: "Clear Reservations Debug",
            type: "leaf_feature",
            clients: ["Admin"],
            status: "ready",
            priority: "low",
            tags: ["developer-utility", "test-data", "debug", "clear-reservations"],
            summary: "Provide a debugging utility for administrators to forcefully clear, reset, or permanently delete mock reservation data during testing without affecting real production transactions.",
            objective: "Implement a secure database cleanup method exposed only in non-production environments to clear, reset, or permanently delete mock reservation data for Admins.",
            inScope: [
              "Allow administrators to clear, reset, or hard-delete reservation test data.",
              "Restrict execution to non-production environments only.",
              "Delete only records identified as test/mock data.",
              "Record all debug operations in the audit log with critical severity.",
              "Implement the feature following existing project architecture and security standards."
            ],
            outOfScope: [
              "Deleting or modifying real production reservation records.",
              "Deleting payment, audit, or operational data unrelated to test reservations.",
              "External system integrations not specified in this document."
            ],
            permissions: [
              { role: "Admin", permission: "Authorized to access this feature." }
            ],
            businessRules: [
              "This debugging utility must only be available in non-production environments.",
              "The API must validate the application environment (e.g., ASPNETCORE_ENVIRONMENT) and immediately return 403 Forbidden if executed in Production.",
              "Only reservation records explicitly marked as test data or created by mock accounts may be deleted.",
              "Every execution of this feature must be recorded in the audit log with Critical severity."
            ],
            dbExistingTables: [
              "Reservation",
              "Audit Log",
              "Test/Mock Account"
            ],
            dbNewTablesSql: "",
            dbRelationships: [
              "Only records flagged as test data or created by mock accounts are eligible for deletion.",
              "Audit logs must permanently retain execution history even after reservation records are removed."
            ],
            validationRules: [
              { field: "Role", rule: "Only authenticated Admin users may execute this feature.", errorMessage: "Unauthorized access." },
              { field: "Environment", rule: "Reject execution when the application is running in the Production environment.", errorMessage: "Forbidden in Production." },
              { field: "Target Records", rule: "Verify targeted records are marked as test data before deletion.", errorMessage: "Cannot delete production data." }
            ],
            securityRules: [
              "Validate Admin role permissions.",
              "Prevent unauthorized access.",
              "Block execution in Production environments.",
              "Prevent deletion of production data.",
              "Do not log sensitive data."
            ],
            logEvents: [
              "Log request access, execution time, duration, and response code.",
              "Log the executing administrator ID.",
              "Log deleted record count.",
              "Log environment name.",
              "Log execution result.",
              "Record every execution with Critical severity in the audit log."
            ],
            noLogEvents: [
              "Passwords, access tokens, refresh tokens, and credit card details."
            ],
            integrationPoints: [],
            uiPage: "/admin/debug-utilities",
            uiComponents: "Warning Dialog, Execute Debug Button, Result Console",
            uiStateIdle: "Display a warning dialog before execution.",
            uiStateLoading: "Disable action and show execution spinner.",
            uiStateSuccess: "Display success or failure results with the number of deleted records.",
            uiStateEmpty: "No test reservation data found.",
            uiStateError: "Display execution failures or permission errors.",
            endpoints: [],
            ownerService: "System",
            apiContracts: [],
            testCases: [
              {
                id: "tc-clear-res-admin-success",
                title: "Verify authorized client (Admin) can access \"Clear Reservations Debug\" successfully",
                type: "api",
                precondition: "Client is authenticated with role: Admin in a non-production environment",
                steps: [
                  "Authenticate user as Admin",
                  "Execute the debug endpoint",
                  "Verify only test reservation data is removed"
                ],
                expectedResult: "Request succeeds and only test reservation data is deleted",
                status: "not_started"
              },
              {
                id: "tc-clear-res-blocked-prod",
                title: "Verify execution is blocked in Production",
                type: "integration",
                precondition: "Application is running in Production",
                steps: [
                  "Authenticate as Admin",
                  "Execute the debug endpoint"
                ],
                expectedResult: "System returns 403 Forbidden",
                status: "not_started"
              },
              {
                id: "tc-clear-res-no-prod-deletion",
                title: "Verify production reservation data cannot be deleted",
                type: "integration",
                expectedResult: "System rejects deletion of production reservation records",
                status: "not_started"
              },
              {
                id: "tc-clear-res-audit-critical",
                title: "Verify audit log records critical execution event",
                type: "integration",
                expectedResult: "Audit log contains execution details with Critical severity",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-clear-res-contract", content: "API contract is documented in this node.", checked: false },
              { id: "dc-clear-res-roles", content: "Required clients/roles are assigned.", checked: false },
              { id: "dc-clear-res-export", content: "Business rules and inherited rules are visible in AI export.", checked: false },
              { id: "dc-clear-res-response-format", content: "Success response uses common API response format where applicable.", checked: false },
              { id: "dc-clear-res-error-safe", content: "Error response is clear and does not leak sensitive data.", checked: false },
              { id: "dc-clear-res-non-prod", content: "Feature is restricted to non-production environments.", checked: false },
              { id: "dc-clear-res-env-val", content: "Environment validation is implemented.", checked: false },
              { id: "dc-clear-res-test-only", content: "Only test/mock reservation data can be deleted.", checked: false },
              { id: "dc-clear-res-audit-critical", content: "Audit logs record execution with Critical severity.", checked: false },
              { id: "dc-clear-res-test-cases", content: "At least two test cases are defined.", checked: false },
              { id: "dc-clear-res-ai-export", content: "Feature can be exported as AI-readable Markdown.", checked: false },
              { id: "dc-clear-res-edge-cases", content: "Edge cases are documented.", checked: false },
              { id: "dc-clear-res-state-transitions", content: "Payment/session/reservation state transition is documented.", checked: false }
            ]
          },
          {
            id: "leaf-diag-migrate",
            title: "Migrate Database Debug",
            type: "leaf_feature",
            clients: ["Admin"],
            status: "ready",
            priority: "low",
            tags: ["developer-utility", "database", "migration", "seed-data"],
            summary: "Provide a debugging utility for administrators to trigger or simulate database schema migrations and seed predefined mock data, ensuring database structural changes function correctly in non-production environments.",
            objective: "Trigger or simulate database schema migrations and seed predefined mock data inside a database transaction, automatically rolling back on failure and bypassing cache.",
            inScope: [
              "Trigger or simulate database schema migrations.",
              "Execute predefined database seed operations for testing.",
              "Validate migration execution in non-production environments.",
              "Automatically rollback database changes if migration fails.",
              "Disable API caching during migration execution.",
              "Follow existing project architecture and security standards."
            ],
            outOfScope: [
              "Executing migrations against production databases.",
              "Modifying production business data.",
              "Running arbitrary SQL scripts outside the controlled migration process.",
              "External system integrations not specified in this document."
            ],
            permissions: [
              { role: "Admin", permission: "Authorized to access this feature." }
            ],
            businessRules: [
              "This utility must only execute in non-production environments.",
              "The application must validate the runtime environment and reject execution on Production.",
              "Entity Framework (or the project's ORM) must rollback all database changes if the migration process fails.",
              "API caching must be disabled while migration or seed operations are executing.",
              "Seed operations must only insert predefined mock data.",
              "Seeded records must never conflict with real user IDs or production business data."
            ],
            dbExistingTables: [
              "Migration History",
              "Existing application tables",
              "Audit Log"
            ],
            dbNewTablesSql: "",
            dbRelationships: [
              "Seed data must reference only predefined mock entities.",
              "Mock records must not share identifiers with production users or operational data.",
              "Failed migration operations must leave the database in its original consistent state."
            ],
            validationRules: [
              { field: "Role", rule: "Only authenticated Admin users may execute this feature.", errorMessage: "Unauthorized access." },
              { field: "Environment", rule: "Reject execution when the application is running in the Production environment.", errorMessage: "Forbidden in Production." },
              { field: "Migration Packages", rule: "Validate migration packages before execution.", errorMessage: "Invalid migration package." },
              { field: "Seed Integrity", rule: "Validate seed data integrity before insertion.", errorMessage: "Mock data validation failed." }
            ],
            securityRules: [
              "Validate Admin role permissions.",
              "Prevent unauthorized access.",
              "Block execution in Production environments.",
              "Prevent accidental modification of production data.",
              "Do not log sensitive data."
            ],
            logEvents: [
              "Log request access, execution time, duration, and response code.",
              "Log administrator ID.",
              "Log migration version executed.",
              "Log seed operation results.",
              "Log rollback operations (if any).",
              "Log environment name.",
              "Record execution in the audit log."
            ],
            noLogEvents: [
              "Passwords, access tokens, refresh tokens, and credit card details."
            ],
            integrationPoints: [
              { system: "Entity Framework / ORM migration engine", responsibility: "Executes actual database schema shifts." },
              { system: "Database transaction management", responsibility: "Rolls back changes on failure." },
              { system: "Audit logging subsystem", responsibility: "Logs execution metadata." }
            ],
            uiPage: "/admin/debug-utilities",
            uiComponents: "Confirmation Dialog, Progress Indicator, Rollback Status Banner, Seed Summary Panel",
            uiStateIdle: "Display a confirmation dialog before execution.",
            uiStateLoading: "Display migration progress with a spinner.",
            uiStateSuccess: "Show seed execution summary after completion.",
            uiStateEmpty: "No pending migrations found.",
            uiStateError: "Display migration success, rollback, or failure messages.",
            endpoints: [],
            ownerService: "System",
            apiContracts: [],
            testCases: [
              {
                id: "tc-db-migrate-admin-success",
                title: "Verify authorized client (Admin) can execute \"Migrate Database Debug\" successfully",
                type: "api",
                precondition: "Client is authenticated as Admin in a non-production environment",
                steps: [
                  "Authenticate user as Admin",
                  "Execute migration utility",
                  "Verify migration and seed operations complete successfully"
                ],
                expectedResult: "Migration succeeds and predefined mock data is inserted",
                status: "not_started"
              },
              {
                id: "tc-db-migrate-blocked-prod",
                title: "Verify execution is blocked in Production",
                type: "integration",
                precondition: "Application is running in Production",
                steps: [
                  "Authenticate as Admin",
                  "Execute migration utility"
                ],
                expectedResult: "System returns 403 Forbidden",
                status: "not_started"
              },
              {
                id: "tc-db-migrate-rollback",
                title: "Verify failed migration automatically rolls back",
                type: "integration",
                expectedResult: "Database returns to its previous consistent state after failure",
                status: "not_started"
              },
              {
                id: "tc-db-migrate-no-conflict",
                title: "Verify seeded data does not conflict with production user IDs",
                type: "integration",
                expectedResult: "Only predefined mock records are inserted without ID conflicts",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-db-migrate-contract", content: "API contract is documented in this node.", checked: false },
              { id: "dc-db-migrate-roles", content: "Required clients/roles are assigned.", checked: false },
              { id: "dc-db-migrate-export", content: "Business rules and inherited rules are visible in AI export.", checked: false },
              { id: "dc-db-migrate-response-format", content: "Success response uses common API response format where applicable.", checked: false },
              { id: "dc-db-migrate-error-safe", content: "Error response is clear and does not leak sensitive data.", checked: false },
              { id: "dc-db-migrate-non-prod", content: "Feature is restricted to non-production environments.", checked: false },
              { id: "dc-db-migrate-env-val", content: "Runtime environment validation is implemented.", checked: false },
              { id: "dc-db-migrate-rollback", content: "Automatic rollback is implemented for failed migrations.", checked: false },
              { id: "dc-db-migrate-cache-disabled", content: "API cache is disabled during migration execution.", checked: false },
              { id: "dc-db-migrate-seed-mock-only", content: "Seed data only contains predefined mock records.", checked: false },
              { id: "dc-db-migrate-no-conflict-ids", content: "Seed data does not conflict with production user IDs.", checked: false },
              { id: "dc-db-migrate-test-cases", content: "At least two test cases are defined.", checked: false },
              { id: "dc-db-migrate-ai-export", content: "Feature can be exported as AI-readable Markdown.", checked: false }
            ]
          },
          {
            id: "leaf-diag-expire-res",
            title: "Expire Reservation Debug",
            type: "leaf_feature",
            clients: ["Admin"],
            status: "ready",
            priority: "low",
            tags: ["developer-utility", "test-data", "debug", "expire-reservation"],
            summary: "Provide a developer utility that instantly forces an active reservation into an Expired state, allowing QA engineers and developers to verify timeout mechanisms, scheduled jobs, and automatic reservation expiration logic without waiting for real time to elapse.",
            objective: "Force a reservation into the Expired state by artificially updating reservation endTime and invoking the background scan worker immediately in non-production environments.",
            inScope: [
              "Force a reservation into the Expired state.",
              "Artificially update the reservation endTime.",
              "Immediately trigger the background worker responsible for processing expired reservations.",
              "Allow testing of timeout and expiration workflows.",
              "Follow existing project architecture and security standards."
            ],
            outOfScope: [
              "Expiring production reservations.",
              "Modifying reservations outside supported states.",
              "Bypassing business validation outside debugging scenarios.",
              "External system integrations not specified in this document."
            ],
            permissions: [
              { role: "Admin", permission: "Authorized to access this feature." }
            ],
            businessRules: [
              "This debugging utility must only execute in non-production environments.",
              "The endpoint artificially updates the reservation endTime and immediately invokes the background worker responsible for scanning expired reservations.",
              "Only reservations currently in Confirmed or Active status are eligible for forced expiration.",
              "Reservation expiration must follow the same business workflow used by the automatic expiration scheduler.",
              "Every execution must be recorded in the audit log."
            ],
            dbExistingTables: [
              "Reservation",
              "Reservation Status",
              "Audit Log"
            ],
            dbNewTablesSql: "",
            dbRelationships: [
              "Only reservations in Confirmed or Active status can transition to Expired.",
              "Forced expiration must preserve reservation history.",
              "Audit logs must remain immutable after execution."
            ],
            validationRules: [
              { field: "Role", rule: "Only authenticated Admin users may execute this feature.", errorMessage: "Unauthorized access." },
              { field: "Environment", rule: "Reject execution in the Production environment.", errorMessage: "Forbidden in Production." },
              { field: "Reservation ID", rule: "Validate the reservation exists.", errorMessage: "Reservation not found." },
              { field: "Reservation Status", rule: "Validate the reservation is currently in Confirmed or Active state. Reject already expired, cancelled, or completed reservations.", errorMessage: "Reservation status is not eligible for forced expiration." }
            ],
            securityRules: [
              "Validate Admin role permissions.",
              "Prevent unauthorized access.",
              "Restrict execution to non-production environments.",
              "Prevent accidental modification of production reservations.",
              "Do not log sensitive data."
            ],
            logEvents: [
              "Log request access, execution time, duration, and response code.",
              "Log administrator ID.",
              "Log reservation ID.",
              "Log original reservation status.",
              "Log updated reservation status.",
              "Log background worker execution result.",
              "Log environment name.",
              "Record execution in the audit log."
            ],
            noLogEvents: [
              "Passwords, access tokens, refresh tokens, and credit card details."
            ],
            integrationPoints: [
              { system: "Reservation service", responsibility: "Updates endTime and database states." },
              { system: "Background Worker / Cron Job", responsibility: "Scans expired reservations and frees related resources." },
              { system: "Audit logging subsystem", responsibility: "Logs execution metadata." }
            ],
            uiPage: "/admin/debug-utilities",
            uiComponents: "Forced Expiration Dialog, Reservation Status Dashboard, Execution Trigger Button",
            uiStateIdle: "Display a confirmation dialog before forcing expiration.",
            uiStateLoading: "Disable action and show execution spinner.",
            uiStateSuccess: "Display execution result. Show reservation status before and after execution.",
            uiStateEmpty: "No active reservations eligible for expiration found.",
            uiStateError: "Display execution failures or permission errors.",
            endpoints: [],
            ownerService: "System",
            apiContracts: [],
            testCases: [
              {
                id: "tc-expire-res-success",
                title: "Verify authorized client (Admin) can execute \"Expire Reservation Debug\" successfully",
                type: "api",
                precondition: "Client is authenticated as Admin in a non-production environment and reservation status is Confirmed or Active",
                steps: [
                  "Authenticate user as Admin",
                  "Execute the expire reservation utility",
                  "Verify reservation status changes to Expired"
                ],
                expectedResult: "Reservation is immediately marked as Expired and background worker executes successfully",
                status: "not_started"
              },
              {
                id: "tc-expire-res-blocked-prod",
                title: "Verify execution is blocked in Production",
                type: "integration",
                precondition: "Application is running in Production",
                steps: [
                  "Authenticate as Admin",
                  "Execute the expire reservation utility"
                ],
                expectedResult: "System returns 403 Forbidden",
                status: "not_started"
              },
              {
                id: "tc-expire-res-invalid-state",
                title: "Verify invalid reservation states cannot be expired",
                type: "integration",
                expectedResult: "Cancelled, Completed, or Expired reservations are rejected",
                status: "not_started"
              },
              {
                id: "tc-expire-res-trigger-worker",
                title: "Verify background worker is triggered after forced expiration",
                type: "integration",
                expectedResult: "Expiration processing executes successfully and related resources are released according to business rules",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-expire-res-contract", content: "API contract is documented in this node.", checked: false },
              { id: "dc-expire-res-roles", content: "Required clients/roles are assigned.", checked: false },
              { id: "dc-expire-res-export", content: "Business rules and inherited rules are visible in AI export.", checked: false },
              { id: "dc-expire-res-response-format", content: "Success response uses common API response format where applicable.", checked: false },
              { id: "dc-expire-res-error-safe", content: "Error response is clear and does not leak sensitive data.", checked: false },
              { id: "dc-expire-res-non-prod", content: "Feature is restricted to non-production environments.", checked: false },
              { id: "dc-expire-res-env-val", content: "Runtime environment validation is implemented.", checked: false },
              { id: "dc-expire-res-status-check", content: "Only Confirmed or Active reservations can be expired.", checked: false },
              { id: "dc-expire-res-time-update", content: "Reservation endTime is updated correctly.", checked: false },
              { id: "dc-expire-res-worker-trigger", content: "Background worker is invoked immediately after execution.", checked: false },
              { id: "dc-expire-res-audit-log", content: "Audit logs record every execution.", checked: false },
              { id: "dc-expire-res-test-cases", content: "At least two test cases are defined.", checked: false },
              { id: "dc-expire-res-ai-export", content: "Feature can be exported as AI-readable Markdown.", checked: false },
              { id: "dc-expire-res-edge-cases", content: "Edge cases are documented.", checked: false },
              { id: "dc-expire-res-state-transitions", content: "Payment/session/reservation state transition is documented.", checked: false }
            ]
          },
          {
            id: "leaf-diag-expire-pay",
            title: "Expire Payment Deadline Debug",
            type: "leaf_feature",
            clients: ["Admin"],
            status: "ready",
            priority: "low",
            tags: ["developer-utility", "test-data", "debug", "expire-payment"],
            summary: "Provide a debugging utility that artificially fast-forwards the payment deadline or immediately expires a pending payment, allowing developers and QA engineers to verify temporary slot lock release, unpaid reservation cleanup, and payment timeout workflows without waiting for real payment expiration.",
            objective: "Artificially expire a pending payment, releasing associated temporary slot locks and recalculating parking capacity immediately in non-production environments.",
            inScope: [
              "Force a pending payment to expire.",
              "Simulate payment gateway timeout behavior.",
              "Trigger the same business events as a real payment timeout.",
              "Immediately release temporary slot locks.",
              "Update parking capacity after reservation cleanup.",
              "Support testing of unpaid reservation cleanup logic.",
              "Follow existing project architecture and security standards."
            ],
            outOfScope: [
              "Modifying completed or refunded payments.",
              "Testing production payment gateways.",
              "Changing reservation data outside supported debug scenarios.",
              "External system integrations not specified in this document."
            ],
            permissions: [
              { role: "Admin", permission: "Authorized to access this feature." }
            ],
            businessRules: [
              "This debugging utility must only execute in non-production environments.",
              "The feature interacts directly with the temporary slot lock mechanism implemented in the Create Reservation workflow.",
              "Parking capacity must be updated immediately after payment expiration.",
              "Only reservations with Pending Payment status are eligible for forced payment expiration.",
              "Mock payment expiration must trigger the same webhook/event processing as a real payment gateway timeout.",
              "Every execution must be recorded in the audit log."
            ],
            dbExistingTables: [
              "Reservation",
              "Payment",
              "Payment Transaction",
              "Temporary Slot Lock",
              "Audit Log"
            ],
            dbNewTablesSql: "",
            dbRelationships: [
              "Only reservations in Pending Payment status can transition to payment timeout.",
              "Expired payments must immediately release their associated temporary slot locks.",
              "Parking capacity must be recalculated after slot release.",
              "Audit records must remain immutable after execution."
            ],
            validationRules: [
              { field: "Role", rule: "Only authenticated Admin users may execute this feature.", errorMessage: "Unauthorized access." },
              { field: "Environment", rule: "Reject execution in the Production environment.", errorMessage: "Forbidden in Production." },
              { field: "Reservation ID", rule: "Validate the reservation exists.", errorMessage: "Reservation not found." },
              { field: "Payment Status", rule: "Validate the payment status is Pending Payment. Reject already paid, cancelled, refunded, or expired payments.", errorMessage: "Payment status is not eligible for forced expiration." }
            ],
            securityRules: [
              "Validate Admin role permissions.",
              "Prevent unauthorized access.",
              "Restrict execution to non-production environments.",
              "Prevent accidental modification of production payment records.",
              "Do not log sensitive data."
            ],
            logEvents: [
              "Log request access, execution time, duration, and response code.",
              "Log administrator ID.",
              "Log reservation ID.",
              "Log payment ID.",
              "Log original payment status.",
              "Log updated payment status.",
              "Log temporary slot release result.",
              "Log parking capacity update result.",
              "Log simulated webhook/event execution.",
              "Record execution in the audit log."
            ],
            noLogEvents: [
              "Passwords, access tokens, refresh tokens, payment credentials, and credit card details."
            ],
            integrationPoints: [
              { system: "Reservation service", responsibility: "Fetches reservation states and logs results." },
              { system: "Payment service", responsibility: "Updates payment status to Expired." },
              { system: "Temporary Slot Lock service", responsibility: "Immediately releases slot locks." },
              { system: "Parking Capacity service", responsibility: "Recalculates facility capacity metrics." },
              { system: "Payment timeout webhook/event handler", responsibility: "Processes downstream logic identically to gateway timeout." },
              { system: "Audit logging subsystem", responsibility: "Logs execution metadata." }
            ],
            uiPage: "/admin/debug-utilities",
            uiComponents: "Expiration Confirmation Modal, Temporary Lock Status Display, Capacity Update Panel, Trigger Execution Button",
            uiStateIdle: "Display a confirmation dialog before execution.",
            uiStateLoading: "Disable action and show execution spinner.",
            uiStateSuccess: "Display payment status before and after execution. Display whether the temporary slot lock has been released. Display updated parking capacity after execution.",
            uiStateEmpty: "No reservations in Pending Payment status found.",
            uiStateError: "Display execution failures or validation errors.",
            endpoints: [],
            ownerService: "System",
            apiContracts: [],
            testCases: [
              {
                id: "tc-expire-pay-success",
                title: "Verify authorized client (Admin) can execute \"Expire Payment Deadline Debug\" successfully",
                type: "api",
                precondition: "Client is authenticated as Admin in a non-production environment and reservation payment status is Pending Payment",
                steps: [
                  "Authenticate user as Admin",
                  "Execute the payment expiration utility",
                  "Verify payment status changes to Expired"
                ],
                expectedResult: "Payment expires successfully, temporary slot lock is released, and parking capacity is updated",
                status: "not_started"
              },
              {
                id: "tc-expire-pay-blocked-prod",
                title: "Verify execution is blocked in Production",
                type: "integration",
                precondition: "Application is running in Production",
                steps: [
                  "Authenticate as Admin",
                  "Execute the payment expiration utility"
                ],
                expectedResult: "System returns 403 Forbidden",
                status: "not_started"
              },
              {
                id: "tc-expire-pay-only-pending",
                title: "Verify only Pending Payment reservations can be expired",
                type: "integration",
                expectedResult: "Paid, Cancelled, Refunded, or Expired payments are rejected",
                status: "not_started"
              },
              {
                id: "tc-expire-pay-simulated-event",
                title: "Verify simulated payment expiration triggers the same event as a real payment timeout",
                type: "integration",
                expectedResult: "Webhook/event processing executes successfully and reservation cleanup behaves identically to a real payment timeout",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-expire-pay-contract", content: "API contract is documented in this node.", checked: false },
              { id: "dc-expire-pay-roles", content: "Required clients/roles are assigned.", checked: false },
              { id: "dc-expire-pay-export", content: "Business rules and inherited rules are visible in AI export.", checked: false },
              { id: "dc-expire-pay-response-format", content: "Success response uses common API response format where applicable.", checked: false },
              { id: "dc-expire-pay-error-safe", content: "Error response is clear and does not leak sensitive data.", checked: false },
              { id: "dc-expire-pay-non-prod", content: "Feature is restricted to non-production environments.", checked: false },
              { id: "dc-expire-pay-env-val", content: "Runtime environment validation is implemented.", checked: false },
              { id: "dc-expire-pay-pending-only", content: "Only Pending Payment reservations can be processed.", checked: false },
              { id: "dc-expire-pay-lock-release", content: "Temporary slot locks are released immediately.", checked: false },
              { id: "dc-expire-pay-capacity-update", content: "Parking capacity is updated correctly.", checked: false },
              { id: "dc-expire-pay-event-trigger", content: "Simulated timeout triggers the same webhook/event flow as the real payment gateway.", checked: false },
              { id: "dc-expire-pay-audit-log", content: "Audit logs record every execution.", checked: false },
              { id: "dc-expire-pay-test-cases", content: "At least two test cases are defined.", checked: false },
              { id: "dc-expire-pay-ai-export", content: "Feature can be exported as AI-readable Markdown.", checked: false },
              { id: "dc-expire-pay-edge-cases", content: "Edge cases are documented.", checked: false },
              { id: "dc-expire-pay-state-transitions", content: "Payment/session/reservation state transition is documented.", checked: false }
            ]
          }
        ]
      }
    ]
  };

  const rootNode = migrateParkingTaxonomy(createSeedNode(seedInput, null, 0));
  enrichNodeWithTags(rootNode);
  return [rootNode];
}

function enrichNodeWithTags(node: FeatureNode) {
  if (!node.tags) {
    node.tags = [];
  }

  if (node.id === "root-parking-system") {
    node.tags = uniqueTags(node.tags, ["system", "parking", "core"]);
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
      node.tags = uniqueTags(node.tags, categoryTags[key]);
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

    node.tags = uniqueTags(node.tags, localTags);
  }

  if (node.children) {
    node.children.forEach(enrichNodeWithTags);
  }
}

function uniqueTags(...groups: string[][]): string[] {
  return [...new Set(groups.flat().map(tag => tag.trim().toLowerCase()).filter(Boolean))];
}

export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}


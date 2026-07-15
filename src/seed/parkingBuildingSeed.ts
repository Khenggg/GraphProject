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
            clients: ["Driver"],
            endpoints: [
              "GET /api/core/driver/vehicles"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/driver/vehicles"),
            testCases: defaultApiTests("Driver Registered Vehicles", ["Driver"], ["GET /api/core/driver/vehicles"]),
            doneCriteria: defaultDoneCriteria("Driver Registered Vehicles")
          },
          {
            id: "leaf-driver-vehicle-history",
            title: "Driver Vehicle Entry Exit History",
            type: "leaf_feature",
            clients: ["Driver"],
            endpoints: [
              "GET /api/support/driver/vehicles/entry-exit-history"
            ],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/driver/vehicles/entry-exit-history"),
            testCases: defaultApiTests("Driver Vehicle Entry Exit History", ["Driver"], ["GET /api/support/driver/vehicles/entry-exit-history"]),
            doneCriteria: defaultDoneCriteria("Driver Vehicle Entry Exit History")
          },
          {
            id: "leaf-driver-mp-application",
            title: "Driver Monthly Pass Application",
            type: "leaf_feature",
            clients: ["Driver"],
            endpoints: [
              "POST /api/core/monthly-passes/applications",
              "GET /api/support/monthly-passes/applications/me"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/monthly-passes/applications"),
            testCases: defaultApiTests("Driver Monthly Pass Application", ["Driver"], ["POST /api/core/monthly-passes/applications"]),
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
            endpoints: [
              "GET /api/core/vehicle-types",
              "GET /api/core/vehicle-types/{id}",
              "POST /api/core/vehicle-types",
              "PUT /api/core/vehicle-types/{id}",
              "PATCH /api/core/vehicle-types/{id}/active",
              "DELETE /api/core/vehicle-types/{id}"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/vehicle-types"),
            testCases: defaultApiTests("Vehicle Type Management", ["Manager"], ["GET /api/core/vehicle-types"]),
            doneCriteria: defaultDoneCriteria("Vehicle Type Management")
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
            endpoints: [
              "GET /api/core/floors",
              "POST /api/core/floors",
              "PUT /api/core/floors/{id}"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/floors"),
            testCases: defaultApiTests("Floor Management", ["Manager"], ["POST /api/core/floors"]),
            doneCriteria: defaultDoneCriteria("Floor Management")
          },
          {
            id: "leaf-struct-area",
            title: "Area Management",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: [
              "GET /api/core/areas",
              "POST /api/core/areas",
              "PUT /api/core/areas/{id}"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/areas"),
            testCases: defaultApiTests("Area Management", ["Manager"], ["POST /api/core/areas"]),
            doneCriteria: defaultDoneCriteria("Area Management")
          },
          {
            id: "leaf-struct-slot",
            title: "Slot Management",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: [
              "GET /api/core/slots",
              "POST /api/core/slots",
              "PATCH /api/core/slots/{id}/status"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/slots"),
            testCases: defaultApiTests("Slot Management", ["Manager"], ["GET /api/core/slots"]),
            doneCriteria: defaultDoneCriteria("Slot Management")
          },
          {
            id: "leaf-struct-gate",
            title: "Gate Read Model",
            type: "leaf_feature",
            clients: ["Staff", "Manager", "Admin"],
            endpoints: [],
            ownerService: "Spring Boot Support API",
            testCases: defaultApiTests("Gate Read Model", ["Staff"], []),
            doneCriteria: defaultDoneCriteria("Gate Read Model")
          },
          {
            id: "leaf-struct-avail",
            title: "Public Available Slots",
            type: "leaf_feature",
            clients: ["Guest", "Driver"],
            endpoints: ["GET /api/public/available-slots"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/public/available-slots"),
            testCases: defaultApiTests("Public Available Slots", ["Guest", "Driver"], ["GET /api/public/available-slots"]),
            doneCriteria: defaultDoneCriteria("Public Available Slots")
          },
          {
            id: "leaf-struct-suggest",
            title: "Location / Slot Suggestion",
            type: "leaf_feature",
            clients: ["Staff", "Manager", "Driver"],
            endpoints: ["POST /api/core/parking-sessions/suggest-slot"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/parking-sessions/suggest-slot"),
            testCases: defaultApiTests("Location / Slot Suggestion", ["Driver"], ["POST /api/core/parking-sessions/suggest-slot"]),
            doneCriteria: defaultDoneCriteria("Location / Slot Suggestion")
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
            endpoints: ["GET /api/core/reservations/available-locations"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/reservations/available-locations"),
            testCases: defaultApiTests("Available Reservation Locations", ["Driver"], ["GET /api/core/reservations/available-locations"]),
            doneCriteria: defaultDoneCriteria("Available Reservation Locations")
          },
          {
            id: "leaf-res-create",
            title: "Create Reservation",
            type: "leaf_feature",
            clients: ["Driver"],
            endpoints: [
              "POST /api/core/reservations",
              "GET /api/core/reservations/{id}/payment-status"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/reservations"),
            testCases: defaultApiTests("Create Reservation", ["Driver"], ["POST /api/core/reservations"]),
            doneCriteria: [
              ...defaultDoneCriteria("Create Reservation"),
              { id: "dc-res-pay-status", content: "Payment verification integration is functional.", checked: false },
              { id: "dc-res-expire", content: "Automatic expiration release of unpaid bookings is functional.", checked: false }
            ]
          },
          {
            id: "leaf-res-extend",
            title: "Extend Reservation",
            type: "leaf_feature",
            clients: ["Driver"],
            endpoints: ["POST /api/core/reservations/{id}/extend"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/reservations/{id}/extend"),
            testCases: defaultApiTests("Extend Reservation", ["Driver"], ["POST /api/core/reservations/{id}/extend"]),
            doneCriteria: defaultDoneCriteria("Extend Reservation")
          },
          {
            id: "leaf-res-cancel",
            title: "Cancel Reservation",
            type: "leaf_feature",
            clients: ["Driver"],
            endpoints: ["POST /api/core/reservations/{id}/cancel"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/reservations/{id}/cancel"),
            testCases: defaultApiTests("Cancel Reservation", ["Driver"], ["POST /api/core/reservations/{id}/cancel"]),
            doneCriteria: defaultDoneCriteria("Cancel Reservation")
          },
          {
            id: "leaf-res-driver-history",
            title: "Driver Reservation History",
            type: "leaf_feature",
            clients: ["Driver"],
            endpoints: [
              "GET /api/support/reservations/me/active",
              "GET /api/support/reservations/me/history"
            ],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/reservations/me/history"),
            testCases: defaultApiTests("Driver Reservation History", ["Driver"], ["GET /api/support/reservations/me/history"]),
            doneCriteria: defaultDoneCriteria("Driver Reservation History")
          }
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
            endpoints: [
              "POST /api/core/lost-cards/{caseId}/documents",
              "POST /api/core/lost-cards/{caseId}/documents/batch",
              "GET /api/core/lost-cards/{caseId}/documents",
              "DELETE /api/core/lost-cards/{caseId}/documents/{documentId}"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/lost-cards/{caseId}/documents"),
            testCases: defaultApiTests("Lost Card Claim Management", ["Staff"], ["GET /api/core/lost-cards/{caseId}/documents"]),
            doneCriteria: [
              ...defaultDoneCriteria("Lost Card Claim Management"),
              { id: "dc-lost-docs", content: "Lost card documentation and replacement fee details are managed securely.", checked: false }
            ]
          },
          {
            id: "leaf-inc-mismatch",
            title: "Plate Mismatch Case",
            type: "leaf_feature",
            clients: ["Staff"],
            endpoints: [],
            ownerService: ".NET Core API",
            testCases: defaultApiTests("Plate Mismatch Case", ["Staff"], []),
            doneCriteria: defaultDoneCriteria("Plate Mismatch Case")
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
            clients: ["MANAGER", "ADMIN"],
            status: "ready",
            priority: "medium",
            tags: ["dashboard", "metrics", "read-only"],
            summary: "Provides a real-time operational dashboard for Managers and Administrators to monitor the current status of the parking building.",
            ownerService: "Spring Boot Support API",
            endpoints: ["GET /api/support/dashboard"],
            objective: "Provides a real-time operational dashboard for Managers and Administrators to monitor the current status of the parking building. The system aggregates real-time metrics directly from core tables such as parking_sessions, slots, lost_card_cases, and payments to present instant KPIs without causing table-locking overhead on the primary transactional write backend (.NET Core API).",
            inScope: [
              "Aggregate the number of available, occupied, and under-maintenance slots in real-time, categorized by floor/area.",
              "Count the total number of currently active parking sessions (ACTIVE).",
              "Count unresolved operational alerts: pending lost card cases (LOST_CARD_PENDING) and pending license plate mismatches (MISMATCH_PENDING).",
              "Compute tentative cumulative revenue collected during the current day (casual parking fees + monthly pass renewals)."
            ],
            outOfScope: [
              "Deep trend analysis over multiple years or AI-driven traffic forecasting.",
              "Real-time automated data pushing via WebSockets (the client handles data updates via periodic pulling/polling)."
            ],
            permissions: [
              { role: "MANAGER", permission: "Authorized to view all aggregated dashboard metrics for operational staff coordination." },
              { role: "ADMIN", permission: "Authorized to view all dashboard metrics to ensure system health and tracking stability." }
            ],
            businessRules: [
              "Read-Only Compliance: As a feature owned by the Spring Boot Support API, the service tier must strictly use SELECT queries and must never perform any insert, update, or delete actions against core tables.",
              "No Uncommitted Reads: Metrics calculations depend entirely on committed PostgreSQL transactional records, omitting uncommitted changes from the .NET Core API side.",
              "Data Shape Constraint: The payload must be encapsulated within the common project ApiResponse wrapper using camelCase for all Java-based JSON response keys."
            ],
            dbExistingTables: ["parking_sessions", "slots", "floors", "lost_card_cases", "payments"],
            dbRelationships: [
              "parking_sessions: Filter by ACTIVE state to count active instances.",
              "slots: Group by AVAILABLE, OCCUPIED, LOCKED statuses.",
              "floors: Map floor descriptions and categorize slot distributions.",
              "lost_card_cases: Count unresolved instances where state matches PENDING.",
              "payments: Sum total successful collections within the current day where status is PAID."
            ],
            validationRules: [
              { field: "token", rule: "Standard request token validation is enforced via the security context middleware layer. No complex request bodies are required for this aggregated fetch.", errorMessage: "TOKEN_INVALID_OR_EXPIRED" }
            ],
            securityRules: [
              "Enforce security role matching filters inside the Spring Security pipeline context, throwing an access denied response if the caller lacks MANAGER or ADMIN roles.",
              "Do not expose internal user credentials, session tokens, or sensitive network configurations within the response structure."
            ],
            logEvents: [
              "Log access to the dashboard (DASHBOARD_VIEWED) along with the performing Manager/Admin ID and execution duration for infrastructure performance tracking."
            ],
            noLogEvents: [],
            integrationPoints: [
              { system: "Spring Boot Support API", responsibility: "Executes read-only aggregation queries directly against PostgreSQL." }
            ],
            uiPage: "/manager/dashboard",
            uiComponents: "Points to the Spring Boot Support API port (supportApi - Port 8080).",
            uiStateLoading: "Renders a skeleton loader overlaying all quantitative metric cards and disables the manual \"Refresh Data\" action button.",
            uiStateEmpty: "N/A",
            uiStateError: "Displays an error toast message notification flagging connection dropouts or security denials.",
            uiStateSuccess: "Populates metric components with loaded numerical parameters and charts depicting floor capacity breakdowns.",
            notes: "Shared Enum Values: SlotStatus (AVAILABLE, OCCUPIED, LOCKED). SessionStatus (ACTIVE, LOST_CARD_PENDING, MISMATCH_PENDING). PaymentStatus (PAID).",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-support-dashboard",
                name: "GET /api/support/dashboard",
                content: `Method: GET\nPath: /api/support/dashboard\nHeaders:\n  Authorization: Bearer <token>\n\nSuccess Response (200 OK):\nSee Data Contracts.\n\nUnauthorized Response (401 Unauthorized):\n{\n  "success": false,\n  "message": "Unauthorized access.",\n  "data": null,\n  "errors": [\n    { "field": "token", "message": "TOKEN_INVALID_OR_EXPIRED" }\n  ],\n  "timestamp": "2026-07-08T01:07:00+07:00"\n}`
              }
            ],
            dataContracts: [
              {
                id: "mock-data-support-dashboard",
                name: "Mock Response (JSON)",
                content: `{\n  "success": true,\n  "message": "Dashboard summary retrieved successfully.",\n  "data": {\n    "activeSessionsCount": 142,\n    "totalSlots": 500,\n    "occupiedSlots": 320,\n    "availableSlots": 170,\n    "maintenanceSlots": 10,\n    "todayRevenue": 4850000.00,\n    "alerts": {\n      "pendingLostCards": 3,\n      "pendingPlateMismatches": 2\n    },\n    "floorSummaries": [\n      {\n        "floorId": 1,\n        "floorName": "Floor G",\n        "totalSlots": 150,\n        "occupiedSlots": 120,\n        "availableSlots": 30\n      },\n      {\n        "floorId": 2,\n        "floorName": "Floor B1",\n        "totalSlots": 150,\n        "occupiedSlots": 90,\n        "availableSlots": 60\n      }\n    ]\n  },\n  "errors": null,\n  "timestamp": "2026-07-08T01:07:00+07:00"\n}`
              }
            ],
            testCases: [
              {
                id: "tc-dashboard-01",
                title: "Verify authorized client (Manager) can access Support Dashboard successfully",
                type: "api",
                precondition: "The calling client is fully authenticated and possesses the role: MANAGER.",
                steps: [
                  "Dispatch an HTTP request: GET /api/support/dashboard alongside the valid Bearer token."
                ],
                expectedResult: "HTTP 200 OK is returned, where success equals true and the operational counters match the database state.",
                status: "not_started"
              },
              {
                id: "tc-dashboard-02",
                title: "Verify unauthorized role is rejected when accessing Support Dashboard",
                type: "api",
                precondition: "The user acts anonymously or holds an insufficient role such as DRIVER or STAFF.",
                steps: [
                  "Invoke endpoint GET /api/support/dashboard without a secure token or with a standard Staff token."
                ],
                expectedResult: "HTTP 403 Forbidden or 401 Unauthorized is returned, blocking illegal access to high-level metrics.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-dashboard-01", content: "Endpoints match the path specifications of /api/support/dashboard.", checked: false },
              { id: "dc-dashboard-02", content: "Identity checks validate Manager and Admin privileges successfully.", checked: false },
              { id: "dc-dashboard-03", content: "Execution flows are read-only, avoiding row locks or state alterations on core records.", checked: false },
              { id: "dc-dashboard-04", content: "Response structures conform precisely to the standard project ApiResponse entity wrapper.", checked: false }
            ]
          },
          {
            id: "leaf-rep-revenue",
            title: "Revenue Report",
            type: "leaf_feature",
            clients: ["MANAGER", "ADMIN"],
            status: "ready",
            priority: "high",
            tags: ["report", "revenue", "financial", "read-only"],
            summary: "Generates financial breakdowns for parking building operations within a chosen date range.",
            ownerService: "Spring Boot Support API",
            endpoints: ["GET /api/support/reports/revenue"],
            objective: "Generates financial breakdowns for parking building operations within a chosen date range. This component aggregates financial data across two separate operational revenue models: casual short-stay vehicle entry tariffs and long-term pre-allocated Monthly Pass subscription enrollments/renewals.",
            inScope: [
              "Filter and calculate data matching successful payment flows (PAID) that fall within the specified startDate and endDate boundaries.",
              "Separate revenue streams by category classification: short-stay tickets (CASUAL) and monthly subscription passes (MONTHLY_PASS).",
              "Aggregate data points grouped by individual days to enable frontend line or bar graph calculations."
            ],
            outOfScope: [
              "Monetary transaction refunds or invoice cancellations (handled exclusively through the transactional workflow of the .NET Core API engine)."
            ],
            permissions: [
              { role: "MANAGER", permission: "Granted read access to comprehensive financial reporting and revenue data streams for performance audits." },
              { role: "ADMIN", permission: "Granted access to view all financial data metrics for auditing across different backend databases." }
            ],
            businessRules: [
              "Separation of Read Concerns: Heavy aggregation actions (SUM, COUNT) run on optimized reporting queries in the Spring Boot Support API, keeping database resource usage separate from the checkout transaction workloads handled by the .NET Core API.",
              "Timezone Standardization: Parameters passed by the client (startDate, endDate) must convert cleanly to ISO 8601 UTC before executing PostgreSQL query lookups to prevent data grouping errors across varying timezone bounds."
            ],
            dbExistingTables: ["payments", "parking_sessions", "monthly_passes"],
            dbRelationships: [
              "payments: Retrieve amount, payment_method, status, and created_at fields to compile overall sum evaluations.",
              "parking_sessions: Evaluate historical tickets to extract casual billing values matching CASUAL classifications.",
              "monthly_passes: Identify invoice components tied to subscription additions/renewals matching MONTHLY_PASS criteria."
            ],
            validationRules: [
              { field: "startDate", rule: "Must be provided and match ISO 8601 UTC format constraints.", errorMessage: "START_DATE_REQUIRED" },
              { field: "endDate", rule: "Must be provided and fall on a timestamp equal to or greater than startDate.", errorMessage: "END_DATE_MUST_BE_AFTER_START_DATE" }
            ],
            securityRules: [
              "Explicit check evaluating the identity profile for either MANAGER or ADMIN roles before reading rows.",
              "Prevent SQL Injection by using named parameter queries or JPA Repository binding methods; raw concatenation of date text strings into query syntax is forbidden."
            ],
            logEvents: [
              "Record analytical query executions (REVENUE_REPORT_VIEWED) to audit trails to maintain transparency regarding access to corporate finance logs."
            ],
            noLogEvents: [],
            integrationPoints: [],
            uiPage: "/manager/reports/revenue",
            uiComponents: "Frontend analytical financial growth tracking panels.",
            uiStateLoading: "Renders a centralized progress loader over chart frames to signal heavy background data crunching.",
            uiStateEmpty: "If no successful transactions match the selected dates, render an empty dashboard indicator showing: 'No revenue records found for this period.'",
            uiStateError: "Display validation errors if date bounds are invalid.",
            uiStateSuccess: "Passes compiled array variables into frontend plotting utilities (e.g., Recharts or Chart.js) to render structured financial breakdowns.",
            notes: "Shared Enum Values: PaymentStatus: PAID.",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-revenue-report",
                name: "GET /api/support/reports/revenue",
                content: `Method: GET\nPath: /api/support/reports/revenue\nQuery Parameters:\n  startDate: "2026-06-01T00:00:00Z" (Required)\n  endDate: "2026-06-30T23:59:59Z" (Required)\nHeaders:\n  Authorization: Bearer <token>\n\nSuccess Response (200 OK):\nSee Data Contracts.\n\nValidation Error Response (400 Bad Request):\n{\n  "success": false,\n  "message": "Validation failed.",\n  "data": null,\n  "errors": [\n    { "field": "endDate", "message": "END_DATE_MUST_BE_AFTER_START_DATE" }\n  ],\n  "timestamp": "2026-07-08T01:07:00+07:00"\n}`
              }
            ],
            dataContracts: [
              {
                id: "mock-data-revenue-report",
                name: "Mock Response (JSON)",
                content: `{\n  "success": true,\n  "message": "Revenue report retrieved successfully.",\n  "data": {\n    "totalRevenue": 125000000.00,\n    "casualRevenueTotal": 75000000.00,\n    "monthlyPassRevenueTotal": 50000000.00,\n    "items": [\n      {\n        "date": "2026-06-01",\n        "casualRevenue": 2500000.00,\n        "monthlyPassRevenue": 2000000.00,\n        "dailyTotal": 4500000.00\n      },\n      {\n        "date": "2026-06-02",\n        "casualRevenue": 3000000.00,\n        "monthlyPassRevenue": 1500000.00,\n        "dailyTotal": 4500000.00\n      }\n    ]\n  },\n  "errors": null,\n  "timestamp": "2026-07-08T01:07:00+07:00"\n}`
              }
            ],
            testCases: [
              {
                id: "tc-rev-01",
                title: "Verify authorized client (Manager) can access Revenue Report successfully",
                type: "api",
                precondition: "Manager holds a legitimate non-expired authentication token.",
                steps: [
                  "Call: GET /api/support/reports/revenue?startDate=2026-06-01T00:00:00Z&endDate=2026-06-02T23:59:59Z."
                ],
                expectedResult: "Returns 200 OK where totalRevenue mathematically matches compiled payments for the specified range.",
                status: "not_started"
              },
              {
                id: "tc-rev-02",
                title: "Verify unauthorized role is rejected when accessing Revenue Report",
                type: "api",
                precondition: "The calling identity is assigned a standard guest or driver account profile (DRIVER).",
                steps: [
                  "Attempt to fetch financial metrics using the driver's security token."
                ],
                expectedResult: "Returns a 403 Forbidden status code, blocking access to restricted financial data.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-rev-01", content: "Financial data outputs align with the date boundaries submitted in query parameters.", checked: false },
              { id: "dc-rev-02", content: "Computed sums match database transactional entries in the payments tracking table.", checked: false },
              { id: "dc-rev-03", content: "Formatted JSON results use the ApiResponse structure required across the engineering ecosystem.", checked: false }
            ]
          },
          {
            id: "leaf-rep-traffic",
            title: "Traffic Report",
            type: "leaf_feature",
            clients: ["MANAGER", "ADMIN"],
            status: "ready",
            priority: "medium",
            tags: ["report", "traffic", "flow", "read-only"],
            summary: "Builds automated reporting structures highlighting vehicle movement flows throughout the facility.",
            ownerService: "Spring Boot Support API",
            endpoints: ["GET /api/support/reports/traffic"],
            objective: "Builds automated reporting structures highlighting vehicle movement flows throughout the facility. This feature breaks down the total volume of incoming vehicles (Inflow/Entries) alongside outgoing vehicles (Outflow/Exits) within scheduled monitoring intervals.",
            inScope: [
              "Calculate overall facility inflows by parsing timestamp strings inside the entry_time field of the parking_sessions table.",
              "Calculate vehicle exit activity by analyzing data trends inside the exit_time field of the parking_sessions database table.",
              "Provide enhanced filtering based on specific vehicle categories via the vehicleTypeId query parameter.",
              "Group volume outputs into hourly or daily buckets based on the requested date range."
            ],
            outOfScope: [
              "Manual modifications to entry/exit timestamps within this analytical context (timestamps are treated as immutable log entries)."
            ],
            permissions: [
              { role: "MANAGER", permission: "Authorized to evaluate traffic spikes to optimize lane management staffing across check-in lanes." },
              { role: "ADMIN", permission: "Full administrative clearance to extract and evaluate mobility logs." }
            ],
            businessRules: [
              "Database Index Optimization: Because parking_sessions accumulates millions of rows over time, the Spring Boot Support API leverages database indexes on the entry_time and exit_time columns to ensure query execution stays under 200ms, preventing full-table scans that could degrade database responsiveness."
            ],
            dbExistingTables: ["parking_sessions", "vehicle_types"],
            dbRelationships: [
              "parking_sessions: Analyze and count entries via entry_time, exit_time, and vehicle_type_id.",
              "vehicle_types: Validate the existence of specific type IDs if passed by the client."
            ],
            validationRules: [
              { field: "startDate / endDate", rule: "Mandatory fields conforming to standard ISO time strings.", errorMessage: "INVALID_DATE_FORMAT" },
              { field: "vehicleTypeId", rule: "If provided, the value must match a valid ID within the vehicle category configuration matrix.", errorMessage: "VEHICLE_TYPE_NOT_FOUND" }
            ],
            securityRules: [
              "Strict JWT authentication token parsing on every request. Unauthenticated or unauthorized requests must be rejected immediately with an HTTP 401 or 403 status code."
            ],
            logEvents: [
              "Log the reporting event (TRAFFIC_REPORT_VIEWED) with details of the applied filter parameters and the active user ID."
            ],
            noLogEvents: [],
            integrationPoints: [],
            uiPage: "/manager/reports/traffic",
            uiComponents: "Dual-bar chart layout to contrast inflow patterns against exit patterns.",
            uiStateLoading: "Renders a semi-transparent loading state over chart frames while the background request resolves.",
            uiStateEmpty: "N/A",
            uiStateError: "Display validation errors.",
            uiStateSuccess: "Feeds array data into a dual-bar chart layout to contrast inflow patterns against exit patterns.",
            notes: "Must optimize queries with DB indexes.",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-traffic-report",
                name: "GET /api/support/reports/traffic",
                content: `Method: GET\nPath: /api/support/reports/traffic\nQuery Parameters:\n  startDate: "2026-07-01T00:00:00Z" (Required)\n  endDate: "2026-07-07T23:59:59Z" (Required)\n  vehicleTypeId: 1 (Optional - isolate tracking to a singular vehicle type)\nHeaders:\n  Authorization: Bearer <token>\n\nSuccess Response (200 OK):\nSee Data Contracts.`
              }
            ],
            dataContracts: [
              {
                id: "mock-data-traffic-report",
                name: "Mock Response (JSON)",
                content: `{\n  "success": true,\n  "message": "Traffic report retrieved successfully.",\n  "data": {\n    "totalEntries": 1500,\n    "totalExits": 1420,\n    "items": [\n      {\n        "timeLabel": "2026-07-01",\n        "entriesCount": 700,\n        "exitsCount": 650\n      },\n      {\n        "timeLabel": "2026-07-02",\n        "entriesCount": 800,\n        "exitsCount": 770\n      }\n    ]\n  },\n  "errors": null,\n  "timestamp": "2026-07-08T01:07:00+07:00"\n}`
              }
            ],
            testCases: [
              {
                id: "tc-traffic-01",
                title: "Verify authorized client (Manager) can access Traffic Report successfully",
                type: "api",
                precondition: "Manager holds a legitimate authentication profile and valid token.",
                steps: [
                  "Call: GET /api/support/reports/traffic?startDate=2026-07-01T00:00:00Z&endDate=2026-07-07T23:59:59Z."
                ],
                expectedResult: "HTTP 200 OK response containing discrete daily counts for both entriesCount and exitsCount.",
                status: "not_started"
              },
              {
                id: "tc-traffic-02",
                title: "Verify unauthorized role is rejected when accessing Traffic Report",
                type: "api",
                precondition: "Anonymous request missing secure authorization headers.",
                steps: [
                  "Call the endpoint without providing an Authorization header."
                ],
                expectedResult: "The security middleware blocks execution, returning an HTTP 401 Unauthorized status.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-traffic-01", content: "Aggregated metrics match database record counts when validating entry/exit timestamps manually.", checked: false },
              { id: "dc-traffic-02", content: "API performance stays snappy, resolving heavy lookups in under 200ms due to optimized database indexes.", checked: false }
            ]
          },
          {
            id: "leaf-rep-occupancy",
            title: "Occupancy Report",
            type: "leaf_feature",
            clients: ["MANAGER", "ADMIN"],
            status: "ready",
            priority: "medium",
            tags: ["report", "occupancy", "utilization", "read-only"],
            summary: "Provides analytical breakdowns detailing space utilization efficiency over time.",
            ownerService: "Spring Boot Support API",
            endpoints: ["GET /api/support/reports/occupancy"],
            objective: "Provides analytical breakdowns detailing space utilization efficiency over time. This functionality allows the management team to monitor space utilization trends, identify peak utilization windows, and analyze vehicle stay durations to optimize slot allocations.",
            inScope: [
              "Compute space utilization percentages by analyzing allocation data from the slots and parking_sessions tables over a designated date range.",
              "Calculate the average vehicle stay duration, normalized to minutes.",
              "Support granular filtering by Floor (floorId) or Area (areaId) to evaluate specific facility zones."
            ],
            outOfScope: [
              "Manually forcing slot state overrides within this reporting view (slot state modification is restricted to transactional core flows)."
            ],
            permissions: [
              { role: "MANAGER", permission: "Authorized to evaluate space utilization metrics to optimize layout allocations for fixed monthly vs. casual parking spaces." },
              { role: "ADMIN", permission: "Full system clearance to access space utilization metrics across the entire facility." }
            ],
            businessRules: [
              "Strict Read Integrity: Analytical space queries run independently on the Spring Boot Support API. Occupancy calculations use real-time and historical check-in data stored within the shared PostgreSQL schema."
            ],
            dbExistingTables: ["parking_sessions", "slots", "areas", "floors"],
            dbRelationships: [
              "parking_sessions: Calculate vehicle stay durations by computing differences between entry and exit timestamps.",
              "slots: Query total capacity counts to use as the denominator for occupancy percentage calculations.",
              "areas / floors: Map layout relationships and handle parent-child filtering."
            ],
            validationRules: [
              { field: "floorId", rule: "If provided, the identifier must map to an existing record within the database.", errorMessage: "FLOOR_NOT_FOUND" },
              { field: "areaId", rule: "If provided, the area identifier must map to a valid record associated with the designated floorId.", errorMessage: "AREA_NOT_FOUND" }
            ],
            securityRules: [
              "Enforce JWT validation and evaluate caller permissions at the gateway level to block unauthorized external access to internal infrastructure layout metrics."
            ],
            logEvents: [
              "Record analytical query executions (OCCUPANCY_REPORT_VIEWED) to audit trails, including the identifier of the tracking auditor."
            ],
            noLogEvents: [],
            integrationPoints: [],
            uiPage: "/manager/reports/occupancy",
            uiComponents: "Heatmap chart visualization, pie charts depicting active space distribution.",
            uiStateLoading: "Renders a pulsing loading indicator over the percentage data containers.",
            uiStateEmpty: "N/A",
            uiStateError: "Display validation errors.",
            uiStateSuccess: "Renders weekly peak congestion periods using a heatmap chart visualization, paired with pie charts depicting active space distribution.",
            notes: "",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-occupancy-report",
                name: "GET /api/support/reports/occupancy",
                content: `Method: GET\nPath: /api/support/reports/occupancy\nQuery Parameters:\n  floorId: 1 (Optional - restrict tracking data to a specific building floor)\n  areaId: 2 (Optional - narrow evaluation to a single designated area code)\nHeaders:\n  Authorization: Bearer <token>\n\nSuccess Response (200 OK):\nSee Data Contracts.`
              }
            ],
            dataContracts: [
              {
                id: "mock-data-occupancy-report",
                name: "Mock Response (JSON)",
                content: `{\n  "success": true,\n  "message": "Occupancy report retrieved successfully.",\n  "data": {\n    "averageOccupancyRate": 64.5,\n    "peakOccupancyPercentage": 92.0,\n    "peakOccupancyTime": "2026-07-07T14:00:00Z",\n    "averageStayDurationMinutes": 185,\n    "utilizationByArea": [\n      {\n        "areaName": "Area A - SUV Only",\n        "utilizationRate": 78.2\n      },\n      {\n        "areaName": "Area B - Sedan Only",\n        "utilizationRate": 52.1\n      }\n    ]\n  },\n  "errors": null,\n  "timestamp": "2026-07-08T01:07:00+07:00"\n}`
              }
            ],
            testCases: [
              {
                id: "tc-occ-01",
                title: "Verify authorized client (Manager) can access Occupancy Report successfully",
                type: "api",
                precondition: "Caller logs in with Manager privileges and provides a valid JWT token.",
                steps: [
                  "Call: GET /api/support/reports/occupancy?floorId=1."
                ],
                expectedResult: "HTTP 200 OK response containing calculated percentages and average duration metrics.",
                status: "not_started"
              },
              {
                id: "tc-occ-02",
                title: "Verify unauthorized role is rejected when accessing Occupancy Report",
                type: "api",
                precondition: "Caller holds a standard floor operator profile (STAFF) that lacks reporting access clearance.",
                steps: [
                  "Attempt to fetch space utilization data using the staff security token."
                ],
                expectedResult: "Returns an HTTP 403 Forbidden status code, blocking unauthorized access.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-occ-01", content: "Percentage calculations generate mathematical bounds between 0% and 100%.", checked: false },
              { id: "dc-occ-02", content: "Formatted JSON results use the common project ApiResponse wrapper structure.", checked: false }
            ]
          },
          {
            id: "leaf-rep-card",
            title: "Card Session Report",
            type: "leaf_feature",
            clients: ["MANAGER", "ADMIN"],
            status: "ready",
            priority: "medium",
            tags: ["report", "card", "sessions", "history", "read-only"],
            summary: "Generates detailed historical tracking summaries for specific physical parking RFID cards.",
            ownerService: "Spring Boot Support API",
            endpoints: ["GET /api/support/reports/card-session"],
            objective: "Generates detailed historical tracking summaries for specific physical parking RFID cards (parking_cards). This report serves as an investigative tool for management to audit historical entries and exits associated with a single token, which helps resolve driver disputes, process lost card claims, or investigate license plate discrepancies.",
            inScope: [
              "Return a paginated list of all parking sessions (parking_sessions) linked to a unique physical card identifier (cardCode).",
              "Support session state filtering across key lifecycles (ACTIVE, COMPLETED, CANCELLED).",
              "Output detailed session attributes: check-in/check-out plate photos, arrival/departure timestamps, assigned space metrics, and transaction receipt statuses."
            ],
            outOfScope: [
              "Manually overriding card operational states from IN_USE to AVAILABLE (restricted to the .NET Core write-heavy transaction engine)."
            ],
            permissions: [
              { role: "MANAGER", permission: "Authorized to view card tracking data to resolve on-site customer disputes and verify parking fees." },
              { role: "ADMIN", permission: "Full system clearance to query historical card usage logs for infrastructure auditing." }
            ],
            businessRules: [
              "Strict Read-Only Operations: The reporting layer performs clean relational lookups (JOIN) across parking_sessions, parking_cards, and payments to reconstruct the vehicle tracking history without modifying core tracking fields."
            ],
            dbExistingTables: ["parking_sessions", "parking_cards", "payments"],
            dbRelationships: [
              "parking_sessions: Primary source for historical vehicle tracking records.",
              "parking_cards: Join targeting the specific physical card text identifier card_code.",
              "payments: Extract transaction data associated with the parking session."
            ],
            validationRules: [
              { field: "cardCode", rule: "Required search parameter; cannot be empty or blank.", errorMessage: "CARD_CODE_REQUIRED" },
              { field: "page / pageSize", rule: "Must resolve to valid positive integers greater than zero.", errorMessage: "INVALID_PAGINATION_PARAMETERS" }
            ],
            securityRules: [
              "Enforce JWT validation and verify manager or administrator roles before executing lookups."
            ],
            logEvents: [
              "Record the audit tracking action (CARD_REPORT_VIEWED), logging the unique card code string that was scrutinized by the operator."
            ],
            noLogEvents: [],
            integrationPoints: [],
            uiPage: "/manager/reports/card-session",
            uiComponents: "Paginated data grid component featuring status color badges.",
            uiStateLoading: "Skeleton loading state over the table.",
            uiStateEmpty: "If a newly provisioned card has no historical entry scans, display an empty state indicator: 'No parking sessions recorded for this card.'",
            uiStateError: "Display validation error for missing card.",
            uiStateSuccess: "Populates a paginated data grid component featuring status color badges corresponding to individual session states.",
            notes: "Shared Enum Values: SessionStatus (ACTIVE, COMPLETED, CANCELLED, LOST_CARD_PENDING, MISMATCH_PENDING).",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-card-session",
                name: "GET /api/support/reports/card-session",
                content: `Method: GET\nPath: /api/support/reports/card-session\nQuery Parameters:\n  cardCode: "CARD-9912" (Required)\n  status: "COMPLETED" (Optional)\n  page: 1 (Default)\n  pageSize: 10 (Default)\nHeaders:\n  Authorization: Bearer <token>\n\nSuccess Response (200 OK):\nSee Data Contracts.`
              }
            ],
            dataContracts: [
              {
                id: "mock-data-card-session",
                name: "Mock Response (JSON)",
                content: `{\n  "success": true,\n  "message": "Card session history retrieved successfully.",\n  "data": {\n    "items": [\n      {\n        "sessionId": 1024,\n        "cardCode": "CARD-9912",\n        "entryPlateNumber": "51A-99999",\n        "exitPlateNumber": "51A-99999",\n        "entryTime": "2026-07-05T08:00:00Z",\n        "exitTime": "2026-07-05T17:30:00Z",\n        "slotCode": "F1-A12",\n        "sessionStatus": "COMPLETED",\n        "payment": {\n          "amount": 45000.00,\n          "status": "PAID"\n        }\n      }\n    ],\n    "page": 1,\n    "pageSize": 10,\n    "totalItems": 1,\n    "totalPages": 1\n  },\n  "errors": null,\n  "timestamp": "2026-07-08T01:07:00+07:00"\n}`
              }
            ],
            testCases: [
              {
                id: "tc-card-01",
                title: "Verify authorized client (Manager) can access Card Session Report successfully",
                type: "api",
                precondition: "Caller holds an authenticated Manager profile and matching token context.",
                steps: [
                  "Call: GET /api/support/reports/card-session?cardCode=CARD-9912&page=1&pageSize=10."
                ],
                expectedResult: "HTTP 200 OK response containing a paginated array alongside related payment details.",
                status: "not_started"
              },
              {
                id: "tc-card-02",
                title: "Verify unauthorized role is rejected when accessing Card Session Report",
                type: "api",
                precondition: "Request is sent anonymously without a secure token header.",
                steps: [
                  "Call the endpoint without providing an Authorization header."
                ],
                expectedResult: "Security layers block execution, returning an HTTP 401 Unauthorized status.",
                status: "not_started"
              },
              {
                id: "tc-card-03",
                title: "Verify request with expired reservation or session token is rejected",
                type: "api",
                precondition: "Expired token.",
                steps: [
                  "Call the endpoint with an expired JWT."
                ],
                expectedResult: "The gateway pipeline catches the expired timestamp parameter, returning a TOKEN_EXPIRED validation error wrapper alongside an HTTP 401 status.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-card-01", content: "Pagination controls work correctly, returning exact offsets matching page and pageSize parameters while maintaining an accurate totalItems count.", checked: false },
              { id: "dc-card-02", content: "Output structures match the standardized project ApiResponse entity wrapper layout.", checked: false }
            ]
          },
          {
            id: "leaf-rep-export",
            title: "Generic Report Export",
            type: "leaf_feature",
            clients: ["MANAGER", "ADMIN"],
            status: "ready",
            priority: "medium",
            tags: ["export", "excel", "poi", "read-only"],
            summary: "Provides a centralized data exporting feature that generates spreadsheet files (.xlsx) using Apache POI on the Spring Boot Support API.",
            ownerService: "Spring Boot Support API",
            endpoints: ["GET /api/support/reports/export"],
            objective: "Provides a centralized data exporting feature that generates spreadsheet files (.xlsx) using Apache POI on the Spring Boot Support API. This utility allows operators to download raw datasets for revenue records, traffic metrics, space utilization statistics, or card tracking summaries to support offline data archiving and corporate auditing.",
            inScope: [
              "Dynamically generate binary spreadsheet streams conforming to OpenXML standards (.xlsx).",
              "Parse the reportType parameter to load matching data structures (REVENUE, TRAFFIC, OCCUPANCY, CARD_SESSION).",
              "Populate rows using database entries from PostgreSQL, apply custom table header styles, and auto-adjust cell sizing parameters via Java code."
            ],
            outOfScope: [
              "Exporting data to alternate file formats like PDF or raw CSV (restricted to .xlsx formats for the MVP)."
            ],
            permissions: [
              { role: "MANAGER", permission: "Authorized to export operational spreadsheets for business reviews and administrative archiving." },
              { role: "ADMIN", permission: "Full clearance to download any operational dataset from the facility database." }
            ],
            businessRules: [
              "Backend Tech-Stack Boundary: As defined in the system architecture design, intensive spreadsheet compilation tasks run exclusively on the Spring Boot Support API using Apache POI. This keeps the .NET Core write-heavy container stream light and free from heavy memory-allocation overhead."
            ],
            dbExistingTables: ["payments", "parking_sessions", "slots"],
            dbRelationships: [
              "Directly queries target tables based on the requested report type parameter (payments, parking_sessions, slots, etc.), identical to standard read lookups."
            ],
            validationRules: [
              { field: "reportType", rule: "Must be provided and match one of the predefined report type classifications.", errorMessage: "INVALID_REPORT_TYPE" },
              { field: "startDate / endDate", rule: "Mandatory date fields; the search range cannot exceed 366 days to protect server memory allocation limits.", errorMessage: "DATE_RANGE_EXCEEDS_LIMIT" }
            ],
            securityRules: [
              "Validate the caller's JWT token context before allocating memory buffers to process the binary spreadsheet streams."
            ],
            logEvents: [
              "Record the export action (REPORT_DATA_EXPORTED), logging the targeted report type, the data size in bytes, and the user identifier to trace potential data leaks."
            ],
            noLogEvents: [],
            integrationPoints: [],
            uiPage: "/manager/reports/*",
            uiComponents: "Integrated within individual reporting views as an 'Export to Excel' action button.",
            uiStateLoading: "Clicking the action button switches it to a loading state displaying a spinner and the text 'Generating Spreadsheet...'. The button is disabled to prevent duplicate submissions.",
            uiStateEmpty: "N/A",
            uiStateError: "Display error message if export fails.",
            uiStateSuccess: "Receives the incoming file stream as a binary blob object and triggers the browser's native file download workflow.",
            notes: "",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-export",
                name: "GET /api/support/reports/export",
                content: `Method: GET\nPath: /api/support/reports/export\nQuery Parameters:\n  reportType: "REVENUE" (Required - REVENUE, TRAFFIC, OCCUPANCY, CARD_SESSION)\n  startDate: "2026-06-01T00:00:00Z" (Required)\n  endDate: "2026-06-30T23:59:59Z" (Required)\nHeaders:\n  Authorization: Bearer <token>\n\nSuccess Response (200 OK):\nHeaders:\n  Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\n  Content-Disposition: attachment; filename=revenue_report_20260601_20260630.xlsx\n\nBody: Raw binary byte stream containing the compiled spreadsheet document.`
              }
            ],
            dataContracts: [],
            testCases: [
              {
                id: "tc-export-01",
                title: "Verify authorized client (Manager) can access Generic Report Export successfully",
                type: "api",
                precondition: "Caller logs in with Manager privileges and provides a valid JWT token.",
                steps: [
                  "Call: GET /api/support/reports/export?reportType=REVENUE&startDate=2026-06-01T00:00:00Z&endDate=2026-06-30T23:59:59Z."
                ],
                expectedResult: "HTTP 200 OK response containing the uncorrupted downloadable file stream.",
                status: "not_started"
              },
              {
                id: "tc-export-02",
                title: "Verify unauthorized role is rejected when accessing Generic Report Export",
                type: "api",
                precondition: "A standard driver profile (DRIVER) attempts to download internal financial data.",
                steps: [
                  "Call the endpoint using the driver's security token."
                ],
                expectedResult: "Returns an HTTP 403 Forbidden status code, blocking the download.",
                status: "not_started"
              },
              {
                id: "tc-export-03",
                title: "Verify export endpoint returns correct spreadsheet binary type",
                type: "api",
                precondition: "Valid request.",
                steps: [
                  "Check response headers."
                ],
                expectedResult: "The endpoint must return a Content-Type header matching application/vnd.openxmlformats-officedocument.spreadsheetml.sheet so the browser processes the binary stream correctly.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-export-01", content: "Generates valid Excel spreadsheets that open cleanly in Microsoft Excel or Google Sheets without data corruption warnings.", checked: false },
              { id: "dc-export-02", content: "Exported rows and cells perfectly match the real-time data displayed within the web interface.", checked: false }
            ]
          },
          {
            id: "leaf-rep-audit",
            title: "Audit Log Export",
            type: "leaf_feature",
            clients: ["ADMIN"],
            status: "ready",
            priority: "medium",
            tags: ["export", "excel", "audit", "security", "admin-only"],
            summary: "Provides an administrative tool that exports system security logs (audit_logs) directly into an Excel spreadsheet (.xlsx), restricted exclusively to the ADMIN role.",
            ownerService: "Spring Boot Support API",
            endpoints: ["GET /api/audit-logs/export"],
            objective: "Provides an administrative tool that exports system security logs (audit_logs) directly into an Excel spreadsheet (.xlsx), restricted exclusively to the ADMIN role. This feature supports security reviews and compliance auditing by allowing administrators to trace high-level mutations.",
            inScope: [
              "Filter security logs within the audit_logs table based on a specified date range (startDate, endDate), target operator ID (userId), or distinct action code (action).",
              "Export files containing complete tracking columns: Activity Timestamps, User Identifiers, Operator Full Names, Action Titles, Originating Service Flags (CORE_API or SUPPORT_API), Mutation Metadata payloads, and Client IP addresses."
            ],
            outOfScope: [
              "Exporting sensitive security values such as plain text passwords or raw authentication cryptographic tokens within the document."
            ],
            permissions: [
              { role: "ADMIN", permission: "Exclusive access clearance to invoke and extract the compiled system audit trailing files." }
            ],
            businessRules: [
              "Strict Privacy Masking Constraint: When writing database rows to the spreadsheet cells, the Spring Boot Support API must mask or omit personal credentials, hashed passwords, or active authorization strings to minimize data exposure risks if the exported file is shared."
            ],
            dbExistingTables: ["audit_logs", "users"],
            dbRelationships: [
              "audit_logs: The centralized tracking table containing append-only records from both backend APIs.",
              "users: Join query mapping the actor's full_name via the foreign key relationship on user_id."
            ],
            validationRules: [
              { field: "startDate / endDate", rule: "Mandatory date parameters; the exported search window cannot exceed 31 days to safeguard database responsiveness.", errorMessage: "AUDIT_EXPORT_RANGE_EXCEEDS_31_DAYS" }
            ],
            securityRules: [
              "Admin Role Enforcement: The Spring Security filtering layer handles incoming requests directly. If the caller lacks an explicit ADMIN role classification, execution halts immediately before running database queries."
            ],
            logEvents: [
              "Because exporting security logs is a sensitive administrative action, the system must write an append-only entry to the log table (AUDIT_LOGS_EXPORTED) to document which administrator extracted the security files."
            ],
            noLogEvents: [],
            integrationPoints: [],
            uiPage: "/admin/audit-logs",
            uiComponents: "Button to trigger export, modal overlay during generation.",
            uiStateLoading: "Renders a full-screen blurred background loading overlay containing a security notification banner: 'Compiling system security records, please wait...'.",
            uiStateEmpty: "N/A",
            uiStateError: "Display error message if export fails.",
            uiStateSuccess: "Closes the modal overlay view and triggers the browser's native file download workflow to save the spreadsheet.",
            notes: "",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-audit-export",
                name: "GET /api/audit-logs/export",
                content: `Method: GET\nPath: /api/audit-logs/export\nQuery Parameters:\n  startDate: "2026-07-01T00:00:00Z" (Required)\n  endDate: "2026-07-08T23:59:59Z" (Required)\n  action: "SESSION_CANCELLED" (Optional - filter by a specific action classification code)\nHeaders:\n  Authorization: Bearer <token>\n\nSuccess Response (200 OK):\nHeaders:\n  Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\n  Content-Disposition: attachment; filename=system_audit_logs_20260701.xlsx\n\nBody: Raw binary byte stream containing the compiled audit log spreadsheet.`
              }
            ],
            dataContracts: [],
            testCases: [
              {
                id: "tc-audit-exp-01",
                title: "Verify authorized client (Admin) can access Audit Log Export successfully",
                type: "api",
                precondition: "Caller holds administrative privileges and provides a valid JWT token context.",
                steps: [
                  "Call: GET /api/audit-logs/export?startDate=2026-07-01T00:00:00Z&endDate=2026-07-02T23:59:59Z."
                ],
                expectedResult: "HTTP 200 OK response containing the uncorrupted downloadable file stream with all system modification rows intact.",
                status: "not_started"
              },
              {
                id: "tc-audit-exp-02",
                title: "Verify unauthorized role is rejected when accessing Audit Log Export",
                type: "api",
                precondition: "A standard facility manager profile (MANAGER) attempts to download high-level system logs.",
                steps: [
                  "Call the endpoint using the manager's security token."
                ],
                expectedResult: "Returns an HTTP 403 Forbidden status code, blocking access.",
                status: "not_started"
              },
              {
                id: "tc-audit-exp-03",
                title: "Verify export endpoint returns correct spreadsheet binary type",
                type: "api",
                precondition: "Valid request.",
                steps: [
                  "Check response headers."
                ],
                expectedResult: "The endpoint must return a Content-Type header matching application/vnd.openxmlformats-officedocument.spreadsheetml.sheet to ensure correct browser handling.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-audit-exp-01", content: "Access is restricted exclusively to the administrative profile ADMIN.", checked: false },
              { id: "dc-audit-exp-02", content: "Hashed credentials, private key indicators, or active token values are stripped from all spreadsheet rows.", checked: false },
              { id: "dc-audit-exp-03", content: "Successfully logs an internal entry within the audit table documenting the export activity.", checked: false }
            ]
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
                content: "public class PublicParkingInfoResponse {\n    private List<CapacitySummaryDto> capacitySummary;\n    private List<PricingSummaryDto> pricingSummary;\n    private List<String> vehicleTypes;\n    private ParkingRulesDto parkingRules;\n    // getters and setters\n}"
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
            status: "draft",
            priority: "medium",
            tags: ["public", "feedback", "write"],
            summary: "Allows public guests or authenticated drivers to submit opinions, feedback, infrastructure incident reports, or service complaints regarding the parking building operation.",
            ownerService: "Spring Boot Support API",
            endpoints: ["POST /api/public/feedbacks"],
            objective: "Allows public guests or authenticated drivers to submit opinions, feedback, infrastructure incident reports, or service complaints regarding the parking building operation. This information enables the Management Board to optimize operational workflows and service quality.",
            inScope: [
              "Process and validate the incoming request payload.",
              "Persist the feedback record to the shared PostgreSQL database.",
              "Return a uniform API success or error wrapper to the client application."
            ],
            outOfScope: [
              "Binary file uploads or attachments (images/videos), which are deferred to future phases.",
              "Direct email delivery notifications (handled asynchronously via a background queue worker later)."
            ],
            permissions: [
              { role: "Guest", permission: "Authorized - Allowed to call this public API anonymously; no JWT header required." },
              { role: "Driver", permission: "Authorized - Allowed to submit feedback; the system dynamically binds their authenticated user_id." }
            ],
            businessRules: [
              "This API endpoint is independently maintained by the Spring Boot Support API and saves data directly to the shared PostgreSQL instance. All timestamps must strictly follow the TIMESTAMPTZ standard.",
              "When submitted by an anonymous Guest, the email attribute is encouraged to provide a communication channel.",
              "The initial processing state of any newly created feedback record is forced by default to OPEN.",
              "Custom categories and status tags must be processed and persisted as uppercase string literals (VARCHAR)."
            ],
            dbExistingTables: ["feedbacks", "users"],
            dbRelationships: ["feedbacks.user_id holds an N-to-1 relationship mapping back to users.id with a fallback strategy keeping data on profile deletion."],
            validationRules: [
              { field: "title", rule: "Not Blank, Maximum 200 characters", errorMessage: "Title is required and must not exceed 200 characters." },
              { field: "content", rule: "Not Blank", errorMessage: "Content is required." },
              { field: "category", rule: "Not Blank, Maximum 50 characters. Allowed values: GENERAL, PAYMENT, SERVICE, OTHER", errorMessage: "Category is required and must not exceed 50 characters." },
              { field: "email", rule: "Optional, must conform to standard email syntax if present", errorMessage: "Invalid email format." }
            ],
            securityRules: [
              "The API route relies on the /api/public/* contextual path hierarchy, permitting bypass routines inside SecurityConfig for anonymous usage.",
              "Sensitive properties or internal stack traces are completely masked out of the response layer."
            ],
            logEvents: [
              "Basic runtime data collection using standard logger formats (e.g., tracking submission counts and classification groups)."
            ],
            noLogEvents: [
              "Plaintext passwords or active bearer authorization credentials."
            ],
            integrationPoints: [
              { system: "Shared PostgreSQL Database", responsibility: "Executes relational writes directly to the shared target PostgreSQL database layer." }
            ],
            uiPage: "/feedback",
            uiComponents: "FeedbackForm (src/pages/public), Title Input, Content Textarea, Category Select (GENERAL/PAYMENT/SERVICE/OTHER), Email Input (optional), Submit Button",
            uiStateLoading: "Disable all inputs and submit button, show loading spinner on submit button to prevent duplicate submission.",
            uiStateEmpty: "N/A - this is a write form.",
            uiStateError: "Display field-level validation error messages below respective inputs. Display general banner for unexpected server errors.",
            uiStateSuccess: "Show success toast: 'Your feedback has been submitted successfully. Thank you!' and reset the form.",
            notes: "When submitted by Guest (no token), user_id is stored as NULL. When submitted by authenticated Driver, extract user_id from JWT claims automatically. Status is always set to OPEN on creation.",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-submit-feedback",
                name: "POST /api/public/feedbacks",
                content: `Method: POST
Path: /api/public/feedbacks
Headers:
  Authorization: Bearer <token> (Optional - only required for logged-in Drivers)
  Content-Type: application/json

Request Body:
{
  "title": "Ham B1 quet the qua cham",
  "content": "He thong nhan dien bien so tai ham B1 mat hon 2 phut luc cao diem 18h ngay 05/07.",
  "category": "SERVICE",
  "email": "driver.test@gmail.com"
}

Response (201 Created):
{
  "success": true,
  "message": "FEEDBACK_SUBMITTED_SUCCESSFULLY",
  "data": {
    "id": 12,
    "title": "Ham B1 quet the qua cham",
    "content": "He thong nhan dien bien so tai ham B1 mat hon 2 phut luc cao diem 18h ngay 05/07.",
    "category": "SERVICE",
    "email": "driver.test@gmail.com",
    "status": "OPEN",
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
      "field": "title",
      "message": "Title is required and must not exceed 200 characters."
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
                content: "public class SubmitFeedbackRequest {\n    @NotBlank @Size(max = 200)\n    private String title;\n\n    @NotBlank\n    private String content;\n\n    @NotBlank @Size(max = 50)\n    private String category; // GENERAL, PAYMENT, SERVICE, OTHER\n\n    @Email\n    private String email; // Optional\n    // getters and setters\n}\n\npublic class SubmitFeedbackResponse {\n    private Long id;\n    private String title;\n    private String content;\n    private String category;\n    private String email;\n    private String status; // Always OPEN on creation\n    private Instant createdAt;\n    // getters and setters\n}"
              }
            ],
            testCases: [
              {
                id: "tc-feed-submit-01",
                title: "Verify anonymous Guest can submit feedback successfully",
                type: "api",
                precondition: "No Authorization headers passed.",
                steps: [
                  "Dispatch payload with correct text blocks and category to POST /api/public/feedbacks.",
                  "Verify the HTTP response code evaluates to 201 Created."
                ],
                expectedResult: "System stores the data safely with user_id bound as NULL and status saved as 'OPEN'. Response body matches the standard wrapper with success=true.",
                status: "not_started"
              },
              {
                id: "tc-feed-submit-02",
                title: "Verify authenticated Driver submission binds user_id correctly",
                type: "api",
                precondition: "Valid Driver JWT token is provided in the Authorization header.",
                steps: [
                  "Send POST /api/public/feedbacks with a valid Bearer token.",
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
                  "Trigger execution against POST /api/public/feedbacks passing an empty string inside the title parameter.",
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
                  "Send POST /api/public/feedbacks with email set to 'not-an-email'."
                ],
                expectedResult: "Returns 400 Bad Request with error message 'Invalid email format.'",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-feed-submit-01", content: "API contract matches the standard global response format ApiResponse<T>.", checked: false },
              { id: "dc-feed-submit-02", content: "Route authentication filters correctly handle anonymous client requests (no JWT required).", checked: false },
              { id: "dc-feed-submit-03", content: "Functional validations protect structural parameters effectively (title, content, category required).", checked: false },
              { id: "dc-feed-submit-04", content: "Status is always set to OPEN on creation regardless of client input.", checked: false },
              { id: "dc-feed-submit-05", content: "Guest submissions store user_id as NULL; authenticated Driver submissions bind user_id from JWT.", checked: false },
              { id: "dc-feed-submit-06", content: "No sensitive data or internal stack traces are exposed in error responses.", checked: false }
            ]
          },
          {
            id: "leaf-feed-list",
            title: "Feedback Management List",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            status: "draft",
            priority: "medium",
            tags: ["admin", "feedback", "list", "paginated"],
            summary: "Administrative dashboard endpoint for Managers and Administrators to fetch, filter, and paginate through historical user feedback collections.",
            ownerService: "Spring Boot Support API",
            endpoints: ["GET /api/support/feedbacks"],
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
              "Data payload results must use a standardized paginated response schema wrapper tracking record counts accurately."
            ],
            dbExistingTables: ["feedbacks"],
            dbRelationships: ["Joins or projection lookups connect back to user profiles if the user_id property contains numeric references."],
            validationRules: [
              { field: "page", rule: "Integer type, minimum value of 1", errorMessage: "Page index must be greater than or equal to 1." },
              { field: "pageSize", rule: "Integer type, range bounded between 1 and 100", errorMessage: "Page size must be between 1 and 100." },
              { field: "status", rule: "Optional. If provided, must be one of: OPEN, RESOLVED, REJECTED", errorMessage: "Invalid status filter value." },
              { field: "category", rule: "Optional. If provided, must be one of: GENERAL, PAYMENT, SERVICE, OTHER", errorMessage: "Invalid category filter value." }
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
                name: "GET /api/support/feedbacks",
                content: `Method: GET
Path: /api/support/feedbacks
Query Parameters (Optional): status=OPEN&category=SERVICE&page=1&pageSize=10
Headers:
  Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": 12,
        "title": "Ham B1 quet the qua cham",
        "category": "SERVICE",
        "email": "driver.test@gmail.com",
        "status": "OPEN",
        "createdAt": "2026-07-07T15:30:00Z"
      },
      {
        "id": 11,
        "title": "Gia gui xe cao hon thong bao",
        "category": "PAYMENT",
        "email": "guest.user@gmail.com",
        "status": "RESOLVED",
        "createdAt": "2026-07-06T10:00:00Z"
      },
      {
        "id": 10,
        "title": "Den tang B2 khong sang",
        "category": "SERVICE",
        "email": null,
        "status": "OPEN",
        "createdAt": "2026-07-05T08:45:00Z"
      }
    ],
    "page": 1,
    "pageSize": 10,
    "totalItems": 3,
    "totalPages": 1
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
                content: "public class FeedbackListItemDto {\n    private Long id;\n    private String title;\n    private String category;\n    private String email;\n    private String status;\n    private Instant createdAt;\n    // getters and setters\n}\n\n// Uses standard paginated wrapper:\n// ApiResponse<PagedResponse<FeedbackListItemDto>>\n// Where PagedResponse contains: items, page, pageSize, totalItems, totalPages"
              }
            ],
            testCases: [
              {
                id: "tc-feed-list-01",
                title: "Verify authorized client (Manager) can fetch list data safely",
                type: "api",
                precondition: "Passing valid authorization credentials mapping back to a Manager role.",
                steps: [
                  "Trigger runtime invocation against GET /api/support/feedbacks?page=1&pageSize=10.",
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
                  "Call the administrative list endpoint GET /api/support/feedbacks.",
                  "Capture error payload structures."
                ],
                expectedResult: "Security layers abort execution early, throwing a 403 Forbidden response wrapper.",
                status: "not_started"
              },
              {
                id: "tc-feed-list-03",
                title: "Verify status filter returns only matching records",
                type: "api",
                precondition: "Database has feedbacks with both OPEN and RESOLVED statuses.",
                steps: [
                  "Call GET /api/support/feedbacks?status=OPEN with valid Manager token.",
                  "Inspect the items array."
                ],
                expectedResult: "Returns only feedback records with status=OPEN. No RESOLVED or REJECTED records appear in the response.",
                status: "not_started"
              },
              {
                id: "tc-feed-list-04",
                title: "Verify default sort order is created_at DESC",
                type: "api",
                precondition: "Multiple feedback records exist with different creation dates.",
                steps: [
                  "Call GET /api/support/feedbacks without any sort parameter."
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
            status: "draft",
            priority: "medium",
            tags: ["admin", "feedback", "detail", "read-only"],
            summary: "Fetches the complete granular detail blocks of a single feedback submission record using its unique database identifier key to allow targeted issue investigation.",
            ownerService: "Spring Boot Support API",
            endpoints: ["GET /api/support/feedbacks/{id}"],
            objective: "Fetches the complete granular detail blocks of a single feedback submission record using its unique database identifier key to allow targeted issue investigation.",
            inScope: [
              "Look up and return a distinct entry from the feedbacks table via a numerical ID.",
              "Gracefully map all tracking attributes, including resolution texts and associated managers."
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
              "Numerical attributes matching identifiers must use a BIGINT (Java Long) configuration.",
              "If the target resource does not exist, throw a specific exception that maps to a FEEDBACK_NOT_FOUND business error code."
            ],
            dbExistingTables: ["feedbacks"],
            dbRelationships: ["Safely supports null values (using a Left Join approach or separate query strategies) to fetch details for anonymous submissions without breaking data integrity."],
            validationRules: [
              { field: "id", rule: "Path parameter must be a positive integer greater than zero", errorMessage: "Invalid feedback ID." }
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
            uiComponents: "FeedbackDetailModal (inside admin views), Full Title/Content display, Category Badge, Status Badge, Email display, Response Note section, Resolved By info, Timestamps",
            uiStateLoading: "Show skeleton layout inside the modal while fetching detail data.",
            uiStateEmpty: "N/A - this is a detail view accessed via ID.",
            uiStateError: "Display error message: 'Feedback record not found or failed to load.'",
            uiStateSuccess: "Render all feedback detail fields in a structured read-only layout inside the modal.",
            notes: "The resolvedBy and responseNote fields are null for OPEN records. Supports anonymous Guest submissions where userId is null.",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-feedback-detail",
                name: "GET /api/support/feedbacks/{id}",
                content: `Method: GET
Path: /api/support/feedbacks/12
Headers:
  Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "message": "OK",
  "data": {
    "id": 12,
    "userId": null,
    "title": "Ham B1 quet the qua cham",
    "content": "He thong nhan dien bien so tai ham B1 mat hon 2 phut luc cao diem 18h ngay 05/07.",
    "category": "SERVICE",
    "email": "driver.test@gmail.com",
    "status": "OPEN",
    "responseNote": null,
    "resolvedBy": null,
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
                content: "public class FeedbackDetailDto {\n    private Long id;\n    private Long userId;       // Null for Guest submissions\n    private String title;\n    private String content;\n    private String category;\n    private String email;\n    private String status;     // OPEN, RESOLVED, REJECTED\n    private String responseNote; // Null if still OPEN\n    private Long resolvedBy;   // Null if still OPEN\n    private Instant createdAt;\n    private Instant updatedAt;\n    // getters and setters\n}"
              }
            ],
            testCases: [
              {
                id: "tc-feed-detail-01",
                title: "Verify target feedback entry maps to correct properties upon fetch",
                type: "api",
                precondition: "Target entry with id=12 exists within the current database snapshot.",
                steps: [
                  "Trigger lookup request to GET /api/support/feedbacks/12 using valid Manager credentials.",
                  "Assert HTTP response status code evaluates to 200."
                ],
                expectedResult: "Returns the detailed data model correctly wrapped inside the standard response structure with all fields: id, userId, title, content, category, email, status, responseNote, resolvedBy, createdAt, updatedAt.",
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
                  "Call GET /api/support/feedbacks/12 with a Driver JWT token."
                ],
                expectedResult: "Returns 403 Forbidden. Access is blocked by the security filter.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-feed-detail-01", content: "Path variable bindings throw standard exceptions immediately if parameters fail structural definitions (non-positive integer).", checked: false },
              { id: "dc-feed-detail-02", content: "Missing records return a 404 status code with FEEDBACK_NOT_FOUND error code, matching the project's standard global architecture error wrapper.", checked: false },
              { id: "dc-feed-detail-03", content: "Access restricted to MANAGER and ADMIN roles only.", checked: false },
              { id: "dc-feed-detail-04", content: "Nullable fields (userId, responseNote, resolvedBy) are correctly returned as null for OPEN records.", checked: false }
            ]
          },
          {
            id: "leaf-feed-update",
            title: "Feedback Status Update",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            status: "draft",
            priority: "medium",
            tags: ["admin", "feedback", "status", "write", "audit"],
            summary: "Enables managers to update the processing state of a feedback record (transitioning it to RESOLVED or REJECTED) and provide an official response statement.",
            ownerService: "Spring Boot Support API",
            endpoints: ["PATCH /api/support/feedbacks/{id}/status"],
            objective: "Enables managers to update the processing state of a feedback record (transitioning it to RESOLVED or REJECTED) and provide an official response statement.",
            inScope: [
              "Mutate target database records by modifying the status, response_note, and resolved_by fields.",
              "Enforce state mutation rules to maintain clean data tracking.",
              "Log administrative modifications to the central audit mechanism in a single transaction block."
            ],
            outOfScope: [
              "Modifying the original description or title text provided by the user."
            ],
            permissions: [
              { role: "Manager", permission: "Authorized - Allowed to add resolution remarks and transition tracking states." },
              { role: "Admin", permission: "Authorized - Complete permission to modify state properties and manage records." }
            ],
            businessRules: [
              "All data modifications performed by administrators must be logged to the central audit logging mechanism.",
              "Valid target state transitions are restricted to the uppercase string enum options: RESOLVED and REJECTED.",
              "Providing a response_note explanation is mandatory when moving a record out of the OPEN state.",
              "All steps in this workflow must execute within a unified database transaction block."
            ],
            dbExistingTables: ["feedbacks", "audit_logs"],
            dbRelationships: [
              "feedbacks.resolved_by stores numerical keys linking back to records inside the users table.",
              "audit_logs entry: action='FEEDBACK_STATUS_CHANGED', source_service='SUPPORT_API', user_id=<manager_id>"
            ],
            validationRules: [
              { field: "status", rule: "Must match one of the allowed uppercase state choices: RESOLVED or REJECTED", errorMessage: "Invalid status values allowed." },
              { field: "responseNote", rule: "Not Blank when updating to RESOLVED or REJECTED states", errorMessage: "Response notes are required." }
            ],
            securityRules: [
              "Extract the managing actor's identifier directly from verified JWT claims (sub property mapped to a numeric key) instead of using variables submitted via request bodies.",
              "Restrict access to roles matching MANAGER or ADMIN only."
            ],
            logEvents: [
              "On successful transaction execution, write a record tracking the state transition directly to the core audit_logs table with action=FEEDBACK_STATUS_CHANGED."
            ],
            noLogEvents: [
              "Plaintext system tokens or authorization secrets."
            ],
            integrationPoints: [
              { system: "Shared PostgreSQL Database", responsibility: "Modifies the shared PostgreSQL database state directly, ensuring updates are immediately visible to related services." },
              { system: "audit_logs table", responsibility: "Receives append-only audit entries recording each status transition with manager user_id and timestamp." }
            ],
            uiPage: "/admin/feedbacks",
            uiComponents: "FeedbackListPage status action controls (Resolve/Reject buttons), Status Update Modal with responseNote Textarea, Confirm/Cancel buttons",
            uiStateLoading: "Disable action buttons and show spinner while the PATCH request is in progress.",
            uiStateEmpty: "N/A - this is a write operation triggered from the list/detail view.",
            uiStateError: "Display error toast: 'Failed to update feedback status. Please try again.'",
            uiStateSuccess: "Show success toast: 'Feedback status updated successfully.' and refresh the feedback list/detail to reflect the new status.",
            notes: "The resolved_by field is populated automatically from the JWT claims of the Manager/Admin making the request. The @Transactional annotation must wrap both the feedbacks table update and the audit_logs insert.",
            dependencies: [],
            risks: [],
            apiContracts: [
              {
                id: "api-contract-feedback-status-update",
                name: "PATCH /api/support/feedbacks/{id}/status",
                content: `Method: PATCH
Path: /api/support/feedbacks/12/status
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Request Body:
{
  "status": "RESOLVED",
  "responseNote": "Da dieu phoi doi ky thuat bai xe xuong kiem tra lai bang dien tu tang B2 va cau hinh lai thiet bi hien thi chinh xac."
}

Response (200 OK):
{
  "success": true,
  "message": "FEEDBACK_STATUS_UPDATED_SUCCESSFULLY",
  "data": {
    "id": 12,
    "status": "RESOLVED",
    "responseNote": "Da dieu phoi doi ky thuat bai xe xuong kiem tra lai bang dien tu tang B2 va cau hinh lai thiet bi hien thi chinh xac.",
    "resolvedBy": 1,
    "updatedAt": "2026-07-07T23:30:00Z"
  },
  "errors": null,
  "timestamp": "2026-07-07T23:30:00Z"
}

Response (400 Bad Request - Missing responseNote):
{
  "success": false,
  "message": "Validation failed.",
  "data": null,
  "errors": [
    {
      "field": "responseNote",
      "message": "Response notes are required."
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
      "message": "Invalid status values allowed."
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
                name: "UpdateFeedbackStatusRequest & Response (Java DTO)",
                content: "public class UpdateFeedbackStatusRequest {\n    @NotNull\n    private String status; // Must be RESOLVED or REJECTED\n\n    @NotBlank\n    private String responseNote;\n    // getters and setters\n}\n\npublic class UpdateFeedbackStatusResponse {\n    private Long id;\n    private String status;\n    private String responseNote;\n    private Long resolvedBy; // Extracted from JWT claims\n    private Instant updatedAt;\n    // getters and setters\n}\n\n// audit_logs entry written on success:\n// action = 'FEEDBACK_STATUS_CHANGED'\n// source_service = 'SUPPORT_API'\n// user_id = <manager_id from JWT>\n// entity_type = 'feedbacks'\n// entity_id = <feedback_id>"
              }
            ],
            testCases: [
              {
                id: "tc-feed-update-01",
                title: "Verify Manager can update feedback status to RESOLVED successfully",
                type: "api",
                precondition: "Target row with id=12 currently carries an active OPEN status value.",
                steps: [
                  "Call PATCH /api/support/feedbacks/12/status passing valid manager credentials, a 'RESOLVED' status string, and an accompanying responseNote.",
                  "Verify the HTTP response status returns 200 OK."
                ],
                expectedResult: "Database fields update correctly (status=RESOLVED, responseNote filled, resolvedBy=manager_id) and an explicit tracking log entry is written to the core audit_logs table.",
                status: "not_started"
              },
              {
                id: "tc-feed-update-02",
                title: "Verify update fails if required explanation parameters are omitted",
                type: "api",
                precondition: "The request contains an empty explanation note.",
                steps: [
                  "Call the status update endpoint passing a 'REJECTED' status string but leaving the responseNote field blank.",
                  "Inspect the returned HTTP status code."
                ],
                expectedResult: "Validation layers block execution, returning an HTTP 400 Bad Request error with field error on responseNote.",
                status: "not_started"
              },
              {
                id: "tc-feed-update-03",
                title: "Verify invalid status value is rejected",
                type: "api",
                precondition: "Request body contains an invalid status string.",
                steps: [
                  "Call PATCH /api/support/feedbacks/12/status with status='PENDING'."
                ],
                expectedResult: "Returns 400 Bad Request with error message 'Invalid status values allowed.'",
                status: "not_started"
              },
              {
                id: "tc-feed-update-04",
                title: "Verify audit log entry is created on successful status update",
                type: "integration",
                precondition: "Target feedback exists with OPEN status.",
                steps: [
                  "Call PATCH /api/support/feedbacks/12/status with RESOLVED and a responseNote.",
                  "Query the audit_logs table after the update."
                ],
                expectedResult: "A new row exists in audit_logs with action=FEEDBACK_STATUS_CHANGED, source_service=SUPPORT_API, and user_id matching the Manager's ID.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-feed-update-01", content: "State modifications alter properties on target database tables correctly (status, response_note, resolved_by, updated_at).", checked: false },
              { id: "dc-feed-update-02", content: "Every state transition successfully logs an entry to the shared central audit_logs data model.", checked: false },
              { id: "dc-feed-update-03", content: "Only RESOLVED and REJECTED are valid target status values; OPEN cannot be set via this endpoint.", checked: false },
              { id: "dc-feed-update-04", content: "responseNote is required and validated as non-blank when status is RESOLVED or REJECTED.", checked: false },
              { id: "dc-feed-update-05", content: "resolved_by is populated from JWT claims, not from request body.", checked: false },
              { id: "dc-feed-update-06", content: "Both feedbacks table update and audit_logs insert are wrapped in a single @Transactional block.", checked: false }
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
            status: "draft",
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
            status: "draft",
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
            status: "draft",
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
            status: "draft",
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
              "Return a 403 Forbidden response if the role fails to match STAFF, MANAGER, or ADMIN."
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
              { id: "dc-mock-cam-03", content: "Event entries write directly to mock_device_events with event_type = 'CAMERA_SCAN' and HTTP status 201 Created.", checked: false }
            ]
          },
          {
            id: "leaf-mock-rfid",
            title: "Mock RFID Scan",
            type: "leaf_feature",
            clients: ["STAFF", "MANAGER", "ADMIN"],
            status: "draft",
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
              "Unified Return Wrappers: Success or failure states must follow the project standard layout (success, message, data, errors, timestamp)."
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
              "Block access requests, returning a 403 Forbidden status, if token claims lack authorized operator roles."
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
              { id: "dc-mock-rfid-03", content: "Records persist into PostgreSQL with event_type = 'RFID_SCAN'.", checked: false }
            ]
          },
          {
            id: "leaf-mock-barrier",
            title: "Mock Barrier Control",
            type: "leaf_feature",
            clients: ["STAFF", "MANAGER", "ADMIN"],
            status: "draft",
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
              "Enum Mapping Consistency: Activation commands written to database records must be mapped as uppercase string literals (BARRIER_OPEN / BARRIER_CLOSE)."
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
              "Restrict access to corporate account profiles with appropriate roles (STAFF, MANAGER, ADMIN)."
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
              { id: "dc-mock-barrier-03", content: "Operational states log cleanly into the mock_device_events structure with appropriate upper-case string mappings.", checked: false }
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
          { id: "leaf-diag-clear-res", title: "Clear Reservations Debug", type: "leaf_feature", clients: ["Admin"], endpoints: [], ownerService: "System", testCases: defaultApiTests("Clear Reservations Debug", ["Admin"], []), doneCriteria: defaultDoneCriteria("Clear Reservations Debug") },
          { id: "leaf-diag-migrate", title: "Migrate Database Debug", type: "leaf_feature", clients: ["Admin"], endpoints: [], ownerService: "System", testCases: defaultApiTests("Migrate Database Debug", ["Admin"], []), doneCriteria: defaultDoneCriteria("Migrate Database Debug") },
          { id: "leaf-diag-expire-res", title: "Expire Reservation Debug", type: "leaf_feature", clients: ["Admin"], endpoints: [], ownerService: "System", testCases: defaultApiTests("Expire Reservation Debug", ["Admin"], []), doneCriteria: defaultDoneCriteria("Expire Reservation Debug") },
          { id: "leaf-diag-expire-pay", title: "Expire Payment Deadline Debug", type: "leaf_feature", clients: ["Admin"], endpoints: [], ownerService: "System", testCases: defaultApiTests("Expire Payment Deadline Debug", ["Admin"], []), doneCriteria: defaultDoneCriteria("Expire Payment Deadline Debug") }
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


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
            status: "in_progress",
            priority: "medium",
            clients: ["Admin", "Manager"],
            tags: ["payments", "pricing", "crud", "admin"],
            summary: "Cung cấp đầy đủ các thao tác CRUD danh sách quy tắc giá cho Admin và Manager.",
            objective: "Thiết lập các API quản trị (CRUD) để Admin và Manager cấu hình bảng giá và các quy tắc tính phí đỗ xe. Hệ thống hỗ trợ cấu hình giá linh hoạt theo từng loại phương tiện (Vehicle Type), phí phạt mất thẻ (Lost Card Fee), giá vé tháng (Monthly Price) và đơn giá đặt chỗ trước theo giờ (Reservation Hourly Price). Bản ghi bảng giá đang hoạt động sẽ được sử dụng trực tiếp làm tham số đầu vào cho bộ máy tính toán phí đỗ xe tại cổng ra.",
            inScope: [
              "Cung cấp đầy đủ các thao tác CRUD danh sách quy tắc giá.",
              "Hỗ trợ cập nhật nhanh (PATCH) đơn giá đặt chỗ trước (ReservationHourlyPrice) để phản hồi nhanh với biến động cung-cầu thị trường.",
              "Ràng buộc nghiệp vụ: Đảm bảo tại một thời điểm chỉ có duy nhất một bộ quy tắc giá ở trạng thái hoạt động (IsActive = true) đối với mỗi loại phương tiện.",
              "Tự động lưu vết lịch sử thay đổi (Audit Trail) vào schema quản trị khi có bất kỳ thao tác thay đổi dữ liệu nào (Create, Update, Delete, Patch)."
            ],
            outOfScope: [
              "Logic tính toán chi tiết hóa đơn đỗ xe thực tế (sẽ do service/feature tính phí tại cổng gọi sang để lấy cấu hình).",
              "Đồng bộ hóa bảng giá sang các hệ thống thanh toán bên thứ ba."
            ],
            permissions: [
              { role: "Admin", permission: "Full Access. Có toàn quyền CRUD, kích hoạt/vô hiệu hóa quy tắc giá và xem toàn bộ lịch sử Audit Log." },
              { role: "Manager", permission: "Write/Update. Có quyền Xem, Tạo mới và Chỉnh sửa bảng giá. Không có quyền DELETE các cấu hình giá cũ để đảm bảo tính toàn vẹn dữ liệu lịch sử." }
            ],
            businessRules: [
              "Active Status Constraint: Với mỗi loại phương tiện (VehicleType), chỉ cho phép tối đa một cấu hình có trạng thái IsActive = true. Khi kích hoạt một cấu hình mới, hệ thống tự động chuyển các cấu hình cũ của phương tiện đó về IsActive = false.",
              "Zero or Positive Bounds: Tất cả các giá trị tiền tệ như HourlyRate, ReservationHourlyRate, LostCardFee, và MonthlyPrice phải lớn hơn hoặc bằng 0.",
              "Audit Tracking: Mọi thao tác POST/PUT/DELETE/PATCH đều phải ghi nhận thông tin tài khoản thực hiện (CreatedBy / UpdatedBy) thông qua Claims của JWT Token."
            ],
            dbExistingTables: ["AuditLogs"],
            dbNewTablesSql: `-- Table for pricing rules\nCREATE TABLE PricingRules (\n  Id UUID PRIMARY KEY,\n  VehicleType VARCHAR(50) NOT NULL,\n  HourlyRate DECIMAL(18, 2) NOT NULL DEFAULT 0.00,\n  ReservationHourlyPrice DECIMAL(18, 2) NOT NULL DEFAULT 0.00,\n  LostCardFee DECIMAL(18, 2) NOT NULL DEFAULT 0.00,\n  MonthlyPrice DECIMAL(18, 2) NOT NULL DEFAULT 0.00,\n  IsActive BOOLEAN NOT NULL DEFAULT FALSE,\n  CreatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  CreatedBy VARCHAR(100),\n  UpdatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  UpdatedBy VARCHAR(100)\n);\n\nCREATE UNIQUE INDEX IX_PricingRules_VehicleType_Active ON PricingRules (VehicleType) WHERE IsActive = TRUE;`,
            dbRelationships: [],
            validationRules: [
              { field: "vehicleType", rule: "Không được trống, phải là loại xe được hỗ trợ (Car, Motorbike, Bicycle).", errorMessage: "INVALID_VEHICLE_TYPE" },
              { field: "hourlyRate", rule: "Bắt buộc >= 0.", errorMessage: "HOURLY_RATE_MUST_BE_POSITIVE" },
              { field: "reservationHourlyPrice", rule: "Bắt buộc >= 0.", errorMessage: "RESERVATION_RATE_MUST_BE_POSITIVE" },
              { field: "lostCardFee", rule: "Bắt buộc >= 0.", errorMessage: "LOST_CARD_FEE_MUST_BE_POSITIVE" },
              { field: "monthlyPrice", rule: "Bắt buộc >= 0.", errorMessage: "MONTHLY_PRICE_MUST_BE_POSITIVE" }
            ],
            securityRules: [
              "Role-Based Access Control (RBAC): Chỉ cho phép User có claim role là Admin hoặc Manager gọi các API thay đổi dữ liệu (POST, PUT, PATCH, DELETE).",
              "Ngăn chặn hành động xóa cấu hình đang được sử dụng ở trạng thái IsActive = true. Chỉ được phép xóa các cấu hình cũ không còn hoạt động (và chỉ dành riêng cho role Admin)."
            ],
            logEvents: [
              "Ghi log cụ thể nội dung thay đổi cấu hình giá, bao gồm các tham số cũ (Old Values) và tham số mới (New Values) vào bảng AuditLogs.",
              "Log chi tiết ID người dùng thực hiện thao tác thay đổi."
            ],
            noLogEvents: [
              "Bearer Token, mật khẩu định danh của Admin/Manager trong header hoặc log payload."
            ],
            integrationPoints: [
              { system: "Payment Fee Calculation Service", responsibility: "Sử dụng cấu hình từ API này để tự động tính toán số tiền khách cần thanh toán khi Exit." }
            ],
            uiPage: "/admin/pricing-management",
            uiComponents: "Pricing rules table with status badges (Active/Inactive), Dynamic reservation hourly rate slider/dialog, Activation confirmation dialog",
            uiStateLoading: "Disable interactions, show saving/updating indicator.",
            uiStateEmpty: "No pricing rules configured.",
            uiStateError: "Show toast notification with specific business rule validation error.",
            uiStateSuccess: "Show success toast, refresh pricing rules list.",
            endpoints: [
              "GET /api/core/pricing-rules",
              "GET /api/core/pricing-rules/{id}",
              "POST /api/core/pricing-rules",
              "PUT /api/core/pricing-rules/{id}",
              "DELETE /api/core/pricing-rules/{id}",
              "PATCH /api/core/pricing-rules/{id}/reservation-hourly-price"
            ],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-price-get",
                name: "GET /api/core/pricing-rules",
                content: `Method: GET\nPath: /api/core/pricing-rules\nHeaders:\n  Authorization: Bearer <token>\nResponse 200 OK:\n{\n  "success": true,\n  "data": [\n    {\n      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",\n      "vehicleType": "Car",\n      "hourlyRate": 20000.00,\n      "reservationHourlyPrice": 10000.00,\n      "lostCardFee": 100000.00,\n      "monthlyPrice": 1500000.00,\n      "isActive": true,\n      "createdAt": "2026-07-17T09:00:00Z"\n    }\n  ]\n}`
              },
              {
                id: "contract-price-post",
                name: "POST /api/core/pricing-rules",
                content: `Method: POST\nPath: /api/core/pricing-rules\nHeaders:\n  Authorization: Bearer <token>\nRequest Body:\n{\n  "vehicleType": "Car",\n  "hourlyRate": 20000.00,\n  "reservationHourlyPrice": 10000.00,\n  "lostCardFee": 100000.00,\n  "monthlyPrice": 1500000.00,\n  "isActive": true\n}\nResponse 201 Created:\n{\n  "success": true,\n  "message": "Pricing rule created successfully.",\n  "data": { "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" }\n}`
              },
              {
                id: "contract-price-put",
                name: "PUT /api/core/pricing-rules/{id}",
                content: `Method: PUT\nPath: /api/core/pricing-rules/{id}\nRequest Body:\n{\n  "vehicleType": "Car",\n  "hourlyRate": 25000.00,\n  "reservationHourlyPrice": 12000.00,\n  "lostCardFee": 120000.00,\n  "monthlyPrice": 1800000.00,\n  "isActive": true\n}\nResponse 200 OK:\n{\n  "success": true,\n  "message": "Pricing rule updated successfully."\n}`
              },
              {
                id: "contract-price-patch",
                name: "PATCH /api/core/pricing-rules/{id}/reservation-hourly-price",
                content: `Method: PATCH\nPath: /api/core/pricing-rules/{id}/reservation-hourly-price\nRequest Body:\n{\n  "reservationHourlyPrice": 15000.00\n}\nResponse 200 OK:\n{\n  "success": true,\n  "message": "Reservation hourly price updated successfully.",\n  "data": {\n    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",\n    "newReservationHourlyPrice": 15000.00\n  }\n}`
              }
            ],
            testCases: [
              {
                id: "tc-price-active-switch",
                title: "Verify Admin can create and automatically activate a new pricing rule",
                type: "api",
                precondition: "Đăng nhập bằng tài khoản có role Admin.",
                steps: [
                  "Gọi POST /api/core/pricing-rules để tạo cấu hình Car mới với IsActive = true.",
                  "Truy xuất lại danh sách qua GET /api/core/pricing-rules."
                ],
                expectedResult: "HTTP 201 Created. Cấu hình mới được kích hoạt, đồng thời tất cả các cấu hình Car cũ trước đó tự động chuyển về IsActive = false.",
                status: "not_started"
              },
              {
                id: "tc-price-delete-manager-rejected",
                title: "Verify Manager is rejected when attempting to DELETE a pricing rule",
                type: "api",
                precondition: "Đăng nhập bằng tài khoản có role Manager.",
                steps: [
                  "Gọi DELETE /api/core/pricing-rules/{id}."
                ],
                expectedResult: "HTTP 403 Forbidden. Thông báo lỗi chỉ ra Manager không có quyền xóa.",
                status: "not_started"
              },
              {
                id: "tc-price-validation-bounds",
                title: "Verify input validations prevent negative price values",
                type: "api",
                precondition: "Người dùng đã được xác thực quyền Admin.",
                steps: [
                  "Gọi POST /api/core/pricing-rules với payload chứa lostCardFee: -50000 hoặc hourlyRate: -100."
                ],
                expectedResult: "HTTP 400 Bad Request kèm mã lỗi chi tiết LOST_CARD_FEE_MUST_BE_POSITIVE hoặc HOURLY_RATE_MUST_BE_POSITIVE.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-price-contract", content: "API contract is documented in this node.", checked: true },
              { id: "dc-price-clients", content: "Required clients/roles (Admin, Manager) are assigned and validated via Integration Tests.", checked: true },
              { id: "dc-price-rules", content: "Business rules (e.g., maximum one active rule per vehicle type) are enforced at the DB/Service level.", checked: true },
              { id: "dc-price-resp", content: "Success response matches the global common API response standard.", checked: true },
              { id: "dc-price-tests", content: "At least three critical test cases (CRUD validation, role restriction, active constraints) are passed.", checked: true },
              { id: "dc-price-patch-rate", content: "Dynamic patching for ReservationHourlyPrice is fully supported.", checked: true },
              { id: "dc-price-required-fields", content: "LostCardFee and MonthlyPrice fields are strictly required and implemented in the DB schema.", checked: true },
              { id: "dc-price-audit", content: "Mutating actions write accurate trail entries into the Audit Schema.", checked: true }
            ],
            notes: "Before coding:\nInspect the existing .NET Core API project structure. Ensure standard Clean Architecture patterns (Domain, Application, Infrastructure, WebAPI) are followed.\nDefine the PricingRule Domain Entity with appropriate database mapping constraints using Entity Framework Core Fluent API.\nUtilize Entity Framework Transactions to update existing active rules to inactive when a new active rule is activated, preventing concurrency issues.\nImplement generic or custom Audit Behavior in DB Context or Application Layer to automatically capture who modified the rule and when.\nCheck existing test suites and add newly specified endpoint tests.\nRun all relevant tests to confirm zero regressions.\nReport changed files, verification results, and potential database migration risks."
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
            status: "in_progress",
            priority: "medium",
            clients: ["Staff", "Manager"],
            tags: ["incidents", "lost-card", "file-upload", "documents", "audit"],
            summary: "Cung cấp các API quản lý tài liệu minh chứng đi kèm với mỗi sự vụ báo mất thẻ (Lost Card Case).",
            objective: "Cung cấp các API quản lý tài liệu minh chứng (hồ sơ, hình ảnh CCCD, giấy tờ xe, biên bản cam kết) đi kèm với mỗi sự vụ báo mất thẻ (Lost Card Case). Các tài liệu này là điều kiện bắt buộc (bằng chứng pháp lý) để Staff/Manager xác minh chủ xe, áp phí phạt mất thẻ (LostCardFee), lập hóa đơn thanh toán và thực hiện mở cổng cho xe xuất bãi một cách hợp lệ.",
            inScope: [
              "Hỗ trợ tải lên tài liệu minh chứng dạng tệp tin đơn lẻ (POST) hoặc tải lên hàng loạt (POST Batch).",
              "Lưu trữ metadata của tài liệu (tên file, đường dẫn lưu trữ, định dạng, dung lượng) vào cơ sở dữ liệu PostgreSQL.",
              "Truy xuất danh sách tài liệu minh chứng đã tải lên theo từng vụ việc (caseId).",
              "Cho phép xóa tài liệu minh chứng nếu upload nhầm trước khi vụ việc được đóng/hoàn tất."
            ],
            outOfScope: [
              "Dịch vụ lưu trữ vật lý tệp tin (File Storage Service như AWS S3, Azure Blob, hoặc Local Storage sẽ được gọi qua một Interface trừu tượng IStorageService).",
              "Quy trình xử lý thanh toán thực tế cho phí mất thẻ (được quản lý bởi luồng Payment)."
            ],
            permissions: [
              { role: "Staff", permission: "Read/Write/Delete - Tiếp nhận yêu cầu tại quầy, trực tiếp chụp ảnh giấy tờ, upload tài liệu minh chứng và có thể xóa file vừa upload nếu có sai sót." },
              { role: "Manager", permission: "Read/Write/Delete - Kiểm tra, đối chiếu hồ sơ minh chứng trước khi phê duyệt đóng hồ sơ hoặc miễn giảm phí phạt nếu có lý do chính đáng." }
            ],
            businessRules: [
              "Case Validation: Chỉ cho phép upload hoặc thay đổi tài liệu đối với các vụ việc mất thẻ (LostCardCases) đang ở trạng thái xử lý (Pending, Processing). Một khi sự vụ đã đóng (Resolved, Closed), mọi hành vi thay đổi tài liệu (Thêm, Xóa) đều bị cấm hoàn toàn để bảo vệ tính toàn vẹn hồ sơ pháp lý.",
              "File Validation Constraints: Chỉ chấp nhận các định dạng tệp tin: .jpg, .jpeg, .png, .pdf. Dung lượng tối đa cho mỗi file tải lên là 5MB.",
              "Database Constraints: Bản ghi thông tin tài liệu phải liên kết chặt chẽ với bảng sự vụ mất thẻ thông qua khóa ngoại kiểu UUID."
            ],
            dbExistingTables: ["LostCardCases", "AuditLogs"],
            dbNewTablesSql: `CREATE TABLE LostCardDocuments (\n    Id UUID PRIMARY KEY,\n    CaseId UUID NOT NULL REFERENCES LostCardCases(Id) ON DELETE CASCADE,\n    DocumentType VARCHAR(50) NOT NULL, -- ID_Card, Vehicle_Registration, Handover_Report, Other\n    FileName VARCHAR(255) NOT NULL,\n    FileUrl VARCHAR(512) NOT NULL,\n    FileSize BIGINT NOT NULL,          -- Lưu dung lượng theo bytes để kiểm soát giới hạn\n    FileExtension VARCHAR(10) NOT NULL,-- .jpg, .png, .pdf\n    UploadedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    UploadedBy VARCHAR(100) NOT NULL\n);\n\n-- Index tối ưu tốc độ tìm kiếm tài liệu theo vụ việc\nCREATE INDEX IX_LostCardDocuments_CaseId ON LostCardDocuments(CaseId);`,
            dbRelationships: [
              "Một sự vụ mất thẻ (LostCardCase) có quan hệ 1-Nhiều (1-n) với LostCardDocuments."
            ],
            validationRules: [
              { field: "caseId", rule: "Phải là một UUID hợp lệ và tồn tại trong bảng LostCardCases.", errorMessage: "LOST_CARD_CASE_NOT_FOUND" },
              { field: "caseState", rule: "Sự vụ phải có trạng thái khác Resolved hoặc Closed.", errorMessage: "CANNOT_MODIFY_CLOSED_CASE" },
              { field: "file", rule: "Không được trống, định dạng phải là hình ảnh hoặc PDF, dung lượng tối đa 5MB.", errorMessage: "INVALID_FILE_FORMAT_OR_SIZE" },
              { field: "documentType", rule: "Phải thuộc một trong các nhóm định nghĩa sẵn (ID_Card, Vehicle_Registration, Handover_Report, Other).", errorMessage: "INVALID_DOCUMENT_TYPE" }
            ],
            securityRules: [
              "Role-Based Access Control (RBAC): Chỉ những tài khoản có Claim Role là Staff hoặc Manager mới có quyền truy cập và thao tác trên các endpoints này.",
              "Malicious File Scan: Trước khi ghi file vào Storage, backend phải thực hiện kiểm tra phần mở rộng thực tế của tệp tin (MIME Type check) để ngăn chặn lỗ hổng tải lên mã độc (Web Shell, Executable files)."
            ],
            logEvents: [
              "Tải lên tài liệu mới thành công (Ghi rõ caseId, documentId, fileName, uploadedBy).",
              "Xóa tài liệu khỏi hệ thống (Ghi rõ documentId đã xóa và định danh người thực hiện)."
            ],
            noLogEvents: [
              "Nội dung nhị phân (binary content) của tệp tin, thông tin Token trong Header."
            ],
            integrationPoints: [
              { system: "Object Storage Service (S3/Azure/Local)", responsibility: "Tiếp nhận luồng byte dữ liệu từ .NET API, thực hiện lưu trữ vật lý và trả về URL truy cập công khai/bảo mật." }
            ],
            uiComponents: "Page: /staff/incident-management/lost-cards/{caseId}. Components: Drag & Drop Zone cho batch upload; danh sách tệp hiển thị dạng Card/Thumbnail với Preview; nút Xóa kèm Pop-over xác nhận.",
            uiStateSuccess: "Processing State: Progress bar theo % cho file lớn đang upload. Success/Error: Toast notification chi tiết (ví dụ: 'Đã tải lên thành công 3/3 file' hoặc 'File xxx.exe không đúng định dạng').",
            endpoints: [
              "POST /api/core/lost-cards/{caseId}/documents",
              "POST /api/core/lost-cards/{caseId}/documents/batch",
              "GET /api/core/lost-cards/{caseId}/documents",
              "DELETE /api/core/lost-cards/{caseId}/documents/{documentId}"
            ],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-lost-card-upload-single",
                name: "POST /api/core/lost-cards/{caseId}/documents",
                content: `Method: POST\nPath: /api/core/lost-cards/{caseId}/documents\nHeaders:\n  Authorization: Bearer <token>\n  Content-Type: multipart/form-data\nRequest Body:\n  file: [Binary File]\n  documentType: "ID_Card" (ID_Card, Vehicle_Registration, Handover_Report, Other)\nResponse 201 Created:\n{\n  "success": true,\n  "message": "Document uploaded successfully.",\n  "data": {\n    "documentId": "4a1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7a",\n    "fileName": "cccd_mat_truoc.jpg",\n    "fileUrl": "https://storage.parking.com/lost-cards/4a1deb4d/cccd_mat_truoc.jpg"\n  }\n}`
              },
              {
                id: "contract-lost-card-upload-batch",
                name: "POST /api/core/lost-cards/{caseId}/documents/batch",
                content: `Method: POST\nPath: /api/core/lost-cards/{caseId}/documents/batch\nHeaders:\n  Authorization: Bearer <token>\n  Content-Type: multipart/form-data\nRequest Body:\n  files: [Binary File 1, Binary File 2, ...]\n  documentTypes: ["ID_Card", "Vehicle_Registration", ...]\nResponse 201 Created:\n{\n  "success": true,\n  "message": "Batch documents uploaded successfully.",\n  "data": [\n    {\n      "documentId": "4a1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7a",\n      "fileName": "cccd_mat_truoc.jpg",\n      "fileUrl": "https://storage.parking.com/lost-cards/4a1deb4d/cccd_mat_truoc.jpg"\n    },\n    {\n      "documentId": "5c1fdf4e-4b7e-5cad-8cee-3c0e8c4dda8b",\n      "fileName": "cavet_xe.jpg",\n      "fileUrl": "https://storage.parking.com/lost-cards/4a1deb4d/cavet_xe.jpg"\n    }\n  ]\n}`
              },
              {
                id: "contract-lost-card-get-docs",
                name: "GET /api/core/lost-cards/{caseId}/documents",
                content: `Method: GET\nPath: /api/core/lost-cards/{caseId}/documents\nHeaders:\n  Authorization: Bearer <token>\nResponse 200 OK:\n{\n  "success": true,\n  "data": [\n    {\n      "documentId": "4a1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7a",\n      "documentType": "ID_Card",\n      "fileName": "cccd_mat_truoc.jpg",\n      "fileSize": 1542000,\n      "fileUrl": "https://storage.parking.com/lost-cards/4a1deb4d/cccd_mat_truoc.jpg",\n      "uploadedBy": "staff_nguyen_van_a",\n      "uploadedAt": "2026-07-17T10:30:00Z"\n    }\n  ]\n}`
              },
              {
                id: "contract-lost-card-delete-doc",
                name: "DELETE /api/core/lost-cards/{caseId}/documents/{documentId}",
                content: `Method: DELETE\nPath: /api/core/lost-cards/{caseId}/documents/4a1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7a\nHeaders:\n  Authorization: Bearer <token>\nResponse 200 OK:\n{\n  "success": true,\n  "message": "Document deleted successfully."\n}`
              }
            ],
            testCases: [
              {
                id: "tc-lost-card-batch-upload-success",
                title: "Verify Staff can upload multiple documents using Batch API successfully",
                type: "integration",
                precondition: "Sự vụ mất thẻ có CaseId = 32b6e1b2-1b1a-4d2a-89aa-5561a317bf01 đang ở trạng thái Pending.",
                steps: [
                  "Authenticate user as Staff.",
                  "Tạo HTTP POST Multipart request gửi kèm 2 file ảnh (goc_chup_1.jpg, goc_chup_2.png) tới endpoint /api/core/lost-cards/{caseId}/documents/batch."
                ],
                expectedResult: "HTTP 201 Created. Danh sách trả về chứa 2 bản ghi tài liệu mới có mã UUID và đường dẫn URL lưu trữ đầy đủ.",
                status: "not_started"
              },
              {
                id: "tc-lost-card-upload-closed-case",
                title: "Verify upload is rejected when Lost Card Case is already Closed",
                type: "api",
                precondition: "Sự vụ mất thẻ có trạng thái Closed.",
                steps: [
                  "Gửi POST request upload tệp tin lên vụ việc đã đóng đó."
                ],
                expectedResult: "HTTP 400 Bad Request kèm mã lỗi CANNOT_MODIFY_CLOSED_CASE. Trạng thái dữ liệu không bị biến động.",
                status: "not_started"
              },
              {
                id: "tc-lost-card-invalid-file",
                title: "Verify upload rejects files exceeding 5MB limit or having invalid extension",
                type: "unit",
                precondition: "Người dùng đăng nhập quyền Staff.",
                steps: [
                  "Gửi một tệp tin dung lượng 7MB hoặc tệp tin có tên trojan.exe tới endpoint upload."
                ],
                expectedResult: "HTTP 400 Bad Request kèm thông báo lỗi INVALID_FILE_FORMAT_OR_SIZE.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-lost-card-contract", content: "API contract is documented in this node.", checked: true },
              { id: "dc-lost-card-roles", content: "Required roles (Staff, Manager) are assigned and validated.", checked: true },
              { id: "dc-lost-card-business-rules", content: "Business rules (strictly block uploads/deletions on Closed/Resolved cases) are enforced in DB/Service layer.", checked: true },
              { id: "dc-lost-card-file-validation", content: "File validation logic (MIME type check, max 5MB size) works correctly.", checked: true },
              { id: "dc-lost-card-responses", content: "Success and error responses are standard and do not leak system path traces.", checked: true },
              { id: "dc-lost-card-db-model", content: "Database model mapping for LostCardDocuments using UUID PK is successfully designed.", checked: true },
              { id: "dc-lost-card-audit", content: "Audit entries are recorded when documents are added or removed.", checked: true }
            ],
            notes: "Before coding:\nInspect the existing .NET Core API structure (specifically, where the File Storage layer is abstracted via IStorageService).\nUse a custom validation filter or FluentValidation to enforce file extension limits before saving data.\nEnsure that file upload processes are stream-based where possible to minimize memory allocation on the API host for large payloads.\nImplement atomic DB transactions: The file metadata should only be written to PostgreSQL after the physical file storage upload succeeds. If the DB save fails, trigger a rollback task to delete the uploaded file from the storage.\nCheck and run existing test projects. Add newly specified tests under the LostCardClaim directory.\nVerify code compiles without warnings and run all tests before completing the task."
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
            status: "draft",
            priority: "medium",
            clients: ["Guest", "Driver"],
            endpoints: ["GET /api/public/parking-info"],
            ownerService: "Spring Boot Support API",
            objective: "No objective documented.",
            inScope: [
              "Implement the core logic and requirements of this feature."
            ],
            outOfScope: [
              "External system integrations not specified in this document."
            ],
            permissions: [
              { role: "Guest", permission: "Authorized to access this feature." },
              { role: "Driver", permission: "Authorized to access this feature." }
            ],
            businessRules: [
              "The system manages parking building operations for public guests, drivers, staff, managers, and admins.",
              "The backend is split into .NET Core API for transactional/write operations and Spring Boot Support API for support/read/report/public operations.",
              "All APIs should return a consistent success/error response format.",
              "Authenticated APIs must validate JWT and role permissions.",
              "Both backend services access a shared PostgreSQL database, maintaining strict entity ownership.",
              "Global error handling middleware must prevent internal stack traces from leaking to clients.",
              "A request logging system must log all incoming API requests for security tracing.",
              "All manager/admin mutating operations must be logged to a dedicated audit schema.",
              "Public APIs must not expose private user/session/payment details.",
              "Public parking information, pricing, rules, and available slots should be readable without login."
            ],
            dbExistingTables: [
              "Reuse existing tables where applicable."
            ],
            dbNewTablesSql: "-- No new database schema defined.",
            dbRelationships: [
              "None specified."
            ],
            validationRules: [
              { field: "Request", rule: "Standard request validation is expected.", errorMessage: "" }
            ],
            apiContracts: createApiContract("GET /api/public/parking-info"),
            securityRules: [
              "Validate role permissions.",
              "Prevent unauthorized access.",
              "Do not log sensitive data."
            ],
            logEvents: [
              "Log request access, inputs, duration, and response code."
            ],
            noLogEvents: [
              "Passwords, access tokens, refresh tokens, and credit card details."
            ],
            integrationPoints: [
              { system: "None", responsibility: "No external integration points specified." }
            ],
            uiPage: "No frontend behavior specified.",
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
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

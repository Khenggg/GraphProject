import type {
  ContractField,
  DoneCriterion,
  FeatureNode,
  FeatureNodeType,
  TestCase,
} from "../domain/featureNode.types";

type NestedItem = ContractField | DoneCriterion | TestCase;

function emptyNode(id: string, title: string, type: FeatureNodeType, summary: string): FeatureNode {
  const now = new Date().toISOString();
  return {
    id,
    parentId: null,
    title,
    type,
    clients: [],
    status: "draft",
    priority: "medium",
    tags: [],
    summary,
    businessRules: [],
    apiContracts: [],
    uiContracts: [],
    dataContracts: [],
    testCases: [],
    doneCriteria: [],
    dependencies: [],
    risks: [],
    notes: "",
    createdAt: now,
    updatedAt: now,
    order: 0,
    children: [],
  };
}

function walk(root: FeatureNode): FeatureNode[] {
  return [root, ...(root.children || []).flatMap(walk)];
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function mergeNested<T extends NestedItem>(target: T[], source: T[], sourceNodeId: string): T[] {
  const result = [...target];
  for (const item of source) {
    const sameId = result.find(existing => existing.id === item.id);
    if (!sameId) {
      result.push(item);
    } else if (JSON.stringify(sameId) !== JSON.stringify(item)) {
      result.push({ ...item, id: `${sourceNodeId}-${item.id}` });
    }
  }
  return result;
}

function mergeNodeContent(target: FeatureNode, source: FeatureNode): void {
  target.clients = unique([...target.clients, ...source.clients]);
  target.tags = unique([...target.tags, ...source.tags]);
  target.businessRules = unique([...target.businessRules, ...source.businessRules]);
  target.dependencies = unique([...target.dependencies, ...source.dependencies]);
  target.risks = unique([...target.risks, ...source.risks]);
  target.apiContracts = mergeNested(target.apiContracts, source.apiContracts, source.id);
  target.uiContracts = mergeNested(target.uiContracts, source.uiContracts, source.id);
  target.dataContracts = mergeNested(target.dataContracts, source.dataContracts, source.id);
  target.testCases = mergeNested(target.testCases, source.testCases, source.id);
  target.doneCriteria = mergeNested(target.doneCriteria, source.doneCriteria, source.id);
  target.summary ||= source.summary;
  target.notes = unique([target.notes, source.notes]).join("\n\n");
  target.metadata = {
    ...source.metadata,
    ...target.metadata,
    endpoints: unique([...(target.metadata?.endpoints || []), ...(source.metadata?.endpoints || [])]),
    sourceFiles: unique([...(target.metadata?.sourceFiles || []), ...(source.metadata?.sourceFiles || [])]),
    consumerServices: unique([...(target.metadata?.consumerServices || []), ...(source.metadata?.consumerServices || [])]),
  };
}

function normalizeTree(root: FeatureNode): void {
  const roleNames = ["Admin", "Manager", "Staff", "Driver", "Guest", "System"];
  const normalizeRole = (role: string) => {
    const normalized = roleNames.find(candidate => candidate.toLowerCase() === role.trim().toLowerCase());
    return normalized || role;
  };

  const nestedIds = new Set<string>();
  const visit = (node: FeatureNode, parentId: string | null, order: number) => {
    node.parentId = parentId;
    node.order = order;
    node.clients = unique(node.clients.map(normalizeRole));
    if (node.permissions) {
      node.permissions = node.permissions.map(permission => ({
        ...permission,
        role: normalizeRole(permission.role),
      }));
    }

    for (const key of ["testCases", "doneCriteria", "apiContracts", "uiContracts", "dataContracts"] as const) {
      node[key] = node[key].map(item => {
        const scoped = `${key}:${item.id}`;
        if (!nestedIds.has(scoped)) {
          nestedIds.add(scoped);
          return item;
        }
        let nextId = `${node.id}-${item.id}`;
        let suffix = 2;
        while (nestedIds.has(`${key}:${nextId}`)) nextId = `${node.id}-${item.id}-${suffix++}`;
        nestedIds.add(`${key}:${nextId}`);
        return { ...item, id: nextId };
      }) as never;
    }

    (node.children || []).forEach((child, index) => visit(child, node.id, index));
  };
  visit(root, null, 0);
  root.metadata = { ...root.metadata, roles: roleNames };
}

function splitAuthentication(node: FeatureNode): void {
  node.type = "feature";
  node.title = "Authentication & Session Management";
  node.summary = "Unified authentication system managing logins, identity profiles, token rotations, and secure sign-outs.";
  node.objective = "Provide a secure, centralized authentication and session management layer across .NET Core API and Spring Boot Support API.";
  node.inScope = [
    "Centralized credential verification.",
    "Session and refresh token family management.",
    "Cross-backend JWT validation and account status enforcement.",
    "Token revocation and secure sign-out."
  ];
  node.outOfScope = [
    "User registration (handled under Driver Registration).",
    "Self-service password resets.",
    "Third-party identity providers."
  ];
  node.businessRules = [
    "Only active user accounts (not disabled, inactive, locked, or deleted) can authenticate or renew sessions.",
    "Refresh tokens are strictly single-use; reuse triggers family revocation.",
    "Sign-out terminates only the current session (multi-device support)."
  ];

  const definitions = [
    {
      id: "leaf-auth-login",
      title: "Sign In",
      match: /login/i,
      endpoint: /\/login$/i,
      objective: "Authenticate user credentials (username and password) to establish a secure session, returning an access token and a refresh token.",
      inScope: [
        "Validate login request format and size bounds.",
        "Normalize username (trim whitespace).",
        "Secure password verification.",
        "Verify account status (Active, Disabled, Inactive, Locked, Deleted).",
        "Create authentication session and token family atomically before token issuance.",
        "Issue JWT access token with required roles/claims.",
        "Generate cryptographically secure random refresh token and persist its hash.",
        "Audit logging for success and failure events (without credentials)."
      ],
      outOfScope: [
        "User registration or signup flow.",
        "Password reset or password change flow.",
        "Third-party OAuth identity providers.",
        "Session termination and token revocation (handled by Sign Out)."
      ],
      permissions: [
        { role: "Driver", permission: "Can login using valid driver credentials" },
        { role: "Staff", permission: "Can login using valid staff credentials" },
        { role: "Manager", permission: "Can login using valid manager credentials" },
        { role: "Admin", permission: "Can login using valid admin credentials" }
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

CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);`,
      dbRelationships: ["refresh_tokens(user_id) references users(id)"],
      validationRules: [
        { field: "username", rule: "Required, string, trim whitespace, max length 50", errorMessage: "Username is required." },
        { field: "password", rule: "Required, string, do not trim, max length 100", errorMessage: "Password is required." }
      ],
      securityRules: [
        "Never log raw passwords, access tokens, or refresh tokens.",
        "Store only the secure hash (SHA256) of the refresh token in the database.",
        "Implement login rate limiting (max 5 failed attempts per username/IP combination in 15 minutes).",
        "Use generic authentication failure response to prevent account enumeration.",
        "Require HTTPS for credential transmission and load JWT secrets from secure configuration."
      ],
      logEvents: [
        "Successful login events.",
        "Failed login attempts.",
        "Disabled, Inactive, Locked, or Deleted user login attempts.",
        "Rate limit triggered."
      ],
      noLogEvents: [
        "Raw passwords.",
        "Access tokens.",
        "Refresh tokens."
      ],
      uiPage: "/login",
      uiComponents: "LoginForm, Button, FormInput",
      uiStateLoading: "Show spinner overlay on the login card, disable the submit button and input fields to prevent double submission.",
      uiStateEmpty: "Not applicable for authentication screen.",
      uiStateError: "Display a warning banner/toast indicating validation fails or generic invalid credentials message.",
      uiStateSuccess: "Redirect the authenticated user to their default workspace/dashboard and display a welcome toast."
    },
    {
      id: "leaf-auth-profile",
      title: "Current User Profile",
      match: /auth-me|profile|get profile/i,
      endpoint: /\/me$/i,
      objective: "Retrieve current user identity profile using a valid Bearer access token.",
      inScope: [
        "Validate JWT access token signature, key, and expiration.",
        "Verify token/session has not been revoked or blacklisted.",
        "Look up user corresponding to token subject.",
        "Enforce current account status check (e.g. reject if disabled/deleted).",
        "Return minimal public identity profile data."
      ],
      outOfScope: [
        "Retrieving sensitive credential secrets or detailed domain-specific business profiles (e.g. driver details)."
      ],
      permissions: [
        { role: "Driver", permission: "Can get own identity profile using valid access token" },
        { role: "Staff", permission: "Can get own identity profile using valid access token" },
        { role: "Manager", permission: "Can get own identity profile using valid access token" },
        { role: "Admin", permission: "Can get own identity profile using valid access token" }
      ],
      dbExistingTables: ["users", "user_roles"],
      dbNewTablesSql: "",
      dbRelationships: [],
      validationRules: [
        { field: "Authorization", rule: "Required, Bearer token format", errorMessage: "Missing or malformed authorization header." }
      ],
      securityRules: [
        "Reject expired, revoked, or signature-invalid access tokens.",
        "Disabled or deleted users must lose API access immediately (checked on every profile request).",
        "Never return internal security stamps, password hashes, or internal database metadata."
      ],
      logEvents: [
        "Successful current user profile retrieval.",
        "Unauthorized profile access attempts."
      ],
      noLogEvents: [
        "Access tokens."
      ],
      uiPage: "/profile",
      uiComponents: "UserProfileCard, Avatar, RoleBadge",
      uiStateLoading: "Show skeleton loader components for profile information.",
      uiStateEmpty: "Not applicable.",
      uiStateError: "On 401/403, clear local authentication state and redirect to login page. On 5xx/network errors, display retry button without clearing session.",
      uiStateSuccess: "Render user profile details (username, full name, email, roles, status) in readonly view."
    },
    {
      id: "leaf-auth-refresh",
      title: "Refresh Access Token",
      match: /refresh/i,
      endpoint: /refresh-token$/i,
      objective: "Renew user session and issue a new access token using single-use refresh token rotation.",
      inScope: [
        "Securely hash and validate the incoming refresh token.",
        "Validate the associated session and token family status.",
        "Check refresh token expiration and revocation status.",
        "Atomically mark the used refresh token as consumed.",
        "Issue a replacement refresh token and a new access token in a single atomic transaction.",
        "Detect token reuse anomalies and revoke the entire token family."
      ],
      outOfScope: [
        "Interactive re-authentication with username and password."
      ],
      permissions: [
        { role: "Guest", permission: "Can access the refresh token endpoint anonymously without access token" }
      ],
      dbExistingTables: ["refresh_tokens"],
      dbNewTablesSql: "",
      dbRelationships: ["refresh_tokens(user_id) references users(id)"],
      validationRules: [
        { field: "refreshToken", rule: "Required, non-empty, valid token string", errorMessage: "Refresh token is required." }
      ],
      securityRules: [
        "Perform token consume-and-replace in a single atomic transaction to prevent race conditions.",
        "Automatic reuse detection: if a refresh token is reused, revoke the entire token family (session) immediately.",
        "Enforce account status check: reject refresh if user has been disabled, locked, or deleted."
      ],
      logEvents: [
        "Successful token refresh.",
        "Invalid refresh attempt (expired, malformed).",
        "Refresh token reuse anomaly detection and family revocation."
      ],
      noLogEvents: [
        "Raw refresh tokens.",
        "New access tokens."
      ],
      uiPage: "Background process (no dedicated page)",
      uiComponents: "HTTP Client interceptors / Axios interceptors",
      uiStateLoading: "Manage token refresh transparently in the background, queuing concurrent API requests.",
      uiStateEmpty: "Not applicable.",
      uiStateError: "On refresh failure (401/403), clear authentication state, show session expired message, and redirect to login.",
      uiStateSuccess: "Silently retry the original failed API request with the new access token."
    },
    {
      id: "leaf-auth-logout",
      title: "Sign Out",
      match: /logout/i,
      endpoint: /\/logout$/i,
      objective: "Terminate the current session, revoke the active refresh token family, and blacklist the active access token.",
      inScope: [
        "Identify the current session ID from the access token claims (jti/session ID).",
        "Revoke the associated session and token family in the database.",
        "Add the current access token identifier to the revocation blacklist table.",
        "Clear all frontend authentication state, stored tokens, and redirect user to login."
      ],
      outOfScope: [
        "Global logout from all other devices or active sessions (managed under a separate feature)."
      ],
      permissions: [
        { role: "Driver", permission: "Can logout own active session" },
        { role: "Staff", permission: "Can logout own active session" },
        { role: "Manager", permission: "Can logout own active session" },
        { role: "Admin", permission: "Can logout own active session" }
      ],
      dbExistingTables: ["refresh_tokens"],
      dbNewTablesSql: `-- Table for storing revoked access tokens (blacklist)
CREATE TABLE revoked_access_tokens (
  id uuid PRIMARY KEY,
  jwt_id varchar(255) UNIQUE NOT NULL,
  user_id uuid NOT NULL,
  expires_at timestamp NOT NULL,
  revoked_at timestamp NOT NULL,
  reason varchar(255) NULL
);`,
      dbRelationships: [],
      validationRules: [
        { field: "Authorization", rule: "Required, Bearer token format", errorMessage: "Bearer token is required to identify the session." }
      ],
      securityRules: [
        "Ensure access token revocation propagates to all backend services (e.g. via shared blacklist or token version check).",
        "Atomically revoke current session. Subsequent refresh requests using tokens from this family must be rejected."
      ],
      logEvents: [
        "Successful logout and session revocation.",
        "Logout failure events."
      ],
      noLogEvents: [
        "Access tokens."
      ],
      uiPage: "None (action triggered from header/settings)",
      uiComponents: "LogoutButton, NavigationHeader",
      uiStateLoading: "Disable interaction on the logout trigger, show loading spinner, clear storage, and redirect.",
      uiStateEmpty: "Not applicable.",
      uiStateError: "Frontend must treat logout as idempotent: even if backend fails, clear client storage and redirect to login.",
      uiStateSuccess: "Redirect to login page and display logout confirmation message."
    },
    {
      id: "leaf-auth-forget-password",
      title: "Forget Password",
      match: /(forget|forgot|reset)/i,
      endpoint: /\/(forgot-password|reset-password)$/i,
      objective: "Provide secure Forget Password and Reset Password flows. Follows strict transactional outbox patterns, lock ordering, and audit logging to ensure consistency across the PBMS ecosystem.",
      inScope: [
        "POST /forgot: Validate email, generate 256-bit entropy token, lock password_reset_tokens, invalidate old tokens, insert new token, and publish Notification via Outbox.",
        "POST /reset: Lock tokens, users, and audit_logs in strict order.",
        "Verify password history (last 5 passwords), complexity, and security stamp.",
        "Update users.password, security_stamp, and token.used_at.",
        "Revoke Sessions: Invalidate Access Tokens, Refresh Tokens, Device Sessions, SignalR Connections, and 'Remember Me' cookies.",
        "Insert into audit_logs and user_password_history.",
        "Publish PasswordResetRequested / PasswordResetCompleted Events via Outbox.",
        "Cleanup worker to periodically hard-delete expired tokens (Batch 1000, every 10 mins)."
      ],
      outOfScope: [],
      permissions: [
        { role: "Guest", permission: "Can access /forgot (4 req/15m) and /reset (20 req/1h) endpoints anonymously." }
      ],
      dbExistingTables: ["users", "audit_logs", "outbox_events"],
      dbNewTablesSql: `-- Table: password_reset_tokens
CREATE TABLE password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Table: user_password_history
CREATE TABLE user_password_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Indexes for Performance
CREATE UNIQUE INDEX ux_password_reset_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX ix_password_reset_user ON password_reset_tokens(user_id) WHERE used_at IS NULL;
CREATE INDEX ix_password_reset_expiry ON password_reset_tokens(expires_at);`,
      dbRelationships: [
        "password_reset_tokens.user_id -> users.id",
        "user_password_history.user_id -> users.id"
      ],
      validationRules: [
        { field: "email (Forgot)", rule: "EmailAddress, Required, MaxLength(255), Trim(), Lowercase", errorMessage: "VALIDATION_ERROR" },
        { field: "token (Reset)", rule: "Required, MaxLength 512", errorMessage: "INVALID_TOKEN" },
        { field: "newPassword (Reset)", rule: "MinLength 8, MaxLength 64, SpecialChar, Digit, Uppercase, Lowercase", errorMessage: "PASSWORD_TOO_WEAK" }
      ],
      securityRules: [
        "Strict Lock Order: 1. password_reset_tokens (SELECT FOR UPDATE), 2. users (SELECT FOR UPDATE), 3. audit_logs (INSERT), 4. outbox_events (INSERT) to prevent deadlocks.",
        "Transactional Outbox Pattern: Never publish events/notifications inside DB transaction directly. Write intent to outbox_events.",
        "Token Lifecycle: Validity 15 minutes, Clock Skew 2 minutes. State Machine: Issued -> Sent -> Verified -> Used -> Expired -> Deleted.",
        "Password History Policy: Remember last 5 passwords. Reject identical to current or found in history (hash comparison).",
        "Security Stamp: Generate a new SecurityStamp and save in users upon reset. Validate stamp against JWT on every request.",
        "No Logic Leak: Ensure INTERNAL_ERROR masks underlying SqlException details.",
        "Cleanup Worker SQL: DELETE FROM password_reset_tokens WHERE id IN (SELECT id FROM password_reset_tokens WHERE expires_at < NOW() ORDER BY expires_at ASC LIMIT 1000);"
      ],
      logEvents: [
        "Audit Metadata: correlationId, traceId, userId, actor (GUEST), ip, userAgent.",
        "PASSWORD_RESET_SUCCESS",
        "PASSWORD_RESET_FAILED"
      ],
      noLogEvents: [
        "Raw token strings.",
        "Raw passwords or new passwords."
      ],
      uiPage: "/forgot-password, /reset-password",
      uiComponents: "ForgotPasswordForm, ResetPasswordForm",
      uiStateLoading: "Show loading spinner overlay during API calls, disable submit buttons.",
      uiStateEmpty: "Not applicable.",
      uiStateError: "Handle 400 (VALIDATION_ERROR, INVALID_TOKEN, PASSWORD_TOO_WEAK, PASSWORD_REUSED, USER_STATUS_INVALID), 429 RATE_LIMITED, 409 CONCURRENT_RESET, 500 INTERNAL_ERROR.",
      uiStateSuccess: "Display success message: 'If the account exists, reset instructions have been sent.' / 'Password has been reset successfully.'",
      apiContracts: [
        {
          id: "contract-auth-forgot",
          name: "POST /api/auth/forgot-password",
          content: "Method: POST\\nPath: /api/auth/forgot-password\\nBody:\\n{\\n  \\\"email\\\": \\\"user@example.com\\\"\\n}\\nResponse 200 OK:\\n{\\n  \\\"success\\\": true,\\n  \\\"message\\\": \\\"If the account exists, reset instructions have been sent.\\\"\\n}"
        },
        {
          id: "contract-auth-reset",
          name: "POST /api/auth/reset-password",
          content: "Method: POST\\nPath: /api/auth/reset-password\\nBody:\\n{\\n  \\\"token\\\": \\\"raw_token_string\\\",\\n  \\\"newPassword\\\": \\\"SecurePassword123!\\\",\\n  \\\"confirmPassword\\\": \\\"SecurePassword123!\\\"\\n}\\nResponse 200 OK:\\n{\\n  \\\"success\\\": true,\\n  \\\"message\\\": \\\"Password has been reset successfully.\\\"\\n}"
        }
      ],
      testCases: [
        { id: "tc-auth-forgot-valid", title: "Verify valid email sends reset link", type: "integration", precondition: "User exists", steps: ["POST /forgot"], expectedResult: "HTTP 200", status: "not_started" },
        { id: "tc-auth-reset-valid", title: "Verify valid token resets password", type: "integration", precondition: "Token exists", steps: ["POST /reset"], expectedResult: "HTTP 200", status: "not_started" }
      ],
      doneCriteria: [
        { id: "dc-auth-forgot-impl", content: "Forgot password endpoint implemented", checked: false },
        { id: "dc-auth-reset-impl", content: "Reset password endpoint implemented", checked: false },
        { id: "dc-auth-reset-lock", content: "Strict lock order implemented", checked: false },
        { id: "dc-auth-reset-outbox", content: "Outbox events published", checked: false }
      ]
    }
  ];

  node.children = definitions.map(definition => {
    const child = emptyNode(definition.id, definition.title, "leaf_feature", `${definition.title} authentication flow.`);
    child.clients = [...node.clients];
    child.status = node.status;
    child.priority = node.priority;
    child.tags = [...node.tags];
    child.metadata = {
      ownerService: node.metadata?.ownerService,
      consumerServices: node.metadata?.consumerServices,
      endpoints: (node.metadata?.endpoints || []).filter(endpoint => definition.endpoint.test(endpoint)),
      sourceFiles: node.metadata?.sourceFiles,
    };
    child.objective = definition.objective;
    child.inScope = definition.inScope;
    child.outOfScope = definition.outOfScope;
    child.permissions = definition.permissions;
    child.dbExistingTables = definition.dbExistingTables;
    child.dbNewTablesSql = definition.dbNewTablesSql;
    child.dbRelationships = definition.dbRelationships;
    child.validationRules = definition.validationRules;
    child.securityRules = definition.securityRules;
    child.logEvents = definition.logEvents;
    child.noLogEvents = definition.noLogEvents;
    child.uiPage = definition.uiPage;
    child.uiComponents = definition.uiComponents;
    child.uiStateLoading = definition.uiStateLoading;
    child.uiStateEmpty = definition.uiStateEmpty;
    child.uiStateError = definition.uiStateError;
    child.uiStateSuccess = definition.uiStateSuccess;

    child.apiContracts = (definition as any).apiContracts || node.apiContracts.filter(item => definition.match.test(`${item.id} ${item.name}`));
    child.testCases = (definition as any).testCases || node.testCases.filter(item => definition.match.test(`${item.id} ${item.title}`));
    child.doneCriteria = (definition as any).doneCriteria || node.doneCriteria.filter(item => definition.match.test(`${item.id} ${item.content}`));
    return child;
  });

  const assigned = <T extends { id: string }>(items: T[], groups: T[][]) => {
    const ids = new Set(groups.flat().map(item => item.id));
    return items.filter(item => !ids.has(item.id));
  };
  node.apiContracts = assigned(node.apiContracts, node.children.map(child => child.apiContracts));
  node.testCases = assigned(node.testCases, node.children.map(child => child.testCases));
  node.doneCriteria = assigned(node.doneCriteria, node.children.map(child => child.doneCriteria));
  node.metadata = { ...node.metadata, endpoints: [] };
  node.uiPage = undefined;
  node.uiComponents = undefined;
  node.uiStateLoading = undefined;
  node.uiStateEmpty = undefined;
  node.uiStateError = undefined;
  node.uiStateSuccess = undefined;
}

/**
 * Converts the original endpoint-oriented parking seed into a stable capability taxonomy.
 * Existing feature payloads are moved rather than recreated, so contracts and sample data survive.
 */
export function migrateParkingTaxonomy(root: FeatureNode): FeatureNode {
  const byId = () => new Map(walk(root).map(node => [node.id, node]));
  const get = (id: string) => {
    const node = byId().get(id);
    if (!node) throw new Error(`Parking taxonomy migration cannot find ${id}`);
    return node;
  };
  const detach = (id: string) => {
    const node = get(id);
    const parent = node.parentId ? get(node.parentId) : null;
    if (parent) parent.children = (parent.children || []).filter(child => child.id !== id);
    return node;
  };
  const attach = (parentId: string, child: FeatureNode) => {
    const parent = get(parentId);
    parent.children = [...(parent.children || []), child];
  };
  const group = (parentId: string, id: string, title: string, summary: string) => {
    const node = emptyNode(id, title, "feature", summary);
    attach(parentId, node);
    return node;
  };
  const moveMany = (parentId: string, ids: string[]) => ids.forEach(id => attach(parentId, detach(id)));
  const convertAndMove = (id: string, parentId: string, title: string) => {
    const node = detach(id);
    node.type = "feature";
    node.title = title;
    attach(parentId, node);
  };
  const mergeAndRemove = (targetId: string, sourceId: string) => {
    const target = get(targetId);
    const source = detach(sourceId);
    mergeNodeContent(target, source);
  };

  splitAuthentication(get("leaf-auth-session"));
  get("leaf-auth-register").title = "Driver Registration";

  const users = get("cat-user-driver");
  users.title = "Users & Drivers";
  const userManagement = get("cat-user-management");
  userManagement.type = "feature";
  userManagement.title = "User Account Management";
  group(users.id, "feat-driver-self-service", "Driver Self-Service", "Driver-owned vehicle, history, and pass application capabilities.");
  moveMany("feat-driver-self-service", ["leaf-driver-vehicles-list", "leaf-driver-vehicle-history"]);

  const parkingConfiguration = emptyNode("cat-parking-configuration", "Parking Configuration", "category", "Vehicle, facility, slot, gate, and access-card configuration.");
  attach(root.id, parkingConfiguration);
  convertAndMove("cat-vehicle-config", parkingConfiguration.id, "Vehicle Type Configuration");
  convertAndMove("cat-structure", parkingConfiguration.id, "Facility Structure Management");
  convertAndMove("cat-cards", parkingConfiguration.id, "Access Card Management");

  get("cat-reservation").title = "Reservations";
  group("cat-reservation", "feat-reservation-management", "Reservation Management", "Availability, booking lifecycle, and driver reservation history.");
  moveMany("feat-reservation-management", ["leaf-res-avail", "leaf-res-create", "leaf-res-extend", "leaf-res-cancel", "leaf-res-driver-history"]);

  get("cat-session").title = "Parking Operations";
  group("cat-session", "feat-parking-session-management", "Parking Session Management", "Vehicle entry, session claim, slot suggestion, and vehicle exit.");
  moveMany("feat-parking-session-management", ["leaf-sess-entry", "leaf-sess-claim", "leaf-sess-exit", "leaf-struct-suggest"]);

  get("cat-payment").title = "Payments";
  group("cat-payment", "feat-payment-processing", "Payment Processing", "Online, cash, waived, and webhook-driven payment flows.");
  moveMany("feat-payment-processing", ["leaf-pay-webhook", "leaf-pay-online", "leaf-pay-cash", "leaf-pay-waived"]);
  group("cat-payment", "feat-payment-reconciliation", "Payment Reconciliation", "Payment matching, review, and exception handling.");
  moveMany("feat-payment-reconciliation", ["leaf-pay-reconcile", "leaf-pay-review"]);
  convertAndMove("cat-pricing", "cat-payment", "Pricing Management");

  get("cat-monthly-pass").title = "Monthly Passes";
  group("cat-monthly-pass", "feat-monthly-pass-management", "Monthly Pass Management", "Application, review, card assignment, validation, and renewal.");
  moveMany("feat-monthly-pass-management", ["leaf-mp-app-review", "leaf-mp-card-manage", "leaf-mp-renew", "leaf-mp-validation", "leaf-driver-mp-application"]);

  get("cat-incidents").title = "Incidents & Exceptions";
  group("cat-incidents", "feat-incident-management", "Incident Management", "Lost cards, mismatches, and authorized overrides.");
  moveMany("feat-incident-management", ["leaf-inc-lost-card", "leaf-inc-mismatch", "leaf-inc-override"]);

  get("cat-reports").title = "Reporting & Analytics";
  group("cat-reports", "feat-operational-analytics", "Operational Analytics", "Operational dashboards and analytical reports.");
  moveMany("feat-operational-analytics", ["leaf-rep-dashboard", "leaf-rep-revenue", "leaf-rep-traffic", "leaf-rep-occupancy", "leaf-rep-card", "leaf-rep-audit"]);
  group("cat-reports", "feat-report-export", "Report Export", "Export report data for downstream use.");
  moveMany("feat-report-export", ["leaf-rep-export"]);

  get("cat-public").title = "Public Information";
  mergeAndRemove("leaf-pub-price", "leaf-price-public");
  mergeAndRemove("leaf-pub-avail", "leaf-struct-avail");
  const pubAccess = group("cat-public", "feat-public-information-access", "Public Information Access", "Anonymous access to parking information, pricing, rules, and availability.");
  pubAccess.status = "ready";
  moveMany("feat-public-information-access", ["leaf-pub-info", "leaf-pub-price", "leaf-pub-rules", "leaf-pub-avail"]);

  const feedSubmission = group("cat-feedback", "feat-feedback-submission", "Feedback Submission", "Driver feedback submission flow.");
  feedSubmission.status = "ready";
  moveMany("feat-feedback-submission", ["leaf-feed-submit"]);
  const feedAdmin = group("cat-feedback", "feat-feedback-administration", "Feedback Administration", "Review and manage submitted feedback.");
  feedAdmin.status = "ready";
  moveMany("feat-feedback-administration", ["leaf-feed-list", "leaf-feed-detail", "leaf-feed-update"]);

  get("cat-notification").title = "Notifications";
  mergeAndRemove("leaf-notif-user", "leaf-notif-unread");
  const notifMgmt = group("cat-notification", "feat-notification-management", "Notification Management", "Notification delivery, unread counts, and read state.");
  notifMgmt.status = "ready";
  moveMany("feat-notification-management", ["leaf-notif-user", "leaf-notif-read"]);

  get("cat-diagnostics").title = "Platform Operations & Diagnostics";
  group("cat-diagnostics", "feat-health-monitoring", "Health Monitoring", "Core, support API, and database health checks.");
  moveMany("feat-health-monitoring", ["leaf-diag-core-health", "leaf-diag-support-health", "leaf-diag-db-check"]);
  group("cat-diagnostics", "feat-diagnostic-data-access", "Diagnostic Data Access", "Restricted diagnostic snapshots for troubleshooting.");
  moveMany("feat-diagnostic-data-access", ["leaf-diag-res-dump", "leaf-diag-sess-dump"]);

  get("cat-mock-devices").title = "Developer & Test Utilities";
  const deviceSim = group("cat-mock-devices", "feat-device-simulation", "Device Simulation", "Camera, RFID, and barrier simulators.");
  deviceSim.status = "ready";
  moveMany("feat-device-simulation", ["leaf-mock-camera", "leaf-mock-rfid", "leaf-mock-barrier"]);
  const testDataMaint = group("cat-mock-devices", "feat-test-data-maintenance", "Test Data Maintenance", "Restricted destructive and lifecycle test-data utilities.");
  testDataMaint.status = "ready";
  moveMany("feat-test-data-maintenance", ["leaf-diag-clear-res", "leaf-diag-migrate", "leaf-diag-expire-res", "leaf-diag-expire-pay"]);

  normalizeTree(root);
  return root;
}

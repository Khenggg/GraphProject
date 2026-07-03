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
      "Important staff/manager/admin actions should be auditable."
    ],
    children: [
      // 1. Clients / Roles
      {
        id: "cat-clients-roles",
        title: "Clients / Roles",
        type: "category",
        summary: "Primary user categories and system personas supported by the parking management system.",
        children: [
          { id: "leaf-role-guest", title: "Public / Guest", type: "leaf_feature", summary: "Anonymous or unregistered public users seeking basic parking building info." },
          { id: "leaf-role-driver", title: "Driver", type: "leaf_feature", summary: "Registered drivers utilizing reservations, claiming sessions, and making payments." },
          { id: "leaf-role-staff", title: "Staff", type: "leaf_feature", summary: "On-site operators handling gates, cash payments, card lookups, and manual overrides." },
          { id: "leaf-role-manager", title: "Manager", type: "leaf_feature", summary: "Supervisor managing floors, areas, parking slots, pricing configurations, and viewing reports." },
          { id: "leaf-role-admin", title: "Admin", type: "leaf_feature", summary: "System administrators handling user CRUD, roles changes, audit logs, and diagnostic debugs." },
          { id: "leaf-role-system", title: "System / Worker", type: "leaf_feature", summary: "Automated cron workers executing reservations expiries, webhook triggers, and reconciliations." }
        ].map(node => ({
          ...node,
          type: node.type as any,
          testCases: defaultApiTests(node.title, [], []),
          doneCriteria: defaultDoneCriteria(node.title)
        }))
      },

      // 2. System Architecture
      {
        id: "cat-sys-arch",
        title: "System Architecture",
        type: "category",
        summary: "Core system constraints and architectural boundaries governing the dual backend APIs.",
        children: [
          { id: "leaf-arch-dual", title: "Dual Backend Boundary", type: "leaf_feature", summary: "Splitting transactional API writes to .NET Core and public queries to Spring Boot Support API." },
          { id: "leaf-arch-db", title: "Shared PostgreSQL Database", type: "leaf_feature", summary: "Single source of truth accessed by both backend services with strict entity ownership." },
          { id: "leaf-arch-format", title: "Common API Response Format", type: "leaf_feature", summary: "Enforcing unified wrappers for success payloads and localized errors." },
          { id: "leaf-arch-error", title: "Global Error Handling", type: "leaf_feature", summary: "Catch-all middleware preventing internal stack traces leaking to clients." },
          { id: "leaf-arch-log", title: "Request Logging", type: "leaf_feature", summary: "Structured logging of all incoming API requests for security tracing." },
          { id: "leaf-arch-jwt", title: "JWT Auth Between .NET and Spring", type: "leaf_feature", summary: "Authenticating requests across APIs via shared secret key validation." },
          { id: "leaf-arch-audit", title: "Audit Logging", type: "leaf_feature", summary: "Recording sensitive manager/admin mutations in a dedicated audit schema." }
        ].map(node => ({
          ...node,
          type: node.type as any,
          testCases: defaultApiTests(node.title, ["Admin"], []),
          doneCriteria: defaultDoneCriteria(node.title)
        }))
      },

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
            id: "leaf-auth-login",
            title: "Login",
            type: "leaf_feature",
            clients: ["Driver", "Staff", "Manager", "Admin"],
            endpoints: ["POST /api/core/auth/login"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/auth/login"),
            testCases: defaultApiTests("Login", ["Driver", "Staff"], ["POST /api/core/auth/login"]),
            doneCriteria: [
              ...defaultDoneCriteria("Login"),
              { id: "dc-auth-jwt-gen", content: "JWT token is generated and returned on successful login.", checked: false }
            ]
          },
          {
            id: "leaf-auth-me",
            title: "Get Current User",
            type: "leaf_feature",
            clients: ["Driver", "Staff", "Manager", "Admin"],
            endpoints: ["GET /api/core/auth/me"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/auth/me"),
            testCases: defaultApiTests("Get Current User", ["Driver"], ["GET /api/core/auth/me"]),
            doneCriteria: defaultDoneCriteria("Get Current User")
          },
          {
            id: "leaf-auth-refresh",
            title: "Refresh Token",
            type: "leaf_feature",
            clients: ["Driver", "Staff", "Manager", "Admin"],
            endpoints: ["POST /api/core/auth/refresh-token"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/auth/refresh-token"),
            testCases: defaultApiTests("Refresh Token", ["Driver"], ["POST /api/core/auth/refresh-token"]),
            doneCriteria: defaultDoneCriteria("Refresh Token")
          },
          {
            id: "leaf-auth-logout",
            title: "Logout",
            type: "leaf_feature",
            clients: ["Driver", "Staff", "Manager", "Admin"],
            endpoints: ["POST /api/core/auth/logout"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/auth/logout"),
            testCases: defaultApiTests("Logout", ["Driver"], ["POST /api/core/auth/logout"]),
            doneCriteria: defaultDoneCriteria("Logout")
          }
        ]
      },

      // 4. Access Control & Authorization
      {
        id: "cat-access-control",
        title: "Access Control & Authorization",
        type: "category",
        summary: "Authorization and permission checking mechanisms.",
        businessRules: [
          "Role-based authorization must protect admin, manager, staff, and driver-only endpoints.",
          "Spring Boot Support API must validate the JWT issued by the .NET Core API."
        ],
        children: [
          {
            id: "leaf-auth-support-check",
            title: "Support Auth Check",
            type: "leaf_feature",
            clients: ["Driver", "Staff", "Manager", "Admin"],
            endpoints: ["GET /api/support/auth-check"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/auth-check"),
            testCases: defaultApiTests("Support Auth Check", ["Driver"], ["GET /api/support/auth-check"]),
            doneCriteria: defaultDoneCriteria("Support Auth Check")
          },
          {
            id: "leaf-auth-rbac",
            title: "Role-Based Authorization",
            type: "leaf_feature",
            clients: ["Driver", "Staff", "Manager", "Admin"],
            endpoints: [],
            ownerService: ".NET Core API",
            testCases: defaultApiTests("Role-Based Authorization", ["Admin"], []),
            doneCriteria: defaultDoneCriteria("Role-Based Authorization")
          }
        ]
      },

      // 4. User & Driver Management
      {
        id: "cat-user-driver",
        title: "User & Driver Management",
        type: "category",
        summary: "Operations for administering users and driver vehicle records.",
        children: [
          {
            id: "leaf-user-crud",
            title: "User CRUD",
            type: "leaf_feature",
            clients: ["Admin"],
            endpoints: [
              "GET /api/core/users",
              "GET /api/core/users/{id}",
              "POST /api/core/users",
              "PUT /api/core/users/{id}",
              "DELETE /api/core/users/{id}",
              "PATCH /api/core/users/{id}/status",
              "PATCH /api/core/users/{id}/role"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/users"),
            testCases: defaultApiTests("User CRUD", ["Admin"], ["GET /api/core/users"]),
            doneCriteria: [
              ...defaultDoneCriteria("User CRUD"),
              { id: "dc-user-status", content: "User status activation/deactivation works.", checked: false },
              { id: "dc-user-role", content: "User role modifications are applied immediately.", checked: false }
            ]
          },
          {
            id: "leaf-driver-vehicle",
            title: "Driver Vehicle Management",
            type: "leaf_feature",
            clients: ["Driver"],
            endpoints: [
              "GET /api/core/driver/vehicles",
              "POST /api/core/driver/vehicles"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/driver/vehicles"),
            testCases: defaultApiTests("Driver Vehicle Management", ["Driver"], ["GET /api/core/driver/vehicles"]),
            doneCriteria: defaultDoneCriteria("Driver Vehicle Management")
          },
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
            id: "leaf-mp-crud",
            title: "Monthly Pass CRUD",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: [
              "GET /api/core/monthly-passes",
              "POST /api/core/monthly-passes",
              "PUT /api/core/monthly-passes/{id}",
              "PATCH /api/core/monthly-passes/{id}/status",
              "GET /api/core/monthly-passes/check"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/monthly-passes"),
            testCases: defaultApiTests("Monthly Pass CRUD", ["Manager"], ["GET /api/core/monthly-passes"]),
            doneCriteria: [
              ...defaultDoneCriteria("Monthly Pass CRUD"),
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
  return [rootNode];
}

export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const fs = require('fs');

const filePath = 'd:\\ky5\\SWP391\\git-graph\\GraphProject\\src\\seed\\parkingBuildingSeed.ts';
let lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);

let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('id: "leaf-pub-info",')) {
        startIdx = i;
        break;
    }
}

let endIdx = -1;
for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].includes('dbExistingTables: [') && lines[i+1] && lines[i+1].includes('floors')) {
        endIdx = i;
        break;
    }
}

if (startIdx === -1 || endIdx === -1) {
    console.error(`Could not find indices: start=${startIdx}, end=${endIdx}`);
    process.exit(1);
}

const replacementLines = [
    '            id: "leaf-pub-info",',
    '            title: "Parking Info",',
    '            type: "leaf_feature",',
    '            clients: ["Guest", "Driver"],',
    '            status: "ready",',
    '            priority: "medium",',
    '            tags: ["public", "info", "pricing", "rules", "capacity"],',
    '            summary: "Public read-only parking building information including capacity, pricing, and rules.",',
    '            ownerService: "Spring Boot Support API",',
    '            endpoints: ["GET /api/public/parking-info"],',
    '            objective: "Purpose: Provide a public, high-level overview of the parking building, including a capacity summary, current pricing summary, accepted vehicle types, and general parking rules.\\nOffload Core API: Completely separate this public, read-heavy query flow to the Spring Boot Support API to safeguard the performance of transactional, write-heavy core operations managed by the .NET Core API.\\nServe Guest/Driver: Enable public guests and arriving drivers to easily look up information and prepare comprehensive details before entering the parking facility.\\nRead-Only Nature: This feature operates strictly under a read-only mode, absolutely prohibiting the opening of any write transactions or modifying any data states within the system.",',
    '            inScope: [',
    '              "Real-time Capacity Aggregation: Compute the live capacity by counting the number of vacant (AVAILABLE) slots grouped by each vehicle type from the structural tables (floors, areas, slots).",',
    '              "Pricing Lookup: Read and display the active rate charts from the pricing_rules table corresponding to the operational vehicle_types.",',
    '              "General Rules Retrieval: Fetch and display public operational rules (e.g., maximum clearance height, operating hours, emergency hotline, lost card policy) by querying the general system_configs table.",',
    '              "Standardized Output: Enforce the global Shared Response Wrapper format uniformly across all system responses."',
    '            ],',
    '            outOfScope: [',
    '              "Any authentication processing, token validation, or user session configuration.",',
    '              "Smart slot allocation recommendations or real-time parking navigation (exclusively handled by the write operations of the .NET Core API).",',
    '              "Altering, modifying, or updating the operational status of slots, areas, or floors."',
    '            ],',
    '            permissions: [',
    '              { role: "Guest", permission: "Public Access - Authorized to access freely without any authentication token via permitAll() configurations on the /api/public/** path." },',
    '              { role: "Driver", permission: "Public Access - Authorized to access freely without any authentication token via permitAll() configurations on the /api/public/** path." }',
    '            ],',
    '            businessRules: [',
    '              "Public parking information, pricing, rules, and available slots should be readable without login.",',
    '              "Read-Only Constraint: The Spring Boot Support API serves strictly as a presentation/reporting layer; the JPA configuration must be explicitly set to spring.jpa.hibernate.ddl-auto: validate. Mutation methods (save, delete, flush) are strictly prohibited within the Repositories designated for this feature.",',
    '              "Naming Mapping: All PostgreSQL table and column identifiers adhere to snake_case, which the Spring Boot Entity layer maps automatically to Java camelCase fields.",',
    '              "Timezone Standard: Temporal data in the database utilizes the TIMESTAMPTZ (UTC) type. When the API dispatches information, the response wrapper must format the datetime strings in strict compliance with the ISO 8601 standard.",',
    '              "Data Sanitization: Absolutely no sensitive internal system details (such as staff account IDs, password hashes, current guest license plates, or raw technical logs) may be exposed within the public payload."',
    '            ],'
];

lines.splice(startIdx, endIdx - startIdx, ...replacementLines);

let leafEndIdx = -1;
let currentIdx = startIdx + replacementLines.length;

for (let i = currentIdx; i < lines.length; i++) {
    if (lines[i].includes('id: "leaf-pub-price",')) {
        leafEndIdx = i;
        break;
    }
    
    if (lines[i].startsWith('        ') && !lines[i].startsWith('            ')) {
        lines[i] = '    ' + lines[i];
    }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
console.log("Fix applied successfully!");

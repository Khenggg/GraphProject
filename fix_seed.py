import sys
import re

file_path = r'd:\ky5\SWP391\git-graph\GraphProject\src\seed\parkingBuildingSeed.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
for i, line in enumerate(lines):
    if 'id: "leaf-pub-info",' in line:
        start_idx = i
        break

end_idx = -1
for i in range(start_idx, len(lines)):
    if 'dbExistingTables: [' in line and 'floors' in lines[i+1]:
        end_idx = i
        break

if start_idx == -1 or end_idx == -1:
    print(f"Could not find indices: start={start_idx}, end={end_idx}")
    sys.exit(1)

replacement_lines = [
    '            id: "leaf-pub-info",\n',
    '            title: "Parking Info",\n',
    '            type: "leaf_feature",\n',
    '            clients: ["Guest", "Driver"],\n',
    '            status: "ready",\n',
    '            priority: "medium",\n',
    '            tags: ["public", "info", "pricing", "rules", "capacity"],\n',
    '            summary: "Public read-only parking building information including capacity, pricing, and rules.",\n',
    '            ownerService: "Spring Boot Support API",\n',
    '            endpoints: ["GET /api/public/parking-info"],\n',
    '            objective: "Purpose: Provide a public, high-level overview of the parking building, including a capacity summary, current pricing summary, accepted vehicle types, and general parking rules.\\nOffload Core API: Completely separate this public, read-heavy query flow to the Spring Boot Support API to safeguard the performance of transactional, write-heavy core operations managed by the .NET Core API.\\nServe Guest/Driver: Enable public guests and arriving drivers to easily look up information and prepare comprehensive details before entering the parking facility.\\nRead-Only Nature: This feature operates strictly under a read-only mode, absolutely prohibiting the opening of any write transactions or modifying any data states within the system.",\n',
    '            inScope: [\n',
    '              "Real-time Capacity Aggregation: Compute the live capacity by counting the number of vacant (AVAILABLE) slots grouped by each vehicle type from the structural tables (floors, areas, slots).",\n',
    '              "Pricing Lookup: Read and display the active rate charts from the pricing_rules table corresponding to the operational vehicle_types.",\n',
    '              "General Rules Retrieval: Fetch and display public operational rules (e.g., maximum clearance height, operating hours, emergency hotline, lost card policy) by querying the general system_configs table.",\n',
    '              "Standardized Output: Enforce the global Shared Response Wrapper format uniformly across all system responses."\n',
    '            ],\n',
    '            outOfScope: [\n',
    '              "Any authentication processing, token validation, or user session configuration.",\n',
    '              "Smart slot allocation recommendations or real-time parking navigation (exclusively handled by the write operations of the .NET Core API).",\n',
    '              "Altering, modifying, or updating the operational status of slots, areas, or floors."\n',
    '            ],\n',
    '            permissions: [\n',
    '              { role: "Guest", permission: "Public Access - Authorized to access freely without any authentication token via permitAll() configurations on the /api/public/** path." },\n',
    '              { role: "Driver", permission: "Public Access - Authorized to access freely without any authentication token via permitAll() configurations on the /api/public/** path." }\n',
    '            ],\n',
    '            businessRules: [\n',
    '              "Public parking information, pricing, rules, and available slots should be readable without login.",\n',
    '              "Read-Only Constraint: The Spring Boot Support API serves strictly as a presentation/reporting layer; the JPA configuration must be explicitly set to spring.jpa.hibernate.ddl-auto: validate. Mutation methods (save, delete, flush) are strictly prohibited within the Repositories designated for this feature.",\n',
    '              "Naming Mapping: All PostgreSQL table and column identifiers adhere to snake_case, which the Spring Boot Entity layer maps automatically to Java camelCase fields.",\n',
    '              "Timezone Standard: Temporal data in the database utilizes the TIMESTAMPTZ (UTC) type. When the API dispatches information, the response wrapper must format the datetime strings in strict compliance with the ISO 8601 standard.",\n',
    '              "Data Sanitization: Absolutely no sensitive internal system details (such as staff account IDs, password hashes, current guest license plates, or raw technical logs) may be exposed within the public payload."\n',
    '            ],\n'
]

del lines[start_idx:end_idx]

for line in reversed(replacement_lines):
    lines.insert(start_idx, line)

# Now fix the indentation for the rest of leaf-pub-info
leaf_end_idx = -1
for i in range(start_idx + len(replacement_lines), len(lines)):
    if 'id: "leaf-pub-price",' in lines[i]:
        leaf_end_idx = i
        break
    
    if lines[i].startswith('        ') and not lines[i].startswith('            '):
        lines[i] = '    ' + lines[i]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Fix applied successfully!")

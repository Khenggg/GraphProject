import type { FeatureNode } from "./featureNode.types";
import { getAncestorChain, getEffectiveRules } from "./inheritance.utils";

/**
 * Helper to construct the breadcrumb path for a node.
 * e.g., "Parking Building > Auth > Login > Login by Google"
 */
export function getFeaturePath(nodeId: string, flatNodes: FeatureNode[]): string {
  const chain = getAncestorChain(nodeId, flatNodes);
  return chain.map(n => n.title).join(" > ");
}

/**
 * Helper to build a nested tree structure from flat nodes list.
 */
export function buildTreeFromFlat(flatNodes: FeatureNode[], parentId: string | null = null): FeatureNode[] {
  const nodes = flatNodes.filter(n => n.parentId === parentId);
  // Sort by order
  nodes.sort((a, b) => a.order - b.order);
  
  return nodes.map(node => ({
    ...node,
    children: buildTreeFromFlat(flatNodes, node.id)
  }));
}

/**
 * Formats a single node to Markdown according to the selected mode.
 */
export function formatSingleNodeMarkdown(
  node: FeatureNode,
  flatNodes: FeatureNode[],
  mode: 'human' | 'ai' | 'qa'
): string {
  const path = getFeaturePath(node.id, flatNodes);
  const effectiveRulesGroups = getEffectiveRules(node.id, flatNodes);
  
  // Flatten effective rules
  const allEffectiveRules = effectiveRulesGroups.flatMap(g => g.rules);
  const inheritedGroups = effectiveRulesGroups.filter(g => g.sourceNodeId !== node.id);
  const localRules = node.businessRules || [];
  
  let md = "";
  
  if (mode === 'human') {
    md += `# Feature Specification: ${node.title}\n\n`;
    md += `**Path:** ${path}\n\n`;
    
    md += `## Metadata\n`;
    md += `| Field | Value |\n`;
    md += `| :--- | :--- |\n`;
    md += `| **Type** | \`${node.type}\` |\n`;
    md += `| **Status** | \`${node.status}\` |\n`;
    md += `| **Priority** | \`${node.priority}\` |\n`;
    if (node.clients && node.clients.length > 0) {
      md += `| **Clients/Roles** | ${node.clients.join(", ")} |\n`;
    }
    if (node.tags && node.tags.length > 0) {
      md += `| **Tags** | ${node.tags.map(t => `\`${t}\``).join(", ")} |\n`;
    }
    md += `\n`;
    
    if (node.summary) {
      md += `## Summary\n${node.summary}\n\n`;
    }
    
    // Business Rules Section (Only if inherited or local rules exist)
    if (inheritedGroups.length > 0 || localRules.length > 0) {
      md += `## Business Rules\n`;
      if (inheritedGroups.length > 0) {
        md += `### Inherited Rules\n`;
        inheritedGroups.forEach(g => {
          md += `#### From ${g.sourceTitle}\n`;
          g.rules.forEach(r => md += `- ${r}\n`);
        });
        md += `\n`;
      }
      
      if (localRules.length > 0) {
        md += `### Local Rules\n`;
        localRules.forEach(r => md += `- ${r}\n`);
        md += `\n`;
      }
    }
    
    // Contracts Section (Only if at least one type of contract exists)
    const hasApi = node.apiContracts && node.apiContracts.length > 0;
    const hasUi = node.uiContracts && node.uiContracts.length > 0;
    const hasData = node.dataContracts && node.dataContracts.length > 0;
    if (hasApi || hasUi || hasData) {
      md += `## Contracts\n`;
      if (hasApi) {
        md += `### API Contracts\n`;
        node.apiContracts!.forEach(c => {
          md += `#### ${c.name}\n\`\`\`\n${c.content}\n\`\`\`\n\n`;
        });
      }
      if (hasUi) {
        md += `### UI Contracts\n`;
        node.uiContracts!.forEach(c => {
          md += `#### ${c.name}\n\`\`\`\n${c.content}\n\`\`\`\n\n`;
        });
      }
      if (hasData) {
        md += `### Data Contracts\n`;
        node.dataContracts!.forEach(c => {
          md += `#### ${c.name}\n\`\`\`\n${c.content}\n\`\`\`\n\n`;
        });
      }
    }
    
    // Test Cases Section
    if (node.testCases && node.testCases.length > 0) {
      md += `## Test Cases & Verification\n`;
      node.testCases.forEach((tc, idx) => {
        md += `### Test ${idx + 1}: ${tc.title} (\`${tc.type}\`)\n`;
        if (tc.precondition) md += `**Precondition:** ${tc.precondition}\n\n`;
        if (tc.steps && tc.steps.length > 0) {
          md += `**Steps:**\n`;
          tc.steps.forEach((step, sIdx) => md += `${sIdx + 1}. ${step}\n`);
          md += `\n`;
        }
        md += `**Expected:** ${tc.expectedResult}\n`;
        md += `**Status:** \`${tc.status}\`\n\n`;
      });
    }
    
    // Done Criteria Section
    if (node.doneCriteria && node.doneCriteria.length > 0) {
      md += `## Done Criteria\n`;
      node.doneCriteria.forEach(dc => {
        md += `- [${dc.checked ? 'x' : ' '}] ${dc.content}\n`;
      });
      md += `\n`;
    }
    
    // Dependencies & Risks Section
    const hasDeps = node.dependencies && node.dependencies.length > 0;
    const hasRisks = node.risks && node.risks.length > 0;
    if (hasDeps || hasRisks) {
      md += `## Dependencies & Risks\n`;
      if (hasDeps) {
        md += `### Dependencies\n`;
        node.dependencies!.forEach(d => md += `- ${d}\n`);
        md += `\n`;
      }
      if (hasRisks) {
        md += `### Risks\n`;
        node.risks!.forEach(r => md += `- ${r}\n`);
        md += `\n`;
      }
    }
    
    if (node.notes) {
      md += `## Notes\n${node.notes}\n\n`;
    }
    
  } else if (mode === 'ai') {
    md += `# AI Implementation Guide: ${node.title}\n\n`;
    md += `**Target Path:** ${path}\n`;
    md += `**Node Type:** ${node.type}\n`;
    md += `**Status:** ${node.status}\n`;
    md += `**Priority:** ${node.priority}\n`;
    if (node.clients && node.clients.length > 0) {
      md += `**Authorized Clients/Roles:** ${node.clients.join(", ")}\n`;
    }
    if (node.metadata) {
      if (node.metadata.ownerService) {
        md += `**Owner Service:** ${node.metadata.ownerService}\n`;
      }
      if (node.metadata.consumerServices && node.metadata.consumerServices.length > 0) {
        md += `**Consumer Services:** ${node.metadata.consumerServices.join(", ")}\n`;
      }
      if (node.metadata.endpoints && node.metadata.endpoints.length > 0) {
        md += `**Endpoints:**\n`;
        node.metadata.endpoints.forEach(ep => {
          md += `- ${ep}\n`;
        });
      }
    }
    md += `\n---\n\n`;

    // Section 1: Objective
    md += `## 1. Summary / Objective\n\n`;
    md += `${node.objective || node.summary || "No objective documented."}\n\n`;

    // Section 2: Scope
    md += `## 2. Scope\n\n`;
    md += `### In Scope\n\n`;
    if (node.inScope && node.inScope.length > 0) {
      node.inScope.forEach(item => md += `* ${item}\n`);
    } else {
      md += `* Implement the core logic and requirements of this feature.\n`;
    }
    md += `\n### Out of Scope\n\n`;
    if (node.outOfScope && node.outOfScope.length > 0) {
      node.outOfScope.forEach(item => md += `* ${item}\n`);
    } else {
      md += `* External system integrations not specified in this document.\n`;
    }
    md += `\n`;

    // Section 3: Actors / Roles / Permissions
    md += `## 3. Actors / Roles / Permissions\n\n`;
    if (node.permissions && node.permissions.length > 0) {
      md += `| Role | Permission |\n`;
      md += `| --- | --- |\n`;
      node.permissions.forEach(p => {
        md += `| ${p.role} | ${p.permission} |\n`;
      });
    } else if (node.clients && node.clients.length > 0) {
      md += `| Role | Access |\n`;
      md += `| --- | --- |\n`;
      node.clients.forEach(c => {
        md += `| ${c} | Authorized to access this feature. |\n`;
      });
    } else {
      md += `No role-specific permissions specified.\n`;
    }
    md += `\n`;

    // Section 4: Effective Business Rules
    md += `## 4. Effective Rules (Inherited & Local)\n\n`;
    if (allEffectiveRules.length > 0) {
      allEffectiveRules.forEach(rule => {
        md += `* ${rule}\n`;
      });
    } else {
      md += `* Follow standard application logic.\n`;
    }
    md += `\n`;

    // Section 5: API Contracts
    md += `## 5. API Contracts\n\n`;
    if (node.apiContracts && node.apiContracts.length > 0) {
      node.apiContracts.forEach(c => {
        md += `### ${c.name}\n\n\`\`\`\n${c.content}\n\`\`\`\n\n`;
      });
    } else {
      md += `No API contracts documented.\n\n`;
    }

    // Section 6: Database Requirements
    md += `## 6. Database / Data Model Requirements\n\n`;
    md += `### Existing Tables to Reuse\n\n`;
    if (node.dbExistingTables && node.dbExistingTables.length > 0) {
      node.dbExistingTables.forEach(t => md += `* \`${t}\`\n`);
    } else {
      md += `* Reuse existing tables where applicable.\n`;
    }
    md += `\n### New Tables / Fields Required\n\n`;
    if (node.dbNewTablesSql) {
      md += `\`\`\`sql\n${node.dbNewTablesSql}\n\`\`\`\n`;
    } else {
      md += `No new database schema defined.\n`;
    }
    md += `\n### Relationship Rules\n\n`;
    if (node.dbRelationships && node.dbRelationships.length > 0) {
      node.dbRelationships.forEach(r => md += `* ${r}\n`);
    } else {
      md += `* None specified.\n`;
    }
    md += `\n`;

    // Section 7: Validation Rules
    md += `## 7. Validation Rules\n\n`;
    if (node.validationRules && node.validationRules.length > 0) {
      md += `| Field | Rule | Error Message |\n`;
      md += `| --- | --- | --- |\n`;
      node.validationRules.forEach(v => {
        md += `| ${v.field} | ${v.rule} | ${v.errorMessage} |\n`;
      });
    } else {
      md += `Standard request validation is expected.\n`;
    }
    md += `\n`;

    // Section 8: Security Requirements
    md += `## 8. Security Requirements\n\n`;
    if (node.securityRules && node.securityRules.length > 0) {
      node.securityRules.forEach(s => md += `* ${s}\n`);
    } else {
      md += `* Validate role permissions.\n`;
      md += `* Prevent unauthorized access.\n`;
      md += `* Do not log sensitive data.\n`;
    }
    md += `\n`;

    // Section 9: Logging & Audit Requirements
    md += `## 9. Logging & Audit\n\n`;
    md += `### Log these events:\n\n`;
    if (node.logEvents && node.logEvents.length > 0) {
      node.logEvents.forEach(e => md += `* ${e}\n`);
    } else {
      md += `* Log request access, inputs, duration, and response code.\n`;
    }
    md += `\n### Do not log (Sensitive data):\n\n`;
    if (node.noLogEvents && node.noLogEvents.length > 0) {
      node.noLogEvents.forEach(e => md += `* ${e}\n`);
    } else {
      md += `* Passwords, access tokens, refresh tokens, and credit card details.\n`;
    }
    md += `\n`;

    // Section 10: Integration Points
    md += `## 10. Integration Points\n\n`;
    if (node.integrationPoints && node.integrationPoints.length > 0) {
      md += `| System / Module | Responsibility |\n`;
      md += `| --- | --- |\n`;
      node.integrationPoints.forEach(ip => {
        md += `| ${ip.system} | ${ip.responsibility} |\n`;
      });
    } else {
      md += `No external integration points specified.\n`;
    }
    md += `\n`;

    // Section 11: Frontend Behavior
    md += `## 11. Frontend Behavior\n\n`;
    if (node.uiPage || node.uiComponents || node.uiStateLoading || node.uiStateEmpty || node.uiStateError || node.uiStateSuccess) {
      if (node.uiPage) md += `* **Page:** ${node.uiPage}\n`;
      if (node.uiComponents) md += `* **Components:** ${node.uiComponents}\n`;
      if (node.uiStateLoading) md += `* **Loading State:** ${node.uiStateLoading}\n`;
      if (node.uiStateEmpty) md += `* **Empty State:** ${node.uiStateEmpty}\n`;
      if (node.uiStateError) md += `* **Error State:** ${node.uiStateError}\n`;
      if (node.uiStateSuccess) md += `* **Success State:** ${node.uiStateSuccess}\n`;
    } else {
      md += `No frontend behavior specified.\n`;
    }
    md += `\n`;

    // Section 12: Automated Test Cases
    md += `## 12. Automated Test Cases\n\n`;
    if (node.testCases && node.testCases.length > 0) {
      node.testCases.forEach((tc) => {
        md += `### Test: ${tc.title}\n`;
        md += `- **Type**: ${tc.type}\n`;
        if (tc.precondition) md += `- **Precondition**: ${tc.precondition}\n`;
        if (tc.steps && tc.steps.length > 0) {
          md += `- **Steps**:\n`;
          tc.steps.forEach((step, sIdx) => md += `  ${sIdx + 1}. ${step}\n`);
        }
        md += `- **Expected Result**: ${tc.expectedResult}\n\n`;
      });
    } else {
      md += `No automated tests specified.\n\n`;
    }

    // Section 13: Acceptance / Done Criteria
    md += `## 13. Acceptance / Done Criteria\n\n`;
    if (node.doneCriteria && node.doneCriteria.length > 0) {
      node.doneCriteria.forEach(dc => {
        md += `- [${dc.checked ? 'x' : ' '}] ${dc.content}\n`;
      });
      md += `\n`;
    } else {
      md += `No done criteria specified.\n\n`;
    }

    // Section 14: Implementation Instructions for AI
    md += `## 14. Implementation Instructions for AI\n\n`;
    md += `Before coding:\n\n`;
    md += `1. Inspect the existing project structure.\n`;
    md += `2. Reuse existing architecture and naming conventions.\n`;
    md += `3. Do not create duplicate services, entities, or response wrappers.\n`;
    md += `4. Check existing tests before adding new ones.\n`;
    md += `5. Implement the smallest correct change.\n`;
    md += `6. Run all relevant tests.\n`;
    md += `7. Report changed files, reason, verification, and remaining risks.\n\n`;
    md += `Do not mark this task as complete unless all acceptance criteria and automated tests pass.\n\n`;
    
  } else if (mode === 'qa') {
    md += `# QA Specification: ${node.title}\n\n`;
    md += `**Path:** ${path}\n`;
    if (node.clients && node.clients.length > 0) {
      md += `**Clients:** ${node.clients.join(", ")}\n\n`;
    }
    
    if (allEffectiveRules.length > 0) {
      md += `## Business Rules to Verify\n`;
      allEffectiveRules.forEach(rule => {
        md += `- ${rule}\n`;
      });
      md += `\n`;
    }
    
    if (node.testCases && node.testCases.length > 0) {
      md += `## Test Cases\n`;
      node.testCases.forEach((tc) => {
        md += `### [${tc.type.toUpperCase()}] ${tc.title}\n`;
        if (tc.precondition) md += `- **Precondition**: ${tc.precondition}\n`;
        if (tc.steps && tc.steps.length > 0) {
          md += `- **Steps**:\n`;
          tc.steps.forEach((step, sIdx) => md += `  ${sIdx + 1}. ${step}\n`);
        }
        md += `- **Expected**: ${tc.expectedResult}\n`;
        md += `- **Current Status**: \`${tc.status}\`\n\n`;
      });
    }
    
    if (node.doneCriteria && node.doneCriteria.length > 0) {
      md += `## Verification Criteria\n`;
      node.doneCriteria.forEach(dc => {
        md += `- [${dc.checked ? 'x' : ' '}] ${dc.content}\n`;
      });
      md += `\n`;
    }
  }
  
  return md;
}

/**
 * Returns markdown for a node and all of its descendants recursively.
 */
export function formatSubtreeMarkdown(
  rootNodeId: string,
  flatNodes: FeatureNode[],
  mode: 'human' | 'ai' | 'qa'
): string {
  const rootNode = flatNodes.find(n => n.id === rootNodeId);
  if (!rootNode) return "";
  
  let md = formatSingleNodeMarkdown(rootNode, flatNodes, mode);
  
  // Recursively find and format children ordered by 'order'
  const children = flatNodes
    .filter(n => n.parentId === rootNodeId)
    .sort((a, b) => a.order - b.order);
    
  children.forEach(child => {
    md += `\n---\n\n`;
    md += formatSubtreeMarkdown(child.id, flatNodes, mode);
  });
  
  return md;
}

/**
 * Returns markdown for all nodes in the project.
 */
export function formatProjectMarkdown(
  flatNodes: FeatureNode[],
  mode: 'human' | 'ai' | 'qa'
): string {
  // Find all root nodes (parentId is null) sorted by order
  const roots = flatNodes
    .filter(n => n.parentId === null)
    .sort((a, b) => a.order - b.order);
    
  let md = `# PROJECT FEATURE SPECIFICATIONS\n\n`;
  
  roots.forEach((root, idx) => {
    if (idx > 0) md += `\n---\n\n`;
    md += formatSubtreeMarkdown(root.id, flatNodes, mode);
  });
  
  return md;
}

/**
 * Interface for the full exported JSON format
 */
export interface ProjectExportData {
  version: string;
  projectName: string;
  projectDescription: string;
  clients: { id: string; name: string }[];
  nodes: FeatureNode[];
}

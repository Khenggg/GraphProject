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
    md += `| **Clients/Roles** | ${node.clients.join(", ") || "*None assigned*"} |\n`;
    md += `| **Tags** | ${node.tags.map(t => `\`${t}\``).join(", ") || "*None*"} |\n\n`;
    
    md += `## Summary\n${node.summary || "*No summary provided.*"}\n\n`;
    
    md += `## Business Rules\n`;
    if (inheritedGroups.length > 0) {
      md += `### Inherited Rules\n`;
      inheritedGroups.forEach(g => {
        md += `#### From ${g.sourceTitle}\n`;
        g.rules.forEach(r => md += `- ${r}\n`);
      });
      md += `\n`;
    }
    
    md += `### Local Rules\n`;
    if (localRules.length > 0) {
      localRules.forEach(r => md += `- ${r}\n`);
    } else {
      md += `*No local rules.*\n`;
    }
    md += `\n`;
    
    md += `## Contracts\n`;
    md += `### API Contracts\n`;
    if (node.apiContracts && node.apiContracts.length > 0) {
      node.apiContracts.forEach(c => {
        md += `#### ${c.name}\n\`\`\`\n${c.content}\n\`\`\`\n\n`;
      });
    } else {
      md += `*No API contracts specified.*\n\n`;
    }
    
    md += `### UI Contracts\n`;
    if (node.uiContracts && node.uiContracts.length > 0) {
      node.uiContracts.forEach(c => {
        md += `#### ${c.name}\n\`\`\`\n${c.content}\n\`\`\`\n\n`;
      });
    } else {
      md += `*No UI contracts specified.*\n\n`;
    }
    
    md += `### Data Contracts\n`;
    if (node.dataContracts && node.dataContracts.length > 0) {
      node.dataContracts.forEach(c => {
        md += `#### ${c.name}\n\`\`\`\n${c.content}\n\`\`\`\n\n`;
      });
    } else {
      md += `*No Data contracts specified.*\n\n`;
    }
    
    md += `## Test Cases & Verification\n`;
    if (node.testCases && node.testCases.length > 0) {
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
    } else {
      md += `*No test cases defined.*\n\n`;
    }
    
    md += `## Done Criteria\n`;
    if (node.doneCriteria && node.doneCriteria.length > 0) {
      node.doneCriteria.forEach(dc => {
        md += `- [${dc.checked ? 'x' : ' '}] ${dc.content}\n`;
      });
    } else {
      md += `*No done criteria specified.*\n`;
    }
    md += `\n`;
    
    md += `## Dependencies & Risks\n`;
    md += `### Dependencies\n`;
    if (node.dependencies && node.dependencies.length > 0) {
      node.dependencies.forEach(d => md += `- ${d}\n`);
    } else {
      md += `*None*\n`;
    }
    md += `\n`;
    
    md += `### Risks\n`;
    if (node.risks && node.risks.length > 0) {
      node.risks.forEach(r => md += `- ${r}\n`);
    } else {
      md += `*None*\n`;
    }
    md += `\n`;
    
    if (node.notes) {
      md += `## Notes\n${node.notes}\n\n`;
    }
    
  } else if (mode === 'ai') {
    md += `# AI Implementation Guide: ${node.title}\n\n`;
    md += `**Target Path:** ${path}\n`;
    md += `**Node Type:** ${node.type}\n`;
    md += `**Status:** ${node.status}\n`;
    md += `**Priority:** ${node.priority}\n`;
    md += `**Authorized Clients/Roles:** ${node.clients.join(", ") || "None specified"}\n`;
    if (node.metadata) {
      if (node.metadata.ownerService) {
        md += `**Owner Service:** ${node.metadata.ownerService}\n`;
      }
      if (node.metadata.endpoints && node.metadata.endpoints.length > 0) {
        md += `**Endpoints:**\n`;
        node.metadata.endpoints.forEach(ep => {
          md += `- ${ep}\n`;
        });
      }
    }
    md += `\n`;
    md += `## Summary / Objective\n`;
    md += `${node.summary || "No summary provided."}\n\n`;
    
    md += `## Effective Rules (Inherited & Local)\n`;
    if (allEffectiveRules.length > 0) {
      allEffectiveRules.forEach(rule => {
        md += `- ${rule}\n`;
      });
    } else {
      md += `*No business rules govern this feature.*\n`;
    }
    md += `\n`;
    
    md += `## Contracts & Schemas\n`;
    md += `### API Contracts\n`;
    if (node.apiContracts && node.apiContracts.length > 0) {
      node.apiContracts.forEach(c => {
        md += `#### ${c.name}\n\`\`\`\n${c.content}\n\`\`\`\n`;
      });
    } else {
      md += `*No API contract specified.*\n`;
    }
    md += `\n`;
    
    md += `### UI Contracts / Requirements\n`;
    if (node.uiContracts && node.uiContracts.length > 0) {
      node.uiContracts.forEach(c => {
        md += `#### ${c.name}\n\`\`\`\n${c.content}\n\`\`\`\n`;
      });
    } else {
      md += `*No UI layout or contract specified.*\n`;
    }
    md += `\n`;
    
    md += `### Data Schemas & DB Models\n`;
    if (node.dataContracts && node.dataContracts.length > 0) {
      node.dataContracts.forEach(c => {
        md += `#### ${c.name}\n\`\`\`\n${c.content}\n\`\`\`\n`;
      });
    } else {
      md += `*No Data model or schema specified.*\n`;
    }
    md += `\n`;
    
    md += `## Automated Test Cases to Implement\n`;
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
      md += `*No automated tests defined.*\n\n`;
    }
    
    md += `## Acceptance / Done Criteria\n`;
    if (node.doneCriteria && node.doneCriteria.length > 0) {
      node.doneCriteria.forEach(dc => {
        md += `- [${dc.checked ? 'x' : ' '}] ${dc.content}\n`;
      });
    } else {
      md += `*No formal done criteria.*\n`;
    }
    md += `\n`;
    
    if ((node.dependencies && node.dependencies.length > 0) || (node.risks && node.risks.length > 0)) {
      md += `## Technical Context\n`;
      if (node.dependencies && node.dependencies.length > 0) {
        md += `**Dependencies:**\n`;
        node.dependencies.forEach(d => md += `- ${d}\n`);
        md += `\n`;
      }
      if (node.risks && node.risks.length > 0) {
        md += `**Risks/Mitigations:**\n`;
        node.risks.forEach(r => md += `- ${r}\n`);
        md += `\n`;
      }
    }
    
    md += `## AI Instruction\n`;
    md += `> [!IMPORTANT]\n`;
    md += `> Implement this feature completely. Ensure all effective business rules are fully enforced.\n`;
    md += `> Ensure the API and UI matches the contracts, and all automated test cases pass.\n`;
    md += `> Do not mark this task as done unless all done criteria listed above are satisfied.\n\n`;
    
  } else if (mode === 'qa') {
    md += `# QA Specification: ${node.title}\n\n`;
    md += `**Path:** ${path}\n`;
    md += `**Clients:** ${node.clients.join(", ") || "None"}\n\n`;
    
    md += `## Business Rules to Verify\n`;
    if (allEffectiveRules.length > 0) {
      allEffectiveRules.forEach(rule => {
        md += `- ${rule}\n`;
      });
    } else {
      md += `*No business rules defined.*\n`;
    }
    md += `\n`;
    
    md += `## Test Cases\n`;
    if (node.testCases && node.testCases.length > 0) {
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
    } else {
      md += `*No test cases defined.*\n\n`;
    }
    
    md += `## Verification Criteria\n`;
    if (node.doneCriteria && node.doneCriteria.length > 0) {
      node.doneCriteria.forEach(dc => {
        md += `- [${dc.checked ? 'x' : ' '}] ${dc.content}\n`;
      });
    } else {
      md += `*No done criteria.*\n`;
    }
    md += `\n`;
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

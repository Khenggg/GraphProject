import type { FeatureNode } from "./featureNode.types";

/**
 * Returns the ancestor chain from the root node down to the target node (inclusive).
 * e.g. [Root, Category, Feature, SubFeature, LeafFeature]
 */
export function getAncestorChain(nodeId: string, flatNodes: FeatureNode[]): FeatureNode[] {
  const chain: FeatureNode[] = [];
  let current = flatNodes.find(n => n.id === nodeId);
  
  while (current) {
    chain.unshift(current);
    if (!current.parentId) break;
    const parentId = current.parentId;
    current = flatNodes.find(n => n.id === parentId);
  }
  
  return chain;
}

/**
 * Combines rules from ancestors to child, returning rules grouped by source node.
 * Ensures no mutation of parent nodes.
 */
export function getEffectiveRules(
  nodeId: string,
  flatNodes: FeatureNode[]
): { sourceNodeId: string; sourceTitle: string; rules: string[] }[] {
  const chain = getAncestorChain(nodeId, flatNodes);
  
  return chain
    .filter(node => node.businessRules && node.businessRules.length > 0)
    .map(node => ({
      sourceNodeId: node.id,
      sourceTitle: node.title,
      rules: [...node.businessRules] // Create a copy to prevent mutation
    }));
}

export interface ReadinessResult {
  isReady: boolean;
  reasons: string[];
  status: "not_ready" | "partially_ready" | "ready";
}

/**
 * Validates whether a leaf feature is AI-ready.
 */
export function isNodeAiReady(node: FeatureNode, flatNodes: FeatureNode[]): ReadinessResult {
  if (node.type !== "leaf_feature") {
    // Categories/projects don't need tests/criteria to be ready.
    // They are ready by default if they have a title and summary.
    const reasons: string[] = [];
    if (!node.title.trim()) reasons.push("Title is empty");
    if (!node.summary.trim()) reasons.push("Summary is empty");
    return {
      isReady: reasons.length === 0,
      reasons,
      status: reasons.length === 0 ? "ready" : "not_ready"
    };
  }

  const reasons: string[] = [];
  
  if (!node.title.trim()) {
    reasons.push("Title is empty");
  }
  if (!node.summary.trim()) {
    reasons.push("Summary is empty");
  }
  if (!node.clients || node.clients.length === 0) {
    reasons.push("No clients assigned");
  }
  if (!node.testCases || node.testCases.length === 0) {
    reasons.push("No test cases defined");
  }
  if (!node.doneCriteria || node.doneCriteria.length === 0) {
    reasons.push("No done criteria defined");
  }

  const effectiveRules = getEffectiveRules(node.id, flatNodes);
  const totalRulesCount = effectiveRules.reduce((acc, curr) => acc + curr.rules.length, 0);
  if (totalRulesCount === 0) {
    reasons.push("No business rules (local or inherited)");
  }

  const isReady = reasons.length === 0;
  let status: "not_ready" | "partially_ready" | "ready" = "ready";
  if (reasons.length > 0) {
    // If it has at least some content (e.g. title and summary), it is partially ready
    if (node.title.trim() && node.summary.trim()) {
      status = "partially_ready";
    } else {
      status = "not_ready";
    }
  }

  return { isReady, reasons, status };
}

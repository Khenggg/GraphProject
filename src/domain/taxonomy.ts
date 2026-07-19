import {
  DEFAULT_CLIENT_ROLES,
  type FeatureNode,
  type FeatureNodeType,
} from "./featureNode.types";

export type ValidationSeverity = "critical" | "high" | "medium" | "low";

export interface TreeValidationIssue {
  code: string;
  severity: ValidationSeverity;
  nodeId?: string;
  path?: string;
  message: string;
  blocksSave: boolean;
}

export const CHILD_TYPE_RULES: Record<FeatureNodeType, readonly FeatureNodeType[]> = {
  project: ["category", "rule_group", "client_group"],
  category: ["category", "feature", "leaf_feature", "rule_group"],
  feature: ["sub_feature", "leaf_feature", "rule_group"],
  sub_feature: ["sub_feature", "leaf_feature", "rule_group"],
  leaf_feature: [],
  rule_group: [],
  client_group: [],
};

const GENERIC_TITLES = new Set([
  "common functions",
  "handle data",
  "system management",
  "dashboard page",
  "management",
  "feature",
  "new feature",
]);

export function canContainChild(parentType: FeatureNodeType, childType: FeatureNodeType): boolean {
  return CHILD_TYPE_RULES[parentType].includes(childType);
}

export function getSuggestedChildType(parentType: FeatureNodeType): FeatureNodeType | null {
  if (parentType === "project") return "category";
  if (parentType === "category") return "feature";
  if (parentType === "feature" || parentType === "sub_feature") return "leaf_feature";
  return null;
}

export function getProjectRoleRegistry(nodes: FeatureNode[]): string[] {
  const projectRoot = nodes.find(node => node.type === "project" && node.parentId === null);
  const configured = projectRoot?.metadata?.roles
    ?.map(role => role.trim())
    .filter(Boolean);
  return configured && configured.length > 0 ? [...new Set(configured)] : [...DEFAULT_CLIENT_ROLES];
}

export function normalizeRole(role: string, registry: string[]): string | null {
  const exact = registry.find(candidate => candidate === role);
  if (exact) return exact;
  const matches = registry.filter(candidate => candidate.toLowerCase() === role.toLowerCase());
  return matches.length === 1 ? matches[0] : null;
}

export function validateFeatureTree(nodes: FeatureNode[]): TreeValidationIssue[] {
  const issues: TreeValidationIssue[] = [];
  const byId = new Map<string, FeatureNode>();
  const idCounts = new Map<string, number>();
  const childrenByParent = new Map<string | null, FeatureNode[]>();
  const roles = getProjectRoleRegistry(nodes);

  for (const node of nodes) {
    idCounts.set(node.id, (idCounts.get(node.id) || 0) + 1);
    if (!byId.has(node.id)) byId.set(node.id, node);
    const siblings = childrenByParent.get(node.parentId) || [];
    siblings.push(node);
    childrenByParent.set(node.parentId, siblings);
  }

  const roots = nodes.filter(node => node.parentId === null);
  const projectRoots = roots.filter(node => node.type === "project");
  if (roots.length !== 1 || projectRoots.length !== 1) {
    issues.push({
      code: "TREE_SINGLE_PROJECT_ROOT",
      severity: "critical",
      message: "Tree must contain exactly one root node of type project.",
      blocksSave: true,
    });
  }

  for (const [id, count] of idCounts) {
    if (count > 1) {
      issues.push({ code: "TREE_DUPLICATE_NODE_ID", severity: "critical", nodeId: id, message: `Duplicate node ID: ${id}`, blocksSave: true });
    }
  }

  const pathFor = (node: FeatureNode): string => {
    const titles: string[] = [];
    const visited = new Set<string>();
    let current: FeatureNode | undefined = node;
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      titles.unshift(current.title);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return titles.join(" > ");
  };

  for (const node of nodes) {
    const path = pathFor(node);
    if (!node.title.trim()) {
      issues.push({ code: "NAME_EMPTY", severity: "critical", nodeId: node.id, path, message: "Node title cannot be empty.", blocksSave: true });
    }
    if (node.parentId && !byId.has(node.parentId)) {
      issues.push({ code: "TREE_ORPHAN", severity: "critical", nodeId: node.id, path, message: `Parent ${node.parentId} does not exist.`, blocksSave: true });
    }
    if (node.parentId) {
      const parent = byId.get(node.parentId);
      if (parent && !canContainChild(parent.type, node.type)) {
        issues.push({ code: "TREE_INVALID_PARENT_CHILD", severity: "high", nodeId: node.id, path, message: `${parent.type} cannot contain ${node.type}.`, blocksSave: true });
      }
    }
    if (node.type === "leaf_feature" && (childrenByParent.get(node.id)?.length || 0) > 0) {
      issues.push({ code: "TREE_LEAF_HAS_CHILDREN", severity: "critical", nodeId: node.id, path, message: "Leaf features cannot contain child nodes.", blocksSave: true });
    }

    const title = node.title.trim();
    const lowerTitle = title.toLowerCase();
    if (GENERIC_TITLES.has(lowerTitle)) {
      issues.push({ code: "NAME_TOO_GENERIC", severity: "medium", nodeId: node.id, path, message: `Title is too generic: ${title}`, blocksSave: false });
    }
    if (/^(GET|POST|PUT|PATCH|DELETE)\s+\/api\//i.test(title) || /^\//.test(title)) {
      issues.push({ code: "NAME_TECHNICAL_ROUTE", severity: "medium", nodeId: node.id, path, message: "Use a business outcome instead of a route as the node title.", blocksSave: false });
    }
    if (/\b(CRUD|Page|Component|Table)\b/i.test(title)) {
      issues.push({ code: "NAME_IMPLEMENTATION_TERM", severity: "medium", nodeId: node.id, path, message: "Title looks implementation-oriented; prefer a business capability or outcome.", blocksSave: false });
    }

    for (const role of [...(node.clients || []), ...(node.permissions || []).map(item => item.role)]) {
      if (!normalizeRole(role, roles) && role.toLowerCase() !== "anonymous" && role.toLowerCase() !== "public") {
        issues.push({ code: "ROLE_NOT_REGISTERED", severity: "high", nodeId: node.id, path, message: `Role is not registered: ${role}`, blocksSave: true });
      }
    }
  }

  for (const [parentId, siblings] of childrenByParent) {
    const orders = new Set<number>();
    const titles = new Map<string, FeatureNode[]>();
    for (const node of siblings) {
      if (orders.has(node.order)) {
        issues.push({ code: "TREE_DUPLICATE_ORDER", severity: "medium", nodeId: node.id, path: pathFor(node), message: `Duplicate sibling order under ${parentId || "root"}.`, blocksSave: false });
      }
      orders.add(node.order);
      const key = node.title.trim().toLowerCase();
      titles.set(key, [...(titles.get(key) || []), node]);
    }
    for (const duplicate of titles.values()) {
      if (duplicate.length > 1) {
        issues.push({ code: "NAME_DUPLICATE_SIBLING", severity: "high", nodeId: duplicate[0].id, path: pathFor(duplicate[0]), message: `Duplicate sibling title: ${duplicate[0].title}`, blocksSave: true });
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string) => {
    if (visiting.has(id)) {
      issues.push({ code: "TREE_CYCLE", severity: "critical", nodeId: id, message: `Cycle detected at ${id}.`, blocksSave: true });
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const child of childrenByParent.get(id) || []) visit(child.id);
    visiting.delete(id);
    visited.add(id);
  };
  for (const root of roots) visit(root.id);
  for (const node of nodes) visit(node.id);

  const nestedIds = new Map<string, { nodeId: string; kind: string }>();
  for (const node of nodes) {
    for (const kind of ["testCases", "doneCriteria", "apiContracts", "uiContracts", "dataContracts"] as const) {
      for (const item of node[kind] || []) {
        const existing = nestedIds.get(`${kind}:${item.id}`);
        if (existing) {
          issues.push({ code: "NESTED_DUPLICATE_ID", severity: "high", nodeId: node.id, path: pathFor(node), message: `${kind} ID ${item.id} is also used by ${existing.nodeId}.`, blocksSave: true });
        } else {
          nestedIds.set(`${kind}:${item.id}`, { nodeId: node.id, kind });
        }
      }
    }
  }

  return issues;
}

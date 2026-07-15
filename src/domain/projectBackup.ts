import type { FeatureNode, FeatureNodeType, FeatureStatus, Priority } from "./featureNode.types";
import { DEFAULT_CLIENT_ROLES } from "./featureNode.types";
import { normalizeRole, validateFeatureTree, type TreeValidationIssue } from "./taxonomy";

export const CURRENT_PROJECT_VERSION = "2.0.0";

export interface ProjectBackupData {
  version: string;
  projectName: string;
  projectDescription: string;
  clients: { id: string; name: string }[];
  nodes: FeatureNode[];
}

export interface ParsedProjectBackup {
  data: ProjectBackupData;
  sourceVersion: string;
  migrated: boolean;
  issues: TreeValidationIssue[];
}

const NODE_TYPES: FeatureNodeType[] = ["project", "category", "feature", "sub_feature", "leaf_feature", "rule_group", "client_group"];
const STATUSES: FeatureStatus[] = ["draft", "ready", "in_progress", "implemented", "tested", "done", "blocked"];
const PRIORITIES: Priority[] = ["low", "medium", "high", "must_have"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeNode(value: unknown, index: number, roles: string[]): FeatureNode {
  if (!isRecord(value)) throw new Error(`nodes[${index}] must be an object.`);
  const now = new Date().toISOString();
  const type = NODE_TYPES.includes(value.type as FeatureNodeType) ? value.type as FeatureNodeType : "leaf_feature";
  const status = STATUSES.includes(value.status as FeatureStatus) ? value.status as FeatureStatus : "draft";
  const priority = PRIORITIES.includes(value.priority as Priority) ? value.priority as Priority : "medium";
  const clients = strings(value.clients).map(role => normalizeRole(role, roles) || role);

  return {
    ...value,
    id: typeof value.id === "string" ? value.id : "",
    parentId: typeof value.parentId === "string" ? value.parentId : null,
    title: typeof value.title === "string" ? value.title : "",
    type,
    clients,
    status,
    priority,
    tags: strings(value.tags),
    summary: typeof value.summary === "string" ? value.summary : "",
    businessRules: strings(value.businessRules),
    apiContracts: Array.isArray(value.apiContracts) ? value.apiContracts as FeatureNode["apiContracts"] : [],
    uiContracts: Array.isArray(value.uiContracts) ? value.uiContracts as FeatureNode["uiContracts"] : [],
    dataContracts: Array.isArray(value.dataContracts) ? value.dataContracts as FeatureNode["dataContracts"] : [],
    testCases: Array.isArray(value.testCases) ? value.testCases as FeatureNode["testCases"] : [],
    doneCriteria: Array.isArray(value.doneCriteria) ? value.doneCriteria as FeatureNode["doneCriteria"] : [],
    dependencies: strings(value.dependencies),
    risks: strings(value.risks),
    notes: typeof value.notes === "string" ? value.notes : "",
    permissions: Array.isArray(value.permissions)
      ? (value.permissions as { role: string; permission: string }[]).map(item => ({
          ...item,
          role: normalizeRole(item.role, roles) || item.role,
        }))
      : undefined,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
    order: typeof value.order === "number" ? value.order : index,
  } as FeatureNode;
}

export function parseProjectBackup(input: unknown): ParsedProjectBackup {
  if (!isRecord(input)) throw new Error("Backup must contain a JSON object.");
  if (typeof input.projectName !== "string" || !input.projectName.trim()) throw new Error("projectName is required.");
  if (!Array.isArray(input.nodes)) throw new Error("nodes must be an array.");

  const sourceVersion = typeof input.version === "string" ? input.version : "1.0.0";
  const major = Number.parseInt(sourceVersion.split(".")[0], 10);
  if (!Number.isFinite(major) || major < 1 || major > 2) {
    throw new Error(`Unsupported backup version ${sourceVersion}. Supported major versions: 1 and 2.`);
  }

  const clients = Array.isArray(input.clients)
    ? input.clients
        .filter(isRecord)
        .map(client => ({
          id: typeof client.id === "string" ? client.id : String(client.name || ""),
          name: typeof client.name === "string" ? client.name.trim() : "",
        }))
        .filter(client => client.name)
    : DEFAULT_CLIENT_ROLES.map(name => ({ id: name, name }));
  const discoveredRoles = input.nodes.flatMap(node => {
    if (!isRecord(node)) return [];
    const permissionRoles = Array.isArray(node.permissions)
      ? node.permissions.filter(isRecord).map(permission => permission.role).filter((role): role is string => typeof role === "string")
      : [];
    return [...strings(node.clients), ...permissionRoles];
  });
  const configuredRoles = clients.length ? clients.map(client => client.name) : [...DEFAULT_CLIENT_ROLES];
  const roles = [...new Set([...configuredRoles, ...discoveredRoles]
    .filter(role => !["anonymous", "public"].includes(role.toLowerCase()))
    .map(role => normalizeRole(role, [...DEFAULT_CLIENT_ROLES]) || role))];
  const nodes = input.nodes.map((node, index) => normalizeNode(node, index, roles));
  const root = nodes.find(node => node.parentId === null && node.type === "project");
  if (root) root.metadata = { ...root.metadata, roles };

  const data: ProjectBackupData = {
    version: CURRENT_PROJECT_VERSION,
    projectName: input.projectName.trim(),
    projectDescription: typeof input.projectDescription === "string" ? input.projectDescription : "",
    clients: roles.map(name => ({ id: name, name })),
    nodes,
  };

  return {
    data,
    sourceVersion,
    migrated: sourceVersion !== CURRENT_PROJECT_VERSION,
    issues: validateFeatureTree(nodes),
  };
}

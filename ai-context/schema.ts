export const DEFAULT_CLIENT_ROLES = [
  "Admin",
  "Manager",
  "Staff",
  "Driver",
  "Guest",
  "System"
] as const;

export type BuiltInClientType = typeof DEFAULT_CLIENT_ROLES[number];
export type ClientType = string;

export type FeatureNodeType =
  | "project"
  | "category"
  | "feature"
  | "sub_feature"
  | "leaf_feature"
  | "rule_group"
  | "client_group";

export type FeatureStatus =
  | "draft"
  | "ready"
  | "in_progress"
  | "implemented"
  | "tested"
  | "done"
  | "blocked";

export type Priority = "low" | "medium" | "high" | "must_have";

export interface ContractField {
  id: string;
  name: string;
  content: string;
}

export interface TestCase {
  id: string;
  title: string;
  type: "unit" | "integration" | "api" | "e2e" | "manual";
  precondition?: string;
  steps?: string[];
  expectedResult: string;
  status: "not_started" | "passed" | "failed" | "blocked";
}

export interface DoneCriterion {
  id: string;
  content: string;
  checked: boolean;
}

export interface FeatureNode {
  id: string;
  parentId: string | null;
  title: string;
  type: FeatureNodeType;
  clients: ClientType[];
  status: FeatureStatus;
  priority: Priority;
  tags: string[];

  summary: string;
  businessRules: string[];

  apiContracts: ContractField[];
  uiContracts: ContractField[];
  dataContracts: ContractField[];

  testCases: TestCase[];
  doneCriteria: DoneCriterion[];

  dependencies: string[];
  risks: string[];
  notes: string;

  metadata?: {
    ownerService?: ".NET Core API" | "Spring Boot Support API" | "Shared Database" | "Frontend" | "System" | string;
    consumerServices?: string[];
    sourceFiles?: string[];
    endpoints?: string[];
    roles?: string[];
    businessArea?: string;
  };

  objective?: string;
  inScope?: string[];
  outOfScope?: string[];
  permissions?: { role: string; permission: string }[];
  dbExistingTables?: string[];
  dbNewTablesSql?: string;
  dbRelationships?: string[];
  validationRules?: { field: string; rule: string; errorMessage: string }[];
  securityRules?: string[];
  logEvents?: string[];
  noLogEvents?: string[];
  integrationPoints?: { system: string; responsibility: string }[];
  uiPage?: string;
  uiComponents?: string;
  uiStateLoading?: string;
  uiStateEmpty?: string;
  uiStateError?: string;
  uiStateSuccess?: string;

  createdAt: string;
  updatedAt: string;
  order: number;
  // children is useful for tree rendering libraries or structure traversal
  children?: FeatureNode[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

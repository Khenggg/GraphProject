import type { FeatureNode, ContractField, TestCase, DoneCriterion, ClientType } from "./featureNode.types";

export type SeedNodeInput = {
  id: string;
  title: string;
  type: FeatureNode["type"];
  clients?: string[];
  status?: FeatureNode["status"];
  priority?: FeatureNode["priority"];
  tags?: string[];
  summary?: string;
  businessRules?: string[];
  endpoints?: string[];
  ownerService?: ".NET Core API" | "Spring Boot Support API" | "Shared Database" | "Frontend" | "System";
  sourceFiles?: string[];
  apiContracts?: ContractField[];
  uiContracts?: ContractField[];
  dataContracts?: ContractField[];
  testCases?: TestCase[];
  doneCriteria?: DoneCriterion[];
  dependencies?: string[];
  risks?: string[];
  notes?: string;
  children?: SeedNodeInput[];
};

export function createSeedNode(input: SeedNodeInput, parentId: string | null, order: number): FeatureNode {
  const now = new Date().toISOString();
  
  const node: FeatureNode = {
    id: input.id,
    parentId,
    title: input.title,
    type: input.type,
    clients: (input.clients || []) as ClientType[],
    status: input.status || "draft",
    priority: input.priority || "medium",
    tags: input.tags || [],
    summary: input.summary || "",
    businessRules: input.businessRules || [],
    apiContracts: input.apiContracts || [],
    uiContracts: input.uiContracts || [],
    dataContracts: input.dataContracts || [],
    testCases: input.testCases || [],
    doneCriteria: input.doneCriteria || [],
    dependencies: input.dependencies || [],
    risks: input.risks || [],
    notes: input.notes || "",
    metadata: {
      ownerService: input.ownerService,
      sourceFiles: input.sourceFiles,
      endpoints: input.endpoints,
      roles: input.clients,
    },
    createdAt: now,
    updatedAt: now,
    order,
    children: []
  };

  if (input.children) {
    node.children = input.children.map((child, idx) => createSeedNode(child, input.id, idx));
  }

  return node;
}

// Helper to flatten a tree of FeatureNodes
export function flattenNodeTree(node: FeatureNode): FeatureNode[] {
  const result: FeatureNode[] = [];
  const { children, ...rest } = node;
  const flatNode = { ...rest } as FeatureNode;
  result.push(flatNode);
  
  if (children) {
    children.forEach(child => {
      result.push(...flattenNodeTree(child));
    });
  }
  
  return result;
}

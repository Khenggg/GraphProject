import { describe, it, expect, vi, beforeEach } from "vitest";
import { useFeatureTreeStore } from "../store/featureTreeStore";
import type { FeatureNode } from "../domain/featureNode.types";

// Mock Dexie DB
vi.mock("../db/dexieDb", () => {
  return {
    db: {
      transaction: vi.fn((_mode, _tables, callback) => callback()),
      features: {
        where: vi.fn(() => ({
          equals: vi.fn(() => ({
            toArray: vi.fn(() => Promise.resolve([])),
            primaryKeys: vi.fn(() => Promise.resolve([]))
          }))
        })),
        bulkDelete: vi.fn(() => Promise.resolve()),
        bulkAdd: vi.fn(() => Promise.resolve()),
        add: vi.fn(() => Promise.resolve())
      },
      projects: {
        toArray: vi.fn(() => Promise.resolve([])),
        add: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve())
      }
    }
  };
});

describe("Tree Actions in Zustand Store", () => {
  const initialNodes: FeatureNode[] = [
    {
      id: "root",
      parentId: null,
      title: "Project Root",
      type: "project",
      clients: ["Admin"],
      status: "draft",
      priority: "medium",
      tags: [],
      summary: "Description",
      businessRules: [],
      apiContracts: [],
      uiContracts: [],
      dataContracts: [],
      testCases: [],
      doneCriteria: [],
      dependencies: [],
      risks: [],
      notes: "",
      createdAt: "",
      updatedAt: "",
      order: 0
    },
    {
      id: "cat1",
      parentId: "root",
      title: "Category 1",
      type: "category",
      clients: ["Admin"],
      status: "draft",
      priority: "medium",
      tags: [],
      summary: "",
      businessRules: [],
      apiContracts: [],
      uiContracts: [],
      dataContracts: [],
      testCases: [],
      doneCriteria: [],
      dependencies: [],
      risks: [],
      notes: "",
      createdAt: "",
      updatedAt: "",
      order: 0
    },
    {
      id: "feat1",
      parentId: "cat1",
      title: "Feature 1",
      type: "feature",
      clients: ["Admin"],
      status: "draft",
      priority: "medium",
      tags: [],
      summary: "",
      businessRules: [],
      apiContracts: [],
      uiContracts: [],
      dataContracts: [],
      testCases: [],
      doneCriteria: [],
      dependencies: [],
      risks: [],
      notes: "",
      createdAt: "",
      updatedAt: "",
      order: 0
    }
  ];

  beforeEach(() => {
    // Reset store state
    useFeatureTreeStore.setState({
      selectedProjectId: "proj-1",
      nodes: JSON.parse(JSON.stringify(initialNodes)),
      tree: [],
      selectedNodeId: "root",
      expandedNodeIds: []
    });
  });

  it("addChildNode creates child under correct parent", () => {
    const store = useFeatureTreeStore.getState();
    store.addChildNode("cat1");

    const state = useFeatureTreeStore.getState();
    expect(state.nodes).toHaveLength(4);
    
    const newNode = state.nodes.find(n => n.parentId === "cat1" && n.title === "New Feature");
    expect(newNode).toBeDefined();
    expect(state.selectedNodeId).toBe(newNode!.id);
    expect(state.expandedNodeIds).toContain("cat1");
  });

  it("addSiblingNode creates node beside selected node", () => {
    const store = useFeatureTreeStore.getState();
    store.addSiblingNode("cat1");

    const state = useFeatureTreeStore.getState();
    expect(state.nodes).toHaveLength(4);

    const siblingNode = state.nodes.find(n => n.parentId === "root" && n.title === "New Sibling Feature");
    expect(siblingNode).toBeDefined();
    expect(state.selectedNodeId).toBe(siblingNode!.id);
  });

  it("deleteNode removes descendants recursively", () => {
    const store = useFeatureTreeStore.getState();
    // Delete 'cat1' which has 'feat1' as child
    store.deleteNode("cat1");

    const state = useFeatureTreeStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].id).toBe("root");
  });

  it("duplicateNode duplicates subtree with unique IDs", () => {
    const store = useFeatureTreeStore.getState();
    // Add rule and test to feat1 so we can verify copies
    store.updateNode("feat1", {
      businessRules: ["Rule 1"],
      testCases: [{ id: "t1", title: "Test 1", type: "unit", expectedResult: "ok", status: "not_started" }]
    });

    // Duplicate cat1 (which includes feat1)
    store.duplicateNode("cat1");

    const state = useFeatureTreeStore.getState();
    // Original initialNodes had 3. We duplicated cat1 (which contains feat1), so 2 new nodes. Total = 5 nodes.
    expect(state.nodes).toHaveLength(5);

    // Find duplicated category
    const dupCat = state.nodes.find(n => n.parentId === "root" && n.title === "Category 1 (Copy)");
    expect(dupCat).toBeDefined();

    // Find duplicated child of that category
    const dupFeat = state.nodes.find(n => n.parentId === dupCat!.id);
    expect(dupFeat).toBeDefined();
    expect(dupFeat!.title).toBe("Feature 1"); // Child titles shouldn't append (Copy)
    expect(dupFeat!.businessRules).toContain("Rule 1");
    expect(dupFeat!.testCases[0].id).not.toBe("t1"); // Must have new unique ID
  });

  it("moveNode changes parent and recalculates order", () => {
    const store = useFeatureTreeStore.getState();
    // Move feat1 from cat1 to root
    store.moveNode("feat1", "root", 1);

    const state = useFeatureTreeStore.getState();
    const feat = state.nodes.find(n => n.id === "feat1")!;
    expect(feat.parentId).toBe("root");
    
    // Check ordering among root children (cat1, feat1)
    const rootChildren = state.nodes.filter(n => n.parentId === "root").sort((a, b) => a.order - b.order);
    expect(rootChildren[0].id).toBe("cat1");
    expect(rootChildren[1].id).toBe("feat1");
  });
});

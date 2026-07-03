import { describe, it, expect, vi, beforeEach } from "vitest";
import { useFeatureTreeStore } from "../store/featureTreeStore";
import { db } from "../db/dexieDb";

vi.mock("../db/dexieDb", () => {
  const mockDb = {
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
      update: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve())
    }
  };
  return { db: mockDb };
});

describe("FeatureTreeStore Initializer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFeatureTreeStore.setState({
      selectedProjectId: null,
      nodes: [],
      tree: [],
      selectedNodeId: null,
      expandedNodeIds: []
    });
  });

  it("initializeParkingBuildingProject loads tree when empty", async () => {
    const store = useFeatureTreeStore.getState();
    expect(store.canInitializeProject()).toBe(true);

    await store.initializeParkingBuildingProject();

    const updatedStore = useFeatureTreeStore.getState();
    expect(updatedStore.nodes.length).toBeGreaterThan(50);
    expect(updatedStore.selectedNodeId).toBe("root-parking-system");
    expect(updatedStore.expandedNodeIds).toContain("root-parking-system");
  });

  it("replaceTreeWithParkingBuildingProject replaces existing tree", async () => {
    // Put some dummy data first
    useFeatureTreeStore.setState({
      selectedProjectId: "existing-proj",
      nodes: [
        {
          id: "dummy-node",
          parentId: null,
          title: "Dummy Root",
          type: "project",
          clients: [],
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
      ]
    });

    const store = useFeatureTreeStore.getState();
    expect(store.canInitializeProject()).toBe(false); // Has existing nodes

    await store.replaceTreeWithParkingBuildingProject();

    const updatedStore = useFeatureTreeStore.getState();
    expect(updatedStore.nodes.length).toBeGreaterThan(50);
    // Dummy node should be replaced
    expect(updatedStore.nodes.find(n => n.id === "dummy-node")).toBeUndefined();
    expect(updatedStore.selectedNodeId).toBe("root-parking-system");
  });

  it("initialized tree persists to storage", async () => {
    const store = useFeatureTreeStore.getState();
    await store.replaceTreeWithParkingBuildingProject();

    // Verify DB sync calls
    expect(db.features.bulkAdd).toHaveBeenCalled();
  });
});

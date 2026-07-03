import { create } from "zustand";
import type { FeatureNode, Project, ClientType, TestCase } from "../domain/featureNode.types";
import { db } from "../db/dexieDb";
import { createParkingBuildingSeedTree, uuidv4 } from "../seed/parkingBuildingSeed";
import { flattenNodeTree } from "../domain/featureNodeFactory";
import { buildTreeFromFlat } from "../domain/export.utils";

interface FeatureTreeStore {
  // State
  projects: Project[];
  selectedProjectId: string | null;
  nodes: FeatureNode[];         // Flat nodes for current project
  tree: FeatureNode[];          // Nested hierarchy computed from nodes
  selectedNodeId: string | null;
  expandedNodeIds: string[];
  searchQuery: string;
  selectedClientFilter: string;
  selectedStatusFilter: string;
  selectedPriorityFilter: string;
  showOnlyIncomplete: boolean;
  showOnlyLeafs: boolean;
  language: "en" | "vi";

  // Setters/UI actions
  setSearchQuery: (query: string) => void;
  setClientFilter: (client: string) => void;
  setStatusFilter: (status: string) => void;
  setPriorityFilter: (priority: string) => void;
  setShowOnlyIncomplete: (val: boolean) => void;
  setShowOnlyLeafs: (val: boolean) => void;
  setLanguage: (lang: "en" | "vi") => void;
  selectProject: (projectId: string) => Promise<void>;
  selectNode: (nodeId: string | null) => void;
  setExpandedNodeIds: (nodeIds: string[]) => void;
  toggleNodeExpanded: (nodeId: string) => void;

  // DB actions
  loadProjects: () => Promise<void>;
  createNewProject: (name: string, description: string) => Promise<string>;
  deleteProject: (projectId: string) => Promise<void>;
  loadSampleSeed: () => Promise<void>;

  // Tree mutations (auto-save to DB)
  addChildNode: (parentId: string) => void;
  addSiblingNode: (nodeId: string) => void;
  updateNode: (nodeId: string, patch: Partial<FeatureNode>) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  moveNode: (nodeId: string, newParentId: string | null, newIndex: number) => void;

  // Nested actions
  addBusinessRule: (nodeId: string, rule: string) => void;
  removeBusinessRule: (nodeId: string, ruleIndex: number) => void;
  addTestCase: (nodeId: string, testCase: TestCase) => void;
  updateTestCase: (nodeId: string, testCaseId: string, patch: Partial<TestCase>) => void;
  removeTestCase: (nodeId: string, testCaseId: string) => void;
  addDoneCriterion: (nodeId: string, content: string) => void;
  toggleDoneCriterion: (nodeId: string, criterionId: string) => void;

  // Import / Export JSON
  importTree: (projectName: string, desc: string, clientsList: {id: string, name: string}[], nodesList: FeatureNode[]) => Promise<void>;
  exportTree: () => FeatureNode[];

  initializeParkingBuildingProject: () => Promise<void>;
  replaceTreeWithParkingBuildingProject: () => Promise<void>;
  canInitializeProject: () => boolean;
}

// Helpers
function getDescendantIds(nodeId: string, flatNodes: FeatureNode[]): string[] {
  const ids = [nodeId];
  const children = flatNodes.filter(n => n.parentId === nodeId);
  children.forEach(child => {
    ids.push(...getDescendantIds(child.id, flatNodes));
  });
  return ids;
}

function duplicateSubtree(
  nodeId: string,
  newParentId: string | null,
  flatNodes: FeatureNode[],
  newNodes: FeatureNode[] = []
): { rootId: string; nodes: FeatureNode[] } {
  const node = flatNodes.find(n => n.id === nodeId);
  if (!node) return { rootId: "", nodes: [] };

  const newId = uuidv4();
  
  // Clone tests and done criteria to break references
  const testCases = (node.testCases || []).map(tc => ({ ...tc, id: uuidv4() }));
  const doneCriteria = (node.doneCriteria || []).map(dc => ({ ...dc, id: uuidv4() }));
  const apiContracts = (node.apiContracts || []).map(c => ({ ...c, id: uuidv4() }));
  const uiContracts = (node.uiContracts || []).map(c => ({ ...c, id: uuidv4() }));
  const dataContracts = (node.dataContracts || []).map(c => ({ ...c, id: uuidv4() }));

  const clonedNode: FeatureNode = {
    ...node,
    id: newId,
    parentId: newParentId,
    title: `${node.title} (Copy)`,
    clients: [...(node.clients || [])],
    tags: [...(node.tags || [])],
    businessRules: [...(node.businessRules || [])],
    apiContracts,
    uiContracts,
    dataContracts,
    testCases,
    doneCriteria,
    dependencies: [...(node.dependencies || [])],
    risks: [...(node.risks || [])],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  newNodes.push(clonedNode);

  // Process children
  const children = flatNodes.filter(n => n.parentId === nodeId);
  children.forEach(child => {
    // For children, we don't append "(Copy)" to the title, and parent is the cloned parent
    const result = duplicateSubtree(child.id, newId, flatNodes, newNodes);
    // Correct the child title from "(Copy)" back to normal
    const insertedChild = newNodes.find(n => n.id === result.rootId);
    if (insertedChild) {
      insertedChild.title = child.title;
    }
  });

  return { rootId: newId, nodes: newNodes };
}

// Store implementation
export const useFeatureTreeStore = create<FeatureTreeStore>((set, get) => {
  // Sync helper
  const syncNodesToDb = async (projectId: string, nodesList: FeatureNode[]) => {
    await db.transaction("rw", db.features, async () => {
      // Clear current project nodes
      const currentIds = await db.features.where("projectId").equals(projectId).primaryKeys();
      await db.features.bulkDelete(currentIds);
      // Bulk add
      const toInsert = nodesList.map(node => ({ ...node, projectId }));
      await db.features.bulkAdd(toInsert);
    });
  };

  const recomputeTree = (nodes: FeatureNode[]) => {
    return buildTreeFromFlat(nodes, null);
  };

  return {
    // Initial State
    projects: [],
    selectedProjectId: null,
    nodes: [],
    tree: [],
    selectedNodeId: null,
    expandedNodeIds: [],
    searchQuery: "",
    selectedClientFilter: "ALL",
    selectedStatusFilter: "ALL",
    selectedPriorityFilter: "ALL",
    showOnlyIncomplete: false,
    showOnlyLeafs: false,
    language: "en",

    // Setters
    setSearchQuery: (query) => set({ searchQuery: query }),
    setClientFilter: (client) => set({ selectedClientFilter: client }),
    setStatusFilter: (status) => set({ selectedStatusFilter: status }),
    setPriorityFilter: (priority) => set({ selectedPriorityFilter: priority }),
    setShowOnlyIncomplete: (val) => set({ showOnlyIncomplete: val }),
    setShowOnlyLeafs: (val) => set({ showOnlyLeafs: val }),
    setLanguage: (lang) => set({ language: lang }),

    selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
    setExpandedNodeIds: (nodeIds) => set({ expandedNodeIds: nodeIds }),
    toggleNodeExpanded: (nodeId) => set((state) => {
      const isExpanded = state.expandedNodeIds.includes(nodeId);
      return {
        expandedNodeIds: isExpanded
          ? state.expandedNodeIds.filter(id => id !== nodeId)
          : [...state.expandedNodeIds, nodeId]
      };
    }),

    // Load project list
    loadProjects: async () => {
      const list = await db.projects.toArray();
      set({ projects: list });
      if (list.length > 0 && !get().selectedProjectId) {
        await get().selectProject(list[0].id);
      }
    },

    // Select Project
    selectProject: async (projectId) => {
      const projectNodes = await db.features.where("projectId").equals(projectId).toArray();
      // Remove projectId wrapper field for store
      const cleanNodes = projectNodes.map(({ projectId: _, ...node }) => node as FeatureNode);
      
      set({
        selectedProjectId: projectId,
        nodes: cleanNodes,
        tree: recomputeTree(cleanNodes),
        selectedNodeId: cleanNodes.length > 0 ? cleanNodes[0].id : null,
        expandedNodeIds: cleanNodes.filter(n => n.type === "project" || n.type === "category").map(n => n.id)
      });
    },

    // Create New Project
    createNewProject: async (name, description) => {
      const id = uuidv4();
      const newProj: Project = {
        id,
        name,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await db.projects.add(newProj);
      
      // Setup base root node
      const rootNode: FeatureNode = {
        id: uuidv4(),
        parentId: null,
        title: name,
        type: "project",
        clients: ["Admin"],
        status: "draft",
        priority: "medium",
        tags: [],
        summary: description,
        businessRules: [],
        apiContracts: [],
        uiContracts: [],
        dataContracts: [],
        testCases: [],
        doneCriteria: [],
        dependencies: [],
        risks: [],
        notes: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 0
      };

      await db.features.add({ ...rootNode, projectId: id });
      
      const list = await db.projects.toArray();
      set({ projects: list });
      await get().selectProject(id);
      return id;
    },

    // Delete Project
    deleteProject: async (projectId) => {
      await db.projects.delete(projectId);
      const featureKeys = await db.features.where("projectId").equals(projectId).primaryKeys();
      await db.features.bulkDelete(featureKeys);

      const list = await db.projects.toArray();
      set({ projects: list });
      if (get().selectedProjectId === projectId) {
        if (list.length > 0) {
          await get().selectProject(list[0].id);
        } else {
          set({
            selectedProjectId: null,
            nodes: [],
            tree: [],
            selectedNodeId: null,
            expandedNodeIds: []
          });
        }
      }
    },

    loadSampleSeed: async () => {
      // Direct redirect to the new initializer
      await get().replaceTreeWithParkingBuildingProject();
    },

    // Tree modifications
    addChildNode: (parentId) => {
      const { nodes, selectedProjectId } = get();
      if (!selectedProjectId) return;

      const parentNode = nodes.find(n => n.id === parentId);
      const parentClients = parentNode ? parentNode.clients : ([] as ClientType[]);

      // Max order sibling
      const siblings = nodes.filter(n => n.parentId === parentId);
      const maxOrder = siblings.reduce((max, s) => s.order > max ? s.order : max, -1);

      const newId = uuidv4();
      const newNode: FeatureNode = {
        id: newId,
        parentId,
        title: "New Feature",
        type: "leaf_feature",
        clients: [...parentClients], // Inherit parent clients
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: maxOrder + 1
      };

      const updatedNodes = [...nodes, newNode];
      set((state) => ({
        nodes: updatedNodes,
        tree: recomputeTree(updatedNodes),
        selectedNodeId: newId,
        expandedNodeIds: state.expandedNodeIds.includes(parentId)
          ? state.expandedNodeIds
          : [...state.expandedNodeIds, parentId]
      }));

      syncNodesToDb(selectedProjectId, updatedNodes);
    },

    addSiblingNode: (nodeId) => {
      const { nodes, selectedProjectId } = get();
      if (!selectedProjectId) return;

      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      const parentId = node.parentId;
      const siblings = nodes.filter(n => n.parentId === parentId).sort((a, b) => a.order - b.order);
      const nodeIdx = siblings.findIndex(s => s.id === nodeId);

      const newId = uuidv4();
      const newNode: FeatureNode = {
        id: newId,
        parentId,
        title: "New Sibling Feature",
        type: "leaf_feature",
        clients: [...node.clients],
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: node.order + 1 // Handled by sorting fix below
      };

      // Recalculate orders of siblings
      siblings.splice(nodeIdx + 1, 0, newNode);
      siblings.forEach((sib, idx) => {
        sib.order = idx;
      });

      // Combine back
      const otherNodes = nodes.filter(n => n.parentId !== parentId);
      const updatedNodes = [...otherNodes, ...siblings];

      set({
        nodes: updatedNodes,
        tree: recomputeTree(updatedNodes),
        selectedNodeId: newId
      });

      syncNodesToDb(selectedProjectId, updatedNodes);
    },

    updateNode: (nodeId, patch) => {
      const { nodes, selectedProjectId } = get();
      if (!selectedProjectId) return;

      const updatedNodes = nodes.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            ...patch,
            updatedAt: new Date().toISOString()
          };
        }
        return n;
      });

      set({
        nodes: updatedNodes,
        tree: recomputeTree(updatedNodes)
      });

      syncNodesToDb(selectedProjectId, updatedNodes);
    },

    deleteNode: (nodeId) => {
      const { nodes, selectedProjectId, selectedNodeId } = get();
      if (!selectedProjectId) return;

      const toDeleteIds = getDescendantIds(nodeId, nodes);
      const updatedNodes = nodes.filter(n => !toDeleteIds.includes(n.id));

      // If deleted node or descendant was selected, reset selection or select parent
      let nextSelectedNodeId = selectedNodeId;
      if (selectedNodeId && toDeleteIds.includes(selectedNodeId)) {
        const deletedNode = nodes.find(n => n.id === nodeId);
        nextSelectedNodeId = deletedNode?.parentId || (updatedNodes.length > 0 ? updatedNodes[0].id : null);
      }

      set({
        nodes: updatedNodes,
        tree: recomputeTree(updatedNodes),
        selectedNodeId: nextSelectedNodeId
      });

      syncNodesToDb(selectedProjectId, updatedNodes);
    },

    duplicateNode: (nodeId) => {
      const { nodes, selectedProjectId } = get();
      if (!selectedProjectId) return;

      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      const { rootId, nodes: duplicatedSubtreeNodes } = duplicateSubtree(nodeId, node.parentId, nodes);
      if (!rootId) return;

      // Adjust sibling orders
      const parentId = node.parentId;
      const siblings = nodes.filter(n => n.parentId === parentId).sort((a, b) => a.order - b.order);
      const nodeIdx = siblings.findIndex(s => s.id === nodeId);
      const dupRoot = duplicatedSubtreeNodes.find(n => n.id === rootId);
      if (!dupRoot) return;

      siblings.splice(nodeIdx + 1, 0, dupRoot);
      siblings.forEach((sib, idx) => {
        sib.order = idx;
      });

      const otherNodes = nodes.filter(n => n.parentId !== parentId);
      const nonRootDuplicates = duplicatedSubtreeNodes.filter(n => n.id !== rootId);

      const updatedNodes = [...otherNodes, ...siblings, ...nonRootDuplicates];

      set({
        nodes: updatedNodes,
        tree: recomputeTree(updatedNodes),
        selectedNodeId: rootId
      });

      syncNodesToDb(selectedProjectId, updatedNodes);
    },

    moveNode: (nodeId, newParentId, newIndex) => {
      const { nodes, selectedProjectId } = get();
      if (!selectedProjectId) return;

      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      // Prevent moving a node into its own descendant
      const descendants = getDescendantIds(nodeId, nodes);
      if (newParentId && descendants.includes(newParentId)) {
        return; // Invalid move
      }

      // Step 1: Remove node from old parent list
      const updatedList = nodes.map(n => {
        if (n.id === nodeId) {
          return { ...n, parentId: newParentId };
        }
        return n;
      });

      // Step 2: Get all siblings under the new parent (including the moved node)
      const siblings = updatedList.filter(n => n.parentId === newParentId);
      // Remove moved node temporary to insert at index
      const otherSiblings = siblings.filter(n => n.id !== nodeId).sort((a, b) => a.order - b.order);
      // Insert moved node
      const movedNode = updatedList.find(n => n.id === nodeId)!;
      otherSiblings.splice(newIndex, 0, movedNode);

      // Re-assign orders
      otherSiblings.forEach((s, idx) => {
        s.order = idx;
      });

      // Combine back with all other nodes
      const remainingNodes = updatedList.filter(n => n.parentId !== newParentId);
      const finalNodes = [...remainingNodes, ...otherSiblings];

      set({
        nodes: finalNodes,
        tree: recomputeTree(finalNodes)
      });

      syncNodesToDb(selectedProjectId, finalNodes);
    },

    // Nested properties actions
    addBusinessRule: (nodeId, rule) => {
      const { nodes, updateNode } = get();
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      
      const businessRules = [...(node.businessRules || []), rule];
      updateNode(nodeId, { businessRules });
    },

    removeBusinessRule: (nodeId, ruleIndex) => {
      const { nodes, updateNode } = get();
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      const businessRules = (node.businessRules || []).filter((_, idx) => idx !== ruleIndex);
      updateNode(nodeId, { businessRules });
    },

    addTestCase: (nodeId, testCase) => {
      const { nodes, updateNode } = get();
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      const testCases = [...(node.testCases || []), testCase];
      updateNode(nodeId, { testCases });
    },

    updateTestCase: (nodeId, testCaseId, patch) => {
      const { nodes, updateNode } = get();
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      const testCases = (node.testCases || []).map(tc => {
        if (tc.id === testCaseId) {
          return { ...tc, ...patch };
        }
        return tc;
      });
      updateNode(nodeId, { testCases });
    },

    removeTestCase: (nodeId, testCaseId) => {
      const { nodes, updateNode } = get();
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      const testCases = (node.testCases || []).filter(tc => tc.id !== testCaseId);
      updateNode(nodeId, { testCases });
    },

    addDoneCriterion: (nodeId, content) => {
      const { nodes, updateNode } = get();
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      const doneCriteria = [...(node.doneCriteria || []), { id: uuidv4(), content, checked: false }];
      updateNode(nodeId, { doneCriteria });
    },

    toggleDoneCriterion: (nodeId, criterionId) => {
      const { nodes, updateNode } = get();
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      const doneCriteria = (node.doneCriteria || []).map(dc => {
        if (dc.id === criterionId) {
          return { ...dc, checked: !dc.checked };
        }
        return dc;
      });
      updateNode(nodeId, { doneCriteria });
    },

    // Import/Export
    importTree: async (projectName, desc, _clientsList, nodesList) => {
      const id = uuidv4();
      const project: Project = {
        id,
        name: projectName,
        description: desc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await db.projects.add(project);
      
      // Format nodes with new projectId
      const processedNodes = nodesList.map(n => ({
        ...n,
        projectId: id
      }));

      await syncNodesToDb(id, processedNodes);
      
      const list = await db.projects.toArray();
      set({ projects: list });
      await get().selectProject(id);
    },

    exportTree: () => {
      return get().nodes;
    },

    canInitializeProject: () => {
      const { selectedProjectId, nodes } = get();
      return !selectedProjectId || nodes.length === 0;
    },

    initializeParkingBuildingProject: async () => {
      const canDirectlyInit = get().canInitializeProject();
      if (canDirectlyInit) {
        await get().replaceTreeWithParkingBuildingProject();
      }
    },

    replaceTreeWithParkingBuildingProject: async () => {
      let projectId = get().selectedProjectId;
      
      if (!projectId) {
        projectId = uuidv4();
        const newProj: Project = {
          id: projectId,
          name: "Parking Building Management System",
          description: "Auto-initialized Parking Building Management System project.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await db.projects.add(newProj);
        const list = await db.projects.toArray();
        set({ projects: list, selectedProjectId: projectId });
      } else {
        await db.projects.update(projectId, {
          name: "Parking Building Management System",
          description: "Auto-initialized Parking Building Management System project.",
          updatedAt: new Date().toISOString()
        });
        const list = await db.projects.toArray();
        set({ projects: list });
      }

      const seedTree = createParkingBuildingSeedTree();
      const flatNodes: FeatureNode[] = [];
      seedTree.forEach(root => {
        flatNodes.push(...flattenNodeTree(root));
      });

      flatNodes.forEach(node => {
        (node as any).projectId = projectId;
      });

      await syncNodesToDb(projectId, flatNodes);
      
      const rootNode = flatNodes.find(n => n.parentId === null);
      const rootId = rootNode ? rootNode.id : null;
      
      const directChildrenIds = flatNodes
        .filter(n => n.parentId === rootId)
        .map(n => n.id);
      
      const expandedNodeIds = rootId ? [rootId, ...directChildrenIds] : [];

      set({
        nodes: flatNodes,
        tree: recomputeTree(flatNodes),
        selectedNodeId: rootId,
        expandedNodeIds
      });
    }
  };
});

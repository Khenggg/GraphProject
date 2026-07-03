import React from "react";
import { Tree, type TreeApi } from "react-arborist";
import { Search, FolderKanban, Keyboard } from "lucide-react";
import { useFeatureTreeStore } from "../../store/featureTreeStore";
import type { FeatureNode } from "../../domain/featureNode.types";
import FeatureTreeNode from "./FeatureTreeNode";
import { getAncestorChain, isNodeAiReady } from "../../domain/inheritance.utils";
import { buildTreeFromFlat } from "../../domain/export.utils";
import { translations } from "../../domain/localization";

export default function FeatureTree() {
  const {
    nodes,
    selectedNodeId,
    selectNode,
    moveNode,
    updateNode,
    addChildNode,
    addSiblingNode,
    deleteNode,
    duplicateNode,
    searchQuery,
    selectedClientFilter,
    selectedStatusFilter,
    selectedPriorityFilter,
    showOnlyIncomplete,
    showOnlyLeafs,
    language
  } = useFeatureTreeStore();

  const t = translations[language];
  const treeRef = React.useRef<TreeApi<FeatureNode>>(null);

  // 1. Client filter
  let filteredList = selectedClientFilter === "ALL"
    ? nodes
    : nodes.filter(n => n.clients && n.clients.includes(selectedClientFilter as any));

  // 2. Status filter
  if (selectedStatusFilter !== "ALL") {
    filteredList = filteredList.filter(n => n.status === selectedStatusFilter);
  }

  // 3. Priority filter
  if (selectedPriorityFilter !== "ALL") {
    filteredList = filteredList.filter(n => n.priority === selectedPriorityFilter);
  }

  // 4. Incomplete filter (Leafs only that aren't fully AI-ready)
  if (showOnlyIncomplete) {
    filteredList = filteredList.filter(n => {
      if (n.type !== "leaf_feature") return false;
      const v = isNodeAiReady(n, nodes);
      return !v.isReady;
    });
  }

  // 5. Leaf node filter
  if (showOnlyLeafs) {
    filteredList = filteredList.filter(n => n.type === "leaf_feature");
  }

  // 6. Text Search query filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredList = filteredList.filter(n => {
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchSummary = n.summary && n.summary.toLowerCase().includes(q);
      const matchRules = n.businessRules && n.businessRules.some(r => r.toLowerCase().includes(q));
      const matchTags = n.tags && n.tags.some(t => t.toLowerCase().includes(q));
      return matchTitle || matchSummary || matchRules || matchTags;
    });
  }

  // Re-build tree from flat list keeping hierarchy intact if ancestors are present
  // To avoid breaking Tree UI when ancestors are filtered out, we can build the tree keeping orphans as roots
  const filteredTree = React.useMemo(() => {
    // If no search/filter, build full tree
    const isFiltered = 
      selectedClientFilter !== "ALL" || 
      selectedStatusFilter !== "ALL" || 
      selectedPriorityFilter !== "ALL" || 
      showOnlyIncomplete || 
      showOnlyLeafs || 
      searchQuery.trim().length > 0;

    if (!isFiltered) {
      return buildTreeFromFlat(nodes, null);
    }

    // When filters are active, we must make sure parents/ancestors of matching items are visible or matching items are shown at top-level
    // Let's make a set of all matched IDs and all their ancestor IDs so that the full path remains visible
    const visibleNodeIds = new Set<string>();
    filteredList.forEach(item => {
      visibleNodeIds.add(item.id);
      const chain = getAncestorChain(item.id, nodes);
      chain.forEach(anc => visibleNodeIds.add(anc.id));
    });

    const activeList = nodes.filter(n => visibleNodeIds.has(n.id));
    return buildTreeFromFlat(activeList, null);
  }, [nodes, filteredList, selectedClientFilter, selectedStatusFilter, selectedPriorityFilter, showOnlyIncomplete, showOnlyLeafs, searchQuery]);

  // Handle Keyboard shortcuts on Tree container focus
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedNodeId) return;
    
    // Ignore keyboard shortcuts if editing a node title or input fields
    if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") {
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      // Add child under selected node
      addChildNode(selectedNodeId);
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Add sibling to selected node
      addSiblingNode(selectedNodeId);
    } else if (e.key === "Delete") {
      e.preventDefault();
      const nodeObj = nodes.find(n => n.id === selectedNodeId);
      if (nodeObj) {
        const confirmMsg = language === "en"
          ? `Are you sure you want to delete "${nodeObj.title}"? All child features will be permanently deleted.`
          : `Bạn có chắc chắn muốn xóa "${nodeObj.title}"? Tất cả các feature con sẽ bị xóa vĩnh viễn.`;
        if (confirm(confirmMsg)) {
          deleteNode(selectedNodeId);
        }
      }
    } else if (e.key === "F2") {
      e.preventDefault();
      // Triggers edit renaming. Tree ref exposes edit api if supported, or we search node state
      if (treeRef.current) {
        treeRef.current.edit(selectedNodeId);
      }
    } else if (e.key === "d" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      duplicateNode(selectedNodeId);
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 overflow-hidden glass-panel shadow-xs"
      onKeyDown={handleKeyDown}
      tabIndex={0} // Makes the container focusable to receive keydown events
    >
      {/* Tree Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center space-x-2">
          <FolderKanban className="w-4.5 h-4.5 text-indigo-650" />
          <h2 className="text-sm font-semibold text-slate-700">{t.interactiveFeatureTree}</h2>
        </div>
        <div className="flex items-center space-x-3 text-[10px] text-slate-500">
          <div className="flex items-center space-x-1">
            <span className="px-1.5 py-0.5 bg-slate-150 border border-slate-200 rounded text-slate-600 font-mono">Tab</span>
            <span>{t.addChild}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="px-1.5 py-0.5 bg-slate-150 border border-slate-200 rounded text-slate-600 font-mono">Enter</span>
            <span>{t.addSibling}</span>
          </div>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 min-h-0 p-2 overflow-y-auto">
        {filteredTree.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 p-8">
            <Search className="w-8 h-8 text-slate-400" />
            <p className="text-sm text-center">{t.noFeaturesFound}</p>
            <p className="text-xs text-slate-500">{t.adjustFilters}</p>
          </div>
        ) : (
          <Tree
            ref={treeRef}
            data={filteredTree}
            openByDefault={true}
            width="100%"
            height={520}
            indent={24}
            rowHeight={36}
            selection={selectedNodeId || undefined}
            onSelect={(selected) => {
              if (selected && selected[0]) {
                selectNode(selected[0].id);
              }
            }}
            onMove={({ dragIds, parentId, index }) => {
              if (dragIds && dragIds[0]) {
                // React-arborist index can be absolute or relative. Let's pass it
                moveNode(dragIds[0], parentId, index);
              }
            }}
            onRename={({ id, name }) => {
              updateNode(id, { title: name });
            }}
            // Custom renderer
            children={FeatureTreeNode}
          />
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-550 flex justify-between">
        <span>{t.totalFeatures} {nodes.length}</span>
        <span className="flex items-center"><Keyboard className="w-3 h-3 mr-1" /> {t.footerTip}</span>
      </div>
    </div>
  );
}

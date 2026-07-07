import React from "react";
import type { NodeRendererProps } from "react-arborist";
import { 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  Folder, 
  FileCode, 
  FolderOpen,
  AlertCircle, 
  Plus, 
  Trash2, 
  Copy, 
  MoreVertical,
  Check,
  Scale,
  Users
} from "lucide-react";
import type { FeatureNode, ClientType } from "../../domain/featureNode.types";
import { useFeatureTreeStore } from "../../store/featureTreeStore";
import { isNodeAiReady } from "../../domain/inheritance.utils";
import { translations } from "../../domain/localization";

// Initials and colors for clients
const CLIENT_CONFIG: Record<ClientType, { char: string; bg: string; text: string }> = {
  Admin: { char: "A", bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
  Manager: { char: "M", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  Staff: { char: "S", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  Driver: { char: "D", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  Guest: { char: "G", bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-800" },
  System: { char: "Y", bg: "bg-teal-50 border-teal-200", text: "text-teal-700" },
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  ready: "bg-blue-50 text-blue-600 border-blue-200",
  in_progress: "bg-amber-50 text-amber-800 border-amber-200/60",
  implemented: "bg-cyan-50 text-cyan-800 border-cyan-200",
  tested: "bg-purple-50 text-purple-800 border-purple-200",
  done: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
  blocked: "bg-rose-50 text-rose-800 border-rose-200",
};

export default function FeatureTreeNode({
  node,
  style,
  dragHandle,
}: NodeRendererProps<FeatureNode>) {
  const { 
    selectedNodeId, 
    selectNode, 
    addChildNode, 
    addSiblingNode, 
    deleteNode, 
    duplicateNode,
    nodes,
    language
  } = useFeatureTreeStore();

  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const t = translations[language];

  const isSelected = selectedNodeId === node.id;
  const isLeaf = node.isLeaf;
  const data = node.data;
  const isFeatureLike = ["feature", "sub_feature", "leaf_feature"].includes(data.type);

  // AI-readiness validation
  const validation = isNodeAiReady(data, nodes);

  // Close context dropdown on outside click
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showMenu]);

  // Determine icon depending on node type
  const getNodeIcon = () => {
    switch (data.type) {
      case "project":
        return <FolderOpen className="w-4 h-4 text-indigo-650 mx-0.5 flex-shrink-0" />;
      case "category":
        return <Folder className="w-4 h-4 text-amber-550 mx-0.5 flex-shrink-0" />;
      case "feature":
        return <Layers className="w-4 h-4 text-blue-500 mx-0.5 flex-shrink-0" />;
      case "sub_feature":
        return <FileCode className="w-4 h-4 text-teal-600 mx-0.5 flex-shrink-0" />;
      case "leaf_feature":
        return <Check className="w-4 h-4 text-emerald-600 mx-0.5 flex-shrink-0" />;
      case "rule_group":
        return <Scale className="w-4 h-4 text-purple-650 mx-0.5 flex-shrink-0" />;
      case "client_group":
        return <Users className="w-4 h-4 text-pink-600 mx-0.5 flex-shrink-0" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-slate-400 mx-1 flex-shrink-0" />;
    }
  };

  const handleRowClick = (e: React.MouseEvent) => {
    // Avoid selecting when clicking expander or inputs
    if ((e.target as HTMLElement).closest(".expander") || (e.target as HTMLElement).closest(".menu-btn") || (e.target as HTMLElement).closest(".menu-dropdown")) {
      return;
    }
    selectNode(node.id);
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    addChildNode(node.id);
  };

  // Localize validation reasons
  const getValidationTooltip = () => {
    if (validation.isReady) {
      return t.aiReady;
    }
    const mappedReasons = validation.reasons.map(r => {
      if (language === "en") return r;
      switch (r) {
        case "title": return "tiêu đề trống";
        case "summary": return "mô tả trống";
        case "clients": return "chưa gán client";
        case "tests": return "thiếu kịch bản test";
        case "doneCriteria": return "thiếu tiêu chí hoàn thành";
        default: return r;
      }
    });
    return language === "en" 
      ? `Not AI-Ready: ${mappedReasons.join(", ")}`
      : `Chưa sẵn sàng cho AI: ${mappedReasons.join(", ")}`;
  };

  return (
    <div
      style={style}
      className={`group flex items-center h-full px-2 py-0.5 rounded-lg select-none cursor-pointer transition-all-200 ${
        isSelected 
          ? "ap-node-active" 
          : "hover:bg-slate-250/40"
      }`}
      onClick={handleRowClick}
      ref={dragHandle}
    >
      {/* Expander Arrow */}
      <div 
        className="expander w-5 h-5 flex items-center justify-center mr-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          node.toggle();
        }}
      >
        {!isLeaf && (
          node.isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
        )}
      </div>

      {/* Node Type Icon */}
      <div className="mr-2 flex-shrink-0 flex items-center">
        {getNodeIcon()}
      </div>

      {/* Title / Renaming Input */}
      <div className="flex-1 min-w-0 mr-2 flex items-center">
        {node.isEditing ? (
          <input
            type="text"
            className="w-full bg-white text-slate-800 px-1.5 py-0.5 rounded border border-indigo-500 text-sm focus:outline-none"
            defaultValue={data.title}
            autoFocus
            onBlur={(e) => node.submit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") node.submit(e.currentTarget.value);
              if (e.key === "Escape") node.reset();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span 
            className={`text-sm truncate font-medium ${
              isSelected ? "text-indigo-650 font-bold" : "text-slate-600 group-hover:text-slate-900"
            }`}
          >
            {data.title}
          </span>
        )}
      </div>

      {/* Action Buttons (Hover triggers + button) */}
      <div className="flex items-center space-x-1 flex-shrink-0 relative">
        {/* Hover + button */}
        <button
          onClick={handleAddChild}
          title={t.addChild}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-500 text-indigo-600 hover:text-white rounded cursor-pointer"
        >
          <Plus className="w-3 h-3" />
        </button>

        {/* Client Badges */}
        {isFeatureLike && data.clients && data.clients.length > 0 && (
          <div className="flex items-center -space-x-1.5 mr-1.5">
            {data.clients.slice(0, 3).map((client) => {
              const cfg = CLIENT_CONFIG[client] || { char: "?", bg: "bg-slate-100", text: "text-slate-500" };
              return (
                <span
                  key={client}
                  title={`Client: ${client}`}
                  className={`w-4 h-4 rounded-full border border-white flex items-center justify-center text-[9px] font-bold ${cfg.bg} ${cfg.text}`}
                >
                  {cfg.char}
                </span>
              );
            })}
            {data.clients.length > 3 && (
              <span className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[8px] font-bold bg-slate-100 text-slate-500">
                +{data.clients.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Status indicator */}
        {isFeatureLike && (
          <span 
            className={`text-[10px] px-1.5 py-0.2 rounded border hidden sm:inline-block ${STATUS_COLORS[data.status] || "bg-slate-100"}`}
          >
            {data.status}
          </span>
        )}

        {/* AI Readiness Check */}
        {data.type === "leaf_feature" && (
          <div className="ml-1">
            {validation.isReady ? (
              <span title={t.aiReady}><Check className="w-3.5 h-3.5 text-emerald-600" /></span>
            ) : (
              <span title={getValidationTooltip()}>
                <AlertCircle 
                  className={`w-3.5 h-3.5 ${
                    validation.status === "partially_ready" ? "text-amber-600" : "text-rose-500"
                  }`} 
                />
              </span>
            )}
          </div>
        )}

        {/* Count badge */}
        {data.children && data.children.length > 0 && (
          <span className="text-[10px] bg-slate-105 text-slate-500 px-1.5 py-0.2 rounded-full border border-slate-200">
            {data.children.length}
          </span>
        )}

        {/* More Actions Dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="menu-btn w-5 h-5 flex items-center justify-center hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
          
          {showMenu && (
            <div className="menu-dropdown absolute right-0 mt-1 w-44 rounded-lg bg-white border border-slate-200 shadow-xl py-1 z-50 text-left">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addSiblingNode(data.id);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-2" /> {t.addSibling}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  node.edit();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center"
              >
                {language === "en" ? "Rename" : "Đổi tên"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateNode(data.id);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center"
              >
                <Copy className="w-3.5 h-3.5 mr-2" /> {language === "en" ? "Duplicate" : "Nhân bản"}
              </button>
              <hr className="border-slate-200 my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const confirmMsg = language === "en"
                    ? `Are you sure you want to delete "${data.title}"? All children nodes will be permanently deleted.`
                    : `Bạn có chắc chắn muốn xóa "${data.title}"? Tất cả các nhánh con sẽ bị xóa vĩnh viễn.`;
                  if (confirm(confirmMsg)) {
                    deleteNode(data.id);
                  }
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex items-center"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" /> {language === "en" ? "Delete" : "Xóa"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

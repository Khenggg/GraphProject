import React from "react";
import {
  ShieldCheck,
  FileSignature,
  Sparkles,
  Plus,
  Trash2,
  Clipboard,
  Download,
  AlertTriangle,
  FolderOpen,
  Check
} from "lucide-react";
import { useFeatureTreeStore } from "../../store/featureTreeStore";
import type {
  FeatureNodeType,
  FeatureStatus,
  Priority,
  ClientType,
  TestCase,
  ContractField
} from "../../domain/featureNode.types";
import { getEffectiveRules, isNodeAiReady, getEffectiveTags } from "../../domain/inheritance.utils";
import {
  formatSingleNodeMarkdown,
  formatSubtreeMarkdown,
  formatProjectMarkdown
} from "../../domain/export.utils";
import { translations } from "../../domain/localization";

type TabType = "overview" | "db_validation" | "security_logging" | "contracts_ui" | "tests_done" | "export";

const DEFAULT_ROLES = ["Admin", "Manager", "Staff", "Driver", "Guest", "System"];

function FieldLabel({
  text,
  required,
  language
}: {
  text: string;
  required?: boolean;
  language: string;
}) {
  return (
    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between items-center select-none">
      <span>{text}</span>
      <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-medium lowercase tracking-normal normal-case border ${required
          ? "bg-rose-50 text-rose-600 border-rose-100"
          : "bg-slate-100 text-slate-450 border-slate-200"
        }`}>
        {required
          ? (language === "en" ? "required" : "bắt buộc")
          : (language === "en" ? "optional" : "tùy chọn")}
      </span>
    </label>
  );
}

interface SimpleListEditorProps {
  title: string;
  placeholder: string;
  items: string[];
  onAdd: (text: string) => void;
  onRemove: (idx: number) => void;
  addLabel?: string;
  noItemsLabel?: string;
  required?: boolean;
  language: string;
}

function SimpleListEditor({
  title,
  placeholder,
  items,
  onAdd,
  onRemove,
  addLabel = "Add",
  noItemsLabel = "No items added yet.",
  required = false,
  language
}: SimpleListEditorProps) {
  const [val, setVal] = React.useState("");
  return (
    <div className="space-y-2">
      <FieldLabel text={title} required={required} language={language} />
      <div className="flex gap-2">
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (val.trim()) {
                onAdd(val.trim());
                setVal("");
              }
            }
          }}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none placeholder-slate-400"
        />
        <button
          type="button"
          onClick={() => {
            if (val.trim()) {
              onAdd(val.trim());
              setVal("");
            }
          }}
          className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-755 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
        >
          {addLabel}
        </button>
      </div>
      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic pl-1">{noItemsLabel}</p>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between bg-slate-50 border border-slate-200 rounded-lg p-2 group">
              <span className="text-xs text-slate-700 leading-normal">{item}</span>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="opacity-0 group-hover:opacity-100 hover:text-rose-600 text-slate-400 transition-opacity cursor-pointer flex-shrink-0 ml-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface TableRowField {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "select";
  options?: string[];
}

interface TableEditorProps {
  title: string;
  fields: TableRowField[];
  items: Record<string, string>[];
  onAdd: (row: Record<string, string>) => void;
  onRemove: (idx: number) => void;
  addLabel?: string;
  noItemsLabel?: string;
  required?: boolean;
  language: string;
}

function TableEditor({
  title,
  fields,
  items,
  onAdd,
  onRemove,
  addLabel = "Add Row",
  noItemsLabel = "No entries added yet.",
  required = false,
  language
}: TableEditorProps) {
  const [formState, setFormState] = React.useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    fields.forEach(f => {
      init[f.key] = f.type === "select" && f.options ? f.options[0] || "" : "";
    });
    return init;
  });

  const handleAdd = () => {
    const hasEmpty = fields.some(f => !formState[f.key]?.trim());
    if (hasEmpty) return;

    onAdd({ ...formState });
    const reset: Record<string, string> = {};
    fields.forEach(f => {
      reset[f.key] = f.type === "select" && f.options ? f.options[0] || "" : "";
    });
    setFormState(reset);
  };

  return (
    <div className="space-y-3">
      <FieldLabel text={title} required={required} language={language} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end bg-slate-50 p-3 rounded-lg border border-slate-200">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1">
            <span className="text-[10px] font-bold text-slate-450 uppercase">{f.label}</span>
            {f.type === "select" && f.options ? (
              <select
                value={formState[f.key] || ""}
                onChange={(e) => setFormState(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                {f.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formState[f.key] || ""}
                onChange={(e) => setFormState(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none placeholder-slate-400"
              />
            )}
          </div>
        ))}
        <div className="md:col-span-3 flex justify-end">
          <button
            type="button"
            onClick={handleAdd}
            className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-755 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
          >
            {addLabel}
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
        <table className="w-full border-collapse text-left text-xs text-slate-700">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              {fields.map(f => (
                <th key={f.key} className="p-2.5 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">{f.label}</th>
              ))}
              <th className="p-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {items.length === 0 ? (
              <tr>
                <td colSpan={fields.length + 1} className="p-4 text-center text-slate-400 italic bg-white">
                  {noItemsLabel}
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 bg-white group">
                  {fields.map(f => (
                    <td key={f.key} className="p-2.5 leading-normal max-w-xs truncate" title={item[f.key]}>
                      {item[f.key]}
                    </td>
                  ))}
                  <td className="p-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-600 text-slate-400 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function RightDetailPanel() {
  const {
    nodes,
    selectedNodeId,
    updateNode,
    addBusinessRule,
    removeBusinessRule,
    addTestCase,
    updateTestCase,
    removeTestCase,
    addDoneCriterion,
    toggleDoneCriterion,
    language
  } = useFeatureTreeStore();

  const [activeTab, setActiveTab] = React.useState<TabType>("overview");

  // Local state for adding items
  const [newRule, setNewRule] = React.useState("");
  const [newCriterion, setNewCriterion] = React.useState("");

  // Modals editing states
  const [editingContract, setEditingContract] = React.useState<{ type: "api" | "ui" | "data"; index: number; name: string; content: string } | null>(null);
  const [editingTestCase, setEditingTestCase] = React.useState<TestCase | null>(null);
  const [editingCriterion, setEditingCriterion] = React.useState<{ id: string; content: string } | null>(null);

  // Project Roles management state
  const [newRoleInput, setNewRoleInput] = React.useState("");

  // AI Export tab selections
  const [exportScope, setExportScope] = React.useState<"node" | "subtree" | "project">("node");
  const [exportMode, setExportMode] = React.useState<"human" | "ai" | "qa">("ai");
  const [copied, setCopied] = React.useState(false);

  const t = translations[language];

  // Get active node
  const activeNode = React.useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, nodes]);

  // Get tags inherited from ancestors
  const inheritedTags = React.useMemo(() => {
    if (!activeNode) return [] as string[];
    const allEffectiveTags = getEffectiveTags(activeNode.id, nodes);
    // Exclude local tags from inherited list
    const localTags = (activeNode.tags || []).map(t => t.toLowerCase().trim());
    return allEffectiveTags.filter(t => !localTags.includes(t));
  }, [activeNode, nodes]);

  // Find the project root node to read dynamic roles
  const projectRootNode = React.useMemo(() => {
    return nodes.find(n => n.type === "project") || null;
  }, [nodes]);

  // Dynamic roles: use project root's metadata.roles if defined, otherwise fall back to defaults
  const availableRoles = React.useMemo(() => {
    const customRoles = projectRootNode?.metadata?.roles;
    if (customRoles && customRoles.length > 0) return customRoles;
    return DEFAULT_ROLES;
  }, [projectRootNode]);

  // Compute tabs that are relevant for the selected node type
  const visibleTabs = React.useMemo(() => {
    if (!activeNode) return [] as TabType[];
    const isLeafOrFeature = ["feature", "sub_feature", "leaf_feature"].includes(activeNode.type);
    if (isLeafOrFeature) {
      return ["overview", "db_validation", "security_logging", "contracts_ui", "tests_done", "export"] as TabType[];
    }
    return ["overview", "export"] as TabType[];
  }, [activeNode]);

  // Reset active tab to overview if it is no longer visible
  React.useEffect(() => {
    if (activeTab && !visibleTabs.includes(activeTab)) {
      setActiveTab("overview");
    }
  }, [visibleTabs, activeTab]);

  // Clean local state on node change
  React.useEffect(() => {
    setNewRule("");
    setNewCriterion("");
    setEditingContract(null);
    setEditingTestCase(null);
    setEditingCriterion(null);
    setNewRoleInput("");
    setCopied(false);
  }, [selectedNodeId]);

  // Markdown builder
  const generatedMarkdown = React.useMemo(() => {
    if (!activeNode) return "";
    if (exportScope === "node") {
      return formatSingleNodeMarkdown(activeNode, nodes, exportMode);
    } else if (exportScope === "subtree") {
      return formatSubtreeMarkdown(activeNode.id, nodes, exportMode);
    } else {
      return formatProjectMarkdown(nodes, exportMode);
    }
  }, [activeNode, nodes, exportScope, exportMode]);

  if (!activeNode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 bg-white rounded-xl border border-slate-200/80 shadow-xs">
        <FolderOpen className="w-12 h-12 text-slate-350 mb-3 animate-pulse" />
        <h3 className="text-base font-semibold text-slate-600">{t.noFeatureSelected}</h3>
        <p className="text-xs text-slate-400 text-center max-w-sm mt-1">
          {t.selectNodeToEdit}
        </p>
      </div>
    );
  }

  // Calculate AI Readiness
  const readiness = isNodeAiReady(activeNode, nodes);

  const isFeatureLike = ["feature", "sub_feature", "leaf_feature"].includes(activeNode.type);
  const showClients = isFeatureLike || activeNode.type === "client_group";
  const showNotes = ["project", "category", "feature", "sub_feature", "leaf_feature"].includes(activeNode.type);

  // Actions
  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generatedMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([generatedMarkdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeNode.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_export_${exportMode}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    addBusinessRule(activeNode.id, newRule.trim());
    setNewRule("");
  };

  const handleAddCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCriterion.trim()) return;
    addDoneCriterion(activeNode.id, newCriterion.trim());
    setNewCriterion("");
  };

  const handleAddDefaultDoneCriteria = () => {
    const defaults = language === "en" ? [
      "API endpoints implemented & verified",
      "UI elements responsive & styled matching layout spec",
      "Inputs validation completed & errors handled",
      "Unit tests pass with >80% coverage",
      "Integration tests successfully run against local sandbox",
      "Verified functional requirements matching effective rules"
    ] : [
      "Các endpoint API được triển khai & xác minh thành công",
      "Giao diện UI responsive & code CSS chuẩn theo mockup đặc tả",
      "Xử lý và validate dữ liệu đầu vào đầy đủ ở form",
      "Tất cả unit tests chạy qua với độ bao phủ >80%",
      "Chạy test tích hợp thành công trên môi trường sandbox local",
      "Xác minh tất cả các luồng nghiệp vụ hoạt động đúng theo rule hiệu lực"
    ];
    defaults.forEach(c => {
      // Prevent adding duplicates
      if (!activeNode.doneCriteria?.some(dc => dc.content === c)) {
        addDoneCriterion(activeNode.id, c);
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Node Title Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-650 border border-indigo-100 rounded">
              {language === "en" ? activeNode.type.replace("_", " ") : activeNode.type === "leaf_feature" ? "feature lá" : activeNode.type === "sub_feature" ? "sub feature" : activeNode.type === "project" ? "dự án gốc" : activeNode.type === "category" ? "danh mục" : activeNode.type === "rule_group" ? "nhóm quy tắc" : activeNode.type === "client_group" ? "nhóm đối tượng" : "feature"}
            </span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${readiness.isReady
                ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                : readiness.status === "partially_ready"
                  ? "bg-amber-50 text-amber-800 border-amber-200/60"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
              {readiness.isReady ? t.aiReady : readiness.status === "partially_ready" ? t.partiallyReady : t.notReady}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-800 mt-1 truncate">{activeNode.title}</h2>
        </div>

        {/* Warning messages if not ready */}
        {!readiness.isReady && activeNode.type === "leaf_feature" && (
          <div className="flex items-center text-xs text-amber-850 bg-amber-50 border border-amber-200/60 px-3 py-1.5 rounded-lg max-w-xs">
            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 text-amber-600" />
            <span className="truncate" title={readiness.reasons.join(", ")}>
              {readiness.reasons.length} {readiness.reasons.length > 1 ? t.missingDetailsPlural : t.missingDetails}
            </span>
          </div>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 bg-slate-50 px-2 overflow-x-auto shrink-0">
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-xs font-semibold border-b-2 capitalize whitespace-nowrap cursor-pointer transition-all-200 ${activeTab === tab
                ? "border-indigo-600 text-indigo-650 bg-indigo-50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
              }`}
          >
            {tab === "overview" && (language === "en" ? "Overview" : "Tổng quan")}
            {tab === "db_validation" && (language === "en" ? "DB & Validation" : "CSDL & Ràng buộc")}
            {tab === "security_logging" && (language === "en" ? "Security & Logs" : "Bảo mật & Logs")}
            {tab === "contracts_ui" && (language === "en" ? "Contracts & UI" : "Hợp đồng & UI")}
            {tab === "tests_done" && (language === "en" ? "Tests & Done" : "Test & Nghiệm thu")}
            {tab === "export" && (language === "en" ? "AI Export" : "Xuất Prompt AI")}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-6 bg-white">
        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className={`grid grid-cols-1 ${isFeatureLike ? "md:grid-cols-3" : ""} gap-4`}>
              {/* Type Selector */}
              <div>
                <FieldLabel text={t.nodeType} required={true} language={language} />
                <select
                  value={activeNode.type}
                  onChange={(e) => updateNode(activeNode.id, { type: e.target.value as FeatureNodeType })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="project">{language === "en" ? "Project Root" : "Dự án Gốc"}</option>
                  <option value="category">{language === "en" ? "Category" : "Danh mục"}</option>
                  <option value="feature">{language === "en" ? "Feature" : "Feature chính"}</option>
                  <option value="sub_feature">{language === "en" ? "Sub Feature" : "Sub feature"}</option>
                  <option value="leaf_feature">{language === "en" ? "Leaf Feature" : "Feature lá (cấp cuối)"}</option>
                  <option value="rule_group">{language === "en" ? "Rule Group" : "Nhóm quy tắc"}</option>
                  <option value="client_group">{language === "en" ? "Client Group" : "Nhóm đối tượng"}</option>
                </select>
              </div>

              {/* Status Selector */}
              {isFeatureLike && (
                <div>
                  <FieldLabel text={t.status} required={true} language={language} />
                  <select
                    value={activeNode.status}
                    onChange={(e) => updateNode(activeNode.id, { status: e.target.value as FeatureStatus })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="in_progress">In Progress</option>
                    <option value="implemented">Implemented</option>
                    <option value="tested">Tested</option>
                    <option value="done">Done</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              )}

              {/* Priority Selector */}
              {isFeatureLike && (
                <div>
                  <FieldLabel text={t.priority} required={true} language={language} />
                  <select
                    value={activeNode.priority}
                    onChange={(e) => updateNode(activeNode.id, { priority: e.target.value as Priority })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="must_have">Must Have</option>
                  </select>
                </div>
              )}
            </div>

            {/* Owner & Consumer Services */}
            {isFeatureLike && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel text={language === "en" ? "Owner Service / Tech Stack" : "Dịch vụ phụ trách / Công nghệ"} required={false} language={language} />
                  <input
                    type="text"
                    value={activeNode.metadata?.ownerService || ""}
                    onChange={(e) => updateNode(activeNode.id, {
                      metadata: { ...(activeNode.metadata || {}), ownerService: e.target.value }
                    })}
                    placeholder="e.g. .NET Core API, React Frontend"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                  />
                </div>
                <div>
                  <FieldLabel text={language === "en" ? "Consumer Services" : "Dịch vụ tiêu thụ API"} required={false} language={language} />
                  <input
                    type="text"
                    value={activeNode.metadata?.consumerServices?.join(", ") || ""}
                    onChange={(e) => {
                      const arr = e.target.value.split(",").map(x => x.trim()).filter(Boolean);
                      updateNode(activeNode.id, {
                        metadata: { ...(activeNode.metadata || {}), consumerServices: arr }
                      });
                    }}
                    placeholder="e.g. React Frontend, Mobile App"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Client / Role Assignment (for feature-like nodes) */}
            {showClients && (
              <div>
                <FieldLabel text={t.assignedClients} required={false} language={language} />
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  {availableRoles.map((role) => {
                    const assigned = activeNode.clients?.includes(role as ClientType);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          const nextClients = assigned
                            ? activeNode.clients.filter(c => c !== role)
                            : [...(activeNode.clients || []), role as ClientType];
                          updateNode(activeNode.id, { clients: nextClients });
                        }}
                        className={`px-3 py-1 text-xs rounded-full border transition-all duration-150 cursor-pointer ${assigned
                            ? "bg-indigo-50 text-indigo-650 border-indigo-250 font-semibold"
                            : "bg-white text-slate-500 border-slate-200 hover:text-slate-850 hover:border-slate-300"
                          }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========== PROJECT ROOT: Roles Registry ========== */}
            {activeNode.type === "project" && (
              <div className="p-4 bg-gradient-to-br from-indigo-50/60 to-slate-50 border border-indigo-100 rounded-xl space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">{t.projectRolesTitle}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{t.projectRolesDesc}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(activeNode.metadata?.roles && activeNode.metadata.roles.length > 0) ? (
                    activeNode.metadata.roles.map((role, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-white border border-indigo-200 text-indigo-700 font-medium shadow-xs">
                        {role}
                        <button
                          type="button"
                          onClick={() => {
                            const updatedRoles = (activeNode.metadata?.roles || []).filter((_, i) => i !== idx);
                            updateNode(activeNode.id, {
                              metadata: { ...activeNode.metadata, roles: updatedRoles }
                            });
                          }}
                          className="text-indigo-400 hover:text-rose-600 cursor-pointer transition-colors"
                          title={language === "en" ? "Remove role" : "Xóa vai trò"}
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      {t.noRolesDefined}
                      <br />
                      <span className="text-slate-350">{t.defaultRolesHint}</span>
                    </p>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const trimmed = newRoleInput.trim();
                    if (!trimmed) return;
                    const currentRoles = activeNode.metadata?.roles || [];
                    if (currentRoles.some(r => r.toLowerCase() === trimmed.toLowerCase())) return;
                    updateNode(activeNode.id, {
                      metadata: { ...activeNode.metadata, roles: [...currentRoles, trimmed] }
                    });
                    setNewRoleInput("");
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={newRoleInput}
                    onChange={(e) => setNewRoleInput(e.target.value)}
                    placeholder={t.addRolePlaceholder}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {t.addRoleBtn}
                  </button>
                </form>
              </div>
            )}

            {/* Objective */}
            {isFeatureLike && (
              <div>
                <FieldLabel text={language === "en" ? "Feature Objective" : "Mục tiêu Tính năng"} required={false} language={language} />
                <textarea
                  value={activeNode.objective || ""}
                  onChange={(e) => updateNode(activeNode.id, { objective: e.target.value })}
                  rows={2}
                  placeholder={language === "en" ? "What must this feature achieve?" : "Mô tả tính năng này phải đạt được mục tiêu gì..."}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                />
              </div>
            )}

            {/* Summary */}
            <div>
              <FieldLabel text={t.summaryLabel} required={true} language={language} />
              <textarea
                value={activeNode.summary || ""}
                onChange={(e) => updateNode(activeNode.id, { summary: e.target.value })}
                rows={3}
                placeholder={t.summaryPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:outline-none placeholder-slate-400"
              />
            </div>

            {/* Scope (In/Out) */}
            {isFeatureLike && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SimpleListEditor
                  title={language === "en" ? "In Scope" : "Trong phạm vi (In Scope)"}
                  placeholder="e.g. JWT token validation, refresh mechanism"
                  items={activeNode.inScope || []}
                  onAdd={(text) => updateNode(activeNode.id, { inScope: [...(activeNode.inScope || []), text] })}
                  onRemove={(idx) => updateNode(activeNode.id, { inScope: (activeNode.inScope || []).filter((_, i) => i !== idx) })}
                  language={language}
                  required={false}
                />
                <SimpleListEditor
                  title={language === "en" ? "Out of Scope" : "Ngoài phạm vi (Out of Scope)"}
                  placeholder="e.g. Third-party OAuth, UI styling specs"
                  items={activeNode.outOfScope || []}
                  onAdd={(text) => updateNode(activeNode.id, { outOfScope: [...(activeNode.outOfScope || []), text] })}
                  onRemove={(idx) => updateNode(activeNode.id, { outOfScope: (activeNode.outOfScope || []).filter((_, i) => i !== idx) })}
                  language={language}
                  required={false}
                />
              </div>
            )}

            {/* Actors / Roles & Permissions */}
            {isFeatureLike && (
              <TableEditor
                title={language === "en" ? "Actors / Roles & Permissions" : "Phân quyền cho các Vai trò"}
                fields={[
                  { key: "role", label: language === "en" ? "Role" : "Vai trò", type: "select", options: availableRoles },
                  { key: "permission", label: language === "en" ? "Permission" : "Quyền hạn", placeholder: "e.g. Can view / modify resources" }
                ]}
                items={(activeNode.permissions || []) as any}
                onAdd={(row) => updateNode(activeNode.id, { permissions: [...(activeNode.permissions || []), { role: row.role, permission: row.permission }] })}
                onRemove={(idx) => updateNode(activeNode.id, { permissions: (activeNode.permissions || []).filter((_, i) => i !== idx) })}
                noItemsLabel={language === "en" ? "No roles mapped." : "Chưa phân quyền vai trò cụ thể."}
                language={language}
                required={false}
              />
            )}

            {/* Tags */}
            <div>
              <FieldLabel text={t.tagsLabel} required={false} language={language} />
              <input
                type="text"
                value={activeNode.tags?.join(", ") || ""}
                onChange={(e) => {
                  const tagsArray = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                  updateNode(activeNode.id, { tags: tagsArray });
                }}
                placeholder={t.tagsPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:outline-none placeholder-slate-400"
              />

              {/* Inherited Tags */}
              {inheritedTags.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-555">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    {language === "en" ? "Inherited tags:" : "Thẻ kế thừa:"}
                  </span>
                  {inheritedTags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-650 rounded-md font-mono text-[9px] uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Dependencies & Risks */}
            {isFeatureLike && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dependencies */}
                <div>
                  <FieldLabel text={t.dependenciesLabel} required={false} language={language} />
                  <input
                    type="text"
                    value={activeNode.dependencies?.join(", ") || ""}
                    onChange={(e) => {
                      const depsArray = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                      updateNode(activeNode.id, { dependencies: depsArray });
                    }}
                    placeholder={t.dependenciesPlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                  />
                </div>

                {/* Risks */}
                <div>
                  <FieldLabel text={t.risksLabel} required={false} language={language} />
                  <input
                    type="text"
                    value={activeNode.risks?.join(", ") || ""}
                    onChange={(e) => {
                      const risksArray = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                      updateNode(activeNode.id, { risks: risksArray });
                    }}
                    placeholder={t.risksPlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            {showNotes && (
              <div>
                <FieldLabel text={t.notesLabel} required={false} language={language} />
                <textarea
                  value={activeNode.notes || ""}
                  onChange={(e) => updateNode(activeNode.id, { notes: e.target.value })}
                  rows={2}
                  placeholder={t.notesPlaceholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                />
              </div>
            )}

            {/* ==================== INHERITED BUSINESS RULES SECTION ==================== */}
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-2 text-indigo-650" /> {t.localBusinessRules}
                </h3>

                <form onSubmit={handleAddRule} className="flex space-x-2">
                  <input
                    type="text"
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder={t.newRulePlaceholder}
                    className="flex-1 bg-slate-55 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-755 border border-indigo-500/20 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center shadow-xs"
                  >
                    <Plus className="w-4 h-4 mr-1" /> {t.add}
                  </button>
                </form>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(!activeNode.businessRules || activeNode.businessRules.length === 0) ? (
                    <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      {t.noLocalRules}
                    </p>
                  ) : (
                    activeNode.businessRules.map((rule, idx) => (
                      <div key={idx} className="flex items-start justify-between bg-slate-50 border border-slate-200 rounded-lg p-3 group">
                        <p className="text-xs text-slate-700 leading-relaxed pr-3">{rule}</p>
                        <button
                          type="button"
                          onClick={() => removeBusinessRule(activeNode.id, idx)}
                          className="opacity-0 group-hover:opacity-100 hover:text-rose-600 text-slate-400 transition-opacity cursor-pointer flex-shrink-0"
                          title={language === "en" ? "Delete rule" : "Xóa luật"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-150">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-amber-500" /> {t.inheritedAndEffectiveRules}
                </h3>
                <p className="text-xs text-slate-500">
                  {t.inheritanceDescription}
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
                  {getEffectiveRules(activeNode.id, nodes).map((group) => {
                    const isCurrent = group.sourceNodeId === activeNode.id;
                    return (
                      <div key={group.sourceNodeId} className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-bold ${isCurrent ? "text-indigo-650" : "text-slate-500"}`}>
                            {isCurrent ? t.localRulesLabel : `${t.inheritedFrom} ${group.sourceTitle}`}
                          </h4>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-500 font-bold">
                            {group.rules.length} {group.rules.length > 1 ? t.rulesCount : t.ruleCount}
                          </span>
                        </div>
                        <ul className="space-y-1.5 list-disc pl-4 text-xs text-slate-600">
                          {group.rules.map((rule, rIdx) => (
                            <li key={rIdx} className="leading-relaxed">{rule}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}

                  {getEffectiveRules(activeNode.id, nodes).length === 0 && (
                    <div className="p-6 text-center text-xs text-slate-550 italic">
                      {t.noRulesDescription}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== DB & VALIDATION TAB ==================== */}
        {activeTab === "db_validation" && (
          <div className="space-y-6">
            {/* Existing Tables */}
            <SimpleListEditor
              title={language === "en" ? "Existing Tables to Reuse" : "Các Bảng Dữ liệu Tái sử dụng"}
              placeholder="e.g. users, user_roles"
              items={activeNode.dbExistingTables || []}
              onAdd={(text) => updateNode(activeNode.id, { dbExistingTables: [...(activeNode.dbExistingTables || []), text] })}
              onRemove={(idx) => updateNode(activeNode.id, { dbExistingTables: (activeNode.dbExistingTables || []).filter((_, i) => i !== idx) })}
              language={language}
              required={false}
            />

            {/* SQL Schema Textarea */}
            <div className="space-y-1.5">
              <FieldLabel text={language === "en" ? "New Tables / Fields Required (SQL)" : "Các Bảng / Trường dữ liệu mới (SQL)"} required={false} language={language} />
              <textarea
                value={activeNode.dbNewTablesSql || ""}
                onChange={(e) => updateNode(activeNode.id, { dbNewTablesSql: e.target.value })}
                rows={8}
                placeholder={`-- Example:\nCREATE TABLE refresh_tokens (\n  id uuid PRIMARY KEY,\n  token_hash text NOT NULL\n);`}
                className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono rounded-lg p-3 focus:border-indigo-500 focus:outline-none placeholder-slate-400 leading-relaxed"
              />
            </div>

            {/* Relationship Rules */}
            <SimpleListEditor
              title={language === "en" ? "Relationship Rules" : "Quy tắc Liên kết / Khóa ngoại"}
              placeholder="e.g. refresh_tokens(user_id) references users(id)"
              items={activeNode.dbRelationships || []}
              onAdd={(text) => updateNode(activeNode.id, { dbRelationships: [...(activeNode.dbRelationships || []), text] })}
              onRemove={(idx) => updateNode(activeNode.id, { dbRelationships: (activeNode.dbRelationships || []).filter((_, i) => i !== idx) })}
              language={language}
              required={false}
            />

            {/* Validation Rules */}
            <TableEditor
              title={language === "en" ? "Field Validation Rules" : "Quy tắc Validation các Trường"}
              fields={[
                { key: "field", label: language === "en" ? "Field" : "Trường dữ liệu", placeholder: "e.g. username" },
                { key: "rule", label: language === "en" ? "Validation Rule" : "Quy tắc check", placeholder: "e.g. Required, length 3-100" },
                { key: "errorMessage", label: language === "en" ? "Error Message" : "Thông báo lỗi", placeholder: "e.g. Username is required" }
              ]}
              items={(activeNode.validationRules || []) as any}
              onAdd={(row) => updateNode(activeNode.id, { validationRules: [...(activeNode.validationRules || []), { field: row.field, rule: row.rule, errorMessage: row.errorMessage }] })}
              onRemove={(idx) => updateNode(activeNode.id, { validationRules: (activeNode.validationRules || []).filter((_, i) => i !== idx) })}
              noItemsLabel={language === "en" ? "No validation rules specified." : "Chưa có quy tắc validation nào."}
              language={language}
              required={false}
            />
          </div>
        )}

        {/* ==================== SECURITY & LOGGING TAB ==================== */}
        {activeTab === "security_logging" && (
          <div className="space-y-6">
            {/* Security Rules */}
            <SimpleListEditor
              title={language === "en" ? "Security Requirements (e.g. rate limit, hash)" : "Yêu cầu Bảo mật"}
              placeholder="e.g. Store only hashed refresh tokens using HMAC SHA256"
              items={activeNode.securityRules || []}
              onAdd={(text) => updateNode(activeNode.id, { securityRules: [...(activeNode.securityRules || []), text] })}
              onRemove={(idx) => updateNode(activeNode.id, { securityRules: (activeNode.securityRules || []).filter((_, i) => i !== idx) })}
              language={language}
              required={false}
            />

            {/* Log Events */}
            <SimpleListEditor
              title={language === "en" ? "Log these events" : "Sự kiện cần Ghi Log / Audit"}
              placeholder="e.g. audit log created on token refresh reuse"
              items={activeNode.logEvents || []}
              onAdd={(text) => updateNode(activeNode.id, { logEvents: [...(activeNode.logEvents || []), text] })}
              onRemove={(idx) => updateNode(activeNode.id, { logEvents: (activeNode.logEvents || []).filter((_, i) => i !== idx) })}
              language={language}
              required={false}
            />

            {/* Sensitive fields not to log */}
            <SimpleListEditor
              title={language === "en" ? "Do not log (Sensitive Personal Data)" : "Không được Ghi Log (Thông tin nhạy cảm)"}
              placeholder="e.g. passwords, accessTokens, refreshTokens"
              items={activeNode.noLogEvents || []}
              onAdd={(text) => updateNode(activeNode.id, { noLogEvents: [...(activeNode.noLogEvents || []), text] })}
              onRemove={(idx) => updateNode(activeNode.id, { noLogEvents: (activeNode.noLogEvents || []).filter((_, i) => i !== idx) })}
              language={language}
              required={false}
            />
          </div>
        )}

        {/* ==================== CONTRACTS & UI TAB ==================== */}
        {activeTab === "contracts_ui" && (
          <div className="space-y-6">
            {/* API Contracts */}
            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
                  <FileSignature className="w-4 h-4 mr-2 text-indigo-650" /> {t.apiContracts}
                </h3>
                <button
                  onClick={() => {
                    const newContract: ContractField = {
                      id: Math.random().toString(36).substring(7),
                      name: language === "en" ? `New API ContractSpec` : `Đặc tả Hợp đồng API mới`,
                      content: "Method: POST\nPath: /api/route\nRequest: {}\nSuccess Response: {}"
                    };
                    updateNode(activeNode.id, { apiContracts: [...(activeNode.apiContracts || []), newContract] });
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded text-[10px] font-semibold flex items-center cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> {t.addSpec}
                </button>
              </div>

              {(!activeNode.apiContracts || activeNode.apiContracts.length === 0) ? (
                <p className="text-xs text-slate-500 italic p-4 bg-white/40 rounded-lg border border-dashed border-slate-200">
                  {t.noSpecs}
                </p>
              ) : (
                <div className="space-y-4">
                  {activeNode.apiContracts.map((c, index) => (
                    <div key={c.id} className="space-y-2 p-3 bg-white border border-slate-200 rounded-lg relative group shadow-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = activeNode.apiContracts.filter((_, idx) => idx !== index);
                          updateNode(activeNode.id, { apiContracts: updated });
                        }}
                        className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 cursor-pointer z-10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div
                        onClick={() => setEditingContract({ type: "api", index, name: c.name, content: c.content })}
                        className="flex items-center justify-between cursor-pointer border-b border-dashed border-slate-200 pb-2 mb-2 pr-8 select-none group/title"
                      >
                        <span className="text-xs font-bold text-slate-800 group-hover/title:text-indigo-650 transition-colors">
                          {c.name}
                        </span>
                        <span className="text-[9px] text-slate-400 group-hover/title:text-indigo-550 transition-colors">
                          {language === "en" ? "Edit in Modal" : "Sửa trong Modal"}
                        </span>
                      </div>

                      <textarea
                        value={c.content}
                        onChange={(e) => {
                          const updated = [...activeNode.apiContracts];
                          updated[index] = { ...c, content: e.target.value };
                          updateNode(activeNode.id, { apiContracts: updated });
                        }}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono rounded px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Integration Points */}
            <TableEditor
              title={language === "en" ? "Integration Points" : "Điểm Tích hợp Hệ thống"}
              fields={[
                { key: "system", label: language === "en" ? "System / Module" : "Hệ thống / Phân hệ", placeholder: "e.g. Frontend, .NET Core API" },
                { key: "responsibility", label: language === "en" ? "Responsibility" : "Nhiệm vụ / Trách nhiệm", placeholder: "e.g. Issue JWT and store token hash" }
              ]}
              items={(activeNode.integrationPoints || []) as any}
              onAdd={(row) => updateNode(activeNode.id, { integrationPoints: [...(activeNode.integrationPoints || []), { system: row.system, responsibility: row.responsibility }] })}
              onRemove={(idx) => updateNode(activeNode.id, { integrationPoints: (activeNode.integrationPoints || []).filter((_, i) => i !== idx) })}
              noItemsLabel={language === "en" ? "No integration points documented." : "Chưa có liên kết tích hợp nào."}
            />

            {/* Frontend UI Behavior */}
            <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {language === "en" ? "Frontend UI Behavior & States" : "Hành vi UI & Các trạng thái Frontend"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <FieldLabel text="Page / View" required={false} language={language} />
                  <input
                    type="text"
                    value={activeNode.uiPage || ""}
                    onChange={(e) => updateNode(activeNode.id, { uiPage: e.target.value })}
                    placeholder="e.g. /login"
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <FieldLabel text="Components Used" required={false} language={language} />
                  <input
                    type="text"
                    value={activeNode.uiComponents || ""}
                    onChange={(e) => updateNode(activeNode.id, { uiComponents: e.target.value })}
                    placeholder="e.g. LoginForm, Button, FormInput"
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <FieldLabel text="Loading State Description" required={false} language={language} />
                  <textarea
                    value={activeNode.uiStateLoading || ""}
                    onChange={(e) => updateNode(activeNode.id, { uiStateLoading: e.target.value })}
                    rows={2}
                    placeholder="e.g. Spinner overlay, disable login button"
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                  />
                </div>
                <div>
                  <FieldLabel text="Empty State Description" required={false} language={language} />
                  <textarea
                    value={activeNode.uiStateEmpty || ""}
                    onChange={(e) => updateNode(activeNode.id, { uiStateEmpty: e.target.value })}
                    rows={2}
                    placeholder="e.g. Show default dashboard message"
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <FieldLabel text="Error State Description" required={false} language={language} />
                  <textarea
                    value={activeNode.uiStateError || ""}
                    onChange={(e) => updateNode(activeNode.id, { uiStateError: e.target.value })}
                    rows={2}
                    placeholder="e.g. Display banner toast warning validation fails"
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                  />
                </div>
                <div>
                  <FieldLabel text="Success State Description" required={false} language={language} />
                  <textarea
                    value={activeNode.uiStateSuccess || ""}
                    onChange={(e) => updateNode(activeNode.id, { uiStateSuccess: e.target.value })}
                    rows={2}
                    placeholder="e.g. Redirect home dashboard, show welcome toast"
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TESTS & DONE TAB ==================== */}
        {activeTab === "tests_done" && (
          <div className="space-y-6">
            {/* Automated Tests */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">{t.testCasesSpec}</h3>
                <button
                  onClick={() => {
                    const newTC: TestCase = {
                      id: Math.random().toString(36).substring(7),
                      title: language === "en" ? "Verify standard flow" : "Xác minh luồng chuẩn",
                      type: "unit",
                      precondition: "",
                      steps: [""],
                      expectedResult: "",
                      status: "not_started"
                    };
                    addTestCase(activeNode.id, newTC);
                  }}
                  className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-755 border border-indigo-500/20 text-white rounded-lg text-xs font-semibold flex items-center cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> {t.addTestCase}
                </button>
              </div>

              <div className="space-y-4">
                {(!activeNode.testCases || activeNode.testCases.length === 0) ? (
                  <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                    <p className="text-xs text-slate-500 italic">{t.noTests}</p>
                    <p className="text-[11px] text-slate-550 max-w-xs mx-auto">
                      {t.leafRequiresTests}
                    </p>
                  </div>
                ) : (
                  activeNode.testCases.map((tc) => (
                    <div key={tc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative shadow-xs">
                      <button
                        onClick={() => removeTestCase(activeNode.id, tc.id)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 cursor-pointer z-10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div
                        onClick={() => setEditingTestCase({ ...tc })}
                        className="flex items-center justify-between cursor-pointer border-b border-dashed border-slate-200 pb-2 pr-8 select-none group/title"
                      >
                        <span className="text-xs font-bold text-slate-800 group-hover/title:text-indigo-650 transition-colors">
                          {tc.title || (language === "en" ? "(Untitled Test)" : "(Chưa đặt tên kịch bản)")}
                        </span>
                        <span className="text-[9px] text-slate-400 group-hover/title:text-indigo-550 transition-colors flex items-center gap-0.5 font-medium">
                          {language === "en" ? "Edit in Modal" : "Sửa trong Modal"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pr-8">
                        <div className="md:col-span-2">
                          <FieldLabel text={t.testTitle} required={true} language={language} />
                          <input
                            type="text"
                            value={tc.title}
                            onChange={(e) => updateTestCase(activeNode.id, tc.id, { title: e.target.value })}
                            className="w-full bg-white border border-slate-250 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <FieldLabel text={t.testType} required={true} language={language} />
                          <select
                            value={tc.type}
                            onChange={(e) => updateTestCase(activeNode.id, tc.id, { type: e.target.value as any })}
                            className="w-full bg-white border border-slate-250 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="unit">Unit</option>
                            <option value="integration">Integration</option>
                            <option value="api">API Contract</option>
                            <option value="e2e">E2E Flow</option>
                            <option value="manual">Manual QA</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <FieldLabel text={t.precondition} required={false} language={language} />
                          <input
                            type="text"
                            value={tc.precondition || ""}
                            onChange={(e) => updateTestCase(activeNode.id, tc.id, { precondition: e.target.value })}
                            placeholder={t.preconditionPlaceholder}
                            className="w-full bg-white border border-slate-250 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400"
                          />
                        </div>

                        <div>
                          <FieldLabel text={t.status} required={true} language={language} />
                          <select
                            value={tc.status}
                            onChange={(e) => updateTestCase(activeNode.id, tc.id, { status: e.target.value as any })}
                            className="w-full bg-white border border-slate-250 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="not_started">Not Started</option>
                            <option value="passed">Passed</option>
                            <option value="failed">Failed</option>
                            <option value="blocked">Blocked</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5 select-none">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.steps}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9.5px] px-1.5 py-0.2 rounded font-medium lowercase tracking-normal normal-case border bg-slate-100 text-slate-450 border-slate-200">
                              {language === "en" ? "optional" : "tùy chọn"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const steps = [...(tc.steps || []), ""];
                                updateTestCase(activeNode.id, tc.id, { steps });
                              }}
                              className="text-indigo-650 hover:text-indigo-700 text-[10px] font-bold flex items-center cursor-pointer"
                            >
                              {t.addStep}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {(tc.steps || []).map((step, sIdx) => (
                            <div key={sIdx} className="flex items-center space-x-2">
                              <span className="text-[10px] text-slate-400 font-mono w-4 shrink-0">{sIdx + 1}.</span>
                              <input
                                type="text"
                                value={step}
                                onChange={(e) => {
                                  const steps = [...(tc.steps || [])];
                                  steps[sIdx] = e.target.value;
                                  updateTestCase(activeNode.id, tc.id, { steps });
                                }}
                                placeholder={`${t.stepPlaceholder} ${sIdx + 1}`}
                                className="flex-1 bg-white border border-slate-250 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none"
                              />
                              {tc.steps!.length > 1 && (
                                <button
                                  onClick={() => {
                                    const steps = tc.steps!.filter((_, i) => i !== sIdx);
                                    updateTestCase(activeNode.id, tc.id, { steps });
                                  }}
                                  className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                >
                                  &times;
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <FieldLabel text={t.expectedResult} required={false} language={language} />
                        <textarea
                          value={tc.expectedResult}
                          onChange={(e) => updateTestCase(activeNode.id, tc.id, { expectedResult: e.target.value })}
                          rows={2}
                          placeholder={t.expectedResultPlaceholder}
                          className="w-full bg-white border border-slate-250 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Acceptance / Done Criteria */}
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">{t.doneCriteriaChecklist}</h3>
                <button
                  onClick={handleAddDefaultDoneCriteria}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-55 text-slate-650 rounded-lg text-xs font-semibold flex items-center cursor-pointer shadow-xs"
                >
                  {t.populateStandard}
                </button>
              </div>

              <form onSubmit={handleAddCriterion} className="flex space-x-2">
                <input
                  type="text"
                  value={newCriterion}
                  onChange={(e) => setNewCriterion(e.target.value)}
                  placeholder={t.newCriterionPlaceholder}
                  className="flex-1 bg-slate-55 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-755 border border-indigo-500/20 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center shadow-xs"
                >
                  <Plus className="w-4 h-4 mr-1" /> {t.add}
                </button>
              </form>

              <div className="space-y-2">
                {(!activeNode.doneCriteria || activeNode.doneCriteria.length === 0) ? (
                  <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-1">
                    <p className="text-xs text-slate-550 italic">{t.noDoneCriteria}</p>
                    <p className="text-[11px] text-slate-500">{t.clickPopulate}</p>
                  </div>
                ) : (
                  activeNode.doneCriteria.map((dc) => (
                    <div
                      key={dc.id}
                      className={`flex items-start p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors border-dashed group shadow-xs`}
                    >
                      <div
                        onClick={() => toggleDoneCriterion(activeNode.id, dc.id)}
                        className="flex items-center h-5 mr-3 flex-shrink-0 cursor-pointer select-none"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${dc.checked
                            ? "bg-indigo-650 border-indigo-500 text-white"
                            : "border-slate-300 hover:border-slate-400"
                          }`}>
                          {dc.checked && <Check className="w-3 h-3 stroke-[3px]" />}
                        </div>
                      </div>

                      <p
                        onClick={() => setEditingCriterion({ id: dc.id, content: dc.content })}
                        className={`text-xs flex-1 pr-4 leading-relaxed cursor-pointer hover:text-indigo-600 transition-colors select-none ${dc.checked ? "text-slate-400 line-through" : "text-slate-700"}`}
                        title={language === "en" ? "Click to edit text" : "Nhấp để chỉnh sửa nội dung"}
                      >
                        {dc.content}
                      </p>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = activeNode.doneCriteria!.filter(x => x.id !== dc.id);
                          updateNode(activeNode.id, { doneCriteria: updated });
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== AI EXPORT TAB ==================== */}
        {activeTab === "export" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scope Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t.selectScope}</label>
                <div className="grid grid-cols-3 bg-slate-100 border border-slate-200 rounded-lg p-1">
                  {(["node", "subtree", "project"] as const).map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => setExportScope(scope)}
                      className={`py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${exportScope === scope
                          ? "bg-white text-indigo-650 shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      {scope === "node" ? t.singleNodeScope : scope === "subtree" ? t.subtreeScope : t.projectScope}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t.exportMode}</label>
                <div className="grid grid-cols-3 bg-slate-100 border border-slate-200 rounded-lg p-1">
                  {(["ai", "human", "qa"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setExportMode(mode)}
                      className={`py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${exportMode === mode
                          ? "bg-white text-indigo-650 shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      {mode === "ai" ? t.aiMode : mode === "human" ? t.humanMode : t.qaMode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-755 border border-indigo-500/20 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center shadow-md shadow-indigo-150"
              >
                <Clipboard className="w-4 h-4 mr-2" />
                {copied ? t.copied : t.copyClipboard}
              </button>
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center shadow-xs"
              >
                <Download className="w-4 h-4 mr-2" /> {t.downloadMarkdown}
              </button>
            </div>

            {/* Markdown Preview container */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.markdownPreview}</label>
              <div className="w-full max-h-[380px] bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-y-auto font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-text shadow-inner">
                {generatedMarkdown}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ==================== MODALS ==================== */}

      {/* Contract Edit Modal */}
      {editingContract && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {language === "en" ? "Edit Specification Contract" : "Chỉnh sửa Hợp đồng Đặc tả"}
              </h3>
              <button
                onClick={() => setEditingContract(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  {language === "en" ? "Title / Path" : "Tiêu đề / Đường dẫn"}
                </label>
                <input
                  type="text"
                  value={editingContract.name}
                  onChange={(e) => setEditingContract({ ...editingContract, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  {language === "en" ? "Specification Content" : "Nội dung Đặc tả"}
                </label>
                <textarea
                  value={editingContract.content}
                  onChange={(e) => setEditingContract({ ...editingContract, content: e.target.value })}
                  rows={12}
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-850 font-mono rounded-lg p-3 focus:border-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-2">
              <button
                onClick={() => setEditingContract(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                {language === "en" ? "Cancel" : "Hủy"}
              </button>
              <button
                onClick={() => {
                  const key = `${editingContract.type}Contracts` as "apiContracts" | "uiContracts" | "dataContracts";
                  const currentList = activeNode[key] || [];
                  const updated = [...currentList];
                  updated[editingContract.index] = {
                    ...updated[editingContract.index],
                    name: editingContract.name,
                    content: editingContract.content
                  };
                  updateNode(activeNode.id, { [key]: updated });
                  setEditingContract(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                {language === "en" ? "Save Changes" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Case Edit Modal */}
      {editingTestCase && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {language === "en" ? "Edit Test Case" : "Chỉnh sửa Kịch bản Kiểm thử"}
              </h3>
              <button
                onClick={() => setEditingTestCase(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {/* Title and Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {t.testTitle}
                  </label>
                  <input
                    type="text"
                    value={editingTestCase.title}
                    onChange={(e) => setEditingTestCase({ ...editingTestCase, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {t.testType}
                  </label>
                  <select
                    value={editingTestCase.type}
                    onChange={(e) => setEditingTestCase({ ...editingTestCase, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="unit">Unit</option>
                    <option value="integration">Integration</option>
                    <option value="api">API Contract</option>
                    <option value="e2e">E2E Flow</option>
                    <option value="manual">Manual QA</option>
                  </select>
                </div>
              </div>

              {/* Precondition and Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {t.precondition}
                  </label>
                  <input
                    type="text"
                    value={editingTestCase.precondition || ""}
                    onChange={(e) => setEditingTestCase({ ...editingTestCase, precondition: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {t.status}
                  </label>
                  <select
                    value={editingTestCase.status}
                    onChange={(e) => setEditingTestCase({ ...editingTestCase, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>

              {/* Steps */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {t.stepsLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditingTestCase({ ...editingTestCase, steps: [...(editingTestCase.steps || []), ""] })}
                    className="text-[10px] text-indigo-650 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    + {language === "en" ? "Add Step" : "Thêm bước"}
                  </button>
                </div>
                <div className="space-y-2">
                  {(editingTestCase.steps || []).map((step, sIdx) => (
                    <div key={sIdx} className="flex gap-2 items-center">
                      <span className="text-xs text-slate-400 font-semibold w-4">{sIdx + 1}.</span>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => {
                          const newSteps = [...editingTestCase.steps];
                          newSteps[sIdx] = e.target.value;
                          setEditingTestCase({ ...editingTestCase, steps: newSteps });
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-850 text-xs focus:border-indigo-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSteps = editingTestCase.steps.filter((_, idx) => idx !== sIdx);
                          setEditingTestCase({ ...editingTestCase, steps: newSteps });
                        }}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Result */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  {t.expectedResult}
                </label>
                <textarea
                  value={editingTestCase.expectedResult || ""}
                  onChange={(e) => setEditingTestCase({ ...editingTestCase, expectedResult: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-850 rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-2">
              <button
                onClick={() => setEditingTestCase(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                {language === "en" ? "Cancel" : "Hủy"}
              </button>
              <button
                onClick={() => {
                  const currentList = activeNode.testCases || [];
                  const updated = currentList.map(item => {
                    if (item.id === editingTestCase.id) {
                      return { ...editingTestCase };
                    }
                    return item;
                  });
                  updateNode(activeNode.id, { testCases: updated });
                  setEditingTestCase(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                {language === "en" ? "Save Changes" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Done Criterion Edit Modal */}
      {editingCriterion && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {language === "en" ? "Edit Acceptance Criterion" : "Chỉnh sửa Tiêu chí Nghiệm thu"}
              </h3>
              <button
                onClick={() => setEditingCriterion(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  {language === "en" ? "Criterion Content" : "Nội dung Tiêu chí"}
                </label>
                <textarea
                  value={editingCriterion.content}
                  onChange={(e) => setEditingCriterion({ ...editingCriterion, content: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-850 rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-2">
              <button
                onClick={() => setEditingCriterion(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                {language === "en" ? "Cancel" : "Hủy"}
              </button>
              <button
                onClick={() => {
                  const currentList = activeNode.doneCriteria || [];
                  const updated = currentList.map(item => {
                    if (item.id === editingCriterion.id) {
                      return { ...item, content: editingCriterion.content };
                    }
                    return item;
                  });
                  updateNode(activeNode.id, { doneCriteria: updated });
                  setEditingCriterion(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                {language === "en" ? "Save Changes" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

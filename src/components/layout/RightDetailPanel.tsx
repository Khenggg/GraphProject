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
import { getEffectiveRules, isNodeAiReady } from "../../domain/inheritance.utils";
import { 
  formatSingleNodeMarkdown, 
  formatSubtreeMarkdown, 
  formatProjectMarkdown 
} from "../../domain/export.utils";
import { translations } from "../../domain/localization";

type TabType = "overview" | "rules" | "contracts" | "tests" | "done" | "export";

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
  
  // AI Export tab selections
  const [exportScope, setExportScope] = React.useState<"node" | "subtree" | "project">("node");
  const [exportMode, setExportMode] = React.useState<"human" | "ai" | "qa">("ai");
  const [copied, setCopied] = React.useState(false);

  const t = translations[language];

  // Get active node
  const activeNode = React.useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, nodes]);

  // Clean local state on node change
  React.useEffect(() => {
    setNewRule("");
    setNewCriterion("");
    setCopied(false);
  }, [selectedNodeId]);

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

  // Markdown builder
  const generatedMarkdown = React.useMemo(() => {
    if (exportScope === "node") {
      return formatSingleNodeMarkdown(activeNode, nodes, exportMode);
    } else if (exportScope === "subtree") {
      return formatSubtreeMarkdown(activeNode.id, nodes, exportMode);
    } else {
      return formatProjectMarkdown(nodes, exportMode);
    }
  }, [activeNode, nodes, exportScope, exportMode]);

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
              {language === "en" ? activeNode.type.replace("_", " ") : activeNode.type === "leaf_feature" ? "feature lá" : activeNode.type === "sub_feature" ? "sub feature" : activeNode.type === "project" ? "dự án gốc" : activeNode.type === "category" ? "danh mục" : "feature"}
            </span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
              readiness.isReady 
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
        {(["overview", "rules", "contracts", "tests", "done", "export"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-xs font-semibold border-b-2 capitalize whitespace-nowrap cursor-pointer transition-all-200 ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-650 bg-indigo-50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
            }`}
          >
            {tab === "overview" && (language === "en" ? "Overview" : "Tổng quan")}
            {tab === "rules" && (language === "en" ? "Rules" : "Luật nghiệp vụ")}
            {tab === "contracts" && (language === "en" ? "Contracts" : "Hợp đồng")}
            {tab === "tests" && (language === "en" ? "Tests" : "Kịch bản Test")}
            {tab === "done" && (language === "en" ? "Done Criteria" : "Tiêu chí Hoàn thành")}
            {tab === "export" && (language === "en" ? "AI Export" : "Xuất Prompt AI")}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-6 bg-white">
        
        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t.nodeType}</label>
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
                </select>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t.status}</label>
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

              {/* Priority Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t.priority}</label>
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
            </div>

            {/* Client Assignment */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t.assignedClients}</label>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                {(["Admin", "Manager", "Staff", "Driver", "Guest", "System"] as ClientType[]).map((client) => {
                  const assigned = activeNode.clients?.includes(client);
                  return (
                    <button
                      key={client}
                      type="button"
                      onClick={() => {
                        const nextClients = assigned
                          ? activeNode.clients.filter(c => c !== client)
                          : [...(activeNode.clients || []), client];
                        updateNode(activeNode.id, { clients: nextClients });
                      }}
                      className={`px-3 py-1 text-xs rounded-full border transition-all duration-150 cursor-pointer ${
                        assigned
                          ? "bg-indigo-50 text-indigo-650 border-indigo-250 font-semibold"
                          : "bg-white text-slate-500 border-slate-200 hover:text-slate-850 hover:border-slate-300"
                      }`}
                    >
                      {client}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t.summaryLabel}</label>
              <textarea
                value={activeNode.summary || ""}
                onChange={(e) => updateNode(activeNode.id, { summary: e.target.value })}
                rows={3}
                placeholder={t.summaryPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:outline-none placeholder-slate-400"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t.tagsLabel}</label>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dependencies */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t.dependenciesLabel}</label>
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
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t.risksLabel}</label>
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

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t.notesLabel}</label>
              <textarea
                value={activeNode.notes || ""}
                onChange={(e) => updateNode(activeNode.id, { notes: e.target.value })}
                rows={2}
                placeholder={t.notesPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:outline-none placeholder-slate-400"
              />
            </div>
          </div>
        )}

        {/* ==================== RULES TAB ==================== */}
        {activeTab === "rules" && (
          <div className="space-y-6">
            
            {/* Local Rules Editor */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2 text-indigo-650" /> {t.localBusinessRules}
              </h3>
              
              {/* Form to add a rule */}
              <form onSubmit={handleAddRule} className="flex space-x-2">
                <input
                  type="text"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  placeholder={t.newRulePlaceholder}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-755 border border-indigo-500/20 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center shadow-xs"
                >
                  <Plus className="w-4 h-4 mr-1" /> {t.add}
                </button>
              </form>

              {/* Local rules list */}
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

            {/* Effective Rules Panel */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
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
        )}

        {/* ==================== CONTRACTS TAB ==================== */}
        {activeTab === "contracts" && (
          <div className="space-y-6">
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.contractsDescription}
            </p>

            {(["api", "ui", "data"] as const).map((type) => {
              const key = `${type}Contracts` as "apiContracts" | "uiContracts" | "dataContracts";
              const label = type === "api" ? t.apiContracts : type === "ui" ? t.uiContracts : t.dataContracts;
              const placeholder = type === "api" 
                ? "e.g. POST /api/auth/login\nRequest: { email, password }\nResponse: { token, user }"
                : type === "ui"
                  ? "e.g. Sign in Form Layout:\n- Email input (required, validation email format)\n- Password input (required, secret mask)\n- Forgot password link"
                  : "e.g. Schema User:\n- id (uuid, primary key)\n- email (string, unique)\n- passwordHash (string)";

              const contracts = activeNode[key] || [];

              return (
                <div key={type} className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
                      <FileSignature className="w-4 h-4 mr-2 text-indigo-650" /> {label}
                    </h3>
                    <button
                      onClick={() => {
                        const newContract: ContractField = {
                          id: Math.random().toString(36).substring(7),
                          name: language === "en" ? `New Contract Spec` : `Đặc tả Hợp đồng mới`,
                          content: ""
                        };
                        updateNode(activeNode.id, { [key]: [...contracts, newContract] });
                      }}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded text-[10px] font-semibold flex items-center cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> {t.addSpec}
                    </button>
                  </div>

                  {contracts.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-4 bg-white/40 rounded-lg border border-dashed border-slate-200">
                      {t.noSpecs}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {contracts.map((c, index) => (
                        <div key={c.id} className="space-y-2 p-3 bg-white border border-slate-200 rounded-lg relative group shadow-xs">
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = contracts.filter((_, idx) => idx !== index);
                              updateNode(activeNode.id, { [key]: updated });
                            }}
                            className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title={language === "en" ? "Remove specification" : "Xóa đặc tả"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Name */}
                          <div>
                            <input
                              type="text"
                              value={c.name}
                              onChange={(e) => {
                                const updated = [...contracts];
                                updated[index] = { ...c, name: e.target.value };
                                updateNode(activeNode.id, { [key]: updated });
                              }}
                              className="bg-transparent border-b border-dashed border-slate-350 hover:border-slate-550 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 pb-0.5"
                            />
                          </div>

                          {/* Edit Content */}
                          <div>
                            <textarea
                              value={c.content}
                              onChange={(e) => {
                                const updated = [...contracts];
                                updated[index] = { ...c, content: e.target.value };
                                updateNode(activeNode.id, { [key]: updated });
                              }}
                              rows={4}
                              placeholder={placeholder}
                              className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono rounded px-2.5 py-2 focus:border-indigo-500 focus:outline-none placeholder-slate-400 leading-relaxed"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ==================== TESTS TAB ==================== */}
        {activeTab === "tests" && (
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
                    {/* Delete button */}
                    <button
                      onClick={() => removeTestCase(activeNode.id, tc.id)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title={language === "en" ? "Remove test case" : "Xóa kịch bản"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Test details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pr-8">
                      {/* Title */}
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">{t.testTitle}</label>
                        <input
                          type="text"
                          value={tc.title}
                          onChange={(e) => updateTestCase(activeNode.id, tc.id, { title: e.target.value })}
                          className="w-full bg-white border border-slate-250 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Type */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">{t.testType}</label>
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
                      {/* Precondition */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">{t.precondition}</label>
                        <input
                          type="text"
                          value={tc.precondition || ""}
                          onChange={(e) => updateTestCase(activeNode.id, tc.id, { precondition: e.target.value })}
                          placeholder={t.preconditionPlaceholder}
                          className="w-full bg-white border border-slate-250 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400"
                        />
                      </div>

                      {/* Test Status */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">{t.status}</label>
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

                    {/* Steps list */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-505 uppercase mb-1 flex justify-between items-center">
                        <span>{t.steps}</span>
                        <button
                          onClick={() => {
                            const steps = [...(tc.steps || []), ""];
                            updateTestCase(activeNode.id, tc.id, { steps });
                          }}
                          className="text-indigo-650 hover:text-indigo-700 text-[9px] font-bold flex items-center cursor-pointer"
                        >
                          {t.addStep}
                        </button>
                      </label>
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

                    {/* Expected Result */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-550 uppercase mb-1">{t.expectedResult}</label>
                      <textarea
                        value={tc.expectedResult}
                        onChange={(e) => updateTestCase(activeNode.id, tc.id, { expectedResult: e.target.value })}
                        rows={2}
                        placeholder={t.expectedResultPlaceholder}
                        className="w-full bg-white border border-slate-250 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 leading-relaxed"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================== DONE CRITERIA TAB ==================== */}
        {activeTab === "done" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">{t.doneCriteriaChecklist}</h3>
              <button
                onClick={handleAddDefaultDoneCriteria}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold flex items-center cursor-pointer shadow-xs"
              >
                {t.populateStandard}
              </button>
            </div>
            
            {/* Form to add a criteria */}
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

            {/* Checklist */}
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
                    onClick={() => toggleDoneCriterion(activeNode.id, dc.id)}
                    className={`flex items-start p-3 bg-slate-55 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer select-none group shadow-xs`}
                  >
                    <div className="flex items-center h-5 mr-3 flex-shrink-0">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        dc.checked 
                          ? "bg-indigo-650 border-indigo-500 text-white" 
                          : "border-slate-300 hover:border-slate-405"
                      }`}>
                        {dc.checked && <Check className="w-3 h-3 stroke-[3px]" />}
                      </div>
                    </div>
                    
                    <p className={`text-xs flex-1 pr-4 leading-relaxed ${dc.checked ? "text-slate-400 line-through" : "text-slate-700"}`}>
                      {dc.content}
                    </p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = activeNode.doneCriteria!.filter(x => x.id !== dc.id);
                        updateNode(activeNode.id, { doneCriteria: updated });
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer flex-shrink-0"
                      title={language === "en" ? "Delete criterion" : "Xóa tiêu chí"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
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
                      className={`py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                        exportScope === scope
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
                      className={`py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                        exportMode === mode
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
    </div>
  );
}

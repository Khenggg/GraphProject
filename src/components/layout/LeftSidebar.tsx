import React from "react";
import { 
  Trash2, 
  FileJson, 
  Upload, 
  Users, 
  Plus, 
  FolderGit2,
  FileCode2
} from "lucide-react";
import { useFeatureTreeStore } from "../../store/featureTreeStore";
import { translations } from "../../domain/localization";
import ProjectInitializerButton from "../sidebar/ProjectInitializerButton";
import { getProjectRoleRegistry } from "../../domain/taxonomy";
import { CURRENT_PROJECT_VERSION, parseProjectBackup } from "../../domain/projectBackup";

export default function LeftSidebar() {
  const {
    projects,
    selectedProjectId,
    selectProject,
    createNewProject,
    deleteProject,
    nodes,
    selectedClientFilter,
    setClientFilter,
    importTree,
    exportTree,
    language,
    setLanguage
  } = useFeatureTreeStore();

  const [showNewProjectForm, setShowNewProjectForm] = React.useState(false);
  const [projName, setProjName] = React.useState("");
  const [projDesc, setProjDesc] = React.useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const t = translations[language];

  const clientRoles = React.useMemo(() => getProjectRoleRegistry(nodes), [nodes]);

  // Compute count of features for each client role
  const clientCounts = React.useMemo(() => {
    const counts = Object.fromEntries(clientRoles.map(role => [role, 0])) as Record<string, number>;
    nodes.forEach(node => {
      if (node.clients) {
        node.clients.forEach(c => {
          if (counts[c] !== undefined) {
            counts[c]++;
          }
        });
      }
    });
    return counts;
  }, [clientRoles, nodes]);

  const activeProject = React.useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;
    await createNewProject(projName.trim(), projDesc.trim());
    setProjName("");
    setProjDesc("");
    setShowNewProjectForm(false);
  };

  // Export full project JSON
  const handleExportJson = () => {
    if (!activeProject) return;
    const data = {
      version: CURRENT_PROJECT_VERSION,
      projectName: activeProject.name,
      projectDescription: activeProject.description,
      clients: clientRoles.map(name => ({ id: name, name })),
      nodes: exportTree()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeProject.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_backup.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import project JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = parseProjectBackup(JSON.parse(event.target?.result as string));
        const data = parsed.data;
        if (!data.projectName || !Array.isArray(data.nodes)) {
          const errMsg = language === "en" 
            ? "Invalid backup JSON structure. Make sure 'projectName' and 'nodes' array are present."
            : "Cấu trúc JSON sao lưu không hợp lệ. Đảm bảo có 'projectName' và mảng 'nodes'.";
          alert(errMsg);
          return;
        }
        await importTree(
          data.projectName,
          data.projectDescription || "",
          data.clients || [],
          data.nodes
        );
        const successMsg = language === "en"
          ? `Successfully imported project "${data.projectName}" with ${data.nodes.length} features!`
          : `Nhập thành công dự án "${data.projectName}" với ${data.nodes.length} feature!`;
        alert(successMsg);
      } catch {
        const parseErrMsg = language === "en" ? "Failed to parse JSON file." : "Không thể phân tích file JSON.";
        alert(parseErrMsg);
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = "";
  };

  return (
    <div className="w-80 border-r border-slate-200 bg-slate-50 p-4 flex flex-col space-y-6 overflow-y-auto select-none">
      
      {/* Brand Logo & Language Switcher */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-650 flex items-center justify-center border border-indigo-400/20 shadow-md shadow-indigo-100">
            <FileCode2 className="w-5 h-5 text-indigo-50" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 tracking-wide">{t.brandTitle}</h1>
            <p className="text-[10px] text-slate-550 font-medium">{t.brandSubtitle}</p>
          </div>
        </div>

        {/* Language Switcher Toggle */}
        <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-250 shrink-0">
          <button
            onClick={() => setLanguage("en")}
            className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md cursor-pointer transition-all ${
              language === "en" ? "bg-white text-indigo-650 shadow-xs" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("vi")}
            className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md cursor-pointer transition-all ${
              language === "vi" ? "bg-white text-indigo-650 shadow-xs" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            VI
          </button>
        </div>
      </div>

      {/* Projects Manager */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.workspaceProjects}</label>
          <button
            onClick={() => setShowNewProjectForm(!showNewProjectForm)}
            className="w-5 h-5 rounded hover:bg-slate-200 text-indigo-650 hover:text-indigo-700 flex items-center justify-center cursor-pointer transition-colors"
            title={t.createNewProject}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {showNewProjectForm && (
          <form onSubmit={handleCreateProject} className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
            <div>
              <input
                type="text"
                placeholder={t.projectNamePlaceholder}
                required
                value={projName}
                onChange={(e) => setProjName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400"
              />
            </div>
            <div>
              <textarea
                placeholder={t.projectDescPlaceholder}
                value={projDesc}
                onChange={(e) => setProjDesc(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNewProjectForm(false)}
                className="px-2.5 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-750 text-white rounded text-[10px] font-bold cursor-pointer"
              >
                {t.create}
              </button>
            </div>
          </form>
        )}

        {/* Project Selector dropdown list */}
        <div className="space-y-1.5">
          {projects.map((proj) => {
            const isSelected = proj.id === selectedProjectId;
            return (
              <div 
                key={proj.id} 
                className={`group flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? "bg-white border-slate-200 text-indigo-650 shadow-sm font-bold" 
                    : "bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
                onClick={() => selectProject(proj.id)}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <FolderGit2 className={`w-4 h-4 shrink-0 ${isSelected ? "text-indigo-650" : "text-slate-400"}`} />
                  <span className="text-xs font-semibold truncate leading-none">{proj.name}</span>
                </div>

                {/* Delete project button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const confirmMsg = language === "en"
                      ? `Are you sure you want to delete project "${proj.name}"? This deletes all feature trees stored locally.`
                      : `Bạn có chắc chắn muốn xóa dự án "${proj.name}"? Thao tác này sẽ xóa toàn bộ cây feature của dự án này ở local.`;
                    if (confirm(confirmMsg)) {
                      deleteProject(proj.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 cursor-pointer p-0.5 rounded transition-opacity"
                  title="Delete project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {projects.length === 0 && !showNewProjectForm && (
            <p className="text-xs text-slate-500 italic text-center py-4 bg-slate-100/50 rounded-xl border border-dashed border-slate-200">
              {t.noProjectsYet}
            </p>
          )}
        </div>
      </div>

      {/* Quick Seeds */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{t.templatesQuickLoad}</label>
        <ProjectInitializerButton />
      </div>

      {/* Client List Quick Filters */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{t.clientRoleMetrics}</label>
        <div className="space-y-1">
          {/* ALL Filter */}
          <div
            onClick={() => setClientFilter("ALL")}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
              selectedClientFilter === "ALL"
                ? "bg-white border-slate-200 text-indigo-650 shadow-sm font-bold"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span>{t.allClients}</span>
            </div>
            <span className="text-[10px] text-slate-600 font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-full">
              {nodes.length}
            </span>
          </div>

          {/* Client lists */}
          {clientRoles.map((client) => {
            const count = clientCounts[client] || 0;
            const isSelected = selectedClientFilter === client;
            return (
              <div
                key={client}
                onClick={() => setClientFilter(client)}
                className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
                  isSelected
                    ? "bg-white border-slate-200 text-indigo-650 shadow-sm font-bold"
                    : "border-transparent text-slate-655 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>{client}</span>
                </div>
                <span className="text-[10px] text-slate-600 font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-full">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* JSON Import/Export Backup */}
      <div className="mt-auto pt-4 border-t border-slate-200 space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{t.localBackup}</label>
        <div className="grid grid-cols-2 gap-2">
          {/* Export JSON */}
          <button
            type="button"
            disabled={!selectedProjectId}
            onClick={handleExportJson}
            className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 text-slate-650 hover:text-slate-950 disabled:opacity-40 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>{t.exportJson}</span>
          </button>

          {/* Import JSON */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 text-slate-650 hover:text-slate-950 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t.importJson}</span>
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJson}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

    </div>
  );
}

# Project Map

> Generated: 2026-07-17 16:44:52
> Generator: `scripts/export-project-map.ps1`

This file contains the project architecture and a direct source-code snapshot. The snapshot is generated from the source tree and filtered by `projectmapignore`.

## Architecture

- Runtime: React + TypeScript + Vite, client-only.
- State: Zustand in `src/store/featureTreeStore.ts`.
- Local persistence: Dexie/IndexedDB in `src/db/dexieDb.ts`.
- Domain logic: types, tree reconstruction, inheritance/readiness and Markdown export under `src/domain/`.
- UI: layout, sidebar, tree and detail editors under `src/components/`.
- Seed data: `src/seed/parkingBuildingSeed.ts`.
- Included source files: 31.

```text
src/main.tsx -> src/App.tsx
  -> components/layout/LeftSidebar.tsx
  -> components/tree/TreeToolbar.tsx
  -> components/tree/FeatureTree.tsx
  -> components/layout/RightDetailPanel.tsx
  -> store/featureTreeStore.ts -> db/dexieDb.ts -> IndexedDB
```

## Code File Index

| File | Bytes |
| --- | ---: |
| `src/App.css` | 3075 |
| `src/App.tsx` | 2162 |
| `src/components/common/ConfirmDialog.tsx` | 2982 |
| `src/components/common/Toast.tsx` | 1000 |
| `src/components/layout/LeftSidebar.tsx` | 14922 |
| `src/components/layout/RightDetailPanel.tsx` | 103225 |
| `src/components/sidebar/ProjectInitializerButton.tsx` | 3446 |
| `src/components/tree/FeatureTree.tsx` | 8782 |
| `src/components/tree/FeatureTreeNode.tsx` | 12728 |
| `src/components/tree/TreeToolbar.tsx` | 4865 |
| `src/db/dexieDb.ts` | 539 |
| `src/domain/export.utils.ts` | 16501 |
| `src/domain/featureNode.types.ts` | 2732 |
| `src/domain/featureNodeFactory.ts` | 3840 |
| `src/domain/inheritance.utils.ts` | 3637 |
| `src/domain/localization.ts` | 12043 |
| `src/domain/projectBackup.ts` | 6002 |
| `src/domain/taxonomy.ts` | 8301 |
| `src/index.css` | 1592 |
| `src/main.tsx` | 240 |
| `src/seed/parkingBuildingSeed.ts` | 179773 |
| `src/seed/parkingTaxonomyMigration.ts` | 26983 |
| `src/store/featureTreeStore.ts` | 24426 |
| `src/tests/aiExport.test.ts` | 1952 |
| `src/tests/export.test.ts` | 2726 |
| `src/tests/featureTreeStore.test.ts` | 3279 |
| `src/tests/inheritance.test.ts` | 3534 |
| `src/tests/parkingBuildingSeed.test.ts` | 4361 |
| `src/tests/projectBackup.test.ts` | 1036 |
| `src/tests/taxonomy.test.ts` | 1801 |
| `src/tests/treeActions.test.ts` | 5686 |

## Direct Source Code

### `src/App.css`

`````css
.counter {
  font-size: 16px;
  padding: 5px 10px;
  border-radius: 5px;
  color: var(--accent);
  background: var(--accent-bg);
  border: 2px solid transparent;
  transition: border-color 0.3s;
  margin-bottom: 24px;

  &:hover {
    border-color: var(--accent-border);
  }
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.hero {
  position: relative;

  .base,
  .framework,
  .vite {
    inset-inline: 0;
    margin: 0 auto;
  }

  .base {
    width: 170px;
    position: relative;
    z-index: 0;
  }

  .framework,
  .vite {
    position: absolute;
  }

  .framework {
    z-index: 1;
    top: 34px;
    height: 28px;
    transform: perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg)
      scale(1.4);
  }

  .vite {
    z-index: 0;
    top: 107px;
    height: 26px;
    width: auto;
    transform: perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg)
      scale(0.8);
  }
}

#center {
  display: flex;
  flex-direction: column;
  gap: 25px;
  place-content: center;
  place-items: center;
  flex-grow: 1;

  @media (max-width: 1024px) {
    padding: 32px 20px 24px;
    gap: 18px;
  }
}

#next-steps {
  display: flex;
  border-top: 1px solid var(--border);
  text-align: left;

  & > div {
    flex: 1 1 0;
    padding: 32px;
    @media (max-width: 1024px) {
      padding: 24px 20px;
    }
  }

  .icon {
    margin-bottom: 16px;
    width: 22px;
    height: 22px;
  }

  @media (max-width: 1024px) {
    flex-direction: column;
    text-align: center;
  }
}

#docs {
  border-right: 1px solid var(--border);

  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}

#next-steps ul {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 8px;
  margin: 32px 0 0;

  .logo {
    height: 18px;
  }

  a {
    color: var(--text-h);
    font-size: 16px;
    border-radius: 6px;
    background: var(--social-bg);
    display: flex;
    padding: 6px 12px;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    transition: box-shadow 0.3s;

    &:hover {
      box-shadow: var(--shadow);
    }
    .button-icon {
      height: 18px;
      width: 18px;
    }
  }

  @media (max-width: 1024px) {
    margin-top: 20px;
    flex-wrap: wrap;
    justify-content: center;

    li {
      flex: 1 1 calc(50% - 8px);
    }

    a {
      width: 100%;
      justify-content: center;
      box-sizing: border-box;
    }
  }
}

#spacer {
  height: 88px;
  border-top: 1px solid var(--border);
  @media (max-width: 1024px) {
    height: 48px;
  }
}

.ticks {
  position: relative;
  width: 100%;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -4.5px;
    border: 5px solid transparent;
  }

  &::before {
    left: 0;
    border-left-color: var(--border);
  }
  &::after {
    right: 0;
    border-right-color: var(--border);
  }
}
`````

### `src/App.tsx`

`````tsx
import React from "react";
import LeftSidebar from "./components/layout/LeftSidebar";
import RightDetailPanel from "./components/layout/RightDetailPanel";
import TreeToolbar from "./components/tree/TreeToolbar";
import FeatureTree from "./components/tree/FeatureTree";
import { useFeatureTreeStore } from "./store/featureTreeStore";
import { FolderGit2 } from "lucide-react";
import { translations } from "./domain/localization";

export default function App() {
  const { loadProjects, selectedProjectId, language } = useFeatureTreeStore();

  React.useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const t = translations[language];

  return (
    <div className="h-screen w-screen bg-[#f8fafc] text-slate-800 flex overflow-hidden">
      
      {/* 1. Left Sidebar */}
      <LeftSidebar />

      {/* Main Workspace (Center + Right) */}
      <div className="flex-1 flex min-w-0">
        
        {/* If no project exists/is selected, show project onboarding */}
        {!selectedProjectId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mb-4">
              <FolderGit2 className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">{t.welcome}</h2>
            <p className="text-xs text-slate-550 text-center max-w-sm mt-1 mb-6">
              {t.welcomeSub}
            </p>
          </div>
        ) : (
          <>
            {/* 2. Center Tree Workspace */}
            <div className="flex-1 flex flex-col p-6 min-w-0 space-y-4">
              {/* Toolbar */}
              <TreeToolbar />
              
              {/* Tree view */}
              <FeatureTree />
            </div>

            {/* 3. Right Detail Panel */}
            <div className="w-[500px] border-l border-slate-200 p-6 flex flex-col shrink-0 bg-slate-50">
              <RightDetailPanel />
            </div>
          </>
        )}

      </div>
    </div>
  );
}
`````

### `src/components/common/ConfirmDialog.tsx`

`````tsx
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onExport: () => void;
  language: "en" | "vi";
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  onExport,
  language
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[100] p-4 select-none animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {language === "en" ? "Replace current tree?" : "Thay thế cây feature hiện tại?"}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {language === "en" ? "Existing Data Detected" : "Phát hiện dữ liệu hiện tại"}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {language === "en" 
            ? "This will replace the current tree with the Parking Building sample tree. You can export your current tree first to avoid losing progress."
            : "Thao tác này sẽ thay thế toàn bộ cây feature hiện tại bằng cây dữ liệu mẫu Parking. Bạn nên xuất file backup JSON trước để tránh mất dữ liệu."}
        </p>

        <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
          >
            {language === "en" ? "Cancel" : "Hủy"}
          </button>
          
          <button
            type="button"
            onClick={onExport}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            {language === "en" ? "Export current JSON" : "Xuất file JSON hiện tại"}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            {language === "en" ? "Replace with Parking Building Project" : "Thay thế bằng Dự án Parking"}
          </button>
        </div>
      </div>
    </div>
  );
}
`````

### `src/components/common/Toast.tsx`

`````tsx
import React from "react";
import { CheckCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function Toast({ message, isVisible, onClose }: ToastProps) {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-5 right-5 bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 z-[999] animate-slide-in select-none">
      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
      <span className="text-xs font-semibold">{message}</span>
      <button 
        onClick={onClose}
        className="text-slate-400 hover:text-white shrink-0 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
`````

### `src/components/layout/LeftSidebar.tsx`

`````tsx
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
`````

### `src/components/layout/RightDetailPanel.tsx`

`````tsx
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
import { getProjectRoleRegistry, validateFeatureTree } from "../../domain/taxonomy";
import { getEffectiveRules, isNodeAiReady, getEffectiveTags } from "../../domain/inheritance.utils";
import {
  formatSingleNodeMarkdown,
  formatSubtreeMarkdown,
  formatProjectMarkdown
} from "../../domain/export.utils";
import { translations } from "../../domain/localization";

type TabType =
  | "overview"
  | "business_permissions"
  | "data_validation"
  | "api_integrations"
  | "ui_presentation"
  | "security_logging"
  | "tests_acceptance"
  | "export";

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

function ContractCollectionEditor({
  title,
  contracts,
  onChange,
  language,
}: {
  title: string;
  contracts: ContractField[];
  onChange: (contracts: ContractField[]) => void;
  language: string;
}) {
  return (
    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">{title}</h3>
        <button
          type="button"
          onClick={() => onChange([...contracts, { id: crypto.randomUUID(), name: "New contract", content: "" }])}
          className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded text-[10px] font-semibold flex items-center cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> {language === "en" ? "Add contract" : "Thêm hợp đồng"}
        </button>
      </div>
      {contracts.length === 0 && <p className="text-xs text-slate-500 italic">{language === "en" ? "No contracts documented." : "Chưa có hợp đồng dữ liệu."}</p>}
      {contracts.map((contract, index) => (
        <div key={contract.id} className="space-y-2 p-3 bg-white border border-slate-200 rounded-lg relative">
          <button
            type="button"
            onClick={() => onChange(contracts.filter((_, itemIndex) => itemIndex !== index))}
            className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <input
            value={contract.name}
            onChange={event => onChange(contracts.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))}
            className="w-[calc(100%-2rem)] bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
          />
          <textarea
            value={contract.content}
            onChange={event => onChange(contracts.map((item, itemIndex) => itemIndex === index ? { ...item, content: event.target.value } : item))}
            rows={4}
            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      ))}
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

  const availableRoles = React.useMemo(() => getProjectRoleRegistry(nodes), [nodes]);
  const validationIssues = React.useMemo(() => validateFeatureTree(nodes), [nodes]);
  const activeValidationIssues = React.useMemo(
    () => validationIssues.filter(issue => !issue.nodeId || issue.nodeId === activeNode?.id),
    [activeNode?.id, validationIssues]
  );

  // Compute tabs that are relevant for the selected node type
  const visibleTabs = React.useMemo(() => {
    if (!activeNode) return [] as TabType[];
    const isLeafOrFeature = ["feature", "sub_feature", "leaf_feature"].includes(activeNode.type);
    if (isLeafOrFeature) {
      return ["overview", "business_permissions", "data_validation", "api_integrations", "ui_presentation", "security_logging", "tests_acceptance", "export"] as TabType[];
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
            {activeValidationIssues.length > 0 && (
              <span
                title={activeValidationIssues.map(issue => issue.message).join("\n")}
                className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200"
              >
                {activeValidationIssues.length} taxonomy issue{activeValidationIssues.length === 1 ? "" : "s"}
              </span>
            )}
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
            {tab === "business_permissions" && (language === "en" ? "Business & Permissions" : "Nghiệp vụ & Phân quyền")}
            {tab === "data_validation" && (language === "en" ? "Data & Validation" : "Dữ liệu & Validation")}
            {tab === "api_integrations" && (language === "en" ? "API & Integrations" : "API & Tích hợp")}
            {tab === "ui_presentation" && (language === "en" ? "UI & Presentation" : "UI & Trình bày")}
            {tab === "security_logging" && (language === "en" ? "Security & Logs" : "Bảo mật & Logs")}
            {tab === "tests_acceptance" && (language === "en" ? "Tests & Acceptance" : "Test & Nghiệm thu")}
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

        {/* ==================== BUSINESS & PERMISSIONS TAB ==================== */}
        {activeTab === "business_permissions" && (
          <div className="space-y-6">
            <div>
              <FieldLabel text={language === "en" ? "Business objective" : "Mục tiêu nghiệp vụ"} required={false} language={language} />
              <textarea
                value={activeNode.objective || ""}
                onChange={event => updateNode(activeNode.id, { objective: event.target.value })}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <FieldLabel text={language === "en" ? "Business area" : "Lĩnh vực nghiệp vụ"} required={false} language={language} />
              <input
                value={activeNode.metadata?.businessArea || ""}
                onChange={event => updateNode(activeNode.id, { metadata: { ...activeNode.metadata, businessArea: event.target.value } })}
                placeholder="e.g. Payments, Reservations"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <SimpleListEditor
              title={language === "en" ? "Business rules" : "Quy tắc nghiệp vụ"}
              placeholder="Add a business rule"
              items={activeNode.businessRules || []}
              onAdd={text => updateNode(activeNode.id, { businessRules: [...(activeNode.businessRules || []), text] })}
              onRemove={index => updateNode(activeNode.id, { businessRules: (activeNode.businessRules || []).filter((_, itemIndex) => itemIndex !== index) })}
              language={language}
            />
            <TableEditor
              title={language === "en" ? "Roles & permissions" : "Vai trò & quyền hạn"}
              fields={[
                { key: "role", label: "Role", type: "select", options: availableRoles },
                { key: "permission", label: "Permission", placeholder: "Can view or modify resources" },
              ]}
              items={(activeNode.permissions || []) as Record<string, string>[]}
              onAdd={row => updateNode(activeNode.id, { permissions: [...(activeNode.permissions || []), { role: row.role, permission: row.permission }] })}
              onRemove={index => updateNode(activeNode.id, { permissions: (activeNode.permissions || []).filter((_, itemIndex) => itemIndex !== index) })}
              noItemsLabel={language === "en" ? "No permissions mapped." : "Chưa ánh xạ quyền hạn."}
              language={language}
            />
          </div>
        )}

        {/* ==================== DATA & VALIDATION TAB ==================== */}
        {activeTab === "data_validation" && (
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
            <ContractCollectionEditor
              title={language === "en" ? "Data contracts" : "Hợp đồng dữ liệu"}
              contracts={activeNode.dataContracts || []}
              onChange={dataContracts => updateNode(activeNode.id, { dataContracts })}
              language={language}
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
        {activeTab === "api_integrations" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SimpleListEditor
                title={language === "en" ? "Endpoints" : "Endpoints"}
                placeholder="e.g. GET /api/core/health"
                items={activeNode.metadata?.endpoints || []}
                onAdd={text => updateNode(activeNode.id, { metadata: { ...activeNode.metadata, endpoints: [...(activeNode.metadata?.endpoints || []), text] } })}
                onRemove={index => updateNode(activeNode.id, { metadata: { ...activeNode.metadata, endpoints: (activeNode.metadata?.endpoints || []).filter((_, itemIndex) => itemIndex !== index) } })}
                language={language}
              />
              <SimpleListEditor
                title={language === "en" ? "Source files" : "File nguồn"}
                placeholder="e.g. src/services/payment.ts"
                items={activeNode.metadata?.sourceFiles || []}
                onAdd={text => updateNode(activeNode.id, { metadata: { ...activeNode.metadata, sourceFiles: [...(activeNode.metadata?.sourceFiles || []), text] } })}
                onRemove={index => updateNode(activeNode.id, { metadata: { ...activeNode.metadata, sourceFiles: (activeNode.metadata?.sourceFiles || []).filter((_, itemIndex) => itemIndex !== index) } })}
                language={language}
              />
            </div>
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
              language={language}
            />

            {/* Frontend UI Behavior */}
            <div className="hidden">
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

        {/* ==================== UI & PRESENTATION TAB ==================== */}
        {activeTab === "ui_presentation" && (
          <div className="space-y-6">
            <ContractCollectionEditor
              title={language === "en" ? "UI contracts" : "Hợp đồng UI"}
              contracts={activeNode.uiContracts || []}
              onChange={uiContracts => updateNode(activeNode.id, { uiContracts })}
              language={language}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel text={language === "en" ? "Page / view" : "Trang / View"} required={false} language={language} />
                <input value={activeNode.uiPage || ""} onChange={event => updateNode(activeNode.id, { uiPage: event.target.value })} placeholder="e.g. /login" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <FieldLabel text={language === "en" ? "Components" : "Components"} required={false} language={language} />
                <input value={activeNode.uiComponents || ""} onChange={event => updateNode(activeNode.id, { uiComponents: event.target.value })} placeholder="e.g. LoginForm, Toast" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none" />
              </div>
            </div>
            {([
              ["uiStateLoading", "Loading state"],
              ["uiStateEmpty", "Empty state"],
              ["uiStateError", "Error state"],
              ["uiStateSuccess", "Success state"],
            ] as const).map(([field, label]) => (
              <div key={field}>
                <FieldLabel text={label} required={false} language={language} />
                <textarea value={activeNode[field] || ""} onChange={event => updateNode(activeNode.id, { [field]: event.target.value })} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none" />
              </div>
            ))}
          </div>
        )}

        {/* ==================== TESTS & ACCEPTANCE TAB ==================== */}
        {activeTab === "tests_acceptance" && (
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
                    {t.steps}
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
                          const newSteps = [...(editingTestCase.steps || [])];
                          newSteps[sIdx] = e.target.value;
                          setEditingTestCase({ ...editingTestCase, steps: newSteps });
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-850 text-xs focus:border-indigo-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSteps = (editingTestCase.steps || []).filter((_, idx) => idx !== sIdx);
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
`````

### `src/components/sidebar/ProjectInitializerButton.tsx`

`````tsx
import React from "react";
import { Sparkles } from "lucide-react";
import { useFeatureTreeStore } from "../../store/featureTreeStore";
import ConfirmDialog from "../common/ConfirmDialog";
import Toast from "../common/Toast";
import { getProjectRoleRegistry } from "../../domain/taxonomy";
import { CURRENT_PROJECT_VERSION } from "../../domain/projectBackup";

export default function ProjectInitializerButton() {
  const {
    selectedProjectId,
    projects,
    exportTree,
    canInitializeProject,
    replaceTreeWithParkingBuildingProject,
    language
  } = useFeatureTreeStore();
  const nodes = useFeatureTreeStore(state => state.nodes);

  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const [isToastVisible, setIsToastVisible] = React.useState(false);

  const handleInitClick = async () => {
    const empty = canInitializeProject();
    if (empty) {
      await replaceTreeWithParkingBuildingProject();
      showToast(language === "en" ? "Parking Building project initialized." : "Dự án Parking Building đã khởi tạo.");
    } else {
      setIsConfirmOpen(true);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastVisible(true);
  };

  const handleConfirmReplace = async () => {
    setIsConfirmOpen(false);
    await replaceTreeWithParkingBuildingProject();
    showToast(language === "en" ? "Parking Building project initialized." : "Dự án Parking Building đã khởi tạo.");
  };

  const handleExportBackup = () => {
    // Reuses the JSON backup logic from LeftSidebar
    const activeProject = projects.find(p => p.id === selectedProjectId);
    const projName = activeProject ? activeProject.name : "workspace_backup";
    
    const data = {
      version: CURRENT_PROJECT_VERSION,
      projectName: projName,
      clients: getProjectRoleRegistry(nodes).map(name => ({ id: name, name })),
      nodes: exportTree()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${projName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_backup.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInitClick}
        className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-755 border border-indigo-500/20 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer gap-2 shadow-md shadow-indigo-150"
      >
        <Sparkles className="w-4 h-4 text-white shrink-0 animate-pulse" />
        <span>
          {language === "en" ? "Initialize Parking Building Project" : "Khởi tạo Dự án Parking Building"}
        </span>
      </button>

      {/* Confirmation Dialog Modal */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmReplace}
        onExport={handleExportBackup}
        language={language}
      />

      {/* Success Notification Toast */}
      <Toast
        message={toastMessage}
        isVisible={isToastVisible}
        onClose={() => setIsToastVisible(false)}
      />
    </>
  );
}
`````

### `src/components/tree/FeatureTree.tsx`

`````tsx
import React from "react";
import { Tree, type TreeApi } from "react-arborist";
import { Search, FolderKanban, Keyboard } from "lucide-react";
import { useFeatureTreeStore } from "../../store/featureTreeStore";
import type { FeatureNode } from "../../domain/featureNode.types";
import FeatureTreeNode from "./FeatureTreeNode";
import { getAncestorChain, isNodeAiReady, getEffectiveTags } from "../../domain/inheritance.utils";
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

  // Memoize filteredList to prevent recreating reference on every render
  const filteredList = React.useMemo(() => {
    // 1. Client filter
    let list = selectedClientFilter === "ALL"
      ? nodes
      : nodes.filter(n => n.clients && n.clients.includes(selectedClientFilter as any));

    // 2. Status filter
    if (selectedStatusFilter !== "ALL") {
      list = list.filter(n => n.status === selectedStatusFilter);
    }

    // 3. Priority filter
    if (selectedPriorityFilter !== "ALL") {
      list = list.filter(n => n.priority === selectedPriorityFilter);
    }

    // 4. Incomplete filter (Leafs only that aren't fully AI-ready)
    if (showOnlyIncomplete) {
      list = list.filter(n => {
        if (n.type !== "leaf_feature") return false;
        const v = isNodeAiReady(n, nodes);
        return !v.isReady;
      });
    }

    // 5. Leaf node filter
    if (showOnlyLeafs) {
      list = list.filter(n => n.type === "leaf_feature");
    }

    // 6. Text Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(n => {
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchSummary = n.summary && n.summary.toLowerCase().includes(q);
        const matchRules = n.businessRules && n.businessRules.some(r => r.toLowerCase().includes(q));
        
        // Use effective tags (local + inherited)
        const effectiveTags = getEffectiveTags(n.id, nodes);
        const matchTags = effectiveTags.some(t => t.includes(q));
        
        return matchTitle || matchSummary || matchRules || matchTags;
      });
    }
    return list;
  }, [nodes, selectedClientFilter, selectedStatusFilter, selectedPriorityFilter, showOnlyIncomplete, showOnlyLeafs, searchQuery]);

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
          >
            {FeatureTreeNode}
          </Tree>
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
`````

### `src/components/tree/FeatureTreeNode.tsx`

`````tsx
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
`````

### `src/components/tree/TreeToolbar.tsx`

`````tsx
import { Search, Filter, AlertCircle, CircleDot } from "lucide-react";
import { useFeatureTreeStore } from "../../store/featureTreeStore";
import { translations } from "../../domain/localization";

export default function TreeToolbar() {
  const {
    searchQuery,
    setSearchQuery,
    selectedStatusFilter,
    setStatusFilter,
    selectedPriorityFilter,
    setPriorityFilter,
    showOnlyIncomplete,
    setShowOnlyIncomplete,
    showOnlyLeafs,
    setShowOnlyLeafs,
    language
  } = useFeatureTreeStore();

  const t = translations[language];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 glass-panel select-none shrink-0 shadow-xs">
      
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-405 transition-all"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Dropdown Filters */}
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">{t.statusLabel}</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 hover:border-slate-350 text-slate-700 rounded px-2.5 py-1 text-xs focus:outline-none transition-colors"
            >
              <option value="ALL">{t.allStatuses}</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="in_progress">In Progress</option>
              <option value="implemented">Implemented</option>
              <option value="tested">Tested</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">{t.priorityLabel}</span>
            <select
              value={selectedPriorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-white border border-slate-200 hover:border-slate-350 text-slate-700 rounded px-2.5 py-1 text-xs focus:outline-none transition-colors"
            >
              <option value="ALL">{t.allPriorities}</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="must_have">Must Have</option>
            </select>
          </div>
        </div>

        {/* Checkbox Switches */}
        <div className="flex items-center space-x-4 flex-wrap gap-y-1">
          {/* Show Only Incomplete */}
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOnlyIncomplete}
              onChange={(e) => setShowOnlyIncomplete(e.target.checked)}
              className="w-3.5 h-3.5 accent-indigo-600 rounded bg-white border-slate-200 focus:ring-0 cursor-pointer"
            />
            <span className="flex items-center"><AlertCircle className="w-3 h-3 mr-1 text-amber-500" /> {t.incompleteOnly}</span>
          </label>

          {/* Show Only Leafs */}
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOnlyLeafs}
              onChange={(e) => setShowOnlyLeafs(e.target.checked)}
              className="w-3.5 h-3.5 accent-indigo-600 rounded bg-white border-slate-200 focus:ring-0 cursor-pointer"
            />
            <span className="flex items-center"><CircleDot className="w-3 h-3 mr-1 text-indigo-500" /> {t.leafFeaturesOnly}</span>
          </label>
        </div>
      </div>

    </div>
  );
}
`````

### `src/db/dexieDb.ts`

`````typescript
import Dexie, { type Table } from "dexie";
import type { FeatureNode, Project } from "../domain/featureNode.types";

export class FeatureTreeDatabase extends Dexie {
  projects!: Table<Project, string>;
  features!: Table<FeatureNode & { projectId: string }, string>;

  constructor() {
    super("FeatureTreeDatabase");
    this.version(1).stores({
      projects: "id, name, createdAt, updatedAt",
      features: "id, projectId, parentId, title, type, order"
    });
  }
}

export const db = new FeatureTreeDatabase();
`````

### `src/domain/export.utils.ts`

`````typescript
import type { FeatureNode } from "./featureNode.types";
import { getAncestorChain, getEffectiveRules } from "./inheritance.utils";

/**
 * Helper to construct the breadcrumb path for a node.
 * e.g., "Parking Building > Auth > Login > Login by Google"
 */
export function getFeaturePath(nodeId: string, flatNodes: FeatureNode[]): string {
  const chain = getAncestorChain(nodeId, flatNodes);
  return chain.map(n => n.title).join(" > ");
}

/**
 * Helper to build a nested tree structure from flat nodes list.
 */
export function buildTreeFromFlat(flatNodes: FeatureNode[], parentId: string | null = null): FeatureNode[] {
  const nodes = flatNodes.filter(n => n.parentId === parentId);
  // Sort by order
  nodes.sort((a, b) => a.order - b.order);
  
  return nodes.map(node => ({
    ...node,
    children: buildTreeFromFlat(flatNodes, node.id)
  }));
}

/**
 * Formats a single node to Markdown according to the selected mode.
 */
export function formatSingleNodeMarkdown(
  node: FeatureNode,
  flatNodes: FeatureNode[],
  mode: 'human' | 'ai' | 'qa'
): string {
  const path = getFeaturePath(node.id, flatNodes);
  const effectiveRulesGroups = getEffectiveRules(node.id, flatNodes);
  
  // Flatten effective rules
  const allEffectiveRules = effectiveRulesGroups.flatMap(g => g.rules);
  const inheritedGroups = effectiveRulesGroups.filter(g => g.sourceNodeId !== node.id);
  const localRules = node.businessRules || [];
  
  let md = "";
  
  if (mode === 'human') {
    md += `# Feature Specification: ${node.title}\n\n`;
    md += `**Path:** ${path}\n\n`;
    
    md += `## Metadata\n`;
    md += `| Field | Value |\n`;
    md += `| :--- | :--- |\n`;
    md += `| **Type** | \`${node.type}\` |\n`;
    md += `| **Status** | \`${node.status}\` |\n`;
    md += `| **Priority** | \`${node.priority}\` |\n`;
    if (node.clients && node.clients.length > 0) {
      md += `| **Clients/Roles** | ${node.clients.join(", ")} |\n`;
    }
    if (node.tags && node.tags.length > 0) {
      md += `| **Tags** | ${node.tags.map(t => `\`${t}\``).join(", ")} |\n`;
    }
    md += `\n`;
    
    if (node.summary) {
      md += `## Summary\n${node.summary}\n\n`;
    }
    
    // Business Rules Section (Only if inherited or local rules exist)
    if (inheritedGroups.length > 0 || localRules.length > 0) {
      md += `## Business Rules\n`;
      if (inheritedGroups.length > 0) {
        md += `### Inherited Rules\n`;
        inheritedGroups.forEach(g => {
          md += `#### From ${g.sourceTitle}\n`;
          g.rules.forEach(r => md += `- ${r}\n`);
        });
        md += `\n`;
      }
      
      if (localRules.length > 0) {
        md += `### Local Rules\n`;
        localRules.forEach(r => md += `- ${r}\n`);
        md += `\n`;
      }
    }
    
    // Contracts Section (Only if at least one type of contract exists)
    const hasApi = node.apiContracts && node.apiContracts.length > 0;
    const hasUi = node.uiContracts && node.uiContracts.length > 0;
    const hasData = node.dataContracts && node.dataContracts.length > 0;
    if (hasApi || hasUi || hasData) {
      md += `## Contracts\n`;
      if (hasApi) {
        md += `### API Contracts\n`;
        node.apiContracts!.forEach(c => {
          md += `#### ${c.name}\n\`\`\`\n${c.content}\n\`\`\`\n\n`;
        });
      }
      if (hasUi) {
        md += `### UI Contracts\n`;
        node.uiContracts!.forEach(c => {
          md += `#### ${c.name}\n\`\`\`\n${c.content}\n\`\`\`\n\n`;
        });
      }
      if (hasData) {
        md += `### Data Contracts\n`;
        node.dataContracts!.forEach(c => {
          md += `#### ${c.name}\n\`\`\`\n${c.content}\n\`\`\`\n\n`;
        });
      }
    }
    
    // Test Cases Section
    if (node.testCases && node.testCases.length > 0) {
      md += `## Test Cases & Verification\n`;
      node.testCases.forEach((tc, idx) => {
        md += `### Test ${idx + 1}: ${tc.title} (\`${tc.type}\`)\n`;
        if (tc.precondition) md += `**Precondition:** ${tc.precondition}\n\n`;
        if (tc.steps && tc.steps.length > 0) {
          md += `**Steps:**\n`;
          tc.steps.forEach((step, sIdx) => md += `${sIdx + 1}. ${step}\n`);
          md += `\n`;
        }
        md += `**Expected:** ${tc.expectedResult}\n`;
        md += `**Status:** \`${tc.status}\`\n\n`;
      });
    }
    
    // Done Criteria Section
    if (node.doneCriteria && node.doneCriteria.length > 0) {
      md += `## Done Criteria\n`;
      node.doneCriteria.forEach(dc => {
        md += `- [${dc.checked ? 'x' : ' '}] ${dc.content}\n`;
      });
      md += `\n`;
    }
    
    // Dependencies & Risks Section
    const hasDeps = node.dependencies && node.dependencies.length > 0;
    const hasRisks = node.risks && node.risks.length > 0;
    if (hasDeps || hasRisks) {
      md += `## Dependencies & Risks\n`;
      if (hasDeps) {
        md += `### Dependencies\n`;
        node.dependencies!.forEach(d => md += `- ${d}\n`);
        md += `\n`;
      }
      if (hasRisks) {
        md += `### Risks\n`;
        node.risks!.forEach(r => md += `- ${r}\n`);
        md += `\n`;
      }
    }
    
    if (node.notes) {
      md += `## Notes\n${node.notes}\n\n`;
    }
    
  } else if (mode === 'ai') {
    md += `# AI Implementation Guide: ${node.title}\n\n`;
    md += `**Target Path:** ${path}\n`;
    md += `**Node Type:** ${node.type}\n`;
    md += `**Status:** ${node.status}\n`;
    md += `**Priority:** ${node.priority}\n`;
    if (node.clients && node.clients.length > 0) {
      md += `**Authorized Clients/Roles:** ${node.clients.join(", ")}\n`;
    }
    if (node.metadata) {
      if (node.metadata.ownerService) {
        md += `**Owner Service:** ${node.metadata.ownerService}\n`;
      }
      if (node.metadata.consumerServices && node.metadata.consumerServices.length > 0) {
        md += `**Consumer Services:** ${node.metadata.consumerServices.join(", ")}\n`;
      }
      if (node.metadata.endpoints && node.metadata.endpoints.length > 0) {
        md += `**Endpoints:**\n`;
        node.metadata.endpoints.forEach(ep => {
          md += `- ${ep}\n`;
        });
      }
    }
    md += `\n---\n\n`;

    // Section 1: Objective
    md += `## 1. Summary / Objective\n\n`;
    md += `${node.objective || node.summary || "No objective documented."}\n\n`;

    // Section 2: Scope
    md += `## 2. Scope\n\n`;
    md += `### In Scope\n\n`;
    if (node.inScope && node.inScope.length > 0) {
      node.inScope.forEach(item => md += `* ${item}\n`);
    } else {
      md += `* Implement the core logic and requirements of this feature.\n`;
    }
    md += `\n### Out of Scope\n\n`;
    if (node.outOfScope && node.outOfScope.length > 0) {
      node.outOfScope.forEach(item => md += `* ${item}\n`);
    } else {
      md += `* External system integrations not specified in this document.\n`;
    }
    md += `\n`;

    // Section 3: Actors / Roles / Permissions
    md += `## 3. Actors / Roles / Permissions\n\n`;
    if (node.permissions && node.permissions.length > 0) {
      md += `| Role | Permission |\n`;
      md += `| --- | --- |\n`;
      node.permissions.forEach(p => {
        md += `| ${p.role} | ${p.permission} |\n`;
      });
    } else if (node.clients && node.clients.length > 0) {
      md += `| Role | Access |\n`;
      md += `| --- | --- |\n`;
      node.clients.forEach(c => {
        md += `| ${c} | Authorized to access this feature. |\n`;
      });
    } else {
      md += `No role-specific permissions specified.\n`;
    }
    md += `\n`;

    // Section 4: Effective Business Rules
    md += `## 4. Effective Rules (Inherited & Local)\n\n`;
    if (allEffectiveRules.length > 0) {
      allEffectiveRules.forEach(rule => {
        md += `* ${rule}\n`;
      });
    } else {
      md += `* Follow standard application logic.\n`;
    }
    md += `\n`;

    // Section 5: API Contracts
    md += `## 5. API Contracts\n\n`;
    if (node.apiContracts && node.apiContracts.length > 0) {
      node.apiContracts.forEach(c => {
        md += `### ${c.name}\n\n\`\`\`\n${c.content}\n\`\`\`\n\n`;
      });
    } else {
      md += `No API contracts documented.\n\n`;
    }

    // Section 6: Database Requirements
    md += `## 6. Database / Data Model Requirements\n\n`;
    md += `### Existing Tables to Reuse\n\n`;
    if (node.dbExistingTables && node.dbExistingTables.length > 0) {
      node.dbExistingTables.forEach(t => md += `* \`${t}\`\n`);
    } else {
      md += `* Reuse existing tables where applicable.\n`;
    }
    md += `\n### New Tables / Fields Required\n\n`;
    if (node.dbNewTablesSql) {
      md += `\`\`\`sql\n${node.dbNewTablesSql}\n\`\`\`\n`;
    } else {
      md += `No new database schema defined.\n`;
    }
    md += `\n### Relationship Rules\n\n`;
    if (node.dbRelationships && node.dbRelationships.length > 0) {
      node.dbRelationships.forEach(r => md += `* ${r}\n`);
    } else {
      md += `* None specified.\n`;
    }
    md += `\n`;

    // Section 7: Validation Rules
    md += `## 7. Validation Rules\n\n`;
    if (node.validationRules && node.validationRules.length > 0) {
      md += `| Field | Rule | Error Message |\n`;
      md += `| --- | --- | --- |\n`;
      node.validationRules.forEach(v => {
        md += `| ${v.field} | ${v.rule} | ${v.errorMessage} |\n`;
      });
    } else {
      md += `Standard request validation is expected.\n`;
    }
    md += `\n`;

    // Section 8: Security Requirements
    md += `## 8. Security Requirements\n\n`;
    if (node.securityRules && node.securityRules.length > 0) {
      node.securityRules.forEach(s => md += `* ${s}\n`);
    } else {
      md += `* Validate role permissions.\n`;
      md += `* Prevent unauthorized access.\n`;
      md += `* Do not log sensitive data.\n`;
    }
    md += `\n`;

    // Section 9: Logging & Audit Requirements
    md += `## 9. Logging & Audit\n\n`;
    md += `### Log these events:\n\n`;
    if (node.logEvents && node.logEvents.length > 0) {
      node.logEvents.forEach(e => md += `* ${e}\n`);
    } else {
      md += `* Log request access, inputs, duration, and response code.\n`;
    }
    md += `\n### Do not log (Sensitive data):\n\n`;
    if (node.noLogEvents && node.noLogEvents.length > 0) {
      node.noLogEvents.forEach(e => md += `* ${e}\n`);
    } else {
      md += `* Passwords, access tokens, refresh tokens, and credit card details.\n`;
    }
    md += `\n`;

    // Section 10: Integration Points
    md += `## 10. Integration Points\n\n`;
    if (node.integrationPoints && node.integrationPoints.length > 0) {
      md += `| System / Module | Responsibility |\n`;
      md += `| --- | --- |\n`;
      node.integrationPoints.forEach(ip => {
        md += `| ${ip.system} | ${ip.responsibility} |\n`;
      });
    } else {
      md += `No external integration points specified.\n`;
    }
    md += `\n`;

    // Section 11: Frontend Behavior
    md += `## 11. Frontend Behavior\n\n`;
    if (node.uiPage || node.uiComponents || node.uiStateLoading || node.uiStateEmpty || node.uiStateError || node.uiStateSuccess) {
      if (node.uiPage) md += `* **Page:** ${node.uiPage}\n`;
      if (node.uiComponents) md += `* **Components:** ${node.uiComponents}\n`;
      if (node.uiStateLoading) md += `* **Loading State:** ${node.uiStateLoading}\n`;
      if (node.uiStateEmpty) md += `* **Empty State:** ${node.uiStateEmpty}\n`;
      if (node.uiStateError) md += `* **Error State:** ${node.uiStateError}\n`;
      if (node.uiStateSuccess) md += `* **Success State:** ${node.uiStateSuccess}\n`;
    } else {
      md += `No frontend behavior specified.\n`;
    }
    md += `\n`;

    // Section 12: Automated Test Cases
    md += `## 12. Automated Test Cases\n\n`;
    if (node.testCases && node.testCases.length > 0) {
      node.testCases.forEach((tc) => {
        md += `### Test: ${tc.title}\n`;
        md += `- **Type**: ${tc.type}\n`;
        if (tc.precondition) md += `- **Precondition**: ${tc.precondition}\n`;
        if (tc.steps && tc.steps.length > 0) {
          md += `- **Steps**:\n`;
          tc.steps.forEach((step, sIdx) => md += `  ${sIdx + 1}. ${step}\n`);
        }
        md += `- **Expected Result**: ${tc.expectedResult}\n\n`;
      });
    } else {
      md += `No automated tests specified.\n\n`;
    }

    // Section 13: Acceptance / Done Criteria
    md += `## 13. Acceptance / Done Criteria\n\n`;
    if (node.doneCriteria && node.doneCriteria.length > 0) {
      node.doneCriteria.forEach(dc => {
        md += `- [${dc.checked ? 'x' : ' '}] ${dc.content}\n`;
      });
      md += `\n`;
    } else {
      md += `No done criteria specified.\n\n`;
    }

    // Section 14: Implementation Instructions for AI
    md += `## 14. Implementation Instructions for AI\n\n`;
    md += `Before coding:\n\n`;
    md += `1. Inspect the existing project structure.\n`;
    md += `2. Reuse existing architecture and naming conventions.\n`;
    md += `3. Do not create duplicate services, entities, or response wrappers.\n`;
    md += `4. Check existing tests before adding new ones.\n`;
    md += `5. Implement the smallest correct change.\n`;
    md += `6. Run all relevant tests.\n`;
    md += `7. Report changed files, reason, verification, and remaining risks.\n\n`;
    md += `Do not mark this task as complete unless all acceptance criteria and automated tests pass.\n\n`;
    
  } else if (mode === 'qa') {
    md += `# QA Specification: ${node.title}\n\n`;
    md += `**Path:** ${path}\n`;
    if (node.clients && node.clients.length > 0) {
      md += `**Clients:** ${node.clients.join(", ")}\n\n`;
    }
    
    if (allEffectiveRules.length > 0) {
      md += `## Business Rules to Verify\n`;
      allEffectiveRules.forEach(rule => {
        md += `- ${rule}\n`;
      });
      md += `\n`;
    }
    
    if (node.testCases && node.testCases.length > 0) {
      md += `## Test Cases\n`;
      node.testCases.forEach((tc) => {
        md += `### [${tc.type.toUpperCase()}] ${tc.title}\n`;
        if (tc.precondition) md += `- **Precondition**: ${tc.precondition}\n`;
        if (tc.steps && tc.steps.length > 0) {
          md += `- **Steps**:\n`;
          tc.steps.forEach((step, sIdx) => md += `  ${sIdx + 1}. ${step}\n`);
        }
        md += `- **Expected**: ${tc.expectedResult}\n`;
        md += `- **Current Status**: \`${tc.status}\`\n\n`;
      });
    }
    
    if (node.doneCriteria && node.doneCriteria.length > 0) {
      md += `## Verification Criteria\n`;
      node.doneCriteria.forEach(dc => {
        md += `- [${dc.checked ? 'x' : ' '}] ${dc.content}\n`;
      });
      md += `\n`;
    }
  }
  
  return md;
}

/**
 * Returns markdown for a node and all of its descendants recursively.
 */
export function formatSubtreeMarkdown(
  rootNodeId: string,
  flatNodes: FeatureNode[],
  mode: 'human' | 'ai' | 'qa'
): string {
  const rootNode = flatNodes.find(n => n.id === rootNodeId);
  if (!rootNode) return "";
  
  let md = formatSingleNodeMarkdown(rootNode, flatNodes, mode);
  
  // Recursively find and format children ordered by 'order'
  const children = flatNodes
    .filter(n => n.parentId === rootNodeId)
    .sort((a, b) => a.order - b.order);
    
  children.forEach(child => {
    md += `\n---\n\n`;
    md += formatSubtreeMarkdown(child.id, flatNodes, mode);
  });
  
  return md;
}

/**
 * Returns markdown for all nodes in the project.
 */
export function formatProjectMarkdown(
  flatNodes: FeatureNode[],
  mode: 'human' | 'ai' | 'qa'
): string {
  // Find all root nodes (parentId is null) sorted by order
  const roots = flatNodes
    .filter(n => n.parentId === null)
    .sort((a, b) => a.order - b.order);
    
  let md = `# PROJECT FEATURE SPECIFICATIONS\n\n`;
  
  roots.forEach((root, idx) => {
    if (idx > 0) md += `\n---\n\n`;
    md += formatSubtreeMarkdown(root.id, flatNodes, mode);
  });
  
  return md;
}

/**
 * Interface for the full exported JSON format
 */
export interface ProjectExportData {
  version: string;
  projectName: string;
  projectDescription: string;
  clients: { id: string; name: string }[];
  nodes: FeatureNode[];
}
`````

### `src/domain/featureNode.types.ts`

`````typescript
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
`````

### `src/domain/featureNodeFactory.ts`

`````typescript
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
  ownerService?: ".NET Core API" | "Spring Boot Support API" | "Shared Database" | "Frontend" | "System" | string;
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

  // Advanced technical fields
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
    
    // Copy advanced technical fields
    objective: input.objective,
    inScope: input.inScope,
    outOfScope: input.outOfScope,
    permissions: input.permissions,
    dbExistingTables: input.dbExistingTables,
    dbNewTablesSql: input.dbNewTablesSql,
    dbRelationships: input.dbRelationships,
    validationRules: input.validationRules,
    securityRules: input.securityRules,
    logEvents: input.logEvents,
    noLogEvents: input.noLogEvents,
    integrationPoints: input.integrationPoints,
    uiPage: input.uiPage,
    uiComponents: input.uiComponents,
    uiStateLoading: input.uiStateLoading,
    uiStateEmpty: input.uiStateEmpty,
    uiStateError: input.uiStateError,
    uiStateSuccess: input.uiStateSuccess,

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
`````

### `src/domain/inheritance.utils.ts`

`````typescript
import type { FeatureNode } from "./featureNode.types";

/**
 * Returns the ancestor chain from the root node down to the target node (inclusive).
 * e.g. [Root, Category, Feature, SubFeature, LeafFeature]
 */
export function getAncestorChain(nodeId: string, flatNodes: FeatureNode[]): FeatureNode[] {
  const chain: FeatureNode[] = [];
  let current = flatNodes.find(n => n.id === nodeId);
  
  while (current) {
    chain.unshift(current);
    if (!current.parentId) break;
    const parentId = current.parentId;
    current = flatNodes.find(n => n.id === parentId);
  }
  
  return chain;
}

/**
 * Combines rules from ancestors to child, returning rules grouped by source node.
 * Ensures no mutation of parent nodes.
 */
export function getEffectiveRules(
  nodeId: string,
  flatNodes: FeatureNode[]
): { sourceNodeId: string; sourceTitle: string; rules: string[] }[] {
  const chain = getAncestorChain(nodeId, flatNodes);
  
  return chain
    .filter(node => node.businessRules && node.businessRules.length > 0)
    .map(node => ({
      sourceNodeId: node.id,
      sourceTitle: node.title,
      rules: [...node.businessRules] // Create a copy to prevent mutation
    }));
}

export interface ReadinessResult {
  isReady: boolean;
  reasons: string[];
  status: "not_ready" | "partially_ready" | "ready";
}

/**
 * Validates whether a leaf feature is AI-ready.
 */
export function isNodeAiReady(node: FeatureNode, flatNodes: FeatureNode[]): ReadinessResult {
  if (node.type !== "leaf_feature") {
    // Categories/projects don't need tests/criteria to be ready.
    // They are ready by default if they have a title and summary.
    const reasons: string[] = [];
    if (!node.title.trim()) reasons.push("Title is empty");
    if (!node.summary.trim()) reasons.push("Summary is empty");
    return {
      isReady: reasons.length === 0,
      reasons,
      status: reasons.length === 0 ? "ready" : "not_ready"
    };
  }

  const reasons: string[] = [];
  
  if (!node.title.trim()) {
    reasons.push("Title is empty");
  }
  if (!node.summary.trim()) {
    reasons.push("Summary is empty");
  }
  if (!node.clients || node.clients.length === 0) {
    reasons.push("No clients assigned");
  }
  if (!node.testCases || node.testCases.length === 0) {
    reasons.push("No test cases defined");
  }
  if (!node.doneCriteria || node.doneCriteria.length === 0) {
    reasons.push("No done criteria defined");
  }

  const effectiveRules = getEffectiveRules(node.id, flatNodes);
  const totalRulesCount = effectiveRules.reduce((acc, curr) => acc + curr.rules.length, 0);
  if (totalRulesCount === 0) {
    reasons.push("No business rules (local or inherited)");
  }

  const isReady = reasons.length === 0;
  let status: "not_ready" | "partially_ready" | "ready" = "ready";
  if (reasons.length > 0) {
    // If it has at least some content (e.g. title and summary), it is partially ready
    if (node.title.trim() && node.summary.trim()) {
      status = "partially_ready";
    } else {
      status = "not_ready";
    }
  }

  return { isReady, reasons, status };
}

/**
 * Combines tags from ancestors to child, returning a unique list of lowercase tags.
 */
export function getEffectiveTags(nodeId: string, flatNodes: FeatureNode[]): string[] {
  const chain = getAncestorChain(nodeId, flatNodes);
  const tagsSet = new Set<string>();
  chain.forEach(node => {
    if (node.tags) {
      node.tags.forEach(tag => tagsSet.add(tag.toLowerCase().trim()));
    }
  });
  return Array.from(tagsSet).filter(Boolean);
}
`````

### `src/domain/localization.ts`

`````typescript
export const translations = {
  en: {
    brandTitle: "FeatureTree AI",
    brandSubtitle: "Local-first Feature Planner",
    workspaceProjects: "Workspace Projects",
    createNewProject: "Create new project",
    projectNamePlaceholder: "Project name...",
    projectDescPlaceholder: "Project description (optional)...",
    cancel: "Cancel",
    create: "Create",
    noProjectsYet: "No projects created yet. Click \"+\" or load seed data.",
    templatesQuickLoad: "Templates / Quick Load",
    loadParkingSample: "Load Parking Building Sample",
    clientRoleMetrics: "Client / Role Metrics",
    allClients: "All Clients",
    localBackup: "Local Backup",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    searchPlaceholder: "Search features, rules, summaries, tags...",
    statusLabel: "Status:",
    priorityLabel: "Priority:",
    incompleteOnly: "Incomplete only",
    leafFeaturesOnly: "Leaf features only",
    interactiveFeatureTree: "Interactive Feature Tree",
    addChild: "Add Child",
    addSibling: "Add Sibling",
    totalFeatures: "Total features:",
    footerTip: "Press F2 to rename, Del to delete",
    noFeaturesFound: "No features found matching the filters.",
    adjustFilters: "Try adjusting your filters or search terms.",
    // Details
    nodeType: "Node Type",
    status: "Status",
    priority: "Priority",
    assignedClients: "Assigned Clients / Roles",
    summaryLabel: "Summary / Functional Description",
    summaryPlaceholder: "Describe what this feature accomplishes, the user story, or objective...",
    tagsLabel: "Tags (comma-separated)",
    tagsPlaceholder: "e.g. auth, api, settings",
    dependenciesLabel: "Dependencies (comma-separated)",
    dependenciesPlaceholder: "e.g. AUTH-LOGIN, PAYMENT-API",
    risksLabel: "Risks (comma-separated)",
    risksPlaceholder: "e.g. Third-party provider outage",
    notesLabel: "Notes & Technical considerations",
    notesPlaceholder: "Database references, links, libraries to use, or miscellaneous architectural constraints...",
    localBusinessRules: "Local Business Rules",
    newRulePlaceholder: "Add a new business rule local to this node...",
    noLocalRules: "No business rules are defined locally on this node.",
    add: "Add",
    inheritedAndEffectiveRules: "Inherited & Effective Rules (AI Export Context)",
    inheritanceDescription: "Child nodes automatically inherit all business rules of ancestor nodes. Below are the combined active rules that will be supplied to the AI.",
    localRulesLabel: "Local rules",
    inheritedFrom: "Inherited from",
    ruleCount: "rule",
    rulesCount: "rules",
    noRulesDescription: "No inherited or local rules govern this feature.",
    contractsDescription: "Define the contracts/schemas for this feature. These specifications provide deterministic boundaries when coding or verifying components.",
    apiContracts: "API Contracts",
    uiContracts: "UI Contracts / Layout Specs",
    dataContracts: "Data Models / DB Contracts",
    addSpec: "Add Spec",
    noSpecs: "No specs specified. Click \"Add Spec\" to document requirements.",
    testCasesSpec: "Test Cases Specification",
    addTestCase: "Add Test Case",
    noTests: "No tests are specified for this feature.",
    leafRequiresTests: "Leaf features require at least one test case to be marked AI-ready.",
    testTitle: "Test Title",
    testType: "Type",
    precondition: "Precondition",
    preconditionPlaceholder: "e.g. Database contains user record",
    steps: "Steps",
    addStep: "+ Add Step",
    stepPlaceholder: "Step",
    expectedResult: "Expected Result",
    expectedResultPlaceholder: "Expected behavior and output...",
    doneCriteriaChecklist: "Acceptance / Done Criteria Checklist",
    populateStandard: "+ Populate Standard Specs",
    newCriterionPlaceholder: "Add a new custom done criteria...",
    noDoneCriteria: "No done criteria specified.",
    clickPopulate: "Click \"Populate Standard Specs\" to load preloaded criteria.",
    selectScope: "1. Select Scope",
    exportMode: "2. Export Mode",
    copyClipboard: "Copy to Clipboard",
    copied: "Copied!",
    downloadMarkdown: "Download Markdown",
    markdownPreview: "Markdown Output Preview",
    singleNodeScope: "Single Node",
    subtreeScope: "Subtree",
    projectScope: "Full Project",
    aiMode: "AI View",
    humanMode: "Human Spec",
    qaMode: "QA Checklist",
    welcome: "Welcome to FeatureTree AI Planner",
    welcomeSub: "Create a new workspace project in the sidebar or click \"Load Parking Building Sample\" to start exploring.",
    noFeatureSelected: "No Feature Selected",
    selectNodeToEdit: "Select any node in the feature tree to view its metrics, edit requirements, define contracts, or generate AI prompt configurations.",
    aiReady: "AI-Ready",
    partiallyReady: "Partially Ready",
    notReady: "Not Ready",
    missingDetails: "missing detail",
    missingDetailsPlural: "missing details",
    allStatuses: "All Statuses",
    allPriorities: "All Priorities",
    projectRolesTitle: "Project Roles / Stakeholders",
    projectRolesDesc: "Define the user roles that apply across this project. Child features will use this list for role assignment.",
    addRolePlaceholder: "New role name (e.g. Customer, Teacher)...",
    addRoleBtn: "Add Role",
    noRolesDefined: "No custom roles defined. Using default roles.",
    defaultRolesHint: "Default roles: Admin, Manager, Staff, Driver, Guest, System"
  },
  vi: {
    brandTitle: "FeatureTree AI",
    brandSubtitle: "Quản lý Cây Feature Offline",
    workspaceProjects: "Dự án Hiện tại",
    createNewProject: "Tạo dự án mới",
    projectNamePlaceholder: "Tên dự án...",
    projectDescPlaceholder: "Mô tả dự án (tùy chọn)...",
    cancel: "Hủy",
    create: "Tạo mới",
    noProjectsYet: "Chưa có dự án nào. Bấm \"+\" hoặc tải dữ liệu mẫu.",
    templatesQuickLoad: "Mẫu / Nạp nhanh",
    loadParkingSample: "Nạp Dữ liệu Mẫu Parking",
    clientRoleMetrics: "Thống kê Client / Vai trò",
    allClients: "Tất cả Client",
    localBackup: "Sao lưu Dữ liệu",
    exportJson: "Xuất file JSON",
    importJson: "Nhập file JSON",
    searchPlaceholder: "Tìm kiếm feature, rule, mô tả, tag...",
    statusLabel: "Trạng thái:",
    priorityLabel: "Độ ưu tiên:",
    incompleteOnly: "Chưa hoàn thiện",
    leafFeaturesOnly: "Feature lá",
    interactiveFeatureTree: "Cây Feature Trực quan",
    addChild: "Thêm Con",
    addSibling: "Thêm Cùng cấp",
    totalFeatures: "Tổng số feature:",
    footerTip: "Ấn F2 để sửa tên, Del để xóa",
    noFeaturesFound: "Không tìm thấy feature nào khớp với bộ lọc.",
    adjustFilters: "Thử thay đổi từ khóa hoặc các bộ lọc của bạn.",
    // Details
    nodeType: "Loại Node",
    status: "Trạng thái",
    priority: "Độ ưu tiên",
    assignedClients: "Client / Vai trò được gán",
    summaryLabel: "Tóm tắt / Mô tả chức năng",
    summaryPlaceholder: "Mô tả feature này làm gì, câu chuyện người dùng (user story), hoặc mục tiêu...",
    tagsLabel: "Tag (cách nhau bằng dấu phẩy)",
    tagsPlaceholder: "Ví dụ: auth, api, settings",
    dependenciesLabel: "Phụ thuộc (cách nhau bằng dấu phẩy)",
    dependenciesPlaceholder: "Ví dụ: AUTH-LOGIN, PAYMENT-API",
    risksLabel: "Rủi ro (cách nhau bằng dấu phẩy)",
    risksPlaceholder: "Ví dụ: Nhà cung cấp bên thứ 3 gián đoạn",
    notesLabel: "Ghi chú & Cân nhắc kỹ thuật",
    notesPlaceholder: "Các tham chiếu database, link tài liệu, thư viện sử dụng, hoặc ràng buộc kiến trúc...",
    localBusinessRules: "Luật Nghiệp vụ Nội bộ",
    newRulePlaceholder: "Thêm luật nghiệp vụ mới cho node này...",
    noLocalRules: "Chưa có luật nghiệp vụ nội bộ nào cho node này.",
    add: "Thêm",
    inheritedAndEffectiveRules: "Luật Kế thừa & Luật Hiệu lực (Context cho AI)",
    inheritanceDescription: "Các node con sẽ tự động kế thừa toàn bộ luật nghiệp vụ từ các node cha/tổ tiên. Dưới đây là danh sách luật hiệu lực sẽ gửi cho AI.",
    localRulesLabel: "Luật nội bộ",
    inheritedFrom: "Kế thừa từ",
    ruleCount: "luật",
    rulesCount: "luật",
    noRulesDescription: "Feature này chưa có luật nghiệp vụ nào được định nghĩa.",
    contractsDescription: "Định nghĩa các hợp đồng (contracts)/schemas cho feature này. Các đặc tả này tạo ranh giới rõ ràng khi dev code hoặc viết test.",
    apiContracts: "Hợp đồng API",
    uiContracts: "Đặc tả giao diện UI",
    dataContracts: "Mô hình Dữ liệu / DB",
    addSpec: "Thêm Đặc tả",
    noSpecs: "Chưa có đặc tả nào. Bấm \"Thêm Đặc tả\" để bắt đầu.",
    testCasesSpec: "Đặc tả các Kịch bản Test",
    addTestCase: "Thêm Kịch bản Test",
    noTests: "Feature này chưa có kịch bản test nào.",
    leafRequiresTests: "Feature lá cần có ít nhất một kịch bản test để được coi là Sẵn sàng cho AI (AI-ready).",
    testTitle: "Tên kịch bản test",
    testType: "Loại test",
    precondition: "Điều kiện tiên quyết",
    preconditionPlaceholder: "Ví dụ: Database đã có tài khoản user",
    steps: "Các bước thực hiện",
    addStep: "+ Thêm bước",
    stepPlaceholder: "Bước",
    expectedResult: "Kết quả mong đợi",
    expectedResultPlaceholder: "Mô tả hành vi và kết quả trả về...",
    doneCriteriaChecklist: "Checklist Tiêu chí Hoàn thành (Done Criteria)",
    populateStandard: "+ Nạp Tiêu chí Tiêu chuẩn",
    newCriterionPlaceholder: "Thêm tiêu chí hoàn thành mới...",
    noDoneCriteria: "Chưa có tiêu chí hoàn thành nào.",
    clickPopulate: "Bấm \"Nạp Tiêu chí Tiêu chuẩn\" để tải các tiêu chí mặc định.",
    selectScope: "1. Chọn Phạm vi",
    exportMode: "2. Chế độ Xuất",
    copyClipboard: "Sao chép Clipboard",
    copied: "Đã sao chép!",
    downloadMarkdown: "Tải file Markdown",
    markdownPreview: "Xem trước nội dung Markdown",
    singleNodeScope: "Node Hiện tại",
    subtreeScope: "Nhánh Con",
    projectScope: "Toàn bộ Dự án",
    aiMode: "Chế độ AI",
    humanMode: "Chế độ Người đọc",
    qaMode: "Checklist QA",
    welcome: "Chào mừng đến với FeatureTree AI Planner",
    welcomeSub: "Tạo dự án mới ở thanh bên trái hoặc bấm \"Nạp Dữ liệu Mẫu Parking\" để bắt đầu khám phá.",
    noFeatureSelected: "Chưa chọn Feature",
    selectNodeToEdit: "Bấm chọn một node bất kỳ trên cây feature để xem thống kê, sửa yêu cầu, định nghĩa contract, hoặc xuất prompt cho AI.",
    aiReady: "Sẵn sàng cho AI",
    partiallyReady: "Hoàn thành Một phần",
    notReady: "Chưa Sẵn sàng",
    missingDetails: "yêu cầu còn thiếu",
    missingDetailsPlural: "yêu cầu còn thiếu",
    allStatuses: "Tất cả Trạng thái",
    allPriorities: "Tất cả Độ ưu tiên",
    projectRolesTitle: "Vai trò Dự án / Các bên liên quan",
    projectRolesDesc: "Định nghĩa các vai trò người dùng trong dự án. Các feature con sẽ dùng danh sách này để gán vai trò.",
    addRolePlaceholder: "Tên vai trò mới (VD: Khách hàng, Giáo viên)...",
    addRoleBtn: "Thêm Vai trò",
    noRolesDefined: "Chưa định nghĩa vai trò tùy chỉnh. Đang dùng vai trò mặc định.",
    defaultRolesHint: "Vai trò mặc định: Admin, Manager, Staff, Driver, Guest, System"
  }
};
`````

### `src/domain/projectBackup.ts`

`````typescript
import type { FeatureNode, FeatureNodeType, FeatureStatus, Priority } from "./featureNode.types";
import { DEFAULT_CLIENT_ROLES } from "./featureNode.types";
import { normalizeRole, validateFeatureTree, type TreeValidationIssue } from "./taxonomy";

export const CURRENT_PROJECT_VERSION = "2.0.0";

export interface ProjectBackupData {
  version: string;
  projectName: string;
  projectDescription: string;
  clients: { id: string; name: string }[];
  nodes: FeatureNode[];
}

export interface ParsedProjectBackup {
  data: ProjectBackupData;
  sourceVersion: string;
  migrated: boolean;
  issues: TreeValidationIssue[];
}

const NODE_TYPES: FeatureNodeType[] = ["project", "category", "feature", "sub_feature", "leaf_feature", "rule_group", "client_group"];
const STATUSES: FeatureStatus[] = ["draft", "ready", "in_progress", "implemented", "tested", "done", "blocked"];
const PRIORITIES: Priority[] = ["low", "medium", "high", "must_have"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeNode(value: unknown, index: number, roles: string[]): FeatureNode {
  if (!isRecord(value)) throw new Error(`nodes[${index}] must be an object.`);
  const now = new Date().toISOString();
  const type = NODE_TYPES.includes(value.type as FeatureNodeType) ? value.type as FeatureNodeType : "leaf_feature";
  const status = STATUSES.includes(value.status as FeatureStatus) ? value.status as FeatureStatus : "draft";
  const priority = PRIORITIES.includes(value.priority as Priority) ? value.priority as Priority : "medium";
  const clients = strings(value.clients).map(role => normalizeRole(role, roles) || role);

  return {
    ...value,
    id: typeof value.id === "string" ? value.id : "",
    parentId: typeof value.parentId === "string" ? value.parentId : null,
    title: typeof value.title === "string" ? value.title : "",
    type,
    clients,
    status,
    priority,
    tags: strings(value.tags),
    summary: typeof value.summary === "string" ? value.summary : "",
    businessRules: strings(value.businessRules),
    apiContracts: Array.isArray(value.apiContracts) ? value.apiContracts as FeatureNode["apiContracts"] : [],
    uiContracts: Array.isArray(value.uiContracts) ? value.uiContracts as FeatureNode["uiContracts"] : [],
    dataContracts: Array.isArray(value.dataContracts) ? value.dataContracts as FeatureNode["dataContracts"] : [],
    testCases: Array.isArray(value.testCases) ? value.testCases as FeatureNode["testCases"] : [],
    doneCriteria: Array.isArray(value.doneCriteria) ? value.doneCriteria as FeatureNode["doneCriteria"] : [],
    dependencies: strings(value.dependencies),
    risks: strings(value.risks),
    notes: typeof value.notes === "string" ? value.notes : "",
    permissions: Array.isArray(value.permissions)
      ? (value.permissions as { role: string; permission: string }[]).map(item => ({
          ...item,
          role: normalizeRole(item.role, roles) || item.role,
        }))
      : undefined,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
    order: typeof value.order === "number" ? value.order : index,
  } as FeatureNode;
}

export function parseProjectBackup(input: unknown): ParsedProjectBackup {
  if (!isRecord(input)) throw new Error("Backup must contain a JSON object.");
  if (typeof input.projectName !== "string" || !input.projectName.trim()) throw new Error("projectName is required.");
  if (!Array.isArray(input.nodes)) throw new Error("nodes must be an array.");

  const sourceVersion = typeof input.version === "string" ? input.version : "1.0.0";
  const major = Number.parseInt(sourceVersion.split(".")[0], 10);
  if (!Number.isFinite(major) || major < 1 || major > 2) {
    throw new Error(`Unsupported backup version ${sourceVersion}. Supported major versions: 1 and 2.`);
  }

  const clients = Array.isArray(input.clients)
    ? input.clients
        .filter(isRecord)
        .map(client => ({
          id: typeof client.id === "string" ? client.id : String(client.name || ""),
          name: typeof client.name === "string" ? client.name.trim() : "",
        }))
        .filter(client => client.name)
    : DEFAULT_CLIENT_ROLES.map(name => ({ id: name, name }));
  const discoveredRoles = input.nodes.flatMap(node => {
    if (!isRecord(node)) return [];
    const permissionRoles = Array.isArray(node.permissions)
      ? node.permissions.filter(isRecord).map(permission => permission.role).filter((role): role is string => typeof role === "string")
      : [];
    return [...strings(node.clients), ...permissionRoles];
  });
  const configuredRoles = clients.length ? clients.map(client => client.name) : [...DEFAULT_CLIENT_ROLES];
  const roles = [...new Set([...configuredRoles, ...discoveredRoles]
    .filter(role => !["anonymous", "public"].includes(role.toLowerCase()))
    .map(role => normalizeRole(role, [...DEFAULT_CLIENT_ROLES]) || role))];
  const nodes = input.nodes.map((node, index) => normalizeNode(node, index, roles));
  const root = nodes.find(node => node.parentId === null && node.type === "project");
  if (root) root.metadata = { ...root.metadata, roles };

  const data: ProjectBackupData = {
    version: CURRENT_PROJECT_VERSION,
    projectName: input.projectName.trim(),
    projectDescription: typeof input.projectDescription === "string" ? input.projectDescription : "",
    clients: roles.map(name => ({ id: name, name })),
    nodes,
  };

  return {
    data,
    sourceVersion,
    migrated: sourceVersion !== CURRENT_PROJECT_VERSION,
    issues: validateFeatureTree(nodes),
  };
}
`````

### `src/domain/taxonomy.ts`

`````typescript
import {
  DEFAULT_CLIENT_ROLES,
  type FeatureNode,
  type FeatureNodeType,
} from "./featureNode.types";

export type ValidationSeverity = "critical" | "high" | "medium" | "low";

export interface TreeValidationIssue {
  code: string;
  severity: ValidationSeverity;
  nodeId?: string;
  path?: string;
  message: string;
  blocksSave: boolean;
}

export const CHILD_TYPE_RULES: Record<FeatureNodeType, readonly FeatureNodeType[]> = {
  project: ["category", "rule_group", "client_group"],
  category: ["category", "feature", "leaf_feature", "rule_group"],
  feature: ["sub_feature", "leaf_feature", "rule_group"],
  sub_feature: ["sub_feature", "leaf_feature", "rule_group"],
  leaf_feature: [],
  rule_group: [],
  client_group: [],
};

const GENERIC_TITLES = new Set([
  "common functions",
  "handle data",
  "system management",
  "dashboard page",
  "management",
  "feature",
  "new feature",
]);

export function canContainChild(parentType: FeatureNodeType, childType: FeatureNodeType): boolean {
  return CHILD_TYPE_RULES[parentType].includes(childType);
}

export function getSuggestedChildType(parentType: FeatureNodeType): FeatureNodeType | null {
  if (parentType === "project") return "category";
  if (parentType === "category") return "feature";
  if (parentType === "feature" || parentType === "sub_feature") return "leaf_feature";
  return null;
}

export function getProjectRoleRegistry(nodes: FeatureNode[]): string[] {
  const projectRoot = nodes.find(node => node.type === "project" && node.parentId === null);
  const configured = projectRoot?.metadata?.roles
    ?.map(role => role.trim())
    .filter(Boolean);
  return configured && configured.length > 0 ? [...new Set(configured)] : [...DEFAULT_CLIENT_ROLES];
}

export function normalizeRole(role: string, registry: string[]): string | null {
  const exact = registry.find(candidate => candidate === role);
  if (exact) return exact;
  const matches = registry.filter(candidate => candidate.toLowerCase() === role.toLowerCase());
  return matches.length === 1 ? matches[0] : null;
}

export function validateFeatureTree(nodes: FeatureNode[]): TreeValidationIssue[] {
  const issues: TreeValidationIssue[] = [];
  const byId = new Map<string, FeatureNode>();
  const idCounts = new Map<string, number>();
  const childrenByParent = new Map<string | null, FeatureNode[]>();
  const roles = getProjectRoleRegistry(nodes);

  for (const node of nodes) {
    idCounts.set(node.id, (idCounts.get(node.id) || 0) + 1);
    if (!byId.has(node.id)) byId.set(node.id, node);
    const siblings = childrenByParent.get(node.parentId) || [];
    siblings.push(node);
    childrenByParent.set(node.parentId, siblings);
  }

  const roots = nodes.filter(node => node.parentId === null);
  const projectRoots = roots.filter(node => node.type === "project");
  if (roots.length !== 1 || projectRoots.length !== 1) {
    issues.push({
      code: "TREE_SINGLE_PROJECT_ROOT",
      severity: "critical",
      message: "Tree must contain exactly one root node of type project.",
      blocksSave: true,
    });
  }

  for (const [id, count] of idCounts) {
    if (count > 1) {
      issues.push({ code: "TREE_DUPLICATE_NODE_ID", severity: "critical", nodeId: id, message: `Duplicate node ID: ${id}`, blocksSave: true });
    }
  }

  const pathFor = (node: FeatureNode): string => {
    const titles: string[] = [];
    const visited = new Set<string>();
    let current: FeatureNode | undefined = node;
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      titles.unshift(current.title);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return titles.join(" > ");
  };

  for (const node of nodes) {
    const path = pathFor(node);
    if (!node.title.trim()) {
      issues.push({ code: "NAME_EMPTY", severity: "critical", nodeId: node.id, path, message: "Node title cannot be empty.", blocksSave: true });
    }
    if (node.parentId && !byId.has(node.parentId)) {
      issues.push({ code: "TREE_ORPHAN", severity: "critical", nodeId: node.id, path, message: `Parent ${node.parentId} does not exist.`, blocksSave: true });
    }
    if (node.parentId) {
      const parent = byId.get(node.parentId);
      if (parent && !canContainChild(parent.type, node.type)) {
        issues.push({ code: "TREE_INVALID_PARENT_CHILD", severity: "high", nodeId: node.id, path, message: `${parent.type} cannot contain ${node.type}.`, blocksSave: true });
      }
    }
    if (node.type === "leaf_feature" && (childrenByParent.get(node.id)?.length || 0) > 0) {
      issues.push({ code: "TREE_LEAF_HAS_CHILDREN", severity: "critical", nodeId: node.id, path, message: "Leaf features cannot contain child nodes.", blocksSave: true });
    }

    const title = node.title.trim();
    const lowerTitle = title.toLowerCase();
    if (GENERIC_TITLES.has(lowerTitle)) {
      issues.push({ code: "NAME_TOO_GENERIC", severity: "medium", nodeId: node.id, path, message: `Title is too generic: ${title}`, blocksSave: false });
    }
    if (/^(GET|POST|PUT|PATCH|DELETE)\s+\/api\//i.test(title) || /^\//.test(title)) {
      issues.push({ code: "NAME_TECHNICAL_ROUTE", severity: "medium", nodeId: node.id, path, message: "Use a business outcome instead of a route as the node title.", blocksSave: false });
    }
    if (/\b(CRUD|Page|Component|Table)\b/i.test(title)) {
      issues.push({ code: "NAME_IMPLEMENTATION_TERM", severity: "medium", nodeId: node.id, path, message: "Title looks implementation-oriented; prefer a business capability or outcome.", blocksSave: false });
    }

    for (const role of [...(node.clients || []), ...(node.permissions || []).map(item => item.role)]) {
      if (!normalizeRole(role, roles) && role.toLowerCase() !== "anonymous" && role.toLowerCase() !== "public") {
        issues.push({ code: "ROLE_NOT_REGISTERED", severity: "high", nodeId: node.id, path, message: `Role is not registered: ${role}`, blocksSave: true });
      }
    }
  }

  for (const [parentId, siblings] of childrenByParent) {
    const orders = new Set<number>();
    const titles = new Map<string, FeatureNode[]>();
    for (const node of siblings) {
      if (orders.has(node.order)) {
        issues.push({ code: "TREE_DUPLICATE_ORDER", severity: "medium", nodeId: node.id, path: pathFor(node), message: `Duplicate sibling order under ${parentId || "root"}.`, blocksSave: false });
      }
      orders.add(node.order);
      const key = node.title.trim().toLowerCase();
      titles.set(key, [...(titles.get(key) || []), node]);
    }
    for (const duplicate of titles.values()) {
      if (duplicate.length > 1) {
        issues.push({ code: "NAME_DUPLICATE_SIBLING", severity: "high", nodeId: duplicate[0].id, path: pathFor(duplicate[0]), message: `Duplicate sibling title: ${duplicate[0].title}`, blocksSave: true });
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string) => {
    if (visiting.has(id)) {
      issues.push({ code: "TREE_CYCLE", severity: "critical", nodeId: id, message: `Cycle detected at ${id}.`, blocksSave: true });
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const child of childrenByParent.get(id) || []) visit(child.id);
    visiting.delete(id);
    visited.add(id);
  };
  for (const root of roots) visit(root.id);
  for (const node of nodes) visit(node.id);

  const nestedIds = new Map<string, { nodeId: string; kind: string }>();
  for (const node of nodes) {
    for (const kind of ["testCases", "doneCriteria", "apiContracts", "uiContracts", "dataContracts"] as const) {
      for (const item of node[kind] || []) {
        const existing = nestedIds.get(`${kind}:${item.id}`);
        if (existing) {
          issues.push({ code: "NESTED_DUPLICATE_ID", severity: "high", nodeId: node.id, path: pathFor(node), message: `${kind} ID ${item.id} is also used by ${existing.nodeId}.`, blocksSave: true });
        } else {
          nestedIds.set(`${kind}:${item.id}`, { nodeId: node.id, kind });
        }
      }
    }
  }

  return issues;
}
`````

### `src/index.css`

`````css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

@import "tailwindcss";

:root {
  font-family: 'Outfit', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

body {
  background-color: #f8fafc; /* slate-50 background */
  color: #0f172a; /* slate-900 text */
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* Smooth transitions */
.transition-all-200 {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Scrollbar customization */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(241, 245, 249, 0.5); /* slate-100 */
}

::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3); /* slate-400 */
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}

/* Glassmorphism utility */
.glass-panel {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.8); /* slate-200 border */
}

.glass-card {
  background: rgba(248, 250, 252, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(226, 232, 240, 0.5);
}

/* Active Arborist Node Styling */
.ap-node-active {
  background: linear-gradient(90deg, rgba(79, 70, 229, 0.08) 0%, rgba(79, 70, 229, 0.02) 100%);
  border-left: 3px solid #4f46e5; /* Indigo-600 */
}

/* Focus styles */
*:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 1px;
}
`````

### `src/main.tsx`

`````tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`````

### `src/seed/parkingBuildingSeed.ts`

`````typescript
import { createSeedNode, type SeedNodeInput } from "../domain/featureNodeFactory";
import type { FeatureNode, TestCase, DoneCriterion, ContractField } from "../domain/featureNode.types";
import { migrateParkingTaxonomy } from "./parkingTaxonomyMigration";

// Helper to generate test cases for leaf features
function defaultApiTests(featureTitle: string, clients: string[], endpoints: string[]): TestCase[] {
  const tests: TestCase[] = [
    {
      id: `tc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-auth`,
      title: `Verify authorized client (${clients.join(", ")}) can access "${featureTitle}" successfully`,
      type: "api",
      precondition: `Client is authenticated with role: ${clients[0] || "Public"}`,
      steps: [
        `Authenticate user as ${clients[0] || "Guest"}`,
        `Invoke endpoint: ${endpoints[0] || "N/A"}`,
        `Check response code is 200/201 OK`
      ],
      expectedResult: `Request succeeds and returns correct payload`,
      status: "not_started"
    },
    {
      id: `tc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-unauth`,
      title: `Verify unauthorized role is rejected when accessing "${featureTitle}"`,
      type: "api",
      precondition: `User is anonymous or lacks required role`,
      steps: [
        `Attempt to invoke endpoint: ${endpoints[0] || "N/A"} without token/role`,
        `Check response status code is 401 Unauthorized or 403 Forbidden`
      ],
      expectedResult: `Request is blocked and returns clear error response`,
      status: "not_started"
    }
  ];

  // Specific tests based on title keywords
  const titleLower = featureTitle.toLowerCase();
  if (titleLower.includes("payment") || titleLower.includes("payos") || titleLower.includes("fee") || titleLower.includes("exit")) {
    tests.push({
      id: `tc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-mismatch`,
      title: `Verify amount or payment status mismatch is handled safely`,
      type: "integration",
      expectedResult: `Transaction is flagged for review or rejected without state mutation`,
      status: "not_started"
    });
  }
  if (titleLower.includes("reservation") || titleLower.includes("session") || titleLower.includes("booking")) {
    tests.push({
      id: `tc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-expired`,
      title: `Verify request with expired reservation or session token is rejected`,
      type: "integration",
      expectedResult: `System returns validation error stating resource has expired`,
      status: "not_started"
    });
  }
  if (titleLower.includes("public") || titleLower.includes("info") || titleLower.includes("pricing") || titleLower.includes("available")) {
    tests.push({
      id: `tc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-sanitize`,
      title: `Verify public request returns sanitized data without private details`,
      type: "api",
      expectedResult: `Returned JSON contains only public fields`,
      status: "not_started"
    });
  }
  if (titleLower.includes("report") || titleLower.includes("export")) {
    tests.push({
      id: `tc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-export`,
      title: `Verify export endpoint returns correct spreadsheet binary type`,
      type: "integration",
      expectedResult: `Response content-type is application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,
      status: "not_started"
    });
  }

  return tests;
}

// Helper to generate done criteria
function defaultDoneCriteria(featureTitle: string): DoneCriterion[] {
  const criteria: DoneCriterion[] = [
    { id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-contract`, content: "API contract is documented in this node.", checked: false },
    { id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-clients`, content: "Required clients/roles are assigned.", checked: false },
    { id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-rules`, content: "Business rules and inherited rules are visible in AI export.", checked: false },
    { id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-resp`, content: "Success response uses common API response format where applicable.", checked: false },
    { id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-err`, content: "Error response is clear and does not leak sensitive data.", checked: false },
    { id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-tests`, content: "At least two test cases are defined.", checked: false },
    { id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-export`, content: "Feature can be exported as AI-readable Markdown.", checked: false }
  ];

  const titleLower = featureTitle.toLowerCase();
  if (titleLower.includes("create") || titleLower.includes("ui") || titleLower.includes("edit") || titleLower.includes("form") || titleLower.includes("dashboard")) {
    criteria.push({ id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-uistate`, content: "UI states are documented: idle, loading, success, empty, error.", checked: false });
    criteria.push({ id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-uivalidate`, content: "Validation and error display behavior are documented.", checked: false });
  }

  if (titleLower.includes("payment") || titleLower.includes("reservation") || titleLower.includes("session")) {
    criteria.push({ id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-edge`, content: "Edge cases are documented.", checked: false });
    criteria.push({ id: `dc-${featureTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-transitions`, content: "Payment/session/reservation state transition is documented.", checked: false });
  }

  return criteria;
}

// Generate API Contracts
function createApiContract(endpoint: string): ContractField[] {
  const method = endpoint.split(" ")[0] || "GET";
  const path = endpoint.split(" ")[1] || "/";
  return [
    {
      id: `api-contract-${path.replace(/[^a-z0-9]/g, "-")}`,
      name: `${method} ${path}`,
      content: `Method: ${method}\nPath: ${path}\nHeaders:\n  Authorization: Bearer <token>\nResponse:\n  status: 200 OK\n  data: { success: true }`
    }
  ];
}

export function createParkingBuildingSeedTree(): FeatureNode[] {
  const seedInput: SeedNodeInput = {
    id: "root-parking-system",
    title: "Parking Building Management System",
    type: "project",
    clients: ["Admin", "Manager", "Staff", "Driver", "Guest", "System"],
    status: "in_progress",
    priority: "must_have",
    tags: ["system", "parking", "core"],
    summary: "Integrated solution for managing multi-floor parking buildings, spaces, pricing, reservations, automated gate sessions, and digital payments.",
    businessRules: [
      "The system manages parking building operations for public guests, drivers, staff, managers, and admins.",
      "The backend is split into .NET Core API for transactional/write operations and Spring Boot Support API for support/read/report/public operations.",
      "All APIs should return a consistent success/error response format.",
      "Authenticated APIs must validate JWT and role permissions.",
      "Both backend services access a shared PostgreSQL database, maintaining strict entity ownership.",
      "Global error handling middleware must prevent internal stack traces from leaking to clients.",
      "A request logging system must log all incoming API requests for security tracing.",
      "All manager/admin mutating operations must be logged to a dedicated audit schema."
    ],
    children: [
      // 3. Authentication
      {
        id: "cat-authentication",
        title: "Authentication",
        type: "category",
        summary: "Authentication flows to verify user identity.",
        businessRules: [
          "Login must return authenticated user information and a usable access token.",
          "Disabled or inactive users must not be allowed to access protected features."
        ],
        children: [
          {
            id: "leaf-auth-session",
            title: "Login & Session Management",
            type: "leaf_feature",
            summary: "User authentication flows, current user profile retrieval, JWT token refreshing, and session termination.",
            clients: ["Driver", "Staff", "Manager", "Admin"],
            status: "ready",
            priority: "high",
            tags: ["auth", "session", "security"],
            dependencies: [],
            risks: [],
            notes: "Immediate session revocation requires access token blacklisting using JWT jti claims.",
            ownerService: ".NET Core API",
            objective: "Implement complete authentication and session management for the Parking Building Management System. This feature must allow users to:\n1. Login with username and password.\n2. Receive a short-lived JWT access token.\n3. Receive a secure refresh token.\n4. Retrieve the current authenticated user profile.\n5. Refresh expired access tokens using refresh token rotation.\n6. Logout and revoke the current session.\n7. Prevent disabled or inactive users from accessing protected APIs.\n\nThe .NET Core API is the owner of authentication. The Spring Boot Support API must be able to validate the JWT issued by the .NET Core API.",
            inScope: [
              "Login with username and password.",
              "Receive a short-lived JWT access token.",
              "Receive a secure refresh token.",
              "Retrieve the current authenticated user profile.",
              "Refresh expired access tokens using refresh token rotation.",
              "Logout and revoke the current session.",
              "Prevent disabled or inactive users from accessing protected APIs."
            ],
            outOfScope: [
              "Third-party OAuth identity providers (Google, Facebook).",
              "User registration or signup flow.",
              "Frontend UI theme customization."
            ],
            permissions: [
              { role: "Driver", permission: "Can login, retrieve own profile, refresh token, and logout." },
              { role: "Staff", permission: "Can login, retrieve own profile, refresh token, and logout." },
              { role: "Manager", permission: "Can login, retrieve own profile, refresh token, and logout." },
              { role: "Admin", permission: "Can login, retrieve own profile, refresh token, and logout." }
            ],
            dbExistingTables: ["users", "user_roles"],
            dbNewTablesSql: `-- Table for storing hashed refresh tokens
CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  token_hash text NOT NULL,
  token_family_id uuid NOT NULL,
  jwt_id varchar(255) null,
  expires_at timestamp not null,
  revoked_at timestamp null,
  replaced_by_token_hash text null,
  created_at timestamp not null,
  created_by_ip varchar(100) null,
  revoked_by_ip varchar(100) null,
  revocation_reason varchar(255) null
);

CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- Table for storing revoked access tokens (blacklist)
CREATE TABLE revoked_access_tokens (
  id uuid PRIMARY KEY,
  jwt_id varchar(255) UNIQUE NOT NULL,
  user_id uuid NOT NULL,
  expires_at timestamp NOT NULL,
  revoked_at timestamp NOT NULL,
  reason varchar(255) NULL
);`,
            dbRelationships: ["refresh_tokens(user_id) references users(id)"],
             validationRules: [
              { field: "username", rule: "Required, non-empty, string", errorMessage: "Username is required." },
              { field: "password", rule: "Required, non-empty, string", errorMessage: "Password is required." }
            ],
            securityRules: [
              "Never log raw password, raw access token, or raw refresh token.",
              "Store only the hashed refresh token in the database using secure SHA256 hashing.",
              "Login endpoint must have rate limiting (limit: 5 failed attempts per username/IP in 15 minutes).",
              "Use HTTPS in production and load JWT secrets from secure configuration / environment.",
              "Use constant-time comparison for token validation if available.",
              "All date/time values must use UTC.",
              "Error messages must not reveal username existence (use generic 'Invalid username or password')."
            ],
            logEvents: [
              "Successful login events.",
              "Failed login attempts.",
              "Disabled, inactive, locked, or deleted user login attempts.",
              "Token refresh success.",
              "Refresh token reuse anomaly detection.",
              "Logout session revocation."
            ],
            noLogEvents: [
              "Raw passwords.",
              "Access tokens.",
              "Refresh tokens."
            ],
            integrationPoints: [
              { system: "Spring Boot Support API", responsibility: "Must validate JWT signature, claims, and enforce current-account-status check (e.g., rejecting disabled, inactive, or deleted users immediately)." }
            ],
            uiPage: "/login",
            uiComponents: "LoginForm, Button, FormInput",
            uiStateLoading: "Show spinner overlay on the login card, disable the submit button and input fields to prevent double submission.",
            uiStateEmpty: "Not applicable for authentication screen.",
            uiStateError: "Display a warning banner toast indicating validation fails or invalid credential messages.",
            uiStateSuccess: "Redirect the authenticated user to the main home dashboard and display a welcome toast message.",
            endpoints: [
              "POST /api/core/auth/login",
              "GET /api/core/auth/me",
              "POST /api/core/auth/refresh-token",
              "POST /api/core/auth/logout"
            ],
            apiContracts: [
              {
                id: "contract-auth-login",
                name: "POST /api/core/auth/login",
                content: `Method: POST
Path: /api/core/auth/login
Headers:
  Content-Type: application/json
Request Body:
  {
    "username": "driver_john",
    "password": "Password123"
  }
Success Response (200 OK):
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOi...",
      "expiresIn": 3600,
      "refreshToken": "d8f3k9s...",
      "user": {
        "id": "usr-12345",
        "username": "driver_john",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "roles": ["Driver"],
        "status": "Active"
      }
    },
    "message": "Login successful.",
    "errors": null
  }
Validation Error Response (400 Bad Request):
  {
    "success": false,
    "data": null,
    "message": "Validation failed.",
    "errors": [
      { "field": "username", "message": "Username is required." }
    ]
  }
Invalid Credentials Response (401 Unauthorized):
  {
    "success": false,
    "data": null,
    "message": "Invalid username or password.",
    "errors": null
  }
Disabled/Inactive/Locked/Deleted Account Response (401 Unauthorized):
  {
    "success": false,
    "data": null,
    "message": "Invalid username or password.",
    "errors": null
  }`
              },
              {
                id: "contract-auth-me",
                name: "GET /api/core/auth/me",
                content: `Method: GET
Path: /api/core/auth/me
Headers:
  Authorization: Bearer <accessToken>
Success Response (200 OK):
  {
    "success": true,
    "data": {
      "id": "usr-12345",
      "username": "driver_john",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "roles": ["Driver"],
      "status": "Active"
    },
    "message": null,
    "errors": null
  }
Unauthorized Response (401 Unauthorized):
  {
    "success": false,
    "data": null,
    "message": "Unauthorized. Token is invalid or expired.",
    "errors": null
  }
Disabled/Inactive Account Response (403 Forbidden):
  {
    "success": false,
    "data": null,
    "message": "Your account is disabled or inactive.",
    "errors": null
  }`
              },
              {
                id: "contract-auth-refresh",
                name: "POST /api/core/auth/refresh-token",
                content: `Method: POST
Path: /api/core/auth/refresh-token
Headers:
  Content-Type: application/json
Request Body:
  {
    "refreshToken": "d8f3k9s..."
  }
Success Response (200 OK):
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOi...",
      "expiresIn": 3600,
      "refreshToken": "new_d8f3k9s..."
    },
    "message": "Token refreshed successfully.",
    "errors": null
  }
Invalid/Expired/Revoked Refresh Token Response (400 Bad Request):
  {
    "success": false,
    "data": null,
    "message": "Invalid or expired refresh token.",
    "errors": null
  }`
              },
              {
                id: "contract-auth-logout",
                name: "POST /api/core/auth/logout",
                content: `Method: POST
Path: /api/core/auth/logout
Headers:
  Authorization: Bearer <accessToken>
Success Response (200 OK):
  {
    "success": true,
    "data": null,
    "message": "Session terminated successfully.",
    "errors": null
  }
Invalid Token Response (401 Unauthorized):
  {
    "success": false,
    "data": null,
    "message": "Invalid token.",
    "errors": null
  }`
              }
            ],
            testCases: [
              {
                id: "tc-auth-login-success",
                title: "Login - Happy Path (Success)",
                type: "integration",
                precondition: "Active user exists. Password hash matches test password.",
                steps: ["Send POST /api/core/auth/login with valid username and password."],
                expectedResult: "Returns 200 OK with success=true, accessToken, refreshToken, expiresIn = 3600, and user info. Password hash is not returned.",
                status: "not_started"
              },
              {
                id: "tc-auth-login-empty-username",
                title: "Login - Empty Username",
                type: "integration",
                precondition: "None.",
                steps: ["Send login request with empty username."],
                expectedResult: "Returns 400 Bad Request with success=false and username validation error message.",
                status: "not_started"
              },
              {
                id: "tc-auth-login-empty-password",
                title: "Login - Empty Password",
                type: "integration",
                precondition: "None.",
                steps: ["Send login request with empty password."],
                expectedResult: "Returns 400 Bad Request with success=false and password validation error message.",
                status: "not_started"
              },
              {
                id: "tc-auth-login-invalid-password",
                title: "Login - Invalid Password",
                type: "integration",
                precondition: "User exists.",
                steps: ["Send login request with correct username and wrong password."],
                expectedResult: "Returns 401 Unauthorized with success=false and message 'Invalid username or password.'",
                status: "not_started"
              },
              {
                id: "tc-auth-login-unknown-username",
                title: "Login - Unknown Username",
                type: "integration",
                precondition: "None.",
                steps: ["Send login request with non-existing username."],
                expectedResult: "Returns 401 Unauthorized with message 'Invalid username or password.' and does not reveal whether username exists.",
                status: "not_started"
              },
              {
                id: "tc-auth-login-disabled-account",
                title: "Login - Disabled Account",
                type: "integration",
                precondition: "User exists with status 'Disabled'.",
                steps: ["Send login request with correct credentials."],
                expectedResult: "Returns 401 Unauthorized with success=false and generic 'Invalid username or password' message to prevent user enumeration.",
                status: "not_started"
              },
              {
                id: "tc-auth-login-inactive-account",
                title: "Login - Inactive Account",
                type: "integration",
                precondition: "User exists with status 'Inactive'.",
                steps: ["Send login request with correct credentials."],
                expectedResult: "Returns 401 Unauthorized with success=false and generic 'Invalid username or password' message.",
                status: "not_started"
              },
              {
                id: "tc-auth-login-locked-account",
                title: "Login - Locked Account",
                type: "integration",
                precondition: "User exists with status 'Locked'.",
                steps: ["Send login request with correct credentials."],
                expectedResult: "Returns 401 Unauthorized with success=false and generic 'Invalid username or password' message.",
                status: "not_started"
              },
              {
                id: "tc-auth-login-deleted-account",
                title: "Login - Deleted Account",
                type: "integration",
                precondition: "User is soft-deleted.",
                steps: ["Send login request with correct credentials."],
                expectedResult: "Returns 401 Unauthorized with success=false and generic 'Invalid username or password' message.",
                status: "not_started"
              },
              {
                id: "tc-auth-me-success",
                title: "Get Profile - Happy Path (Success)",
                type: "integration",
                precondition: "User has valid access token.",
                steps: ["Send GET /api/core/auth/me with valid Bearer token."],
                expectedResult: "Returns 200 OK with success=true and current user profile details, without password hash.",
                status: "not_started"
              },
              {
                id: "tc-auth-me-missing-token",
                title: "Get Profile - Missing Token",
                type: "integration",
                precondition: "None.",
                steps: ["Send GET /api/core/auth/me without Authorization header."],
                expectedResult: "Returns 401 Unauthorized.",
                status: "not_started"
              },
              {
                id: "tc-auth-me-malformed-token",
                title: "Get Profile - Malformed Token",
                type: "integration",
                precondition: "None.",
                steps: ["Send GET /api/core/auth/me with malformed Bearer token."],
                expectedResult: "Returns 401 Unauthorized.",
                status: "not_started"
              },
              {
                id: "tc-auth-me-expired-token",
                title: "Get Profile - Expired Token",
                type: "integration",
                precondition: "None.",
                steps: ["Send GET /api/core/auth/me with expired token."],
                expectedResult: "Returns 401 Unauthorized.",
                status: "not_started"
              },
              {
                id: "tc-auth-me-disabled-after-login",
                title: "Get Profile - Disabled After Login",
                type: "integration",
                precondition: "User logs in successfully, user status is then changed to 'Disabled'.",
                steps: ["Send GET /api/core/auth/me using old valid access token."],
                expectedResult: "Returns 403 Forbidden.",
                status: "not_started"
              },
              {
                id: "tc-auth-refresh-success",
                title: "Refresh Token - Happy Path (Success)",
                type: "integration",
                precondition: "User has active refresh token.",
                steps: ["Send POST /api/core/auth/refresh-token with active refresh token."],
                expectedResult: "Returns 200 OK with new access token and new refresh token, old refresh token is revoked.",
                status: "not_started"
              },
              {
                id: "tc-auth-refresh-missing-token",
                title: "Refresh Token - Missing Token",
                type: "integration",
                precondition: "None.",
                steps: ["Send refresh request with empty body."],
                expectedResult: "Returns 400 Bad Request.",
                status: "not_started"
              },
              {
                id: "tc-auth-refresh-expired-token",
                title: "Refresh Token - Expired Token",
                type: "integration",
                precondition: "Refresh token exists but expired.",
                steps: ["Send refresh request."],
                expectedResult: "Returns 400 Bad Request with message 'Invalid or expired refresh token.'",
                status: "not_started"
              },
              {
                id: "tc-auth-refresh-revoked-reuse",
                title: "Refresh Token - Revoked Token Reuse",
                type: "integration",
                precondition: "Refresh token was already used or revoked.",
                steps: ["Send refresh request using revoked token."],
                expectedResult: "Returns 400 Bad Request, token family is revoked, security audit log created.",
                status: "not_started"
              },
              {
                id: "tc-auth-refresh-disabled-user",
                title: "Refresh Token - Disabled User",
                type: "integration",
                precondition: "User has valid refresh token, user status becomes 'Disabled'.",
                steps: ["Send refresh request."],
                expectedResult: "Returns 403 Forbidden, no new token issued.",
                status: "not_started"
              },
              {
                id: "tc-auth-logout-success",
                title: "Logout - Happy Path (Success)",
                type: "integration",
                precondition: "User has valid active session.",
                steps: ["Send POST /api/core/auth/logout with valid Bearer token."],
                expectedResult: "Returns 200 OK, refresh token/session is revoked, access token jti is blacklisted.",
                status: "not_started"
              },
              {
                id: "tc-auth-logout-missing-token",
                title: "Logout - Missing Token",
                type: "integration",
                precondition: "None.",
                steps: ["Send logout request without Authorization header."],
                expectedResult: "Returns 401 Unauthorized.",
                status: "not_started"
              },
              {
                id: "tc-auth-logout-reuse-token",
                title: "Logout - Reuse Access Token After Logout",
                type: "integration",
                precondition: "User logs in, user logs out.",
                steps: ["Call protected endpoint using the same old access token."],
                expectedResult: "Returns 401 Unauthorized due to access token revocation check (technical decision on blacklist/versioning strategy).",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-auth-login-impl", content: "Login endpoint is fully implemented.", checked: false },
              { id: "dc-auth-login-validation", content: "Login validates required fields.", checked: false },
              { id: "dc-auth-login-reject-invalid", content: "Login rejects invalid credentials.", checked: false },
              { id: "dc-auth-login-reject-disabled", content: "Login rejects disabled, inactive, locked, and deleted users.", checked: false },
              { id: "dc-auth-password-hash", content: "Password verification uses secure hashing.", checked: false },
              { id: "dc-jwt-claims", content: "JWT access token is generated with required claims.", checked: false },
              { id: "dc-jwt-expiry", content: "Access token expires after 1 hour.", checked: false },
              { id: "dc-refresh-secure", content: "Refresh token is generated securely.", checked: false },
              { id: "dc-refresh-hashed", content: "Refresh token is stored hashed in database.", checked: false },
              { id: "dc-refresh-rotation", content: "Refresh token rotation issues a new access token and a replacement refresh token.", checked: false },
              { id: "dc-refresh-reuse", content: "Refresh token reuse detection works.", checked: false },
              { id: "dc-logout-revoke", content: "Logout revokes the refresh token family and terminates the session.", checked: false },
              { id: "dc-logout-blacklist", content: "Logout revokes access token using chosen revocation strategy (technical decision).", checked: false },
              { id: "dc-me-profile", content: "GET /api/core/auth/me returns the current authenticated user.", checked: false },
              { id: "dc-me-no-expose", content: "GET /api/core/auth/me does not expose password hash or sensitive fields.", checked: false },
              { id: "dc-me-disabled", content: "Disabled users cannot use /auth/me even with an old token.", checked: false },
              { id: "dc-global-format", content: "All endpoints return the global response format.", checked: false },
              { id: "dc-global-error", content: "Global error handling prevents stack traces from leaking.", checked: false },
              { id: "dc-request-logging", content: "Request logging excludes passwords and tokens.", checked: false },
              { id: "dc-security-audit", content: "Security audit logs are created for auth events.", checked: false },
              { id: "dc-spring-boot-jwt", content: "Spring Boot Support API can validate JWT issued by .NET Core API.", checked: false },
              { id: "dc-tests-pass", content: "Automated tests for all listed cases pass.", checked: false },
              { id: "dc-no-break", content: "Existing tests are not broken.", checked: false }
            ]
          },
          {
            id: "leaf-auth-register",
            title: "Driver Registration",
            type: "leaf_feature",
            clients: ["Guest"],
            status: "ready",
            priority: "high",
            tags: ["auth", "register", "driver", "signup"],
            summary: "Public self-service registration for Driver accounts.",
            objective: "Enable public guest users to register a Driver account. A guest provides registration information including full name, username, email, phone, password, and confirm password. After successful registration, the system creates a users record and a driver_profiles record in one database transaction.",
            inScope: [
              "Public registration endpoint: POST /api/core/auth/register",
              "Input validation: Required full name, username format validation, username must be lowercase, unique username, valid email format, email normalized to lowercase before saving, unique email, Vietnamese phone format validation, phone normalization before saving, unique phone after normalization, password strength validation, and confirm password validation.",
              "Case-insensitive duplicate handling for username and email.",
              "Duplicate submit handling.",
              "Duplicate conflict handling.",
              "Race condition handling for concurrent registration requests.",
              "Database unique constraints for username, email, and phone.",
              "Password hashing with BCrypt.",
              "Transactional creation of users and driver_profiles records.",
              "Default user role: DRIVER.",
              "Default user status: ACTIVE.",
              "Default driver profile status: ACTIVE.",
              "Common API response format.",
              "Return safe response without password or password hash.",
              "Basic request logging and security-safe error handling.",
              "Optional rate limiting."
            ],
            outOfScope: [
              "Email verification OTP/link.",
              "Phone OTP verification.",
              "Registration of internal roles: ADMIN, MANAGER, STAFF.",
              "Driver vehicle registration during signup.",
              "Driver profile verification/resident verification.",
              "Initial wallet/deposit.",
              "Automatic login after registration.",
              "Refresh token implementation unless already supported elsewhere.",
              "Full RBAC tables."
            ],
            permissions: [
              { role: "Guest", permission: "Can call register endpoint anonymously" },
              { role: "Driver", permission: "Should not need to call register again" },
              { role: "Staff", permission: "No special access" },
              { role: "Manager", permission: "No special access" },
              { role: "Admin", permission: "No special access" }
            ],
            dbExistingTables: ["users", "driver_profiles"],
            dbNewTablesSql: `-- Unique indexes for case-insensitive duplicate checking and race condition protection
CREATE UNIQUE INDEX ux_users_username_lower ON users (LOWER(username));
CREATE UNIQUE INDEX ux_users_email_lower ON users (LOWER(email));
CREATE UNIQUE INDEX ux_users_phone ON users (phone);`,
            dbRelationships: [
              "driver_profiles.user_id references users.id"
            ],
            validationRules: [
              { field: "fullName", rule: "Required, trim, max 150", errorMessage: "VALIDATION_FAILED" },
              { field: "username", rule: "Required, trim, max 100", errorMessage: "VALIDATION_FAILED" },
              { field: "username", rule: "Must be lowercase", errorMessage: "VALIDATION_FAILED" },
              { field: "username", rule: "Must match username format", errorMessage: "VALIDATION_FAILED" },
              { field: "username", rule: "Unique case-insensitively", errorMessage: "USERNAME_ALREADY_EXISTS" },
              { field: "email", rule: "Required, valid email format, max 150", errorMessage: "VALIDATION_FAILED" },
              { field: "email", rule: "Normalize to lowercase after valid format check", errorMessage: "N/A" },
              { field: "email", rule: "Unique case-insensitively", errorMessage: "EMAIL_ALREADY_EXISTS" },
              { field: "phone", rule: "Required, valid Vietnamese phone format, max 30", errorMessage: "VALIDATION_FAILED" },
              { field: "phone", rule: "Normalize before duplicate check and saving", errorMessage: "N/A" },
              { field: "phone", rule: "Unique after normalization", errorMessage: "PHONE_ALREADY_EXISTS" },
              { field: "password", rule: "Required, min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit", errorMessage: "VALIDATION_FAILED" },
              { field: "confirmPassword", rule: "Required if included in DTO, must match password", errorMessage: "PASSWORD_CONFIRMATION_NOT_MATCH" }
            ],
            securityRules: [
              "Endpoint is public but must be protected against abuse.",
              "Hash password with BCrypt before saving.",
              "Do not use MD5/SHA/plain text for password.",
              "Do not log password or password hash.",
              "Do not return password hash.",
              "Use database transaction.",
              "Use global exception handling and prevent stack trace leakage.",
              "Sanitize/validate text input before persisting or rendering.",
              "Do not allow client to send role or status.",
              "If client sends role or status, backend must ignore or reject it.",
              "Created user role must always be DRIVER.",
              "Created user status must always be ACTIVE.",
              "Created driver profile status must always be ACTIVE.",
              "Optional rate limiting: Max 5 registration attempts per minute per IP, returning 429 Too Many Requests with RATE_LIMIT_EXCEEDED."
            ],
            logEvents: [
              "DRIVER_REGISTER_ATTEMPT",
              "DRIVER_REGISTERED",
              "DRIVER_REGISTER_FAILED",
              "DRIVER_REGISTER_DUPLICATE_CONFLICT",
              "DRIVER_REGISTER_RACE_CONFLICT"
            ],
            noLogEvents: [
              "Password",
              "Confirm password",
              "Password hash",
              "Access token",
              "Refresh token"
            ],
            integrationPoints: [
              { system: "ParkingDbContext", responsibility: "Performs atomic insert operations for users and driver_profiles in a transaction." },
              { system: "IPasswordHasher / BCrypt helper", responsibility: "Hashes raw password with BCrypt before saving." },
              { system: "GlobalExceptionMiddleware / BusinessException", responsibility: "Maps validation, duplicate conflict, and database unique constraint errors to safe HTTP responses." },
              { system: "AuthController", responsibility: "Exposes public AllowAnonymous POST /api/core/auth/register endpoint." },
              { system: "Database unique constraints", responsibility: "Final protection against duplicate records and race condition." }
            ],
            uiPage: "/register",
            uiComponents: "Registration Form, Full Name input, Username input, Email input, Phone input, Password input, Confirm Password input, Submit Button, Loading indicator, Field-level error messages, General rate limit error banner, Success redirection banner.",
            uiStateLoading: "Disable all inputs, disable submit button, show loading spinner on submit button, and prevent duplicate submit from UI side.",
            uiStateEmpty: "N/A",
            uiStateError: "Display specific validation errors under respective inputs: 'Username must be lowercase', 'Username format is invalid', 'Email already exists', 'Phone already exists', 'Password confirmation does not match'. Display general banner for RATE_LIMIT_EXCEEDED or unexpected registration error.",
            uiStateSuccess: "Show 'Registration successful! Redirecting to login...' and redirect to /login after 2 seconds without auto-login.",
            notes: "Driver registration does not perform email verification or phone verification for now. Username must be lowercase. Email normalized to lowercase before saving. Phone normalized using Vietnamese phone normalization before checking. Concurrent duplicate registration requests are protected by database unique constraints (ux_users_username_lower, ux_users_email_lower, ux_users_phone).",
            endpoints: [
              "POST /api/core/auth/register"
            ],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "api-contract-post-register",
                name: "POST /api/core/auth/register",
                content: "Description:\nPublic self-service registration for Driver accounts.\n\nAuth:\nAllowAnonymous\n\nContent-Type:\napplication/json\n\nRequest Body:\n{\n  \"fullName\": \"Nguyen Van A\",\n  \"username\": \"driver_a\",\n  \"email\": \"driver_a@example.com\",\n  \"phone\": \"0987654321\",\n  \"password\": \"Password123\",\n  \"confirmPassword\": \"Password123\"\n}\n\nResponse 201 Created:\n{\n  \"success\": true,\n  \"message\": \"Driver registered successfully\",\n  \"data\": {\n    \"id\": 15,\n    \"driverProfileId\": 9,\n    \"fullName\": \"Nguyen Van A\",\n    \"username\": \"driver_a\",\n    \"email\": \"driver_a@example.com\",\n    \"phone\": \"0987654321\",\n    \"role\": \"DRIVER\",\n    \"status\": \"ACTIVE\",\n    \"createdAt\": \"2026-07-05T17:20:00+07:00\"\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
              }
            ],
            uiContracts: [
              {
                id: "ui-contract-register-flow",
                name: "Driver Registration UI Flow",
                content: "Form inputs:\n  - Full Name (fullName)\n  - Username (username - lowercase only)\n  - Email (email)\n  - Phone (phone - Vietnamese phone format)\n  - Password (password)\n  - Confirm Password (confirmPassword)\n\nValidation triggers:\n  - On blur for individual fields.\n  - On form submission (calls POST /api/core/auth/register).\n\nState handling:\n  - Loading: Form fields and submit button disabled, loading spinner shown.\n  - Success (201): Success banner shown, redirects to /login after 2s.\n  - Error: Respective fields highlighted in red, error message displayed below them."
              }
            ],
            dataContracts: [
              {
                id: "data-contract-register-request",
                name: "RegisterDriverRequest (C# DTO)",
                content: "public class RegisterDriverRequest\n{\n    public string FullName { get; set; } = string.Empty;\n    public string Username { get; set; } = string.Empty;\n    public string Email { get; set; } = string.Empty;\n    public string Phone { get; set; } = string.Empty;\n    public string Password { get; set; } = string.Empty;\n    public string ConfirmPassword { get; set; } = string.Empty;\n}"
              },
              {
                id: "data-contract-register-response",
                name: "RegisterDriverResponse (C# DTO)",
                content: "public class RegisterDriverResponse\n{\n    public long Id { get; set; }\n    public long DriverProfileId { get; set; }\n    public string FullName { get; set; } = string.Empty;\n    public string Username { get; set; } = string.Empty;\n    public string Email { get; set; } = string.Empty;\n    public string Phone { get; set; } = string.Empty;\n    public string Role { get; set; } = \"DRIVER\";\n    public string Status { get; set; } = \"ACTIVE\";\n    public DateTimeOffset CreatedAt { get; set; }\n}"
              }
            ],
            testCases: [
              {
                id: "tc-reg-01",
                title: "Guest can register successfully with valid data",
                type: "api",
                steps: [
                  "Submit POST /api/core/auth/register with valid Nguyen Van A data.",
                  "Check response code.",
                  "Check database records."
                ],
                expectedResult: "Status 201. Response has success = true. User is created in users table with role DRIVER, status ACTIVE. Password is stored as BCrypt hash. Driver profile is created in driver_profiles table. Response does not contain password or password hash.",
                status: "not_started"
              },
              {
                id: "tc-reg-02",
                title: "Register normalizes email to lowercase",
                type: "api",
                steps: [
                  "Submit request with email Driver_A@Example.com."
                ],
                expectedResult: "Status 201. Saved email is driver_a@example.com. Response email is driver_a@example.com.",
                status: "not_started"
              },
              {
                id: "tc-reg-03",
                title: "Register fails when email format is invalid",
                type: "api",
                steps: [
                  "Submit request with invalid email format."
                ],
                expectedResult: "Status 400. Error code VALIDATION_FAILED.",
                status: "not_started"
              },
              {
                id: "tc-reg-04",
                title: "Register treats email duplicate case-insensitively",
                type: "api",
                steps: [
                  "Register with email Driver_A@Example.com.",
                  "Register again with email driver_a@example.com."
                ],
                expectedResult: "Second request fails with HTTP 409. Error code EMAIL_ALREADY_EXISTS. Only one user exists for that email.",
                status: "not_started"
              },
              {
                id: "tc-reg-05",
                title: "Register fails when username is uppercase",
                type: "api",
                steps: [
                  "Submit request with username Driver_A."
                ],
                expectedResult: "Status 400. Error code VALIDATION_FAILED. Field: username. Message indicates username must be lowercase.",
                status: "not_started"
              },
              {
                id: "tc-reg-06",
                title: "Register fails when username format is invalid",
                type: "api",
                steps: [
                  "Submit request with username that does not match username format."
                ],
                expectedResult: "Status 400. Error code VALIDATION_FAILED. Field: username.",
                status: "not_started"
              },
              {
                id: "tc-reg-07",
                title: "Register treats username duplicate case-insensitively",
                type: "api",
                steps: [
                  "Register with username driver_a.",
                  "Try to register with username DRIVER_A."
                ],
                expectedResult: "Second request fails with HTTP 400 if uppercase format is rejected. If duplicate check is reached, it must fail with HTTP 409 USERNAME_ALREADY_EXISTS. No duplicate username can exist in database.",
                status: "not_started"
              },
              {
                id: "tc-reg-08",
                title: "Register normalizes Vietnamese phone",
                type: "api",
                steps: [
                  "Submit request with phone +84987654321."
                ],
                expectedResult: "Status 201. Saved phone is normalized to 0987654321. Response phone is normalized.",
                status: "not_started"
              },
              {
                id: "tc-reg-09",
                title: "Register fails when phone is invalid",
                type: "api",
                steps: [
                  "Submit request with invalid phone format."
                ],
                expectedResult: "Status 400. Error code VALIDATION_FAILED. Field: phone.",
                status: "not_started"
              },
              {
                id: "tc-reg-10",
                title: "Register treats normalized phone as duplicate",
                type: "api",
                steps: [
                  "Register with phone 0987654321.",
                  "Register again with phone +84987654321."
                ],
                expectedResult: "Second request fails with HTTP 409. Error code PHONE_ALREADY_EXISTS. Only one user exists for that normalized phone.",
                status: "not_started"
              },
              {
                id: "tc-reg-11",
                title: "Register fails when fullName is empty",
                type: "api",
                steps: [
                  "Submit request with empty fullName."
                ],
                expectedResult: "Status 400. Error code VALIDATION_FAILED.",
                status: "not_started"
              },
              {
                id: "tc-reg-12",
                title: "Register fails when username is empty",
                type: "api",
                steps: [
                  "Submit request with empty username."
                ],
                expectedResult: "Status 400. Error code VALIDATION_FAILED.",
                status: "not_started"
              },
              {
                id: "tc-reg-13",
                title: "Register fails when password is weak",
                type: "api",
                steps: [
                  "Submit password with less than 8 characters, or without uppercase/lowercase/digit."
                ],
                expectedResult: "Status 400. Error code VALIDATION_FAILED.",
                status: "not_started"
              },
              {
                id: "tc-reg-14",
                title: "Register fails when confirmPassword does not match",
                type: "api",
                steps: [
                  "Submit request where confirmPassword != password."
                ],
                expectedResult: "Status 400. Error code PASSWORD_CONFIRMATION_NOT_MATCH.",
                status: "not_started"
              },
              {
                id: "tc-reg-15",
                title: "Register fails when username already exists",
                type: "api",
                expectedResult: "Status 409. Error code USERNAME_ALREADY_EXISTS.",
                status: "not_started"
              },
              {
                id: "tc-reg-16",
                title: "Register fails when email already exists",
                type: "api",
                expectedResult: "Status 409. Error code EMAIL_ALREADY_EXISTS.",
                status: "not_started"
              },
              {
                id: "tc-reg-17",
                title: "Register fails when phone already exists",
                type: "api",
                expectedResult: "Status 409. Error code PHONE_ALREADY_EXISTS.",
                status: "not_started"
              },
              {
                id: "tc-reg-18",
                title: "Client cannot assign role",
                type: "api",
                steps: [
                  "Submit request with extra field role: ADMIN."
                ],
                expectedResult: "Backend ignores or rejects role field. Created user role must still be DRIVER.",
                status: "not_started"
              },
              {
                id: "tc-reg-19",
                title: "Client cannot assign status",
                type: "api",
                steps: [
                  "Submit request with extra field status: LOCKED."
                ],
                expectedResult: "Backend ignores or rejects status field. Created user status must still be ACTIVE.",
                status: "not_started"
              },
              {
                id: "tc-reg-20",
                title: "Duplicate submit creates only one account",
                type: "integration",
                steps: [
                  "Submit the same valid registration request twice quickly."
                ],
                expectedResult: "Only one user is created. Only one driver_profile is created. One request succeeds with HTTP 201. The duplicate request fails with HTTP 409 and correct duplicate error code.",
                status: "not_started"
              },
              {
                id: "tc-reg-21",
                title: "Register handles concurrent duplicate email race condition",
                type: "integration",
                steps: [
                  "Send two concurrent register requests with the same email.",
                  "Let both requests reach duplicate checking at nearly the same time."
                ],
                expectedResult: "Only one user is created. Only one driver_profile is created. One request succeeds. The other request fails with HTTP 409 EMAIL_ALREADY_EXISTS. No raw database error is returned.",
                status: "not_started"
              },
              {
                id: "tc-reg-22",
                title: "Register handles concurrent duplicate username race condition",
                type: "integration",
                steps: [
                  "Send two concurrent register requests with the same username."
                ],
                expectedResult: "Only one user is created. The second request fails with HTTP 409 USERNAME_ALREADY_EXISTS. No duplicate username exists.",
                status: "not_started"
              },
              {
                id: "tc-reg-23",
                title: "Register handles concurrent duplicate phone race condition",
                type: "integration",
                steps: [
                  "Send two concurrent register requests with equivalent phone numbers (e.g. 0987654321 and +84987654321)."
                ],
                expectedResult: "Only one user is created. The second request fails with HTTP 409 PHONE_ALREADY_EXISTS. No duplicate normalized phone exists.",
                status: "not_started"
              },
              {
                id: "tc-reg-24",
                title: "Register is transactional",
                type: "integration",
                steps: [
                  "Force driver_profiles insert to fail.",
                  "Submit valid register request."
                ],
                expectedResult: "Response is an error. users insert is rolled back. No orphaned user exists.",
                status: "not_started"
              },
              {
                id: "tc-reg-25",
                title: "Password hash is not plain text",
                type: "integration",
                steps: [
                  "Register successfully.",
                  "Read users.password_hash."
                ],
                expectedResult: "password_hash is not equal to raw password. BCrypt verify succeeds with raw password.",
                status: "not_started"
              },
              {
                id: "tc-reg-26",
                title: "Register response uses common response format",
                type: "api",
                expectedResult: "Response contains: success, message, data, errors, timestamp.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-reg-01", content: "POST /api/core/auth/register exists in AuthController.", checked: false },
              { id: "dc-reg-02", content: "Endpoint is public and allows anonymous access.", checked: false },
              { id: "dc-reg-03", content: "Endpoint does not require JWT.", checked: false },
              { id: "dc-reg-04", content: "Request validates fullName, username, email, phone, password, and confirmPassword.", checked: false },
              { id: "dc-reg-05", content: "fullName is trimmed before saving.", checked: false },
              { id: "dc-reg-06", content: "username is trimmed before validation.", checked: false },
              { id: "dc-reg-07", content: "username must be lowercase.", checked: false },
              { id: "dc-reg-08", content: "username invalid format returns HTTP 400 VALIDATION_FAILED.", checked: false },
              { id: "dc-reg-09", content: "username duplicate check is case-insensitive.", checked: false },
              { id: "dc-reg-10", content: "Duplicate username returns HTTP 409 USERNAME_ALREADY_EXISTS.", checked: false },
              { id: "dc-reg-11", content: "email validates correct email format before normalization.", checked: false },
              { id: "dc-reg-12", content: "email is normalized to lowercase before duplicate check and saving.", checked: false },
              { id: "dc-reg-13", content: "email duplicate check is case-insensitive.", checked: false },
              { id: "dc-reg-14", content: "Duplicate email returns HTTP 409 EMAIL_ALREADY_EXISTS.", checked: false },
              { id: "dc-reg-15", content: "phone validates Vietnamese phone format.", checked: false },
              { id: "dc-reg-16", content: "phone is normalized before duplicate check and saving.", checked: false },
              { id: "dc-reg-17", content: "Duplicate normalized phone returns HTTP 409 PHONE_ALREADY_EXISTS.", checked: false },
              { id: "dc-reg-18", content: "Database has unique protection index lower(username).", checked: false },
              { id: "dc-reg-19", content: "Database has unique protection index lower(email).", checked: false },
              { id: "dc-reg-20", content: "Database has unique protection index for phone.", checked: false },
              { id: "dc-reg-21", content: "Database uniqueness protects against race condition.", checked: false },
              { id: "dc-reg-22", content: "Backend catches database unique constraint violation.", checked: false },
              { id: "dc-reg-23", content: "Backend maps database duplicate conflict to safe HTTP 409 response.", checked: false },
              { id: "dc-reg-24", content: "Backend does not expose raw SQL/database errors.", checked: false },
              { id: "dc-reg-25", content: "Duplicate submit creates only one account.", checked: false },
              { id: "dc-reg-26", content: "Concurrent duplicate registration requests create only one account.", checked: false },
              { id: "dc-reg-27", content: "Password is hashed with BCrypt.", checked: false },
              { id: "dc-reg-28", content: "No password or password hash is returned.", checked: false },
              { id: "dc-reg-29", content: "Created user has role DRIVER.", checked: false },
              { id: "dc-reg-30", content: "Created user has status ACTIVE.", checked: false },
              { id: "dc-reg-31", content: "Created driver profile has status ACTIVE.", checked: false },
              { id: "dc-reg-32", content: "Email verification is not implemented for now.", checked: false },
              { id: "dc-reg-33", content: "Phone verification is not implemented for now.", checked: false },
              { id: "dc-reg-34", content: "users and driver_profiles are created in one transaction.", checked: false },
              { id: "dc-reg-35", content: "Transaction rolls back if either insert fails.", checked: false },
              { id: "dc-reg-36", content: "Client cannot create ADMIN, MANAGER, or STAFF through this endpoint.", checked: false },
              { id: "dc-reg-37", content: "Client cannot assign custom status through this endpoint.", checked: false },
              { id: "dc-reg-38", content: "Response uses common API response format.", checked: false },
              { id: "dc-reg-39", content: "Success response returns HTTP 201.", checked: false },
              { id: "dc-reg-40", content: "Validation errors return HTTP 400.", checked: false },
              { id: "dc-reg-41", content: "Duplicate conflicts return HTTP 409.", checked: false },
              { id: "dc-reg-42", content: "Rate limit returns HTTP 429 if rate limiting is implemented.", checked: false },
              { id: "dc-reg-43", content: "Audit/application log records DRIVER_REGISTERED.", checked: false },
              { id: "dc-reg-44", content: "Automated test cases pass.", checked: false }
            ]
          }
        ]
      },
      {
        id: "cat-user-driver",
        title: "User & Driver Management",
        type: "category",
        summary: "Operations for administering users and driver vehicle records.",
        children: [
          {
            id: "cat-user-management",
            title: "User Management",
            type: "category",
            summary: "Operations for administering internal accounts, status, and role configurations.",
            children: [
              {
                id: "leaf-user-list-detail",
                title: "User Listing & Detail",
                type: "leaf_feature",
                clients: ["Admin"],
                status: "ready",
                priority: "medium",
                tags: ["users", "listing", "detail", "admin"],
                summary: "Allows Admin to search, list, filter, and view detail of all users.",
                objective: "Implement user search, listing, and detail views for Admin. User list and detail endpoints can retrieve ADMIN, MANAGER, STAFF, and DRIVER. Password hashes must be hidden.",
                inScope: [
                  "Admin user listing with keyword search, role filter, status filter, and pagination.",
                  "User listing includes ADMIN, MANAGER, STAFF, and DRIVER.",
                  "Admin user detail for all user roles, including DRIVER.",
                  "Common API response format.",
                  "All APIs require JWT authentication and Admin role."
                ],
                outOfScope: [
                  "Driver public registration.",
                  "Driver profile management.",
                  "Driver vehicle management.",
                  "User password reset.",
                  "Change password.",
                  "Hard delete user.",
                  "Full RBAC/permission table management.",
                  "Email invitation/activation email.",
                  "Email verification.",
                  "Phone verification."
                ],
                permissions: [
                  { role: "ADMIN", permission: "Full access to list and detail APIs" },
                  { role: "MANAGER", permission: "No access" },
                  { role: "STAFF", permission: "No access" },
                  { role: "DRIVER", permission: "No access" },
                  { role: "Anonymous", permission: "No access" }
                ],
                dbExistingTables: ["users"],
                dbRelationships: [
                  "Reads records from users table.",
                  "No hard delete is allowed."
                ],
                securityRules: [
                  "Validate JWT.",
                  "Require Admin role for listing and detail endpoints.",
                  "Do not return password hash in any response.",
                  "Use global exception handling and prevent stack trace leakage."
                ],
                uiPage: "/admin/users",
                uiComponents: "User Table, Search Input, Role Filter Dropdown, Status Filter Dropdown, Pagination Controls.",
                uiStateLoading: "Show skeleton table rows or animated loading indicator while fetching users.",
                uiStateEmpty: "No users found matching filters.",
                uiStateError: "Display general toast/banner for FORBIDDEN, USER_NOT_FOUND, or unexpected errors.",
                uiStateSuccess: "Render users list in a responsive table. Highlight active filters.",
                notes: "Admin can list and view all users, including DRIVER users. Driver profile fields are not managed by this feature.",
                endpoints: [
                  "GET /api/core/users",
                  "GET /api/core/users/{id}"
                ],
                ownerService: ".NET Core API",
                apiContracts: [
                  {
                    id: "api-contract-get-users",
                    name: "GET /api/core/users",
                    content: "Description:\nAdmin searches and lists all users, including ADMIN, MANAGER, STAFF, and DRIVER.\n\nAuth:\nJWT required\n\nRole:\nADMIN only\n\nQuery Parameters:\n  - keyword: string (optional)\n  - role: string (optional)\n  - status: string (optional)\n  - page: int (default 1)\n  - pageSize: int (default 20, max 100)\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"Get users successfully\",\n  \"data\": {\n    \"items\": [\n      {\n        \"id\": 2,\n        \"fullName\": \"Staff User\",\n        \"username\": \"staff01\",\n        \"email\": \"staff01@example.com\",\n        \"phone\": \"0900000002\",\n        \"role\": \"STAFF\",\n        \"status\": \"ACTIVE\",\n        \"createdAt\": \"2026-07-05T17:20:00+07:00\"\n      },\n      {\n        \"id\": 15,\n        \"fullName\": \"Driver User\",\n        \"username\": \"driver01\",\n        \"email\": \"driver01@example.com\",\n        \"phone\": \"0987654321\",\n        \"role\": \"DRIVER\",\n        \"status\": \"ACTIVE\",\n        \"createdAt\": \"2026-07-05T17:20:00+07:00\"\n      }\n    ],\n    \"page\": 1,\n    \"pageSize\": 20,\n    \"totalItems\": 2,\n    \"totalPages\": 1\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
                  },
                  {
                    id: "api-contract-get-user-detail",
                    name: "GET /api/core/users/{id}",
                    content: "Description:\nAdmin gets user detail by ID. User detail can return ADMIN, MANAGER, STAFF, or DRIVER.\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"Get user successfully\",\n  \"data\": {\n    \"id\": 2,\n    \"fullName\": \"Staff User\",\n    \"username\": \"staff01\",\n    \"email\": \"staff01@example.com\",\n    \"phone\": \"0900000002\",\n    \"role\": \"STAFF\",\n    \"status\": \"ACTIVE\",\n    \"createdAt\": \"2026-07-05T17:20:00+07:00\",\n    \"updatedAt\": \"2026-07-05T17:20:00+07:00\"\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
                  }
                ],
                testCases: [
                  {
                    id: "tc-user-ld-01",
                    title: "Admin can list all users including drivers",
                    type: "api",
                    precondition: "User authenticated as ADMIN. Database has ADMIN, MANAGER, STAFF, and DRIVER users.",
                    steps: [
                      "Call GET /api/core/users?page=1&pageSize=20."
                    ],
                    expectedResult: "Status 200. Response has success = true. Items can include ADMIN, MANAGER, STAFF, and DRIVER users.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-02",
                    title: "Admin can search users by keyword",
                    type: "api",
                    steps: [
                      "Call GET /api/core/users?keyword=staff."
                    ],
                    expectedResult: "Only matching users are returned. Search matches username/fullName/email/phone.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-03",
                    title: "Admin can filter by role DRIVER",
                    type: "api",
                    steps: [
                      "Call GET /api/core/users?role=DRIVER."
                    ],
                    expectedResult: "Status 200. Returned users have role DRIVER.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-04",
                    title: "Admin can filter by role/status",
                    type: "api",
                    steps: [
                      "Call GET /api/core/users?role=STAFF&status=ACTIVE."
                    ],
                    expectedResult: "Returned users have role STAFF and status ACTIVE.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-05",
                    title: "Invalid page/pageSize returns validation error",
                    type: "api",
                    steps: [
                      "Call GET /api/core/users?page=0&pageSize=1000."
                    ],
                    expectedResult: "Status 400 or page/pageSize are safely clamped based on existing project convention. No server error occurs.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-06",
                    title: "Admin can get user detail",
                    type: "api",
                    steps: [
                      "Call GET /api/core/users/{id}."
                    ],
                    expectedResult: "Status 200. User detail returned. Response does not contain passwordHash.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-07",
                    title: "Admin can get Driver user detail",
                    type: "api",
                    steps: [
                      "Call GET /api/core/users/{driverUserId}."
                    ],
                    expectedResult: "Status 200. Driver user detail returned. Response does not contain passwordHash. Driver profile management data is not required in this response.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-08",
                    title: "User not found returns 404",
                    type: "api",
                    steps: [
                      "Call GET /api/core/users/999999."
                    ],
                    expectedResult: "Status 404. Error code USER_NOT_FOUND.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-09",
                    title: "Staff cannot access User Management",
                    type: "api",
                    precondition: "User authenticated as STAFF.",
                    steps: [
                      "Call GET /api/core/users."
                    ],
                    expectedResult: "Status 403.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-10",
                    title: "Anonymous cannot access User Management",
                    type: "api",
                    steps: [
                      "Call GET /api/core/users without token."
                    ],
                    expectedResult: "Status 401.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-ld-11",
                    title: "User Management responses use common response format",
                    type: "api",
                    expectedResult: "All endpoints return response containing success, message, data, errors, and timestamp.",
                    status: "not_started"
                  }
                ],
                doneCriteria: [
                  { id: "dc-user-ld-01", content: "Endpoints GET /api/core/users and GET /api/core/users/{id} are exposed.", checked: false },
                  { id: "dc-user-ld-02", content: "No hard delete endpoint exists.", checked: false },
                  { id: "dc-user-ld-03", content: "All endpoints require JWT authentication.", checked: false },
                  { id: "dc-user-ld-04", content: "All endpoints require Admin role.", checked: false },
                  { id: "dc-user-ld-05", content: "GET /api/core/users supports keyword, role, status, page, pageSize.", checked: false },
                  { id: "dc-user-ld-06", content: "GET /api/core/users can list ADMIN, MANAGER, STAFF, and DRIVER users.", checked: false },
                  { id: "dc-user-ld-07", content: "GET /api/core/users supports role filter DRIVER.", checked: false },
                  { id: "dc-user-ld-08", content: "GET /api/core/users/{id} can return ADMIN, MANAGER, STAFF, and DRIVER user detail.", checked: false },
                  { id: "dc-user-ld-09", content: "List endpoint returns paged response.", checked: false },
                  { id: "dc-user-ld-10", content: "No response exposes password hash.", checked: false },
                  { id: "dc-user-ld-11", content: "Response uses common API response format.", checked: false }
                ]
              },
              {
                id: "leaf-user-create",
                title: "Internal User Creation",
                type: "leaf_feature",
                clients: ["Admin"],
                status: "ready",
                priority: "medium",
                tags: ["users", "create", "admin"],
                summary: "Allows Admin to create internal users (ADMIN, MANAGER, STAFF).",
                objective: "Implement internal user creation for Admin. DRIVER role creation is rejected. Encrypt password with BCrypt. Enforce duplicate rules, database index integrity, and audit logging.",
                inScope: [
                  "Admin creates internal users only: ADMIN, MANAGER, STAFF.",
                  "Password hashing with BCrypt.",
                  "Username lowercase validation and trimmed.",
                  "Email lowercase normalization and trimmed.",
                  "Vietnamese phone validation and normalization.",
                  "Case-insensitive duplicate handling for username and email.",
                  "Duplicate submit handling and concurrent race condition check.",
                  "Database unique constraints for username, email, and phone.",
                  "Mutating operations write audit log USER_CREATED."
                ],
                outOfScope: [
                  "Driver public registration.",
                  "Driver profile management.",
                  "User profile update.",
                  "Status changes.",
                  "Role changes after creation.",
                  "Password reset.",
                  "Hard delete."
                ],
                permissions: [
                  { role: "ADMIN", permission: "Can call POST /api/core/users" }
                ],
                dbExistingTables: ["users"],
                dbNewTablesSql: `-- Unique indexes for case-insensitive duplicate checking and race condition protection\nCREATE UNIQUE INDEX ux_users_username_lower ON users (LOWER(username));\nCREATE UNIQUE INDEX ux_users_email_lower ON users (LOWER(email)) WHERE email IS NOT NULL;\nCREATE UNIQUE INDEX ux_users_phone ON users (phone) WHERE phone IS NOT NULL;`,
                dbRelationships: [
                  "Creates records in users table."
                ],
                validationRules: [
                  { field: "fullName", rule: "Required, trim, max 150", errorMessage: "VALIDATION_FAILED" },
                  { field: "username", rule: "Required, trim, max 100", errorMessage: "VALIDATION_FAILED" },
                  { field: "username", rule: "Must be lowercase", errorMessage: "VALIDATION_FAILED" },
                  { field: "username", rule: "Must match username format", errorMessage: "VALIDATION_FAILED" },
                  { field: "username", rule: "Unique case-insensitively", errorMessage: "USERNAME_ALREADY_EXISTS" },
                  { field: "email", rule: "Optional, valid email format, max 150", errorMessage: "VALIDATION_FAILED" },
                  { field: "email", rule: "Normalize to lowercase after valid format check", errorMessage: "N/A" },
                  { field: "email", rule: "Unique case-insensitively if present", errorMessage: "EMAIL_ALREADY_EXISTS" },
                  { field: "phone", rule: "Optional, valid Vietnamese phone format, max 30", errorMessage: "VALIDATION_FAILED" },
                  { field: "phone", rule: "Normalize before duplicate check and saving", errorMessage: "N/A" },
                  { field: "phone", rule: "Unique after normalization if present", errorMessage: "PHONE_ALREADY_EXISTS" },
                  { field: "password", rule: "Required on create, min 8, at least 1 uppercase, 1 lowercase, 1 digit", errorMessage: "VALIDATION_FAILED" },
                  { field: "role", rule: "Required on create, only ADMIN, MANAGER, STAFF", errorMessage: "INVALID_USER_ROLE" }
                ],
                securityRules: [
                  "Validate JWT.",
                  "Require Admin role.",
                  "Hash password with BCrypt before saving.",
                  "Do not log password or password hash.",
                  "Do not return password hash.",
                  "Prevent creating DRIVER through POST /api/core/users.",
                  "Do not expose raw SQL/database errors."
                ],
                logEvents: [
                  "USER_CREATED",
                  "USER_CREATE_DUPLICATE_CONFLICT",
                  "USER_CREATE_RACE_CONFLICT"
                ],
                noLogEvents: [
                  "Password",
                  "Password hash"
                ],
                integrationPoints: [
                  { system: "Auth / JWT Middleware", responsibility: "Validates authenticated Admin request" },
                  { system: "Password Hasher / BCrypt helper", responsibility: "Hashes password when creating user" },
                  { system: "Audit Log Service", responsibility: "Writes audit logs on mutating operations" },
                  { system: "Database unique constraints", responsibility: "Final protection against duplicate records and race condition" }
                ],
                uiComponents: "Create User Modal, Form fields: fullName, username, email, phone, password, role dropdown.",
                uiStateLoading: "Disable submit button, show loading spinner, prevent duplicate submits.",
                uiStateError: "Display field-level validation errors.",
                uiStateSuccess: "Show success toast, refresh user list, close modal.",
                endpoints: [
                  "POST /api/core/users"
                ],
                ownerService: ".NET Core API",
                apiContracts: [
                  {
                    id: "api-contract-post-create-user",
                    name: "POST /api/core/users",
                    content: "Description:\nAdmin creates an internal user (ADMIN, MANAGER, or STAFF). DRIVER role is rejected.\n\nRequest Body:\n{\n  \"fullName\": \"New Staff\",\n  \"username\": \"staff02\",\n  \"email\": \"Staff02@Example.com\",\n  \"phone\": \"+84900000003\",\n  \"password\": \"Password123\",\n  \"role\": \"STAFF\"\n}\n\nResponse 201 Created:\n{\n  \"success\": true,\n  \"message\": \"User created successfully\",\n  \"data\": {\n    \"id\": 20,\n    \"fullName\": \"New Staff\",\n    \"username\": \"staff02\",\n    \"email\": \"staff02@example.com\",\n    \"phone\": \"0900000003\",\n    \"role\": \"STAFF\",\n    \"status\": \"ACTIVE\",\n    \"createdAt\": \"2026-07-05T17:20:00+07:00\"\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:20:00+07:00\"\n}"
                  }
                ],
                dataContracts: [
                  {
                    id: "data-contract-create-user-request",
                    name: "CreateUserRequest (C# DTO)",
                    content: "public class CreateUserRequest\n{\n    public string FullName { get; set; } = string.Empty;\n    public string Username { get; set; } = string.Empty;\n    public string Email { get; set; } = string.Empty;\n    public string Phone { get; set; } = string.Empty;\n    public string Password { get; set; } = string.Empty;\n    public string Role { get; set; } = string.Empty;\n}"
                  }
                ],
                testCases: [
                  {
                    id: "tc-user-c-01",
                    title: "Admin can create STAFF user",
                    type: "api",
                    steps: [
                      "Call POST /api/core/users with valid STAFF payload."
                    ],
                    expectedResult: "Status 201. User created with status ACTIVE. Password is stored as BCrypt hash. Response does not contain passwordHash. Audit log USER_CREATED exists.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-02",
                    title: "Create user normalizes email to lowercase",
                    type: "api",
                    steps: [
                      "Submit POST /api/core/users with email Staff02@Example.com."
                    ],
                    expectedResult: "Status 201. Saved email is staff02@example.com. Response email is staff02@example.com.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-03",
                    title: "Create user normalizes Vietnamese phone",
                    type: "api",
                    steps: [
                      "Submit POST /api/core/users with phone +84900000003."
                    ],
                    expectedResult: "Status 201. Saved phone is normalized to 0900000003. Response phone is normalized.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-04",
                    title: "Create user with uppercase username is rejected",
                    type: "api",
                    steps: [
                      "Submit POST /api/core/users with username Staff02."
                    ],
                    expectedResult: "Status 400. Error code VALIDATION_FAILED. Field username indicates username must be lowercase.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-05",
                    title: "Create user with invalid username format is rejected",
                    type: "api",
                    steps: [
                      "Submit POST /api/core/users with invalid username format."
                    ],
                    expectedResult: "Status 400. Error code VALIDATION_FAILED. Field username.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-06",
                    title: "Create user with invalid email format is rejected",
                    type: "api",
                    steps: [
                      "Submit POST /api/core/users with invalid email format."
                    ],
                    expectedResult: "Status 400. Error code VALIDATION_FAILED. Field email.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-07",
                    title: "Create user with invalid phone format is rejected",
                    type: "api",
                    steps: [
                      "Submit POST /api/core/users with invalid Vietnamese phone format."
                    ],
                    expectedResult: "Status 400. Error code VALIDATION_FAILED. Field phone.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-08",
                    title: "Duplicate username returns 409",
                    type: "api",
                    expectedResult: "Status 409. Error code USERNAME_ALREADY_EXISTS.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-09",
                    title: "Duplicate email returns 409",
                    type: "api",
                    expectedResult: "Status 409. Error code EMAIL_ALREADY_EXISTS.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-10",
                    title: "Duplicate phone returns 409",
                    type: "api",
                    expectedResult: "Status 409. Error code PHONE_ALREADY_EXISTS.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-11",
                    title: "Duplicate email is case-insensitive",
                    type: "api",
                    steps: [
                      "Create user with email Staff02@Example.com.",
                      "Create another user with email staff02@example.com."
                    ],
                    expectedResult: "Second request fails with HTTP 409. Error code EMAIL_ALREADY_EXISTS. Only one user exists for that email.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-12",
                    title: "Duplicate phone is checked after normalization",
                    type: "api",
                    steps: [
                      "Create user with phone 0900000003.",
                      "Create another user with phone +84900000003."
                    ],
                    expectedResult: "Second request fails with HTTP 409. Error code PHONE_ALREADY_EXISTS. Only one user exists for that normalized phone.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-13",
                    title: "Create user with DRIVER role is rejected",
                    type: "api",
                    steps: [
                      "Call POST /api/core/users with role DRIVER."
                    ],
                    expectedResult: "Status 400. Error code INVALID_USER_ROLE. No user is created.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-14",
                    title: "Password policy is enforced when creating user",
                    type: "api",
                    steps: [
                      "Call POST /api/core/users with weak password."
                    ],
                    expectedResult: "Status 400. Error code VALIDATION_FAILED. Password must satisfy min length, uppercase, lowercase, and digit rule.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-15",
                    title: "Duplicate submit creates only one user",
                    type: "integration",
                    steps: [
                      "Submit the same valid POST /api/core/users request twice quickly."
                    ],
                    expectedResult: "Only one user is created. One request succeeds with HTTP 201. The duplicate request fails with HTTP 409 and correct duplicate error code.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-16",
                    title: "Create user handles concurrent duplicate email race condition",
                    type: "integration",
                    steps: [
                      "Send two concurrent POST /api/core/users requests with the same email."
                    ],
                    expectedResult: "Only one user is created. One request succeeds. The other request fails with HTTP 409 EMAIL_ALREADY_EXISTS. No raw database error is returned.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-17",
                    title: "Create user handles concurrent duplicate username race condition",
                    type: "integration",
                    steps: [
                      "Send two concurrent POST /api/core/users requests with the same username."
                    ],
                    expectedResult: "Only one user is created. The second request fails with HTTP 409 USERNAME_ALREADY_EXISTS. No duplicate username exists.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-18",
                    title: "Create user handles concurrent duplicate phone race condition",
                    type: "integration",
                    steps: [
                      "Send two concurrent POST /api/core/users requests with equivalent phone numbers (e.g. 0900000003 and +84900000003)."
                    ],
                    expectedResult: "Only one user is created. The second request fails with HTTP 409 PHONE_ALREADY_EXISTS. No duplicate normalized phone exists.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-c-19",
                    title: "Password hash is not plain text",
                    type: "integration",
                    steps: [
                      "Create user successfully.",
                      "Read users.password_hash."
                    ],
                    expectedResult: "password_hash is not equal to raw password. BCrypt verify succeeds with raw password.",
                    status: "not_started"
                  }
                ],
                doneCriteria: [
                  { id: "dc-user-c-01", content: "Endpoint POST /api/core/users is exposed.", checked: false },
                  { id: "dc-user-c-02", content: "Create endpoint returns HTTP 201.", checked: false },
                  { id: "dc-user-c-03", content: "POST /api/core/users creates internal users only.", checked: false },
                  { id: "dc-user-c-04", content: "POST /api/core/users allows ADMIN, MANAGER, STAFF.", checked: false },
                  { id: "dc-user-c-05", content: "POST /api/core/users rejects DRIVER role.", checked: false },
                  { id: "dc-user-c-06", content: "fullName is trimmed before saving.", checked: false },
                  { id: "dc-user-c-07", content: "username is trimmed before validation.", checked: false },
                  { id: "dc-user-c-08", content: "username must be lowercase.", checked: false },
                  { id: "dc-user-c-09", content: "username invalid format returns HTTP 400 VALIDATION_FAILED.", checked: false },
                  { id: "dc-user-c-10", content: "username duplicate check is case-insensitive.", checked: false },
                  { id: "dc-user-c-11", content: "Duplicate username returns HTTP 409 USERNAME_ALREADY_EXISTS.", checked: false },
                  { id: "dc-user-c-12", content: "email validates correct email format before normalization.", checked: false },
                  { id: "dc-user-c-13", content: "email is normalized to lowercase before duplicate check and saving.", checked: false },
                  { id: "dc-user-c-14", content: "email duplicate check is case-insensitive.", checked: false },
                  { id: "dc-user-c-15", content: "Duplicate email returns HTTP 409 EMAIL_ALREADY_EXISTS.", checked: false },
                  { id: "dc-user-c-16", content: "phone validates Vietnamese phone format.", checked: false },
                  { id: "dc-user-c-17", content: "phone is normalized before duplicate check and saving.", checked: false },
                  { id: "dc-user-c-18", content: "Duplicate normalized phone returns HTTP 409 PHONE_ALREADY_EXISTS.", checked: false },
                  { id: "dc-user-c-19", content: "Database has unique index lower(username).", checked: false },
                  { id: "dc-user-c-20", content: "Database has unique index lower(email) if present.", checked: false },
                  { id: "dc-user-c-21", content: "Database has unique index phone if present.", checked: false },
                  { id: "dc-user-c-22", content: "Database uniqueness protects against race condition.", checked: false },
                  { id: "dc-user-c-23", content: "Backend catches database unique constraint violation.", checked: false },
                  { id: "dc-user-c-24", content: "Backend maps database duplicate conflict to safe HTTP 409 response.", checked: false },
                  { id: "dc-user-c-25", content: "Backend does not expose raw SQL/database errors.", checked: false },
                  { id: "dc-user-c-26", content: "Duplicate submit creates only one user.", checked: false },
                  { id: "dc-user-c-27", content: "Concurrent duplicate create requests create only one user.", checked: false },
                  { id: "dc-user-c-28", content: "Password is hashed with BCrypt.", checked: false },
                  { id: "dc-user-c-29", content: "No response exposes password hash.", checked: false },
                  { id: "dc-user-c-30", content: "Mutating operations write audit log USER_CREATED.", checked: false }
                ]
              },
              {
                id: "leaf-user-update",
                title: "User Profile Update",
                type: "leaf_feature",
                clients: ["Admin"],
                status: "ready",
                priority: "medium",
                tags: ["users", "update", "admin"],
                summary: "Allows Admin to update basic user profile fields (fullName, email, phone).",
                objective: "Implement basic profile field updates for Admin. Username, password, role, status are read-only. Prevent email/phone duplicates with other users.",
                inScope: [
                  "Admin updates basic user profile fields: fullName, email, phone.",
                  "Email and phone normalization and validation.",
                  "Prevent duplicate email or phone with another user (returns HTTP 409).",
                  "Allow updating with same email/phone of the current user.",
                  "Audit log USER_UPDATED is written."
                ],
                outOfScope: [
                  "Creating users.",
                  "Changing status.",
                  "Changing role.",
                  "Changing password.",
                  "Hard delete.",
                  "Driver profile management."
                ],
                permissions: [
                  { role: "ADMIN", permission: "Can call PUT /api/core/users/{id}" }
                ],
                dbExistingTables: ["users"],
                dbRelationships: [
                  "Updates records in users table."
                ],
                validationRules: [
                  { field: "fullName", rule: "Required, trim, max 150", errorMessage: "VALIDATION_FAILED" },
                  { field: "email", rule: "Optional, valid email format, max 150", errorMessage: "VALIDATION_FAILED" },
                  { field: "email", rule: "Normalize to lowercase after valid format check", errorMessage: "N/A" },
                  { field: "phone", rule: "Optional, valid Vietnamese phone format, max 30", errorMessage: "VALIDATION_FAILED" },
                  { field: "phone", rule: "Normalize before duplicate check and saving", errorMessage: "N/A" }
                ],
                securityRules: [
                  "Validate JWT.",
                  "Require Admin role.",
                  "Do not accept password, username, role, or status updates in this endpoint.",
                  "Do not expose raw SQL/database errors."
                ],
                logEvents: [
                  "USER_UPDATED",
                  "USER_UPDATE_DUPLICATE_CONFLICT",
                  "USER_UPDATE_RACE_CONFLICT"
                ],
                integrationPoints: [
                  { system: "Auth / JWT Middleware", responsibility: "Validates authenticated Admin request" },
                  { system: "Audit Log Service", responsibility: "Writes audit logs on mutating operations" }
                ],
                uiComponents: "Edit User Modal, Form fields: fullName, email, phone. Username read-only.",
                uiStateLoading: "Disable submit button, show loading spinner.",
                uiStateError: "Display field-level validation errors.",
                uiStateSuccess: "Show success toast, refresh list, close modal.",
                endpoints: [
                  "PUT /api/core/users/{id}"
                ],
                ownerService: ".NET Core API",
                apiContracts: [
                  {
                    id: "api-contract-put-update-user",
                    name: "PUT /api/core/users/{id}",
                    content: "Description:\nAdmin updates basic user profile fields: fullName, email, phone. Username, password, role, status are not updated.\n\nRequest Body:\n{\n  \"fullName\": \"Updated Staff Name\",\n  \"email\": \"Staff02.Updated@Example.com\",\n  \"phone\": \"+84900000004\"\n}\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"User updated successfully\",\n  \"data\": {\n    \"id\": 20,\n    \"fullName\": \"Updated Staff Name\",\n    \"username\": \"staff02\",\n    \"email\": \"staff02.updated@example.com\",\n    \"phone\": \"0900000004\",\n    \"role\": \"STAFF\",\n    \"status\": \"ACTIVE\",\n    \"updatedAt\": \"2026-07-05T17:30:00+07:00\"\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:30:00+07:00\"\n}"
                  }
                ],
                dataContracts: [
                  {
                    id: "data-contract-update-user-request",
                    name: "UpdateUserRequest (C# DTO)",
                    content: "public class UpdateUserRequest\n{\n    public string FullName { get; set; } = string.Empty;\n    public string Email { get; set; } = string.Empty;\n    public string Phone { get; set; } = string.Empty;\n}"
                  }
                ],
                testCases: [
                  {
                    id: "tc-user-u-01",
                    title: "Admin can update fullName/email/phone",
                    type: "api",
                    expectedResult: "Status 200. Fields updated. Username, role, status, passwordHash unchanged. Audit log USER_UPDATED exists.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-u-02",
                    title: "PUT normalizes email to lowercase",
                    type: "api",
                    steps: [
                      "Update user email to Updated.Staff@Example.com."
                    ],
                    expectedResult: "Status 200. Saved email is updated.staff@example.com.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-u-03",
                    title: "PUT normalizes Vietnamese phone",
                    type: "api",
                    steps: [
                      "Update user phone to +84900000004."
                    ],
                    expectedResult: "Status 200. Saved phone is 0900000004.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-u-04",
                    title: "PUT duplicate email with another user returns 409",
                    type: "api",
                    steps: [
                      "User A has email staff01@example.com.",
                      "User B updates email to staff01@example.com."
                    ],
                    expectedResult: "Status 409. Error code EMAIL_ALREADY_EXISTS.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-u-05",
                    title: "PUT duplicate phone with another user returns 409",
                    type: "api",
                    steps: [
                      "User A has phone 0900000003.",
                      "User B updates phone to +84900000003."
                    ],
                    expectedResult: "Status 409. Error code PHONE_ALREADY_EXISTS.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-u-06",
                    title: "PUT same email/phone of current user is allowed",
                    type: "api",
                    steps: [
                      "User A currently has email staff01@example.com and phone 0900000003.",
                      "Update User A with same email and phone."
                    ],
                    expectedResult: "Status 200. No duplicate error is returned.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-u-07",
                    title: "PUT cannot change password/role/status",
                    type: "api",
                    steps: [
                      "Send extra fields password, role, status in PUT body."
                    ],
                    expectedResult: "Extra fields ignored or rejected. Stored password, role, status remain unchanged.",
                    status: "not_started"
                  }
                ],
                doneCriteria: [
                  { id: "dc-user-u-01", content: "Endpoint PUT /api/core/users/{id} is exposed.", checked: false },
                  { id: "dc-user-u-02", content: "PUT only updates fullName, email, phone.", checked: false },
                  { id: "dc-user-u-03", content: "PUT cannot change username.", checked: false },
                  { id: "dc-user-u-04", content: "PUT cannot change password.", checked: false },
                  { id: "dc-user-u-05", content: "PUT cannot change role.", checked: false },
                  { id: "dc-user-u-06", content: "PUT cannot change status.", checked: false },
                  { id: "dc-user-u-07", content: "PUT duplicate email with another user returns HTTP 409 EMAIL_ALREADY_EXISTS.", checked: false },
                  { id: "dc-user-u-08", content: "PUT duplicate phone with another user returns HTTP 409 PHONE_ALREADY_EXISTS.", checked: false },
                  { id: "dc-user-u-09", content: "PUT with same email/phone of current user is allowed.", checked: false },
                  { id: "dc-user-u-10", content: "Mutating operations write audit log USER_UPDATED.", checked: false }
                ]
              },
              {
                id: "leaf-user-status",
                title: "User Status Management",
                type: "leaf_feature",
                clients: ["Admin"],
                status: "ready",
                priority: "medium",
                tags: ["users", "status", "admin"],
                summary: "Allows Admin to change user status (ACTIVE, LOCKED, INACTIVE) with a required reason.",
                objective: "Implement status changing for Admin. Protect Admin from deactivating their own account or the last active Admin.",
                inScope: [
                  "Admin changes user status: ACTIVE, LOCKED, INACTIVE.",
                  "Status change requires a reason.",
                  "Self status change protection.",
                  "Last active Admin status change protection.",
                  "Audit log USER_STATUS_CHANGED is written."
                ],
                outOfScope: [
                  "Creating users.",
                  "Updating profile.",
                  "Changing role.",
                  "Hard delete.",
                  "Password reset."
                ],
                permissions: [
                  { role: "ADMIN", permission: "Can call PATCH /api/core/users/{id}/status" }
                ],
                dbExistingTables: ["users"],
                validationRules: [
                  { field: "status", rule: "Required, ACTIVE, LOCKED, INACTIVE", errorMessage: "INVALID_USER_STATUS" },
                  { field: "reason", rule: "Required, trim", errorMessage: "REASON_REQUIRED" }
                ],
                securityRules: [
                  "Validate JWT.",
                  "Require Admin role.",
                  "Prevent Admin from locking or deactivating own account.",
                  "Prevent locking or deactivating the last active Admin."
                ],
                logEvents: [
                  "USER_STATUS_CHANGED",
                  "USER_SELF_PROTECTION_BLOCKED",
                  "USER_LAST_ADMIN_PROTECTION_BLOCKED"
                ],
                integrationPoints: [
                  { system: "Auth / JWT Middleware", responsibility: "Validates authenticated Admin request" },
                  { system: "Audit Log Service", responsibility: "Writes audit logs on mutating operations" }
                ],
                uiComponents: "Change Status Confirmation Modal, required reason text input.",
                uiStateLoading: "Disable inputs, show loading spinner.",
                uiStateError: "Display general validation errors.",
                uiStateSuccess: "Show success toast, refresh list, close modal.",
                endpoints: [
                  "PATCH /api/core/users/{id}/status"
                ],
                ownerService: ".NET Core API",
                apiContracts: [
                  {
                    id: "api-contract-patch-user-status",
                    name: "PATCH /api/core/users/{id}/status",
                    content: "Description:\nAdmin changes user status. Reason is required.\n\nRequest Body:\n{\n  \"status\": \"LOCKED\",\n  \"reason\": \"Suspicious activity\"\n}\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"User status changed successfully\",\n  \"data\": {\n    \"id\": 20,\n    \"fullName\": \"Updated Staff Name\",\n    \"username\": \"staff02\",\n    \"role\": \"STAFF\",\n    \"oldStatus\": \"ACTIVE\",\n    \"newStatus\": \"LOCKED\",\n    \"reason\": \"Suspicious activity\",\n    \"updatedAt\": \"2026-07-05T17:35:00+07:00\"\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:35:00+07:00\"\n}"
                  }
                ],
                dataContracts: [
                  {
                    id: "data-contract-change-status-request",
                    name: "ChangeStatusRequest (C# DTO)",
                    content: "public class ChangeStatusRequest\n{\n    public string Status { get; set; } = string.Empty;\n    public string Reason { get; set; } = string.Empty;\n}"
                  }
                ],
                testCases: [
                  {
                    id: "tc-user-s-01",
                    title: "Admin can lock user with reason",
                    type: "api",
                    steps: [
                      "Call PATCH /api/core/users/{id}/status.",
                      "Body: { \"status\": \"LOCKED\", \"reason\": \"Policy violation\" }."
                    ],
                    expectedResult: "Status 200. User status becomes LOCKED. Audit log USER_STATUS_CHANGED exists.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-s-02",
                    title: "Missing reason in status change returns 400",
                    type: "api",
                    expectedResult: "Status 400. Error code REASON_REQUIRED.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-s-03",
                    title: "Admin cannot lock or deactivate own account",
                    type: "api",
                    expectedResult: "Status 409. Error code CANNOT_CHANGE_OWN_STATUS.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-s-04",
                    title: "Admin cannot lock or deactivate last active Admin",
                    type: "api",
                    precondition: "There is only one ACTIVE Admin in the system.",
                    steps: [
                      "Attempt to change that Admin status to LOCKED or INACTIVE."
                    ],
                    expectedResult: "Status 409. Error code CANNOT_DISABLE_LAST_ADMIN. Admin remains ACTIVE.",
                    status: "not_started"
                  }
                ],
                doneCriteria: [
                  { id: "dc-user-s-01", content: "Endpoint PATCH /api/core/users/{id}/status is exposed.", checked: false },
                  { id: "dc-user-s-02", content: "Status change requires reason.", checked: false },
                  { id: "dc-user-s-03", content: "Admin cannot lock or deactivate own account.", checked: false },
                  { id: "dc-user-s-04", content: "Admin cannot lock or deactivate the last active Admin.", checked: false },
                  { id: "dc-user-s-05", content: "Mutating operations write audit log USER_STATUS_CHANGED.", checked: false }
                ]
              },
              {
                id: "leaf-user-role",
                title: "User Role Management",
                type: "leaf_feature",
                clients: ["Admin"],
                status: "ready",
                priority: "medium",
                tags: ["users", "role", "admin"],
                summary: "Allows Admin to change internal user role (ADMIN, MANAGER, STAFF) with a required reason.",
                objective: "Implement role changing for Admin. Protect Admin from self-demotion or demoting the last active Admin. Rejects DRIVER role assignment.",
                inScope: [
                  "Admin changes internal user role: ADMIN, MANAGER, STAFF.",
                  "Role change requires a reason.",
                  "Self-demotion protection.",
                  "Last active Admin demotion protection.",
                  "Rejects DRIVER role assignment.",
                  "Audit log USER_ROLE_CHANGED is written."
                ],
                outOfScope: [
                  "Creating users.",
                  "Updating profile.",
                  "Changing status.",
                  "Driver registration.",
                  "Driver profile management.",
                  "Full RBAC/permission table management."
                ],
                permissions: [
                  { role: "ADMIN", permission: "Can call PATCH /api/core/users/{id}/role" }
                ],
                dbExistingTables: ["users"],
                validationRules: [
                  { field: "role", rule: "Required, ADMIN, MANAGER, STAFF", errorMessage: "INVALID_USER_ROLE" },
                  { field: "reason", rule: "Required, trim", errorMessage: "REASON_REQUIRED" }
                ],
                securityRules: [
                  "Validate JWT.",
                  "Require Admin role.",
                  "Prevent Admin from demoting own role.",
                  "Prevent demoting the last active Admin.",
                  "Prevent assigning DRIVER through PATCH /api/core/users/{id}/role."
                ],
                logEvents: [
                  "USER_ROLE_CHANGED",
                  "USER_SELF_PROTECTION_BLOCKED",
                  "USER_LAST_ADMIN_PROTECTION_BLOCKED"
                ],
                integrationPoints: [
                  { system: "Auth / JWT Middleware", responsibility: "Validates authenticated Admin request" },
                  { system: "Audit Log Service", responsibility: "Writes audit logs on mutating operations" }
                ],
                uiComponents: "Change Role Confirmation Modal, required reason text input.",
                uiStateLoading: "Disable inputs, show loading spinner.",
                uiStateError: "Display general validation errors.",
                uiStateSuccess: "Show success toast, refresh list, close modal.",
                endpoints: [
                  "PATCH /api/core/users/{id}/role"
                ],
                ownerService: ".NET Core API",
                apiContracts: [
                  {
                    id: "api-contract-patch-user-role",
                    name: "PATCH /api/core/users/{id}/role",
                    content: "Description:\nAdmin changes internal user role. Reason is required. DRIVER role is rejected.\n\nRequest Body:\n{\n  \"role\": \"MANAGER\",\n  \"reason\": \"Promoted to manager\"\n}\n\nResponse 200 OK:\n{\n  \"success\": true,\n  \"message\": \"User role changed successfully\",\n  \"data\": {\n    \"id\": 20,\n    \"fullName\": \"Updated Staff Name\",\n    \"username\": \"staff02\",\n    \"oldRole\": \"STAFF\",\n    \"newRole\": \"MANAGER\",\n    \"reason\": \"Promoted to manager\",\n    \"updatedAt\": \"2026-07-05T17:40:00+07:00\"\n  },\n  \"errors\": null,\n  \"timestamp\": \"2026-07-05T17:40:00+07:00\"\n}"
                  }
                ],
                dataContracts: [
                  {
                    id: "data-contract-change-role-request",
                    name: "ChangeRoleRequest (C# DTO)",
                    content: "public class ChangeRoleRequest\n{\n    public string Role { get; set; } = string.Empty;\n    public string Reason { get; set; } = string.Empty;\n}"
                  }
                ],
                testCases: [
                  {
                    id: "tc-user-r-01",
                    title: "Admin can change role with reason",
                    type: "api",
                    steps: [
                      "Call PATCH /api/core/users/{id}/role.",
                      "Body: { \"role\": \"MANAGER\", \"reason\": \"Promotion\" }."
                    ],
                    expectedResult: "Status 200. User role becomes MANAGER. Audit log USER_ROLE_CHANGED exists.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-r-02",
                    title: "Missing reason in role change returns 400",
                    type: "api",
                    expectedResult: "Status 400. Error code REASON_REQUIRED.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-r-03",
                    title: "Change role to DRIVER is rejected",
                    type: "api",
                    steps: [
                      "Call PATCH /api/core/users/{id}/role with role DRIVER."
                    ],
                    expectedResult: "Status 400. Error code INVALID_USER_ROLE.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-r-04",
                    title: "Admin cannot demote own role",
                    type: "api",
                    expectedResult: "Status 409. Error code CANNOT_CHANGE_OWN_ROLE.",
                    status: "not_started"
                  },
                  {
                    id: "tc-user-r-05",
                    title: "Admin cannot demote last active Admin",
                    type: "api",
                    precondition: "There is only one ACTIVE Admin in the system.",
                    steps: [
                      "Attempt to change that Admin role to MANAGER or STAFF."
                    ],
                    expectedResult: "Status 409. Error code CANNOT_DEMOTE_LAST_ADMIN. Admin role remains ADMIN.",
                    status: "not_started"
                  }
                ],
                doneCriteria: [
                  { id: "dc-user-r-01", content: "Endpoint PATCH /api/core/users/{id}/role is exposed.", checked: false },
                  { id: "dc-user-r-02", content: "PATCH /api/core/users/{id}/role rejects DRIVER role.", checked: false },
                  { id: "dc-user-r-03", content: "Role change requires reason.", checked: false },
                  { id: "dc-user-r-04", content: "Admin cannot demote own role.", checked: false },
                  { id: "dc-user-r-05", content: "Admin cannot demote the last active Admin.", checked: false },
                  { id: "dc-user-r-06", content: "Mutating operations write audit log USER_ROLE_CHANGED.", checked: false }
                ]
              }
            ]
          },
          {
            id: "leaf-driver-vehicles-list",
            title: "Driver Registered Vehicles",
            type: "leaf_feature",
            clients: ["Driver"],
            endpoints: [
              "GET /api/core/driver/vehicles"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/driver/vehicles"),
            testCases: defaultApiTests("Driver Registered Vehicles", ["Driver"], ["GET /api/core/driver/vehicles"]),
            doneCriteria: defaultDoneCriteria("Driver Registered Vehicles")
          },
          {
            id: "leaf-driver-vehicle-history",
            title: "Driver Vehicle Entry Exit History",
            type: "leaf_feature",
            clients: ["Driver"],
            endpoints: [
              "GET /api/support/driver/vehicles/entry-exit-history"
            ],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/driver/vehicles/entry-exit-history"),
            testCases: defaultApiTests("Driver Vehicle Entry Exit History", ["Driver"], ["GET /api/support/driver/vehicles/entry-exit-history"]),
            doneCriteria: defaultDoneCriteria("Driver Vehicle Entry Exit History")
          },
          {
            id: "leaf-driver-mp-application",
            title: "Driver Monthly Pass Application",
            type: "leaf_feature",
            clients: ["Driver"],
            endpoints: [
              "POST /api/core/monthly-passes/applications",
              "GET /api/support/monthly-passes/applications/me"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/monthly-passes/applications"),
            testCases: defaultApiTests("Driver Monthly Pass Application", ["Driver"], ["POST /api/core/monthly-passes/applications"]),
            doneCriteria: defaultDoneCriteria("Driver Monthly Pass Application")
          }
        ]
      },
      // 4b. Vehicle Configuration
      {
        id: "cat-vehicle-config",
        title: "Vehicle Configuration",
        type: "category",
        summary: "Configuration and master data of vehicle properties.",
        children: [
          {
            id: "leaf-vehicle-type",
            title: "Vehicle Type Management",
            type: "leaf_feature",
            clients: ["Admin", "Manager"],
            endpoints: [
              "GET /api/core/vehicle-types",
              "GET /api/core/vehicle-types/{id}",
              "POST /api/core/vehicle-types",
              "PUT /api/core/vehicle-types/{id}",
              "PATCH /api/core/vehicle-types/{id}/active",
              "DELETE /api/core/vehicle-types/{id}"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/vehicle-types"),
            testCases: defaultApiTests("Vehicle Type Management", ["Manager"], ["GET /api/core/vehicle-types"]),
            doneCriteria: defaultDoneCriteria("Vehicle Type Management")
          }
        ]
      },

      // 5. Parking Structure Management
      {
        id: "cat-structure",
        title: "Parking Structure Management",
        type: "category",
        summary: "Floors, Areas, and individual slot layout configurations.",
        children: [
          {
            id: "leaf-struct-floor",
            title: "Floor Management",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: [
              "GET /api/core/floors",
              "POST /api/core/floors",
              "PUT /api/core/floors/{id}"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/floors"),
            testCases: defaultApiTests("Floor Management", ["Manager"], ["POST /api/core/floors"]),
            doneCriteria: defaultDoneCriteria("Floor Management")
          },
          {
            id: "leaf-struct-area",
            title: "Area Management",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: [
              "GET /api/core/areas",
              "POST /api/core/areas",
              "PUT /api/core/areas/{id}"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/areas"),
            testCases: defaultApiTests("Area Management", ["Manager"], ["POST /api/core/areas"]),
            doneCriteria: defaultDoneCriteria("Area Management")
          },
          {
            id: "leaf-struct-slot",
            title: "Slot Management",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: [
              "GET /api/core/slots",
              "POST /api/core/slots",
              "PATCH /api/core/slots/{id}/status"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/slots"),
            testCases: defaultApiTests("Slot Management", ["Manager"], ["GET /api/core/slots"]),
            doneCriteria: defaultDoneCriteria("Slot Management")
          },
          {
            id: "leaf-struct-gate",
            title: "Gate Read Model",
            type: "leaf_feature",
            clients: ["Staff", "Manager", "Admin"],
            endpoints: [],
            ownerService: "Spring Boot Support API",
            testCases: defaultApiTests("Gate Read Model", ["Staff"], []),
            doneCriteria: defaultDoneCriteria("Gate Read Model")
          },
          {
            id: "leaf-struct-avail",
            title: "Public Available Slots",
            type: "leaf_feature",
            clients: ["Guest", "Driver"],
            endpoints: ["GET /api/public/available-slots"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/public/available-slots"),
            testCases: defaultApiTests("Public Available Slots", ["Guest", "Driver"], ["GET /api/public/available-slots"]),
            doneCriteria: defaultDoneCriteria("Public Available Slots")
          },
          {
            id: "leaf-struct-suggest",
            title: "Location / Slot Suggestion",
            type: "leaf_feature",
            clients: ["Staff", "Manager", "Driver"],
            endpoints: ["POST /api/core/parking-sessions/suggest-slot"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/parking-sessions/suggest-slot"),
            testCases: defaultApiTests("Location / Slot Suggestion", ["Driver"], ["POST /api/core/parking-sessions/suggest-slot"]),
            doneCriteria: defaultDoneCriteria("Location / Slot Suggestion")
          }
        ]
      },

      // 6. Card & RFID Management
      {
        id: "cat-cards",
        title: "Card & RFID Management",
        type: "category",
        summary: "Managing mechanical RFIDs and tracking physical entry cards.",
        children: [
          {
            id: "leaf-card-crud",
            title: "Parking Card CRUD",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: [
              "GET /api/core/cards",
              "GET /api/core/cards/{id}",
              "POST /api/core/cards",
              "PUT /api/core/cards/{id}",
              "PATCH /api/core/cards/{id}/status",
              "DELETE /api/core/cards/{id}",
              "GET /api/core/cards/available"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/cards"),
            testCases: defaultApiTests("Parking Card CRUD", ["Manager"], ["POST /api/core/cards"]),
            doneCriteria: [
              ...defaultDoneCriteria("Parking Card CRUD"),
              { id: "dc-card-avail", content: "Retrieval of unassigned cards for on-site registration is functional.", checked: false }
            ]
          }
        ]
      },

      // 7. Reservation / Booking
      {
        id: "cat-reservation",
        title: "Reservation / Booking",
        type: "category",
        summary: "Pre-booking mechanisms for locking slots ahead of arrival.",
        businessRules: [
          "A reservation must be associated with a driver, vehicle/plate, vehicle type, selected parking location, reservation time, payment status, and booking amount.",
          "Reservation payment status must be trackable.",
          "Unpaid or expired reservations must not permanently lock slots.",
          "Reservation entry check must validate reservation code, gate, payment status, time validity, and whether the reservation has already been used.",
          "Booking amount must be consistent with configured reservation hourly price and selected duration."
        ],
        children: [
          {
            id: "leaf-res-avail",
            title: "Available Reservation Locations",
            type: "leaf_feature",
            clients: ["Driver"],
            endpoints: ["GET /api/core/reservations/available-locations"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/reservations/available-locations"),
            testCases: defaultApiTests("Available Reservation Locations", ["Driver"], ["GET /api/core/reservations/available-locations"]),
            doneCriteria: defaultDoneCriteria("Available Reservation Locations")
          },
          {
            id: "leaf-res-create",
            title: "Create Reservation",
            type: "leaf_feature",
            clients: ["Driver"],
            endpoints: [
              "POST /api/core/reservations",
              "GET /api/core/reservations/{id}/payment-status"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/reservations"),
            testCases: defaultApiTests("Create Reservation", ["Driver"], ["POST /api/core/reservations"]),
            doneCriteria: [
              ...defaultDoneCriteria("Create Reservation"),
              { id: "dc-res-pay-status", content: "Payment verification integration is functional.", checked: false },
              { id: "dc-res-expire", content: "Automatic expiration release of unpaid bookings is functional.", checked: false }
            ]
          },
          {
            id: "leaf-res-extend",
            title: "Extend Reservation",
            type: "leaf_feature",
            clients: ["Driver"],
            endpoints: ["POST /api/core/reservations/{id}/extend"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/reservations/{id}/extend"),
            testCases: defaultApiTests("Extend Reservation", ["Driver"], ["POST /api/core/reservations/{id}/extend"]),
            doneCriteria: defaultDoneCriteria("Extend Reservation")
          },
          {
            id: "leaf-res-cancel",
            title: "Cancel Reservation",
            type: "leaf_feature",
            clients: ["Driver"],
            endpoints: ["POST /api/core/reservations/{id}/cancel"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/reservations/{id}/cancel"),
            testCases: defaultApiTests("Cancel Reservation", ["Driver"], ["POST /api/core/reservations/{id}/cancel"]),
            doneCriteria: defaultDoneCriteria("Cancel Reservation")
          },
          {
            id: "leaf-res-driver-history",
            title: "Driver Reservation History",
            type: "leaf_feature",
            clients: ["Driver"],
            endpoints: [
              "GET /api/support/reservations/me/active",
              "GET /api/support/reservations/me/history"
            ],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/reservations/me/history"),
            testCases: defaultApiTests("Driver Reservation History", ["Driver"], ["GET /api/support/reservations/me/history"]),
            doneCriteria: defaultDoneCriteria("Driver Reservation History")
          }
        ]
      },

      // 8. Parking Session
      {
        id: "cat-session",
        title: "Parking Session",
        type: "category",
        summary: "Active check-in entry to check-out exit transactional sessions.",
        businessRules: [
          "A parking session starts at vehicle entry and ends after successful exit processing.",
          "Entry requires card/session information, plate information, gate, and location decision.",
          "Exit fee must be calculated before completing casual exit.",
          "Monthly pass exit must validate an active monthly pass.",
          "Staff operations must be protected by role authorization."
        ],
        children: [
          {
            id: "leaf-sess-entry",
            title: "Vehicle Entry",
            type: "leaf_feature",
            clients: ["Staff"],
            endpoints: [
              "POST /api/core/parking-sessions/entry",
              "GET /api/core/reservations/{reservationCode}/entry-check",
              "GET /api/core/parking-sessions/location-suggestion"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/parking-sessions/entry"),
            testCases: defaultApiTests("Vehicle Entry", ["Staff"], ["POST /api/core/parking-sessions/entry"]),
            doneCriteria: [
              ...defaultDoneCriteria("Vehicle Entry"),
              { id: "dc-sess-res-check", content: "Integration checking driver pre-bookings works.", checked: false },
              { id: "dc-sess-suggest", content: "Integration proposing available floor space layout works.", checked: false }
            ]
          },
          {
            id: "leaf-sess-claim",
            title: "Claim Session by QR",
            type: "leaf_feature",
            clients: ["Driver"],
            endpoints: ["POST /api/core/parking-sessions/{qrToken}/claim"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/parking-sessions/{qrToken}/claim"),
            testCases: defaultApiTests("Claim Session by QR", ["Driver"], ["POST /api/core/parking-sessions/{qrToken}/claim"]),
            doneCriteria: defaultDoneCriteria("Claim Session by QR")
          },
          {
            id: "leaf-sess-exit",
            title: "Vehicle Exit",
            type: "leaf_feature",
            clients: ["Staff"],
            endpoints: [
              "POST /api/core/parking-sessions/{id}/exit",
              "GET /api/core/parking-sessions/by-card-code/{cardCode}",
              "POST /api/core/parking-sessions/{id}/calculate-fee",
              "POST /api/core/parking-sessions/{id}/monthly-pass-exit"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/parking-sessions/{id}/exit"),
            testCases: defaultApiTests("Casual Exit", ["Staff"], ["POST /api/core/parking-sessions/{id}/exit"]),
            doneCriteria: [
              ...defaultDoneCriteria("Vehicle Exit"),
              { id: "dc-sess-find", content: "Card RFID scanning loads correct active session.", checked: false },
              { id: "dc-sess-calc", content: "Accurate fee calculation based on active pricing scheme.", checked: false },
              { id: "dc-sess-monthly-exit", content: "Seamless gate exit for registered monthly pass vehicles.", checked: false }
            ]
          },
          {
            id: "leaf-mp-validation",
            title: "Monthly Pass Check During Entry Exit",
            type: "leaf_feature",
            clients: ["Staff", "System"],
            endpoints: [
              "GET /api/core/monthly-passes/check"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/monthly-passes/check"),
            testCases: defaultApiTests("Monthly Pass Check During Entry Exit", ["Staff"], ["GET /api/core/monthly-passes/check"]),
            doneCriteria: defaultDoneCriteria("Monthly Pass Check During Entry Exit")
          }
        ]
      },

      // 9. Payment
      {
        id: "cat-payment",
        title: "Payment",
        type: "category",
        summary: "Checkout pathways including cash, waived permissions, and PayOS integrations.",
        businessRules: [
          "PayOS webhook must verify payment data before marking payment as paid.",
          "Exit online payment must be linked to an existing active parking session.",
          "Cash payment must be created only by authorized staff/manager flow.",
          "Waived payment must require a reason and authorized role.",
          "Amount mismatches or uncertain provider status should be treated as review cases instead of blindly succeeding."
        ],
        children: [
          {
            id: "leaf-pay-webhook",
            title: "PayOS Webhook",
            type: "leaf_feature",
            clients: ["System"],
            endpoints: ["POST /api/core/payments/payos/webhook"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/payments/payos/webhook"),
            testCases: defaultApiTests("PayOS Webhook", ["System"], ["POST /api/core/payments/payos/webhook"]),
            doneCriteria: defaultDoneCriteria("PayOS Webhook")
          },
          {
            id: "leaf-pay-online",
            title: "Online Exit Fee Payment",
            type: "leaf_feature",
            clients: ["Staff", "Driver"],
            endpoints: ["POST /api/core/payments/online/exit-fee"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/payments/online/exit-fee"),
            testCases: defaultApiTests("Online Exit Fee Payment", ["Driver"], ["POST /api/core/payments/online/exit-fee"]),
            doneCriteria: defaultDoneCriteria("Online Exit Fee Payment")
          },
          {
            id: "leaf-pay-cash",
            title: "Cash Payment",
            type: "leaf_feature",
            clients: ["Staff", "Manager"],
            endpoints: ["POST /api/core/payments/cash"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/payments/cash"),
            testCases: defaultApiTests("Cash Payment", ["Staff"], ["POST /api/core/payments/cash"]),
            doneCriteria: defaultDoneCriteria("Cash Payment")
          },
          {
            id: "leaf-pay-waived",
            title: "Waived Payment",
            type: "leaf_feature",
            clients: ["Staff", "Manager"],
            endpoints: ["POST /api/core/payments/waive"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/payments/waive"),
            testCases: defaultApiTests("Waived Payment", ["Manager"], ["POST /api/core/payments/waive"]),
            doneCriteria: defaultDoneCriteria("Waived Payment")
          },
          {
            id: "leaf-pay-reconcile",
            title: "Reservation Payment Reconciliation",
            type: "leaf_feature",
            clients: ["System"],
            endpoints: [],
            ownerService: ".NET Core API",
            testCases: defaultApiTests("Reservation Payment Reconciliation", ["System"], []),
            doneCriteria: defaultDoneCriteria("Reservation Payment Reconciliation")
          },
          {
            id: "leaf-pay-review",
            title: "Payment Review / Mismatch Handling",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: [],
            ownerService: ".NET Core API",
            testCases: defaultApiTests("Payment Review / Mismatch Handling", ["Manager"], []),
            doneCriteria: defaultDoneCriteria("Payment Review / Mismatch Handling")
          }
        ]
      },

      // 10. Pricing & Fee Calculation
      {
        id: "cat-pricing",
        title: "Pricing & Fee Calculation",
        type: "category",
        summary: "CRUD parameters for vehicle groups pricing plans.",
        businessRules: [
          "Pricing rules must be configurable by vehicle type.",
          "Reservation hourly price must be configurable.",
          "Lost card fee and monthly price should be included in pricing-related contracts.",
          "Fee calculation must use active pricing rules."
        ],
        children: [
          {
            id: "leaf-price-crud",
            title: "Pricing Rule CRUD",
            type: "leaf_feature",
            status: "in_progress",
            priority: "medium",
            clients: ["Admin", "Manager"],
            tags: ["payments", "pricing", "crud", "admin"],
            summary: "Cung cấp đầy đủ các thao tác CRUD danh sách quy tắc giá cho Admin và Manager.",
            objective: "Thiết lập các API quản trị (CRUD) để Admin và Manager cấu hình bảng giá và các quy tắc tính phí đỗ xe. Hệ thống hỗ trợ cấu hình giá linh hoạt theo từng loại phương tiện (Vehicle Type), phí phạt mất thẻ (Lost Card Fee), giá vé tháng (Monthly Price) và đơn giá đặt chỗ trước theo giờ (Reservation Hourly Price). Bản ghi bảng giá đang hoạt động sẽ được sử dụng trực tiếp làm tham số đầu vào cho bộ máy tính toán phí đỗ xe tại cổng ra.",
            inScope: [
              "Cung cấp đầy đủ các thao tác CRUD danh sách quy tắc giá.",
              "Hỗ trợ cập nhật nhanh (PATCH) đơn giá đặt chỗ trước (ReservationHourlyPrice) để phản hồi nhanh với biến động cung-cầu thị trường.",
              "Ràng buộc nghiệp vụ: Đảm bảo tại một thời điểm chỉ có duy nhất một bộ quy tắc giá ở trạng thái hoạt động (IsActive = true) đối với mỗi loại phương tiện.",
              "Tự động lưu vết lịch sử thay đổi (Audit Trail) vào schema quản trị khi có bất kỳ thao tác thay đổi dữ liệu nào (Create, Update, Delete, Patch)."
            ],
            outOfScope: [
              "Logic tính toán chi tiết hóa đơn đỗ xe thực tế (sẽ do service/feature tính phí tại cổng gọi sang để lấy cấu hình).",
              "Đồng bộ hóa bảng giá sang các hệ thống thanh toán bên thứ ba."
            ],
            permissions: [
              { role: "Admin", permission: "Full Access. Có toàn quyền CRUD, kích hoạt/vô hiệu hóa quy tắc giá và xem toàn bộ lịch sử Audit Log." },
              { role: "Manager", permission: "Write/Update. Có quyền Xem, Tạo mới và Chỉnh sửa bảng giá. Không có quyền DELETE các cấu hình giá cũ để đảm bảo tính toàn vẹn dữ liệu lịch sử." }
            ],
            businessRules: [
              "Active Status Constraint: Với mỗi loại phương tiện (VehicleType), chỉ cho phép tối đa một cấu hình có trạng thái IsActive = true. Khi kích hoạt một cấu hình mới, hệ thống tự động chuyển các cấu hình cũ của phương tiện đó về IsActive = false.",
              "Zero or Positive Bounds: Tất cả các giá trị tiền tệ như HourlyRate, ReservationHourlyRate, LostCardFee, và MonthlyPrice phải lớn hơn hoặc bằng 0.",
              "Audit Tracking: Mọi thao tác POST/PUT/DELETE/PATCH đều phải ghi nhận thông tin tài khoản thực hiện (CreatedBy / UpdatedBy) thông qua Claims của JWT Token."
            ],
            dbExistingTables: ["AuditLogs"],
            dbNewTablesSql: `-- Table for pricing rules\nCREATE TABLE PricingRules (\n  Id UUID PRIMARY KEY,\n  VehicleType VARCHAR(50) NOT NULL,\n  HourlyRate DECIMAL(18, 2) NOT NULL DEFAULT 0.00,\n  ReservationHourlyPrice DECIMAL(18, 2) NOT NULL DEFAULT 0.00,\n  LostCardFee DECIMAL(18, 2) NOT NULL DEFAULT 0.00,\n  MonthlyPrice DECIMAL(18, 2) NOT NULL DEFAULT 0.00,\n  IsActive BOOLEAN NOT NULL DEFAULT FALSE,\n  CreatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  CreatedBy VARCHAR(100),\n  UpdatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  UpdatedBy VARCHAR(100)\n);\n\nCREATE UNIQUE INDEX IX_PricingRules_VehicleType_Active ON PricingRules (VehicleType) WHERE IsActive = TRUE;`,
            dbRelationships: [],
            validationRules: [
              { field: "vehicleType", rule: "Không được trống, phải là loại xe được hỗ trợ (Car, Motorbike, Bicycle).", errorMessage: "INVALID_VEHICLE_TYPE" },
              { field: "hourlyRate", rule: "Bắt buộc >= 0.", errorMessage: "HOURLY_RATE_MUST_BE_POSITIVE" },
              { field: "reservationHourlyPrice", rule: "Bắt buộc >= 0.", errorMessage: "RESERVATION_RATE_MUST_BE_POSITIVE" },
              { field: "lostCardFee", rule: "Bắt buộc >= 0.", errorMessage: "LOST_CARD_FEE_MUST_BE_POSITIVE" },
              { field: "monthlyPrice", rule: "Bắt buộc >= 0.", errorMessage: "MONTHLY_PRICE_MUST_BE_POSITIVE" }
            ],
            securityRules: [
              "Role-Based Access Control (RBAC): Chỉ cho phép User có claim role là Admin hoặc Manager gọi các API thay đổi dữ liệu (POST, PUT, PATCH, DELETE).",
              "Ngăn chặn hành động xóa cấu hình đang được sử dụng ở trạng thái IsActive = true. Chỉ được phép xóa các cấu hình cũ không còn hoạt động (và chỉ dành riêng cho role Admin)."
            ],
            logEvents: [
              "Ghi log cụ thể nội dung thay đổi cấu hình giá, bao gồm các tham số cũ (Old Values) và tham số mới (New Values) vào bảng AuditLogs.",
              "Log chi tiết ID người dùng thực hiện thao tác thay đổi."
            ],
            noLogEvents: [
              "Bearer Token, mật khẩu định danh của Admin/Manager trong header hoặc log payload."
            ],
            integrationPoints: [
              { system: "Payment Fee Calculation Service", responsibility: "Sử dụng cấu hình từ API này để tự động tính toán số tiền khách cần thanh toán khi Exit." }
            ],
            uiPage: "/admin/pricing-management",
            uiComponents: "Pricing rules table with status badges (Active/Inactive), Dynamic reservation hourly rate slider/dialog, Activation confirmation dialog",
            uiStateLoading: "Disable interactions, show saving/updating indicator.",
            uiStateEmpty: "No pricing rules configured.",
            uiStateError: "Show toast notification with specific business rule validation error.",
            uiStateSuccess: "Show success toast, refresh pricing rules list.",
            endpoints: [
              "GET /api/core/pricing-rules",
              "GET /api/core/pricing-rules/{id}",
              "POST /api/core/pricing-rules",
              "PUT /api/core/pricing-rules/{id}",
              "DELETE /api/core/pricing-rules/{id}",
              "PATCH /api/core/pricing-rules/{id}/reservation-hourly-price"
            ],
            ownerService: ".NET Core API",
            apiContracts: [
              {
                id: "contract-price-get",
                name: "GET /api/core/pricing-rules",
                content: `Method: GET\nPath: /api/core/pricing-rules\nHeaders:\n  Authorization: Bearer <token>\nResponse 200 OK:\n{\n  "success": true,\n  "data": [\n    {\n      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",\n      "vehicleType": "Car",\n      "hourlyRate": 20000.00,\n      "reservationHourlyPrice": 10000.00,\n      "lostCardFee": 100000.00,\n      "monthlyPrice": 1500000.00,\n      "isActive": true,\n      "createdAt": "2026-07-17T09:00:00Z"\n    }\n  ]\n}`
              },
              {
                id: "contract-price-post",
                name: "POST /api/core/pricing-rules",
                content: `Method: POST\nPath: /api/core/pricing-rules\nHeaders:\n  Authorization: Bearer <token>\nRequest Body:\n{\n  "vehicleType": "Car",\n  "hourlyRate": 20000.00,\n  "reservationHourlyPrice": 10000.00,\n  "lostCardFee": 100000.00,\n  "monthlyPrice": 1500000.00,\n  "isActive": true\n}\nResponse 201 Created:\n{\n  "success": true,\n  "message": "Pricing rule created successfully.",\n  "data": { "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" }\n}`
              },
              {
                id: "contract-price-put",
                name: "PUT /api/core/pricing-rules/{id}",
                content: `Method: PUT\nPath: /api/core/pricing-rules/{id}\nRequest Body:\n{\n  "vehicleType": "Car",\n  "hourlyRate": 25000.00,\n  "reservationHourlyPrice": 12000.00,\n  "lostCardFee": 120000.00,\n  "monthlyPrice": 1800000.00,\n  "isActive": true\n}\nResponse 200 OK:\n{\n  "success": true,\n  "message": "Pricing rule updated successfully."\n}`
              },
              {
                id: "contract-price-patch",
                name: "PATCH /api/core/pricing-rules/{id}/reservation-hourly-price",
                content: `Method: PATCH\nPath: /api/core/pricing-rules/{id}/reservation-hourly-price\nRequest Body:\n{\n  "reservationHourlyPrice": 15000.00\n}\nResponse 200 OK:\n{\n  "success": true,\n  "message": "Reservation hourly price updated successfully.",\n  "data": {\n    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",\n    "newReservationHourlyPrice": 15000.00\n  }\n}`
              }
            ],
            testCases: [
              {
                id: "tc-price-active-switch",
                title: "Verify Admin can create and automatically activate a new pricing rule",
                type: "api",
                precondition: "Đăng nhập bằng tài khoản có role Admin.",
                steps: [
                  "Gọi POST /api/core/pricing-rules để tạo cấu hình Car mới với IsActive = true.",
                  "Truy xuất lại danh sách qua GET /api/core/pricing-rules."
                ],
                expectedResult: "HTTP 201 Created. Cấu hình mới được kích hoạt, đồng thời tất cả các cấu hình Car cũ trước đó tự động chuyển về IsActive = false.",
                status: "not_started"
              },
              {
                id: "tc-price-delete-manager-rejected",
                title: "Verify Manager is rejected when attempting to DELETE a pricing rule",
                type: "api",
                precondition: "Đăng nhập bằng tài khoản có role Manager.",
                steps: [
                  "Gọi DELETE /api/core/pricing-rules/{id}."
                ],
                expectedResult: "HTTP 403 Forbidden. Thông báo lỗi chỉ ra Manager không có quyền xóa.",
                status: "not_started"
              },
              {
                id: "tc-price-validation-bounds",
                title: "Verify input validations prevent negative price values",
                type: "api",
                precondition: "Người dùng đã được xác thực quyền Admin.",
                steps: [
                  "Gọi POST /api/core/pricing-rules với payload chứa lostCardFee: -50000 hoặc hourlyRate: -100."
                ],
                expectedResult: "HTTP 400 Bad Request kèm mã lỗi chi tiết LOST_CARD_FEE_MUST_BE_POSITIVE hoặc HOURLY_RATE_MUST_BE_POSITIVE.",
                status: "not_started"
              }
            ],
            doneCriteria: [
              { id: "dc-price-contract", content: "API contract is documented in this node.", checked: true },
              { id: "dc-price-clients", content: "Required clients/roles (Admin, Manager) are assigned and validated via Integration Tests.", checked: true },
              { id: "dc-price-rules", content: "Business rules (e.g., maximum one active rule per vehicle type) are enforced at the DB/Service level.", checked: true },
              { id: "dc-price-resp", content: "Success response matches the global common API response standard.", checked: true },
              { id: "dc-price-tests", content: "At least three critical test cases (CRUD validation, role restriction, active constraints) are passed.", checked: true },
              { id: "dc-price-patch-rate", content: "Dynamic patching for ReservationHourlyPrice is fully supported.", checked: true },
              { id: "dc-price-required-fields", content: "LostCardFee and MonthlyPrice fields are strictly required and implemented in the DB schema.", checked: true },
              { id: "dc-price-audit", content: "Mutating actions write accurate trail entries into the Audit Schema.", checked: true }
            ],
            notes: "Before coding:\nInspect the existing .NET Core API project structure. Ensure standard Clean Architecture patterns (Domain, Application, Infrastructure, WebAPI) are followed.\nDefine the PricingRule Domain Entity with appropriate database mapping constraints using Entity Framework Core Fluent API.\nUtilize Entity Framework Transactions to update existing active rules to inactive when a new active rule is activated, preventing concurrency issues.\nImplement generic or custom Audit Behavior in DB Context or Application Layer to automatically capture who modified the rule and when.\nCheck existing test suites and add newly specified endpoint tests.\nRun all relevant tests to confirm zero regressions.\nReport changed files, verification results, and potential database migration risks."
          },
          {
            id: "leaf-price-public",
            title: "Public Pricing",
            type: "leaf_feature",
            clients: ["Guest", "Driver"],
            endpoints: ["GET /api/public/pricing"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/public/pricing"),
            testCases: defaultApiTests("Public Pricing", ["Guest"], ["GET /api/public/pricing"]),
            doneCriteria: defaultDoneCriteria("Public Pricing")
          }
        ]
      },

      // 11. Monthly Pass
      {
        id: "cat-monthly-pass",
        title: "Monthly Pass",
        type: "category",
        summary: "Management of registered commuters parking subscriptions.",
        businessRules: [
          "Monthly pass validity depends on plate number, vehicle type, active status, and valid time range.",
          "Renewal must extend or recreate a valid pass period.",
          "Monthly pass exit must not charge casual parking fee if the pass is valid."
        ],
        children: [
          {
            id: "leaf-mp-app-review",
            title: "Monthly Pass Application Review",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: [
              "GET /api/core/monthly-passes/applications",
              "PATCH /api/core/monthly-passes/applications/{id}/status"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/monthly-passes/applications"),
            testCases: defaultApiTests("Monthly Pass Application Review", ["Manager"], ["GET /api/core/monthly-passes/applications"]),
            doneCriteria: defaultDoneCriteria("Monthly Pass Application Review")
          },
          {
            id: "leaf-mp-card-manage",
            title: "Monthly Pass Card Management",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: [
              "GET /api/core/monthly-passes",
              "POST /api/core/monthly-passes",
              "PUT /api/core/monthly-passes/{id}",
              "PATCH /api/core/monthly-passes/{id}/status"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/monthly-passes"),
            testCases: defaultApiTests("Monthly Pass Card Management", ["Manager"], ["GET /api/core/monthly-passes"]),
            doneCriteria: [
              ...defaultDoneCriteria("Monthly Pass Card Management"),
              { id: "dc-mp-validity", content: "Card scans check monthly pass validity instantly.", checked: false }
            ]
          },
          {
            id: "leaf-mp-renew",
            title: "Renew Monthly Pass",
            type: "leaf_feature",
            clients: ["Driver", "Staff"],
            endpoints: ["POST /api/core/monthly-passes/{id}/renew"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/monthly-passes/{id}/renew"),
            testCases: defaultApiTests("Renew Monthly Pass", ["Driver"], ["POST /api/core/monthly-passes/{id}/renew"]),
            doneCriteria: defaultDoneCriteria("Renew Monthly Pass")
          }
        ]
      },

      // 12. Lost Card & Incidents
      {
        id: "cat-incidents",
        title: "Lost Card & Incidents",
        type: "category",
        summary: "Incidents manual handling and document storage for lost cards.",
        children: [
          {
            id: "leaf-inc-lost-card",
            title: "Lost Card Claim Management",
            type: "leaf_feature",
            clients: ["Staff", "Manager"],
            endpoints: [
              "POST /api/core/lost-cards/{caseId}/documents",
              "POST /api/core/lost-cards/{caseId}/documents/batch",
              "GET /api/core/lost-cards/{caseId}/documents",
              "DELETE /api/core/lost-cards/{caseId}/documents/{documentId}"
            ],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("POST /api/core/lost-cards/{caseId}/documents"),
            testCases: defaultApiTests("Lost Card Claim Management", ["Staff"], ["GET /api/core/lost-cards/{caseId}/documents"]),
            doneCriteria: [
              ...defaultDoneCriteria("Lost Card Claim Management"),
              { id: "dc-lost-docs", content: "Lost card documentation and replacement fee details are managed securely.", checked: false }
            ]
          },
          {
            id: "leaf-inc-mismatch",
            title: "Plate Mismatch Case",
            type: "leaf_feature",
            clients: ["Staff"],
            endpoints: [],
            ownerService: ".NET Core API",
            testCases: defaultApiTests("Plate Mismatch Case", ["Staff"], []),
            doneCriteria: defaultDoneCriteria("Plate Mismatch Case")
          },
          {
            id: "leaf-inc-override",
            title: "Manual Staff Override",
            type: "leaf_feature",
            clients: ["Staff", "Manager"],
            endpoints: [],
            ownerService: ".NET Core API",
            testCases: defaultApiTests("Manual Staff Override", ["Staff"], []),
            doneCriteria: defaultDoneCriteria("Manual Staff Override")
          }
        ]
      },

      // 13. Reporting & Dashboard
      {
        id: "cat-reports",
        title: "Reporting & Dashboard",
        type: "category",
        summary: "Analytics and operational oversight for managers.",
        children: [
          {
            id: "leaf-rep-dashboard",
            title: "Support Dashboard",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: ["GET /api/support/dashboard"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/dashboard"),
            testCases: defaultApiTests("Support Dashboard", ["Manager"], ["GET /api/support/dashboard"]),
            doneCriteria: defaultDoneCriteria("Support Dashboard")
          },
          {
            id: "leaf-rep-revenue",
            title: "Revenue Report",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: ["GET /api/support/reports/revenue"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/reports/revenue"),
            testCases: defaultApiTests("Revenue Report", ["Manager"], ["GET /api/support/reports/revenue"]),
            doneCriteria: defaultDoneCriteria("Revenue Report")
          },
          {
            id: "leaf-rep-traffic",
            title: "Traffic Report",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: ["GET /api/support/reports/traffic"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/reports/traffic"),
            testCases: defaultApiTests("Traffic Report", ["Manager"], ["GET /api/support/reports/traffic"]),
            doneCriteria: defaultDoneCriteria("Traffic Report")
          },
          {
            id: "leaf-rep-occupancy",
            title: "Occupancy Report",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: ["GET /api/support/reports/occupancy"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/reports/occupancy"),
            testCases: defaultApiTests("Occupancy Report", ["Manager"], ["GET /api/support/reports/occupancy"]),
            doneCriteria: defaultDoneCriteria("Occupancy Report")
          },
          {
            id: "leaf-rep-card",
            title: "Card Session Report",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: ["GET /api/support/reports/card-session"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/reports/card-session"),
            testCases: defaultApiTests("Card Session Report", ["Manager"], ["GET /api/support/reports/card-session"]),
            doneCriteria: defaultDoneCriteria("Card Session Report")
          },
          {
            id: "leaf-rep-export",
            title: "Generic Report Export",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: ["GET /api/support/reports/export"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/reports/export"),
            testCases: defaultApiTests("Generic Report Export", ["Manager"], ["GET /api/support/reports/export"]),
            doneCriteria: defaultDoneCriteria("Generic Report Export")
          },
          {
            id: "leaf-rep-audit",
            title: "Audit Log Export",
            type: "leaf_feature",
            clients: ["Admin"],
            endpoints: ["GET /api/audit-logs/export"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/audit-logs/export"),
            testCases: defaultApiTests("Audit Log Export", ["Admin"], ["GET /api/audit-logs/export"]),
            doneCriteria: defaultDoneCriteria("Audit Log Export")
          }
        ]
      },

      // 14. Public APIs
      {
        id: "cat-public",
        title: "Public APIs",
        type: "category",
        summary: "Read-only datasets readable without credentials.",
        businessRules: [
          "Public APIs must not expose private user/session/payment details.",
          "Public parking information, pricing, rules, and available slots should be readable without login."
        ],
        children: [
          {
            id: "leaf-pub-info",
            title: "Parking Info",
            type: "leaf_feature",
            status: "draft",
            priority: "medium",
            clients: ["Guest", "Driver"],
            endpoints: ["GET /api/public/parking-info"],
            ownerService: "Spring Boot Support API",
            objective: "No objective documented.",
            inScope: [
              "Implement the core logic and requirements of this feature."
            ],
            outOfScope: [
              "External system integrations not specified in this document."
            ],
            permissions: [
              { role: "Guest", permission: "Authorized to access this feature." },
              { role: "Driver", permission: "Authorized to access this feature." }
            ],
            businessRules: [
              "The system manages parking building operations for public guests, drivers, staff, managers, and admins.",
              "The backend is split into .NET Core API for transactional/write operations and Spring Boot Support API for support/read/report/public operations.",
              "All APIs should return a consistent success/error response format.",
              "Authenticated APIs must validate JWT and role permissions.",
              "Both backend services access a shared PostgreSQL database, maintaining strict entity ownership.",
              "Global error handling middleware must prevent internal stack traces from leaking to clients.",
              "A request logging system must log all incoming API requests for security tracing.",
              "All manager/admin mutating operations must be logged to a dedicated audit schema.",
              "Public APIs must not expose private user/session/payment details.",
              "Public parking information, pricing, rules, and available slots should be readable without login."
            ],
            dbExistingTables: [
              "Reuse existing tables where applicable."
            ],
            dbNewTablesSql: "-- No new database schema defined.",
            dbRelationships: [
              "None specified."
            ],
            validationRules: [
              { field: "Request", rule: "Standard request validation is expected.", errorMessage: "" }
            ],
            apiContracts: createApiContract("GET /api/public/parking-info"),
            securityRules: [
              "Validate role permissions.",
              "Prevent unauthorized access.",
              "Do not log sensitive data."
            ],
            logEvents: [
              "Log request access, inputs, duration, and response code."
            ],
            noLogEvents: [
              "Passwords, access tokens, refresh tokens, and credit card details."
            ],
            integrationPoints: [
              { system: "None", responsibility: "No external integration points specified." }
            ],
            uiPage: "No frontend behavior specified.",
            testCases: defaultApiTests("Parking Info", ["Guest"], ["GET /api/public/parking-info"]),
            doneCriteria: defaultDoneCriteria("Parking Info")
          },
          {
            id: "leaf-pub-price",
            title: "Public Pricing",
            type: "leaf_feature",
            clients: ["Guest", "Driver"],
            endpoints: ["GET /api/public/pricing"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/public/pricing"),
            testCases: defaultApiTests("Public Pricing", ["Guest"], ["GET /api/public/pricing"]),
            doneCriteria: defaultDoneCriteria("Public Pricing")
          },
          {
            id: "leaf-pub-rules",
            title: "Public Rules",
            type: "leaf_feature",
            clients: ["Guest", "Driver"],
            endpoints: ["GET /api/public/rules"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/public/rules"),
            testCases: defaultApiTests("Public Rules", ["Guest"], ["GET /api/public/rules"]),
            doneCriteria: defaultDoneCriteria("Public Rules")
          },
          {
            id: "leaf-pub-avail",
            title: "Public Available Slots",
            type: "leaf_feature",
            clients: ["Guest", "Driver"],
            endpoints: ["GET /api/public/available-slots"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/public/available-slots"),
            testCases: defaultApiTests("Public Available Slots", ["Guest"], ["GET /api/public/available-slots"]),
            doneCriteria: defaultDoneCriteria("Public Available Slots")
          }
        ]
      },

      // 15. Feedback
      {
        id: "cat-feedback",
        title: "Feedback",
        type: "category",
        summary: "Driver reviews, suggestion submissions and backoffice management lists.",
        businessRules: [
          "Public/Driver users can submit feedback.",
          "Manager/Admin can list, view, and update feedback status.",
          "Feedback status updates should record manager/admin response details."
        ],
        children: [
          {
            id: "leaf-feed-submit",
            title: "Submit Feedback",
            type: "leaf_feature",
            clients: ["Guest", "Driver"],
            endpoints: ["POST /api/support/feedbacks"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("POST /api/support/feedbacks"),
            testCases: defaultApiTests("Submit Feedback", ["Driver"], ["POST /api/support/feedbacks"]),
            doneCriteria: defaultDoneCriteria("Submit Feedback")
          },
          {
            id: "leaf-feed-list",
            title: "Feedback Management List",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: ["GET /api/admin/feedbacks"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/admin/feedbacks"),
            testCases: defaultApiTests("Feedback Management List", ["Manager"], ["GET /api/admin/feedbacks"]),
            doneCriteria: defaultDoneCriteria("Feedback Management List")
          },
          {
            id: "leaf-feed-detail",
            title: "Feedback Detail",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: ["GET /api/admin/feedbacks/{id}"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/admin/feedbacks/{id}"),
            testCases: defaultApiTests("Feedback Detail", ["Manager"], ["GET /api/admin/feedbacks/{id}"]),
            doneCriteria: defaultDoneCriteria("Feedback Detail")
          },
          {
            id: "leaf-feed-update",
            title: "Feedback Status Update",
            type: "leaf_feature",
            clients: ["Manager", "Admin"],
            endpoints: ["PUT /api/admin/feedbacks/{id}"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("PUT /api/admin/feedbacks/{id}"),
            testCases: defaultApiTests("Feedback Status Update", ["Manager"], ["PUT /api/admin/feedbacks/{id}"]),
            doneCriteria: defaultDoneCriteria("Feedback Status Update")
          }
        ]
      },

      // 16. Notification
      {
        id: "cat-notification",
        title: "Notification",
        type: "category",
        summary: "Real-time SSE or long-poll alert push feeds for operators and drivers.",
        children: [
          {
            id: "leaf-notif-user",
            title: "User Notifications",
            type: "leaf_feature",
            clients: ["Driver", "Staff", "Manager", "Admin"],
            endpoints: ["GET /api/notifications/{userId}"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/notifications/{userId}"),
            testCases: defaultApiTests("User Notifications", ["Driver"], ["GET /api/notifications/{userId}"]),
            doneCriteria: defaultDoneCriteria("User Notifications")
          },
          {
            id: "leaf-notif-unread",
            title: "Unread Notifications",
            type: "leaf_feature",
            clients: ["Driver", "Staff", "Manager", "Admin"],
            endpoints: ["GET /api/notifications/{userId}/unread"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/notifications/{userId}/unread"),
            testCases: defaultApiTests("Unread Notifications", ["Driver"], ["GET /api/notifications/{userId}/unread"]),
            doneCriteria: defaultDoneCriteria("Unread Notifications")
          },
          {
            id: "leaf-notif-read",
            title: "Mark Notification as Read",
            type: "leaf_feature",
            clients: ["Driver", "Staff", "Manager", "Admin"],
            endpoints: ["PATCH /api/notifications/{id}/read"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("PATCH /api/notifications/{id}/read"),
            testCases: defaultApiTests("Mark Notification as Read", ["Driver"], ["PATCH /api/notifications/{id}/read"]),
            doneCriteria: defaultDoneCriteria("Mark Notification as Read")
          }
        ]
      },

      // 17. Mock Devices
      {
        id: "cat-mock-devices",
        title: "Mock Devices",
        type: "category",
        summary: "Hardware sensors mock simulation endpoints.",
        businessRules: [
          "Mock devices simulate camera, RFID, and barrier events only.",
          "Mock camera/RFID/barrier must not bypass the real entry/exit business rules."
        ],
        children: [
          {
            id: "leaf-mock-camera",
            title: "Mock Camera Scan",
            type: "leaf_feature",
            clients: ["Staff", "Manager", "Admin"],
            endpoints: ["POST /api/mock/camera/scan"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("POST /api/mock/camera/scan"),
            testCases: defaultApiTests("Mock Camera Scan", ["Staff"], ["POST /api/mock/camera/scan"]),
            doneCriteria: defaultDoneCriteria("Mock Camera Scan")
          },
          {
            id: "leaf-mock-rfid",
            title: "Mock RFID Scan",
            type: "leaf_feature",
            clients: ["Staff", "Manager", "Admin"],
            endpoints: ["POST /api/mock/rfid/scan"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("POST /api/mock/rfid/scan"),
            testCases: defaultApiTests("Mock RFID Scan", ["Staff"], ["POST /api/mock/rfid/scan"]),
            doneCriteria: defaultDoneCriteria("Mock RFID Scan")
          },
          {
            id: "leaf-mock-barrier",
            title: "Mock Barrier Control",
            type: "leaf_feature",
            clients: ["Staff", "Manager", "Admin"],
            endpoints: ["POST /api/mock/barrier/control"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("POST /api/mock/barrier/control"),
            testCases: defaultApiTests("Mock Barrier Control", ["Staff"], ["POST /api/mock/barrier/control"]),
            doneCriteria: defaultDoneCriteria("Mock Barrier Control")
          }
        ]
      },

      // 18. Health & Diagnostics
      {
        id: "cat-diagnostics",
        title: "Health & Diagnostics",
        type: "category",
        summary: "System logs check, DB sync, and debugging routines.",
        children: [
          {
            id: "leaf-diag-core-health",
            title: "Core Health Check",
            type: "leaf_feature",
            clients: ["Admin", "System"],
            endpoints: ["GET /api/core/health"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/health"),
            testCases: defaultApiTests("Core Health Check", ["Admin"], ["GET /api/core/health"]),
            doneCriteria: defaultDoneCriteria("Core Health Check")
          },
          {
            id: "leaf-diag-support-health",
            title: "Support Health Check",
            type: "leaf_feature",
            clients: ["Admin", "System"],
            endpoints: ["GET /api/support/health"],
            ownerService: "Spring Boot Support API",
            apiContracts: createApiContract("GET /api/support/health"),
            testCases: defaultApiTests("Support Health Check", ["Admin"], ["GET /api/support/health"]),
            doneCriteria: defaultDoneCriteria("Support Health Check")
          },
          {
            id: "leaf-diag-db-check",
            title: "Database Check",
            type: "leaf_feature",
            clients: ["Admin", "System"],
            endpoints: ["GET /api/core/db-check"],
            ownerService: ".NET Core API",
            apiContracts: createApiContract("GET /api/core/db-check"),
            testCases: defaultApiTests("Database Check", ["Admin"], ["GET /api/core/db-check"]),
            doneCriteria: defaultDoneCriteria("Database Check")
          },
          { id: "leaf-diag-res-dump", title: "Reservation Debug Dump", type: "leaf_feature", clients: ["Admin"], endpoints: [], ownerService: "System", testCases: defaultApiTests("Reservation Debug Dump", ["Admin"], []), doneCriteria: defaultDoneCriteria("Reservation Debug Dump") },
          { id: "leaf-diag-sess-dump", title: "Session Debug Dump", type: "leaf_feature", clients: ["Admin"], endpoints: [], ownerService: "System", testCases: defaultApiTests("Session Debug Dump", ["Admin"], []), doneCriteria: defaultDoneCriteria("Session Debug Dump") },
          { id: "leaf-diag-clear-res", title: "Clear Reservations Debug", type: "leaf_feature", clients: ["Admin"], endpoints: [], ownerService: "System", testCases: defaultApiTests("Clear Reservations Debug", ["Admin"], []), doneCriteria: defaultDoneCriteria("Clear Reservations Debug") },
          { id: "leaf-diag-migrate", title: "Migrate Database Debug", type: "leaf_feature", clients: ["Admin"], endpoints: [], ownerService: "System", testCases: defaultApiTests("Migrate Database Debug", ["Admin"], []), doneCriteria: defaultDoneCriteria("Migrate Database Debug") },
          { id: "leaf-diag-expire-res", title: "Expire Reservation Debug", type: "leaf_feature", clients: ["Admin"], endpoints: [], ownerService: "System", testCases: defaultApiTests("Expire Reservation Debug", ["Admin"], []), doneCriteria: defaultDoneCriteria("Expire Reservation Debug") },
          { id: "leaf-diag-expire-pay", title: "Expire Payment Deadline Debug", type: "leaf_feature", clients: ["Admin"], endpoints: [], ownerService: "System", testCases: defaultApiTests("Expire Payment Deadline Debug", ["Admin"], []), doneCriteria: defaultDoneCriteria("Expire Payment Deadline Debug") }
        ]
      }
    ]
  };

  const rootNode = migrateParkingTaxonomy(createSeedNode(seedInput, null, 0));
  enrichNodeWithTags(rootNode);
  return [rootNode];
}

function enrichNodeWithTags(node: FeatureNode) {
  if (!node.tags) {
    node.tags = [];
  }

  if (node.id === "root-parking-system") {
    node.tags = uniqueTags(node.tags, ["system", "parking", "core"]);
  } else if (node.id.startsWith("cat-")) {
    const categoryTags: Record<string, string[]> = {
      "cat-authentication": ["auth", "security"],
      "cat-access-control": ["auth", "rbac", "security"],
      "cat-user-driver": ["user", "driver"],
      "cat-structure": ["structure", "inventory"],
      "cat-cards": ["cards", "membership"],
      "cat-reservation": ["booking", "reservation"],
      "cat-session": ["session", "gate"],
      "cat-payment": ["payment", "billing", "finance"],
      "cat-pricing": ["pricing", "billing"],
      "cat-monthly-pass": ["cards", "monthly-pass"],
      "cat-incidents": ["incidents", "support"],
      "cat-reports": ["reports", "dashboard", "manager"],
      "cat-public": ["public", "info"],
      "cat-feedback": ["feedback", "support"],
      "cat-notification": ["notification", "alerts"],
      "cat-mock-devices": ["devices", "mock"],
      "cat-diagnostics": ["diagnostics", "admin"]
    };
    const key = node.id;
    if (categoryTags[key]) {
      node.tags = uniqueTags(node.tags, categoryTags[key]);
    }
  } else if (node.id.startsWith("leaf-")) {
    const localTags: string[] = [];
    const idLower = node.id.toLowerCase();
    const titleLower = node.title.toLowerCase();

    if (idLower.includes("login") || titleLower.includes("login")) localTags.push("jwt", "api");
    if (idLower.includes("logout") || titleLower.includes("logout") || idLower.includes("refresh") || titleLower.includes("refresh") || idLower.includes("session") || titleLower.includes("session")) localTags.push("api");
    if (idLower.includes("payos") || titleLower.includes("payos")) localTags.push("payos", "webhook");
    if (idLower.includes("stripe") || titleLower.includes("stripe")) localTags.push("stripe");
    if (idLower.includes("crud") || titleLower.includes("crud") || idLower.includes("manage") || titleLower.includes("manage")) localTags.push("crud");
    if (idLower.includes("report") || idLower.includes("export") || titleLower.includes("export") || titleLower.includes("report")) localTags.push("excel", "pdf");
    if (idLower.includes("device") || idLower.includes("gate") || idLower.includes("barrier") || titleLower.includes("gate") || titleLower.includes("device") || titleLower.includes("barrier")) localTags.push("hardware", "iot");
    if (idLower.includes("cron") || idLower.includes("worker") || titleLower.includes("cron") || titleLower.includes("worker")) localTags.push("cron", "job");
    if (idLower.includes("health") || idLower.includes("diag") || titleLower.includes("health") || titleLower.includes("diag")) localTags.push("diagnostics");

    node.tags = uniqueTags(node.tags, localTags);
  }

  if (node.children) {
    node.children.forEach(enrichNodeWithTags);
  }
}

function uniqueTags(...groups: string[][]): string[] {
  return [...new Set(groups.flat().map(tag => tag.trim().toLowerCase()).filter(Boolean))];
}

export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
`````

### `src/seed/parkingTaxonomyMigration.ts`

`````typescript
import type {
  ContractField,
  DoneCriterion,
  FeatureNode,
  FeatureNodeType,
  TestCase,
} from "../domain/featureNode.types";

type NestedItem = ContractField | DoneCriterion | TestCase;

function emptyNode(id: string, title: string, type: FeatureNodeType, summary: string): FeatureNode {
  const now = new Date().toISOString();
  return {
    id,
    parentId: null,
    title,
    type,
    clients: [],
    status: "draft",
    priority: "medium",
    tags: [],
    summary,
    businessRules: [],
    apiContracts: [],
    uiContracts: [],
    dataContracts: [],
    testCases: [],
    doneCriteria: [],
    dependencies: [],
    risks: [],
    notes: "",
    createdAt: now,
    updatedAt: now,
    order: 0,
    children: [],
  };
}

function walk(root: FeatureNode): FeatureNode[] {
  return [root, ...(root.children || []).flatMap(walk)];
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function mergeNested<T extends NestedItem>(target: T[], source: T[], sourceNodeId: string): T[] {
  const result = [...target];
  for (const item of source) {
    const sameId = result.find(existing => existing.id === item.id);
    if (!sameId) {
      result.push(item);
    } else if (JSON.stringify(sameId) !== JSON.stringify(item)) {
      result.push({ ...item, id: `${sourceNodeId}-${item.id}` });
    }
  }
  return result;
}

function mergeNodeContent(target: FeatureNode, source: FeatureNode): void {
  target.clients = unique([...target.clients, ...source.clients]);
  target.tags = unique([...target.tags, ...source.tags]);
  target.businessRules = unique([...target.businessRules, ...source.businessRules]);
  target.dependencies = unique([...target.dependencies, ...source.dependencies]);
  target.risks = unique([...target.risks, ...source.risks]);
  target.apiContracts = mergeNested(target.apiContracts, source.apiContracts, source.id);
  target.uiContracts = mergeNested(target.uiContracts, source.uiContracts, source.id);
  target.dataContracts = mergeNested(target.dataContracts, source.dataContracts, source.id);
  target.testCases = mergeNested(target.testCases, source.testCases, source.id);
  target.doneCriteria = mergeNested(target.doneCriteria, source.doneCriteria, source.id);
  target.summary ||= source.summary;
  target.notes = unique([target.notes, source.notes]).join("\n\n");
  target.metadata = {
    ...source.metadata,
    ...target.metadata,
    endpoints: unique([...(target.metadata?.endpoints || []), ...(source.metadata?.endpoints || [])]),
    sourceFiles: unique([...(target.metadata?.sourceFiles || []), ...(source.metadata?.sourceFiles || [])]),
    consumerServices: unique([...(target.metadata?.consumerServices || []), ...(source.metadata?.consumerServices || [])]),
  };
}

function normalizeTree(root: FeatureNode): void {
  const roleNames = ["Admin", "Manager", "Staff", "Driver", "Guest", "System"];
  const normalizeRole = (role: string) => {
    const normalized = roleNames.find(candidate => candidate.toLowerCase() === role.trim().toLowerCase());
    return normalized || role;
  };

  const nestedIds = new Set<string>();
  const visit = (node: FeatureNode, parentId: string | null, order: number) => {
    node.parentId = parentId;
    node.order = order;
    node.clients = unique(node.clients.map(normalizeRole));
    if (node.permissions) {
      node.permissions = node.permissions.map(permission => ({
        ...permission,
        role: normalizeRole(permission.role),
      }));
    }

    for (const key of ["testCases", "doneCriteria", "apiContracts", "uiContracts", "dataContracts"] as const) {
      node[key] = node[key].map(item => {
        const scoped = `${key}:${item.id}`;
        if (!nestedIds.has(scoped)) {
          nestedIds.add(scoped);
          return item;
        }
        let nextId = `${node.id}-${item.id}`;
        let suffix = 2;
        while (nestedIds.has(`${key}:${nextId}`)) nextId = `${node.id}-${item.id}-${suffix++}`;
        nestedIds.add(`${key}:${nextId}`);
        return { ...item, id: nextId };
      }) as never;
    }

    (node.children || []).forEach((child, index) => visit(child, node.id, index));
  };
  visit(root, null, 0);
  root.metadata = { ...root.metadata, roles: roleNames };
}

function splitAuthentication(node: FeatureNode): void {
  node.type = "feature";
  node.title = "Authentication & Session Management";
  node.summary = "Unified authentication system managing logins, identity profiles, token rotations, and secure sign-outs.";
  node.objective = "Provide a secure, centralized authentication and session management layer across .NET Core API and Spring Boot Support API.";
  node.inScope = [
    "Centralized credential verification.",
    "Session and refresh token family management.",
    "Cross-backend JWT validation and account status enforcement.",
    "Token revocation and secure sign-out."
  ];
  node.outOfScope = [
    "User registration (handled under Driver Registration).",
    "Self-service password resets.",
    "Third-party identity providers."
  ];
  node.businessRules = [
    "Only active user accounts (not disabled, inactive, locked, or deleted) can authenticate or renew sessions.",
    "Refresh tokens are strictly single-use; reuse triggers family revocation.",
    "Sign-out terminates only the current session (multi-device support)."
  ];

  const definitions = [
    {
      id: "leaf-auth-login",
      title: "Sign In",
      match: /login/i,
      endpoint: /\/login$/i,
      objective: "Authenticate user credentials (username and password) to establish a secure session, returning an access token and a refresh token.",
      inScope: [
        "Validate login request format and size bounds.",
        "Normalize username (trim whitespace).",
        "Secure password verification.",
        "Verify account status (Active, Disabled, Inactive, Locked, Deleted).",
        "Create authentication session and token family atomically before token issuance.",
        "Issue JWT access token with required roles/claims.",
        "Generate cryptographically secure random refresh token and persist its hash.",
        "Audit logging for success and failure events (without credentials)."
      ],
      outOfScope: [
        "User registration or signup flow.",
        "Password reset or password change flow.",
        "Third-party OAuth identity providers.",
        "Session termination and token revocation (handled by Sign Out)."
      ],
      permissions: [
        { role: "Driver", permission: "Can login using valid driver credentials" },
        { role: "Staff", permission: "Can login using valid staff credentials" },
        { role: "Manager", permission: "Can login using valid manager credentials" },
        { role: "Admin", permission: "Can login using valid admin credentials" }
      ],
      dbExistingTables: ["users", "user_roles"],
      dbNewTablesSql: `-- Table for storing hashed refresh tokens
CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  token_hash text NOT NULL,
  token_family_id uuid NOT NULL,
  jwt_id varchar(255) null,
  expires_at timestamp not null,
  revoked_at timestamp null,
  replaced_by_token_hash text null,
  created_at timestamp not null,
  created_by_ip varchar(100) null,
  revoked_by_ip varchar(100) null,
  revocation_reason varchar(255) null
);

CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);`,
      dbRelationships: ["refresh_tokens(user_id) references users(id)"],
      validationRules: [
        { field: "username", rule: "Required, string, trim whitespace, max length 50", errorMessage: "Username is required." },
        { field: "password", rule: "Required, string, do not trim, max length 100", errorMessage: "Password is required." }
      ],
      securityRules: [
        "Never log raw passwords, access tokens, or refresh tokens.",
        "Store only the secure hash (SHA256) of the refresh token in the database.",
        "Implement login rate limiting (max 5 failed attempts per username/IP combination in 15 minutes).",
        "Use generic authentication failure response to prevent account enumeration.",
        "Require HTTPS for credential transmission and load JWT secrets from secure configuration."
      ],
      logEvents: [
        "Successful login events.",
        "Failed login attempts.",
        "Disabled, Inactive, Locked, or Deleted user login attempts.",
        "Rate limit triggered."
      ],
      noLogEvents: [
        "Raw passwords.",
        "Access tokens.",
        "Refresh tokens."
      ],
      uiPage: "/login",
      uiComponents: "LoginForm, Button, FormInput",
      uiStateLoading: "Show spinner overlay on the login card, disable the submit button and input fields to prevent double submission.",
      uiStateEmpty: "Not applicable for authentication screen.",
      uiStateError: "Display a warning banner/toast indicating validation fails or generic invalid credentials message.",
      uiStateSuccess: "Redirect the authenticated user to their default workspace/dashboard and display a welcome toast."
    },
    {
      id: "leaf-auth-profile",
      title: "Current User Profile",
      match: /auth-me|profile|get profile/i,
      endpoint: /\/me$/i,
      objective: "Retrieve current user identity profile using a valid Bearer access token.",
      inScope: [
        "Validate JWT access token signature, key, and expiration.",
        "Verify token/session has not been revoked or blacklisted.",
        "Look up user corresponding to token subject.",
        "Enforce current account status check (e.g. reject if disabled/deleted).",
        "Return minimal public identity profile data."
      ],
      outOfScope: [
        "Retrieving sensitive credential secrets or detailed domain-specific business profiles (e.g. driver details)."
      ],
      permissions: [
        { role: "Driver", permission: "Can get own identity profile using valid access token" },
        { role: "Staff", permission: "Can get own identity profile using valid access token" },
        { role: "Manager", permission: "Can get own identity profile using valid access token" },
        { role: "Admin", permission: "Can get own identity profile using valid access token" }
      ],
      dbExistingTables: ["users", "user_roles"],
      dbNewTablesSql: "",
      dbRelationships: [],
      validationRules: [
        { field: "Authorization", rule: "Required, Bearer token format", errorMessage: "Missing or malformed authorization header." }
      ],
      securityRules: [
        "Reject expired, revoked, or signature-invalid access tokens.",
        "Disabled or deleted users must lose API access immediately (checked on every profile request).",
        "Never return internal security stamps, password hashes, or internal database metadata."
      ],
      logEvents: [
        "Successful current user profile retrieval.",
        "Unauthorized profile access attempts."
      ],
      noLogEvents: [
        "Access tokens."
      ],
      uiPage: "/profile",
      uiComponents: "UserProfileCard, Avatar, RoleBadge",
      uiStateLoading: "Show skeleton loader components for profile information.",
      uiStateEmpty: "Not applicable.",
      uiStateError: "On 401/403, clear local authentication state and redirect to login page. On 5xx/network errors, display retry button without clearing session.",
      uiStateSuccess: "Render user profile details (username, full name, email, roles, status) in readonly view."
    },
    {
      id: "leaf-auth-refresh",
      title: "Refresh Access Token",
      match: /refresh/i,
      endpoint: /refresh-token$/i,
      objective: "Renew user session and issue a new access token using single-use refresh token rotation.",
      inScope: [
        "Securely hash and validate the incoming refresh token.",
        "Validate the associated session and token family status.",
        "Check refresh token expiration and revocation status.",
        "Atomically mark the used refresh token as consumed.",
        "Issue a replacement refresh token and a new access token in a single atomic transaction.",
        "Detect token reuse anomalies and revoke the entire token family."
      ],
      outOfScope: [
        "Interactive re-authentication with username and password."
      ],
      permissions: [
        { role: "Guest", permission: "Can access the refresh token endpoint anonymously without access token" }
      ],
      dbExistingTables: ["refresh_tokens"],
      dbNewTablesSql: "",
      dbRelationships: ["refresh_tokens(user_id) references users(id)"],
      validationRules: [
        { field: "refreshToken", rule: "Required, non-empty, valid token string", errorMessage: "Refresh token is required." }
      ],
      securityRules: [
        "Perform token consume-and-replace in a single atomic transaction to prevent race conditions.",
        "Automatic reuse detection: if a refresh token is reused, revoke the entire token family (session) immediately.",
        "Enforce account status check: reject refresh if user has been disabled, locked, or deleted."
      ],
      logEvents: [
        "Successful token refresh.",
        "Invalid refresh attempt (expired, malformed).",
        "Refresh token reuse anomaly detection and family revocation."
      ],
      noLogEvents: [
        "Raw refresh tokens.",
        "New access tokens."
      ],
      uiPage: "Background process (no dedicated page)",
      uiComponents: "HTTP Client interceptors / Axios interceptors",
      uiStateLoading: "Manage token refresh transparently in the background, queuing concurrent API requests.",
      uiStateEmpty: "Not applicable.",
      uiStateError: "On refresh failure (401/403), clear authentication state, show session expired message, and redirect to login.",
      uiStateSuccess: "Silently retry the original failed API request with the new access token."
    },
    {
      id: "leaf-auth-logout",
      title: "Sign Out",
      match: /logout/i,
      endpoint: /\/logout$/i,
      objective: "Terminate the current session, revoke the active refresh token family, and blacklist the active access token.",
      inScope: [
        "Identify the current session ID from the access token claims (jti/session ID).",
        "Revoke the associated session and token family in the database.",
        "Add the current access token identifier to the revocation blacklist table.",
        "Clear all frontend authentication state, stored tokens, and redirect user to login."
      ],
      outOfScope: [
        "Global logout from all other devices or active sessions (managed under a separate feature)."
      ],
      permissions: [
        { role: "Driver", permission: "Can logout own active session" },
        { role: "Staff", permission: "Can logout own active session" },
        { role: "Manager", permission: "Can logout own active session" },
        { role: "Admin", permission: "Can logout own active session" }
      ],
      dbExistingTables: ["refresh_tokens"],
      dbNewTablesSql: `-- Table for storing revoked access tokens (blacklist)
CREATE TABLE revoked_access_tokens (
  id uuid PRIMARY KEY,
  jwt_id varchar(255) UNIQUE NOT NULL,
  user_id uuid NOT NULL,
  expires_at timestamp NOT NULL,
  revoked_at timestamp NOT NULL,
  reason varchar(255) NULL
);`,
      dbRelationships: [],
      validationRules: [
        { field: "Authorization", rule: "Required, Bearer token format", errorMessage: "Bearer token is required to identify the session." }
      ],
      securityRules: [
        "Ensure access token revocation propagates to all backend services (e.g. via shared blacklist or token version check).",
        "Atomically revoke current session. Subsequent refresh requests using tokens from this family must be rejected."
      ],
      logEvents: [
        "Successful logout and session revocation.",
        "Logout failure events."
      ],
      noLogEvents: [
        "Access tokens."
      ],
      uiPage: "None (action triggered from header/settings)",
      uiComponents: "LogoutButton, NavigationHeader",
      uiStateLoading: "Disable interaction on the logout trigger, show loading spinner, clear storage, and redirect.",
      uiStateEmpty: "Not applicable.",
      uiStateError: "Frontend must treat logout as idempotent: even if backend fails, clear client storage and redirect to login.",
      uiStateSuccess: "Redirect to login page and display logout confirmation message."
    }
  ];

  node.children = definitions.map(definition => {
    const child = emptyNode(definition.id, definition.title, "leaf_feature", `${definition.title} authentication flow.`);
    child.clients = [...node.clients];
    child.status = node.status;
    child.priority = node.priority;
    child.tags = [...node.tags];
    child.metadata = {
      ownerService: node.metadata?.ownerService,
      consumerServices: node.metadata?.consumerServices,
      endpoints: (node.metadata?.endpoints || []).filter(endpoint => definition.endpoint.test(endpoint)),
      sourceFiles: node.metadata?.sourceFiles,
    };
    child.objective = definition.objective;
    child.inScope = definition.inScope;
    child.outOfScope = definition.outOfScope;
    child.permissions = definition.permissions;
    child.dbExistingTables = definition.dbExistingTables;
    child.dbNewTablesSql = definition.dbNewTablesSql;
    child.dbRelationships = definition.dbRelationships;
    child.validationRules = definition.validationRules;
    child.securityRules = definition.securityRules;
    child.logEvents = definition.logEvents;
    child.noLogEvents = definition.noLogEvents;
    child.uiPage = definition.uiPage;
    child.uiComponents = definition.uiComponents;
    child.uiStateLoading = definition.uiStateLoading;
    child.uiStateEmpty = definition.uiStateEmpty;
    child.uiStateError = definition.uiStateError;
    child.uiStateSuccess = definition.uiStateSuccess;

    child.apiContracts = node.apiContracts.filter(item => definition.match.test(`${item.id} ${item.name}`));
    child.testCases = node.testCases.filter(item => definition.match.test(`${item.id} ${item.title}`));
    child.doneCriteria = node.doneCriteria.filter(item => definition.match.test(`${item.id} ${item.content}`));
    return child;
  });

  const assigned = <T extends { id: string }>(items: T[], groups: T[][]) => {
    const ids = new Set(groups.flat().map(item => item.id));
    return items.filter(item => !ids.has(item.id));
  };
  node.apiContracts = assigned(node.apiContracts, node.children.map(child => child.apiContracts));
  node.testCases = assigned(node.testCases, node.children.map(child => child.testCases));
  node.doneCriteria = assigned(node.doneCriteria, node.children.map(child => child.doneCriteria));
  node.metadata = { ...node.metadata, endpoints: [] };
  node.uiPage = undefined;
  node.uiComponents = undefined;
  node.uiStateLoading = undefined;
  node.uiStateEmpty = undefined;
  node.uiStateError = undefined;
  node.uiStateSuccess = undefined;
}

/**
 * Converts the original endpoint-oriented parking seed into a stable capability taxonomy.
 * Existing feature payloads are moved rather than recreated, so contracts and sample data survive.
 */
export function migrateParkingTaxonomy(root: FeatureNode): FeatureNode {
  const byId = () => new Map(walk(root).map(node => [node.id, node]));
  const get = (id: string) => {
    const node = byId().get(id);
    if (!node) throw new Error(`Parking taxonomy migration cannot find ${id}`);
    return node;
  };
  const detach = (id: string) => {
    const node = get(id);
    const parent = node.parentId ? get(node.parentId) : null;
    if (parent) parent.children = (parent.children || []).filter(child => child.id !== id);
    return node;
  };
  const attach = (parentId: string, child: FeatureNode) => {
    const parent = get(parentId);
    parent.children = [...(parent.children || []), child];
  };
  const group = (parentId: string, id: string, title: string, summary: string) => {
    const node = emptyNode(id, title, "feature", summary);
    attach(parentId, node);
    return node;
  };
  const moveMany = (parentId: string, ids: string[]) => ids.forEach(id => attach(parentId, detach(id)));
  const convertAndMove = (id: string, parentId: string, title: string) => {
    const node = detach(id);
    node.type = "feature";
    node.title = title;
    attach(parentId, node);
  };
  const mergeAndRemove = (targetId: string, sourceId: string) => {
    const target = get(targetId);
    const source = detach(sourceId);
    mergeNodeContent(target, source);
  };

  splitAuthentication(get("leaf-auth-session"));
  get("leaf-auth-register").title = "Driver Registration";

  const users = get("cat-user-driver");
  users.title = "Users & Drivers";
  const userManagement = get("cat-user-management");
  userManagement.type = "feature";
  userManagement.title = "User Account Management";
  group(users.id, "feat-driver-self-service", "Driver Self-Service", "Driver-owned vehicle, history, and pass application capabilities.");
  moveMany("feat-driver-self-service", ["leaf-driver-vehicles-list", "leaf-driver-vehicle-history"]);

  const parkingConfiguration = emptyNode("cat-parking-configuration", "Parking Configuration", "category", "Vehicle, facility, slot, gate, and access-card configuration.");
  attach(root.id, parkingConfiguration);
  convertAndMove("cat-vehicle-config", parkingConfiguration.id, "Vehicle Type Configuration");
  convertAndMove("cat-structure", parkingConfiguration.id, "Facility Structure Management");
  convertAndMove("cat-cards", parkingConfiguration.id, "Access Card Management");

  get("cat-reservation").title = "Reservations";
  group("cat-reservation", "feat-reservation-management", "Reservation Management", "Availability, booking lifecycle, and driver reservation history.");
  moveMany("feat-reservation-management", ["leaf-res-avail", "leaf-res-create", "leaf-res-extend", "leaf-res-cancel", "leaf-res-driver-history"]);

  get("cat-session").title = "Parking Operations";
  group("cat-session", "feat-parking-session-management", "Parking Session Management", "Vehicle entry, session claim, slot suggestion, and vehicle exit.");
  moveMany("feat-parking-session-management", ["leaf-sess-entry", "leaf-sess-claim", "leaf-sess-exit", "leaf-struct-suggest"]);

  get("cat-payment").title = "Payments";
  group("cat-payment", "feat-payment-processing", "Payment Processing", "Online, cash, waived, and webhook-driven payment flows.");
  moveMany("feat-payment-processing", ["leaf-pay-webhook", "leaf-pay-online", "leaf-pay-cash", "leaf-pay-waived"]);
  group("cat-payment", "feat-payment-reconciliation", "Payment Reconciliation", "Payment matching, review, and exception handling.");
  moveMany("feat-payment-reconciliation", ["leaf-pay-reconcile", "leaf-pay-review"]);
  convertAndMove("cat-pricing", "cat-payment", "Pricing Management");

  get("cat-monthly-pass").title = "Monthly Passes";
  group("cat-monthly-pass", "feat-monthly-pass-management", "Monthly Pass Management", "Application, review, card assignment, validation, and renewal.");
  moveMany("feat-monthly-pass-management", ["leaf-mp-app-review", "leaf-mp-card-manage", "leaf-mp-renew", "leaf-mp-validation", "leaf-driver-mp-application"]);

  get("cat-incidents").title = "Incidents & Exceptions";
  group("cat-incidents", "feat-incident-management", "Incident Management", "Lost cards, mismatches, and authorized overrides.");
  moveMany("feat-incident-management", ["leaf-inc-lost-card", "leaf-inc-mismatch", "leaf-inc-override"]);

  get("cat-reports").title = "Reporting & Analytics";
  group("cat-reports", "feat-operational-analytics", "Operational Analytics", "Operational dashboards and analytical reports.");
  moveMany("feat-operational-analytics", ["leaf-rep-dashboard", "leaf-rep-revenue", "leaf-rep-traffic", "leaf-rep-occupancy", "leaf-rep-card", "leaf-rep-audit"]);
  group("cat-reports", "feat-report-export", "Report Export", "Export report data for downstream use.");
  moveMany("feat-report-export", ["leaf-rep-export"]);

  get("cat-public").title = "Public Information";
  mergeAndRemove("leaf-pub-price", "leaf-price-public");
  mergeAndRemove("leaf-pub-avail", "leaf-struct-avail");
  group("cat-public", "feat-public-information-access", "Public Information Access", "Anonymous access to parking information, pricing, rules, and availability.");
  moveMany("feat-public-information-access", ["leaf-pub-info", "leaf-pub-price", "leaf-pub-rules", "leaf-pub-avail"]);

  group("cat-feedback", "feat-feedback-submission", "Feedback Submission", "Driver feedback submission flow.");
  moveMany("feat-feedback-submission", ["leaf-feed-submit"]);
  group("cat-feedback", "feat-feedback-administration", "Feedback Administration", "Review and manage submitted feedback.");
  moveMany("feat-feedback-administration", ["leaf-feed-list", "leaf-feed-detail", "leaf-feed-update"]);

  get("cat-notification").title = "Notifications";
  mergeAndRemove("leaf-notif-user", "leaf-notif-unread");
  group("cat-notification", "feat-notification-management", "Notification Management", "Notification delivery, unread counts, and read state.");
  moveMany("feat-notification-management", ["leaf-notif-user", "leaf-notif-read"]);

  get("cat-diagnostics").title = "Platform Operations & Diagnostics";
  group("cat-diagnostics", "feat-health-monitoring", "Health Monitoring", "Core, support API, and database health checks.");
  moveMany("feat-health-monitoring", ["leaf-diag-core-health", "leaf-diag-support-health", "leaf-diag-db-check"]);
  group("cat-diagnostics", "feat-diagnostic-data-access", "Diagnostic Data Access", "Restricted diagnostic snapshots for troubleshooting.");
  moveMany("feat-diagnostic-data-access", ["leaf-diag-res-dump", "leaf-diag-sess-dump"]);

  get("cat-mock-devices").title = "Developer & Test Utilities";
  group("cat-mock-devices", "feat-device-simulation", "Device Simulation", "Camera, RFID, and barrier simulators.");
  moveMany("feat-device-simulation", ["leaf-mock-camera", "leaf-mock-rfid", "leaf-mock-barrier"]);
  group("cat-mock-devices", "feat-test-data-maintenance", "Test Data Maintenance", "Restricted destructive and lifecycle test-data utilities.");
  moveMany("feat-test-data-maintenance", ["leaf-diag-clear-res", "leaf-diag-migrate", "leaf-diag-expire-res", "leaf-diag-expire-pay"]);

  normalizeTree(root);
  return root;
}
`````

### `src/store/featureTreeStore.ts`

`````typescript
import { create } from "zustand";
import { DEFAULT_CLIENT_ROLES, type FeatureNode, type Project, type ClientType, type TestCase } from "../domain/featureNode.types";
import { db } from "../db/dexieDb";
import { createParkingBuildingSeedTree, uuidv4 } from "../seed/parkingBuildingSeed";
import { flattenNodeTree } from "../domain/featureNodeFactory";
import { buildTreeFromFlat } from "../domain/export.utils";
import { canContainChild, getSuggestedChildType, validateFeatureTree } from "../domain/taxonomy";

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
  const syncQueues = new Map<string, Promise<void>>();

  // Sync helper
  const syncNodesToDb = (projectId: string, nodesList: FeatureNode[]) => {
    const snapshot = nodesList.map(node => ({ ...node }));
    const previous = syncQueues.get(projectId) || Promise.resolve();
    const next = previous.catch(() => undefined).then(async () => {
      await db.transaction("rw", db.features, async () => {
        const currentIds = await db.features.where("projectId").equals(projectId).primaryKeys();
        await db.features.bulkDelete(currentIds);
        await db.features.bulkAdd(snapshot.map(node => ({ ...node, projectId })));
      });
    });
    syncQueues.set(projectId, next);
    void next.finally(() => {
      if (syncQueues.get(projectId) === next) syncQueues.delete(projectId);
    });
    return next;
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
        metadata: { roles: [...DEFAULT_CLIENT_ROLES] },
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
      if (!parentNode) return;
      const childType = getSuggestedChildType(parentNode.type);
      if (!childType) return;
      const parentClients = parentNode ? parentNode.clients : ([] as ClientType[]);

      // Max order sibling
      const siblings = nodes.filter(n => n.parentId === parentId);
      const maxOrder = siblings.reduce((max, s) => s.order > max ? s.order : max, -1);

      const newId = uuidv4();
      const newNode: FeatureNode = {
        id: newId,
        parentId,
        title: "New Feature",
        type: childType,
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
        type: node.type,
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
      if (node.type === "project" || newParentId === null) return;
      const newParent = nodes.find(n => n.id === newParentId);
      if (!newParent || !canContainChild(newParent.type, node.type)) return;

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
    importTree: async (projectName, desc, clientsList, nodesList) => {
      const roles = clientsList.map(client => client.name.trim()).filter(Boolean);
      const preparedNodes = nodesList.map(node => node.parentId === null && node.type === "project"
        ? { ...node, metadata: { ...node.metadata, roles } }
        : node);
      const blockingIssues = validateFeatureTree(preparedNodes).filter(issue => issue.blocksSave);
      if (blockingIssues.length) {
        throw new Error(blockingIssues.slice(0, 5).map(issue => issue.message).join("\n"));
      }
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
      const processedNodes = preparedNodes.map(n => ({
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
`````

### `src/tests/aiExport.test.ts`

`````typescript
import { describe, test, expect } from "vitest";
import { createParkingBuildingSeedTree } from "../seed/parkingBuildingSeed";
import { flattenNodeTree } from "../domain/featureNodeFactory";
import { formatSingleNodeMarkdown } from "../domain/export.utils";

describe("aiExport", () => {
  test("Export selected node includes inherited rules", () => {
    const tree = createParkingBuildingSeedTree();
    const flat = flattenNodeTree(tree[0]);
    
    // Find "Create Reservation"
    const resNode = flat.find(n => n.title === "Create Reservation");
    expect(resNode).toBeDefined();

    // Export to AI mode
    const md = formatSingleNodeMarkdown(resNode!, flat, "ai");

    // Inherited rules from cat-reservation should be present:
    // "A reservation must be associated with a driver"
    expect(md).toContain("A reservation must be associated with a driver");
    expect(md).toContain("Unpaid or expired reservations must not permanently lock slots");
  });

  test("Export selected node includes clients, endpoints, API contracts, tests, and done criteria", () => {
    const tree = createParkingBuildingSeedTree();
    const flat = flattenNodeTree(tree[0]);
    
    // Find Login node
    const loginNode = flat.find(n => n.title === "Sign In");
    expect(loginNode).toBeDefined();

    // Export to AI mode
    const md = formatSingleNodeMarkdown(loginNode!, flat, "ai");

    // Validate metadata fields
    expect(md).toContain("**Authorized Clients/Roles:** Driver, Staff, Manager, Admin");
    expect(md).toContain("**Owner Service:** .NET Core API");
    expect(md).toContain("**Endpoints:**\n- POST /api/core/auth/login");

    // Validate sections
    expect(md).toContain("## 5. API Contracts");
    expect(md).toContain("POST /api/core/auth/login");
    expect(md).toContain("## 12. Automated Test Cases");
    expect(md).toContain("## 13. Acceptance / Done Criteria");
  });
});
`````

### `src/tests/export.test.ts`

`````typescript
import { describe, it, expect } from "vitest";
import type { FeatureNode } from "../domain/featureNode.types";
import { formatSingleNodeMarkdown, formatSubtreeMarkdown, formatProjectMarkdown } from "../domain/export.utils";

describe("Export Utilities", () => {
  const sampleNodes: FeatureNode[] = [
    {
      id: "root",
      parentId: null,
      title: "Project Root",
      type: "project",
      clients: ["Admin"],
      status: "draft",
      priority: "medium",
      tags: [],
      summary: "Root summary",
      businessRules: ["Global rule"],
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
      id: "feat",
      parentId: "root",
      title: "Feature A",
      type: "feature",
      clients: ["Admin", "Driver"],
      status: "ready",
      priority: "high",
      tags: ["tag1"],
      summary: "Feature summary",
      businessRules: ["Local rule"],
      apiContracts: [{ id: "c1", name: "POST /login", content: "Payload content" }],
      uiContracts: [],
      dataContracts: [],
      testCases: [{ id: "t1", title: "Test A", type: "unit", expectedResult: "pass", status: "passed" }],
      doneCriteria: [{ id: "d1", content: "Criteria A", checked: true }],
      dependencies: ["None"],
      risks: ["None"],
      notes: "Some notes",
      createdAt: "",
      updatedAt: "",
      order: 0
    }
  ];

  it("export selected node contains local and inherited rules", () => {
    const md = formatSingleNodeMarkdown(sampleNodes[1], sampleNodes, "ai");
    
    // Check path, clients, rules, contracts, tests, done criteria
    expect(md).toContain("AI Implementation Guide: Feature A");
    expect(md).toContain("Project Root > Feature A");
    expect(md).toContain("Admin, Driver");
    expect(md).toContain("Global rule"); // Inherited
    expect(md).toContain("Local rule");  // Local
    expect(md).toContain("POST /login");
    expect(md).toContain("Test A");
    expect(md).toContain("Criteria A");
  });

  it("export subtree exports recursively in order", () => {
    const md = formatSubtreeMarkdown("root", sampleNodes, "human");
    expect(md).toContain("# Feature Specification: Project Root");
    expect(md).toContain("# Feature Specification: Feature A");
  });

  it("export project exports all root trees", () => {
    const md = formatProjectMarkdown(sampleNodes, "qa");
    expect(md).toContain("QA Specification: Project Root");
    expect(md).toContain("QA Specification: Feature A");
  });
});
`````

### `src/tests/featureTreeStore.test.ts`

`````typescript
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
`````

### `src/tests/inheritance.test.ts`

`````typescript
import { describe, it, expect } from "vitest";
import type { FeatureNode } from "../domain/featureNode.types";
import { getAncestorChain, getEffectiveRules } from "../domain/inheritance.utils";

describe("Inheritance Utilities", () => {
  const sampleNodes: FeatureNode[] = [
    {
      id: "root",
      parentId: null,
      title: "Auth",
      type: "category",
      clients: ["Admin"],
      status: "draft",
      priority: "medium",
      tags: [],
      summary: "",
      businessRules: ["User must be active.", "Token response must follow common format."],
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
      id: "child",
      parentId: "root",
      title: "Login",
      type: "feature",
      clients: ["Admin"],
      status: "draft",
      priority: "medium",
      tags: [],
      summary: "",
      businessRules: ["Failed login must not reveal whether account exists.", "Login attempts rate-limited."],
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
      id: "leaf",
      parentId: "child",
      title: "Google Login",
      type: "leaf_feature",
      clients: ["Admin", "Driver"],
      status: "draft",
      priority: "medium",
      tags: [],
      summary: "",
      businessRules: ["Google token must be verified server-side."],
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

  it("getAncestorChain returns correct parent chain including target", () => {
    const chain = getAncestorChain("leaf", sampleNodes);
    expect(chain).toHaveLength(3);
    expect(chain[0].id).toBe("root");
    expect(chain[1].id).toBe("child");
    expect(chain[2].id).toBe("leaf");
  });

  it("getAncestorChain on root node returns only root", () => {
    const chain = getAncestorChain("root", sampleNodes);
    expect(chain).toHaveLength(1);
    expect(chain[0].id).toBe("root");
  });

  it("getEffectiveRules combines parent + child rules in correct order", () => {
    const effective = getEffectiveRules("leaf", sampleNodes);
    expect(effective).toHaveLength(3);
    
    expect(effective[0].sourceTitle).toBe("Auth");
    expect(effective[0].rules).toContain("User must be active.");
    
    expect(effective[1].sourceTitle).toBe("Login");
    expect(effective[1].rules).toContain("Failed login must not reveal whether account exists.");
    
    expect(effective[2].sourceTitle).toBe("Google Login");
    expect(effective[2].rules).toContain("Google token must be verified server-side.");
  });

  it("child rules do not mutate parent rules", () => {
    const effective = getEffectiveRules("leaf", sampleNodes);
    
    // Mutate the returned rules array
    effective[0].rules.push("Malicious Rule");
    
    const rootNode = sampleNodes.find(n => n.id === "root")!;
    expect(rootNode.businessRules).not.toContain("Malicious Rule");
    expect(rootNode.businessRules).toHaveLength(2);
  });
});
`````

### `src/tests/parkingBuildingSeed.test.ts`

`````typescript
import { describe, test, expect } from "vitest";
import { createParkingBuildingSeedTree } from "../seed/parkingBuildingSeed";
import { flattenNodeTree } from "../domain/featureNodeFactory";

describe("parkingBuildingSeed", () => {
  test("createParkingBuildingSeedTree returns one root project node", () => {
    const tree = createParkingBuildingSeedTree();
    expect(tree).toHaveLength(1);
    expect(tree[0].type).toBe("project");
    expect(tree[0].title).toBe("Parking Building Management System");
  });

  test("root contains major feature categories", () => {
    const tree = createParkingBuildingSeedTree();
    const root = tree[0];
    expect(root.children).toBeDefined();
    
    const titles = root.children!.map(c => c.title);
    expect(titles).toContain("Authentication");
    expect(titles).toContain("Reservations");
    expect(titles).toContain("Payments");
    expect(titles).toContain("Parking Configuration");
  });

  test("Auth/Login node has clients and endpoint POST /api/core/auth/login", () => {
    const tree = createParkingBuildingSeedTree();
    const flat = flattenNodeTree(tree[0]);
    const loginNode = flat.find(n => n.title === "Sign In");
    
    expect(loginNode).toBeDefined();
    expect(loginNode!.clients).toContain("Driver");
    expect(loginNode!.metadata?.endpoints).toContain("POST /api/core/auth/login");
  });

  test("Create Reservation node has Driver client and POST /api/core/reservations endpoint", () => {
    const tree = createParkingBuildingSeedTree();
    const flat = flattenNodeTree(tree[0]);
    const resNode = flat.find(n => n.title === "Create Reservation");
    
    expect(resNode).toBeDefined();
    expect(resNode!.clients).toContain("Driver");
    expect(resNode!.metadata?.endpoints).toContain("POST /api/core/reservations");
  });

  test("PayOS Webhook node has System / Worker client and POST /api/core/payments/payos/webhook endpoint", () => {
    const tree = createParkingBuildingSeedTree();
    const flat = flattenNodeTree(tree[0]);
    const webhookNode = flat.find(n => n.title === "PayOS Webhook");
    
    expect(webhookNode).toBeDefined();
    expect(webhookNode!.clients).toContain("System");
    expect(webhookNode!.metadata?.endpoints).toContain("POST /api/core/payments/payos/webhook");
  });

  test("Public Pricing node has Public / Guest client and GET /api/public/pricing endpoint", () => {
    const tree = createParkingBuildingSeedTree();
    const flat = flattenNodeTree(tree[0]);
    const pricingNode = flat.find(n => n.title === "Public Pricing");
    
    expect(pricingNode).toBeDefined();
    expect(pricingNode!.clients).toContain("Guest");
    expect(pricingNode!.metadata?.endpoints).toContain("GET /api/public/pricing");
  });

  test("Every leaf node has at least 2 test cases", () => {
    const tree = createParkingBuildingSeedTree();
    const flat = flattenNodeTree(tree[0]);
    const leaves = flat.filter(n => n.type === "leaf_feature");
    
    leaves.forEach(leaf => {
      expect(leaf.testCases.length).toBeGreaterThanOrEqual(2);
    });
  });

  test("Every leaf node has at least 1 done criterion", () => {
    const tree = createParkingBuildingSeedTree();
    const flat = flattenNodeTree(tree[0]);
    const leaves = flat.filter(n => n.type === "leaf_feature");
    
    leaves.forEach(leaf => {
      expect(leaf.doneCriteria.length).toBeGreaterThanOrEqual(1);
    });
  });

  test("Every node has deterministic id", () => {
    const tree1 = createParkingBuildingSeedTree();
    const flat1 = flattenNodeTree(tree1[0]);
    
    const tree2 = createParkingBuildingSeedTree();
    const flat2 = flattenNodeTree(tree2[0]);
    
    expect(flat1.length).toEqual(flat2.length);
    for (let i = 0; i < flat1.length; i++) {
      expect(flat1[i].id).toEqual(flat2[i].id);
    }
  });

  test("ParentId is correctly assigned recursively", () => {
    const tree = createParkingBuildingSeedTree();
    
    const checkParentIds = (node: any, expectedParentId: string | null) => {
      expect(node.parentId).toBe(expectedParentId);
      if (node.children) {
        node.children.forEach((child: any) => {
          checkParentIds(child, node.id);
        });
      }
    };
    
    checkParentIds(tree[0], null);
  });
});
`````

### `src/tests/projectBackup.test.ts`

`````typescript
import { describe, expect, test } from "vitest";
import { flattenNodeTree } from "../domain/featureNodeFactory";
import { CURRENT_PROJECT_VERSION, parseProjectBackup } from "../domain/projectBackup";
import { createParkingBuildingSeedTree } from "../seed/parkingBuildingSeed";

describe("project backup", () => {
  test("migrates version 1 backups and validates their tree", () => {
    const parsed = parseProjectBackup({
      version: "1.0.0",
      projectName: "Parking",
      clients: ["Admin", "Driver"].map(name => ({ id: name, name })),
      nodes: flattenNodeTree(createParkingBuildingSeedTree()[0]),
    });
    expect(parsed.migrated).toBe(true);
    expect(parsed.data.version).toBe(CURRENT_PROJECT_VERSION);
    expect(parsed.issues.filter(issue => issue.blocksSave)).toEqual([]);
  });

  test("rejects unsupported future major versions", () => {
    expect(() => parseProjectBackup({ version: "3.0.0", projectName: "Future", nodes: [] }))
      .toThrow(/Unsupported backup version/);
  });
});
`````

### `src/tests/taxonomy.test.ts`

`````typescript
import { describe, expect, test } from "vitest";
import { flattenNodeTree } from "../domain/featureNodeFactory";
import { validateFeatureTree } from "../domain/taxonomy";
import { createParkingBuildingSeedTree } from "../seed/parkingBuildingSeed";

describe("parking capability taxonomy", () => {
  test("seed has one valid project root and no blocking taxonomy issues", () => {
    const nodes = flattenNodeTree(createParkingBuildingSeedTree()[0]);
    const blocking = validateFeatureTree(nodes).filter(issue => issue.blocksSave);
    expect(blocking).toEqual([]);
  });

  test("keeps target business domains and removes duplicate capabilities", () => {
    const root = createParkingBuildingSeedTree()[0];
    const nodes = flattenNodeTree(root);
    expect(root.children).toHaveLength(14);
    expect(nodes.filter(node => node.title === "Public Pricing")).toHaveLength(1);
    expect(nodes.filter(node => node.title === "Public Available Slots")).toHaveLength(1);
    expect(nodes.find(node => node.id === "leaf-price-public")).toBeUndefined();
    expect(nodes.find(node => node.id === "leaf-struct-avail")).toBeUndefined();
    expect(nodes.find(node => node.id === "leaf-notif-unread")).toBeUndefined();
  });

  test("splits authentication into independently editable leaf flows", () => {
    const nodes = flattenNodeTree(createParkingBuildingSeedTree()[0]);
    const auth = nodes.find(node => node.id === "leaf-auth-session");
    expect(auth?.type).toBe("feature");
    for (const id of ["leaf-auth-login", "leaf-auth-profile", "leaf-auth-refresh", "leaf-auth-logout"]) {
      const node = nodes.find(item => item.id === id);
      expect(node?.type).toBe("leaf_feature");
      expect(node?.testCases.length).toBeGreaterThanOrEqual(2);
    }
  });
});
`````

### `src/tests/treeActions.test.ts`

`````typescript
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

  it("moveNode blocks a feature from being moved directly under the project root", () => {
    const store = useFeatureTreeStore.getState();
    // Move feat1 from cat1 to root
    store.moveNode("feat1", "root", 1);

    const state = useFeatureTreeStore.getState();
    const feat = state.nodes.find(n => n.id === "feat1")!;
    expect(feat.parentId).toBe("cat1");
  });
});
`````

## Ignore Rules

See `projectmapignore` for excluded dependencies, generated output, assets and configuration files.

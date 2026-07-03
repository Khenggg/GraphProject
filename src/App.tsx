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

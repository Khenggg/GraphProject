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

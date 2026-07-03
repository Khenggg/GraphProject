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

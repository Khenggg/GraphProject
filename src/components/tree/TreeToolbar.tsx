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

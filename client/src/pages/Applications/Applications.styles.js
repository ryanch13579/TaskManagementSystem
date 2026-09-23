export const styles = {
  pageHeader: "flex items-center justify-between mb-6",
  pageHeaderLeft: "flex items-center gap-2",
  pageTitle: "text-xl font-bold text-slate-900",
  addBtn:
    "flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700",
  appList: "space-y-4",
  appCard:
    "flex items-center gap-6 bg-white border border-slate-200 rounded-xl px-5 py-4",
  // mr-auto pins this to the left, keeping appMeta and appCardRight
  // clustered together on the right instead of spread apart.
  appCardLeft: "flex items-center gap-4 min-w-0 mr-auto",
  appIcon:
    "h-11 w-11 shrink-0 rounded-lg bg-blue-50 flex items-center justify-center",
  appInfo: "min-w-0",
  appName: "font-semibold text-slate-900 truncate",
  appDescription: "text-sm text-slate-500 truncate max-w-xs",
  appMeta: "flex items-center gap-8 shrink-0",
  metaLabel: "text-xs text-slate-500 mb-1",
  metaValue: "text-sm font-semibold text-slate-900",
  appCardRight: "flex items-center gap-2 shrink-0",
  primaryBtn:
    "flex items-center gap-1.5 border border-blue-200 text-blue-600 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 whitespace-nowrap",
  secondaryBtn:
    "flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 whitespace-nowrap",
};

export const styles = {
  columns: "flex gap-6 items-start",
  column: "flex-1 min-w-0 bg-white border border-slate-200 rounded-xl",
  columnPlans:
    "w-[40%] shrink-0 min-w-0 bg-white border border-slate-200 rounded-xl",
  columnHeader:
    "flex items-center justify-between px-5 py-4 border-b border-slate-100",
  columnHeaderLeft: "flex items-center gap-2",
  columnTitle: "text-base font-bold text-slate-900",
  addBtn:
    "flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3.5 py-1.5 rounded-lg hover:bg-blue-700",
  columnBody: "p-4 space-y-3",
  filterBanner:
    "flex items-center justify-between gap-2 bg-blue-50 text-blue-700 text-sm rounded-lg px-3 py-2 mx-4 mt-4",
  filterBannerLeft: "flex items-center gap-1.5",
  clearFilter: "text-blue-600 font-medium hover:underline shrink-0",

  card: "border rounded-xl px-4 py-3 cursor-pointer transition-colors",
  cardDefault: "border-slate-200 hover:border-blue-200",
  cardSelected: "border-blue-500 bg-blue-50/60",
  cardTop: "flex items-start justify-between gap-2",
  cardTopLeft: "flex items-center gap-2 min-w-0",
  cardIcon:
    "h-8 w-8 shrink-0 rounded-lg bg-blue-50 flex items-center justify-center",
  cardName: "font-semibold text-slate-900 truncate",
  editBtn:
    "flex items-center gap-1 text-slate-500 text-xs font-medium px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50 shrink-0",
  cardMeta: "flex items-center justify-between mt-3",
  metaLabel: "text-[11px] text-slate-400 mb-0.5",
  metaValue: "text-sm font-semibold text-slate-900",

  emptyState: "text-sm text-slate-400 text-center py-8",

  noPlanCard:
    "flex items-center justify-between gap-2 border border-dashed border-slate-300 rounded-xl px-4 py-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40",
  noPlanCardSelected: "border-blue-500 bg-blue-50/60",
  noPlanLeft: "flex items-center gap-2 min-w-0",
  noPlanIcon:
    "h-8 w-8 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center",
  noPlanTitle: "text-sm font-semibold text-slate-900",
  noPlanSubtitle: "text-xs text-slate-400",

  footer:
    "flex items-center gap-1.5 px-4 py-3 border-t border-slate-100 text-xs text-slate-400",
};

const STATE_STYLES = {
  Doing: "bg-blue-50 text-blue-600",
  Done: "bg-green-50 text-green-600",
  "To Do": "bg-amber-50 text-amber-600",
  Closed: "bg-red-50 text-red-500",
  Open: "bg-slate-100 text-slate-600",
};

export const taskStateBadge = (state) =>
  `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
    STATE_STYLES[state] ?? "bg-slate-100 text-slate-600"
  }`;

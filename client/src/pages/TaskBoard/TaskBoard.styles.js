export const styles = {
  board: "flex gap-4 items-start overflow-x-auto pb-2",
  column: "w-72 shrink-0 bg-slate-50 border border-slate-200 rounded-xl",
  columnHeader: "flex items-center justify-between px-4 py-3",
  columnHeaderLeft: "flex items-center gap-2",
  dot: "h-2 w-2 rounded-full",
  columnTitle: "text-sm font-semibold text-slate-900",
  columnCount:
    "text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center",
  columnBody: "px-3 pb-3 space-y-2 min-h-16",
  emptyState: "text-xs text-slate-400 text-center py-6",

  card: "bg-white border border-slate-200 rounded-lg px-3 py-2.5",
  cardName: "text-sm font-medium text-slate-900 mb-2",
  cardMetaRow: "flex items-center gap-1.5 text-xs text-slate-500",
  planTag:
    "inline-flex items-center text-[11px] font-medium text-blue-600 bg-blue-50 rounded-full px-2 py-0.5 mt-2",
};

const DOT_COLORS = {
  "To Do": "bg-amber-400",
  Doing: "bg-blue-500",
  Open: "bg-slate-400",
  Done: "bg-green-500",
  Closed: "bg-red-400",
};

export const stateDot = (state) => `${styles.dot} ${DOT_COLORS[state] ?? "bg-slate-400"}`;

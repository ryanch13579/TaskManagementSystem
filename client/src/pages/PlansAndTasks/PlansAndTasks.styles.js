import { LOCKABLE } from "../../styles/shared";

export const styles = {
  pageHeader: "mb-4",
  eyebrow: "text-xs font-semibold text-blue-600",
  titleRow: "flex items-center gap-2",
  title: "text-xl font-bold text-slate-900",
  error: "text-sm text-red-500 mb-4",

  columns: "flex items-stretch bg-white border border-slate-200 rounded-xl overflow-hidden",
  column: "flex-1 min-w-0",
  columnPlans: "w-[40%] shrink-0 min-w-0 border-r border-slate-200",
  columnHeader: "flex items-center justify-between px-5 py-4 border-b border-slate-100",
  columnHeaderLeft: "flex items-center gap-2",
  columnTitle: "text-base font-bold text-slate-900",
  addBtn: `flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3.5 py-1.5 rounded-lg hover:bg-blue-700 ${LOCKABLE}`,
  columnBody: "p-4 space-y-3",

  // overflow-hidden clips the accent bar to the card's rounded corners.
  card: "relative overflow-hidden border rounded-xl px-4 py-3 cursor-pointer transition-colors",
  cardDefault: "border-slate-200 hover:border-blue-200",
  cardSelected: "border-blue-500 bg-blue-50/60",
  cardAccent: "absolute left-0 top-0 bottom-0 w-1 bg-blue-600",
  cardTop: "flex items-start justify-between gap-2",
  cardTopLeft: "flex items-center gap-2 min-w-0",
  cardIcon: "h-8 w-8 shrink-0 rounded-full bg-blue-50 flex items-center justify-center",
  cardName: "font-semibold text-slate-900 truncate",
  cardId: "text-[11px] font-mono text-slate-400 shrink-0",
  editBtn: `flex items-center gap-1 text-slate-500 text-xs font-medium px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50 shrink-0 ${LOCKABLE}`,
  cardMeta: "flex items-center justify-between mt-3",
  metaLabel: "text-[11px] text-slate-400 mb-0.5",
  metaValue: "text-sm font-semibold text-slate-900",

  emptyState: "text-sm text-slate-400 text-center py-8",

  noPlanCard:
    "relative overflow-hidden flex items-center justify-between gap-2 border border-dashed border-slate-300 rounded-xl px-4 py-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40",
  noPlanTitle: "text-sm font-semibold text-slate-900",
  noPlanSubtitle: "text-xs text-slate-400",

  footer: "flex items-center gap-1.5 px-4 py-3 border-t border-slate-100 text-xs text-slate-400",
};

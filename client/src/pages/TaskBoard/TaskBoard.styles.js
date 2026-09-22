import { FOCUS_RING, STATE_COLORS } from "../../styles/shared";

export const styles = {
  // -m-8/p-8 cancels out Layout's `main` padding so this bleeds edge-to-edge
  // over it with a white background, instead of leaving the shared gray-50
  // page background showing through as a border around the board. 57px =
  // the header's rendered height (same constant the sidebar uses for its
  // own min-h calc) - since this box now fills all of `main`, that's the
  // only offset left to subtract for a constant, window-sized height.
  pageWrap: "-m-8 p-8 bg-white flex flex-col h-[calc(100vh-57px)]",

  pageHeaderRow: "flex items-start justify-between gap-4 mb-4 shrink-0",
  // Split so the acronym can be colored independently of the app name -
  // "abc" (blue) " - " + name (black) on one line.
  eyebrow: "text-xs font-semibold",
  eyebrowAcronym: "text-blue-600",
  eyebrowName: "text-black",
  titleRow: "flex items-center gap-2",
  title: "text-xl font-bold text-slate-900",

  filterWrap: "relative shrink-0",
  filterSelect: `appearance-none flex items-center gap-2 bg-white border border-slate-200 rounded-lg pl-8 pr-8 py-2 text-sm font-medium text-slate-700 cursor-pointer ${FOCUS_RING}`,
  filterIcon:
    "absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none",
  filterChevron:
    "absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none",

  board: "grid grid-cols-5 gap-2 flex-1 min-h-0",
  column: "min-w-0 h-full flex flex-col bg-slate-50 border border-slate-200 rounded-xl",
  columnHeader: "flex items-center justify-between px-3 py-2.5 shrink-0",
  columnHeaderLeft: "flex items-center gap-1.5",
  ring: "h-2.5 w-2.5 rounded-full border-2 bg-white shrink-0",
  columnTitle: "text-xs font-bold tracking-wide",
  columnCount:
    "text-xs font-semibold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center",
  columnBody: "flex-1 min-h-0 overflow-y-auto px-2 pb-2 space-y-1",
  emptyState: "text-xs text-slate-400 text-center py-6",

  card: "relative bg-white border border-slate-200 rounded-lg px-2 py-1.5",
  cardTop: "flex items-start justify-between gap-1.5",
  cardName: "text-xs font-semibold text-slate-900 leading-snug",
  menuBtn: "text-slate-400 hover:text-slate-600 shrink-0 -mt-0.5 -mr-1 p-0.5 rounded",
  menu: "absolute right-2 top-8 z-10 w-28 bg-white border border-slate-200 rounded-lg shadow-lg py-1",
  menuItem: "w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50",

  tagsRow: "flex items-center justify-between gap-1.5 mt-1.5",
  avatar:
    "h-[18px] w-[18px] rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center shrink-0",
  planTag: "inline-flex items-center text-[10px] font-medium rounded-full px-1.5 py-0.5 truncate",
  planTagActive: "bg-blue-50 text-blue-600",
  planTagNone: "bg-slate-100 text-slate-500",

  description: "text-[11px] text-slate-500 mt-1.5 leading-snug line-clamp-2",
  dueDateRow: "flex items-center gap-1 text-[11px] text-slate-400 mt-1.5",
  actionsRow: "flex flex-nowrap gap-1 mt-2",
  forwardBtn:
    "inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap text-green-700 bg-green-50 hover:bg-green-100",
  backwardBtn:
    "inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap text-red-600 bg-red-50 hover:bg-red-100",
};

export const stateRing = (state) =>
  `${styles.ring} ${STATE_COLORS[state]?.ring ?? "border-slate-400"}`;

export const stateLabel = (state) =>
  `${styles.columnTitle} ${STATE_COLORS[state]?.text ?? "text-slate-600"}`;

export const stateCountBadge = (state) =>
  `${styles.columnCount} ${STATE_COLORS[state]?.badge ?? "bg-slate-100 text-slate-600"}`;

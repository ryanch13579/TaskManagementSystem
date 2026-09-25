import { FOCUS_RING, LOCKABLE, STATE_COLORS } from "../../styles/shared";

export const styles = {
  // -m-8 cancels Layout's page padding so the white background reaches the
  // edges; the extra 4rem in the height adds that padding back so the board
  // fills `main` exactly.
  pageWrap: "-m-8 p-8 bg-white flex flex-col h-[calc(100%+4rem)]",

  pageHeaderRow: "flex items-start justify-between gap-4 mb-4 shrink-0",
  eyebrow: "text-xs font-semibold text-blue-600",
  titleRow: "flex items-center gap-2",
  title: "text-xl font-bold text-slate-900",
  error: "text-sm text-red-500 mb-4 shrink-0",

  filterWrap: "relative shrink-0",
  filterSelect: `appearance-none bg-white border border-slate-200 rounded-lg pl-8 pr-8 py-2 text-sm font-medium text-slate-700 cursor-pointer ${FOCUS_RING}`,
  filterIcon: "absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none",
  filterChevron: "absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none",

  board: "grid grid-cols-5 gap-1.5 flex-1 min-h-0",
  column: "min-w-0 h-full flex flex-col bg-slate-50 border border-slate-200 rounded-xl",
  columnHeader: "flex items-center justify-between px-3 py-2.5 shrink-0",
  columnHeaderLeft: "flex items-center gap-1.5",
  columnBody: "flex-1 min-h-0 overflow-y-auto px-1.5 pb-1.5 space-y-1",
  emptyState: "text-xs text-slate-400 text-center py-6",

  card: "relative bg-white border border-slate-200 rounded-lg px-1.5 py-1.5 cursor-pointer",
  cardTop: "flex items-start justify-between gap-1.5",
  cardTopLeft: "min-w-0",
  cardId: "text-[10px] font-mono text-slate-400 leading-snug",
  cardName: "text-xs font-semibold text-slate-900 leading-snug",
  menuBtn: "text-slate-400 hover:text-slate-600 shrink-0 -mt-0.5 -mr-1 p-0.5 rounded",
  menu: "absolute right-2 top-8 z-10 w-28 bg-white border border-slate-200 rounded-lg shadow-lg py-1",
  menuItem: `w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 ${LOCKABLE}`,

  tagsRow: "flex items-center justify-between gap-1.5 mt-1.5",
  avatar:
    "h-[18px] w-[18px] rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center shrink-0",
  planTag: "inline-flex items-center text-[10px] font-medium rounded-full px-1.5 py-0.5 truncate",
  planTagActive: "bg-blue-50 text-blue-600",
  planTagNone: "bg-slate-100 text-slate-500",

  description: "text-[11px] text-slate-500 mt-1.5 leading-snug line-clamp-2",
  // A lone button sits on the left at its natural size. When a card has two,
  // `sharedBtn` makes them split the width equally; a label that doesn't fit
  // is cut off with "..." (the full label is in the button's tooltip).
  actionsRow: "flex gap-1 mt-2",
  forwardBtn: `inline-flex items-center justify-center gap-0.5 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap text-green-700 bg-green-50 hover:bg-green-100 ${LOCKABLE}`,
  backwardBtn: `inline-flex items-center justify-center gap-0.5 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap text-red-600 bg-red-50 hover:bg-red-100 ${LOCKABLE}`,
  soloBtn: "px-1.5",
  sharedBtn: "flex-1 min-w-0 px-0.5",
  actionLabel: "truncate",
};

// Column header pieces, colored by task state.
export const stateRing = (state) =>
  `h-2.5 w-2.5 rounded-full border-2 bg-white shrink-0 ${STATE_COLORS[state].ring}`;

export const stateLabel = (state) => `text-xs font-bold tracking-wide ${STATE_COLORS[state].text}`;

export const stateCountBadge = (state) =>
  `text-xs font-semibold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center ${STATE_COLORS[state].badge}`;

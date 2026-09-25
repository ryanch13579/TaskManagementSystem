import { FOCUS_RING, STATE_COLORS } from "../../styles/shared";

export const styles = {
  overlay: "fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4",
  modal: "bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[30rem] flex flex-col",
  header: "flex items-start justify-between px-5 pt-4 pb-3 shrink-0",
  eyebrow: "text-xs font-bold tracking-wide text-slate-400",
  title: "text-lg font-bold text-slate-900 mt-0.5",
  closeBtn: "text-slate-400 hover:text-slate-600 shrink-0",

  noteRow: "flex items-stretch gap-2 px-5 pb-3 shrink-0",
  noteInput: `flex-1 px-3 py-2.5 border border-slate-300 rounded-xl text-sm resize-none h-12 ${FOCUS_RING}`,
  addNoteBtn:
    "bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 rounded-xl shrink-0 disabled:bg-blue-300 disabled:cursor-not-allowed",
  error: "text-xs text-red-500 px-5 -mt-1 pb-3",

  list: "flex-1 min-h-0 overflow-y-auto px-5 pb-5",
  // One grid for the whole list: each column is as wide as its widest
  // entry, and justify-between spreads the leftover space evenly between
  // the columns (first flush left, last flush right). The vertical line
  // sits inside it (not the scrolling `list`) so it reaches rows below
  // the fold.
  timeline: "relative grid grid-cols-[repeat(4,auto)] justify-between gap-x-4 items-center",
  line: "absolute left-1 top-3 bottom-3 w-px bg-slate-200",
  stateCell: "flex items-center gap-3 py-2",
  username: "text-xs text-slate-500 py-2 truncate max-w-[8rem]",
  date: "text-xs text-slate-500 py-2 whitespace-nowrap",
  time: "text-xs text-slate-500 py-2 whitespace-nowrap",
  // Spans the whole row, indented to line up with the state text.
  noteText: "col-span-4 pl-5 -mt-1 pb-2 text-xs text-slate-600 whitespace-pre-wrap",
  empty: "text-sm text-slate-400 text-center py-6",
};

export const stateDot = (state) =>
  `relative z-10 h-2 w-2 rounded-full shrink-0 ring-4 ring-white ${STATE_COLORS[state]?.dot ?? "bg-slate-400"}`;

export const stateText = (state) => `text-sm font-bold ${STATE_COLORS[state]?.text ?? "text-slate-600"}`;

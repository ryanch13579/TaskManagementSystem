import { STATE_COLORS } from "../../styles/shared";

export const styles = {
  overlay:
    "fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4",
  modal: "bg-white shadow-xl w-full max-w-xl max-h-[36rem] flex flex-col",
  header: "flex items-start justify-between px-6 pt-5 pb-4 shrink-0",
  eyebrow: "text-[11px] font-bold tracking-wide text-slate-400",
  title: "text-lg font-bold text-slate-900 mt-0.5",
  closeBtn: "text-slate-400 hover:text-slate-600 shrink-0",

  list: "flex-1 min-h-0 overflow-y-auto px-6 pb-6",
  // `line` is positioned against `timeline`, not `list` (the scroll
  // container) - `list`'s box height is only the visible viewport, so a
  // line anchored to it wouldn't reach rows below the fold.
  timeline: "relative",
  // left-1 centers under the dots' 8px circle (h-2 w-2, so 4px radius).
  line: "absolute left-1 top-1 bottom-1 w-px bg-slate-200",
  row: "relative flex items-start gap-3 py-2.5",
  dot: "relative z-10 h-2 w-2 rounded-full mt-1.5 shrink-0 ring-4 ring-white",
  rowBody: "flex-1 min-w-0",
  rowMain: "flex items-baseline justify-between gap-3",
  stateLabel: "text-sm font-bold",
  username: "text-xs text-slate-400 mt-0.5",
  dateTime: "flex items-baseline gap-3 shrink-0",
  date: "text-xs text-slate-400",
  time: "text-xs text-slate-400",
  noteText: "text-xs text-slate-600 mt-1.5 whitespace-pre-wrap",

  empty: "text-sm text-slate-400 text-center py-6",
};

export const stateDot = (state) =>
  `${styles.dot} ${STATE_COLORS[state]?.dot ?? "bg-slate-400"}`;

export const stateTextColor = (state) =>
  `${styles.stateLabel} ${STATE_COLORS[state]?.text ?? "text-slate-600"}`;

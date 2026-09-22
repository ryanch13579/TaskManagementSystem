import { FOCUS_RING, FIELD_LABEL, STATE_COLORS } from "../../styles/shared";

export const styles = {
  overlay:
    "fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4",
  modal: "bg-white rounded-2xl shadow-xl w-full max-w-md",
  header:
    "flex items-center justify-between px-6 py-4 border-b border-slate-100",
  title: "text-base font-bold text-slate-900",
  closeBtn: "text-slate-400 hover:text-slate-600",
  form: "px-6 py-5 space-y-5",
  label: FIELD_LABEL,
  // Same text as `label` but without its bottom margin - `nameRow` is a flex
  // row (label + status badge sharing one line) and supplies its own mb-1
  // on the row itself instead, so the label and badge line up on one baseline.
  nameLabel: "text-xs font-semibold text-slate-700",
  nameRow: "flex items-center justify-between gap-2 mb-1",
  statusBadge:
    "inline-flex items-center text-[11px] font-semibold rounded-full px-2 py-0.5 shrink-0",
  input: `w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm ${FOCUS_RING}`,
  textarea: `w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm resize-y min-h-24 ${FOCUS_RING}`,
  error: "text-xs text-red-500",
  footer: "flex justify-end gap-2 pt-1",
  cancelBtn:
    "border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50",
  submitBtn:
    "bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg",
};

export const stateBadge = (state) =>
  `${styles.statusBadge} ${STATE_COLORS[state]?.badge ?? "bg-slate-100 text-slate-600"}`;

import { FOCUS_RING, FIELD_LABEL } from "../../styles/shared";

export const styles = {
  overlay:
    "fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4",
  modal: "bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto",
  header:
    "flex items-center justify-between px-6 py-4 border-b border-slate-100",
  title: "text-base font-bold text-slate-900",
  closeBtn: "text-slate-400 hover:text-slate-600",
  form: "px-6 py-5 space-y-4",
  label: FIELD_LABEL,
  input: `w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm ${FOCUS_RING}`,
  textarea: `w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm resize-y min-h-20 ${FOCUS_RING}`,
  error: "text-xs text-red-500",
  footer: "flex justify-end gap-2 pt-1",
  cancelBtn:
    "border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50",
  submitBtn:
    "bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg",
};

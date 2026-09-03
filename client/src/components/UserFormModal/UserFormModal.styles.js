export const styles = {
  overlay:
    "fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4",
  modal:
    "bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto",
  header:
    "flex items-center justify-between px-6 py-4 border-b border-slate-100",
  title: "text-base font-bold text-slate-900",
  closeBtn: "text-slate-400 hover:text-slate-600",
  form: "px-6 py-4 space-y-4",
  label: "block text-xs font-semibold text-slate-700 mb-1",
  input:
    "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
  hint: "text-[11px] text-slate-400 mt-1",
  roleField: "relative",
  roleTrigger:
    "w-full flex items-center justify-between gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm min-h-[42px] focus:outline-none focus:ring-2 focus:ring-blue-500",
  roleChips: "flex flex-wrap gap-1.5 flex-1",
  placeholder: "text-slate-400",
  chip: "flex items-center gap-1 bg-blue-50 text-blue-600 text-xs font-medium px-2 py-1 rounded-md",
  dropdownPanel:
    "absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 max-h-48 overflow-y-auto",
  roleOption:
    "flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer",
  checkbox:
    "h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500",
  statusRow: "flex gap-2",
  statusOption:
    "flex items-center gap-1.5 border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-lg",
  statusActiveSelected:
    "flex items-center gap-1.5 border border-green-200 bg-green-50 text-green-600 text-xs font-medium px-3 py-1.5 rounded-lg",
  statusDisabledSelected:
    "flex items-center gap-1.5 border border-red-200 bg-red-50 text-red-500 text-xs font-medium px-3 py-1.5 rounded-lg",
  dotActive: "h-1.5 w-1.5 rounded-full bg-green-500",
  dotDisabled: "h-1.5 w-1.5 rounded-full bg-red-500",
  footer: "flex justify-end gap-2 pt-2",
  cancelBtn:
    "border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50",
  submitBtn:
    "bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg",
};

import { FOCUS_RING, statusBadge, statusDot } from "../../styles/shared";

export const styles = {
  pageHeaderRow: "flex items-start justify-between mb-6",
  pageHeader: "flex items-center gap-2 mb-2",
  pageTitle: "text-lg font-bold text-slate-900",
  pageSubtitle: "text-xs text-slate-500 max-w-xl",
  createBtn:
    "flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg",
  tableCard: "bg-white border border-slate-200 rounded-xl overflow-x-auto",
  table: "w-full text-left border-collapse",
  headRow: "border-b border-slate-100",
  th: "px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap",
  row: "border-b border-slate-50 last:border-0",
  editRow: "border-b border-slate-50 last:border-0 bg-blue-50/40",
  td: "px-3 py-3 align-middle text-xs text-slate-700 whitespace-nowrap",
  userCell: "flex items-center gap-2",
  avatar:
    "h-7 w-7 shrink-0 rounded-full text-white text-[10px] font-semibold flex items-center justify-center",
  userName: "text-xs font-semibold text-slate-900 whitespace-nowrap",
  roleList: "flex flex-wrap gap-1",
  roleBadge:
    "bg-blue-50 text-blue-600 text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap",
  accessBadge:
    "bg-indigo-50 text-indigo-600 text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap",
  statusActive: statusBadge(true),
  statusDisabled: statusBadge(false),
  statusToggleActive: statusBadge(true, { interactive: true }),
  statusToggleDisabled: statusBadge(false, { interactive: true }),
  dotActive: statusDot(true),
  dotDisabled: statusDot(false),
  passwordDots: "text-slate-400 tracking-widest",
  metaLabel: "text-[11px] text-slate-400 italic",
  editBtn:
    "border border-slate-200 rounded-lg p-1.5 text-slate-500 hover:bg-slate-50",
  actionGroup: "flex items-center gap-1.5",
  saveBtn:
    "border border-slate-200 rounded-lg p-1.5 text-blue-600 hover:bg-blue-50",
  cancelIconBtn:
    "border border-slate-200 rounded-lg p-1.5 text-slate-400 hover:bg-slate-50",
  cellInput: `w-full min-w-[110px] px-2 py-1.5 border border-slate-200 rounded-md text-xs ${FOCUS_RING}`,
  hint: "text-[10px] text-slate-400 mt-1 whitespace-normal max-w-[140px]",
  roleField: "relative",
  roleTrigger: `flex items-center justify-between gap-1 min-w-[130px] px-2 py-1.5 border border-slate-200 rounded-md text-xs bg-white ${FOCUS_RING}`,
  roleChips: "flex flex-wrap gap-1 flex-1",
  placeholder: "text-slate-400",
  chip: "flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap",
  dropdownPanel:
    "absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 max-h-48 w-44 overflow-y-auto",
  roleOption:
    "flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap",
  checkbox:
    "h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500",
};

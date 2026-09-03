export const styles = {
  page: "min-h-screen bg-gray-50",
  header:
    "flex items-center justify-between bg-white border-b border-slate-200 px-6 py-3",
  headerLeft: "flex items-center gap-2",
  logo: "h-8 w-8",
  headerTitle: "font-semibold text-slate-900",
  userMenuWrapper: "relative",
  userMenuButton: "flex items-center gap-2 focus:outline-none",
  avatarSm:
    "h-8 w-8 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center",
  avatarLg:
    "h-9 w-9 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center",
  userName: "text-sm font-medium text-slate-700",
  chevron: "h-4 w-4 text-slate-400",
  dropdown:
    "absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-10",
  dropdownHeader: "flex items-center gap-3 px-4 py-3",
  dropdownName: "text-sm font-semibold text-slate-900",
  dropdownRole: "text-xs text-slate-400",
  divider: "border-slate-100",
  dropdownItem:
    "w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50",
  body: "flex",
  sidebar:
    "w-50 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-57px)] py-4",
  nav: "space-y-1 px-3",
  navButtonActive:
    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-blue-50 text-blue-600",
  navButtonInactive:
    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-600 hover:bg-slate-50",
  main: "flex-1 min-w-0 p-8",
};

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
    "h-8 w-8 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center shrink-0",
  avatarLg:
    "h-9 w-9 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center",
  userInfo: "flex flex-col items-start leading-tight",
  userName: "text-sm font-semibold text-slate-900",
  userRoles: "text-xs text-slate-400",
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
  appListSection: "px-6 mb-2",
  appListHeader:
    "flex items-center gap-2 w-full text-left text-sm font-bold text-slate-900 py-2.5 whitespace-nowrap",
  tree: "relative mt-2 ml-2 space-y-1.5",
  treeLine: "absolute left-0 top-0 bottom-5 w-px bg-slate-200",
  treeItem:
    "relative flex items-center gap-2.5 pl-3 pr-3 py-2.5 rounded-lg text-sm font-medium border-l-4 transition-colors whitespace-nowrap",
  treeItemActive: "ml-0 bg-blue-50 text-blue-600 border-blue-600",
  treeItemInactive: "ml-4 text-slate-600 hover:bg-slate-50 border-transparent",
  treeStub: "absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-px bg-slate-200",
  nav: "space-y-1 px-3",
  navButtonActive:
    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors bg-blue-50 text-blue-600 whitespace-nowrap",
  navButtonInactive:
    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors text-slate-600 hover:bg-slate-50 whitespace-nowrap",
  main: "flex-1 min-w-0 p-8",
};

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
  chevron: "h-4 w-4 text-slate-400 transition-transform",
  chevronOpen: "rotate-180",
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
    "flex items-center gap-2 w-full text-left text-sm font-bold text-slate-900 py-2.5 whitespace-nowrap focus:outline-none",
  // The connector (line + stubs) is a static layer, positioned relative to
  // the `tree` container rather than to each item - so it never has to
  // change when a different item becomes active. No z-index of its own: it
  // and each treeItem are both position:relative (z-index:auto) at the same
  // stacking level, painted in DOM order, and the connector spans render
  // before the NavLinks below - so a NavLink's own background (the overlay)
  // naturally paints over the connector wherever they overlap instead of
  // the line showing through it.
  tree: "relative mt-2 ml-2 space-y-1.5",
  treeLine: "absolute left-0 top-0 bottom-5 w-px bg-blue-200",
  treeStubRow1: "absolute left-0 top-5 -translate-y-1/2 w-4 h-px bg-blue-200",
  treeStubRow2: "absolute left-0 top-[66px] -translate-y-1/2 w-4 h-px bg-blue-200",
  // No margin, so the pill's own box (and its background) starts flush at
  // the connector line for every state, and the accent bar sits flush on
  // the box's own left edge instead of floating outside it with a gap.
  treeItem:
    "relative flex items-center gap-2.5 pl-4 pr-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus:outline-none",
  treeItemActive: "bg-blue-50 text-blue-600",
  treeItemInactive: "text-slate-600 hover:bg-blue-50/60 hover:text-blue-600",
  treeAccent: "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-blue-600",
  nav: "space-y-1 px-3",
  navButtonActive:
    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors bg-blue-50 text-blue-600 whitespace-nowrap focus:outline-none",
  navButtonInactive:
    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors text-slate-600 hover:bg-slate-50 whitespace-nowrap focus:outline-none",
  main: "flex-1 min-w-0 p-8",
};

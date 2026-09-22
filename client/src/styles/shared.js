// Tailwind class fragments reused by two or more *.styles.js files.
// Keeping them here means a shared visual tweak (e.g. the focus ring color)
// only needs to change in one place.

export const FOCUS_RING = "focus:outline-none focus:ring-2 focus:ring-blue-500";

export const FIELD_LABEL = "block text-xs font-semibold text-slate-700 mb-1";

// Pill-shaped active/disabled indicator used for account status, both as a
// static badge and as a clickable toggle (UserManagement's edit row).
export const statusBadge = (active, { interactive = false } = {}) => {
  const base =
    "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap";
  const color = active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500";
  const hover = !interactive ? "" : active ? "hover:bg-green-100 cursor-pointer" : "hover:bg-red-100 cursor-pointer";
  return [base, color, hover].filter(Boolean).join(" ");
};

export const statusDot = (active) =>
  `h-1 w-1 rounded-full ${active ? "bg-green-500" : "bg-red-500"}`;

// Single source of truth for task-state colors, used by the state badge on
// Plans & Tasks cards and by the Task Board's column headers.
export const STATE_COLORS = {
  Open: { text: "text-slate-600", ring: "border-slate-400", badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  "To Do": { text: "text-amber-600", ring: "border-amber-400", badge: "bg-amber-50 text-amber-600", dot: "bg-amber-500" },
  Doing: { text: "text-blue-600", ring: "border-blue-400", badge: "bg-blue-50 text-blue-600", dot: "bg-blue-500" },
  Done: { text: "text-green-600", ring: "border-green-400", badge: "bg-green-50 text-green-600", dot: "bg-green-600" },
  Closed: { text: "text-red-500", ring: "border-red-400", badge: "bg-red-50 text-red-500", dot: "bg-red-500" },
};

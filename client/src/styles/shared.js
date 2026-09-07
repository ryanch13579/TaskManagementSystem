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

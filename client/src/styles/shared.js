// Tailwind class strings used by more than one *.styles.js file.

export const FOCUS_RING = "focus:outline-none focus:ring-2 focus:ring-blue-500";

export const FIELD_LABEL = "block text-xs font-semibold text-slate-700 mb-1";

// Add to any button that might be disabled by onlyFor() (utils/roles.js).
// The `disabled:` prefix means it only applies while the button is disabled.
export const LOCKABLE = "disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed";

// Green "Active" / red "Disabled" pill for user accounts.
export const statusBadge = (active, { interactive = false } = {}) => {
  const base =
    "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap";
  const color = active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500";
  const hover = !interactive ? "" : active ? "hover:bg-green-100 cursor-pointer" : "hover:bg-red-100 cursor-pointer";
  return [base, color, hover].filter(Boolean).join(" ");
};

export const statusDot = (active) =>
  `h-1 w-1 rounded-full ${active ? "bg-green-500" : "bg-red-500"}`;

// One color set per task state, used everywhere a state is shown.
export const STATE_COLORS = {
  Open: { text: "text-slate-600", ring: "border-slate-400", badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  "To Do": { text: "text-amber-600", ring: "border-amber-400", badge: "bg-amber-50 text-amber-600", dot: "bg-amber-500" },
  Doing: { text: "text-blue-600", ring: "border-blue-400", badge: "bg-blue-50 text-blue-600", dot: "bg-blue-500" },
  Done: { text: "text-green-600", ring: "border-green-400", badge: "bg-green-50 text-green-600", dot: "bg-green-600" },
  Closed: { text: "text-red-500", ring: "border-red-400", badge: "bg-red-50 text-red-500", dot: "bg-red-500" },
};

// Small colored pill showing a task's state, e.g. "Doing".
export const stateBadge = (state) =>
  `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
    STATE_COLORS[state]?.badge ?? STATE_COLORS.Open.badge
  }`;

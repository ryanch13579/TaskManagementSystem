export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// The API sends dates as "2024-05-12 16:39:00" (or ISO "2024-05-12T16:39:00Z"
// inside task history). These helpers only look at the text, so there are
// no timezone surprises.

// "2024-05-12 ..." -> "12 May 2024"
export const formatDisplayDate = (value) => {
  if (!value) return "—";
  return new Date(`${toInputDate(value)}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// "2024-05-12 16:39:00" -> "16:39" (the time as written, no timezone conversion)
export const formatDisplayTime = (value) => {
  const match = String(value).match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
};

// Task history timestamps are real moments in time (ISO, in UTC), so unlike
// the helpers above they're converted to Singapore time for display.
const SG_TIME_ZONE = "Asia/Singapore";

// "2026-09-25T02:21:00Z" -> "25 Sept 2026"
export const formatSgDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        timeZone: SG_TIME_ZONE,
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// "2026-09-25T02:21:00Z" -> "10:21"
export const formatSgTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString("en-GB", {
        timeZone: SG_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";

// "2024-05-12 16:39:00" -> "2024-05-12", the format <input type="date"> uses.
export const toInputDate = (value) => (value ? String(value).slice(0, 10) : "");

// "2024-05-12" -> "12/05/2024"
export const toDMY = (value) => {
  if (!value) return "";
  const [yyyy, mm, dd] = value.split("-");
  return `${dd}/${mm}/${yyyy}`;
};

// "John Doe" -> "JD"
export const getInitials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

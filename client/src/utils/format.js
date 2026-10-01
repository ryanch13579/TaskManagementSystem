export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// The API sends every date as Singapore-time text, "2024-05-12 16:39:00".

// "2024-05-12 ..." -> "12 May 2024"
export const formatDisplayDate = (value) => {
  if (!value) return "—";
  return new Date(`${toInputDate(value)}T00:00:00`).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
};

// "2024-05-12 16:39:00" -> "16:39" (the time as written, no timezone conversion)
export const formatDisplayTime = (value) => {
  const match = String(value).match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
};

// "2024-05-12 16:39:00" -> "2024-05-12", the format <input type="date"> uses.
export const toInputDate = (value) => (value ? String(value).slice(0, 10) : "");

// "2024-05-12" -> "12/05/2024"
export const toDMY = (value) => {
  if (!value) return "";
  const [yyyy, mm, dd] = value.split("-");
  return `${dd}/${mm}/${yyyy}`;
};

// Create initials
// "John Doe" -> "JD"
export const getInitials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

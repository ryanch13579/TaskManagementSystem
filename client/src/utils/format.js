export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export const formatDate = (value) => new Date(value).toLocaleDateString();

// "2024-05-12" -> "12 May 2024", matching the style used across Plans/Tasks
// cards. Also accepts the full "yyyy-mm-dd hh:mm:ss" strings the API
// returns (mysql2's dateStrings mode) by taking just the date portion.
export const formatDisplayDate = (value) =>
  new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString(
    "en-GB",
    { day: "2-digit", month: "short", year: "numeric" },
  );

// "2024-05-12 16:39:00.123456" (mysql2 dateStrings) -> "16:39", for the
// Task History panel next to formatDisplayDate's date.
export const formatDisplayTime = (value) => {
  const match = String(value).match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
};

// "12 May 2024" -> "2024-05-12", for prefilling <input type="date">.
export const parseDisplayDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// "2024-05-12" -> "12/05/2024" - used by DateInput so the display format
// stays dd/mm/yyyy regardless of the browser's locale.
export const toDMY = (value) => {
  if (!value) return "";
  const [yyyy, mm, dd] = value.split("-");
  return `${dd}/${mm}/${yyyy}`;
};

// "John Doe" -> "JD", for the small owner-avatar chip on Task Board cards.
export const getInitials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

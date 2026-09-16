export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export const formatDate = (value) => new Date(value).toLocaleDateString();

// "2024-05-12" -> "12 May 2024", matching the style used across Plans/Tasks cards.
export const formatDisplayDate = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

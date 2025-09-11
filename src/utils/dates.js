/**
 * Formats a date string or Date object into a more readable format.
 * @param {string | Date} date - The date to format.
 * @returns {string} The formatted date string (e.g., "MM/DD/YYYY, hh:mm A") or an empty string if invalid.
 */
export function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  }).format(d);
}

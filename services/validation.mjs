/**
 * Input checks used by the handlers. Pure functions: no AWS, no status codes.
 * Each one returns true/false (or a list), and the handler decides the error.
 */

/**
 * Checks that the body is a plain object: not null and not an array.
 * Example: {} → true, null → false, [1] → false
 * @param body - event.body after httpJsonBodyParser
 */
export const isJsonObject = (body) =>
  typeof body === "object" && body !== null && !Array.isArray(body);

/**
 * Finds the required fields that are missing, not text, or only spaces.
 * Example: ({ name: "A", city: "  " }, ["name", "city", "coach"]) → ["city", "coach"]
 * @param body - the request body
 * @param fields - the names of the required fields
 * @returns the names of the bad fields, [] when all are fine
 */
export const missingFields = (body, fields) =>
  fields.filter(
    (field) => typeof body?.[field] !== "string" || body[field].trim() === "",
  );

/**
 * Checks that the value is a real date in the format YYYY-MM-DD.
 * Date.parse runs before toISOString, which crashes on dates like "2026-13-01".
 * The last check stops "2026-02-30", which JavaScript turns into 2 March.
 * @param value - the date to check
 */
export const isValidDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  if (Number.isNaN(Date.parse(value))) return false;
  return new Date(value).toISOString().slice(0, 10) === value;
};

/**
 * Checks that the value is an ISO 8601 date and time, e.g. "2026-11-20T14:00:00Z".
 * The regex is needed because Date.parse also accepts text like "Nov 20 2026".
 * @param value - the date-time to check
 */
export const isValidDateTime = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(
    value,
  ) &&
  !Number.isNaN(Date.parse(value));

/**
 * Checks that the value is a whole number, 0 or more.
 * Example: 0 → true, "5" → false, -1 → false, 2.5 → false
 * @param value - the score to check
 */
export const isValidScore = (value) => Number.isInteger(value) && value >= 0;

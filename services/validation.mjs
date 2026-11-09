// Checks that body is a plain object: not null and not an array.
// Example: {} → true, null → false, [1] → false
export const isJsonObject = (body) =>
  typeof body === 'object' && body !== null && !Array.isArray(body);

// Returns the names in fields that are missing, not text, or only spaces.
// Example: ({ name: 'A', city: '  ' }, ['name', 'city', 'coach']) → ['city', 'coach']
export const missingFields = (body, fields) =>
  fields.filter(
    (field) => typeof body?.[field] !== 'string' || body[field].trim() === '',
  );

// Checks that value is a real date in the format YYYY-MM-DD.
// Date.parse runs before toISOString, which crashes on dates like '2026-13-01'.
// The last check stops '2026-02-30', which JavaScript turns into 2 March.
export const isValidDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  if (Number.isNaN(Date.parse(value))) return false;
  return new Date(value).toISOString().slice(0, 10) === value;
};

// Checks that value is an ISO 8601 date and time, e.g. '2026-11-20T14:00:00Z'.
// The regex is needed because Date.parse also accepts text like 'Nov 20 2026'.
export const isValidDateTime = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(
    value,
  ) &&
  !Number.isNaN(Date.parse(value));

// Checks that value is a whole number, 0 or more.
// Example: 0 → true, '5' → false, -1 → false, 2.5 → false
export const isValidScore = (value) => Number.isInteger(value) && value >= 0;

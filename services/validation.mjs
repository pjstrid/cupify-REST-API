export const isJsonObject = (body) =>
  typeof body === "object" && body !== null && !Array.isArray(body);

export const missingFields = (body, fields) =>
  fields.filter(
    (field) => typeof body?.[field] !== "string" || body[field].trim() === "",
  );

export const isValidDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  if (Number.isNaN(Date.parse(value))) return false;
  return new Date(value).toISOString().slice(0, 10) === value;
};

export const isValidDateTime = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(value) &&
  !Number.isNaN(Date.parse(value));



export const isValidScore = (value) => Number.isInteger(value) && value >= 0;

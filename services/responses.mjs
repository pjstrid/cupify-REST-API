export const sendResponse = (statusCode, data) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

export const sendError = (statusCode, message) => 
    sendResponse(statusCode, { error: message });

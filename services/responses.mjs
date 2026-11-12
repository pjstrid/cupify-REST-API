/**
 * Helpers that build the response object API Gateway sends back to the client.
 */

/**
 * Builds a JSON response.
 * @param statusCode - the HTTP status code
 * @param data - the object or array to send. Leave it out for 204: then there is no body.
 * @returns { statusCode, headers, body } in the shape API Gateway expects
 */
export const sendResponse = (statusCode, data) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

/**
 * Builds an error response in the shape { "error": message }.
 * Used by errorHandler, never directly in a handler.
 * @param statusCode - the HTTP status code
 * @param message - a clear message for the client
 */
export const sendError = (statusCode, message) =>
  sendResponse(statusCode, { error: message });

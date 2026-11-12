/**
 * Middy middleware that turns every error into { "error": "…" } with the right status.
 * Replaces middy's httpErrorHandler, which answers with plain text.
 */
import { sendError } from "../services/responses.mjs";

/**
 * Handles errors thrown in a handler or in httpJsonBodyParser.
 * - 415 / 422 from httpJsonBodyParser (wrong content type, broken JSON, no body) → 400
 * - any other 4xx from createError → same status and message
 * - anything else → logged to CloudWatch, then a generic 500 without AWS details
 * @returns a middy middleware object with onError
 */
export const errorHandler = () => ({
  onError: async (request) => {
    const error = request.error;
    const status = error.statusCode;

    if (status === 415 || status === 422) {
      request.response = sendError(
        400,
        "Request body must be a valid JSON object",
      );
      return;
    }

    if (status >= 400 && status <= 499) {
      request.response = sendError(status, error.message);
      return;
    }

    console.error(error);
    request.response = sendError(500, "Internal server error");
  },
});

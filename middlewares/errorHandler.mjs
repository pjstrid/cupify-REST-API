import { sendError } from "../services/responses.mjs";

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

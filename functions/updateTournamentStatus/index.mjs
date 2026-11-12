/**
 * PATCH /tournaments/{id}/status
 * Changes only the status of a tournament.
 */
import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { createError } from "@middy/util";
import { sendResponse } from "../../services/responses.mjs";
import { isJsonObject, missingFields } from "../../services/validation.mjs";
import {
  getTournamentById,
  updateTournamentStatus,
} from "../../services/tournaments.mjs";
import { errorHandler } from "../../middlewares/errorHandler.mjs";

/**
 * Updates the status of a tournament. Name, sport, location and startDate never change.
 * @returns 200 with the updated tournament; 400 / 404 / 500 via errorHandler.
 */
const updateTournamentStatusHandler = async (event) => {
  const { id: tournamentId } = event.pathParameters;
  const data = event.body;

  if (!isJsonObject(data)) {
    throw createError(400, "Request body must be a valid JSON object");
  }
  const missing = missingFields(data, ["status"]);
  if (missing.length > 0) {
    throw createError(400, `Missing or empty fields: ${missing.join(", ")}`);
  }

  if (!["upcoming", "ongoing", "completed"].includes(data.status)) {
    throw createError(
      400,
      "status must be one of: upcoming, ongoing, completed",
    );
  }

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    throw createError(404, "Tournament not found");
  }

  const updated = await updateTournamentStatus(tournamentId, data.status);
  return sendResponse(200, updated);
};
export const handler = middy(updateTournamentStatusHandler)
  .use(httpJsonBodyParser())
  .use(errorHandler());

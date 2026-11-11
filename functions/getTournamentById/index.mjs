/**
 * GET /tournaments/{id}
 * Returns one tournament.
 */
import middy from "@middy/core";
import { createError } from "@middy/util";
import { sendResponse } from "../../services/responses.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";
import { errorHandler } from "../../middlewares/errorHandler.mjs";

/**
 * Gets a tournament by its id.
 * @returns 200 with the tournament; 404 / 500 via errorHandler.
 */
const getTournamentByIdHandler = async (event) => {
  const { id: tournamentId } = event.pathParameters;
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    throw createError(404, "Tournament not found");
  }
  return sendResponse(200, tournament);
};

export const handler = middy(getTournamentByIdHandler).use(errorHandler());

/**
 * GET /tournaments/{id}/matches/{matchId}
 * Returns one match in a tournament.
 */
import middy from "@middy/core";
import { createError } from "@middy/util";
import { sendResponse } from "../../services/responses.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";
import { getMatch } from "../../services/matches.mjs";
import { errorHandler } from "../../middlewares/errorHandler.mjs";

/**
 * Gets a match by its id, only from this tournament.
 * @returns 200 with the match; 404 / 500 via errorHandler.
 */
const getMatchByIdHandler = async (event) => {
  const { id: tournamentId, matchId } = event.pathParameters;

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    throw createError(404, "Tournament not found");
  }

  const match = await getMatch(tournamentId, matchId);
  if (!match) {
    throw createError(404, "Match not found");
  }

  return sendResponse(200, match);
};

export const handler = middy(getMatchByIdHandler).use(errorHandler());

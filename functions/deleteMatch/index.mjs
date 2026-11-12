/**
 * DELETE /tournaments/{id}/matches/{matchId}
 * Deletes a match, scheduled or completed.
 */
import middy from "@middy/core";
import { createError } from "@middy/util";
import { sendResponse } from "../../services/responses.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";
import { getMatch, deleteMatch } from "../../services/matches.mjs";
import { errorHandler } from "../../middlewares/errorHandler.mjs";

/**
 * Deletes a match. A deleted match no longer counts in the standings.
 * @returns 204 with no body; 404 / 500 via errorHandler.
 */
const deleteMatchHandler = async (event) => {
  const { id: tournamentId, matchId } = event.pathParameters;

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    throw createError(404, "Tournament not found");
  }

  const match = await getMatch(tournamentId, matchId);
  if (!match) {
    throw createError(404, "Match not found");
  }

  await deleteMatch(tournamentId, matchId);
  return sendResponse(204);
};

export const handler = middy(deleteMatchHandler).use(errorHandler());

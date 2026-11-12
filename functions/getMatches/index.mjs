/**
 * GET /tournaments/{id}/matches
 * Lists every match in a tournament.
 */
import middy from "@middy/core";
import { createError } from "@middy/util";
import { sendResponse } from "../../services/responses.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";
import { getMatchesByTournament } from "../../services/matches.mjs";
import { errorHandler } from "../../middlewares/errorHandler.mjs";

/**
 * Returns all matches in a tournament.
 * @returns 200 with an array of matches, [] when there are none; 404 / 500 via errorHandler.
 */
const getMatchesHandler = async (event) => {
  const { id: tournamentId } = event.pathParameters;

  const tournament = await getTournamentById(tournamentId);

  if (!tournament) {
    throw createError(404, "Tournament not found");
  }

  const matches = await getMatchesByTournament(tournamentId);

  return sendResponse(200, matches);
};

export const handler = middy(getMatchesHandler).use(errorHandler());

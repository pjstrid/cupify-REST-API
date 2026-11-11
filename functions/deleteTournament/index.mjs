/**
 * DELETE /tournaments/{id}
 * Deletes a tournament that has no teams and no matches.
 */
import middy from "@middy/core";
import { createError } from "@middy/util";
import { sendResponse } from "../../services/responses.mjs";
import {
  getTournamentById,
  deleteTournament,
} from "../../services/tournaments.mjs";
import { hasTeams } from "../../services/teams.mjs";
import { hasMatches } from "../../services/matches.mjs";
import { errorHandler } from "../../middlewares/errorHandler.mjs";

/**
 * Deletes a tournament when it is empty.
 * @returns 204 with no body; 404 / 409 / 500 via errorHandler.
 */
const deleteTournamentHandler = async (event) => {
  const { id: tournamentId } = event.pathParameters;
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    throw createError(404, "Tournament not found");
  }
  if ((await hasTeams(tournamentId)) || (await hasMatches(tournamentId))) {
    throw createError(
      409,
      "Tournament has teams or matches and cannot be deleted",
    );
  }
  await deleteTournament(tournamentId);
  return sendResponse(204);
};

export const handler = middy(deleteTournamentHandler).use(errorHandler());

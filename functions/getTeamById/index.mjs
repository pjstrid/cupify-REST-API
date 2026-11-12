/**
 * GET /tournaments/{id}/teams/{teamId}
 * Returns one team in a tournament.
 */
import middy from "@middy/core";
import { createError } from "@middy/util";
import { sendResponse } from "../../services/responses.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";
import { getTeam } from "../../services/teams.mjs";
import { errorHandler } from "../../middlewares/errorHandler.mjs";

/**
 * Gets a team by its id, only from this tournament.
 * @returns 200 with the team; 404 / 500 via errorHandler.
 */
const getTeamByIdHandler = async (event) => {
  const { id: tournamentId, teamId } = event.pathParameters;

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    throw createError(404, "Tournament not found");
  }

  const team = await getTeam(tournamentId, teamId);
  if (!team) {
    throw createError(404, "Team not found");
  }

  return sendResponse(200, team);
};

export const handler = middy(getTeamByIdHandler).use(errorHandler());

/**
 * DELETE /tournaments/{id}/teams/{teamId}
 * Deletes a team that is not used in any match.
 */
import middy from "@middy/core";
import { createError } from "@middy/util";
import { sendResponse } from "../../services/responses.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";
import { getTeam, deleteTeam } from "../../services/teams.mjs";
import { isTeamInAnyMatch } from "../../services/matches.mjs";
import { errorHandler } from "../../middlewares/errorHandler.mjs";

/**
 * Deletes a team when no match uses it, as home or away team.
 * @returns 204 with no body; 404 / 409 / 500 via errorHandler.
 */
const deleteTeamHandler = async (event) => {
  const { id: tournamentId, teamId } = event.pathParameters;

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    throw createError(404, "Tournament not found");
  }

  const team = await getTeam(tournamentId, teamId);
  if (!team) {
    throw createError(404, "Team not found");
  }

  const inMatch = await isTeamInAnyMatch(tournamentId, teamId);
  if (inMatch) {
    throw createError(409, "Team is used in a match and cannot be deleted");
  }

  await deleteTeam(tournamentId, teamId);
  return sendResponse(204);
};

export const handler = middy(deleteTeamHandler).use(errorHandler());

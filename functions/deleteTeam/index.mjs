import middy from "@middy/core";
import { createError } from "@middy/util";
import { errorHandler } from "../../middlewares/errorHandler.mjs";
import { sendResponse } from "../../services/responses.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";
import { getTeam, deleteTeam } from "../../services/teams.mjs";

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

  await deleteTeam(tournamentId, teamId);
  return sendResponse(204);
};

export const handler = middy(deleteTeamHandler).use(errorHandler());
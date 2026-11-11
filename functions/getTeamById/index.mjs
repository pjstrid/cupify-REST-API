import middy from "@middy/core";
import { createError } from "@middy/util";
import { errorHandler } from "../../middlewares/errorHandler.mjs";
import { sendResponse } from "../../services/responses.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";
import { getTeam } from "../../services/teams.mjs";

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

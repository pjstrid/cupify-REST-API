import middy from "@middy/core";
import { createError } from "@middy/util";
import { errorHandler } from "../../middlewares/errorHandler.mjs";
import { sendResponse } from "../../services/responses.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";
import { getTeamsByTournament } from "../../services/teams.mjs";

const getTeamsHandler = async (event) => {
  const { id: tournamentId } = event.pathParameters;

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    throw createError(404, "Tournament not found");
  }

  const teams = await getTeamsByTournament(tournamentId);

  return sendResponse(200, teams);
};

export const handler = middy(getTeamsHandler).use(errorHandler());

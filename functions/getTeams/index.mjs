/**
 * GET /tournaments/{id}/teams
 * Lists every team in a tournament.
 */
import middy from "@middy/core";
import { createError } from "@middy/util";
import { sendResponse } from "../../services/responses.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";
import { getTeamsByTournament } from "../../services/teams.mjs";
import { errorHandler } from "../../middlewares/errorHandler.mjs";

/**
 * Returns all teams in a tournament.
 * @returns 200 with an array of teams, [] when there are none; 404 / 500 via errorHandler.
 */
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

/**
 * PUT /tournaments/{id}/matches/{matchId}
 * Changes the teams and date of a match that has not been played yet.
 */
import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { createError } from "@middy/util";
import { sendResponse } from "../../services/responses.mjs";
import {
  isJsonObject,
  missingFields,
  isValidDateTime,
} from "../../services/validation.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";
import { getTeam } from "../../services/teams.mjs";
import { getMatch, updateMatch } from "../../services/matches.mjs";
import { errorHandler } from "../../middlewares/errorHandler.mjs";

/**
 * Updates the teams and date of a scheduled match. Status and scores never change here.
 * @returns 200 with the updated match; 400 / 404 / 409 / 500 via errorHandler.
 */
const updateMatchHandler = async (event) => {
  const { id: tournamentId, matchId } = event.pathParameters;

  if (!isJsonObject(event.body)) {
    throw createError(400, "Request body must be a valid JSON object");
  }

  const missing = missingFields(event.body, [
    "homeTeamId",
    "awayTeamId",
    "date",
  ]);

  if (missing.length > 0) {
    throw createError(400, `Missing or empty fields: ${missing.join(", ")}`);
  }

  const { homeTeamId, awayTeamId, date } = event.body;

  if (!isValidDateTime(date)) {
    throw createError(400, "date must be a valid ISO date-time");
  }

  if (homeTeamId === awayTeamId) {
    throw createError(400, "A team cannot play against itself");
  }

  const tournament = await getTournamentById(tournamentId);

  if (!tournament) {
    throw createError(404, "Tournament not found");
  }

  const match = await getMatch(tournamentId, matchId);

  if (!match) {
    throw createError(404, "Match not found");
  }

  const [homeTeam, awayTeam] = await Promise.all([
    getTeam(tournamentId, homeTeamId),
    getTeam(tournamentId, awayTeamId),
  ]);

  if (!homeTeam || !awayTeam) {
    throw createError(404, "Both teams must belong to this tournament");
  }

  if (match.status !== "scheduled") {
    throw createError(409, "Only scheduled matches can be updated");
  }

  const updatedMatch = await updateMatch(tournamentId, matchId, {
    homeTeamId,
    awayTeamId,
    date,
  });

  return sendResponse(200, updatedMatch);
};

export const handler = middy(updateMatchHandler)
  .use(httpJsonBodyParser())
  .use(errorHandler());

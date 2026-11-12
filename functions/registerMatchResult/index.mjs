/**
 * PATCH /tournaments/{id}/matches/{matchId}/result
 * Registers the final score of a scheduled match and marks it as completed.
 */
import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { createError } from "@middy/util";
import { sendResponse } from "../../services/responses.mjs";
import { isJsonObject, isValidScore } from "../../services/validation.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";
import { getMatch, registerMatchResult } from "../../services/matches.mjs";
import { errorHandler } from "../../middlewares/errorHandler.mjs";

/**
 * Registers the result of a match. A registered result can never be changed.
 * @returns 200 with the updated match; 400 / 404 / 409 / 500 via errorHandler.
 */
const registerMatchResultHandler = async (event) => {
  const { id: tournamentId, matchId } = event.pathParameters;
  if (!isJsonObject(event.body)) {
    throw createError(400, "Request body must be a valid JSON object");
  }

  const { homeScore, awayScore } = event.body;
  if (!isValidScore(homeScore) || !isValidScore(awayScore)) {
    throw createError(
      400,
      "homeScore and awayScore must be integers 0 or greater",
    );
  }

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    throw createError(404, "Tournament not found");
  }

  const match = await getMatch(tournamentId, matchId);
  if (!match) {
    throw createError(404, "Match not found");
  }
  if (match.status === "completed") {
    throw createError(409, "Match result is already registered");
  }

  const updatedMatch = await registerMatchResult(
    tournamentId,
    matchId,
    homeScore,
    awayScore,
  );
  return sendResponse(200, updatedMatch);
};

export const handler = middy(registerMatchResultHandler)
  .use(httpJsonBodyParser())
  .use(errorHandler());

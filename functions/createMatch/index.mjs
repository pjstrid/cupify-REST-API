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
import { createMatch } from "../../services/matches.mjs";
import { errorHandler } from "../../middlewares/errorHandler.mjs";

export const handler = middy(async (event) => {
  const tournamentId = event.pathParameters.id;

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

  const match = {
    id: crypto.randomUUID(),
    tournamentId,
    homeTeamId,
    awayTeamId,
    date,
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  };

  await createMatch(match);
  return sendResponse(201, match);
})
  .use(httpJsonBodyParser())
  .use(errorHandler());

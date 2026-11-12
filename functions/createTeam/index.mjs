/**
 * POST /tournaments/{id}/teams
 * Registers a new team in a tournament.
 */
import { randomUUID } from "node:crypto";
import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { createError } from "@middy/util";
import { sendResponse } from "../../services/responses.mjs";
import { isJsonObject, missingFields } from "../../services/validation.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";
import { createTeam } from "../../services/teams.mjs";
import { errorHandler } from "../../middlewares/errorHandler.mjs";

/**
 * Validates the body and saves a new team in the tournament.
 * @returns 201 with the created team; 400 / 404 / 500 via errorHandler.
 */
const createTeamHandler = async (event) => {
  const { id: tournamentId } = event.pathParameters;
  const data = event.body;

  if (!isJsonObject(data)) {
    throw createError(400, "Request body must be a valid JSON object");
  }

  const missing = missingFields(data, ["name", "city", "coach"]);
  if (missing.length > 0) {
    throw createError(400, `Missing or empty fields: ${missing.join(", ")}`);
  }

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    throw createError(404, "Tournament not found");
  }

  const team = {
    id: randomUUID(),
    tournamentId,
    name: data.name.trim(),
    city: data.city.trim(),
    coach: data.coach.trim(),
  };

  await createTeam(team);
  return sendResponse(201, team);
};

export const handler = middy(createTeamHandler)
  .use(httpJsonBodyParser())
  .use(errorHandler());

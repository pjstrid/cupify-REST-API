import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { createError } from "@middy/util";
import { errorHandler } from "../../middlewares/errorHandler.mjs";
import { sendResponse } from "../../services/responses.mjs";
import { isJsonObject, missingFields } from "../../services/validation.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";
import { getTeam, updateTeam } from "../../services/teams.mjs";

const updateTeamHandler = async (event) => {
  const { id: tournamentId, teamId } = event.pathParameters;
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

  const team = await getTeam(tournamentId, teamId);
  if (!team) {
    throw createError(404, "Team not found");
  }

  const updatedTeam = await updateTeam(tournamentId, teamId, {
    name: data.name.trim(),
    city: data.city.trim(),
    coach: data.coach.trim(),
  });

  return sendResponse(200, updatedTeam);
};

export const handler = middy(updateTeamHandler)
  .use(httpJsonBodyParser())
  .use(errorHandler());

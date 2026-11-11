import { randomUUID } from "node:crypto";
import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { createError } from "@middy/util";
import { errorHandler } from "../../middlewares/errorHandler.mjs";
import { sendResponse } from "../../services/responses.mjs";
import {
  isJsonObject,
  missingFields,
  isValidDate,
} from "../../services/validation.mjs";
import { createTournament } from "../../services/tournaments.mjs";

const createTournamentHandler = async (event) => {
  const data = event.body;

  if (!isJsonObject(data)) {
    throw createError(400, "Request body must be a valid JSON object");
  }
  const missing = missingFields(data, [
    "name",
    "sport",
    "location",
    "startDate",
  ]);
  if (missing.length > 0) {
    throw createError(400, `Missing or empty fields: ${missing.join(", ")}`);
  }
  if (!isValidDate(data.startDate)) {
    throw createError(400, "startDate must be a valid date (YYYY-MM-DD)");
  }

  const tournament = {
    name: data.name.trim(),
    id: randomUUID(),
    sport: data.sport.trim(),
    location: data.location.trim(),
    startDate: data.startDate,
    status: "upcoming",
  };

  await createTournament(tournament);

  return sendResponse(201, tournament);
};

export const handler = middy(createTournamentHandler)
  .use(httpJsonBodyParser())
  .use(errorHandler());

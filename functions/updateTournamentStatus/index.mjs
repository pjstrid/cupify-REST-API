import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { createError } from "@middy/util";
import { errorHandler } from "../../middlewares/errorHandler.mjs";
import { sendResponse } from "../../services/responses.mjs";
import { isJsonObject, missingFields } from "../../services/validation.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";
import { updateTournamentStatus } from "../../services/tournaments.mjs";


const updateTournamentStatusHandler = async(event) =>{
    const data = event.body;
  
  if (!isJsonObject(data)) {
    throw createError(400, "Request body must be a valid JSON object");
  }
     const missing = missingFields(data, ["status"]);
  if (missing.length > 0) {
    throw createError(400, `Missing or empty fields: ${missing.join(", ")}`);
  }

  if (!["upcoming", "ongoing", "completed"].includes(data.status)) {
    throw createError(400, "status must be one of: upcoming, ongoing, completed");
  }
    const id = event.pathParameters.id;
  const tournament = await getTournamentById(id);
  if (!tournament) {
    throw createError(404, "Tournament not found");
  }

  const updated = await updateTournamentStatus(id, data.status);
 return sendResponse(200, updated);
}
export const handler = middy(updateTournamentStatusHandler).use(httpJsonBodyParser()).use(errorHandler());
/**
 * GET /tournaments
 * Lists every tournament.
 */
import middy from "@middy/core";
import { sendResponse } from "../../services/responses.mjs";
import { getAllTournaments } from "../../services/tournaments.mjs";
import { errorHandler } from "../../middlewares/errorHandler.mjs";

/**
 * Returns all tournaments.
 * @returns 200 with an array of tournaments, [] when there are none; 500 via errorHandler.
 */
const getTournamentsHandler = async () => {
  const tournaments = await getAllTournaments();

  return sendResponse(200, tournaments);
};

export const handler = middy(getTournamentsHandler).use(errorHandler());

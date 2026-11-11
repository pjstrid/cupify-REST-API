import middy from "@middy/core";
import { errorHandler } from "../../middlewares/errorHandler.mjs";
import { sendResponse } from "../../services/responses.mjs";
import { getAllTournaments } from "../../services/tournaments.mjs";

const getTournamentsHandler = async () => {
  const tournaments = await getAllTournaments();

  return sendResponse(200, tournaments);
};
export const handler = middy(getTournamentsHandler).use(errorHandler());

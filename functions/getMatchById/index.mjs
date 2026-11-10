import { createError } from "@middy/util";
import { getTournamentById } from "../../services/tournaments.mjs";
import { getMatch } from "../../services/matches.mjs";
import { sendError, sendResponse } from "../../services/responses.mjs";
import middy from "@middy/core";
import { errorHandler } from "../../middlewares/errorHandler.mjs";

const getMatchByIdHandler = async (event) => {
  const { id: tournamentId, matchId } = event.pathParameters;

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    throw createError(404, "Tournament not found");
  }

  const match = await getMatch(tournamentId, matchId);
  if (!match) {
    throw createError(404, "Match not found");
  }

  return sendResponse(200, match);
};

export const handler = middy(getMatchByIdHandler).use(errorHandler());

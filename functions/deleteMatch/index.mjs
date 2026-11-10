import middy from "@middy/core";
import { deleteMatch, getMatch } from "../../services/matches.mjs";
import { sendResponse } from "../../services/responses.mjs";
import { errorHandler } from "../../middlewares/errorHandler.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";

const deleteMatchHandler = async (event) => {
  const { id: tournamentId, matchId } = event.pathParameters;

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    throw createError(404, "Tournament not found");
  }

  const match = await getMatch(tournamentId, matchId);
  if (!match) {
    throw createError(404, "Match not found");
  }

  await deleteMatch(tournamentId, matchId);
  return sendResponse(204);
};

export const handler = middy(deleteMatchHandler).use(errorHandler());

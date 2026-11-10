import middy from "@middy/core";
import { getMatchesByTournament } from "../../services/matches.mjs";
import { sendResponse } from "../../services/responses.mjs";
import { errorHandler } from "../../middlewares/errorHandler.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";
import { createError } from "@middy/util";

const getMatchesHandler = async (event) => {

    const { id : tournamentId } = event.pathParameters;

    const tournament = await getTournamentById(tournamentId);

    if(!tournament) {
        throw createError(404, "Tournament not found");
    }

  const matches = await getMatchesByTournament(tournamentId);

  return sendResponse(200, matches);
};

export const handler = middy(getMatchesHandler).use(errorHandler());
import middy from "@middy/core";
import { errorHandler } from "../../middlewares/errorHandler.mjs";
import {
  getTournamentById,
  deleteTournament,
} from "../../services/tournaments.mjs";
import { hasTeams } from "../../services/teams.mjs";
import { hasMatches } from "../../services/matches.mjs";
import { createError } from "@middy/util";
import { sendResponse } from "../../services/responses.mjs";

const deleteTournamentHandler = async (event) => {
  const id = event.pathParameters.id;
  const tournament = await getTournamentById(id);
  if (!tournament) {
    throw createError(404, "Tournament not found");
  }
  if ((await hasTeams(id)) || (await hasMatches(id))) {
    throw createError(
      409,
      "Tournament has teams or matches and cannot be deleted",
    );
  }
  await deleteTournament(id);
  return sendResponse(204);
};
export const handler = middy(deleteTournamentHandler).use(errorHandler());

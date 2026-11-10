import middy from "@middy/core";
import { errorHandler } from "../../middlewares/errorHandler.mjs";
import { sendResponse } from "../../services/responses.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";
import { createError } from "@middy/util";


const getTournamentByIdHandler = async(event) =>{
const tournament = await getTournamentById(event.pathParameters.id);
if (!tournament){
throw createError(404, "Tournament not found");
}
return sendResponse(200, tournament)
};

export const handler = middy(getTournamentByIdHandler).use(errorHandler());
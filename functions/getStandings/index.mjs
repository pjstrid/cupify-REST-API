/**
 * GET /tournaments/{id}/standings: the league table for a tournament,
 * computed from its completed matches on every request.
 */
import middy from "@middy/core";
import { createError } from "@middy/util";
import { sendResponse } from "../../services/responses.mjs";
import { getTournamentById } from "../../services/tournaments.mjs";
import { getTeamsByTournament } from "../../services/teams.mjs";
import { getMatchesByTournament } from "../../services/matches.mjs";
import { errorHandler } from "../../middlewares/errorHandler.mjs";

/**
 * Builds the standings for one tournament.
 * @returns 200 with an array of rows sorted by points, then goal difference; 404 / 500 via errorHandler.
 */
export const handler = middy(async (event) => {
  const tournamentId = event.pathParameters.id;

  const tournament = await getTournamentById(tournamentId);

  if (!tournament) {
    throw createError(404, "Tournament not found");
  }

  const [teams, matches] = await Promise.all([
    getTeamsByTournament(tournamentId),
    getMatchesByTournament(tournamentId),
  ]);

  const rows = {};
  for (const team of teams) {
    rows[team.id] = {
      teamId: team.id,
      teamName: team.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  }

  for (const match of matches) {
    if (match.status !== "completed") continue;

    const home = rows[match.homeTeamId];
    const away = rows[match.awayTeamId];
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.wins++;
      home.points += 3;
      away.losses++;
    } else if (match.homeScore < match.awayScore) {
      away.wins++;
      away.points += 3;
      home.losses++;
    } else {
      home.draws++;
      away.draws++;
      home.points += 1;
      away.points += 1;
    }
  }

  const standings = Object.values(rows);

  for (const row of standings) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
  }

  standings.sort(
    (a, b) => b.points - a.points || b.goalDifference - a.goalDifference,
  );
  return sendResponse(200, standings);
}).use(errorHandler());

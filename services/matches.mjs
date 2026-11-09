/**
 * Data layer for matches: every DynamoDB call for the cupify-matches table.
 * Functions only read and write. The handlers decide what a missing item means.
 */
import {
  QueryCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

import { db, TABLES } from "./db.mjs";

/**
 * Lists every match in a tournament.
 * @param tournamentId - id of the tournament
 * @returns array of matches, [] when there are none
 */
export const getMatchesByTournament = async (tournamentId) => {
  const { Items } = await db.send(
    new QueryCommand({
      TableName: TABLES.matches,
      KeyConditionExpression: "tournamentId = :tournamentId",
      ExpressionAttributeValues: {
        ":tournamentId": tournamentId,
      },
    }),
  );
  return Items;
};

/**
 * Gets one match in a tournament.
 * @param tournamentId - id of the tournament
 * @param matchId - id of the match
 * @returns the match, or undefined when it doesn't exist in this tournament
 */
export const getMatch = async (tournamentId, matchId) => {
  const { Item } = await db.send(
    new GetCommand({
      TableName: TABLES.matches,
      Key: {
        tournamentId,
        id: matchId,
      },
    }),
  );
  return Item;
};

/**
 * Saves a new match.
 * @param match - the complete match item, built by the handler
 * @returns the same match
 */
export const createMatch = async (match) => {
  await db.send(
    new PutCommand({
      TableName: TABLES.matches,
      Item: match,
    }),
  );
  return match;
};

/**
 * Deletes a match.
 * @param tournamentId - id of the tournament
 * @param matchId - id of the match
 */
export const deleteMatch = async (tournamentId, matchId) => {
  await db.send(
    new DeleteCommand({
      TableName: TABLES.matches,
      Key: {
        tournamentId,
        id: matchId,
      },
    }),
  );
};

/**
 * Replaces the teams and date of a match. Status and scores are left untouched.
 * @param tournamentId - id of the tournament
 * @param matchId - id of the match
 * @param fields - the new homeTeamId, awayTeamId and date
 * @returns the updated match
 */
export const updateMatch = async (
  tournamentId,
  matchId,
  { homeTeamId, awayTeamId, date },
) => {
  const { Attributes } = await db.send(
    new UpdateCommand({
      TableName: TABLES.matches,
      Key: {
        tournamentId,
        id: matchId,
      },
      UpdateExpression:
        "SET homeTeamId = :homeTeamId, awayTeamId = :awayTeamId, #date = :date",
      ExpressionAttributeNames: {
        "#date": "date",
      },
      ExpressionAttributeValues: {
        ":homeTeamId": homeTeamId,
        ":awayTeamId": awayTeamId,
        ":date": date,
      },
      ReturnValues: "ALL_NEW",
    }),
  );
  return Attributes;
};

/**
 * Saves the final score of a match and marks it as completed.
 * @param tournamentId - id of the tournament
 * @param matchId - id of the match
 * @param homeScore - goals scored by the home team
 * @param awayScore - goals scored by the away team
 * @returns the updated match
 */
export const registerMatchResult = async (
  tournamentId,
  matchId,
  homeScore,
  awayScore,
) => {
  const { Attributes } = await db.send(
    new UpdateCommand({
      TableName: TABLES.matches,
      Key: {
        tournamentId,
        id: matchId,
      },
      UpdateExpression:
        "SET homeScore = :homeScore, awayScore = :awayScore, #status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":homeScore": homeScore,
        ":awayScore": awayScore,
        ":status": "completed",
      },
      ReturnValues: "ALL_NEW",
    }),
  );
  return Attributes;
};

/**
 * Checks if a tournament has at least one match.
 * @param tournamentId - id of the tournament
 * @returns true when the tournament has matches, otherwise false
 */
export const hasMatches = async (tournamentId) => {
  const { Items } = await db.send(
    new QueryCommand({
      TableName: TABLES.matches,
      KeyConditionExpression: "tournamentId = :tournamentId",
      ExpressionAttributeValues: {
        ":tournamentId": tournamentId,
      },
      Limit: 1,
    }),
  );
  return Items.length > 0;
};

/**
 * Checks if a team plays, home or away, in any match of a tournament.
 * @param tournamentId - id of the tournament
 * @param teamId - id of the team
 * @returns true when the team is in at least one match, otherwise false
 */
export const isTeamInAnyMatch = async (tournamentId, teamId) => {
  const { Items } = await db.send(
    new QueryCommand({
      TableName: TABLES.matches,
      KeyConditionExpression: "tournamentId = :tournamentId",
      FilterExpression: "homeTeamId = :teamId OR awayTeamId = :teamId",
      ExpressionAttributeValues: {
        ":tournamentId": tournamentId,
        ":teamId": teamId,
      },
    }),
  );
  return Items.length > 0;
};

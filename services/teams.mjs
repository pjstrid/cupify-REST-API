import { GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db, TABLES } from "./db.mjs";


/**
 * Lists every team in a tournament.
 * @param tournamentId - id of the tournament
 * @returns array of teams, [] when there are none
 */
export const getTeamsByTournament = async (tournamentId) => {
    const { Items } = await db.send(
        new QueryCommand({
            TableName: TABLES.teams,
            KeyConditionExpression: "tournamentId = :tournamentId",
            ExpressionAttributeValues: {
                ":tournamentId": tournamentId,
            },
        }),
    );
    return Items ?? [];
}


/**
 * Gets one team in a tournament.
 * @param tournamentId - id of the tournament
 * @param teamId - id of the team
 * @returns the team, or undefined when it doesn't exist in this tournament
 */
export const getTeam = async (tournamentId, teamId) => {
    const { Item } = await db.send(
        new GetCommand({
            TableName: TABLES.teams,
            Key: {
                tournamentId,
                id: teamId,
            },
        }),
    );
    return Item;
}

/**
 * Saves a new team.
 * @param team - the complete team, built by the handler
 * @returns the same team
 */
export const createTeam = async (team) => {
  await db.send(
    new PutCommand({
      TableName: TABLES.teams,
      Item: team,
    }),
  );
  return team;
};


/**
 * Replaces the name, city and coach of a team. id and tournamentId never change.
 * @param tournamentId - id of the tournament
 * @param teamId - id of the team
 * @param fields - the new name, city and coach
 * @returns the updated team
 */

export const updateTeam = async (
    tournamentId,
    teamId,
    { name, city, coach },
) => {
    const { Attributes } = await db.send(
        new UpdateCommand({
            TableName: TABLES.teams,
            Key: {
                tournamentId,
                id: teamId,
            },
            UpdateExpression: 
            "SET #name = :name, city = :city, coach = :coach",
            ExpressionAttributeNames: {
                "#name": "name",
            },
            ExpressionAttributeValues: {
                ":name": name,
                ":city": city,
                ":coach": coach,
            },
            ReturnValues: "ALL_NEW",
        }),
    );
    return Attributes;
}


/**
 * Deletes a team.
 * @param tournamentId - id of the tournament
 * @param teamId - id of the team
 */
export const deleteTeam = async (tournamentId, teamId) => {
  await db.send(
    new DeleteCommand({
      TableName: TABLES.teams,
      Key: {
        tournamentId,
        id: teamId,
      },
    }),
  );
};
 

/**
 * Checks if a tournament has at least one team.
 * @param tournamentId - id of the tournament
 * @returns true when the tournament has teams, otherwise false
 */
export const hasTeams = async (tournamentId) => {
    const { Items } = await db.send(
        new QueryCommand({
            TableName: TABLES.teams,
            KeyConditionExpression: "tournamentId = :tournamentId",
            ExpressionAttributeValues: {
                ":tournamentId": tournamentId,
            },
            Limit: 1,
        }),
    );
    return Items.length > 0;
};
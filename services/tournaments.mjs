/**
 * Data layer for tournaments: every DynamoDB call for the cupify-tournaments table.
 * Functions only read and write. The handlers decide what a missing item means.
 */
import {
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { db, TABLES } from "./db.mjs";

/**
 * Lists every tournament.
 * A Scan reads the whole table. That is fine here: listing all tournaments has no key to query on.
 * @returns array of tournaments, [] when there are none
 */
export const getAllTournaments = async () => {
  const { Items } = await db.send(
    new ScanCommand({
      TableName: TABLES.tournaments,
    }),
  );
  return Items;
};

/**
 * Gets one tournament.
 * @param id - id of the tournament
 * @returns the tournament, or undefined when it doesn't exist
 */
export const getTournamentById = async (id) => {
  const { Item } = await db.send(
    new GetCommand({
      TableName: TABLES.tournaments,
      Key: { id },
    }),
  );
  return Item;
};

/**
 * Saves a new tournament.
 * @param tournament - the complete tournament item, built by the handler
 * @returns the same tournament
 */
export const createTournament = async (tournament) => {
  await db.send(
    new PutCommand({
      TableName: TABLES.tournaments,
      Item: tournament,
    }),
  );
  return tournament;
};

/**
 * Changes only the status of a tournament.
 * @param id - id of the tournament
 * @param status - the new status: upcoming, ongoing or completed
 * @returns the updated tournament
 */
export const updateTournamentStatus = async (id, status) => {
  const { Attributes } = await db.send(
    new UpdateCommand({
      TableName: TABLES.tournaments,
      Key: { id },
      UpdateExpression: "SET #status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": status },
      ReturnValues: "ALL_NEW",
    }),
  );
  return Attributes;
};

/**
 * Deletes a tournament.
 * @param id - id of the tournament
 */
export const deleteTournament = async (id) => {
  await db.send(
    new DeleteCommand({
      TableName: TABLES.tournaments,
      Key: { id },
    }),
  );
};

import {
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { db, TABLES } from "./db.mjs";

export const createTournament = async (tournament) => {
  await db.send(
    new PutCommand({
      TableName: TABLES.tournaments,
      Item: tournament,
    }),
  );
  return tournament;
};

export const getAllTournaments = async () => {
  const result = await db.send(
    new ScanCommand({
      TableName: TABLES.tournaments,
    }),
  );
  return result.Items;
};

export const getTournamentById = async (id) => {
  const result = await db.send(
    new GetCommand({
      TableName: TABLES.tournaments,
      Key: { id },
    }),
  );
  return result.Item;
};

export const updateTournamentStatus = async (id, status) => {
  const result = await db.send(
    new UpdateCommand({
      TableName: TABLES.tournaments,
      Key: { id },
      UpdateExpression: "SET #status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": status },
      ReturnValues: "ALL_NEW",
    }),
  );
  return result.Attributes;
};

export const deleteTournament = async (id) => {
  await db.send(
    new DeleteCommand({
      TableName: TABLES.tournaments,
      Key: { id },
    }),
  );
};

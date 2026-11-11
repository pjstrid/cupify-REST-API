import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

export const db = DynamoDBDocumentClient.from(client);

export const TABLES = {
  tournaments: "cupify-tournaments",
  teams: "cupify-teams",
  matches: "cupify-matches",
};

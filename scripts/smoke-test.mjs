/**
 * Smoke test for the Cupify API.
 * Sends real HTTP requests to a deployed API and checks the status code and body of every endpoint.
 * Creates its own test data ("Smoke Cup") and deletes all of it at the end.
 *
 * Usage: npm run smoke -- <API URL>
 */

const baseUrl = process.argv[2]?.replace(/\/$/, "");

if (!baseUrl) {
  console.error("Usage: npm run smoke -- <API URL>");
  console.error(
    "Example: npm run smoke -- https://abc123.execute-api.eu-north-1.amazonaws.com",
  );
  process.exit(1);
}

const results   =  [];
const created = { tournaments: [], teams: [], matches: [] };

/**
 * Sends one request to the API and reads the answer.
 * @param method - HTTP method, like "GET" or "POST"
 * @param path - the path after the base URL, like "/tournaments"
 * @param body - an object to send as JSON (optional)
 * @param options - { rawBody, contentType } to send a body exactly as written, for the broken-body checks
 * @returns the status code, the raw text and the parsed JSON (json is undefined when the body is empty)
 */
const request = async (method, path, body, options = {}) => {
  const headers = {};
  let payload;

  if (options.rawBody !== undefined) {
    payload = options.rawBody;
    headers["Content-Type"] = options.contentType ?? "application/json";
  } else if (body !== undefined) {
    payload = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(baseUrl + path, {
    method,
    headers,
    body: payload,
  });

  const text = await response.text();

  let json;
  try {
    json = text === "" ? undefined : JSON.parse(text);
  } catch {
    json = undefined;
  }

  return { status: response.status, text, json };
};

/**
 * Compares one response with what the API spec expects and saves a result row.
 * @param name - a short name for the row, like "POST tournament"
 * @param response - what request() returned
 * @param expectedStatus - the status code the spec expects
 * @param test - optional: gets the response and returns true, or a reason why the body is wrong
 */
const check = (name, response, expectedStatus, test) => {
  let reason = "";

  if (response.status !== expectedStatus) {
    reason = response.json?.error ?? response.text.slice(0, 80);
  } else if (test) {
    try {
      const outcome = test(response);
      if (outcome !== true) {
        reason = outcome || "body check failed";
      }
    } catch (error) {
      reason = error.message;
    }
  }

  results.push({
    ok: reason === "" ? "✅" : "❌",
    name,
    expected: expectedStatus,
    got: response.status,
    reason,
  });
};

/**
 * Builds a test that checks the exact error message in the body.
 * @param message - the message the API spec expects, like "Tournament not found"
 * @returns a test function for check()
 */
const hasError = (message) => (response) =>
  response.json?.error === message ||
  `error was ${JSON.stringify(response.json)}`;

const UNKNOWN_ID = "does-not-exist";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// ============================= TEST TOURNAMENTS ======================================================

/**
 * Checks the tournament endpoints (except delete) and creates the tournament the other checks use.
 * @returns the id of the created tournament
 */
const testTournaments = async () => {
  const createResponse = await request("POST", "/tournaments", {
    name: " Smoke Cup ",
    sport: "Football",
    location: "Göteborg",
    startDate: "2026-11-20",
    id: "my-own-id",
    status: "completed",
  });

  check("POST tournament", createResponse, 201, (response) => {
    const tournament = response.json;
    if (!UUID_PATTERN.test(tournament.id)) {
      return `id is not a UUID: ${tournament.id}`;
    }
    if (tournament.status !== "upcoming") {
      return `status is ${tournament.status}`;
    }
    if (tournament.name !== "Smoke Cup") {
      return `name is "${tournament.name}"`;
    }
    const fields = Object.keys(tournament).join(", ");
    if (fields !== "id, name, sport, location, startDate, status") {
      return `fields in wrong order: ${fields}`;
    }
    return true;
  });

  const tournamentId = createResponse.json?.id;
  if (!tournamentId) {
    throw new Error("Could not create the test tournament");
  }
  created.tournaments.push(tournamentId);

  check(
    "POST tournament missing fields",
    await request("POST", "/tournaments", { name: "Cup" }),
    400,
    hasError("Missing or empty fields: sport, location, startDate"),
  );

  for (const startDate of ["2026-02-30", "2026-13-01"]) {
    check(
      `POST tournament ${startDate}`,
      await request("POST", "/tournaments", {
        name: "Cup",
        sport: "Football",
        location: "Kungsbacka",
        startDate,
      }),
      400,
      hasError("startDate must be a valid date (YYYY-MM-DD)"),
    );
  }

  const brokenBodies = [
    { name: "broken JSON", rawBody: "{name:" },
    { name: "body null", rawBody: "null" },
    { name: "body array", rawBody: "[1]" },
    { name: "text/plain", rawBody: "{}", contentType: "text/plain" },
  ];
  for (const { name, ...options } of brokenBodies) {
    check(
      `POST tournament ${name}`,
      await request("POST", "/tournaments", undefined, options),
      400,
      hasError("Request body must be a valid JSON object"),
    );
  }

  check(
    "GET tournaments",
    await request("GET", "/tournaments"),
    200,
    (response) =>
      (Array.isArray(response.json) &&
        response.json.some((tournament) => tournament.id === tournamentId)) ||
      "not an array with the test tournament",
  );

  check(
    "GET tournament by id",
    await request("GET", `/tournaments/${tournamentId}`),
    200,
    (response) =>
      response.json.id === tournamentId || JSON.stringify(response.json),
  );

  check(
    "GET tournament unknown",
    await request("GET", `/tournaments/${UNKNOWN_ID}`),
    404,
    hasError("Tournament not found"),
  );

  check(
    "PATCH status",
    await request("PATCH", `/tournaments/${tournamentId}/status`, {
      status: "ongoing",
      name: "Changed",
    }),
    200,
    (response) =>
      (response.json.status === "ongoing" &&
        response.json.name === "Smoke Cup") ||
      JSON.stringify(response.json),
  );

  check(
    "PATCH status invalid",
    await request("PATCH", `/tournaments/${tournamentId}/status`, {
      status: "Ongoing",
    }),
    400,
    hasError("status must be one of: upcoming, ongoing, completed"),
  );
  check(
    "PATCH status unknown tournament",
    await request("PATCH", `/tournaments/${UNKNOWN_ID}/status`, {
      status: "ongoing",
    }),
    404,
    hasError("Tournament not found"),
  );

  return tournamentId;
};

// ============================= TEST TEAMS ======================================================

/**
 * Checks the team endpoints (except delete) and creates the three teams the match checks use.
 * Also creates a second tournament with one team, for the "team from another tournament" checks.
 * @param tournamentId - the id of the test tournament
 * @returns the ids { teamA, teamB, teamC, otherTournamentId, foreignTeamId }
 */
const testTeams = async (tournamentId) => {
  const teamIds = [];

  for (const letter of ["A", "B", "C"]) {
    const response = await request(
      "POST",
      `/tournaments/${tournamentId}/teams`,
      {
        name: ` Team ${letter} `,
        city: "Landvetter",
        coach: "Anna",
        id: "my-own-id",
        tournamentId: "my-own-tournament",
      },
    );
    check(`POST team ${letter}`, response, 201, (r) => {
      const team = r.json;
      if (!UUID_PATTERN.test(team.id)) {
        return `id is not a UUID: ${team.id}`;
      }
      if (team.tournamentId !== tournamentId) {
        return `tournamentId is ${team.tournamentId}`;
      }
      if (team.name !== `Team ${letter}`) {
        return `name is "${team.name}"`;
      }
      const fields = Object.keys(team).join(", ");
      if (fields !== "id, tournamentId, name, city, coach") {
        return `fields in wrong order: ${fields}`;
      }
      return true;
    });

    const teamId = response.json?.id;
    if (!teamId) {
      throw new Error(`Could not create Team ${letter}`);
    }
    teamIds.push(teamId);
    created.teams.push({ tournamentId, id: teamId });
  }

  const [teamA, teamB, teamC] = teamIds;

  check(
    "POST team only spaces",
    await request("POST", `/tournaments/${tournamentId}/teams`, {
      name: "Team X",
      city: "   ",
      coach: "Anna",
    }),
    400,
    hasError("Missing or empty fields: city"),
  );

  check(
    "POST team unknown tournament",
    await request("POST", `/tournaments/${UNKNOWN_ID}/teams`, {
      name: "Team X",
      city: "Landvetter",
      coach: "Anna",
    }),
    404,
    hasError("Tournament not found"),
  );

  check(
    "GET teams",
    await request("GET", `/tournaments/${tournamentId}/teams`),
    200,
    (response) =>
      (Array.isArray(response.json) && response.json.length === 3) ||
      `got ${JSON.stringify(response.json)}`,
  );

  check(
    "GET teams unknown tournament",
    await request("GET", `/tournaments/${UNKNOWN_ID}/teams`),
    404,
    hasError("Tournament not found"),
  );

  check(
    "GET team by id",
    await request("GET", `/tournaments/${tournamentId}/teams/${teamA}`),
    200,
    (response) => response.json.id === teamA || JSON.stringify(response.json),
  );

  check(
    "GET team unknown",
    await request("GET", `/tournaments/${tournamentId}/teams/${UNKNOWN_ID}`),
    404,
    hasError("Team not found"),
  );

  check(
    "PUT team",
    await request("PUT", `/tournaments/${tournamentId}/teams/${teamA}`, {
      name: "Team A",
      city: "Göteborg",
      coach: "Bo",
      id: "my-own-id",
      tournamentId: "my-own-tournament",
    }),
    200,
    (response) =>
      (response.json.id === teamA &&
        response.json.tournamentId === tournamentId &&
        response.json.city === "Göteborg") ||
      JSON.stringify(response.json),
  );

  check(
    "PUT team empty body",
    await request("PUT", `/tournaments/${tournamentId}/teams/${teamA}`, {}),
    400,
    hasError("Missing or empty fields: name, city, coach"),
  );

  check(
    "PUT team unknown",
    await request("PUT", `/tournaments/${tournamentId}/teams/${UNKNOWN_ID}`, {
      name: "Team X",
      city: "Landvetter",
      coach: "Anna",
    }),
    404,
    hasError("Team not found"),
  );

  const otherResponse = await request("POST", "/tournaments", {
    name: "Smoke Cup 2",
    sport: "Football",
    location: "Kungsbacka",
    startDate: "2026-11-21",
  });
  const otherTournamentId = otherResponse.json?.id;
  if (!otherTournamentId) {
    throw new Error("Could not create the second test tournament");
  }
  created.tournaments.push(otherTournamentId);

  const foreignResponse = await request(
    "POST",
    `/tournaments/${otherTournamentId}/teams`,
    { name: "Foreign Team", city: "Kungsbacka", coach: "Anna" },
  );
  const foreignTeamId = foreignResponse.json?.id;
  if (!foreignTeamId) {
    throw new Error("Could not create the team in the second tournament");
  }
  created.teams.push({ tournamentId: otherTournamentId, id: foreignTeamId });

  check(
    "GET team via other tournament URL",
    await request("GET", `/tournaments/${otherTournamentId}/teams/${teamA}`),
    404,
    hasError("Team not found"),
  );

  return { teamA, teamB, teamC, otherTournamentId, foreignTeamId };
};

// ============================= TEST MATCHES ======================================================

const MATCH_DATE = "2026-11-20T14:00:00Z";

/**
 * Checks the match endpoints (except delete), including the result.
 * Leaves one completed match: Team A against Team C, 2–1.
 * @param ids - the ids from testTournaments and testTeams
 * @returns the id of the completed match
 */
const testMatches = async ({
  tournamentId,
  teamA,
  teamB,
  teamC,
  otherTournamentId,
  foreignTeamId,
}) => {
  const matchesPath = `/tournaments/${tournamentId}/matches`;

  const createResponse = await request("POST", matchesPath, {
    homeTeamId: teamA,
    awayTeamId: teamB,
    date: MATCH_DATE,
    id: "my-own-id",
    status: "completed",
    homeScore: 9,
  });
  check("POST match", createResponse, 201, (response) => {
    const match = response.json;
    if (!UUID_PATTERN.test(match.id)) {
      return `id is not a UUID: ${match.id}`;
    }
    if (match.status !== "scheduled") {
      return `status is ${match.status}`;
    }
    if (match.homeScore !== null || match.awayScore !== null) {
      return `scores are ${match.homeScore}–${match.awayScore}`;
    }

    const fields = Object.keys(match).join(", ");
    if (
      fields !==
      "id, tournamentId, homeTeamId, awayTeamId, date, status, homeScore, awayScore"
    ) {
      return `fields in wrong order: ${fields}`;
    }
    return true;
  });

  const matchId = createResponse.json?.id;
  if (!matchId) {
    throw new Error("Could not create the test match");
  }
  created.matches.push({ tournamentId, id: matchId });

  check(
    "POST match same team",
    await request("POST", matchesPath, {
      homeTeamId: teamA,
      awayTeamId: teamA,
      date: MATCH_DATE,
    }),
    400,
    hasError("A team cannot play against itself"),
  );

  check(
    "POST match bad date",
    await request("POST", matchesPath, {
      homeTeamId: teamA,
      awayTeamId: teamB,
      date: "Nov 20 2026",
    }),
    400,
    hasError("date must be a valid ISO date-time"),
  );

  check(
    "POST match foreign team",
    await request("POST", matchesPath, {
      homeTeamId: teamA,
      awayTeamId: foreignTeamId,
      date: MATCH_DATE,
    }),
    404,
    hasError("Both teams must belong to this tournament"),
  );

  check(
    "POST match unknown tournament",
    await request("POST", `/tournaments/${UNKNOWN_ID}/matches`, {
      homeTeamId: teamA,
      awayTeamId: teamB,
      date: MATCH_DATE,
    }),
    404,
    hasError("Tournament not found"),
  );

  check(
    "GET matches",
    await request("GET", matchesPath),
    200,
    (response) =>
      (Array.isArray(response.json) && response.json.length === 1) ||
      `got ${JSON.stringify(response.json)}`,
  );

  check(
    "GET matches empty list",
    await request("GET", `/tournaments/${otherTournamentId}/matches`),
    200,
    (response) => response.text === "[]" || `body: ${response.text}`,
  );

  check(
    "GET matches unknown tournament",
    await request("GET", `/tournaments/${UNKNOWN_ID}/matches`),
    404,
    hasError("Tournament not found"),
  );

  check(
    "GET match by id",
    await request("GET", `${matchesPath}/${matchId}`),
    200,
    (response) => response.json.id === matchId || JSON.stringify(response.json),
  );

  check(
    "GET match unknown",
    await request("GET", `${matchesPath}/${UNKNOWN_ID}`),
    404,
    hasError("Match not found"),
  );

  check(
    "PUT match",
    await request("PUT", `${matchesPath}/${matchId}`, {
      homeTeamId: teamA,
      awayTeamId: teamC,
      date: "2026-11-21T15:00:00Z",
      status: "completed",
      homeScore: 5,
    }),
    200,
    (response) =>
      (response.json.awayTeamId === teamC &&
        response.json.date === "2026-11-21T15:00:00Z" &&
        response.json.status === "scheduled" &&
        response.json.homeScore === null) ||
      JSON.stringify(response.json),
  );

  check(
    "PUT match foreign team",
    await request("PUT", `${matchesPath}/${matchId}`, {
      homeTeamId: teamA,
      awayTeamId: foreignTeamId,
      date: MATCH_DATE,
    }),
    404,
    hasError("Both teams must belong to this tournament"),
  );

  check(
    "PUT match unknown",
    await request("PUT", `${matchesPath}/${UNKNOWN_ID}`, {
      homeTeamId: teamA,
      awayTeamId: teamC,
      date: MATCH_DATE,
    }),
    404,
    hasError("Match not found"),
  );

  const resultPath = `${matchesPath}/${matchId}/result`;

  for (const homeScore of [-1, "2", 2.5]) {
    check(
      `PATCH result ${JSON.stringify(homeScore)}`,
      await request("PATCH", resultPath, { homeScore, awayScore: 1 }),
      400,
      hasError("homeScore and awayScore must be integers 0 or greater"),
    );
  }

  check(
    "PATCH result",
    await request("PATCH", resultPath, { homeScore: 2, awayScore: 1 }),
    200,
    (response) =>
      (response.json.status === "completed" &&
        response.json.homeScore === 2 &&
        response.json.awayScore === 1) ||
      JSON.stringify(response.json),
  );

  check(
    "PATCH result again",
    await request("PATCH", resultPath, { homeScore: 0, awayScore: 0 }),
    409,
    hasError("Match result is already registered"),
  );

  check(
    "PUT completed match",
    await request("PUT", `${matchesPath}/${matchId}`, {
      homeTeamId: teamA,
      awayTeamId: teamC,
      date: MATCH_DATE,
    }),
    409,
    hasError("Only scheduled matches can be updated"),
  );

  return matchId;
};

// ============================= TEST STANDINGS ======================================================

/**
 * Builds a known situation and checks the standings numbers exactly:
 * a win, a draw, a scheduled match that must not count, and a team with 0 played.
 * @param ids - the ids from testTournaments and testTeams
 */
const testStandings = async ({ tournamentId, teamB, teamC }) => {
  const matchesPath = `/tournaments/${tournamentId}/matches`;

  const teamDResponse = await request(
    "POST",
    `/tournaments/${tournamentId}/teams`,
    { name: "Team D", city: "Kungälv", coach: "Anna" },
  );
  const teamD = teamDResponse.json?.id;
  if (!teamD) {
    throw new Error("Could not create Team D");
  }
  created.teams.push({ tournamentId, id: teamD });

  const drawResponse = await request("POST", matchesPath, {
    homeTeamId: teamB,
    awayTeamId: teamC,
    date: MATCH_DATE,
  });

  const drawId = drawResponse.json?.id;
  if (!drawId) {
    throw new Error("Could not create the draw match");
  }
  created.matches.push({ tournamentId, id: drawId });
  await request("PATCH", `${matchesPath}/${drawId}/result`, {
    homeScore: 1,
    awayScore: 1,
  });

  const scheduledResponse = await request("POST", matchesPath, {
    homeTeamId: teamC,
    awayTeamId: teamB,
    date: MATCH_DATE,
  });
  const scheduledId = scheduledResponse.json?.id;
  if (!scheduledId) {
    throw new Error("Could not create the scheduled match");
  }
  created.matches.push({ tournamentId, id: scheduledId });

  check(
    "GET standings",
    await request("GET", `/tournaments/${tournamentId}/standings`),
    200,
    (response) => {
      const fields = Object.keys(response.json[0]).join(", ");
      if (
        fields !==
        "teamId, teamName, played, wins, draws, losses, goalsFor, goalsAgainst, goalDifference, points"
      ) {
        return `fields: ${fields}`;
      }

      const rows = response.json.map(
        (row) =>
          `${row.teamName} ${row.played} ${row.wins}-${row.draws}-${row.losses} ${row.goalsFor}:${row.goalsAgainst} ${row.goalDifference} ${row.points}`,
      );

      const expected = [
        "Team A 1 1-0-0 2:1 1 3",
        "Team B 1 0-1-0 1:1 0 1",
        "Team C 2 0-1-1 2:3 -1 1",
        "Team D 0 0-0-0 0:0 0 0",
      ];
      return rows.join(" | ") === expected.join(" | ") || rows.join(" | ");
    },
  );

  check(
    "GET standings unknown tournament",
    await request("GET", `/tournaments/${UNKNOWN_ID}/standings`),
    404,
    hasError("Tournament not found"),
  );
};

// ============================= TEST DELETES ======================================================

/**
 * Deletes every match and team the script created. Already deleted items answer 404, which is fine.
 * Used both by testDeletes and by the cleanup at the end.
 */
const deleteMatchesAndTeams = async () => {
  for (const { tournamentId, id } of created.matches) {
    await request("DELETE", `/tournaments/${tournamentId}/matches/${id}`);
  }
  for (const { tournamentId, id } of created.teams) {
    await request("DELETE", `/tournaments/${tournamentId}/teams/${id}`);
  }
};

/**
 * Checks the delete endpoints and the rules that block a delete.
 * @param ids - the ids from the earlier parts
 */
const testDeletes = async ({ tournamentId, teamA, matchId }) => {
  check(
    "DELETE team in a match",
    await request("DELETE", `/tournaments/${tournamentId}/teams/${teamA}`),
    409,
    hasError("Team is used in a match and cannot be deleted"),
  );

  check(
    "DELETE tournament with data",
    await request("DELETE", `/tournaments/${tournamentId}`),
    409,
    hasError("Tournament has teams or matches and cannot be deleted"),
  );

  check(
    "DELETE completed match",
    await request("DELETE", `/tournaments/${tournamentId}/matches/${matchId}`),
    204,
    (response) => response.text === "" || `body: ${response.text}`,
  );

  check(
    "DELETE match again",
    await request("DELETE", `/tournaments/${tournamentId}/matches/${matchId}`),
    404,
    hasError("Match not found"),
  );

  check(
    "DELETE team",
    await request("DELETE", `/tournaments/${tournamentId}/teams/${teamA}`),
    204,
    (response) => response.text === "" || `body: ${response.text}`,
  );

  check(
    "DELETE team again",
    await request("DELETE", `/tournaments/${tournamentId}/teams/${teamA}`),
    404,
    hasError("Team not found"),
  );

  await deleteMatchesAndTeams();

  check(
    "DELETE tournament",
    await request("DELETE", `/tournaments/${tournamentId}`),
    204,
    (response) => response.text === "" || `body: ${response.text}`,
  );

  check(
    "GET deleted tournament",
    await request("GET", `/tournaments/${tournamentId}`),
    404,
    hasError("Tournament not found"),
  );

  check(
    "DELETE tournament again",
    await request("DELETE", `/tournaments/${tournamentId}`),
    404,
    hasError("Tournament not found"),
  );
};

// ============================= RUN ======================================================

/**
 * Deletes everything the script created, in the order the API allows: matches → teams → tournaments.
 */
const cleanUp = async () => {
  await deleteMatchesAndTeams();
  for (const id of created.tournaments) {
    await request("DELETE", `/tournaments/${id}`);
  }
};

try {
  const tournamentId = await testTournaments();
  const teamIds = await testTeams(tournamentId);
  const matchId = await testMatches({ tournamentId, ...teamIds });
  const ids = { tournamentId, ...teamIds, matchId };
  await testStandings(ids);
  await testDeletes(ids);
} catch (error) {
  results.push({
    ok: "❌",
    name: "Script stopped",
    expected: "-",
    got: "-",
    reason: error.message,
  });
} finally {
  try {
    await cleanUp();
  } catch (error) {
    console.error(
      `Cleanup failed: ${error.message}. Delete the "Smoke Cup" data by hand.`,
    );
  }
}

console.table(results);

const failed = results.filter((row) => row.ok === "❌").length;
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed > 0 ? 1 : 0);

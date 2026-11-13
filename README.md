# Cupify

Cupify is a REST API for managing sports tournaments, teams, matches and results. It is a group examination project built on AWS Lambda, API Gateway and DynamoDB.

## Public API URL

https://lgeodex5ua.execute-api.eu-north-1.amazonaws.com

## Tech stack

Node.js 24 · AWS Lambda · API Gateway (HTTP API) · DynamoDB (three tables: `cupify-tournaments`, `cupify-teams`, `cupify-matches`) · Serverless Framework v4 · middy

## Install and deploy

You need Node.js 24, an AWS account with an IAM role for Lambda, and a Serverless Framework account.

```bash
npm install -g serverless
serverless login                   # run this outside the project folder
git clone https://github.com/pjstrid/cupify-REST-API.git
cd cupify-REST-API
npm install
cp config.example.yml config.yml   # fill in your own org and role
serverless deploy
serverless info                    # shows your API URL
```

Run `serverless login` before you go into the project folder. Inside it, login can't read the `org` from `config.yml` and fails.

`config.yml` is in `.gitignore`. **Never commit it.**

If you get a `500`, run `serverless logs -f <function name>` to see the error.

## Endpoints

`{id}` is always the tournament id. All ids are created by the backend.

| Method | Path | What it does | Success |
| --- | --- | --- | --- |
| `GET` | `/tournaments` | Lists all tournaments | `200` |
| `GET` | `/tournaments/{id}` | Gets one tournament | `200` |
| `POST` | `/tournaments` | Creates a tournament | `201` |
| `PATCH` | `/tournaments/{id}/status` | Changes the status | `200` |
| `DELETE` | `/tournaments/{id}` | Deletes a tournament without teams or matches | `204` |
| `GET` | `/tournaments/{id}/teams` | Lists the teams | `200` |
| `GET` | `/tournaments/{id}/teams/{teamId}` | Gets one team | `200` |
| `POST` | `/tournaments/{id}/teams` | Registers a team | `201` |
| `PUT` | `/tournaments/{id}/teams/{teamId}` | Replaces name, city and coach | `200` |
| `DELETE` | `/tournaments/{id}/teams/{teamId}` | Deletes a team that plays no match | `204` |
| `GET` | `/tournaments/{id}/matches` | Lists the matches | `200` |
| `GET` | `/tournaments/{id}/matches/{matchId}` | Gets one match | `200` |
| `POST` | `/tournaments/{id}/matches` | Schedules a match | `201` |
| `PUT` | `/tournaments/{id}/matches/{matchId}` | Changes teams and date of a scheduled match | `200` |
| `PATCH` | `/tournaments/{id}/matches/{matchId}/result` | Registers the result | `200` |
| `DELETE` | `/tournaments/{id}/matches/{matchId}` | Deletes a match | `204` |
| `GET` | `/tournaments/{id}/standings` | League table (optional bonus) | `200` |

## Project structure

```text
functions/     One folder per endpoint, each with an index.mjs handler
services/      Database access, responses and validation
middlewares/   errorHandler.mjs turns errors into { "error": "..." }
```

Handlers never talk to DynamoDB directly. They call the functions in `services/`.

## How to build an endpoint

- Write a named handler, then wrap it in middy on the last line: `export const handler = middy(createTeamHandler).use(httpJsonBodyParser()).use(errorHandler());`. Skip `httpJsonBodyParser()` when there is no body.
- Errors: `throw createError(status, message)`. Success: `return sendResponse(status, data)`.
- Read and write data only through `services/<resource>.mjs`.

| Don't | Do |
| --- | --- |
| `sendResponse(200, { teams })` | `sendResponse(200, teams)` — the data itself |
| `201` with `{ message, team }` | `201` with the created object only |
| Delete returns `200` with a message | `sendResponse(204)` — no body |
| `httpErrorHandler()`, `{ message }` errors | `errorHandler()` + `throw createError(...)` |
| `crypto.randomUUID().slice(0, 5)` | `import { randomUUID } from "node:crypto"`, then the full `randomUUID()` |
| `ScanCommand` for lists | `QueryCommand` on `tournamentId` for teams and matches |

## Code style

Prettier formats the code: spaces, quotes, semicolons and line breaks. The settings are in `.prettierrc`, so every computer formats the same way. `npm install` installs it.

```bash
npm run format         # formats every .mjs file
npm run format:check   # only checks, changes nothing
```

Run `npm run format` before you commit.

Prettier can't fix everything. Follow these rules too:

| Rule | Example |
| --- | --- |
| Every file starts with a doc comment: the route, then what it does | `/** POST /tournaments/{id}/teams` · `Registers a team in a tournament. */` |
| Named handler, then middy on the last line | `const createTeamHandler = async (event) => { … };` then `export const handler = middy(createTeamHandler)…` |
| Read path parameters once, at the top, with clear names | `const { id: tournamentId, teamId } = event.pathParameters;` |
| New ids come from Node | `import { randomUUID } from "node:crypto";` |
| Import order: `node:` modules → npm packages → our own files, `errorHandler` last | `node:crypto` → `@middy/core` → `../../services/…` → `../../middlewares/…` |
| A doc comment (`/** … */`) directly above every handler and exported function | one-line description, `@param name - meaning`, `@returns …` |
| Build objects in the same field order as the API responses | tournament: `id, name, sport, location, startDate, status` |
| Plain strings use `"…"`. Use `` `…` `` only with `${…}` | `"Tournament not found"` |

Comments explain **why**, not what the code already says. No ticket numbers in comments.

## Shared functions

| File | Functions |
| --- | --- |
| `tournaments.mjs` | `getAllTournaments`, `getTournamentById`, `createTournament`, `updateTournamentStatus`, `deleteTournament` |
| `teams.mjs` | `getTeamsByTournament`, `getTeam`, `createTeam`, `updateTeam`, `deleteTeam`, `hasTeams` |
| `matches.mjs` | `getMatchesByTournament`, `getMatch`, `createMatch`, `updateMatch`, `registerMatchResult`, `deleteMatch`, `hasMatches`, `isTeamInAnyMatch` |
| `validation.mjs` | `isJsonObject`, `missingFields`, `isValidDate`, `isValidDateTime`, `isValidScore` |
| `responses.mjs` | `sendResponse`, `sendError` |

Get-functions return `undefined` when nothing is found. List-functions return `[]` when the list is empty.

Standings has no service file. `getStandings` reads teams and matches with the functions above and computes the table in its own handler. It is never stored.

## Error messages

All errors look like `{ "error": "..." }`.

| Case | Status | Message |
| --- | --- | --- |
| Body is not a JSON object | 400 | `Request body must be a valid JSON object` |
| Missing or empty text fields | 400 | `Missing or empty fields: name, city` |
| Invalid start date | 400 | `startDate must be a valid date (YYYY-MM-DD)` |
| Invalid match date | 400 | `date must be a valid ISO date-time` |
| Invalid tournament status | 400 | `status must be one of: upcoming, ongoing, completed` |
| Same team twice | 400 | `A team cannot play against itself` |
| Invalid score | 400 | `homeScore and awayScore must be integers 0 or greater` |
| Unknown tournament / team / match | 404 | `Tournament not found` · `Team not found` · `Match not found` |
| Team not in the tournament | 404 | `Both teams must belong to this tournament` |
| Delete tournament with teams or matches | 409 | `Tournament has teams or matches and cannot be deleted` |
| Delete team that plays in a match | 409 | `Team is used in a match and cannot be deleted` |
| Change a completed match | 409 | `Only scheduled matches can be updated` |
| Register a result twice | 409 | `Match result is already registered` |
| Anything unexpected | 500 | `Internal server error` |

## Git workflow

- Branch from the latest `dev`: `type/CUP-NNN-short-description`, for example `feature/CUP-013-create-team`.
- Commit as `type [CUP-NNN] Description`, for example `feat [CUP-013] Add create team endpoint`. Types: `feat`, `fix`, `refactor`, `chore`, `docs`.
- Name the files you add. Never `git add .`
- Open a pull request into `dev`, not `main`, and fill in the PR template.

## Testing

The shared Insomnia collection is in `insomnia/cupify-collection.yaml`. It tests every endpoint in the same order as the endpoint table above, including the errors (`400`, `404`, `409`).

1. In Insomnia, go to the home screen and click **Import**. Choose `insomnia/cupify-collection.yaml`. Import it as a **new** collection, not into an existing one.
2. `base_url` in the Base Environment already points to the public API URL. To test your own deploy, change it to the URL from `serverless info`.
3. Right-click the collection → **Run**, and run all folders in order.

Every request checks its own status code. The POST requests save the new ids (`tournament_id`, `team_a_id`, `team_b_id`, `team_c_id`, `match_id`), so you never copy ids by hand. The last folder, **7 Clean up**, deletes everything the run created.

### Smoke test

After you deploy, and before you open a pull request, run the smoke test against your own API:

```bash
npm run smoke -- <your API URL>
```

It checks every endpoint and every error case, prints one row per check and ends with `X/Y passed`. It creates its own test data ("Smoke Cup") and deletes all of it at the end. Never run it against the public API while someone is using it.

### Automatic check on pull requests

Every pull request into `dev` or `main` runs a check on GitHub: `npm run format:check` and `node --check` on every `.mjs` file. A red ❌ means a file is not formatted or has a syntax error. Run `npm run format` and push again.

## Glossary

| Word | Meaning |
| --- | --- |
| Handler | The function Lambda runs for each request. |
| Middleware | Code that runs before or after the handler, like body parsing or error handling. |
| `pathParameters` | The values from the URL, like `{id}` and `{teamId}`. |
| Partition key / sort key | Together they identify one item in a DynamoDB table. Teams and matches use `tournamentId` + `id`. |
| `Query` vs `Scan` | `Query` reads one partition key. `Scan` reads the whole table and is slower. |
| Status codes | `200` OK · `201` Created · `204` Deleted, no body · `400` Invalid input · `404` Not found · `409` Breaks a business rule · `500` Server error |

## Team

- [Jonathan Strid](https://github.com/pjstrid)
- [Erik Nordvall](https://github.com/eriknordvall)
- [Patrik Noordh](https://github.com/PatrikNoordh)
- [Neda Khalaj](https://github.com/Nedakhalaj)

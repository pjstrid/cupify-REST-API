<!--
HOW TO FILL IN THIS PULL REQUEST: choose A or B

A) Write it yourself
   Replace every <...> below with your own words. Short and simple is fine.

B) Get help from an AI assistant
   1. Write what you can under "MY NOTES" at the end of this instruction block.
      It's fine if some lines are empty. The AI will ask you about the rest.
   2. Select ALL the text in this description box (Ctrl+A / Cmd+A) and copy it.
   3. Paste it into any AI assistant and send it.
   4. Answer the AI's questions. You can also send screenshots, for example
      of your Insomnia results.
   5. Delete everything in this box and paste the finished answer instead.
   6. Read it. Fix anything that is wrong before you create the PR.
   Never share config.yml, AWS keys or passwords, not even in a screenshot.

PR title format:  feat [CUP-013] Add Create Team Endpoint
The PR must go into "dev", not "main".

======== INSTRUCTIONS FOR THE AI ========
Help me fill in the pull request template below (everything after this instruction block).

1. Read MY NOTES and any screenshots I send.
2. If something you need is missing or unclear, do NOT guess. Ask me questions first:
   - Only ask what you really need to finish the PR. If nothing is missing, ask nothing.
   - Ask at most 3 short, simple questions at a time, in the same language as my notes.
   - Tell me where to find the answer if it helps (for example "the status code is shown
     at the top right in Insomnia", or "run: git diff --name-only dev...HEAD").
   - I can answer with text or with screenshots. Read status codes and responses from them.
   - Wait for my answers before you continue.
3. When you have everything, write the finished pull request:
   - Simple, clear English, even if my notes are in Swedish.
   - Use ONLY facts from my notes, my answers and my screenshots. Never invent files,
     tests or results. If I can't answer something, write "TODO" in that place.
   - Keep all headings and the checklist exactly as they are. Do not tick any boxes.
   - Return only the finished markdown, without this instruction block.

MY NOTES (write here, in Swedish or English):
- Ticket: CUP-___   GitHub issue: #___
- What I built:
- Files I changed (tip: run  git diff --name-only dev...HEAD ):
- My Insomnia tests (test → status I got):
- One response I got (copy it from Insomnia):
- Anything the reviewer should know:
-->

## Ticket

CUP-___ · Closes #___

## What I did

<2–3 sentences: what you built and why.>

## Files changed

| File                        | What changed        |
| --------------------------- | ------------------- |
| `<functions/.../index.mjs>` | <short description> |

## How I tested (Insomnia)

<Copy the rows from your ticket's test table and fill in the last column.>

| #   | Test            | Expected | I got    |
| --- | --------------- | -------- | -------- |
| 1   | <Works>         | `<201>`  | <✅ 201> |
| 2   | <Missing field> | `<400>`  | <✅ 400> |

## Example response

<Paste the response from your "Works" test.>

```json

```

## Notes for the reviewer

<Anything special, for example "I changed a shared file in services/". Write "None" if nothing.>

## Checklist

- [ ] My commits look like `feat [CUP-013] Add create team endpoint`
- [ ] I tested every row in my ticket's test table
- [ ] Every error body looks like `{ "error": "..." }`
- [ ] No `config.yml` or other private files in this PR
- [ ] This PR goes into `dev`, not `main`

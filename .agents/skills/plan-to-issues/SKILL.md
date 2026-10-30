---
name: plan-to-issues
description: Split this repo's plan.md into GitHub issues with gh, one per unit of work, after a human has reviewed the split. Use when a plan is ready and has no issues yet.
---

# plan-to-issues

Turns `plan.md` into GitHub issues that workers can pick up cold. Easiest with `gh`, authenticated,
in a shell this agent can run.

## Steps

1. Read `plan.md`, `AGENTS.md` and `docs/adr/`.
2. Draft the split as a table: title · plan section · scope · done when · blocked by.
   One issue per unit of work.
3. **Stop and show the table to the human.** Publish nothing until they approve it.
4. Every issue here carries the shape below (approved by the human on 2026-10-29). Ask the human
   only for a change to it, and write any change back into this section.
5. Create each issue in dependency order, so blocked-by can cite real numbers:

   ```sh
   gh issue create --title "<title>" --body-file <tmp.md>
   ```

6. Record every issue URL from gh's output (not from memory) and reply with the list.

## What every issue carries

- Label `plan:<plan name>` (from the plan's frontmatter), e.g. `plan:morning-digest`.
- Body, in this order:

  ```md
  Source: plan.md § <n>

  ## Scope
  <what this unit of work changes, files and rules it must follow>

  ## Done when
  <the plan's done condition, checkable>

  ## Blocked by
  <#n, … or —; say what is needed to start and what is needed to finish>
  ```

- The first line is exactly `Source: plan.md § <n>`, with the plan's section number (`1`, `2a`…).
  The reviewer sorts by it.
- A "Done when" that waits on another person (a reviewer looking at a preview) holds only once
  they have acted. Sent is not seen: leave the issue open and say what it waits on.

Closing one, with the closing comment from AGENTS.md:

```sh
gh issue close <n> -c "<closing comment>"
```

## No `gh`

Steps 1–4 hold either way. GitHub reachable another way (a connector, the REST API, the web UI):
the same issues, made that way. GitHub issues out of reach altogether: write them as files in
`docs/issues/`, format in ADR 0004, then commit and push.

## Don'ts

- Don't paste the whole plan into one issue, and don't keep issues only in chat.
- Don't invent sections the plan doesn't have. If the plan is unclear, ask.

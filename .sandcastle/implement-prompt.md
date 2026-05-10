# TASK

Fix issue {{TASK_ID}}: {{ISSUE_TITLE}}

Pull in the issue using `gh issue view <ID>`. If it has a parent PRD, pull that in too.

Only work on the issue specified.

Work on branch {{BRANCH}}. Make commits and run tests.

# CONTEXT

Here are the last 10 commits:

<recent-commits>

!`git log -n 10 --format="%H%n%ad%n%B---" --date=short`

</recent-commits>

# EXPLORATION

Explore the repo and fill your context window with relevant information that will allow you to complete the task.

Pay extra attention to test files that touch the relevant parts of the code.

# EXECUTION

If applicable, use RGR to complete the task.

1. RED: write one test
2. GREEN: write the implementation to pass that test
3. REPEAT until done
4. REFACTOR the code

# FEEDBACK LOOPS

Before committing, run `npm run typecheck` and `npm run test` to ensure the tests pass.

## Visual verification for frontend tasks

If your task changes anything the user sees (Svelte components, CSS, page layout, routes that render UI), you must verify the result visually before committing. The sandbox has `playwright-cli` available — use it.

Workflow:

1. Start the dev server in the background, capping the wait at 60 s. The
   sandbox's `onSandboxReady` hook already drops a `.dev.vars` with
   boot-safe placeholder values, so the server should come up immediately.
   ```
   npm run dev > /tmp/dev.log 2>&1 &
   for i in $(seq 1 60); do curl -fs http://localhost:5173 > /dev/null && break; sleep 1; done
   curl -fs http://localhost:5173 > /dev/null || { echo "dev server failed — see /tmp/dev.log"; tail -40 /tmp/dev.log; }
   ```
   If the dev server fails to come up after 60 s, **skip visual verification**,
   note it in the commit message, and proceed to commit. Do not retry
   indefinitely — the unit tests and typecheck still gate correctness.
2. If the page you're working on needs data, run the local seed scripts:
   ```
   npm run db:migrate
   npm run dev:reset           # clean state, 7 future fixtures
   npm run dev:fastforward     # resolves 3 group fixtures (run again to resolve more)
   ```
3. Drive the page with `playwright-cli` (use a session name with `-s=` so subsequent commands target the same browser):
   - `playwright-cli -s=dev open --browser firefox http://localhost:5173/<path>`
   - `playwright-cli -s=dev screenshot --filename /tmp/page.png` then read the screenshot back to compare against the intended visual.
   - `playwright-cli -s=dev snapshot` to inspect the DOM / accessibility tree (returns numbered refs `e1`, `e2`, ... that subsequent `click`/`fill` commands target).
   - `playwright-cli -s=dev console` to surface client-side errors.
   - `playwright-cli -s=dev close` when done.

   Use `--browser firefox` because the sandbox is Linux ARM64 and Google Chrome has no ARM64 Linux build. Firefox is what's installed in the image.
4. If the parent PRD references a design exploration file under `design-explorations/`, open that file too and compare the live page against it.
5. Iterate the code → reload → screenshot loop until the live page matches the intent.
6. Stop the dev server before committing: `kill %1` (or `pkill -f "vite dev"`).

Spending several iterations on visual verification is expected for frontend work — it's the only way to catch spacing, typography, and colour mistakes that typecheck and unit tests can't see.

# COMMIT

Make a git commit. The commit message must:

1. Start with `RALPH:` prefix
2. Include task completed + PRD reference
3. Key decisions made
4. Files changed
5. Blockers or notes for next iteration

Keep it concise.

**Do NOT add `Co-Authored-By: Claude` (or any AI / model) trailers to the commit message. Do NOT add a "Generated with Claude Code" footer. Commit as the human author only.**

# THE ISSUE

If the task is not complete, leave a comment on the issue with what was done.

Do not close the issue - this will be done later.

Once complete, output <promise>COMPLETE</promise>.

# FINAL RULES

ONLY WORK ON A SINGLE TASK.

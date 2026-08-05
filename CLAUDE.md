# GuitarBuddy

Vue 3 + Vuetify 3 SPA built with Vite, backed by Firebase (Realtime Database + Auth). Dev server: `npm run dev` (Vite, http://localhost:5173).

## HARD RULE: every change must be verified e2e in a real browser

No code change is done until it has been verified end-to-end using the chrome-devtools MCP tools in a live browser. This applies to ALL changes with no exceptions: features, bug fixes, refactors, styling, "trivial" one-liners.

Verification means actually exercising the app, not reasoning about the code:

1. Start the dev server (`npm run dev`) if it is not already running.
2. Navigate to every page/view the change touches (`navigate_page`). If a change affects shared code (store, router, mixins, parsers, shared components), navigate to every page that consumes it.
3. If sign-in is required, use the test account from `.env.test.local` (`E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`).
4. Exercise the changed behavior the way a user would: click, type, fill forms, scroll (`click`, `fill`, `type_text`, ...). Loading the page is not enough.
5. Validate fully:
   - Visually: `take_screenshot` / `take_snapshot` and confirm the UI looks correct.
   - Functionally: assert the expected DOM state, persisted data, and navigation actually happened.
   - Console: `list_console_messages` must show no new errors or warnings.
6. If verification fails, fix and re-run the full loop. Never report a change as done with a failed or skipped verification.
7. Report what was tested and what was observed as part of the final summary.

The app talks to the real production Firebase project. Any test data created during verification (songs, sessions, etc.) MUST be deleted before finishing.

# Shared family cabin deployment

This Worker serves the static frontend and a small D1 database from one Cloudflare deployment. Cloudflare Access sits in front of the **entire Worker**. The app verifies Access's signed identity again before serving any file or API response. Approved relatives enter their email, receive a one-time code, and sign in. There are no passwords to issue or reset, and the website does not send email itself.

The shared build starts with an empty calendar, list, and cabin book. Local preview examples are never imported automatically. Existing browser-only notes stay in each browser; export them before clearing browser data.

## Local checks

Use Node.js 24 LTS. From `frontend/`, run `npm ci`. From this directory:

```sh
npm ci
npm run typecheck
npm test
npm run test:sql-limits
npm run build:frontend
npm run db:local
```

`npm run build:frontend` sets `NEXT_PUBLIC_SHARED_BACKEND=1` for the static export, so it expects a protected Worker API. Run `npm run build` from `frontend/` without that flag to restore the browser-only preview. Wrangler's local D1 state is in `.wrangler/` and is ignored by Git. Live Access login is tested after deployment; the unit tests use a locally signed JWT and do not depend on a Cloudflare account.

`npm run test:sql-limits` needs Python 3.11 or later. It runs the real member-directory SQL and migrations on isolated SQLite with a five-term compound-SELECT limit. Node's SQLite tests use a more permissive default, so they cannot catch this Cloudflare production constraint by themselves.

## Current status and remaining Cloudflare setup

On September 24, 2026, Wrangler connected to the intended Cloudflare account. The remote `cabin` D1 database was created in western North America, its ID was added to `wrangler.jsonc`, and the initial schema migrations were applied. **Do not create another D1 database.** The Worker is deployed at [cabin.lakemary.workers.dev](https://cabin.lakemary.workers.dev). Zero Trust Free is active. A Worker-wide Access rule protects production and preview URLs and allows one exact email for the initial test. One-time PIN is the only application login method. The two Access verification values are installed as Worker secrets. An anonymous live request returned HTTP 302 to Cloudflare Access. The approved member completed email-code sign-in, and the signed-in calendar, cabin care, and knowledge screens loaded from the live Worker.

1. Add other family members when ready through **Workers & Pages → cabin → Access → Cabin family - approved emails**. This is email sign-in, not a separate second factor. The exact approved address is kept out of the repository.
2. Confirm an unapproved email cannot sign in or see the site. Add a second approved account and confirm a stay, task, and knowledge note are shared. Also confirm a second booking on occupied nights is rejected while a new booking on the first stay's departure date succeeds. These cross-account and write-flow checks have not yet been run against the live database.
3. To verify or replace the Worker secrets later, find the Access application's **AUD tag** and the team's `<team>.cloudflareaccess.com` domain, then use `npx wrangler secret put ACCESS_AUD` and `npx wrangler secret put ACCESS_TEAM_DOMAIN` from this directory. Enter values at the prompts; they do not belong in Git. The Worker returns HTTP 503 without them.

The exact dashboard names can change. The [Access for Workers guide](https://developers.cloudflare.com/workers/configuration/cloudflare-access/) and [One-time PIN guide](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/) describe the current screens.

## Data and operations

- The `bookings` table stores trip details and the Access email of the host. New nights can overlap only when every existing stay welcomes company (`open_to_company`), or is part of a family gathering. Availability is checked atomically in each booking write. Existing overlapping nights are preserved during edits; closing a stay blocks future bookings without canceling saved plans. A stay can be someone's plans for a gathering (`gathering_id`); each person has at most one set of plans per gathering. Only the host may edit a trip; the host or family administrator may delete it.
- The `gatherings` table retains historical family events and linked plans. New gatherings, event editing, and yearly creation are retired; the calendar uses individual stays. See [Gatherings](#gatherings).
- `tasks` stores list items, assignees, priority, status, and server-recorded completion details. `book_pages` stores house basics and how-to pages, including the verified flag and last editor. Each row has its own version: different items can be edited independently, while stale edits to the same item return HTTP 409. All approved members may edit these shared records.
- `cabin_care` is retained as a read-only snapshot of the pre-migration tasks and pages. Migration `0003_list_and_book.sql` copies existing records into the new tables without changing IDs, content, authors, or page update dates. Previously completed tasks retain an unknown completion date. The snapshot is not the active store.
- Guestbook notes remain attached to their stay in `bookings.notes`, matching the frontend. The note-only route checks the host and the last update time and never changes stay dates.
- The knowledge ZIP is assembled in the browser from the current shared notes. It includes article text and author email addresses, and excludes bookings and tasks. Check it before uploading it to an AI service.
- D1 Free provides seven days of automatic point-in-time recovery. For longer retention, export the database periodically to secure storage with `npx wrangler d1 export cabin --remote --output=<path-outside-this-repo>.sql`. Keep exports private.
- To remove a relative's access, remove their address from the Access Allow policy. Existing bookings remain attributed to that email; they can be reassigned later by an administrator if needed.

The original Go/AWS backend remains in `../backend/` as an untouched archive and is not deployed.

## API map

All routes require the Worker's verified Cloudflare Access identity. Request and response bodies use JSON; deletes return HTTP 204.

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/me` | GET | Signed-in email |
| `/api/bookings` | GET, POST | Shared calendar and new stays |
| `/api/bookings/:id` | PUT, DELETE | Host-only edits; host/admin deletion |
| `/api/bookings/:id/note` | PATCH | Host-only guestbook update: `{ notes, updatedAt }` |
| `/api/tasks` | GET, POST | List items across all categories and statuses |
| `/api/tasks/:id` | GET, PUT, PATCH, DELETE | Edit, claim, complete, reopen, or remove one item |
| `/api/pages` | GET, POST | House basics and how-to pages |
| `/api/pages/:id` | GET, PUT, PATCH, DELETE | Read or edit one cabin-book page |
| `/api/care` | GET | Compatibility read assembled from the new tables |

Task/page creation accepts the frontend's generated `id`. Updates and deletions require the last returned `version` in the JSON body. PUT supplies the full editable record; PATCH can supply just changed fields. Author, update, and completion metadata are stamped by the server. Each collection is capped at 500 items. Invalid values return 400; missing records return 404; stale writes and duplicate IDs return 409. Plans for a gathering that was removed, or a second set of plans for the same gathering, return 409. The old bulk `PUT /api/care` returns a reload message, protecting newer per-item changes from older browser tabs.

`src/index.ts` handles Access and errors, `src/api.ts` dispatches routes, `src/routes/` contains resource handlers, and `src/bookings.ts` / `src/care.ts` validate input. No additional D1 database is needed.

## Migration and release

1. Run `npm run typecheck`, `npm test`, `npm run test:sql-limits`, and `npm run test:shared` here. The shared browser test uses Chrome, the production frontend, real API handlers, and isolated in-memory SQLite. It does not use or change live family data. Run the frontend's own checks separately; its browser suite requires a preview-mode build.
2. Test migrations locally with `npm run db:local` and validate the bundle with `npx wrangler deploy --dry-run`.
3. Record the current recovery bookmark with `npx wrangler d1 time-travel info cabin --json`. For a separately authorized long-term backup, export to a private location outside the repository; do not include family records in Git.
4. Apply `npm run db:remote`, then immediately run `npm run deploy`. Migration 0003 makes the legacy care document read-only, so old Worker versions cannot save into the wrong store during rollout. Reads and bookings remain available; list/page writes require the new Worker.
5. Refresh existing browser tabs. Check migration counts and signed-in reads before testing live writes.

Do not roll back only the Worker to code that writes the archived `cabin_care` document. Fix forward, or restore a coordinated database and Worker backup during a maintenance window; a restore would discard changes made since the backup. The retained document is a migration snapshot, not a current backup of new task/page edits.

Gathering edits use [D1 transactions](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch) so a stale edit changes nothing, including the plans that move with it.

## Latest backend rollout

Migration 0003 and Worker version `e0b4e659-5674-4bb2-bc09-210d6c5404b6` were deployed September 26, 2026 (Pacific time). The live database retained 3 bookings, 2 tasks, and 1 page. The standard D1 export endpoint returned authentication error 10000 while database queries worked, so a private schema-and-row snapshot was taken through the read API, restored to SQLite, and successfully migrated before touching production. The original legacy care document remains in D1 as an additional migration snapshot.

Validation passed: 9 backend tests, 6 frontend unit tests, 4 preview browser tests, shared-mode browser integration against the actual API handlers with isolated SQLite, local Wrangler migrations, TypeScript, lint, production build, and Worker deployment dry run. Production writes were not exercised against family records. The live signed-in browser check could not run because Safari automation failed.

## Family display names

Migration `0004_member_names.sql` adds `member_profiles`, keyed by the same normalized email used for bookings and sign-in. It stores a display name, version, update time, and the administrator who last edited it. Existing stays and page content are unchanged. Assigned names appear in greetings, host labels, task assignments, and cabin-book bylines; existing custom trip titles are preserved.

All signed-in family members can read `GET /api/members`. It combines assigned names with unnamed emails already used in stays, tasks, and page authors. `PUT /api/members` accepts `{ email, displayName, version }`; use version 0 for an unassigned name. Stale edits return 409. The server permits writes only when the verified Access email matches the `ADMIN_EMAIL` Worker secret. If the secret is missing, editing is disabled. `/api/me` returns `canManageMembers` so only that account sees **Family names** in the footer.

Set or change the administrator using `npx wrangler secret put ADMIN_EMAIL`, entering the exact approved email at the prompt. This setting is separate from Cloudflare Access: adding a name does not approve sign-in, grant admin privileges, change booking ownership, or fetch a Gmail profile. The footer continues to show the full signed-in email. No passwords or separate accounts were added.

## Calendar colors

Migration `0007_member_colors.sql` adds a separate email-to-color directory. Existing people receive different colors from a ten-color palette before any color is reused. On a person's first visit or name assignment, the API saves a least-used color, preferring their email's stable hash when several colors are equally available. The allocation uses one SQL statement, so simultaneous visits cannot allocate from stale counts. Once assigned, a color stays fixed across name edits, new members, reloads, and devices.

Colors do not grant Access approval, admin privileges, or booking ownership. Name edits cannot change a color. `GET /api/members` includes the saved color and only writes when an identity needs its first assignment. The monthly calendar key shows the hosts whose stays are visible; bars and avatars use the same saved color. Names and initials remain visible. Family gatherings retain orange squared bands and their group icon. After ten people, colors are reused evenly; text continues to identify each person.

Apply migration 0007 before deploying the updated Worker. It adds only the color table and index, and does not edit existing stays, gatherings, tasks, pages, or display names. The previous Worker can continue operating while the migration is applied.

On September 29, 2026, the member-directory query exceeded D1's compound-SELECT limit and returned HTTP 500. Worker version `1818cae6-f8ce-4978-bddd-2520b8c8c698` fixed it by grouping saved identities and activity sources in separate CTEs. The corrected query was checked directly against production D1, regular Chrome sign-in was verified, and the user confirmed successful loading. The stricter SQL-limit regression check now accompanies the Node tests. No database migration was needed for this correction.

## Shorter address

On September 28, 2026 (Pacific time), the existing Worker was renamed from `lake-mary-cabin` to `cabin`, and the account's Workers subdomain changed from `lake-mary-cloudflare` to `lakemary`. Use **https://cabin.lakemary.workers.dev**. The previous address no longer routes to the app; update bookmarks and shared links.

This was an in-place rename: the deployed version, D1 database binding, secrets, and Worker-wide Access policy were retained. `wrangler.jsonc` uses the new Worker name so future deployments update this same application. No database migration or new paid service was needed.

## Deletion permissions

Migration `0005_item_creators.sql` adds immutable `created_by` fields to tasks and cabin-book pages. The API stamps them from the verified Access email on creation and ignores client-supplied ownership. Editing, claiming, or completing an item never changes its creator. DELETE requires the original creator or the account matching `ADMIN_EMAIL`; booking deletion uses the same rule with its existing host identity. Other members can still collaborate on tasks and pages, and booking edits remain host-only.

Older tasks/pages have unknown creators because previous versions only recorded last editors. They remain readable/editable, but only the administrator can delete them. No ownership is guessed from assignees or last editors. The interface hides deletion controls when unauthorized; the API independently enforces this with HTTP 403. The Wi-Fi & TV starter suggestion was removed; existing page content is retained.

Before this migration, a Cloudflare Time Travel recovery bookmark was recorded: `0000001c-00000000-000050f5-1e99fd054e481c42329ff7b24874f242` (September 28, 2026 Pacific time, subject to the plan's recovery window). A proposed local data export was blocked by approval review, so no private database copy was made.

Migration 0005 and Worker version `de25446e-cffd-4433-888e-5698cefe27c8` were deployed September 28, 2026 (Pacific time). Validation passed: 13 backend tests, 6 frontend tests, lint, type checks, production build, local migrations, deployment dry run, and shared browser integration covering creator/admin deletion controls. All destructive test operations used the isolated test database, not live family records.

## Gatherings

Migration `0006_gatherings.sql` removes the one-stay-per-night rule (`booking_nights`), raises the per-stay limit from 12 to 30 people, adds `gatherings`, and adds `bookings.gathering_id`. The bookings table is rebuilt to change its guest limit; every existing column and row is copied unchanged, and the migration test checks this.

- `GET /api/gatherings` lists saved records without generating future years. Returned records have `repeats: false`.
- `POST /api/gatherings` and `PUT /api/gatherings/:id` return HTTP 410, including requests from older browser tabs.
- `DELETE /api/gatherings/:id` takes `{ version }` and requires the creator or `ADMIN_EMAIL`. Saved individual plans remain ordinary stays (`ON DELETE SET NULL`).
- Existing gathering records and linked plans remain readable. New frontend stays are independent, and no creation button or gathering suggestion appears. Legacy `gatheringId` bookings remain compatible with older saved plans.
- This retirement needs no database migration and deletes no family records.

### Rollout

1. Record a Time Travel bookmark or private export, as for earlier migrations.
2. Run `npm run db:remote`, then immediately `npm run deploy`. Between the two, the previous Worker cannot save stays because `booking_nights` no longer exists; reads keep working. Do not roll back only the Worker afterward.
3. Refresh open browser tabs.

Deployed September 29, 2026 to `cabin.lakemary.workers.dev` as Worker version `9edc1feb-6232-41b9-b6c7-7d34db6ca72a`, with migration 0006 applied. Validation passed: 17 backend tests, 11 frontend unit tests, 5 preview browser tests, shared browser integration covering gathering plans, edits, and removal, type checks, lint, production build, and deployment dry run. Migration tests verified preservation of existing stays and the new overlap behavior. No test bookings or gatherings were written to production.

### Gathering rollout safety

Annual repeat creation is retired. Existing series metadata remains stored for compatibility, but reads cannot create another event and older tabs cannot re-enable event editing. The frontend refreshes related records after removing a saved gathering.

Migration 0006 preserves existing booking fields while rebuilding the table for overlapping stays and the 30-person limit. Apply it immediately before deploying the new Worker. Do not roll back to the pre-gathering Worker alone: it expects the removed `booking_nights` table. The pre-migration recovery bookmark for September 29, 2026 is `0000001e-00000000-000050f5-cf48af20d30962178d152c36de6f77c7`, subject to the plan's recovery window.

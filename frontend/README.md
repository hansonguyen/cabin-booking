# Lake Mary frontend

The cabin frontend is a static Next.js/React app. It has two build modes.

For a browser-only preview, use Node.js 24 LTS and run:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Sample members, trips, and care tasks are clearly labeled; edits stay in that browser. The demo member picker is **not authentication**.

The shared family build is produced by running `npm run build:frontend` from `../cloudflare/`. That build uses Cloudflare Access for email sign-in, then loads bookings, tasks, and knowledge notes from the D1-backed Worker API. It does not import browser preview data or show sample records. See [the deployment guide](../cloudflare/README.md) for exact steps and access rules.

The app has four tabs: **Home** (who’s at the cabin and what’s next), **Calendar** (stays, family gatherings, plus a guestbook of notes from past stays), **The list** (things to bring, supplies running low, chores, and projects), and **Cabin book** (house basics and how-to pages). The cabin book is searchable and has a ZIP export containing Markdown and JSON, for review and optional use with an AI assistant. No content is sent to an AI service automatically. The cabin book still needs real directions, entry, and house-rule pages from the family; missing house-basics pages are suggested on that tab.

Stored category and topic names are unchanged for API compatibility and are relabeled in the UI (for example, “Repairs & renovations” shows as “Projects” and “Arrival & departure” as “House basics”). New stays no longer require a name; a blank name saves as “Firstname’s stay”.

Stays may overlap. The calendar is for letting family know who's going, so overlapping days are marked and the stay form gives a heads-up about who else will be there instead of blocking the dates. For holidays when everyone goes up, anyone can add a **gathering** once (for example Thanksgiving, Wednesday through Sunday). Everyone is assumed to be coming. Families can optionally add their plans (arrival day, headcount, notes), which show as avatars on the gathering's band instead of separate bars. Planning a stay that overlaps a gathering offers to make it your plans for that gathering. Gatherings marked **Happens every year** reappear the following year once they end, keeping their place around the holiday; any year's dates can be adjusted. The preview includes a sample Thanksgiving.

Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e`. The browser test exercises preview mode. Shared API tests are in `../cloudflare/test/`.

Shared-mode writes now use per-item `/api/tasks` and `/api/pages` routes, and a dedicated `/api/bookings/:id/note` route for guestbook edits. Version checks reject stale saves without replacing another family member’s changes. Run `npm run test:shared` in `../cloudflare/` to check the production build against the API and an isolated database.

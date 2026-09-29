# Lake Mary Cabin

A refreshed, locally runnable frontend and a low-cost shared Cloudflare backend for family stays, chores, supplies, and cabin knowledge.

## Start here

With Node.js 24 LTS installed:

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:3000. No AWS credentials, Redis, database, or environment variables are needed for this frontend preview.

Choose a demo member, browse availability, and plan a stay with dates, guest details, and notes. This preview stores changes in this browser. The shared Cloudflare build is deployed at [cabin.lakemary.workers.dev](https://cabin.lakemary.workers.dev) with a private, exact-email Access policy and one-time email codes. The first approved sign-in and the calendar, care, and knowledge screens have been verified live. Manage approved family emails in Cloudflare Access.

See [frontend/README.md](frontend/README.md) for preview details and [cloudflare/README.md](cloudflare/README.md) for the exact account setup and deployment sequence. The shared site does not need a laptop running 24/7.

## Repository

- `frontend/`: active Next.js / React / TypeScript app.
- `cloudflare/`: Worker API, D1 migrations, Access identity verification, and deployment guide.
- `backend/`: original Go / AWS Lambda backend, unchanged and not needed for this preview.
- `legacy/frontend/`: original Cognito, NextAuth, and Redis integration retained as reference, not part of the active build.

Originally created by Hanson Nguyen and Lawrence Smith.

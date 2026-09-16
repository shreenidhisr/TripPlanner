# TripPlanner

Paste messy road-trip notes → day-by-day itinerary with **live drive times**, **real OSM food places**, optional **OpenAI**, and **PostgreSQL** accounts/trips.

## Stack

- **PostgreSQL** — users, sessions, saved trips (`DATABASE_URL`)
- **OSRM** — live driving ETAs
- **Overpass** — real restaurant/cafe stops matching food prefs
- **OpenAI** — optional AI drafting (`OPENAI_API_KEY`)

## Quick start

```bash
npm install
cp .env.example .env
# set DATABASE_URL to your Postgres instance
npm run db:migrate
npm run dev
```

- Web: http://127.0.0.1:5173
- API: http://127.0.0.1:8787

## Scripts

- `npm run dev` — Vite + API
- `npm run db:migrate` — apply Postgres schema
- `npm run build` / `NODE_ENV=production npm start` — production
- `npm run lint`

## Railway

```bash
railway up -y
railway add --database postgres
railway variables --set DATABASE_URL='${{Postgres.DATABASE_URL}}'
```

Migrations run automatically on API boot when `DATABASE_URL` is set.

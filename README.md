# TripPlanner

Paste messy road-trip notes → get a day-by-day driving itinerary with **live drive times**, map links, save/share, and optional **OpenAI** planning.

## Quick start

```bash
npm install
npm run dev
```

- Web: http://127.0.0.1:5173  
- API: http://127.0.0.1:8787  

Open the app, paste notes, hit **Generate**.

## What makes it a product

| Layer | Behavior |
| --- | --- |
| Intent | Smart parser always; **OpenAI** when `OPENAI_API_KEY` is set |
| Routing | **OSRM** live drive times/distances over OpenStreetMap |
| Maps | Google Maps deep links for each day and stop |
| Persistence | Save trips in the browser; copy a shareable link |

## Enable AI planning

```bash
cp .env.example .env
# add OPENAI_API_KEY=sk-...
npm run dev
```

The status pill in the header shows whether AI planning is on.

## Scripts

- `npm run dev` — Vite + API together
- `npm run build` — production frontend build
- `npm start` — API (serves `dist/` when `NODE_ENV=production`)
- `npm run lint` — oxlint

## Production

```bash
npm run build
NODE_ENV=production npm start
```

Then open http://127.0.0.1:8787

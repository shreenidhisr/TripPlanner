# TripPlanner

Unstructured-to-structured road trip builder. Paste a messy brain-dump—days, vibes, food preferences—and get a day-by-day driving itinerary with estimated drive times, waypoint suggestions, and Google Maps links.

## Quick start

```bash
npm install
npm run dev
```

Open the local URL Vite prints, paste your notes, hit **Generate**.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — lint with oxlint

## How it works

1. A lightweight intent parser extracts days, places, themes (hills, coast, desert…), and food preferences from free text.
2. A route generator maps that intent onto a regional waypoint corridor and builds a timed day plan.
3. Every day and stop links out to Google Maps directions or place search.

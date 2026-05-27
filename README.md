# Creator Hours Dashboard

A clean, modern dashboard for managers to track hours and videos submitted by
creators — with per-creator personalized links and locked submissions.

## Two views

- **Manager dashboard** — `/manager`
  - Create creators (name + country)
  - See per-creator totals (hours, videos, days worked)
  - Copy the unique submission link for each creator
  - Open any creator's detail page to view their month calendar and **edit any
    entry — even locked ones**

- **Creator dashboard** — `/c/<slug>`
  - Personal landing page (`Hello, <name> 👋`)
  - Month calendar — tap any past or today date to log hours + videos
  - 2-step submission with a "Confirm & lock" step
  - Once confirmed, the entry is **locked**. The creator cannot edit it.
  - Future dates are disabled
  - Monthly totals shown in the hero (hours, videos, days)

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- SQLite via `better-sqlite3` (auto-created in `./data/app.db`)
- Inter font (Google Fonts)

## Run

```bash
npm install
npm run dev       # development on http://localhost:3000
# or
npm run build && npm run start
```

The SQLite database is created automatically on first launch under `./data/`.

## API reference

| Method | Path                          | Purpose                          |
|--------|-------------------------------|----------------------------------|
| GET    | `/api/creators`               | List creators (with stats)       |
| POST   | `/api/creators`               | Create a new creator             |
| GET    | `/api/creators/:id`           | Get a creator + entries (?month)|
| PATCH  | `/api/creators/:id`           | Update creator name/country      |
| DELETE | `/api/creators/:id`           | Delete a creator                 |
| POST   | `/api/entries`                | Creator submission (auto-locks)  |
| PATCH  | `/api/entries/:id`            | Manager edit (works even if locked) |
| DELETE | `/api/entries/:id`            | Manager delete                   |
| POST   | `/api/manager/entries`        | Manager creates an entry (any lock state) |
| GET    | `/api/public/:slug`           | Public read for creator page     |

# 🚀 Deploy to Vercel + Turso — Step-by-step

Total time: ~10 minutes. Both services have generous free tiers.

---

## Why this stack?

- **Vercel** — hosts the Next.js app (free tier, automatic deploys from GitHub).
- **Turso** — hosts the SQLite database in the cloud (free tier: 9 GB, 1B reads/month).

You need a hosted DB because Vercel's filesystem is read-only — local SQLite
files don't survive between requests.

---

## Step 1 — Create the Turso database

### 1a. Sign up
1. Go to **https://turso.tech**
2. Click **Sign up** → **Continue with GitHub**

### 1b. Create a database
1. In the Turso dashboard, click **Create Database**
2. **Name:** `creator-hours` (or anything you want)
3. **Group:** default (free)
4. **Location:** pick the closest region
5. Click **Create Database**

### 1c. Get your connection details
1. Click on the database you just created
2. Look for the **Database URL** — it starts with `libsql://...`. Copy it.
3. Click **Generate Token** (or “Create Token”)
   - **Expiration:** never (or 1 year)
   - **Permissions:** Full Access (Read & Write)
4. Copy the token — it's a long string starting with `eyJ...`. You won't see it again.

**Keep this tab open** — you'll paste these into Vercel in a minute.

---

## Step 2 — Deploy to Vercel

### 2a. Sign up
1. Go to **https://vercel.com/signup**
2. **Continue with GitHub** → authorize

### 2b. Import your repo
1. From the Vercel dashboard, click **Add New** → **Project**
2. Find **`Hakimxe/Hourly-sheet`** in the list → click **Import**
3. Framework should auto-detect as **Next.js** ✅
4. **DON'T deploy yet** — first add the env vars below ⬇️

### 2c. Add environment variables
On the same import screen, expand **Environment Variables** and add 4 entries:

| Name | Value |
|---|---|
| `TURSO_DATABASE_URL` | (paste the `libsql://...` URL from Turso) |
| `TURSO_AUTH_TOKEN` | (paste the long `eyJ...` token from Turso) |
| `AUTH_USERNAME` | `Hakim323` |
| `AUTH_PASSWORD` | `Gunkilwa8.@Maeve` |

### 2d. Deploy
Click **Deploy**. First build takes ~2 minutes.

---

## Step 3 — Verify it works

When the deploy finishes, Vercel shows your URL, e.g.
`https://hourly-sheet.vercel.app`

Test these URLs:

| URL | Expected |
|---|---|
| `https://YOUR-URL/api/health` | `ok` (or JSON status 200) |
| `https://YOUR-URL/manager` | Browser login prompt → use `Hakim323` / `Gunkilwa8.@Maeve` |
| `https://YOUR-URL/` | Your landing page / redirects to manager |

In `/manager`, create a creator → copy their `/c/<slug>` link → open in
an **incognito window** to confirm it's public (no login).

> 🔐 The `/manager` area requires login. Creator pages (`/c/<slug>`) and the
> creator submission API stay public.

---

## Step 4 (optional) — Custom domain

1. Vercel project → **Settings** → **Domains**
2. Add e.g. `hours.yourdomain.com`
3. Follow the DNS instructions Vercel gives you
4. Done in 5–30 minutes after DNS propagates

---

## How to update the app later

Just push to GitHub:

```bash
cd /Users/hakim/creator-hours-dashboard
git add -A
git commit -m "what you changed"
git push
```

Vercel auto-redeploys in ~2 minutes. Your database (on Turso) is untouched.

---

## How to change the manager password

1. Vercel → your project → **Settings** → **Environment Variables**
2. Edit `AUTH_PASSWORD` (or `AUTH_USERNAME`)
3. Click **Save**
4. Go to **Deployments** → click the latest one → **Redeploy** (no rebuild needed — pick "Use existing build cache")
5. New password is active in ~10 seconds

---

## 🆘 Troubleshooting

| Symptom | Fix |
|---|---|
| Build fails | Vercel → **Deployments** → failed one → check logs → paste error to your dev |
| `500 Internal Server Error` on every page | Almost always `TURSO_DATABASE_URL` or `TURSO_AUTH_TOKEN` is missing/wrong. Recheck Vercel env vars. |
| Login prompt won't accept your password | Wrong `AUTH_USERNAME` / `AUTH_PASSWORD` env var. Recheck spelling (case-sensitive). |
| `/manager` says "Authentication required" forever | Your browser cached old credentials — clear site data, or try incognito |
| Want to see what's in your database? | Turso dashboard → your DB → **Studio** tab. Has a web-based SQL editor. |

---

## 💰 Costs

- **Vercel** Hobby tier: free, unlimited deploys, ~100 GB bandwidth/month
- **Turso** free tier: 9 GB storage, 1B row reads/month, 25M row writes/month

For this app you will not come close to any free-tier limit.

---

## Local development

Want to test changes locally before pushing?

```bash
cd /Users/hakim/creator-hours-dashboard
npm install
npm run dev
```

Open http://localhost:3000.  Without env vars, the DB falls back to a
local file at `./data/app.db` (separate from your Turso prod DB — perfect
for testing).

If you want local dev to hit your Turso DB instead, create a `.env.local`:

```
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=eyJ...
AUTH_USERNAME=Hakim323
AUTH_PASSWORD=Gunkilwa8.@Maeve
```

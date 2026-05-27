# 🚀 Deploy to Railway — Step-by-step

Your project is **ready to deploy**. Total time: ~10 minutes.

---

## Step 1 — Push your code to GitHub

### 1a. Create a GitHub account (if you don't have one)
Go to https://github.com/signup and sign up — it's free.

### 1b. Create a new empty repo
1. Go to https://github.com/new
2. **Repository name**: `creator-hours-dashboard`
3. **Private** (recommended) or Public — your choice
4. ⚠️ Do **NOT** check "Add a README" / "Add .gitignore" — leave them all unchecked
5. Click **Create repository**

### 1c. Push your local code to GitHub
GitHub will show you commands on the next page. Copy your repo URL (looks like `https://github.com/YOUR_USERNAME/creator-hours-dashboard.git`), then in your terminal run:

```bash
cd /Users/hakim/creator-hours-dashboard

# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/creator-hours-dashboard.git

git branch -M main
git push -u origin main
```

If GitHub asks for a password, it actually wants a **Personal Access Token**:
1. Go to https://github.com/settings/tokens/new
2. Note: "Railway deploy"
3. Expiration: 90 days
4. Tick the **`repo`** scope
5. Click Generate, copy the token, paste it as the password

✅ Your code is now on GitHub.

---

## Step 2 — Sign up at Railway

1. Go to https://railway.app/
2. Click **Login** → **Login with GitHub**
3. Authorize Railway to access your GitHub account

You get **$5 of free credit/month** — more than enough for this app (it'll use ~$2-3).

---

## Step 3 — Deploy your project

1. From the Railway dashboard, click **New Project**
2. Pick **Deploy from GitHub repo**
3. Find and click **`creator-hours-dashboard`**
4. Railway will start building automatically

While it's building, do the next step ⬇️

---

## Step 4 — Add a Persistent Volume (⚠️ CRITICAL!)

This is what keeps your data alive between deploys. **Don't skip this.**

1. In your Railway project, click on your service (the box that says `creator-hours-dashboard`)
2. Go to the **Settings** tab
3. Scroll down to **Volumes** → click **+ New Volume**
4. **Mount path**: `/data`
5. **Size**: `1 GB` (free, plenty for thousands of entries)
6. Click **Add**

Railway will redeploy automatically.

---

## Step 5 — Set the environment variables

1. Still in your service, go to the **Variables** tab
2. Click **Raw Editor** (easiest)
3. Paste all 3 variables at once:

   ```
   DATA_DIR=/data
   AUTH_USERNAME=Hakim323
   AUTH_PASSWORD=Gunkilwa8.@Maeve
   ```

4. Click **Update Variables** / **Save**

Railway will redeploy once more.

> 🔐 **About the login:** The `/manager` area and all manager APIs are
> protected by HTTP Basic Auth. When you visit `https://yoururl/manager`,
> your browser will prompt you for the username and password. The creator
> submission pages (`/c/<slug>`) stay completely public — your creators
> never see a login prompt.
>
> **You can change `AUTH_USERNAME` and `AUTH_PASSWORD` anytime** from the
> Railway dashboard — no code change needed. After updating, Railway
> redeploys automatically (~30 seconds) and the new credentials take effect.
>
> 💡 If you ever forget your password, just go to Railway → Variables and
> reset it.

---

## Step 6 — Generate your public URL

1. Go to the **Settings** tab
2. Scroll to **Networking** → **Public Networking**
3. Click **Generate Domain**

You'll get a URL like: `https://creator-hours-dashboard-production.up.railway.app`

🎉 **Your app is live!**

- Manager dashboard: `https://YOUR-URL.up.railway.app/manager`
- Creator links: `https://YOUR-URL.up.railway.app/c/<slug>` (copy from manager)

---

## Step 7 (optional) — Custom domain

Want `hours.yourdomain.com` instead of the Railway URL?

1. **Settings** → **Networking** → **Custom Domain**
2. Type your domain (e.g., `hours.yourdomain.com`)
3. Railway gives you a `CNAME` record
4. Add that CNAME at your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
5. Wait 5-30 minutes for DNS to propagate

---

## How to update your app later

After making any code change locally:

```bash
cd /Users/hakim/creator-hours-dashboard
git add -A
git commit -m "what you changed"
git push
```

Railway watches your GitHub repo and **auto-redeploys** within ~2 minutes. Your database (on the volume) is preserved.

---

## 🆘 Troubleshooting

**"Deploy failed" during build**
→ Open the **Deployments** tab → click the failed deploy → check logs. Usually it's a typo. Tell me the error and I'll fix it.

**App loads but data resets after every deploy**
→ You forgot Step 4 (Volume) or Step 5 (DATA_DIR env var). Re-check both.

**"Page not found" on every URL**
→ Check **Logs** tab. Most common: the start command failed. Make sure `package.json` has `"start": "next start -p ${PORT:-3000}"` (already done).

**Want to see what's in your database?**
→ Railway dashboard → your service → **Data** tab can show files in the volume, but for SQLite you'd need a tool. Simpler: add an export/import button to the app later if you need it.

---

## 💰 Costs

- Free $5/month credit covers everything
- Estimated usage: **$2-3/month** for this app (always-on)
- If you exceed $5, you only pay the overage (~$2)
- You can add a $5 credit cap so you never get surprised

---

That's it! If anything fails, paste the error and I'll help you fix it.

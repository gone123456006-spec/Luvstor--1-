# 🔧 Fix Vercel 404 Error (When Refreshing Pages)

If you're seeing a **404 NOT_FOUND** error when refreshing pages like `/match` or `/chat` on Vercel, it means your Vercel project settings need to be corrected.

---

## ✅ Step-by-Step Fix

### 1. Go to Your Vercel Project Settings
1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **General**

### 2. Check Root Directory Setting
**This is the most common issue!**

- Scroll to **Root Directory**
- It should be set to: `frontend`
- If it's blank or set to `.` or `/`, **change it to `frontend`**
- Click **Save**

### 3. Check Build & Output Settings
Go to **Settings** → **Build & Development Settings**

Verify these settings:
- **Framework Preset**: `Vite` (should auto-detect)
- **Build Command**: `npm run build` (or leave as default)
- **Output Directory**: `dist` (or leave as default)
- **Install Command**: `npm install` (or leave as default)

### 4. Redeploy
After changing settings:
1. Go to **Deployments** tab
2. Click the **⋮** (three dots) on the latest deployment
3. Click **Redeploy**
4. Wait for the build to complete

---

## 🎯 Alternative: If Root Directory Doesn't Work

If you can't set the Root Directory or it still doesn't work, try this:

### Option A: Delete and Recreate Project
1. Delete the current Vercel project
2. Create a new project
3. **During setup**, click **Edit** next to Root Directory
4. Select `frontend` folder
5. Deploy

### Option B: Use Vercel CLI
```bash
cd frontend
vercel --prod
```

This deploys only the frontend folder directly.

---

## 🧪 How to Test
After redeploying:
1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Navigate to `/match` or `/chat`
3. **Refresh the page** (F5 or Ctrl+R)
4. It should **NOT** show 404 anymore

---

## ❓ Still Not Working?

Check these:
1. **Environment Variables**: Make sure `VITE_BACKEND_URL` is set in Vercel
2. **Build Logs**: Check if the build is actually using the `frontend` directory
3. **vercel.json**: Confirm `frontend/vercel.json` exists in your repo
4. **Clear Cache**: In Vercel settings, try "Clear Build Cache" and redeploy

---

## 📝 Why This Happens
Vercel needs to know:
1. Where your frontend code is (`frontend` folder)
2. Where the built files are (`frontend/dist`)
3. How to handle client-side routing (`vercel.json` with rewrites)

If the Root Directory is wrong, Vercel builds from the wrong location and can't find your files.

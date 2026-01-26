# 🚀 Deploying to Vercel

Vercel is an excellent choice for hosting your **frontend** (Vite/React). However, because your **backend** uses **Socket.io** (which requires a persistent connection), it is highly recommended to keep the backend on a provider like **Render** or **Railway**.

---

## ⚡ The Strategy
1.  **Backend**: Deploy to **Render** (following `RENDER_DEPLOYMENT.md`).
2.  **Frontend**: Deploy to **Vercel**.

---

## 🎨 Step 1: Deploy the Frontend to Vercel

1.  **Push your code** to GitHub/GitLab/Bitbucket.
2.  Go to the [Vercel Dashboard](https://vercel.com/dashboard).
3.  Click **New Project**.
4.  **Import** your repository.
5.  **Configure Project**:
    *   **Framework Preset**: Vite (automatically detected).
    *   **Root Directory**: `frontend` (⚠️ **IMPORTANT: Click "Edit" and select the `frontend` folder**).
    *   **Build Command**: `npm run build` (default).
    *   **Output Directory**: `dist` (default).
6.  **Environment Variables**:
    *   Add a variable named `VITE_BACKEND_URL`.
    *   Set the value to your **Render Backend URL** (e.g., `https://your-backend.onrender.com`).
7.  Click **Deploy**.

---

## 🛠️ Handling 404 Errors (SPA Routing)
I have added a `vercel.json` file in the `frontend` directory. This file is **crucial** because it tells Vercel to redirect all traffic to `index.html`, allowing React Router to handle the pages. Without this, refreshing the page or visiting a link like `/match` directly would show a **404 error**.

---

## 🔧 Step 2: Update Backend CORS
For the frontend to talk to the backend, you must allow your new Vercel URL in your backend's CORS settings.

1.  Go to your **Render Backend** settings.
2.  Update the `CLIENT_URL` environment variable to your new **Vercel URL** (e.g., `https://your-app.vercel.app`).
3.  Restart/Redeploy the backend.

---

## ⚠️ Why not deploy the Backend to Vercel?
Vercel uses **Serverless Functions**. These functions:
*   Timeout after a few seconds.
*   Do not support persistent WebSocket connections (Socket.io).
*   If you move the backend to Vercel, the real-time chat functionality will likely break.

**Best Practice**: Use Vercel for the UI (Frontend) and Render/Railway for the Logic (Backend).

# 🚀 Deploying to Render

The error you're seeing (`Cannot find module '/opt/render/project/src/index.js'`) happens because Render is trying to find an `index.js` file at the root of your project, but your backend code is actually inside the `backend/` folder.

To deploy this project correctly on Render, you should create **two separate services**: one for the backend and one for the frontend.

---

## 1. Backend Deployment (Web Service)

1.  **Create New Service**: On Render Dashboard, click **New +** → **Web Service**.
2.  **Connect Repo**: Select your GitHub repository.
3.  **Configure**:
    *   **Name**: `luvstor-backend` (or any name)
    *   **Environment**: `Node`
    *   **Root Directory**: `backend` (⚠️ **IMPORTANT**)
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
4.  **Environment Variables**: Click **Advanced** → **Add Environment Variable**:
    *   `MONGO_URI`: (Your MongoDB Atlas connection string)
    *   `JWT_SECRET`: (Your secret key)
    *   `CLIENT_URL`: `https://your-frontend-link.onrender.com`
    *   `NODE_ENV`: `production`
5.  **Deploy**: Click **Create Web Service**.

---

## 2. Frontend Deployment (Static Site)

1.  **Create New Service**: On Render Dashboard, click **New +** → **Static Site**.
2.  **Connect Repo**: Select the same GitHub repository.
3.  **Configure**:
    *   **Name**: `luvstor-frontend`
    *   **Root Directory**: `frontend` (⚠️ **IMPORTANT**)
    *   **Build Command**: `npm run build`
    *   **Publish Directory**: `dist`
4.  **Environment Variables**:
    *   `VITE_BACKEND_URL`: `https://your-backend-link.onrender.com` (Use the URL Render gave you for the backend service above)
5.  **Deploy**: Click **Create Static Site**.

---

## 💡 Why this fixes the error:
By setting the **Root Directory** to `backend` for the Web Service, Render will run commands inside that folder. It will find your `package.json` there and start `server.js` correctly instead of looking for a non-existent `index.js` at the root.

---

### Need a single-service approach?
If you'd rather deploy everything as one service (not recommended for this specific structure), you would need to change your **Start Command** to:
`node backend/server.js` (or `npm start` if you update the root package.json)
And your **Build Command** to:
`npm install && npm --prefix backend install && npm --prefix frontend install && npm --prefix frontend run build`

However, the **two-service approach** is much faster and more reliable!

# Random Chat Application

A real-time random chat application where users can connect with strangers and have conversations.

## Features

- Random user matching
- Real-time messaging with Socket.io
- Gender selection
- User authentication
- Responsive design

## Project Structure

```
random-chat-app/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   └── User.js
│   ├── socket/
│   │   └── socket.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Gender.jsx
│   │   │   ├── Match.jsx
│   │   │   └── Chat.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## Installation

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Running the Application

### Start Backend Server
```bash
cd backend
npm run dev
```

The backend server will run on `http://localhost:5000`

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Environment Variables

### Backend (.env)
- `PORT`: Server port (default: 5000)
- `MONGO_URI`: MongoDB connection string
- `FRONTEND_URL`: Frontend URL for CORS
- `NODE_ENV`: Environment (development/production)

## Technologies Used

### Backend
- Node.js
- Express.js
- Socket.io
- MongoDB
- Mongoose

### Frontend
- React
- React Router
- Socket.io Client
- Vite
- CSS3

## Features Implementation

1. **Home Page**: Landing page with introduction and start button
2. **Gender Selection**: Users select their gender before matching
3. **Match Finding**: Real-time matching with other users
4. **Chat Interface**: Real-time messaging with matched users

## License

MIT

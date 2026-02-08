import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Gender from './pages/Gender';
import Match from './pages/Match';
import Chat from './pages/Chat';
import Auth from './pages/Auth';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/gender" element={<Gender />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/match" element={<Match />} />
          <Route path="/chat" element={<Chat />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

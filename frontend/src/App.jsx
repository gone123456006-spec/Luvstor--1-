import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Gender from './pages/Gender';
import Match from './pages/Match';
import Chat from './pages/Chat';
import PromoLanding from './pages/PromoLanding';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AccountDeletion from './pages/AccountDeletion';
import DataSafety from './pages/DataSafety';
import ChildSafety from './pages/ChildSafety';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gender" element={<Gender />} />

        {/* Independent promotional landing — no auth / no chat flow */}
        <Route path="/promo" element={<PromoLanding />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/delete-account" element={<AccountDeletion />} />
        <Route path="/account-deletion" element={<AccountDeletion />} />
        <Route path="/data-safety" element={<DataSafety />} />
        <Route path="/child-safety" element={<ChildSafety />} />
        <Route path="/child-safety-standards" element={<ChildSafety />} />

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

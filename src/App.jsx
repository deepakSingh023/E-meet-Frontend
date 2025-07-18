// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from './components/Login';
import Register from './components/Register';
import Landing from './pages/landing';
import Dashboard from './components/Dashboard';
import Meeting from './components/meeting';

const App = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
        
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />

        <Route path="/meeting/:roomId" element={user ? <Meeting /> : <Navigate to="/login" />} />
        
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </Router>
  );
};

export default App;
